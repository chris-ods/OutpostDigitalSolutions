"use client";

import { useState, useEffect, useCallback } from "react";
import { collection, getDocs, getDoc, doc, setDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { useUserClaim } from "../../../../lib/hooks/useUserClaim";
import { useAuthGuard } from "../../../../lib/hooks/useAuthGuard";
import { useListUserPrefs } from "../../../../lib/hooks/useListUserPrefs";
import { UserProfile } from "../../../../lib/types";
import { Spinner } from "../../../../lib/components/Spinner";
import { OdsList, buildDefaultPermissions } from "ods-ui-library";
import type { OdsColDef, OdsRecord, PermissionsMatrix, OdsListSchema } from "ods-ui-library";

// ── Helpers ──────────────────────────────────────────────────────────────────

function licenseStatus(dateStr: string | undefined): "expired" | "warning" | "ok" {
  if (!dateStr) return "ok";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "ok";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const in30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  if (d < today) return "expired";
  if (d <= in30) return "warning";
  return "ok";
}

function fmtDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Column definitions ──────────────────────────────────────────────────────

const LICENSE_COLUMNS: OdsColDef[] = [
  { key: "agentName", label: "Agent", sortable: true, filterType: "text" },
  { key: "state", label: "State", sortable: true, filterType: "text" },
  { key: "stateCode", label: "Code", sortable: true, filterType: "enum" },
  {
    key: "individualLicense", label: "License #", sortable: true, filterType: "text",
    render: (val) => <span className="font-mono text-app-text font-semibold tracking-wide">{String(val || "\u2014")}</span>,
  },
  {
    key: "individualExpiry", label: "Expiry", sortable: true, filterType: "date",
    render: (val) => {
      const s = licenseStatus(val as string);
      const color = s === "expired" ? "text-red-400" : s === "warning" ? "text-amber-400" : "text-green-400";
      return <span className={color}>{fmtDate(val as string) || "\u2014"}</span>;
    },
  },
  { key: "agencyLicense", label: "Agency License", sortable: true, filterType: "text" },
  {
    key: "agencyExpiry", label: "Agency Expiry", sortable: true, filterType: "date",
    render: (val) => <span>{fmtDate(val as string) || "\u2014"}</span>,
  },
  {
    key: "npnPersonal", label: "NPN", sortable: true, filterType: "text",
    render: (val) => <span className="font-mono text-app-accent">{String(val || "\u2014")}</span>,
  },
  { key: "npnBusiness", label: "NPN Business", sortable: true, filterType: "text" },
  {
    key: "expiryStatus", label: "Status", sortable: true, filterType: "enum",
    enumValues: ["expired", "warning", "ok"],
    render: (val) => {
      const s = val as string;
      if (s === "expired") return <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-bold">Expired</span>;
      if (s === "warning") return <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">Expiring</span>;
      if (s === "ok") return <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/40 text-xs font-bold">Active</span>;
      return <span className="text-app-text-5">\u2014</span>;
    },
  },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function LicenseLookupPage() {
  const guard = useAuthGuard("any");
  const claim = useUserClaim();
  const { prefs: userPrefs, savePrefs: saveUserPrefs, views, saveView, deleteView } = useListUserPrefs(claim.uid, "licenses");

  const [data, setData] = useState<OdsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [schema, setSchema] = useState<OdsListSchema | undefined>();
  const [permissions, setPermissions] = useState<PermissionsMatrix | undefined>();

  const role = claim.profile?.role ?? "rep";
  const isAdmin = ["admin", "owner", "developer"].includes(role);
  const isOwnerOrDev = role === "owner" || role === "developer";
  const currentRole = isOwnerOrDev ? (role === "developer" ? "dev" as const : "owner" as const) : role as "rep" | "manager" | "admin";

  // ── Load data ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!guard.ready) return;
    (async () => {
      try {
        const usersSnap = await getDocs(collection(db, "users"));

        // Schema/permissions may be restricted to admins — silently fall back to defaults
        try {
          const [schemaSnap, permsSnap] = await Promise.all([
            getDoc(doc(db, "settings", "licenseLookupSchema")),
            getDoc(doc(db, "settings", "licenseLookupPermissions")),
          ]);
          if (schemaSnap.exists()) setSchema(schemaSnap.data() as OdsListSchema);
          if (permsSnap.exists()) setPermissions(permsSnap.data() as PermissionsMatrix);
        } catch { /* use defaults */ }

        // Build agent map
        const agentMap: Record<string, UserProfile & { uid: string }> = {};
        usersSnap.docs.forEach(d => { agentMap[d.id] = { uid: d.id, ...(d.data() as UserProfile) }; });

        // Load state licenses + NPN per user (no collectionGroup needed)
        const rows: OdsRecord[] = [];
        const teamNumber = claim.profile?.teamNumber;
        const uids = isAdmin
          ? Object.keys(agentMap)
          : role === "manager"
            ? Object.keys(agentMap).filter(id => agentMap[id].teamNumber === teamNumber)
            : (claim.uid ? [claim.uid] : []);

        await Promise.all(uids.map(async (uid) => {
          try {
            const licSnap = await getDocs(collection(db, "users", uid, "stateLicenses"));
            const agent = agentMap[uid];

            // NPN: try secrets (admin or own user only), fall back to user profile
            let npnPersonal = (agent as unknown as Record<string, string>)?.npnPersonal ?? "";
            let npnBusiness = "";
            if (isAdmin || uid === claim.uid) {
              try {
                const secretSnap = await getDoc(doc(db, "users", uid, "secrets", "identity"));
                if (secretSnap.exists()) {
                  const sd = secretSnap.data();
                  npnPersonal = sd?.npnPersonal ?? npnPersonal;
                  npnBusiness = sd?.npnBusiness ?? "";
                }
              } catch { /* secrets not accessible */ }
            }

            for (const d of licSnap.docs) {
              const ldata = d.data();
              rows.push({
                id: `${uid}_${d.id}`,
                displayLabel: agent?.firstName ?? "Unknown",
                uid,
                agentName: agent ? `${agent.firstName} ${agent.lastName}` : "Unknown",
                state: ldata.state ?? "",
                stateCode: ldata.stateCode ?? "",
                individualLicense: ldata.individualLicense ?? "",
                individualExpiry: ldata.individualExpiry ?? "",
                agencyLicense: ldata.agencyLicense ?? "",
                agencyExpiry: ldata.agencyExpiry ?? "",
                npnPersonal,
                npnBusiness,
                expiryStatus: licenseStatus(ldata.individualExpiry as string | undefined),
              });
            }
          } catch (e) {
            console.error(`[LicenseLookup] Failed to load for user ${uid}:`, e);
          }
        }));
        console.log("[LicenseLookup] Loaded", rows.length, "licenses from", uids.length, "users");

        setData(rows);
      } catch (err) {
        console.error("[LicenseLookup] load error:", err);
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guard.ready]);

  // ── Callbacks ────────────────────────────────────────────────────────────
  const handleSaveSchema = useCallback(async (s: OdsListSchema) => { await setDoc(doc(db, "settings", "licenseLookupSchema"), s); setSchema(s); }, []);
  const handleSavePermissions = useCallback(async (m: PermissionsMatrix) => { await setDoc(doc(db, "settings", "licenseLookupPermissions"), m); setPermissions(m); }, []);

  // ── Render ───────────────────────────────────────────────────────────────
  if (!guard.ready) return guard.node;
  if (loading) return <div className="flex-1 flex items-center justify-center bg-app-bg"><Spinner className="w-7 h-7" /></div>;

  return (
    <div className="flex flex-col h-full bg-app-bg p-5 overflow-y-auto gap-5">
      <OdsList
        columns={LICENSE_COLUMNS}
        data={data}
        loading={false}
        uid={claim.uid ?? ""}
        userName={claim.displayName}
        isAdmin={isAdmin}
        currentRole={currentRole}
        permissions={permissions ?? buildDefaultPermissions(LICENSE_COLUMNS)}
        onSavePermissions={handleSavePermissions}
        schema={schema}
        onSaveSchema={handleSaveSchema}
        userPrefs={userPrefs}
        onSaveUserPrefs={saveUserPrefs}
        views={views}
        onSaveView={saveView}
        onDeleteView={deleteView}
        listTitle="License Lookup"
        initialSortField="agentName"
        initialSortDir="asc"
      />
    </div>
  );
}
