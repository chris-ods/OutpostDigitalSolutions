"use client";

import { useEffect, useRef, useState } from "react";
import {
  collection, doc, getDoc, getDocs, onSnapshot,
  setDoc,
} from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

// ─── Public interfaces ────────────────────────────────────────────────────────

export interface LeaderboardClient {
  agentId: string;
  agentName: string;
  agentTeamNumber: number;
  annualPremium: number;
  weekStart: string;
  createdBy?: string;
}

export interface LeaderboardUser {
  uid: string;
  firstName: string;
  lastName: string;
  photoURL: string;
  email: string;
  phone: string;
  role: string;
  teamNumber: number;
  level?: number;
}

export interface LeaderboardCareerLevel {
  level: number;
  tag: string;
  title?: string;
}

export interface LeaderboardAppProps {
  /** Firestore instance from the host app */
  db: Firestore;
  /** Returns true when the current user can edit settings */
  isOwner: boolean;
  /** Returns true if a role string is admin-level */
  isAdminLevel: (role: string) => boolean;
  /** Career level definitions — used for level badges */
  careerLevels: readonly LeaderboardCareerLevel[];
  /** Team color overrides — keyed by team number, value is hex string */
  teamColors?: Record<number, string>;
}

// ─── Visibility config ────────────────────────────────────────────────────────

interface LeaderboardVisibility {
  champion: boolean;
  teamStandings: boolean;
  individualRankings: boolean;
  leadership: boolean;
  minimumWarning: boolean;
}

const DEFAULT_VISIBILITY: LeaderboardVisibility = {
  champion: true,
  teamStandings: true,
  individualRankings: true,
  leadership: true,
  minimumWarning: true,
};

const VISIBILITY_LABELS: { key: keyof LeaderboardVisibility; label: string; desc: string }[] = [
  { key: "champion",            label: "Last Week's Champion",  desc: "Defending champion hero banner" },
  { key: "teamStandings",       label: "Team Standings",        desc: "Team ALP grid with captain cards" },
  { key: "individualRankings",  label: "Individual Rankings",   desc: "CSR tier rep cards" },
  { key: "leadership",          label: "Leadership",            desc: "Owner / Dev team roster" },
  { key: "minimumWarning",      label: "Minimum Warning",       desc: "10-app minimum footer notice" },
];

// ─── Internal types ───────────────────────────────────────────────────────────

type PayTier = "TC" | "CSR";

interface RepStats {
  uid: string;
  agentName: string;
  teamNumber: number;
  policies: number;
  totalALP: number;
  photoURL: string;
  email: string;
  phone: string;
  tier: PayTier;
  level?: number;
}

interface TeamStats {
  teamNumber: number;
  totalALP: number;
  policies: number;
  captainName: string;
  captainPhotoURL: string;
  captainEmail: string;
  captainPhone: string;
  repCount: number;
}

interface LeaderMember {
  uid: string;
  name: string;
  photoURL?: string;
  alp: number;
  policies: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getWeekStart(date: Date): string {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function fmtALP(v: number) {
  return "$" + (v || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function buildRepStats(
  cls: LeaderboardClient[],
  userMap: Record<string, LeaderboardUser>,
  isAdminLevel: (r: string) => boolean,
): RepStats[] {
  const map: Record<string, RepStats> = {};
  for (const c of cls) {
    if (String(c.agentId ?? "").startsWith("pending:")) continue;
    const key = c.agentId || c.agentName || "unknown";
    if (!map[key]) {
      const u = c.agentId ? userMap[c.agentId] : undefined;
      const name = u ? `${u.firstName} ${u.lastName}`.trim() : c.agentName || "Unknown";
      map[key] = {
        uid: c.agentId || key,
        agentName: name,
        teamNumber: c.agentTeamNumber || 0,
        policies: 0,
        totalALP: 0,
        photoURL: u?.photoURL ?? "",
        email: u?.email ?? "",
        phone: u?.phone ?? "",
        tier: u?.role === "manager" || isAdminLevel(u?.role ?? "") ? "TC" : "CSR",
        level: u?.level,
      };
    }
    map[key].policies++;
    map[key].totalALP += c.annualPremium || 0;
  }
  return Object.values(map).sort((a, b) => b.totalALP - a.totalALP);
}

// ─── Team color palette ───────────────────────────────────────────────────────

const PALETTE = [
  { from: "from-blue-900/30",    border: "border-blue-500/25",    text: "text-blue-400"    },
  { from: "from-purple-900/30",  border: "border-purple-500/25",  text: "text-purple-400"  },
  { from: "from-emerald-900/30", border: "border-emerald-500/25", text: "text-emerald-400" },
  { from: "from-orange-900/30",  border: "border-orange-500/25",  text: "text-orange-400"  },
  { from: "from-red-900/30",     border: "border-red-500/25",     text: "text-red-400"     },
  { from: "from-yellow-900/30",  border: "border-yellow-500/25",  text: "text-yellow-400"  },
  { from: "from-pink-900/30",    border: "border-pink-500/25",    text: "text-pink-400"    },
  { from: "from-teal-900/30",    border: "border-teal-500/25",    text: "text-teal-400"    },
  { from: "from-cyan-900/30",    border: "border-cyan-500/25",    text: "text-cyan-400"    },
  { from: "from-indigo-900/30",  border: "border-indigo-500/25",  text: "text-indigo-400"  },
];

function teamColor(n: number) {
  return PALETTE[((n - 1) % PALETTE.length + PALETTE.length) % PALETTE.length];
}

const DEFAULT_TEAM_COLORS_LB: Record<number, string> = {
  1: "#3b82f6", 2: "#a855f7", 3: "#22c55e", 4: "#f97316",
  5: "#ef4444", 6: "#eab308", 7: "#ec4899", 8: "#14b8a6",
  9: "#06b6d4", 10: "#6366f1",
};
function getTeamHex(n: number, overrides?: Record<number, string>): string {
  return overrides?.[n] ?? DEFAULT_TEAM_COLORS_LB[((n - 1) % 10) + 1] ?? "#6b7280";
}

// ─── Level badge styles ───────────────────────────────────────────────────────

const LEVEL_STYLES: Record<number, { bg: string; text: string; border: string }> = {
  1:  { bg: "bg-app-surface-2/60",   text: "text-app-text-3",   border: "border-app-border-2"  },
  2:  { bg: "bg-blue-900/50",   text: "text-blue-300",   border: "border-blue-700"  },
  3:  { bg: "bg-teal-900/50",   text: "text-teal-300",   border: "border-teal-700"  },
  4:  { bg: "bg-amber-900/50",  text: "text-amber-300",  border: "border-amber-700" },
  5:  { bg: "bg-orange-900/50", text: "text-orange-300", border: "border-orange-700"},
  6:  { bg: "bg-purple-900/50", text: "text-purple-300", border: "border-purple-700"},
  7:  { bg: "bg-yellow-900/50", text: "text-yellow-300", border: "border-yellow-600"},
  8:  { bg: "bg-rose-900/50",   text: "text-rose-300",   border: "border-rose-700"  },
  9:  { bg: "bg-amber-800/60",  text: "text-amber-200",  border: "border-amber-500" },
  10: { bg: "bg-red-900/60",    text: "text-red-300",    border: "border-red-600"   },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function LevelBadge({ level, careerLevels }: { level: number; careerLevels: readonly LeaderboardCareerLevel[] }) {
  const def = careerLevels.find((l) => l.level === level);
  const style = LEVEL_STYLES[level] ?? LEVEL_STYLES[1];
  if (!def) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-bold leading-none ${style.bg} ${style.text} ${style.border}`}>
      <span className="opacity-70">Lvl {level}</span>
      <span>{def.tag}</span>
    </span>
  );
}

function AvatarCircle({
  photoURL, name, sizeClass, ringClass, badgeNumber, bottomBadgeContent,
}: {
  photoURL?: string; name: string; sizeClass: string;
  ringClass?: string; badgeNumber?: number | string; bottomBadgeContent?: string;
}) {
  const initials = name.split(" ").map((p) => p[0] ?? "").join("").toUpperCase().slice(0, 2) || "?";
  const colors = ["bg-red-700","bg-blue-700","bg-violet-700","bg-emerald-700","bg-orange-700","bg-fuchsia-700","bg-teal-700","bg-sky-700"];
  const bg = colors[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length];
  const ring = ringClass ?? "ring-2 ring-app-border-2";

  return (
    <div className="relative inline-flex shrink-0">
      {photoURL ? (
        <img src={photoURL} alt={name} className={`${sizeClass} ${ring} rounded-full object-cover shrink-0`} />
      ) : (
        <div className={`${sizeClass} ${ring} ${bg} rounded-full flex items-center justify-center font-bold text-white shrink-0 select-none`}>
          {initials}
        </div>
      )}
      {badgeNumber !== undefined && badgeNumber !== null && (
        <div className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
          style={{ minWidth: "1.25em", height: "1.25em", padding: "0.1em", fontSize: "0.75em", lineHeight: "1" }}>
          {badgeNumber}
        </div>
      )}
      {bottomBadgeContent && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/4 bg-app-surface-2 border border-app-border-2 text-app-text-2 text-xs rounded-md px-1.5 py-0.5 whitespace-nowrap">
          {bottomBadgeContent}
        </div>
      )}
    </div>
  );
}

function SectionLabel({ icon, label, sub, accentClass }: { icon?: string; label: string; sub?: string; accentClass: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {icon && <span className={`${accentClass} text-base leading-none`}>{icon}</span>}
      <h2 className={`text-xs font-black uppercase tracking-[0.18em] ${accentClass}`}>{label}</h2>
      {sub && <span className="text-app-text-5 text-xs">{sub}</span>}
      <div className="flex-1 h-px bg-app-surface-2" />
    </div>
  );
}

function RepCard({
  rep, rank, teamNames, careerLevels, teamColors,
}: {
  rep: RepStats; rank: number; teamNames: Record<string, string>; careerLevels: readonly LeaderboardCareerLevel[];
  teamColors?: Record<number, string>;
}) {
  const col = teamColor(rep.teamNumber || 1);
  const teamHex = getTeamHex(rep.teamNumber || 1, teamColors);
  const isFirst = rank === 0;
  return (
    <div className={`relative rounded-xl p-4 border transition-colors ${isFirst ? "bg-yellow-950/20 border-yellow-500/25 hover:border-yellow-500/40" : "bg-app-surface border-app-border hover:border-app-border-2"}`}>
      {isFirst && <div className="absolute inset-0 rounded-xl bg-linear-to-br from-yellow-500/5 to-transparent pointer-events-none" />}
      <div className="relative flex items-start gap-3">
        <AvatarCircle
          photoURL={rep.photoURL} name={rep.agentName} sizeClass="w-10 h-10 text-sm"
          badgeNumber={rank + 1} bottomBadgeContent={rep.teamNumber > 0 ? `Team ${rep.teamNumber}` : undefined}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-app-text font-bold text-sm leading-tight truncate">{rep.agentName}</p>
            {rep.level && <LevelBadge level={rep.level} careerLevels={careerLevels} />}
          </div>
          <p className="text-xs mt-0.5">
            {rep.teamNumber > 0 && (
              <span className="font-semibold" style={{ color: teamHex }}>
                {teamNames[String(rep.teamNumber)] || `T${rep.teamNumber}`}{" · "}
              </span>
            )}
            <span className="text-app-text-4">{rep.policies} app{rep.policies !== 1 ? "s" : ""}</span>
          </p>
        </div>
      </div>
      <div className="relative mt-3 pt-3 border-t border-app-border/60">
        <p className="text-app-text font-black text-xl leading-none">{fmtALP(rep.totalALP)}</p>
        <p className="text-app-text-5 text-xs mt-0.5">Total ALP</p>
      </div>
    </div>
  );
}

function TierBlock({
  tierCode, tierLabel, tierSub, badgeClass, reps, teamNames, careerLevels, teamColors,
}: {
  tierCode: string; tierLabel: string; tierSub: string; badgeClass: string;
  reps: RepStats[]; teamNames: Record<string, string>; careerLevels: readonly LeaderboardCareerLevel[];
  teamColors?: Record<number, string>;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className={`text-xs font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded border ${badgeClass}`}>{tierCode}</span>
        <span className="text-app-text font-bold text-sm">{tierLabel}</span>
        <span className="text-app-text-5 text-xs">{tierSub}</span>
        <div className="flex-1" />
        <span className="text-app-text-5 text-xs">{reps.length} rep{reps.length !== 1 ? "s" : ""}</span>
      </div>
      <div className="h-px bg-app-surface-2 mb-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {reps.map((rep, idx) => (
          <RepCard key={rep.uid} rep={rep} rank={idx} teamNames={teamNames} careerLevels={careerLevels} teamColors={teamColors} />
        ))}
      </div>
    </div>
  );
}

function LeadershipCard({ title, accentClass, members }: { title: string; accentClass: string; members: LeaderMember[] }) {
  const totalALP = members.reduce((s, m) => s + m.alp, 0);
  const totalPolicies = members.reduce((s, m) => s + m.policies, 0);
  return (
    <div className="bg-app-surface border border-app-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-app-border flex items-center justify-between">
        <span className={`text-xs font-black uppercase tracking-widest ${accentClass}`}>{title}</span>
        <span className="text-app-text-5 text-xs">{members.length} member{members.length !== 1 ? "s" : ""}</span>
      </div>
      <div className="divide-y divide-app-border/50">
        {members.map((m) => (
          <div key={m.uid} className="flex items-center gap-3 px-4 py-3">
            <AvatarCircle photoURL={m.photoURL} name={m.name} sizeClass="w-8 h-8 text-xs" />
            <div className="flex-1 min-w-0">
              <p className="text-app-text text-sm font-medium truncate">{m.name}</p>
              {m.alp > 0 && <p className="text-app-text-4 text-xs">{fmtALP(m.alp)} · {m.policies} app{m.policies !== 1 ? "s" : ""}</p>}
            </div>
          </div>
        ))}
      </div>
      {totalALP > 0 && (
        <div className="px-4 py-3 border-t border-app-border flex items-center justify-between">
          <span className="text-app-text-4 text-xs">Combined</span>
          <span className="text-app-text text-sm font-bold">{fmtALP(totalALP)} · {totalPolicies} apps</span>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LeaderboardApp({ db, isOwner, isAdminLevel, careerLevels, teamColors }: LeaderboardAppProps) {
  const [clients, setClients]               = useState<LeaderboardClient[]>([]);
  const [userMap, setUserMap]               = useState<Record<string, LeaderboardUser>>({});
  const [loading, setLoading]               = useState(true);
  const [selectedWeek, setSelectedWeek]     = useState("");
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([]);
  const [phase, setPhase]                   = useState<"testing"|"merging"|"live">("live");
  const [teamNames, setTeamNames]           = useState<Record<string, string>>({});

  // Visibility / permissions
  const [visibility, setVisibility]     = useState<LeaderboardVisibility>(DEFAULT_VISIBILITY);
  const [visDraft, setVisDraft]         = useState<LeaderboardVisibility>(DEFAULT_VISIBILITY);
  const [showSettings, setShowSettings] = useState(false);
  const [saving, setSaving]             = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // ── Load users + phase + teamNames ────────────────────────────────────────
  useEffect(() => {
    getDocs(collection(db, "users")).then((snap) => {
      const um: Record<string, LeaderboardUser> = {};
      snap.docs.forEach((d) => {
        const data = d.data() as Omit<LeaderboardUser, "uid">;
        um[d.id] = { uid: d.id, ...data };
      });
      setUserMap(um);
    }).catch(console.error);

    getDoc(doc(db, "settings", "teamConfig")).then((snap) => {
      if (snap.exists()) {
        setPhase((snap.data().phase as "testing"|"merging"|"live") ?? "live");
        setTeamNames((snap.data().teamNames as Record<string, string>) ?? {});
      }
    }).catch(() => {});
  }, [db]);

  // ── Live client listener ───────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "clients"), (snap) => {
      const all = snap.docs
        .map((d) => ({ ...d.data() } as LeaderboardClient))
        .filter((c) => phase !== "testing" || c.createdBy !== "csv-import");
      setClients(all);

      const cur = getWeekStart(new Date());
      const weeks = Array.from(
        new Set([cur, ...all.map((c) => c.weekStart).filter(Boolean)])
      ).sort((a, b) => (b > a ? 1 : -1));
      setAvailableWeeks(weeks);
      setSelectedWeek((prev) => prev || cur);
      setLoading(false);
    }, (e) => { console.error(e); setLoading(false); });
    return () => unsub();
  }, [db, phase]);

  // ── Load + sync visibility config ──────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "leaderboardConfig"), (snap) => {
      if (snap.exists()) {
        const cfg = { ...DEFAULT_VISIBILITY, ...(snap.data() as Partial<LeaderboardVisibility>) };
        setVisibility(cfg);
        setVisDraft(cfg);
      }
    }, () => {});
    return () => unsub();
  }, [db]);

  // ── Outside-click: close settings ─────────────────────────────────────────
  useEffect(() => {
    if (!showSettings) return;
    const handle = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node))
        setShowSettings(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [showSettings]);

  // ── Save visibility to Firestore ───────────────────────────────────────────
  const saveVisibility = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "leaderboardConfig"), visDraft, { merge: true });
      setShowSettings(false);
    } catch (e) {
      console.error("Failed to save leaderboard config", e);
    } finally {
      setSaving(false);
    }
  };

  // ── Derived data ───────────────────────────────────────────────────────────
  const prevWeekStr = (() => {
    if (!selectedWeek) return "";
    const d = new Date(selectedWeek + "T12:00:00");
    d.setDate(d.getDate() - 7);
    return getWeekStart(d);
  })();

  const weekClients = clients.filter((c) => c.weekStart === selectedWeek);
  const prevClients = clients.filter((c) => c.weekStart === prevWeekStr);

  const repStats     = buildRepStats(weekClients, userMap, isAdminLevel);
  const prevRepStats = buildRepStats(prevClients, userMap, isAdminLevel);
  const lastWeekStar = prevRepStats[0] ?? null;

  const teamMap: Record<number, TeamStats> = {};
  for (const rep of repStats) {
    if (!rep.teamNumber) continue;
    const tn = rep.teamNumber;
    if (!teamMap[tn]) {
      const captainEntry = Object.entries(userMap).find(
        ([, u]) => u.teamNumber === tn && (u.role === "manager" || isAdminLevel(u.role))
      );
      const cap = captainEntry?.[1];
      teamMap[tn] = {
        teamNumber: tn, totalALP: 0, policies: 0,
        captainName: cap ? `${cap.firstName} ${cap.lastName}`.trim() : `Team ${tn} Captain`,
        captainPhotoURL: cap?.photoURL ?? "",
        captainEmail: cap?.email ?? "",
        captainPhone: cap?.phone ?? "",
        repCount: 0,
      };
    }
    teamMap[tn].totalALP += rep.totalALP;
    teamMap[tn].policies += rep.policies;
    teamMap[tn].repCount++;
  }
  const teams = Object.values(teamMap).sort((a, b) => b.totalALP - a.totalALP);

  const csrReps = repStats.filter((r) => r.tier === "CSR");

  function buildLeaderMembers(role: string): LeaderMember[] {
    return Object.entries(userMap)
      .filter(([, u]) => u.role === role)
      .map(([uid, u]) => {
        const stat = repStats.find((r) => r.uid === uid);
        return { uid, name: `${u.firstName} ${u.lastName}`.trim(), photoURL: u.photoURL, alp: stat?.totalALP ?? 0, policies: stat?.policies ?? 0 };
      })
      .sort((a, b) => b.alp - a.alp || a.name.localeCompare(b.name));
  }
  const devMembers   = buildLeaderMembers("developer");
  const ownerMembers = buildLeaderMembers("owner");

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-full bg-app-bg overflow-y-auto flex items-center justify-center">
        <svg className="w-8 h-8 animate-spin text-red-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="bg-app-bg min-h-full overflow-y-auto">

      {/* ── Header ── */}
      <div className="bg-app-surface/70 border-b border-app-border">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-1 h-9 rounded-full bg-red-500" />
            <div>
              <h1 className="text-3xl font-black text-app-text tracking-tight uppercase leading-none">Leaderboard</h1>
              <p className="text-app-text-4 text-xs mt-1 font-medium tracking-wide">
                WEEK OF {selectedWeek ? formatDate(selectedWeek).toUpperCase() : "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Week selector */}
            {availableWeeks.length > 0 && (
              <select value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)}
                className="px-3 py-2 bg-app-surface-2 border border-app-border-2 rounded-lg text-app-text text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                {availableWeeks.map((w) => (
                  <option key={w} value={w}>Week of {formatDate(w)}</option>
                ))}
              </select>
            )}

            {/* Permissions / visibility settings — owner only */}
            {isOwner && (
              <div className="relative" ref={settingsRef}>
                <button type="button" onClick={() => setShowSettings((v) => !v)}
                  title="Leaderboard settings"
                  className={`p-2 rounded-lg transition-colors ${showSettings ? "text-app-text bg-app-surface-2" : "text-app-text-4 hover:text-app-text hover:bg-app-surface-2"}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>

                {showSettings && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-app-surface border border-app-border-2 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-app-border flex items-center justify-between">
                      <p className="text-xs font-black uppercase tracking-widest text-app-text-2">Section Visibility</p>
                      <p className="text-[10px] text-app-text-5">Changes save for all users</p>
                    </div>
                    <div className="p-3 space-y-1">
                      {VISIBILITY_LABELS.map(({ key, label, desc }) => (
                        <div key={key} className="flex items-start justify-between gap-3 px-1 py-2 rounded-lg hover:bg-app-surface-2/50 transition-colors">
                          <div className="min-w-0">
                            <p className="text-xs text-app-text font-semibold leading-snug">{label}</p>
                            <p className="text-[10px] text-app-text-5 leading-snug mt-0.5">{desc}</p>
                          </div>
                          <button type="button"
                            onClick={() => setVisDraft((prev) => ({ ...prev, [key]: !prev[key] }))}
                            className={`shrink-0 rounded-full transition-colors relative mt-0.5 ${visDraft[key] ? "bg-red-600" : "bg-app-surface-2"}`}
                            style={{ minWidth: "2rem", height: "1.125rem" }}>
                            <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${visDraft[key] ? "translate-x-4" : "translate-x-0.5"}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="px-3 pb-3 flex gap-2">
                      <button type="button" onClick={() => { setVisDraft(visibility); setShowSettings(false); }}
                        className="flex-1 py-2 text-xs text-app-text-3 hover:text-app-text border border-app-border-2 rounded-lg transition-colors">
                        Cancel
                      </button>
                      <button type="button" onClick={saveVisibility} disabled={saving}
                        className="flex-1 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-lg transition-colors">
                        {saving ? "Saving…" : "Save"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">

        {/* Last Week's Champion */}
        {visibility.champion && lastWeekStar && prevClients.length > 0 && (
          <section>
            <SectionLabel icon="★" label="Last Week's Champion" sub={formatDate(prevWeekStr)} accentClass="text-yellow-500" />
            <div className="relative rounded-2xl overflow-hidden border border-yellow-500/30 bg-linear-to-r from-yellow-950/50 via-amber-950/30 to-app-surface/50">
              <div className="absolute top-0 left-0 w-80 h-80 bg-yellow-500/5 rounded-full -translate-x-40 -translate-y-40 pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-56 h-56 bg-amber-500/5 rounded-full translate-x-20 translate-y-20 pointer-events-none" />
              <div className="relative flex items-center gap-6 px-8 py-7 flex-wrap">
                <div className="relative shrink-0">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-yellow-400 text-2xl leading-none select-none">♛</div>
                  <AvatarCircle photoURL={lastWeekStar.photoURL} name={lastWeekStar.agentName}
                    sizeClass="w-24 h-24 text-2xl" ringClass="ring-4 ring-yellow-500/50"
                    badgeNumber={1} bottomBadgeContent={lastWeekStar.teamNumber > 0 ? `Team ${lastWeekStar.teamNumber}` : undefined}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-yellow-500/70 text-xs font-black uppercase tracking-[0.2em] mb-1">Defending Champion</p>
                  <h2 className="text-4xl font-black text-app-text leading-none truncate">{lastWeekStar.agentName}</h2>
                  {lastWeekStar.teamNumber > 0 && (
                    <p className="text-app-text-3 text-sm mt-2">
                      <span className="font-semibold" style={{ color: getTeamHex(lastWeekStar.teamNumber, teamColors) }}>
                        {teamNames[String(lastWeekStar.teamNumber)] || `Team ${lastWeekStar.teamNumber}`}
                      </span>
                      {" · "}
                      <span>{lastWeekStar.tier === "TC" ? "Team Captain" : "CSR"}</span>
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-yellow-400 text-5xl font-black leading-none">{fmtALP(lastWeekStar.totalALP)}</p>
                  <p className="text-app-text-3 text-sm mt-2">{lastWeekStar.policies} {lastWeekStar.policies === 1 ? "policy" : "policies"}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Team Standings */}
        {visibility.teamStandings && teams.length > 0 && (
          <section>
            <SectionLabel label="Team Standings" sub={`${teams.length} active team${teams.length !== 1 ? "s" : ""}`} accentClass="text-app-text-2" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {teams.map((team, idx) => {
                const col = teamColor(team.teamNumber);
                return (
                  <div key={team.teamNumber} className={`relative bg-linear-to-b ${col.from} to-app-surface/60 border ${col.border} rounded-xl overflow-hidden`}>
                    {idx < 3 && (
                      <div className={`absolute top-2 right-2 z-20 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${idx === 0 ? "bg-yellow-500 text-black" : idx === 1 ? "bg-gray-300 text-black" : "bg-orange-700 text-white"}`}>
                        {idx + 1}
                      </div>
                    )}
                    <div className="relative group border-b border-app-border/50">
                      <div className="flex items-center gap-3 px-4 py-3">
                        <AvatarCircle photoURL={team.captainPhotoURL} name={team.captainName} sizeClass="w-10 h-10 text-sm" />
                        <div className="min-w-0">
                          <p className="text-app-text font-bold text-sm leading-tight truncate">{team.captainName}</p>
                          <p className="text-xs font-semibold" style={{ color: getTeamHex(team.teamNumber, teamColors) }}>Team Captain · TC</p>
                        </div>
                      </div>
                      {(team.captainEmail || team.captainPhone) && (
                        <div className="absolute inset-0 bg-app-bg/95 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10">
                          {team.captainEmail && (
                            <a href={`mailto:${team.captainEmail}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-xs font-bold transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                              Email
                            </a>
                          )}
                          {team.captainPhone && (
                            <a href={`tel:${team.captainPhone}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded-lg text-white text-xs font-bold transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 8V5z" /></svg>
                              Call
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="px-4 py-4">
                      <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: getTeamHex(team.teamNumber, teamColors) }}>
                        {teamNames[String(team.teamNumber)] || `Team ${team.teamNumber}`}
                      </p>
                      <p className="text-app-text text-2xl font-black">{fmtALP(team.totalALP)}</p>
                      <div className="flex items-center justify-between mt-2 text-xs text-app-text-4">
                        <span>{team.policies} apps</span>
                        <span>{team.repCount} rep{team.repCount !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Individual Rankings */}
        {visibility.individualRankings && (
          <section className="space-y-8">
            <SectionLabel label="Individual Rankings" accentClass="text-app-text-2" />
            {csrReps.length > 0 && (
              <TierBlock
                tierCode="CSR" tierLabel="Customer Service Reps"
                tierSub="Performance Advance · $650/wk"
                badgeClass="text-sky-400 border-sky-500/30 bg-sky-950/30"
                reps={csrReps} teamNames={teamNames} careerLevels={careerLevels} teamColors={teamColors}
              />
            )}
            {repStats.length === 0 && (
              <p className="text-center text-app-text-5 py-12 text-sm">No data for this week.</p>
            )}
          </section>
        )}

        {/* Leadership */}
        {visibility.leadership && (devMembers.length > 0 || ownerMembers.length > 0) && (
          <section>
            <SectionLabel label="Leadership" accentClass="text-app-text-3" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {devMembers.length > 0 && <LeadershipCard title="Dev Team" accentClass="text-red-400" members={devMembers} />}
              {ownerMembers.length > 0 && <LeadershipCard title="Owner Team" accentClass="text-amber-400" members={ownerMembers} />}
            </div>
          </section>
        )}

        {/* Minimum warning */}
        {visibility.minimumWarning && (
          <div className="text-center border-t border-app-border pt-6 pb-2">
            <p className="text-red-500/60 font-black text-xs uppercase tracking-[0.25em]">
              ⚠ 10 App Minimum Required for All Contractors
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
