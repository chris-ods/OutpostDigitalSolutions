"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { collection, getDocs, onSnapshot, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { Client, UserWithId, isAdminLevel } from "../../../lib/types";
import { useUserClaim } from "../../../lib/hooks/useUserClaim";
import { getWeekStart } from "../../../lib/weekUtils";
import { fmtDollars as fmt$ } from "../../../lib/formatters";
import { useTeamConfig } from "../../../lib/hooks/useTeamConfig";
import { useListUserPrefs } from "../../../lib/hooks/useListUserPrefs";
import { Spinner } from "../../../lib/components/Spinner";
import Link from "next/link";
import { OdsStatCard, OdsList, buildDefaultPermissions } from "ods-ui-library";
import type { OdsRecord, OdsColDef, OdsListSchema, PermissionsMatrix } from "ods-ui-library";

// ─── Date constants ──────────────────────────────────────────────────────────

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function computeDateConstants() {
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  const y  = now.getFullYear();
  const mo = now.getMonth();
  const pad = (n: number) => String(n).padStart(2, "0");
  const thisMonthStart = `${y}-${pad(mo + 1)}-01`;
  const prevMonthStart = mo === 0 ? `${y - 1}-12-01` : `${y}-${pad(mo)}-01`;
  const thisYearStart  = `${y}-01-01`;
  const thisWeek = getWeekStart(now);
  const prevWeek = (() => {
    const d = new Date(thisWeek + "T12:00:00");
    d.setDate(d.getDate() - 7);
    return localDateStr(d);
  })();
  const weekDayDates: string[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(thisWeek + "T12:00:00");
    d.setDate(d.getDate() + i);
    return localDateStr(d);
  });
  const today = `${y}-${pad(mo + 1)}-${pad(now.getDate())}`;
  return { now, today, thisWeek, prevWeek, thisMonthStart, prevMonthStart, thisYearStart, weekDayDates };
}

const {
  today: TODAY, thisWeek: THIS_WEEK, prevWeek: PREV_WEEK,
  thisMonthStart: THIS_MONTH_START, prevMonthStart: PREV_MONTH_START,
  thisYearStart: THIS_YEAR_START, weekDayDates: WEEK_DAY_DATES,
} = computeDateConstants();

// ─── Date filter ─────────────────────────────────────────────────────────────

type DateFilter = "daily"|"wtd"|"mtd"|"ytd"|"mon"|"tue"|"wed"|"thu"|"fri"|"sat"|"sun";

const DATE_FILTERS: { key: DateFilter; label: string }[] = [
  { key: "daily", label: "Daily" }, { key: "wtd", label: "WTD" },
  { key: "mtd", label: "MTD" }, { key: "ytd", label: "YTD" },
];
const DAY_FILTERS: { key: DateFilter; label: string }[] = [
  { key: "mon", label: "Mon" }, { key: "tue", label: "Tue" }, { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" }, { key: "fri", label: "Fri" }, { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

function applyDateFilter(clients: Client[], filter: DateFilter): Client[] {
  switch (filter) {
    case "daily": return clients.filter(c => c.date === TODAY);
    case "wtd":   return clients.filter(c => c.date >= THIS_WEEK && c.date <= TODAY);
    case "mtd":   return clients.filter(c => c.date >= THIS_MONTH_START && c.date <= TODAY);
    case "ytd":   return clients.filter(c => c.date >= THIS_YEAR_START && c.date <= TODAY);
    case "mon":   return clients.filter(c => c.date === WEEK_DAY_DATES[0]);
    case "tue":   return clients.filter(c => c.date === WEEK_DAY_DATES[1]);
    case "wed":   return clients.filter(c => c.date === WEEK_DAY_DATES[2]);
    case "thu":   return clients.filter(c => c.date === WEEK_DAY_DATES[3]);
    case "fri":   return clients.filter(c => c.date === WEEK_DAY_DATES[4]);
    case "sat":   return clients.filter(c => c.date === WEEK_DAY_DATES[5]);
    case "sun":   return clients.filter(c => c.date === WEEK_DAY_DATES[6]);
  }
}

// ─── Stat computation ────────────────────────────────────────────────────────

interface RepStats {
  uid: string; name: string; firstName: string;
  contractorId: string; teamNumber: number;
  weekApps: number;      weekALP: number;
  prevWeekApps: number;  prevWeekALP: number;
  monthApps: number;     monthALP: number;
  prevMonthApps: number; prevMonthALP: number;
  allApps: number;       allALP: number;
}

function buildRepStats(clients: Client[], users: UserWithId[]): RepStats[] {
  const map = new Map<string, RepStats>();
  for (const u of users) {
    map.set(u.uid, {
      uid: u.uid, name: `${u.firstName} ${u.lastName}`,
      firstName: u.firstName, contractorId: u.contractorId,
      teamNumber: u.teamNumber,
      weekApps: 0, weekALP: 0, prevWeekApps: 0, prevWeekALP: 0,
      monthApps: 0, monthALP: 0, prevMonthApps: 0, prevMonthALP: 0,
      allApps: 0, allALP: 0,
    });
  }
  for (const c of clients) {
    const s = map.get(c.agentId);
    if (!s) continue;
    const alp = c.annualPremium || 0;
    s.allApps++; s.allALP += alp;
    if (c.date >= THIS_WEEK && c.date <= WEEK_DAY_DATES[6]) { s.weekApps++; s.weekALP += alp; }
    if (c.date >= PREV_WEEK && c.date < THIS_WEEK) { s.prevWeekApps++; s.prevWeekALP += alp; }
    if (c.date >= THIS_MONTH_START) { s.monthApps++; s.monthALP += alp; }
    if (c.date >= PREV_MONTH_START && c.date < THIS_MONTH_START) { s.prevMonthApps++; s.prevMonthALP += alp; }
  }
  return Array.from(map.values());
}

function trendDir(cur: number, prev: number): "up" | "down" | "neutral" {
  return cur > prev ? "up" : cur < prev ? "down" : "neutral";
}

function pctChange(cur: number, prev: number): string {
  if (prev === 0) return "—";
  return `${Math.round(((cur - prev) / prev) * 100)}%`;
}


// ─── Rep table columns ──────────────────────────────────────────────────────

const REP_COLUMNS: OdsColDef[] = [
  {
    key: "name", label: "Rep", sortable: true, filterType: "text",
    render: (val, rec) => {
      const initials = String(val).split(" ").map(w => w[0] ?? "").join("").slice(0, 2).toUpperCase();
      return (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            width: "2rem", height: "2rem", borderRadius: "50%",
            background: "var(--app-surface-2)", border: "1px solid var(--app-border-2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.6875rem", fontWeight: 700, color: "var(--app-text-2)", flexShrink: 0,
          }}>{initials}</div>
          <div>
            <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 600, color: "var(--app-text)" }}>{String(val)}</p>
            {rec.contractorId && (
              <span style={{ fontSize: "0.6875rem", color: "var(--app-text-5)", fontFamily: "monospace" }}>#{String(rec.contractorId)}</span>
            )}
          </div>
        </div>
      );
    },
  },
  { key: "teamNumber", label: "Team", sortable: true, filterType: "enum" },
  {
    key: "weekALP", label: "Week ALP", sortable: true, filterType: "number",
    render: (val, rec) => {
      const cur = Number(val) || 0;
      const prev = Number(rec.prevWeekALP) || 0;
      const dir = trendDir(cur, prev);
      const color = dir === "up" ? "#22c55e" : dir === "down" ? "#ef4444" : "var(--app-text-4)";
      return (
        <div>
          <span style={{ fontWeight: 600, color: "var(--app-text)" }}>{fmt$(cur)}</span>
          {prev > 0 && <span style={{ fontSize: "0.6875rem", color, marginLeft: "0.5rem" }}>{pctChange(cur, prev)}</span>}
        </div>
      );
    },
  },
  { key: "weekApps", label: "Week Apps", sortable: true, filterType: "number" },
  {
    key: "monthALP", label: "Month ALP", sortable: true, filterType: "number",
    render: (val) => <span style={{ fontWeight: 600, color: "var(--app-text)" }}>{fmt$(Number(val) || 0)}</span>,
  },
  { key: "monthApps", label: "Month Apps", sortable: true, filterType: "number" },
  {
    key: "allALP", label: "All-Time", sortable: true, filterType: "number",
    render: (val) => <span style={{ fontWeight: 600, color: "var(--app-text)" }}>{fmt$(Number(val) || 0)}</span>,
  },
  { key: "allApps", label: "Total Apps", sortable: true, filterType: "number" },
];

// ─── Filter pill component ──────────────────────────────────────────────────

function FilterPills({ value, onChange }: { value: DateFilter; onChange: (f: DateFilter) => void }) {
  const pillClass = (active: boolean) =>
    `px-3 py-1 rounded-full text-xs font-medium border transition whitespace-nowrap cursor-pointer ${
      active
        ? "bg-app-accent border-app-accent text-white"
        : "bg-app-surface-2 border-app-border-2 text-app-text-3 hover:text-app-text hover:border-app-border-2"
    }`;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {DATE_FILTERS.map(f => (
        <button key={f.key} type="button" onClick={() => onChange(f.key)} className={pillClass(value === f.key)}>
          {f.label}
        </button>
      ))}
      <div className="w-px h-4 bg-app-border-2 mx-0.5" />
      {DAY_FILTERS.map(f => (
        <button key={f.key} type="button" onClick={() => onChange(f.key)} className={pillClass(value === f.key)}>
          {f.label}
        </button>
      ))}
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────

export default function DashboardPage() {
  const claim = useUserClaim();
  const { uid, profile } = claim;
  const { teamNames, phase } = useTeamConfig();
  const { prefs: repTableUserPrefs, savePrefs: saveRepTableUserPrefs, views: repTableViews, saveView: saveRepTableView, deleteView: deleteRepTableView } = useListUserPrefs(uid, "dashboard-reps");

  const [myClients, setMyClients]             = useState<Client[]>([]);
  const [allClients, setAllClients]           = useState<Client[]>([]);
  const [incomingSplitClients, setIncomingSplitClients] = useState<Client[]>([]);
  const [teamUsers, setTeamUsers]             = useState<UserWithId[]>([]);
  const [allUsers, setAllUsers]               = useState<UserWithId[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [dateFilter, setDateFilter]           = useState<DateFilter>("wtd");

  // Schema & permissions for the rep table
  const [repListSchema, setRepListSchema] = useState<OdsListSchema | undefined>();
  const [repListPerms, setRepListPerms]   = useState<PermissionsMatrix | undefined>();

  const role = profile?.role ?? "rep";
  const isAdmin = isAdminLevel(role);
  const isManager = role === "manager";
  const currentRole = role === "developer" ? "dev" as const : role === "owner" ? "owner" as const : role as "rep" | "manager" | "admin";
  const teamNumber = profile?.teamNumber ?? 0;

  // ── Load schemas ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    Promise.all([
      getDoc(doc(db, "settings", "dashboardRepListSchema")),
      getDoc(doc(db, "settings", "dashboardRepListPermissions")),
    ]).then(([s, p]) => {
      if (s.exists()) setRepListSchema(s.data() as OdsListSchema);
      if (p.exists()) setRepListPerms(p.data() as PermissionsMatrix);
    }).catch(() => { /* use defaults */ });
  }, [uid]);

  const saveRepListSchema = useCallback(async (s: OdsListSchema) => { await setDoc(doc(db, "settings", "dashboardRepListSchema"), s); setRepListSchema(s); }, []);
  const saveRepListPerms = useCallback(async (p: PermissionsMatrix) => { await setDoc(doc(db, "settings", "dashboardRepListPermissions"), p); setRepListPerms(p); }, []);

  // ── Live data (load all, filter app-side by role) ────────────────────────
  useEffect(() => {
    if (!uid || !profile) return;
    const cleanups: (() => void)[] = [];

    // Load all users (needed for rep stats and team grouping)
    getDocs(collection(db, "users")).then(snap => {
      const users = snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserWithId));
      setAllUsers(users);
      setTeamUsers(users.filter(u => u.teamNumber === teamNumber));
    }).catch(console.error);

    // Real-time clients — load ALL, filter by role in computed metrics
    const unsub = onSnapshot(collection(db, "clients"), snap => {
      let all = snap.docs
        .filter(d => !d.id.startsWith("_"))
        .map(d => ({ id: d.id, ...d.data() } as Client));

      if (phase === "testing") {
        all = all.filter(c => c.createdBy !== "csv-import");
      }

      // App-level role scoping
      if (isAdmin) {
        setAllClients(all);
      } else if (isManager) {
        setAllClients(all.filter(c => c.agentTeamNumber === teamNumber));
        setIncomingSplitClients(all.filter(c =>
          c.agentTeamNumber !== teamNumber && c.portal === uid && !!c.splitPercent
        ));
      } else {
        setMyClients(all.filter(c => c.agentId === uid));
      }

      setLoading(false);
    }, err => { console.error(err); setLoading(false); });
    cleanups.push(unsub);

    return () => cleanups.forEach(fn => fn());
  }, [uid, profile?.role, profile?.teamNumber, phase, isAdmin, isManager, teamNumber]);

  // ── Computed metrics ──────────────────────────────────────────────────────

  const scopeClients = useMemo(() => {
    if (isAdmin || isManager) return allClients.filter(c => !String(c.agentId ?? "").startsWith("pending:"));
    return myClients;
  }, [isAdmin, isManager, allClients, myClients]);

  // Scope-aware week stats (admin=company, manager=team via separate calc, rep=own)
  const weekALP = useMemo(() => scopeClients.filter(c => c.date >= THIS_WEEK && c.date <= WEEK_DAY_DATES[6]).reduce((s, c) => s + (c.annualPremium || 0), 0), [scopeClients]);
  const prevWeekALP = useMemo(() => scopeClients.filter(c => c.date >= PREV_WEEK && c.date < THIS_WEEK).reduce((s, c) => s + (c.annualPremium || 0), 0), [scopeClients]);
  const weekApps = useMemo(() => scopeClients.filter(c => c.date >= THIS_WEEK && c.date <= WEEK_DAY_DATES[6]).length, [scopeClients]);
  const weekApproved = useMemo(() => scopeClients.filter(c => c.date >= THIS_WEEK && c.date <= WEEK_DAY_DATES[6] && c.agentStatus === "Approved").length, [scopeClients]);

  // Team stats (manager)
  const teamWeekClients = useMemo(() => scopeClients.filter(c => c.date >= THIS_WEEK && c.date <= WEEK_DAY_DATES[6]), [scopeClients]);
  const teamWeekALP = useMemo(() =>
    teamWeekClients.reduce((s, c) => s + (c.annualPremium || 0) * (c.splitPercent ? 0.5 : 1), 0) +
    incomingSplitClients.filter(c => c.date >= THIS_WEEK && c.date <= WEEK_DAY_DATES[6]).reduce((s, c) => s + (c.annualPremium || 0) * 0.5, 0),
  [teamWeekClients, incomingSplitClients]);
  const prevTeamWeekALP = useMemo(() =>
    scopeClients.filter(c => c.date >= PREV_WEEK && c.date < THIS_WEEK).reduce((s, c) => s + (c.annualPremium || 0) * (c.splitPercent ? 0.5 : 1), 0) +
    incomingSplitClients.filter(c => c.date >= PREV_WEEK && c.date < THIS_WEEK).reduce((s, c) => s + (c.annualPremium || 0) * 0.5, 0),
  [scopeClients, incomingSplitClients]);

  // Admin filtered stats
  const windowClients = useMemo(() => applyDateFilter(scopeClients, dateFilter), [scopeClients, dateFilter]);
  const windowALP = useMemo(() => windowClients.reduce((s, c) => s + (c.annualPremium || 0), 0), [windowClients]);
  const monthALP = useMemo(() => scopeClients.filter(c => c.date >= THIS_MONTH_START).reduce((s, c) => s + (c.annualPremium || 0), 0), [scopeClients]);
  const prevMonthALP = useMemo(() => scopeClients.filter(c => c.date >= PREV_MONTH_START && c.date < THIS_MONTH_START).reduce((s, c) => s + (c.annualPremium || 0), 0), [scopeClients]);
  const totalALP = useMemo(() => scopeClients.reduce((s, c) => s + (c.annualPremium || 0), 0), [scopeClients]);

  // Active reps
  const activeReps = useMemo(() => {
    const users = isAdmin ? allUsers : teamUsers;
    return users.filter(u => u.active !== false && u.role === "rep");
  }, [isAdmin, allUsers, teamUsers]);

  const repStats = useMemo(() => buildRepStats(scopeClients, activeReps), [scopeClients, activeReps]);
  const repRecords: OdsRecord[] = useMemo(() => repStats.map(s => ({
    id: s.uid, displayLabel: s.name, name: s.name,
    contractorId: s.contractorId, teamNumber: s.teamNumber,
    weekALP: s.weekALP, weekApps: s.weekApps, prevWeekALP: s.prevWeekALP,
    monthALP: s.monthALP, monthApps: s.monthApps, prevMonthALP: s.prevMonthALP,
    allALP: s.allALP, allApps: s.allApps,
  })), [repStats]);

  // Week clients indexed by agentId for expanded content
  const weekClientsByRep = useMemo(() => {
    const m: Record<string, Client[]> = {};
    scopeClients
      .filter(c => c.date >= THIS_WEEK && c.date <= WEEK_DAY_DATES[6])
      .forEach(c => { (m[c.agentId] ??= []).push(c); });
    // Sort each rep's clients by date descending
    Object.values(m).forEach(arr => arr.sort((a, b) => (b.date > a.date ? 1 : -1)));
    return m;
  }, [scopeClients]);

  // Recent apps (rep only)
  const recentApps = useMemo(() => [...scopeClients].sort((a, b) => (b.date > a.date ? 1 : -1)).slice(0, 10), [scopeClients]);

  const STATUS_COLORS: Record<string, string> = {
    Approved: "bg-green-900/50 text-green-400",
    Declined: "bg-red-900/50 text-red-400",
    Pending: "bg-yellow-900/50 text-yellow-400",
    "Sent UW": "bg-app-accent/20 text-app-accent",
    Cancelled: "bg-app-surface-2 text-app-text-3",
  };

  // Date filter label
  const filterLabel = DATE_FILTERS.find(f => f.key === dateFilter)?.label
    ?? DAY_FILTERS.find(f => f.key === dateFilter)?.label
    ?? dateFilter;

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-full bg-app-bg overflow-y-auto flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="bg-app-bg min-h-full p-8 overflow-y-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-app-text">
          {isAdmin ? "Dashboard" : `Hey, ${profile.firstName}`}
        </h1>
        <p className="text-app-text-3 text-sm mt-1">
          {isAdmin
            ? "Company-wide overview"
            : isManager
              ? `${teamNames[String(teamNumber)] || `Team ${teamNumber}`} · Manager view`
              : `${teamNames[String(teamNumber)] || `Team ${teamNumber}`} · #${profile.contractorId || "—"}`
          }
        </p>
      </div>

      {/* Date filter pills */}
      <div className="mb-6">
        <FilterPills value={dateFilter} onChange={setDateFilter} />
      </div>

      {/* ── Rep Stats (rep only) ── */}
      {!isAdmin && !isManager && (
        <>
          <p className="text-xs font-semibold text-app-text-4 uppercase tracking-wider mb-3">My Production</p>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <OdsStatCard
              label="Week ALP"
              value={fmt$(weekALP)}
              accent="#1e3a5f"
              trend={trendDir(weekALP, prevWeekALP)}
              trendValue={prevWeekALP > 0 ? `${pctChange(weekALP, prevWeekALP)} vs last week` : `${weekApps} app${weekApps !== 1 ? "s" : ""} · ${weekApproved} approved`}
            />
            <OdsStatCard label="Last Week ALP" value={fmt$(prevWeekALP)} />
          </div>
        </>
      )}

      {/* ── Team Overview (manager) ── */}
      {isManager && (
        <>
          <p className="text-xs font-semibold text-app-text-4 uppercase tracking-wider mb-3">
            {teamNames[String(teamNumber)] || `Team ${teamNumber}`} Overview
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <OdsStatCard
              label="Week ALP"
              value={fmt$(teamWeekALP)}
              accent="#1e3a5f"
              trend={trendDir(teamWeekALP, prevTeamWeekALP)}
              trendValue={prevTeamWeekALP > 0 ? `${pctChange(teamWeekALP, prevTeamWeekALP)} vs last week` : "—"}
            />
            <OdsStatCard label="Last Week ALP" value={fmt$(prevTeamWeekALP)} />
            <OdsStatCard label="Week Apps" value={teamWeekClients.length} trendValue={`${activeReps.length} active reps`} />
            <OdsStatCard
              label="Month ALP"
              value={fmt$(monthALP)}
              trend={trendDir(monthALP, prevMonthALP)}
              trendValue={prevMonthALP > 0 ? `${pctChange(monthALP, prevMonthALP)} vs last month` : "—"}
            />
          </div>
        </>
      )}

      {/* ── Company Overview (admin) ── */}
      {isAdmin && (
        <>
          <p className="text-xs font-semibold text-app-text-4 uppercase tracking-wider mb-3">Company</p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <OdsStatCard
              label="Week ALP"
              value={fmt$(weekALP)}
              accent="#1e3a5f"
              trend={trendDir(weekALP, prevWeekALP)}
              trendValue={prevWeekALP > 0 ? `${pctChange(weekALP, prevWeekALP)} vs last week` : `${weekApps} app${weekApps !== 1 ? "s" : ""}`}
            />
            <OdsStatCard label="Last Week ALP" value={fmt$(prevWeekALP)} />
            <OdsStatCard label={`${filterLabel} ALP`} value={fmt$(windowALP)} trendValue={`${windowClients.length} apps`} />
            <OdsStatCard label={`${filterLabel} Apps`} value={windowClients.length} trendValue={`${activeReps.length} active reps`} />
            <OdsStatCard
              label="Month ALP"
              value={fmt$(monthALP)}
              trend={trendDir(monthALP, prevMonthALP)}
              trendValue={prevMonthALP > 0 ? `${pctChange(monthALP, prevMonthALP)} vs last month` : "—"}
            />
            <OdsStatCard label="All-Time ALP" value={fmt$(totalALP)} trendValue={`${scopeClients.length} total apps`} />
          </div>
        </>
      )}

      {/* ── Rep Table (admin + manager) ── */}
      {(isAdmin || isManager) && (
        <>
          <p className="text-xs font-semibold text-app-text-4 uppercase tracking-wider mb-3">
            All Reps — {activeReps.length} active
          </p>
          <div className="bg-app-surface border border-app-border rounded-xl overflow-hidden">
            <OdsList
              columns={REP_COLUMNS}
              data={repRecords}
              loading={false}
              uid={uid ?? ""}
              userName={claim.displayName}
              isAdmin={isAdmin}
              currentRole={currentRole}
              permissions={repListPerms ?? buildDefaultPermissions(REP_COLUMNS)}
              onSavePermissions={saveRepListPerms}
              schema={repListSchema}
              onSaveSchema={saveRepListSchema}
              userPrefs={repTableUserPrefs}
              onSaveUserPrefs={saveRepTableUserPrefs}
              views={repTableViews}
              onSaveView={saveRepTableView}
              onDeleteView={deleteRepTableView}
              listTitle="Rep Performance"
              initialSortField="weekALP"
              initialSortDir="desc"
              displayMode="expandable"
              collapsedFields={["name", "teamNumber", "weekALP", "weekApps", "monthALP", "allALP"]}
              renderExpandedContent={(record) => {
                const policies = weekClientsByRep[record.id] ?? [];
                if (policies.length === 0) {
                  return (
                    <div className="px-4 py-6 text-center">
                      <p className="text-app-text-4 text-sm">No policies written this week.</p>
                    </div>
                  );
                }
                const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
                return (
                  <div className="px-1 py-2">
                    <p className="text-xs font-semibold text-app-text-4 uppercase tracking-wider mb-2 px-3">
                      Week Policies — {policies.length} app{policies.length !== 1 ? "s" : ""}
                    </p>
                    <div className="divide-y divide-app-border/50">
                      {policies.map(c => {
                        const dayIdx = WEEK_DAY_DATES.indexOf(c.date);
                        const dayLabel = dayIdx >= 0 ? DAY_NAMES[dayIdx] : c.date;
                        return (
                          <div key={c.id} className="flex items-center justify-between px-3 py-2 hover:bg-app-surface-2/30 transition rounded">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-app-text-4 text-xs font-medium w-8 shrink-0">{dayLabel}</span>
                              <div className="min-w-0">
                                <p className="text-app-text text-sm font-medium truncate">{c.clientName}</p>
                                <p className="text-app-text-4 text-xs">{c.carrier} · {c.state}{c.appNumber ? ` · ${c.appNumber}` : ""}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 ml-4">
                              <span className="text-app-text text-sm font-semibold">{fmt$(c.annualPremium)}</span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[c.agentStatus] ?? "bg-app-surface-2 text-app-text-3"}`}>
                                {c.agentStatus}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }}
            />
          </div>
        </>
      )}

      {/* ── Recent Apps (rep only) ── */}
      {!isAdmin && !isManager && (
        <>
          <p className="text-xs font-semibold text-app-text-4 uppercase tracking-wider mb-3">Recent Apps</p>
          <div className="bg-app-surface border border-app-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-app-border">
              <h2 className="text-app-text font-semibold text-sm">This Week</h2>
              <Link href="/portal/clients" className="text-app-accent hover:opacity-80 text-xs transition">View all</Link>
            </div>
            {recentApps.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-app-text-4 text-sm">No apps yet this week.</p>
                <Link href="/portal/clients/new" className="text-app-accent hover:opacity-80 text-sm mt-2 inline-block">Add your first app</Link>
              </div>
            ) : (
              <div className="divide-y divide-app-border/50">
                {recentApps.map(c => (
                  <div key={c.id} className="flex items-center justify-between px-5 py-3 hover:bg-app-surface-2/30 transition">
                    <div className="min-w-0">
                      <p className="text-app-text text-sm font-medium truncate">{c.clientName}</p>
                      <p className="text-app-text-4 text-xs">{c.date} · {c.carrier} · {c.state}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <span className="text-app-text text-sm font-semibold">{fmt$(c.annualPremium)}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[c.agentStatus] ?? "bg-app-surface-2 text-app-text-3"}`}>
                        {c.agentStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
