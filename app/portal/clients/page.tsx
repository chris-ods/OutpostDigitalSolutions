"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  collection, query, where, getDocs, doc, updateDoc, getDoc,
  deleteDoc, setDoc, onSnapshot, serverTimestamp, arrayUnion,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { OdsList } from "ods-ui-library";
import type { OdsRecord, AppRole, PermissionsMatrix, OdsColDef, OdsListSchema } from "ods-ui-library";
import { buildDefaultPermissions } from "ods-ui-library";
import { isAdminLevel, UserProfile } from "../../../lib/types";
import { useTeamConfig } from "../../../lib/hooks/useTeamConfig";
import { getWeekStart } from "../../../lib/weekUtils";
import { useUserClaim } from "../../../lib/hooks/useUserClaim";
import { useListUserPrefs } from "../../../lib/hooks/useListUserPrefs";
import Link from "next/link";
import { ClientDetailPanel } from "./ClientDetailPanel";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toAppRole(role: string | undefined): AppRole {
  if (role === "developer") return "dev";
  return (role as AppRole) ?? "rep";
}

const HISTORICAL_CUTOFF = "2026-01-01";
const COLLECTION_ID = "clients";

const CARRIERS = [
  "Americo", "AMAM", "Aetna", "CICA", "Chubb", "Corebridge",
  "Ethos", "MOO", "Trans", "Instabrain", "Other",
];

const AGENT_STATUSES = ["Sent UW", "Approved", "Declined", "Cancelled", "Pending"];

const ADMIN_STATUSES = [
  "Pending Client Payment",
  "Client Paid|Comp Paid",
  "Client Paid|Waiting on Comp",
  "Comp Paid|Client Not Paid",
  "UW or Requirements",
  "Decline - Rewrite",
  "Lapsed",
  "CXL",
];

const CLIENT_COLUMNS: OdsColDef[] = [
{ key: "date",            label: "Date",           sortable: true,  editable: true, filterType: "date" },
  { key: "clientName",      label: "Client Name",    sortable: true,  editable: true, filterType: "text" },
  { key: "phone",           label: "Phone",          editable: true, filterType: "text" },
  { key: "email",           label: "Email",          editable: true, filterType: "text" },
  { key: "agentName",       label: "Agent",          sortable: true,  filterType: "text",   adminOnly: true },
  { key: "contractorId",    label: "Contractor ID",  sortable: true,  editable: true, filterType: "text",   adminOnly: true },
  { key: "agentTeamNumber", label: "Team",           sortable: true,  editable: true, filterType: "enum",   adminOnly: true },
  { key: "carrier",         label: "Carrier",        sortable: true,  editable: true, filterType: "enum",   enumValues: CARRIERS },
  { key: "appNumber",       label: "App #",          editable: true, filterType: "text" },
  { key: "annualPremium",   label: "Annual Premium", sortable: true,  editable: true, filterType: "number" },
  { key: "splitPercent",    label: "Split %",        sortable: true,  editable: true, filterType: "number" },
  { key: "state",           label: "State",          sortable: true,  editable: true, filterType: "enum" },
  { key: "startDate",       label: "Start Date",     sortable: true,  editable: true, filterType: "date" },
  { key: "agentStatus",     label: "Agent Status",   sortable: true,  editable: true, filterType: "enum",   enumValues: AGENT_STATUSES },
  { key: "adminStatus",     label: "Admin Status",   sortable: true,  editable: true, filterType: "enum",   enumValues: ADMIN_STATUSES },
  { key: "notes",           label: "Notes",          editable: true, filterType: "text", multiline: true },
  { key: "clientPaidDate",  label: "Client Paid",    sortable: true,  editable: true, filterType: "date" },
  { key: "compDate",        label: "Comp Date",      sortable: true,  editable: true, filterType: "date" },
  { key: "createdAt",       label: "Created",        sortable: true,  filterType: "date",   meta: true },
  { key: "createdByName",   label: "Created By",     sortable: true,  filterType: "enum",   meta: true },
  { key: "updatedAt",       label: "Updated",        sortable: true,  filterType: "date",   meta: true },
  { key: "updatedByName",   label: "Updated By",     sortable: true,  filterType: "enum",   meta: true },
];

const DEFAULT_VISIBLE_COLS = [
  "agentName", "date", "clientName", "phone", "email",
  "startDate", "state", "carrier", "appNumber", "annualPremium",
  "agentStatus", "adminStatus", "clientPaidDate", "compDate",
];


// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const claim = useUserClaim();
  const { uid, profile } = claim;
  const { prefs: userPrefs, savePrefs: saveUserPrefs, views, saveView, deleteView } = useListUserPrefs(uid, "clients");

  const [clients, setClients] = useState<OdsRecord[]>([]);
  const [agents, setAgents] = useState<{ uid: string; name: string; contractorId: string; teamNumber: number }[]>([]);
  const [permissions, setPermissions] = useState<PermissionsMatrix>(() => buildDefaultPermissions(CLIENT_COLUMNS));
  const [schema, setSchema] = useState<OdsListSchema | undefined>();
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<OdsRecord | null>(null);
  const [carrierFilter, setCarrierFilter] = useState<string | null>(null);
  const { phase } = useTeamConfig();

  // ── Load agents for reassignment dropdown ─────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    getDocs(collection(db, "users")).then(snap => {
      setAgents(snap.docs.map(d => {
        const u = d.data() as UserProfile;
        return {
          uid: d.id,
          name: `${u.firstName} ${u.lastName}`.trim(),
          contractorId: u.contractorId || "",
          teamNumber: u.teamNumber || 0,
        };
      }).filter(a => a.name).sort((a, b) => a.name.localeCompare(b.name)));
    }).catch(() => {});
  }, [uid]);

  // ── Build columns with dynamic agent enum ─────────────────────────────────
  const columns = useMemo(() => {
    const agentNames = agents.map(a => a.name);
    return CLIENT_COLUMNS.map(col => {
      if (col.key === "agentName" && agentNames.length > 0) {
        return { ...col, editable: true, filterType: "enum" as const, enumValues: agentNames };
      }
      return col;
    });
  }, [agents]);

  // ── Real-time data load (all clients, app-level visibility filtering) ─────
  useEffect(() => {
    if (!uid || !profile) return;

    // Load ALL clients — OdsList dataScope in schema handles per-role visibility
    const unsub = onSnapshot(collection(db, COLLECTION_ID), (snap) => {
      let all = snap.docs
        .filter((d) => !d.id.startsWith("_"))
        .map((d) => ({ id: d.id, ...d.data() } as OdsRecord));

      if (phase === "testing") {
        all = all.filter((c) => (c as any).createdBy !== "csv-import");
      }

      setClients(all);
      setLoading(false);
    }, (err) => {
      console.error("[ClientsPage] load error:", err);
      setLoading(false);
    });

    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, profile]);

  // ── Permissions load (real-time) ──────────────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, COLLECTION_ID, "_config"),
      (snap) => { if (snap.exists()) setPermissions(snap.data() as PermissionsMatrix); },
      () => { /* non-admin may not have access — use defaults */ },
    );
    return () => unsub();
  }, [uid]);

  // ── Schema load (real-time so dataScope changes propagate immediately) ──
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, "settings", "clientListSchema"),
      (snap) => { if (snap.exists()) setSchema(snap.data() as OdsListSchema); },
      () => { /* use defaults */ },
    );
    return () => unsub();
  }, [uid]);

  const onSaveSchema = useCallback(async (s: OdsListSchema) => {
    await setDoc(doc(db, "settings", "clientListSchema"), s);
    setSchema(s);
  }, []);

  // ── Save callback (includes changeLog for audit trail) ────────────────────
  const onSave = useCallback(async (
    id: string,
    field: string,
    value: string | number,
    updaterName: string,
    fromValue?: string | number,
  ) => {
    const changeEntry = {
      at: { seconds: Math.floor(Date.now() / 1000) },
      by: updaterName,
      field,
      from: String(fromValue ?? ""),
      to: String(value),
    };

    // ── Agent reassignment: when agentName changes, update all 4 agent fields ──
    if (field === "agentName") {
      const selectedAgent = agents.find(a => a.name === String(value));
      if (selectedAgent) {
        await updateDoc(doc(db, COLLECTION_ID, id), {
          agentId: selectedAgent.uid,
          agentName: selectedAgent.name,
          contractorId: selectedAgent.contractorId,
          agentTeamNumber: selectedAgent.teamNumber,
          updatedAt: serverTimestamp(),
          updatedByName: updaterName,
          changeLog: arrayUnion(changeEntry),
        });
        // Update local state with all 4 fields
        setClients(prev => prev.map(c => c.id === id ? {
          ...c,
          agentId: selectedAgent.uid,
          agentName: selectedAgent.name,
          contractorId: selectedAgent.contractorId,
          agentTeamNumber: selectedAgent.teamNumber,
        } : c));
        return;
      }
    }

    await updateDoc(doc(db, COLLECTION_ID, id), {
      [field]: value,
      updatedAt: serverTimestamp(),
      updatedByName: updaterName,
      changeLog: arrayUnion(changeEntry),
    });

    // Auto-clawback on policy cancellation (agentStatus or adminStatus)
    const CANCEL_ADMIN_STATUSES = ["Decline - Rewrite", "Lapsed", "CXL"];
    const isAgentCancel = field === "agentStatus" && String(value) === "Cancelled" && String(fromValue) !== "Cancelled";
    const isAdminCancel = field === "adminStatus" && CANCEL_ADMIN_STATUSES.includes(String(value)) && !CANCEL_ADMIN_STATUSES.includes(String(fromValue ?? ""));

    if (isAgentCancel || isAdminCancel) {
      try {
        const clientDoc = clients.find(c => c.id === id);
        if (clientDoc) {
          const alp = Number(clientDoc.annualPremium ?? 0);
          const agentUid = String(clientDoc.agentId ?? "");
          const clientName = String(clientDoc.clientName ?? clientDoc.displayLabel ?? "Unknown");
          const appNum = String(clientDoc.appNumber ?? "");
          const teamNum = Number(clientDoc.agentTeamNumber ?? 0);
          const statusLabel = isAdminCancel ? String(value) : "cancelled";
          const note = `Clawback: ${clientName} - ${appNum} ${statusLabel}`;

          // Calculate app bonus clawback (T1=$50, one app deduction)
          const appBonusClawback = -50;

          // Write rep adjustment
          const weekStart = getWeekStart(new Date());
          if (agentUid && !agentUid.startsWith("pending:")) {
            const entryRef = doc(db, "payroll", weekStart, "entries", agentUid);
            const entrySnap = await getDoc(entryRef);
            const existing = entrySnap.exists() ? entrySnap.data() : {};
            const prevAdj = Number(existing.adjustment ?? 0);
            const prevNotes = String(existing.adjustmentNotes ?? "");
            await setDoc(entryRef, {
              ...existing,
              adjustment: prevAdj + appBonusClawback,
              adjustmentNotes: prevNotes ? `${prevNotes}; ${note}` : note,
            }, { merge: true });
          }

          // Write TC adjustment (3.5% of ALP)
          if (teamNum > 0) {
            const usersSnap = await getDocs(query(collection(db, "users"), where("teamNumber", "==", teamNum), where("role", "==", "manager")));
            for (const tcDoc of usersSnap.docs) {
              const tcUid = tcDoc.id;
              const tcAdj = -(alp * 0.035);
              const tcEntryRef = doc(db, "payroll", weekStart, "entries", tcUid);
              const tcEntrySnap = await getDoc(tcEntryRef);
              const tcExisting = tcEntrySnap.exists() ? tcEntrySnap.data() : {};
              const tcPrevAdj = Number(tcExisting.adjustment ?? 0);
              const tcPrevNotes = String(tcExisting.adjustmentNotes ?? "");
              await setDoc(tcEntryRef, {
                ...tcExisting,
                adjustment: tcPrevAdj + tcAdj,
                adjustmentNotes: tcPrevNotes ? `${tcPrevNotes}; TC ${note}` : `TC ${note}`,
              }, { merge: true });
            }
          }

        }
      } catch (err) {
        console.error("[Clients] Auto-clawback failed:", err);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, agents]);

  const onSavePermissions = useCallback(async (matrix: PermissionsMatrix) => {
    await setDoc(doc(db, COLLECTION_ID, "_config"), matrix, { merge: true });
    setPermissions(matrix);
  }, []);

  // ── Soft delete (move to deletedClients collection) ─────────────────────
  const onDeleteRecord = useCallback(async (id: string) => {
    const clientDoc = clients.find(c => c.id === id);
    if (!clientDoc) return;

    // Copy the full record to deletedClients with metadata
    const { id: _id, ...data } = clientDoc;
    await setDoc(doc(db, "deletedClients", id), {
      ...data,
      _deletedAt: serverTimestamp(),
      _deletedBy: uid,
      _deletedByName: claim.displayName,
      _originalId: id,
    });

    // Remove from clients collection
    await deleteDoc(doc(db, COLLECTION_ID, id));
  }, [clients, uid, claim.displayName]);

  // ── Detect duplicate app numbers ─────────────────────────────────────────
  const duplicateAppNumbers = useMemo(() => {
    const counts: Record<string, string[]> = {};
    for (const c of clients) {
      const an = (c.appNumber as string)?.trim().toUpperCase();
      if (!an) continue;
      if (!counts[an]) counts[an] = [];
      counts[an].push(c.clientName as string ?? "Unknown");
    }
    return Object.entries(counts)
      .filter(([, names]) => names.length > 1)
      .map(([appNum, names]) => ({ appNum, names, count: names.length }));
  }, [clients]);

  return (
    <div className="flex flex-col h-full bg-app-bg p-5 overflow-y-auto gap-5">
      {/* Duplicate app number warning banner */}
      {duplicateAppNumbers.length > 0 && (
        <div className="mx-8 mt-6 px-4 py-3 bg-red-950/70 border border-red-800/60 rounded-xl">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <p className="text-red-300 text-sm font-semibold">Duplicate Policy Numbers Detected</p>
              <div className="mt-1.5 space-y-1">
                {duplicateAppNumbers.map(({ appNum, names, count }) => (
                  <p key={appNum} className="text-red-400/80 text-xs">
                    <span className="font-mono font-semibold text-red-300">{appNum}</span>
                    <span className="text-red-500 mx-1.5">—</span>
                    {count} records: {names.join(", ")}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Portal-specific actions above the table */}
      <div className="flex justify-end gap-3 px-8 pt-6">
        {isAdminLevel(profile?.role) && phase !== "live" && (
          <Link
            href="/portal/clients/import"
            className="flex items-center gap-2 px-4 py-2 bg-app-surface-2 hover:bg-app-surface-2 text-app-text-2 text-sm font-medium rounded-lg border border-app-border-2 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Import CSV
          </Link>
        )}
        <Link
          href="/portal/clients/new"
          className="flex items-center gap-2 px-4 py-2 bg-app-accent hover:bg-app-accent-hover text-white text-sm font-semibold rounded-lg transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Client
        </Link>
      </div>

      {/* Carrier filter */}
      <div className="flex items-center gap-0 bg-app-surface-2 border border-app-border-2 rounded-lg p-0.5 w-fit mb-2 flex-wrap">
        <button
          onClick={() => setCarrierFilter(null)}
          className={`px-3 py-1 rounded-md text-xs font-semibold transition ${carrierFilter === null ? "bg-app-accent text-white shadow-sm" : "text-app-text-3 hover:text-app-text"}`}
        >All</button>
        {CARRIERS.map(c => (
          <button
            key={c}
            onClick={() => setCarrierFilter(carrierFilter === c ? null : c)}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition ${carrierFilter === c ? "bg-app-accent text-white shadow-sm" : "text-app-text-3 hover:text-app-text"}`}
          >{c}</button>
        ))}
      </div>

      <OdsList
          columns={columns}
          defaultVisibleCols={DEFAULT_VISIBLE_COLS}
          showActions
          data={carrierFilter ? clients.filter(c => c.carrier === carrierFilter) : clients}
          views={views}
          permissions={permissions}
          loading={loading}
          uid={uid}
          userName={claim.displayName}
          currentRole={toAppRole(profile?.role)}
          isAdmin={claim.isAdmin}
          isManager={claim.isManager}
          userTeamNumber={profile?.teamNumber}
          phase={phase}
          historicalCutoff={HISTORICAL_CUTOFF}
          onSave={onSave}
          onDeleteRecord={onDeleteRecord}
          onSaveView={saveView}
          onDeleteView={deleteView}
          onSavePermissions={onSavePermissions}
          schema={{
            ...schema,
            dataScope: {
              ownerField: "agentId",
              teamField: "agentTeamNumber",
              rep: "own",
              manager: "team",
              admin: "all",
              ...schema?.dataScope,
            },
          }}
          onSaveSchema={onSaveSchema}
          onRowClick={setSelectedClient}
          userPrefs={userPrefs}
          onSaveUserPrefs={saveUserPrefs}
          listTitle="Clients"
          initialSortField="date"
          initialSortDir="desc"
        />

      <ClientDetailPanel
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
      />
    </div>
  );
}
