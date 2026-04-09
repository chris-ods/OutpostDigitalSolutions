"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { collection, getDocs, getDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useUserClaim } from "../../../lib/hooks/useUserClaim";
import { useAuthGuard } from "../../../lib/hooks/useAuthGuard";
import { UserProfile, isAdminLevel } from "../../../lib/types";
import { useTeamConfig } from "../../../lib/hooks/useTeamConfig";
import { useListUserPrefs } from "../../../lib/hooks/useListUserPrefs";
import { Spinner } from "../../../lib/components/Spinner";
// Team colors now sourced from teams collection
import { OdsList, buildDefaultPermissions } from "ods-ui-library";
import type { OdsRecord, OdsListSchema, PermissionsMatrix } from "ods-ui-library";
// Team colors now come from the teams collection
import { buildAgentColumns, AgentRow } from "./columns";
import AgentDetailPanel from "./AgentDetailPanel";
import SubCollectionModal from "./SubCollectionModal";

export default function AgentsPage() {
  const guard = useAuthGuard("any");
  const claim = useUserClaim();
  const { teams } = useTeamConfig();
  const { prefs: userPrefs, savePrefs: saveUserPrefs, views, saveView, deleteView } = useListUserPrefs(claim.uid, "agents");
  // Team colors now come from the teams collection directly

  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [schema, setSchema] = useState<OdsListSchema | undefined>();
  const [permissions, setPermissions] = useState<PermissionsMatrix | undefined>();
  const [editingRecord, setEditingRecord] = useState<OdsRecord | null>(null);

  const role = claim.profile?.role ?? "rep";
  const isAdmin = isAdminLevel(role);
  const isOwnerOrDev = role === "owner" || role === "developer";

  // ── Load data ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!guard.ready) return;
    Promise.all([
      getDocs(collection(db, "users")),
      getDoc(doc(db, "settings", "agentListSchema")),
      getDoc(doc(db, "settings", "agentListPermissions")),
    ]).then(([snap, schemaSnap, permsSnap]) => {
      const all: AgentRow[] = snap.docs.map(d => ({ uid: d.id, ...(d.data() as UserProfile) }));
      all.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
      setAgents(all);
      if (schemaSnap.exists()) setSchema(schemaSnap.data() as OdsListSchema);
      if (permsSnap.exists()) setPermissions(permsSnap.data() as PermissionsMatrix);
      setLoading(false);
    }).catch((err) => { console.error("[AgentsPage] load error:", err); setLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guard.ready]);

  // ── Columns ──────────────────────────────────────────────────────────────
  // Build team enum from ALL teams in the collection
  const teamEnumValues = useMemo(() =>
    teams.map(t => t.teamNumber != null ? String(t.teamNumber) : t.id),
    [teams]
  );
  const teamEnumLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    teams.forEach(t => { labels[t.teamNumber != null ? String(t.teamNumber) : t.id] = t.name; });
    return labels;
  }, [teams]);
  const columns = useMemo(() => buildAgentColumns(teams, teamEnumValues, teamEnumLabels), [teams, teamEnumValues, teamEnumLabels]);

  // ── Map to OdsRecord[] — spread ALL Firestore fields, no computed fields ──
  const data: OdsRecord[] = useMemo(() => agents.map(a => ({
    ...a,
    id: a.uid,
    displayLabel: `${a.firstName} ${a.lastName}`,
  })), [agents]);

  // ── GroupBy (driven by teams collection) ─────────────────────────────────
  const groupBy = useMemo(() => {
    const groups: { key: string; label: string; color: string }[] = teams.map(t => ({
      key: t.id,
      label: t.name.toUpperCase(),
      color: t.color,
    }));
    groups.push(
      { key: "unassigned", label: "UNASSIGNED", color: "#6b7280" },
      { key: "terminated", label: "TERMINATED", color: "#ef4444" },
    );
    // Build a role→team mapping from the teams collection
    const roleTeamMap: Record<string, string> = {};
    teams.filter(t => t.type === "leadership" && t.roles).forEach(t => {
      t.roles!.forEach(r => { roleTeamMap[r] = t.id; });
    });
    return {
      fn: (r: OdsRecord) => {
        if (r.active === false) return "terminated";
        const rl = String(r.role ?? "rep");
        // Leadership roles map to their team
        if (roleTeamMap[rl]) return roleTeamMap[rl];
        // Numbered teams
        const tn = Number(r.teamNumber ?? 0);
        const teamDoc = teams.find(t => t.type === "team" && t.teamNumber === tn);
        return teamDoc ? teamDoc.id : "unassigned";
      },
      groups,
    };
  }, [teams]);

  // ── Callbacks ────────────────────────────────────────────────────────────
  const handleSaveSchema = useCallback(async (s: OdsListSchema) => { await setDoc(doc(db, "settings", "agentListSchema"), s); setSchema(s); }, []);
  const handleSavePermissions = useCallback(async (m: PermissionsMatrix) => { await setDoc(doc(db, "settings", "agentListPermissions"), m); setPermissions(m); }, []);
  // ── CRUD callbacks ──────────────────────────────────────────────────────
  const handleSave = useCallback(async (id: string, field: string, value: string | number) => {
    // Convert types for Firestore
    let writeValue: string | number | boolean = value;
    if (field === "teamNumber") {
      // Check if a leadership team was selected (non-numeric ID)
      const leadershipTeam = teams.find(t => t.id === String(value) && t.type === "leadership");
      if (leadershipTeam && leadershipTeam.roles?.[0]) {
        // Set role to the leadership role and teamNumber to 0
        const newRole = leadershipTeam.roles![0] as AgentRow["role"];
        await updateDoc(doc(db, "users", id), { teamNumber: 0, role: newRole });
        setAgents(p => p.map(a => a.uid === id ? { ...a, teamNumber: 0, role: newRole } : a));
        return;
      }
      writeValue = Number(value) || 0;
    } else if (field === "level") {
      writeValue = Number(value) || 0;
    } else if (field === "active") {
      writeValue = String(value) === "true";
    }
    await updateDoc(doc(db, "users", id), { [field]: writeValue });
    setAgents(p => p.map(a => a.uid === id ? { ...a, [field]: writeValue } : a));
  }, []);

  const handleDeleteRecord = useCallback(async (id: string) => {
    await updateDoc(doc(db, "users", id), { active: false });
    setAgents(p => p.map(a => a.uid === id ? { ...a, active: false } : a));
  }, []);

  const handleDeleteField = useCallback(async (id: string, field: string) => {
    await updateDoc(doc(db, "users", id), { [field]: "" });
    setAgents(p => p.map(a => a.uid === id ? { ...a, [field]: "" } : a));
  }, []);

  const handleAddColumn = useCallback(async (key: string, defaultValue: string | number | boolean) => {
    // Write the new field with default value to every user document
    const batch = await import("firebase/firestore").then(m => m.writeBatch);
    const b = batch(db);
    agents.forEach(a => { b.update(doc(db, "users", a.uid), { [key]: defaultValue }); });
    await b.commit();
    // Update local state
    setAgents(p => p.map(a => ({ ...a, [key]: defaultValue })));
  }, [agents]);

  // ── Render ───────────────────────────────────────────────────────────────
  if (!guard.ready) return guard.node;
  if (loading) return <div className="flex-1 flex items-center justify-center bg-app-bg"><Spinner className="w-7 h-7" /></div>;

  return (
    <div className="flex flex-col h-full bg-app-bg p-5 overflow-y-auto gap-5">
      <OdsList
        columns={columns}
        data={data}
        loading={false}
        uid={claim.uid ?? ""}
        userName={claim.displayName}
        isAdmin={isAdmin}
        isManager={role === "manager"}
        currentRole={isOwnerOrDev ? (role === "developer" ? "dev" : "owner") : role as "rep" | "manager" | "admin"}
        permissions={permissions ?? buildDefaultPermissions(columns)}
        onSavePermissions={handleSavePermissions}
        onSave={handleSave}
        onDeleteRecord={handleDeleteRecord}
        onDeleteField={handleDeleteField}
        onEditRecord={(record) => setEditingRecord(record)}
        onAddColumn={handleAddColumn}
        listTitle="Agent Roster"
        initialSortField="name"
        initialSortDir="asc"
        displayMode="expandable"
        collapsedFields={["name", "email", "phone", "role", "teamNumber", "contractorId", "status"]}
        renderExpandedContent={(record) => <AgentDetailPanel record={record} isOwnerOrDev={isOwnerOrDev} />}
        groupBy={groupBy}
        schema={schema}
        onSaveSchema={handleSaveSchema}
        userPrefs={userPrefs}
        onSaveUserPrefs={saveUserPrefs}
        views={views}
        onSaveView={saveView}
        onDeleteView={deleteView}
      />

      {editingRecord && <SubCollectionModal record={editingRecord} onClose={() => setEditingRecord(null)} />}
    </div>
  );
}
