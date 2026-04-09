"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { ReactNode } from "react";
import {
  collection, getDocs, doc, addDoc,
  setDoc, onSnapshot, query, where, updateDoc, getDoc,
  serverTimestamp, arrayUnion,
} from "firebase/firestore";
import type { Timestamp } from "firebase/firestore";
import type { ImportedPayrollRow as ImportedRow } from "../../../lib/types";
import { db } from "../../../lib/firebase";
import { UserProfile, UserWithId, Client, isAdminLevel } from "../../../lib/types";
import { useTeamConfig } from "../../../lib/hooks/useTeamConfig";
import { Spinner } from "../../../lib/components/Spinner";
import { useUserClaim } from "../../../lib/hooks/useUserClaim";
import { getWeekStart } from "../../../lib/weekUtils";
import { generatePayrollPDF } from "./generatePayrollPDF";

// ─── Constants ────────────────────────────────────────────────────────────────

const TL_BASE        = 680;
const CSR_BASE       = 650;
const ADMIN_HOURLY   = 25;
const VOLUME_RATE    = 0.035;
const PRODUCER_ALP   = 20_000;
const PRODUCER_BONUS = 200;
const DEFAULT_HOURS  = 0;   // default entry value — manager enters hours manually
const DEV_MONTHLY = 200; // fixed team cost per month split among all developers
const FULL_WEEK_HOURS = 40; // proration denominator for base/volume calculations
const HALF_ALP_CUTOFF = "2026-03-24"; // half-credit penalty only applies from this week onward

const PAY_PERIOD_ANCHOR = "2026-03-23";

const AGENT_STATUSES = ["Sent UW", "Approved", "Declined", "Cancelled", "Pending"] as const;
const ADMIN_STATUSES = [
  "Pending Client Payment", "Client Paid|Comp Paid", "Client Paid|Waiting on Comp",
  "Comp Paid|Client Not Paid", "UW or Requirements", "Decline - Rewrite", "Lapsed", "CXL",
] as const;
const CANCEL_ADMIN_STATUSES = ["Decline - Rewrite", "Lapsed", "CXL"];

const COO_TIERS = [
  { min: 400_000, pay: 6_000 },
  { min: 350_000, pay: 5_000 },
  { min: 300_000, pay: 4_000 },
  { min: 250_000, pay: 3_500 },
  { min: 200_000, pay: 3_100 },
  { min:       0, pay: 2_850 },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type UserWithUID = UserWithId;

interface PayrollEntry {
  hours:          number;
  payrollChecked: boolean;
  baseManual?:    number;
  halfCredit?:    boolean;
  adjustment?:    number;        // +/- dollar amount manual adjustment
  adjustmentNotes?: string;      // reason for adjustment
  volumeDQ?:      string[];      // client IDs disqualified from TC's 3.5% volume bonus (sick, vacation, late start)
}

interface Stats {
  appCount:      number;
  lowAlpCount:   number;   // apps with ALP < $600 (auto half-credit on ALP only)
  appBonus:      number;
  indALP:        number;
  producerBonus: number;
  hours:         number;
  base:          number;
  volumeBonus:   number;
  total:         number;
}

interface PayrollRecordPolicy {
  clientId: string;
  clientName: string;
  carrier: string;
  appNumber: string;
  annualPremium: number;
  agentStatus: string;
  adminStatus: string;
  splitPercent: number;
  agentTeamNumber: number;
  isDQ: boolean;
}

interface PayrollRecordRow {
  uid: string;
  name: string;
  contractorId: string;
  teamNumber: number;
  role: string;
  base: number;
  appBonus: number;
  appCount: number;
  hours: number;
  volumeBonus: number;
  producerBonus: number;
  adjustment: number;
  adjustmentNotes: string;
  total: number;
  volumeDQ: string[];
  policies: PayrollRecordPolicy[];
}

interface PayrollRecord {
  periodStart: string;
  periodEnd: string;
  payday: string;
  locked: boolean;
  lockedAt: Timestamp | null;
  lockedBy: string;
  lockedByUid: string;
  paid: boolean;
  paidAt?: Timestamp | null;
  totalPayroll: number;
  rows: PayrollRecordRow[];
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function calcAppBonus(count: number): number {
  if (count <= 0) return 0;
  let b = Math.min(count, 5) * 50;
  if (count > 5)  b += Math.min(count - 5, 5) * 100;
  if (count > 10) b += (count - 10) * 150;
  return b;
}

function calcBase(u: UserWithUID, hours: number): number {
  if (u.role === "manager") return 0;
  if (isAdminLevel(u.role)) return Math.round(hours * ADMIN_HOURLY * 100) / 100;
  const rate = u.subRole === "TL" ? TL_BASE : CSR_BASE;
  return Math.round((hours / FULL_WEEK_HOURS) * rate * 100) / 100;
}

function calcCOOPay(totalALP: number): number {
  for (const tier of COO_TIERS) {
    if (totalALP >= tier.min) return tier.pay;
  }
  return 2_850;
}

function toMondayStr(input: string): string {
  const d = new Date(input + "T12:00:00");
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d.toISOString().slice(0, 10);
}

function currentMonday(): string {
  return toMondayStr(new Date().toISOString().slice(0, 10));
}

function fmtMoney(n: number): string {
  if (!isFinite(n) || isNaN(n)) return "$0.00";
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Get the pay period that contains a given date */
function getPayPeriodForDate(date: Date): { start: string; end: string; payday: string } {
  const anchor = new Date("2026-03-23T12:00:00");
  const diffMs = date.getTime() - anchor.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const periodIndex = Math.floor(diffDays / 14);
  const startDate = new Date(anchor.getTime() + periodIndex * 14 * 86400000);
  const endDate = new Date(startDate.getTime() + 13 * 86400000);
  const payday = new Date(endDate.getTime() + 5 * 86400000);
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  return { start: fmt(startDate), end: fmt(endDate), payday: fmt(payday) };
}

/** Get the two Monday dates within a pay period that starts on periodStart */
function getPeriodMondays(periodStart: string): [string, string] {
  const d = new Date(periodStart + "T12:00:00");
  const week1 = toMondayStr(periodStart);
  const d2 = new Date(d.getTime() + 7 * 86400000);
  const week2 = `${d2.getFullYear()}-${String(d2.getMonth()+1).padStart(2,"0")}-${String(d2.getDate()).padStart(2,"0")}`;
  return [week1, toMondayStr(week2)];
}

function fmtPeriodRange(start: string, end: string): string {
  if (!start || !end) return "";
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  const s = new Date(sy, sm - 1, sd);
  const e = new Date(ey, em - 1, ed);
  const o: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${s.toLocaleDateString("en-US", o)} – ${e.toLocaleDateString("en-US", { ...o, year: "numeric" })}`;
}

function fmtShortDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtFullDate(ts: Timestamp | null | undefined): string {
  if (!ts) return "";
  const d = ts.toDate();
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function roleLabel(u: { role: string; subRole?: string }): { text: string; cls: string } {
  if (u.subRole === "COO")    return { text: "COO",   cls: "text-amber-400" };
  if (u.role    === "manager") return { text: "TC",    cls: "text-app-accent" };
  if (isAdminLevel(u.role as UserProfile["role"]))    return { text: "Staff", cls: "text-purple-400" };
  if (u.subRole === "TL")      return { text: "TL",    cls: "text-orange-400" };
  return                              { text: "CSR",   cls: "text-app-text-4" };
}

function tierBadge(count: number): { label: string; cls: string } | null {
  if (count >= 11) return { label: "T3", cls: "bg-green-900/50 border-green-800 text-green-300" };
  if (count >= 6)  return { label: "T2", cls: "bg-purple-900/50 border-purple-800 text-purple-300" };
  if (count >= 1)  return { label: "T1", cls: "bg-blue-900/50 border-blue-800 text-blue-300" };
  return null;
}

function agentStatusCls(s?: string): string {
  switch (s) {
    case "Approved":  return "bg-green-900/40 text-emerald-400 border-green-700/50";
    case "Declined":  return "bg-red-900/40 text-red-400 border-red-700/50";
    case "Cancelled": return "bg-red-900/40 text-red-500 border-red-700/50";
    case "Sent UW":   return "bg-amber-900/40 text-amber-400 border-amber-700/50";
    case "Pending":   return "bg-blue-900/40 text-app-accent border-blue-700/50";
    default:          return "bg-app-surface-2 text-app-text-3 border-app-border";
  }
}

function adminStatusCls(s?: string): string {
  if (!s) return "bg-app-surface-2 text-app-text-3 border-app-border";
  if (s.startsWith("Client Paid|Comp Paid")) return "bg-green-900/40 text-emerald-400 border-green-700/50";
  if (s.includes("Decline") || s === "Lapsed" || s === "CXL") return "bg-red-900/40 text-red-400 border-red-700/50";
  if (s.includes("Waiting") || s.includes("UW") || s.includes("Pending")) return "bg-amber-900/40 text-amber-400 border-amber-700/50";
  return "bg-app-surface-2 text-app-text-3 border-app-border";
}

// ─── Module-level pure computation functions ──────────────────────────────────

function computeTeamALP(
  clients: Client[],
  usersMap: Record<string, UserWithUID>,
  weekStart?: string,
): Record<number, number> {
  const applyHalfCredit = !weekStart || weekStart >= HALF_ALP_CUTOFF;
  const m: Record<number, number> = {};
  clients.forEach(c => {
    const alp  = c.annualPremium || 0;
    const team = c.agentTeamNumber;
    if (!team) return;
    // Apps below $600 ALP only count as half credit toward team total (after cutoff)
    const effectiveALP = (applyHalfCredit && alp > 0 && alp < 600) ? alp * 0.5 : alp;
    if (!c.splitPercent) {
      m[team] = (m[team] || 0) + effectiveALP;
    } else {
      m[team] = (m[team] || 0) + effectiveALP * 0.5;
      const mgrTeam = c.portal ? usersMap[c.portal]?.teamNumber : undefined;
      if (mgrTeam) m[mgrTeam] = (m[mgrTeam] || 0) + effectiveALP * 0.5;
    }
  });
  return m;
}

function computeStats(
  users: UserWithUID[],
  clients: Client[],
  entries: Record<string, PayrollEntry>,
  teamALP: Record<number, number>,
  companyTotalALP: number,
  weekStart?: string,
): Record<string, Stats> {
  const applyHalfCredit = !weekStart || weekStart >= HALF_ALP_CUTOFF;
  const m: Record<string, Stats> = {};
  users.forEach(u => {
    const myClients = clients.filter(c => c.agentId === u.uid);
    const appCount    = myClients.length;
    const lowAlpCount = applyHalfCredit
      ? myClients.filter(c => (c.annualPremium || 0) > 0 && (c.annualPremium || 0) < 600).length
      : 0;
    // ALP: <$600 apps count at 50% only after cutoff; split apps count at 50%
    const indALP = myClients.reduce((s, c) => {
      const alp = c.annualPremium || 0;
      const effective = (applyHalfCredit && alp > 0 && alp < 600) ? alp * 0.5 : alp;
      return s + effective * (c.splitPercent ? 0.5 : 1);
    }, 0);
    const producerBonus = indALP >= PRODUCER_ALP ? PRODUCER_BONUS : 0;

    const entry = entries[u.uid];
    const hours = entry?.hours ?? DEFAULT_HOURS;
    const adjustment = entry?.adjustment || 0;

    // App bonus uses full count — ALP penalty does not affect tier/bonus
    const appBonus = calcAppBonus(appCount);

    const base = u.subRole === "COO" ? 0
      : (isAdminLevel(u.role) && entry?.baseManual != null) ? entry.baseManual
      : calcBase(u, hours);

    const volB = u.subRole === "COO"
      ? calcCOOPay(companyTotalALP)
      : (u.role === "manager" && u.teamNumber
        ? (() => {
            let alp = teamALP[u.teamNumber] || 0;
            // Subtract ALP from DQ'd records
            const dqIds = entry?.volumeDQ;
            if (dqIds && dqIds.length > 0) {
              const dqSet = new Set(dqIds);
              clients.forEach(c => {
                if (c.id && dqSet.has(c.id) && c.agentTeamNumber === u.teamNumber && c.agentId !== u.uid) {
                  const cAlp = c.annualPremium || 0;
                  const effective = (applyHalfCredit && cAlp > 0 && cAlp < 600) ? cAlp * 0.5 : cAlp;
                  alp -= c.splitPercent ? effective * 0.5 : effective;
                }
              });
              if (alp < 0) alp = 0;
            }
            return Math.round(alp * VOLUME_RATE * (hours / FULL_WEEK_HOURS) * 100) / 100;
          })()
        : 0);

    const effAppBonus      = u.subRole === "COO" ? 0 : appBonus;
    const effProducerBonus = u.subRole === "COO" ? 0 : producerBonus;

    m[u.uid] = {
      appCount, lowAlpCount, appBonus: effAppBonus, indALP, producerBonus: effProducerBonus,
      hours, base, volumeBonus: volB,
      total: base + effAppBonus + effProducerBonus + volB + adjustment,
    };
  });
  return m;
}

/** Merge two Stats objects by summing their fields */
function mergeStats(a: Stats, b: Stats): Stats {
  return {
    appCount:      a.appCount + b.appCount,
    lowAlpCount:   a.lowAlpCount + b.lowAlpCount,
    appBonus:      a.appBonus + b.appBonus,
    indALP:        a.indALP + b.indALP,
    producerBonus: a.producerBonus + b.producerBonus,
    hours:         a.hours + b.hours,
    base:          a.base + b.base,
    volumeBonus:   a.volumeBonus + b.volumeBonus,
    total:         a.total + b.total,
  };
}

const EMPTY_STATS: Stats = { appCount: 0, lowAlpCount: 0, appBonus: 0, indALP: 0, producerBonus: 0, hours: 0, base: 0, volumeBonus: 0, total: 0 };

// ─── CSV Export ──────────────────────────────────────────────────────────────

function exportPayrollCSV(
  periodStart: string,
  periodEnd: string,
  rows: PayrollRecordRow[],
) {
  const headers = ["Name","Contractor ID","Team","Role","Base","App Bonus","Apps","Hours","Volume Bonus","Producer Bonus","Adjustment","Notes","Total"];
  const csvRows = rows.map(r => [
    `"${r.name}"`,
    r.contractorId || "",
    r.teamNumber || "",
    r.role,
    r.base.toFixed(2),
    r.appBonus.toFixed(2),
    r.appCount,
    r.hours,
    r.volumeBonus.toFixed(2),
    r.producerBonus.toFixed(2),
    r.adjustment.toFixed(2),
    `"${(r.adjustmentNotes || "").replace(/"/g, '""')}"`,
    r.total.toFixed(2),
  ].join(","));

  const csv = [headers.join(","), ...csvRows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `payroll-${periodStart}-to-${periodEnd}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, badge, locked, children }: {
  title: string;
  badge?: ReactNode;
  locked?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className="text-xs font-semibold text-app-text-4 uppercase tracking-widest">{title}</h2>
        {badge}
      </div>
      <div className={`bg-app-surface border rounded-xl overflow-hidden ${locked ? "border-amber-700/50" : "border-app-border"}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">{children}</table>
        </div>
      </div>
    </section>
  );
}

function THead() {
  return (
    <thead>
      <tr className="border-b border-app-border">
        {[
          { l: "Name",           center: false },
          { l: "ID",             center: false },
          { l: "Base",           center: false },
          { l: "App Bonus",      center: false },
          { l: "Apps",           center: true  },
          { l: "Hours",          center: false },
          { l: "Volume Bonus",   center: false },
          { l: "Producer Bonus", center: false },
          { l: "Total",          center: false },
          { l: "Adjust",         center: false },
          { l: "2-Wk Pay",       center: false },
          { l: "Paid",           center: true  },
        ].map(h => (
          <th
            key={h.l}
            className={`px-4 py-2.5 text-xs font-semibold text-app-text-4 uppercase tracking-wider ${h.center ? "text-center" : "text-left"}`}
          >{h.l}</th>
        ))}
      </tr>
    </thead>
  );
}

interface RowProps {
  u:           UserWithUID;
  s:           Stats;
  entry:       PayrollEntry;
  saving:      boolean;
  isAdmin:     boolean;
  twoWeekPay:  number;
  locked?:     boolean;
  onPatch:     (patch: Partial<PayrollEntry>) => void;
  clawback?:   { count: number; alp: number };
  policies?:   { own: Client[]; teamVolume: Client[] };
  onStatusChange?: (clientId: string, field: "agentStatus" | "adminStatus", value: string, fromValue: string) => void;
}

function PayrollRow({ u, s, entry, saving, isAdmin, twoWeekPay, locked, onPatch, clawback, policies, onStatusChange }: RowProps) {
  const rl = roleLabel(u);
  const tb = tierBadge(s.appCount);

  const tierRowCls = tb
    ? tb.label === "T3" ? "bg-green-900/10 border-l-2 border-l-green-700/60"
    : tb.label === "T2" ? "bg-purple-900/10 border-l-2 border-l-purple-700/60"
    :                     "bg-blue-900/10 border-l-2 border-l-blue-700/60"
    : "";

  const hasExpandable = (policies?.own.length ?? 0) > 0 || (policies?.teamVolume.length ?? 0) > 0;
  const [expanded, setExpanded] = useState(false);

  const [hoursVal, setHoursVal] = useState(String(s.hours));

  const [baseMnlVal, setBaseMnlVal] = useState(String(entry.baseManual ?? s.base));

  const [adjustVal, setAdjustVal] = useState(String(entry.adjustment ?? 0));
  const [adjustNotesVal, setAdjustNotesVal] = useState(entry.adjustmentNotes ?? "");
  const [showAdjustNotes, setShowAdjustNotes] = useState(false);

  const disabled = locked || false;

  return (
    <>
    <tr
      className={`border-b border-app-border/50 hover:bg-app-surface-2/20 transition-colors ${tierRowCls} ${entry.payrollChecked ? "opacity-30" : ""} ${hasExpandable ? "cursor-pointer" : ""}`}
      onClick={hasExpandable ? () => setExpanded(!expanded) : undefined}
    >

      <td className="px-4 py-2.5 whitespace-nowrap">
        <div className="flex items-center gap-2">
          {hasExpandable && (
            <svg className={`w-3.5 h-3.5 text-app-text-4 transition-transform shrink-0 ${expanded ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          )}
          {tb && (
            <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase shrink-0 ${tb.cls}`}>{tb.label}</span>
          )}
          <div>
            <span className="text-app-text text-sm font-medium">{u.firstName} {u.lastName}</span>
            <span className={`ml-2 text-[10px] font-bold uppercase tracking-wide ${rl.cls}`}>{rl.text}</span>
          </div>
        </div>
      </td>

      <td className="px-4 py-2.5 text-app-text-4 text-xs font-mono">{u.contractorId || "—"}</td>

      <td className="px-4 py-2.5" onClick={e => e.stopPropagation()}>
        {u.subRole === "COO" ? (
          <span className="text-app-text-5 text-sm italic">N/A</span>
        ) : u.role === "manager" ? (
          <span className="text-app-text-5 text-sm">$0.00</span>
        ) : isAdmin && isAdminLevel(u.role) && !disabled ? (
          <input
            type="number"
            value={baseMnlVal}
            onChange={e => setBaseMnlVal(e.target.value)}
            onBlur={e => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v) && v !== (entry.baseManual ?? s.base)) {
                onPatch({ baseManual: v });
              } else {
                setBaseMnlVal(String(entry.baseManual ?? s.base));
              }
            }}
            className="w-20 bg-app-surface-2 border border-app-border-2 rounded px-2 py-0.5 text-xs text-app-text text-center focus:outline-none focus:ring-1 focus:ring-app-accent"
          />
        ) : (
          <span className="text-app-text-2 text-sm">{fmtMoney(s.base)}</span>
        )}
      </td>

      <td className="px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          {s.appBonus > 0
            ? <span className="text-app-text-2 text-sm">{fmtMoney(s.appBonus)}</span>
            : <span className="text-app-text-5 text-sm">$0.00</span>}
        </div>
      </td>

      <td className="px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          {s.appCount > 0
            ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-900/50 border border-blue-800 text-blue-300 text-xs font-bold">{s.appCount}</span>
            : <span className="text-app-text-2 text-xs">0</span>}
          {s.lowAlpCount > 0 && (
            <span
              title={`${s.lowAlpCount} app${s.lowAlpCount !== 1 ? "s" : ""} < $600 ALP — counted at 50% ALP only`}
              className="px-1.5 py-0.5 rounded border text-[9px] font-bold bg-yellow-900/50 border-yellow-700 text-yellow-400"
            >
              ½×{s.lowAlpCount}
            </span>
          )}
          {clawback && clawback.count > 0 && (
            <span
              title={`${clawback.count} cancelled — $${clawback.alp.toLocaleString()} ALP clawed back`}
              className="px-1.5 py-0.5 rounded border text-[9px] font-bold bg-red-900/50 border-red-700 text-red-400"
            >
              CB×{clawback.count}
            </span>
          )}
        </div>
      </td>

      <td className="px-4 py-2.5" onClick={e => e.stopPropagation()}>
        {disabled ? (
          <span className="text-app-text-2 text-sm">{s.hours}</span>
        ) : (
          <input
            type="number"
            value={hoursVal}
            onChange={e => setHoursVal(e.target.value)}
            min={0} max={80} step={0.25}
            onBlur={e => {
              const h = parseFloat(e.target.value);
              if (!isNaN(h) && h !== s.hours) {
                onPatch({ hours: h });
              } else {
                setHoursVal(String(s.hours));
              }
            }}
            className="w-16 bg-app-surface-2 border border-app-border-2 rounded px-2 py-0.5 text-xs text-app-text text-center focus:outline-none focus:ring-1 focus:ring-app-accent"
          />
        )}
      </td>

      <td className="px-4 py-2.5">
        {s.volumeBonus > 0 ? (
          <span className="flex items-center gap-1.5">
            <span className="text-purple-400 font-semibold text-sm">{fmtMoney(s.volumeBonus)}</span>
            {u.subRole === "COO" && (
              <span className="text-[10px] text-amber-700 font-medium">bi-wk</span>
            )}
            {(entry.volumeDQ?.length ?? 0) > 0 && (
              <span className="px-1.5 py-0.5 rounded border text-[9px] font-bold bg-red-900/40 border-red-700/50 text-red-400">
                {entry.volumeDQ!.length} DQ
              </span>
            )}
          </span>
        ) : (
          <span className="text-app-text-5 text-sm">$0.00</span>
        )}
      </td>

      <td className="px-4 py-2.5">
        {s.producerBonus > 0 ? (
          <span className="flex items-center gap-1.5 flex-wrap">
            <span className="text-green-400 font-semibold text-sm">{fmtMoney(s.producerBonus)}</span>
            <span className="text-[10px] text-green-700">
              ${(s.indALP / 1000).toFixed(0)}K ALP
              {clawback && clawback.alp > 0 && (
                <span className="text-red-400 ml-1">(-${(clawback.alp / 1000).toFixed(0)}K)</span>
              )}
            </span>
          </span>
        ) : (
          <span className="text-app-text-5 text-sm">$0.00</span>
        )}
      </td>

      <td className="px-4 py-2.5">
        <span className="text-app-text font-bold text-sm">{fmtMoney(s.total)}</span>
      </td>

      <td className="px-4 py-2.5" onClick={e => e.stopPropagation()}>
        {disabled ? (
          <div className="flex items-center gap-1">
            <span className={`text-xs ${
              (entry.adjustment ?? 0) < 0 ? "text-red-400" : (entry.adjustment ?? 0) > 0 ? "text-green-400" : "text-app-text-5"
            }`}>
              {fmtMoney(entry.adjustment ?? 0)}
            </span>
            {entry.adjustmentNotes && (
              <span className="text-app-text-5 text-[10px]" title={entry.adjustmentNotes}>*</span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1 relative">
            <input
              type="number"
              value={adjustVal}
              onChange={e => setAdjustVal(e.target.value)}
              step={0.01}
              onBlur={e => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v) && v !== (entry.adjustment ?? 0)) {
                  onPatch({ adjustment: v, adjustmentNotes: adjustNotesVal });
                } else {
                  setAdjustVal(String(entry.adjustment ?? 0));
                }
              }}
              className={`w-20 bg-app-surface-2 border border-app-border-2 rounded px-2 py-0.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-app-accent ${
                (entry.adjustment ?? 0) < 0 ? "text-red-400" : (entry.adjustment ?? 0) > 0 ? "text-green-400" : "text-app-text"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowAdjustNotes(!showAdjustNotes)}
              className="text-app-text-5 hover:text-app-text-3 transition"
              title={entry.adjustmentNotes || "Add adjustment note"}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            </button>
            {showAdjustNotes && (
              <div className="absolute top-full left-0 mt-1 z-20 bg-app-surface border border-app-border rounded-lg shadow-lg p-2 w-48">
                <textarea
                  value={adjustNotesVal}
                  onChange={e => setAdjustNotesVal(e.target.value)}
                  onBlur={() => {
                    if (adjustNotesVal !== (entry.adjustmentNotes ?? "")) {
                      onPatch({ adjustment: entry.adjustment ?? 0, adjustmentNotes: adjustNotesVal });
                    }
                    setShowAdjustNotes(false);
                  }}
                  placeholder="Adjustment reason..."
                  rows={2}
                  className="w-full bg-app-surface-2 border border-app-border-2 rounded px-2 py-1 text-xs text-app-text focus:outline-none focus:ring-1 focus:ring-app-accent resize-none"
                  autoFocus
                />
              </div>
            )}
          </div>
        )}
      </td>

      <td className="px-4 py-2.5">
        {twoWeekPay > 0
          ? <span className="text-blue-300 font-semibold text-sm">{fmtMoney(twoWeekPay)}</span>
          : <span className="text-app-text-5 text-sm">$0.00</span>}
      </td>

      <td className="px-4 py-2.5 text-center" onClick={e => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={entry.payrollChecked}
          onChange={e => onPatch({ payrollChecked: e.target.checked })}
          disabled={saving || disabled}
          className="w-4 h-4 accent-green-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        />
      </td>
    </tr>

    {/* Expanded policy detail */}
    {expanded && hasExpandable && policies && onStatusChange && (
      <tr>
        <td colSpan={12} className="p-0">
          <div className="bg-app-surface-2/20 border-b border-app-border px-4 py-3">
            {/* Own Apps */}
            {policies.own.length > 0 && (
              <div className={policies.teamVolume.length > 0 ? "mb-3" : ""}>
                <div className="flex items-center gap-2 mb-1.5">
                  <p className="text-[10px] font-bold text-app-text-4 uppercase tracking-widest">
                    Own Apps — {policies.own.length}
                  </p>
                  {u.role === "manager" && (
                    <span className="text-[10px] text-app-text-5">(App Bonus)</span>
                  )}
                </div>
                <div className="divide-y divide-app-border/30 rounded-lg border border-app-border/40 overflow-hidden bg-app-surface/50">
                  {policies.own.map(c => (
                    <PolicyLineItem
                      key={c.id}
                      client={c}
                      isAdmin={isAdmin}
                      locked={locked}
                      onStatusChange={onStatusChange}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Team Volume (TC only) */}
            {policies.teamVolume.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                    Team Volume — {policies.teamVolume.length} apps
                  </p>
                  <span className="text-[10px] text-purple-500/70">3.5% bonus</span>
                  {(entry.volumeDQ?.length ?? 0) > 0 && (
                    <span className="ml-auto px-2 py-0.5 rounded border text-[9px] font-bold bg-red-900/40 border-red-700/50 text-red-400">
                      {entry.volumeDQ!.length} DQ&rsquo;d
                    </span>
                  )}
                </div>
                <div className="divide-y divide-app-border/30 rounded-lg border border-purple-800/30 overflow-hidden bg-app-surface/50">
                  {policies.teamVolume.map(c => (
                    <PolicyLineItem
                      key={c.id}
                      client={c}
                      showAgent
                      isAdmin={isAdmin}
                      locked={locked}
                      onStatusChange={onStatusChange}
                      isDQ={entry.volumeDQ?.includes(c.id ?? "") ?? false}
                      onToggleDQ={(clientId) => {
                        const prev = entry.volumeDQ ?? [];
                        const next = prev.includes(clientId)
                          ? prev.filter(id => id !== clientId)
                          : [...prev, clientId];
                        onPatch({ volumeDQ: next });
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </td>
      </tr>
    )}
    </>
  );
}

function SectionFooter({ members, stats, label }: {
  members:    UserWithUID[];
  stats:      Record<string, Stats>;
  label:      string;
}) {
  const total        = members.reduce((s, u) => s + (stats[u.uid]?.total || 0), 0);
  const adjustTotal  = members.reduce((s, u) => {
    // adjustments are already baked into stats.total, but we want the raw adjustment column
    // Since we show combined stats, adjustments are already included. We display $0 here.
    return s;
  }, 0);
  return (
    <tr className="border-t border-app-border-2 bg-app-surface-2/40">
      <td colSpan={8} className="px-4 py-2.5 text-right text-xs text-app-text-4 font-semibold uppercase tracking-wider">{label} Total</td>
      <td className="px-4 py-2.5 text-app-text font-bold text-sm">{fmtMoney(total)}</td>
      <td className="px-4 py-2.5" />
      <td className="px-4 py-2.5 text-blue-300 font-bold text-sm">{fmtMoney(total)}</td>
      <td className="px-4 py-2.5 text-center text-xs text-app-text-5" />
    </tr>
  );
}

function PolicyLineItem({ client, showAgent, isAdmin, locked, onStatusChange, isDQ, onToggleDQ }: {
  client: Client;
  showAgent?: boolean;
  isAdmin: boolean;
  locked?: boolean;
  onStatusChange: (clientId: string, field: "agentStatus" | "adminStatus", value: string, fromValue: string) => void;
  isDQ?: boolean;
  onToggleDQ?: (clientId: string) => void;
}) {
  const cid = client.id ?? "";
  const alp = client.annualPremium || 0;
  const disabled = locked || !isAdmin;
  const isSplit = !!client.splitPercent;

  return (
    <div className="flex items-center gap-3 px-3 py-2 text-xs">
      {/* Client info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {showAgent && client.agentName && (
            <span className="text-app-accent font-medium shrink-0">{client.agentName}</span>
          )}
          <span className="text-app-text font-medium truncate">{client.clientName || "—"}</span>
          {isSplit && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-900/40 text-purple-400 border border-purple-700/40 shrink-0">SPLIT</span>
          )}
        </div>
        <div className="text-app-text-5 text-[11px] mt-0.5">
          {[client.carrier, client.state, client.appNumber].filter(Boolean).join(" · ")}
        </div>
      </div>

      {/* ALP */}
      <div className="text-right shrink-0 w-20">
        <span className={`text-app-text font-semibold ${isDQ ? "line-through text-red-400/70" : ""}`}>{fmtMoney(alp)}</span>
        {isSplit && <span className="text-app-text-5 text-[10px] block">50% split</span>}
      </div>

      {/* DQ toggle (team volume records only) */}
      {onToggleDQ && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onToggleDQ(cid); }}
          disabled={disabled}
          className={`shrink-0 px-2 py-0.5 rounded border text-[9px] font-bold transition ${
            isDQ
              ? "bg-red-900/40 border-red-700/50 text-red-400"
              : "bg-app-surface-2 border-app-border-2 text-app-text-5 hover:text-app-text-3 hover:border-app-text-4"
          } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
          title={isDQ ? "Record disqualified from 3.5% volume bonus — click to re-qualify" : "Disqualify from 3.5% volume bonus (sick, vacation, late start)"}
        >
          {isDQ ? "DQ'd" : "DQ"}
        </button>
      )}

      {/* Agent Status */}
      <div className="shrink-0 w-28">
        {disabled ? (
          <span className={`inline-flex px-2 py-0.5 rounded border text-[10px] font-bold ${agentStatusCls(client.agentStatus)}`}>
            {client.agentStatus || "—"}
          </span>
        ) : (
          <select
            value={client.agentStatus || ""}
            onChange={e => onStatusChange(cid, "agentStatus", e.target.value, client.agentStatus || "")}
            className="w-full bg-app-surface-2 border border-app-border-2 rounded px-1.5 py-0.5 text-[11px] text-app-text focus:outline-none focus:ring-1 focus:ring-app-accent cursor-pointer"
          >
            <option value="" disabled>Select...</option>
            {AGENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </div>

      {/* Admin Status */}
      <div className="shrink-0 w-44">
        {disabled ? (
          <span className={`inline-flex px-2 py-0.5 rounded border text-[10px] font-bold truncate max-w-full ${adminStatusCls(client.adminStatus)}`}>
            {client.adminStatus || "—"}
          </span>
        ) : (
          <select
            value={client.adminStatus || ""}
            onChange={e => onStatusChange(cid, "adminStatus", e.target.value, client.adminStatus || "")}
            className="w-full bg-app-surface-2 border border-app-border-2 rounded px-1.5 py-0.5 text-[11px] text-app-text focus:outline-none focus:ring-1 focus:ring-app-accent cursor-pointer"
          >
            <option value="" disabled>Select...</option>
            {ADMIN_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PayrollPage() {
  const claim = useUserClaim();
  const authProfile = claim.profile;
  const [users,         setUsers]         = useState<UserWithUID[]>([]);
  // Week 1 and Week 2 data (for the bi-weekly period)
  const [clients1,      setClients1]      = useState<Client[]>([]);
  const [clients2,      setClients2]      = useState<Client[]>([]);
  const [cancelled1,    setCancelled1]    = useState<Client[]>([]);
  const [cancelled2,    setCancelled2]    = useState<Client[]>([]);
  const [cancelledDebt, setCancelledDebt] = useState<Client[]>([]);
  const [entries1,      setEntries1]      = useState<Record<string, PayrollEntry>>({});
  const [entries2,      setEntries2]      = useState<Record<string, PayrollEntry>>({});
  const { phase, teamNames } = useTeamConfig();
  const [loading,       setLoading]       = useState(true);
  const [savingId,      setSavingId]      = useState<string | null>(null);
  const [importedRows,  setImportedRows]  = useState<(ImportedRow & { docId: string })[]>([]);
  const [viewMode,      setViewMode]      = useState<"live" | "imported">("live");

  // Lock state
  const [lockedPeriod, setLockedPeriod] = useState<PayrollRecord | null>(null);
  const [lockLoading, setLockLoading] = useState(false);

  // Week view toggle: show both weeks combined, or just week 1 / week 2
  const [weekView, setWeekView] = useState<"both" | "week1" | "week2">("both");

  // Pay period state — store the period start date
  const currentPeriod = getPayPeriodForDate(new Date());
  const [periodStart, setPeriodStart] = useState<string>(currentPeriod.start);

  // Derived period info
  const period = useMemo(() => {
    const d = new Date(periodStart + "T12:00:00");
    return getPayPeriodForDate(d);
  }, [periodStart]);

  const [week1, week2] = useMemo(() => getPeriodMondays(period.start), [period.start]);

  // Navigate periods
  const prevPeriod = useCallback(() => {
    const d = new Date(periodStart + "T12:00:00");
    d.setDate(d.getDate() - 14);
    const p = getPayPeriodForDate(d);
    setPeriodStart(p.start);
    setViewMode("live");
    setWeekView("both");
  }, [periodStart]);

  const nextPeriod = useCallback(() => {
    const d = new Date(periodStart + "T12:00:00");
    d.setDate(d.getDate() + 14);
    const p = getPayPeriodForDate(d);
    setPeriodStart(p.start);
    setViewMode("live");
    setWeekView("both");
  }, [periodStart]);

  // ── Load all users + settings once auth resolves ─────────────────────────
  useEffect(() => {
    if (claim.loading || !claim.uid) return;
    getDocs(collection(db, "users")).then((usersSnap) => {
      setUsers(
        usersSnap.docs
          .filter(d => (d.data() as UserProfile).active !== false)
          .map(d => ({ uid: d.id, ...(d.data() as UserProfile) }))
      );
    }).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claim.loading, claim.uid]);

  // ── Load lock state for current period ───────────────────────────────────
  useEffect(() => {
    if (!period.start) return;
    const unsub = onSnapshot(
      doc(db, "payrollRecords", period.start),
      snap => {
        if (snap.exists()) {
          setLockedPeriod(snap.data() as PayrollRecord);
        } else {
          setLockedPeriod(null);
        }
      },
      console.error,
    );
    return () => unsub();
  }, [period.start]);

  // ── Approved clients for week 1 (real-time) ─────────────────────────────
  useEffect(() => {
    if (!week1) return;
    setLoading(true);
    const unsub1 = onSnapshot(
      query(collection(db, "clients"), where("weekStart", "==", week1), where("agentStatus", "==", "Approved")),
      snap => {
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Client));
        setClients1(phase === "testing" ? all.filter(c => c.createdBy !== "csv-import") : all);
        setLoading(false);
      },
      err => { console.error(err); setLoading(false); },
    );
    const unsub1c = onSnapshot(
      query(collection(db, "clients"), where("weekStart", "==", week1), where("agentStatus", "==", "Cancelled")),
      snap => { setCancelled1(snap.docs.map(d => ({ id: d.id, ...d.data() } as Client))); },
      () => {},
    );
    return () => { unsub1(); unsub1c(); };
  }, [week1, phase]);

  // ── Approved + Cancelled clients for week 2 (real-time) ────────────────
  useEffect(() => {
    if (!week2) return;
    const unsub2 = onSnapshot(
      query(collection(db, "clients"), where("weekStart", "==", week2), where("agentStatus", "==", "Approved")),
      snap => {
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Client));
        setClients2(phase === "testing" ? all.filter(c => c.createdBy !== "csv-import") : all);
      },
      err => { console.error(err); },
    );
    const unsub2c = onSnapshot(
      query(collection(db, "clients"), where("weekStart", "==", week2), where("agentStatus", "==", "Cancelled")),
      snap => { setCancelled2(snap.docs.map(d => ({ id: d.id, ...d.data() } as Client))); },
      () => {},
    );
    return () => { unsub2(); unsub2c(); };
  }, [week2, phase]);

  // ── Cancelled debt — all cancelled policies within past year (outside current period) ──
  useEffect(() => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    oneYearAgo.setHours(12, 0, 0, 0);
    const cutoff = `${oneYearAgo.getFullYear()}-${String(oneYearAgo.getMonth() + 1).padStart(2, "0")}-${String(oneYearAgo.getDate()).padStart(2, "0")}`;
    const unsub = onSnapshot(
      query(collection(db, "clients"), where("agentStatus", "==", "Cancelled")),
      snap => {
        const all = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as Client))
          .filter(c => c.date >= cutoff)
          .filter(c => c.weekStart !== week1 && c.weekStart !== week2);
        setCancelledDebt(phase === "testing" ? all.filter(c => c.createdBy !== "csv-import") : all);
      },
      () => {},
    );
    return () => unsub();
  }, [week1, week2, phase]);

  // ── Payroll entries for week 1 (real-time) ───────────────────────────────
  useEffect(() => {
    if (!week1) return;
    const unsub = onSnapshot(
      collection(db, "payroll", week1, "entries"),
      snap => {
        const m: Record<string, PayrollEntry> = {};
        snap.docs.forEach(d => { m[d.id] = d.data() as PayrollEntry; });
        setEntries1(m);
      },
      console.error,
    );
    return () => unsub();
  }, [week1]);

  // ── Payroll entries for week 2 (real-time) ───────────────────────────────
  useEffect(() => {
    if (!week2) return;
    const unsub = onSnapshot(
      collection(db, "payroll", week2, "entries"),
      snap => {
        const m: Record<string, PayrollEntry> = {};
        snap.docs.forEach(d => { m[d.id] = d.data() as PayrollEntry; });
        setEntries2(m);
      },
      console.error,
    );
    return () => unsub();
  }, [week2]);

  // ── Imported rows (historical CSV data for week 1) ───────────────────────
  useEffect(() => {
    if (!week1) return;
    const unsub = onSnapshot(
      collection(db, "payroll", week1, "imported"),
      snap => {
        const rows = snap.docs.map(d => ({ docId: d.id, ...(d.data() as ImportedRow) }));
        setImportedRows(rows);
        if (rows.length > 0 && week1 < currentMonday() && viewMode === "live") {
          setViewMode("imported");
        }
      },
      console.error,
    );
    return () => unsub();
  }, [week1]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Save / merge entry fields ─────────────────────────────────────────────
  async function toggleImportedPaid(docId: string, current: boolean) {
    try {
      await updateDoc(doc(db, "payroll", week1, "imported", docId), { paid: !current });
    } catch (err) { console.error(err); }
  }

  async function patchEntry(weekStart: string, entriesMap: Record<string, PayrollEntry>, uid: string, patch: Partial<PayrollEntry>) {
    if (lockedPeriod?.locked) return; // prevent edits when locked
    setSavingId(uid);
    const base: PayrollEntry = entriesMap[uid] ?? { hours: DEFAULT_HOURS, payrollChecked: false };
    try {
      await setDoc(doc(db, "payroll", weekStart, "entries", uid), { ...base, ...patch });

      // Audit log — write one entry per changed field
      if (authProfile) {
        const editedBy = `${authProfile.firstName} ${authProfile.lastName}`;
        const target = users.find(u => u.uid === uid);
        const userName = target ? `${target.firstName} ${target.lastName}` : uid;
        const logRef = collection(db, "payroll", weekStart, "editLog");
        for (const key of Object.keys(patch) as (keyof PayrollEntry)[]) {
          const from = base[key];
          const to = patch[key];
          if (JSON.stringify(from) === JSON.stringify(to)) continue;
          addDoc(logRef, {
            uid,
            userName,
            field: key,
            fromValue: from ?? null,
            toValue: to ?? null,
            editedBy,
            editedByUid: claim.uid,
            createdAt: serverTimestamp(),
          }).catch(console.error);
        }
      }
    } catch (err) { console.error(err); }
    finally { setSavingId(null); }
  }

  // ── Status change handler (inline edit from expanded rows) ────────────────
  async function handleStatusChange(clientId: string, field: "agentStatus" | "adminStatus", value: string, fromValue: string) {
    if (lockedPeriod?.locked || !authProfile) return;
    const updaterName = `${authProfile.firstName} ${authProfile.lastName}`;
    const changeEntry = {
      at: { seconds: Math.floor(Date.now() / 1000) },
      by: updaterName,
      field,
      from: fromValue,
      to: value,
    };

    try {
      // 1. Update client document
      await updateDoc(doc(db, "clients", clientId), {
        [field]: value,
        updatedAt: serverTimestamp(),
        updatedByName: updaterName,
        changeLog: arrayUnion(changeEntry),
      });

      // 2. Audit log for status change
      const allC0 = [...clients1, ...clients2];
      const logClient = allC0.find(c => c.id === clientId);
      if (logClient) {
        const ws = logClient.weekStart || activePatchWeek;
        addDoc(collection(db, "payroll", ws, "editLog"), {
          uid: logClient.agentId || "",
          userName: logClient.agentName || "",
          field,
          fromValue,
          toValue: value,
          clientId,
          clientName: logClient.clientName || "",
          editedBy: updaterName,
          editedByUid: claim.uid,
          createdAt: serverTimestamp(),
        }).catch(console.error);
      }

      // 3. Auto-clawback on cancellation
      const isAgentCancel = field === "agentStatus" && value === "Cancelled" && fromValue !== "Cancelled";
      const isAdminCancel = field === "adminStatus" && CANCEL_ADMIN_STATUSES.includes(value) && !CANCEL_ADMIN_STATUSES.includes(fromValue);

      if (isAgentCancel || isAdminCancel) {
        const allC = [...clients1, ...clients2];
        const clientDoc = allC.find(c => c.id === clientId);
        if (clientDoc) {
          const alp = Number(clientDoc.annualPremium ?? 0);
          const agentUid = String(clientDoc.agentId ?? "");
          const clientName = String(clientDoc.clientName ?? "Unknown");
          const appNum = String(clientDoc.appNumber ?? "");
          const teamNum = Number(clientDoc.agentTeamNumber ?? 0);
          const statusLabel = isAdminCancel ? value : "cancelled";
          const note = `Clawback: ${clientName} - ${appNum} ${statusLabel}`;
          const ws = getWeekStart(new Date());

          // Rep adjustment (-$50 app bonus)
          if (agentUid && !agentUid.startsWith("pending:")) {
            const entryRef = doc(db, "payroll", ws, "entries", agentUid);
            const entrySnap = await getDoc(entryRef);
            const existing = entrySnap.exists() ? entrySnap.data() : {};
            const prevAdj = Number(existing.adjustment ?? 0);
            const prevNotes = String(existing.adjustmentNotes ?? "");
            await setDoc(entryRef, {
              ...existing,
              adjustment: prevAdj + (-50),
              adjustmentNotes: prevNotes ? `${prevNotes}; ${note}` : note,
            }, { merge: true });
          }

          // TC adjustment (-3.5% of ALP)
          if (teamNum > 0) {
            const tcSnap = await getDocs(query(collection(db, "users"), where("teamNumber", "==", teamNum), where("role", "==", "manager")));
            for (const tcDoc of tcSnap.docs) {
              const tcUid = tcDoc.id;
              const tcAdj = -(alp * 0.035);
              const tcEntryRef = doc(db, "payroll", ws, "entries", tcUid);
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
      }

      // 4. Create status change notification (agentStatus changes only)
      if (field === "agentStatus") {
        const allC = [...clients1, ...clients2];
        const clientDoc = allC.find(c => c.id === clientId);
        if (clientDoc) {
          const teamNum = Number(clientDoc.agentTeamNumber ?? 0);
          const tcUser = teamNum > 0 ? users.find(usr => usr.role === "manager" && usr.teamNumber === teamNum) : undefined;
          const visibleToUids = [clientDoc.agentId, tcUser?.uid].filter(Boolean) as string[];

          await addDoc(collection(db, "payrollNotifications"), {
            type: "statusChange",
            clientId,
            clientName: clientDoc.clientName || "Unknown",
            carrier: clientDoc.carrier || "",
            appNumber: clientDoc.appNumber || "",
            field,
            fromValue,
            toValue: value,
            changedBy: updaterName,
            changedByUid: claim.uid,
            agentId: clientDoc.agentId || "",
            agentName: clientDoc.agentName || "",
            teamNumber: teamNum,
            createdAt: serverTimestamp(),
            visibleTo: ["owner", "developer", "admin"],
            visibleToUids,
          });
        }
      }
    } catch (err) {
      console.error("[Payroll] Status change failed:", err);
    }
  }

  // ── Lock / Unlock handlers ────────────────────────────────────────────────
  async function lockPeriod() {
    if (!authProfile || lockLoading) return;
    setLockLoading(true);
    try {
      const rows: PayrollRecordRow[] = payrollUsers.map(u => {
        const s = combinedStats[u.uid] || EMPTY_STATS;
        const e1 = entries1[u.uid];
        const e2 = entries2[u.uid];
        const dqIds = [...(e1?.volumeDQ ?? []), ...(e2?.volumeDQ ?? [])];
        const dqSet = new Set(dqIds);

        // Snapshot all policies that count toward this person's pay
        const ownClients = allClients.filter(c => c.agentId === u.uid);
        const teamVolumeClients = u.role === "manager" && u.teamNumber
          ? allClients.filter(c => c.agentTeamNumber === u.teamNumber && c.agentId !== u.uid)
          : [];
        const allPolicies = [...ownClients, ...teamVolumeClients];
        const policies: PayrollRecordPolicy[] = allPolicies.map(c => ({
          clientId: c.id ?? "",
          clientName: c.clientName || "",
          carrier: c.carrier || "",
          appNumber: c.appNumber || "",
          annualPremium: c.annualPremium || 0,
          agentStatus: c.agentStatus || "",
          adminStatus: c.adminStatus || "",
          splitPercent: c.splitPercent || 0,
          agentTeamNumber: c.agentTeamNumber || 0,
          isDQ: c.id ? dqSet.has(c.id) : false,
        }));

        return {
          uid: u.uid,
          name: `${u.firstName} ${u.lastName}`,
          contractorId: u.contractorId || "",
          teamNumber: u.teamNumber || 0,
          role: roleLabel(u).text,
          base: s.base,
          appBonus: s.appBonus,
          appCount: s.appCount,
          hours: s.hours,
          volumeBonus: s.volumeBonus,
          producerBonus: s.producerBonus,
          adjustment: (e1?.adjustment || 0) + (e2?.adjustment || 0),
          adjustmentNotes: [e1?.adjustmentNotes, e2?.adjustmentNotes].filter(Boolean).join("; "),
          total: s.total,
          volumeDQ: dqIds,
          policies,
        };
      });

      const totalPayroll = rows.reduce((s, r) => s + r.total, 0);

      await setDoc(doc(db, "payrollRecords", period.start), {
        periodStart: period.start,
        periodEnd: period.end,
        payday: period.payday,
        locked: true,
        lockedAt: serverTimestamp(),
        lockedBy: `${authProfile.firstName} ${authProfile.lastName}`,
        lockedByUid: claim.uid,
        paid: false,
        totalPayroll,
        rows,
      });

      // Notify owners and developers that payroll is locked & ready for review
      await addDoc(collection(db, "payrollNotifications"), {
        type: "locked",
        periodStart: period.start,
        periodEnd: period.end,
        payday: period.payday,
        totalPayroll,
        employeeCount: rows.length,
        lockedBy: `${authProfile.firstName} ${authProfile.lastName}`,
        createdAt: serverTimestamp(),
        visibleTo: ["owner", "developer"],
      });
    } catch (err) {
      console.error("Failed to lock period:", err);
    } finally {
      setLockLoading(false);
    }
  }

  async function unlockPeriod() {
    if (!authProfile || lockLoading) return;
    setLockLoading(true);
    try {
      await updateDoc(doc(db, "payrollRecords", period.start), {
        locked: false,
      });
    } catch (err) {
      console.error("Failed to unlock period:", err);
    } finally {
      setLockLoading(false);
    }
  }

  async function markAsPaid() {
    if (!authProfile || lockLoading || !lockedPeriod) return;
    setLockLoading(true);
    try {
      const now = new Date();
      await updateDoc(doc(db, "payrollRecords", period.start), {
        paid: true,
        paidAt: serverTimestamp(),
      });

      // Generate payroll PDF for records
      const blob = generatePayrollPDF({
        periodStart: period.start,
        periodEnd: period.end,
        payday: period.payday,
        rows: lockedPeriod.rows,
        totalPayroll: lockedPeriod.totalPayroll,
        lockedBy: lockedPeriod.lockedBy,
        lockedAt: lockedPeriod.lockedAt
          ? new Date((lockedPeriod.lockedAt as { seconds: number }).seconds * 1000)
          : now,
        paidAt: now,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payroll-register-${period.start}-to-${period.end}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      // Notify that payroll was paid
      await addDoc(collection(db, "payrollNotifications"), {
        type: "paid",
        periodStart: period.start,
        periodEnd: period.end,
        payday: period.payday,
        totalPayroll: lockedPeriod.totalPayroll,
        employeeCount: lockedPeriod.rows.length,
        paidBy: `${authProfile.firstName} ${authProfile.lastName}`,
        createdAt: serverTimestamp(),
        visibleTo: ["owner", "developer"],
      });
    } catch (err) {
      console.error("Failed to mark as paid:", err);
    } finally {
      setLockLoading(false);
    }
  }

  // ── Lookup map ────────────────────────────────────────────────────────────
  const usersMap = useMemo(() => {
    const m: Record<string, UserWithUID> = {};
    users.forEach(u => { m[u.uid] = u; });
    return m;
  }, [users]);

  // ── Combined clients for the period ───────────────────────────────────────
  const allClients = useMemo(() => [...clients1, ...clients2], [clients1, clients2]);

  // ── Team ALP (combined both weeks) ────────────────────────────────────────
  const teamALP1 = useMemo(() => computeTeamALP(clients1, usersMap, week1), [clients1, usersMap, week1]);
  const teamALP2 = useMemo(() => computeTeamALP(clients2, usersMap, week2), [clients2, usersMap, week2]);
  const teamALP = useMemo(() => {
    const m: Record<number, number> = {};
    const allKeys = new Set([...Object.keys(teamALP1), ...Object.keys(teamALP2)].map(Number));
    allKeys.forEach(k => { m[k] = (teamALP1[k] || 0) + (teamALP2[k] || 0); });
    return m;
  }, [teamALP1, teamALP2]);

  const companyTotalALP1 = useMemo(() =>
    clients1.reduce((s, c) => s + (c.annualPremium || 0), 0), [clients1]);
  const companyTotalALP2 = useMemo(() =>
    clients2.reduce((s, c) => s + (c.annualPremium || 0), 0), [clients2]);

  // Exclude hideFromPayroll users from all calculations (e.g. COO)
  const payrollUsers = useMemo(() => users.filter(u => !u.hideFromPayroll), [users]);

  // ── Per-person calculations (per week, then combined) ─────────────────────
  const stats1 = useMemo(
    () => computeStats(payrollUsers, clients1, entries1, teamALP1, companyTotalALP1, week1),
    [payrollUsers, clients1, entries1, teamALP1, companyTotalALP1, week1],
  );
  const stats2 = useMemo(
    () => computeStats(payrollUsers, clients2, entries2, teamALP2, companyTotalALP2, week2),
    [payrollUsers, clients2, entries2, teamALP2, companyTotalALP2, week2],
  );

  // Per-user clawback tracking (cancelled policies in this period)
  const clawbacks = useMemo(() => {
    const allCancelled = [...cancelled1, ...cancelled2];
    const m: Record<string, { count: number; alp: number }> = {};
    allCancelled.forEach(c => {
      const uid = c.agentId;
      if (!uid) return;
      if (!m[uid]) m[uid] = { count: 0, alp: 0 };
      m[uid].count++;
      m[uid].alp += c.annualPremium || 0;
    });
    return m;
  }, [cancelled1, cancelled2]);

  // Combined stats for the full pay period
  const combinedStats = useMemo(() => {
    const m: Record<string, Stats> = {};
    const allUids = new Set([...Object.keys(stats1), ...Object.keys(stats2)]);
    allUids.forEach(uid => {
      m[uid] = mergeStats(stats1[uid] || EMPTY_STATS, stats2[uid] || EMPTY_STATS);
    });
    return m;
  }, [stats1, stats2]);

  // Combined entries (merge both weeks — use week1 entry for payrollChecked / adjustment display)
  const combinedEntries = useMemo(() => {
    const m: Record<string, PayrollEntry> = {};
    const allUids = new Set([...Object.keys(entries1), ...Object.keys(entries2)]);
    payrollUsers.forEach(u => allUids.add(u.uid));
    allUids.forEach(uid => {
      const e1 = entries1[uid] ?? { hours: DEFAULT_HOURS, payrollChecked: false };
      const e2 = entries2[uid] ?? { hours: DEFAULT_HOURS, payrollChecked: false };
      m[uid] = {
        hours: (e1.hours ?? DEFAULT_HOURS) + (e2.hours ?? DEFAULT_HOURS),
        payrollChecked: e1.payrollChecked || e2.payrollChecked,
        adjustment: (e1.adjustment || 0) + (e2.adjustment || 0),
        adjustmentNotes: [e1.adjustmentNotes, e2.adjustmentNotes].filter(Boolean).join("; "),
        baseManual: e1.baseManual != null || e2.baseManual != null
          ? (e1.baseManual ?? 0) + (e2.baseManual ?? 0)
          : undefined,
        volumeDQ: [...(e1.volumeDQ ?? []), ...(e2.volumeDQ ?? [])],
      };
    });
    return m;
  }, [entries1, entries2, payrollUsers]);

  // ── Active stats/entries based on week view toggle ─────────────────────
  const activeStats = weekView === "week1" ? stats1 : weekView === "week2" ? stats2 : combinedStats;
  const activeEntries = weekView === "week1" ? entries1 : weekView === "week2" ? entries2 : combinedEntries;
  const activeTeamALP = weekView === "week1" ? teamALP1 : weekView === "week2" ? teamALP2 : teamALP;
  const activeClients = weekView === "week1" ? clients1 : weekView === "week2" ? clients2 : allClients;
  const activePatchWeek = weekView === "week2" ? week2 : week1;
  const activePatchEntries = weekView === "week2" ? entries2 : entries1;

  // Per-user policies: own apps (app bonus) + team volume apps (TC 3.5% bonus)
  const userPolicies = useMemo(() => {
    const m: Record<string, { own: Client[]; teamVolume: Client[] }> = {};
    payrollUsers.forEach(u => {
      const own = activeClients.filter(c => c.agentId === u.uid);
      const teamVolume = u.role === "manager" && u.teamNumber
        ? activeClients.filter(c => c.agentTeamNumber === u.teamNumber && c.agentId !== u.uid)
        : [];
      m[u.uid] = { own, teamVolume };
    });
    return m;
  }, [payrollUsers, activeClients]);

  // ── Summary totals ────────────────────────────────────────────────────────
  const totalPayroll = useMemo(() =>
    Object.values(activeStats).reduce((s, p) => s + p.total, 0), [activeStats]);
  const totalSubmit = useMemo(() =>
    Object.values(activeTeamALP).reduce((s, v) => s + v, 0), [activeTeamALP]);
  const totalApps = useMemo(() => activeClients.length, [activeClients]);
  const totalChecked = useMemo(() =>
    Object.values(activeEntries).filter(e => e.payrollChecked).length, [activeEntries]);

  // ── Groupings ─────────────────────────────────────────────────────────────
  const staffList = useMemo(() =>
    users.filter(u => isAdminLevel(u.role) && u.role !== "developer" && !u.hideFromPayroll), [users]);

  const devList = useMemo(() =>
    users.filter(u => u.role === "developer"), [users]);

  const isOwnerViewer = authProfile?.role === "owner" || authProfile?.role === "developer";
  const cooList = useMemo(() =>
    isOwnerViewer ? users.filter(u => u.hideFromPayroll) : [],
  [users, isOwnerViewer]);

  const teamNums = useMemo(() => {
    const s = new Set<number>();
    users.forEach(u => {
      if (!isAdminLevel(u.role) && !u.hideFromPayroll && u.teamNumber) s.add(u.teamNumber);
    });
    return Array.from(s).sort((a, b) => a - b);
  }, [users]);

  function teamMembers(t: number): UserWithUID[] {
    return users
      .filter(u => u.teamNumber === t && !isAdminLevel(u.role) && !u.hideFromPayroll)
      .sort((a, b) => {
        if (a.role === "manager" && b.role !== "manager") return -1;
        if (b.role === "manager" && a.role !== "manager") return  1;
        return (a.firstName + a.lastName).localeCompare(b.firstName + b.lastName);
      });
  }

  // ── Lock / permission helpers ─────────────────────────────────────────────
  const isLocked = lockedPeriod?.locked === true;
  const isPaid = lockedPeriod?.paid === true;
  const canLock = isAdminLevel(authProfile?.role); // admin/owner/dev can lock
  const canUnlock = authProfile?.role === "developer";
  const canMarkPaid = authProfile?.role === "owner" || authProfile?.role === "developer";

  // ── Access guard ──────────────────────────────────────────────────────────
  if (authProfile?.role === "rep") {
    return (
      <div className="min-h-full bg-app-bg overflow-y-auto flex items-center justify-center">
        <p className="text-app-text-4 text-sm">Access restricted.</p>
      </div>
    );
  }

  const isAdminUser = isAdminLevel(authProfile?.role);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-app-bg min-h-full p-8 overflow-y-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-app-text">Payroll</h1>
          <p className="text-app-text-3 text-sm mt-1">
            {fmtPeriodRange(period.start, period.end)}
          </p>
          <p className="text-app-text-5 text-xs mt-0.5">
            Payday: {fmtShortDate(period.payday)}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">

          {/* Lock / Unlock / Paid buttons */}
          {canLock && !isLocked && (
            <button
              type="button"
              onClick={lockPeriod}
              disabled={lockLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              {lockLoading ? "Locking..." : "Lock Period"}
            </button>
          )}

          {isLocked && !isPaid && canMarkPaid && (
            <button
              type="button"
              onClick={markAsPaid}
              disabled={lockLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
            >
              Mark as Paid
            </button>
          )}

          {isLocked && canUnlock && (
            <button
              type="button"
              onClick={unlockPeriod}
              disabled={lockLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/80 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              Unlock
            </button>
          )}

          {isLocked && lockedPeriod && (
            <>
              <button
                type="button"
                onClick={() => exportPayrollCSV(period.start, period.end, lockedPeriod.rows)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-app-accent hover:bg-app-accent-hover text-white text-xs font-semibold rounded-lg transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Export CSV
              </button>
              {isPaid && (
                <button
                  type="button"
                  onClick={() => {
                    const blob = generatePayrollPDF({
                      periodStart: period.start,
                      periodEnd: period.end,
                      payday: period.payday,
                      rows: lockedPeriod.rows,
                      totalPayroll: lockedPeriod.totalPayroll,
                      lockedBy: lockedPeriod.lockedBy,
                      lockedAt: lockedPeriod.lockedAt
                        ? new Date((lockedPeriod.lockedAt as { seconds: number }).seconds * 1000)
                        : new Date(),
                      paidAt: lockedPeriod.paidAt
                        ? new Date((lockedPeriod.paidAt as { seconds: number }).seconds * 1000)
                        : new Date(),
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `payroll-register-${period.start}-to-${period.end}.pdf`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  Download PDF
                </button>
              )}
            </>
          )}

          {/* View mode toggle */}
          {importedRows.length > 0 && (
            <div className="flex items-center bg-app-surface-2 rounded-lg p-0.5 border border-app-border-2">
              {(["live", "imported"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                    viewMode === m ? "bg-app-surface-2 text-app-text" : "text-app-text-4 hover:text-app-text-2"
                  }`}
                >
                  {m === "live" ? "Live" : "Historical"}
                </button>
              ))}
            </div>
          )}

          {/* Period picker */}
          <div className="flex items-center gap-1 bg-app-surface-2 border border-app-border-2 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={prevPeriod}
              className="px-3 py-1.5 text-app-text-3 hover:text-app-text hover:bg-app-surface-2 transition"
              title="Previous pay period"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <select
              value={period.start}
              onChange={e => { setPeriodStart(e.target.value); setViewMode("live"); setWeekView("both"); }}
              className="bg-transparent text-app-text text-sm font-medium text-center appearance-none cursor-pointer px-2 py-1.5 min-w-50 focus:outline-none"
              title="Jump to a pay period"
            >
              {(() => {
                // Generate all periods from Jan 2025 to 6 months ahead
                const periods: { start: string; end: string }[] = [];
                const earliest = new Date("2025-01-01T12:00:00");
                const latest = new Date();
                latest.setMonth(latest.getMonth() + 6);
                let d = new Date(earliest);
                while (d <= latest) {
                  const p = getPayPeriodForDate(d);
                  if (!periods.find(x => x.start === p.start)) periods.push(p);
                  d = new Date(d.getTime() + 14 * 86400000);
                }
                // Sort newest first
                periods.sort((a, b) => b.start.localeCompare(a.start));
                return periods.map(p => (
                  <option key={p.start} value={p.start}>
                    {fmtPeriodRange(p.start, p.end)}
                  </option>
                ));
              })()}
            </select>
            <button
              type="button"
              onClick={nextPeriod}
              className="px-3 py-1.5 text-app-text-3 hover:text-app-text hover:bg-app-surface-2 transition"
              title="Next pay period"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          {/* Week view picker */}
          <div className="flex items-center bg-app-surface-2 rounded-lg p-0.5 border border-app-border-2">
            {([
              { key: "both" as const, label: "Both Weeks" },
              { key: "week1" as const, label: `Wk 1 · ${fmtShortDate(week1)}` },
              { key: "week2" as const, label: `Wk 2 · ${fmtShortDate(week2)}` },
            ]).map(w => (
              <button
                key={w.key}
                onClick={() => setWeekView(w.key)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition whitespace-nowrap ${
                  weekView === w.key
                    ? "bg-app-accent/15 text-app-accent border border-app-accent/30"
                    : "text-app-text-4 hover:text-app-text-2"
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lock status banner */}
      {isLocked && lockedPeriod && (
        <div className={`mb-4 px-4 py-3 rounded-xl border flex items-center justify-between ${
          isPaid
            ? "bg-green-900/20 border-green-700/50"
            : "bg-amber-900/20 border-amber-700/50"
        }`}>
          <div className="flex items-center gap-3">
            {isPaid ? (
              <span className="px-2.5 py-1 rounded-md bg-green-600 text-white text-xs font-bold uppercase tracking-wider">PAID</span>
            ) : (
              <span className="px-2.5 py-1 rounded-md bg-amber-600 text-white text-xs font-bold uppercase tracking-wider">LOCKED</span>
            )}
            <div>
              <span className={`text-sm font-medium ${isPaid ? "text-green-300" : "text-amber-300"}`}>
                {isPaid ? "Period paid" : "Pending Payment"}
              </span>
              <span className="text-app-text-5 text-xs ml-2">
                Locked by {lockedPeriod.lockedBy} on {fmtFullDate(lockedPeriod.lockedAt)}
              </span>
              {isPaid && lockedPeriod.paidAt && (
                <span className="text-app-text-5 text-xs ml-2">
                  | Paid {fmtFullDate(lockedPeriod.paidAt)}
                </span>
              )}
            </div>
          </div>
          <span className="text-app-text-3 text-sm font-semibold">
            Total: {fmtMoney(lockedPeriod.totalPayroll)}
          </span>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-3">
            {[
              { label: weekView === "both" ? "Period Payroll" : weekView === "week1" ? `Week 1 Payroll · ${fmtShortDate(week1)}` : `Week 2 Payroll · ${fmtShortDate(week2)}`, value: fmtMoney(totalPayroll), accent: "text-app-text" },
              ...(weekView === "both" ? [
                { label: "Week 1 Payroll",   value: fmtMoney(Object.values(stats1).reduce((s, p) => s + p.total, 0)), accent: "text-app-text-3" },
                { label: "Week 2 Payroll",   value: fmtMoney(Object.values(stats2).reduce((s, p) => s + p.total, 0)), accent: "text-app-text-3" },
              ] : [
                { label: "Approved Apps", value: String(totalApps), accent: "text-green-400" },
                { label: "Total ALP Submit", value: fmtMoney(totalSubmit), accent: "text-app-accent" },
              ]),
            ].map(c => (
              <div key={c.label} className="bg-app-surface border border-app-border rounded-xl px-5 py-4">
                <p className="text-app-text-4 text-xs uppercase tracking-wider font-medium mb-1">{c.label}</p>
                <p className={`text-2xl font-bold ${c.accent}`}>{c.value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            {[
              { label: "Total ALP Submit", value: fmtMoney(totalSubmit),   accent: "text-app-accent" },
              { label: "Approved Apps",    value: String(totalApps),        accent: "text-green-400" },
              { label: "Paid Out",         value: `${totalChecked} / ${users.length}`, accent: "text-app-text-2" },
            ].map(c => (
              <div key={c.label} className="bg-app-surface border border-app-border rounded-xl px-5 py-4">
                <p className="text-app-text-4 text-xs uppercase tracking-wider font-medium mb-1">{c.label}</p>
                <p className={`text-2xl font-bold ${c.accent}`}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* Team ALP summary pills */}
          {teamNums.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {teamNums.map(t => (
                <div key={t} className="flex items-center gap-2.5 bg-app-surface border border-app-border rounded-lg px-3 py-1.5">
                  <span className="text-app-text-4 text-xs font-medium">Team {t} Submit</span>
                  <span className="text-app-text text-sm font-bold">{fmtMoney(activeTeamALP[t] || 0)}</span>
                </div>
              ))}
            </div>
          )}

          {/* App Bonus Tier Reference — always visible */}
          <div className="flex flex-wrap items-center gap-2 mb-7 px-4 py-3 bg-app-surface border border-app-border rounded-xl">
            <span className="text-[10px] font-semibold text-app-text-5 uppercase tracking-widest mr-1 shrink-0">App Bonus Tiers</span>
            {[
              { label: "T1", range: "1-5 apps", rate: "$50/app",  cls: "border-blue-800   bg-blue-900/30   text-blue-400"   },
              { label: "T2", range: "6-10 apps", rate: "$100/app", cls: "border-purple-800 bg-purple-900/30 text-purple-400" },
              { label: "T3", range: "11+ apps",  rate: "$150/app", cls: "border-green-800  bg-green-900/30  text-green-400"  },
            ].map(t => (
              <div key={t.label} className={`flex items-center gap-1.5 border rounded-lg px-2.5 py-1 ${t.cls}`}>
                <span className="text-[10px] font-bold uppercase">{t.label}</span>
                <span className="text-app-text-4 text-[10px]">{t.range}</span>
                <span className="text-xs font-semibold">{t.rate}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 border border-emerald-800 bg-emerald-900/20 rounded-lg px-2.5 py-1 text-emerald-400">
              <span className="text-xs font-semibold">+$200</span>
              <span className="text-app-text-4 text-[10px]">producer bonus &ge; $20K ALP</span>
            </div>
            <div className="flex items-center gap-1.5 border border-yellow-800 bg-yellow-900/20 rounded-lg px-2.5 py-1 text-yellow-400">
              <span className="text-[10px] font-bold">&lt; $600 ALP</span>
              <span className="text-app-text-4 text-[10px]">&rarr; &frac12; team ALP credit (auto)</span>
            </div>
          </div>

      {/* Pay structure reference */}
      <details className="mb-7 group">
          <summary className="flex items-center gap-2 cursor-pointer text-xs text-app-text-5 hover:text-app-text-3 transition select-none w-fit">
            <svg className="w-3.5 h-3.5 group-open:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            Pay structure reference
          </summary>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                title: "CSR (Rep)", border: "border-app-border-2",
                lines: ["Base: $650 / 40 hrs (pro-rated)", "T1: 1-5 apps -> $50/app", "T2: 6-10 apps -> $100/app", "T3: 11+ apps -> $150/app", "Producer bonus: +$200 at >= $20K ALP", "< $600 ALP app -> 1/2 team ALP credit (auto)", "Half-credit (1/2) toggle: admin can halve app bonus count"],
              },
              {
                title: "TL - Team Lead (licensed Rep)", border: "border-orange-800",
                lines: ["Base: $680 / 40 hrs (pro-rated)", "Same T1/T2/T3 app bonus tiers as CSR", "Producer bonus: +$200 at >= $20K ALP", "Team retains 100% ALP when TL writes own client", "Tag set in Users page - no leadership role"],
              },
              {
                title: "TC (Manager)", border: "border-blue-800",
                lines: ["No base - volume bonus only", "Same T1/T2/T3 app bonus tiers as CSR", "Volume bonus: 3.5% of team approved ALP x (hrs/40)", "Cross-team split: 50% ALP to each team", "< $600 ALP app -> 1/2 team ALP credit (auto)", "Producer bonus: +$200 at >= $20K ALP"],
              },
              {
                title: "Staff (Admin)", border: "border-purple-800",
                lines: ["Base: $25/hr x hours worked (editable override)", "No app or volume bonuses"],
              },
              {
                title: "COO - Cyruss Wright", border: "border-amber-800",
                lines: ["Bi-weekly pay based on company total ALP", "$0K-$199K -> $2,850", "$200K-$249K -> $3,100", "$250K-$299K -> $3,500", "$300K-$349K -> $4,000", "$350K-$399K -> $5,000", "$400K+ -> $6,000"],
              },
            ].map(b => (
              <div key={b.title} className={`bg-app-surface border ${b.border} rounded-lg px-4 py-3`}>
                <p className="text-app-text text-xs font-semibold mb-2">{b.title}</p>
                {b.lines.map(l => <p key={l} className="text-app-text-4 text-xs leading-5">· {l}</p>)}
              </div>
            ))}
          </div>
      </details>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="w-7 h-7" />
        </div>
      ) : viewMode === "imported" ? (
        /* ── Historical / imported view ─────────────────────────────────── */
        <>
          {Array.from(new Set(importedRows.map(r => r.section))).map(sec => {
            const secRows  = importedRows.filter(r => r.section === sec);
            const secTotal = secRows.reduce((s, r) => s + r.total, 0);
            const paidCnt  = secRows.filter(r => r.paid).length;
            return (
              <Section
                key={sec}
                title={sec}
                badge={
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-app-text-5">
                      <span className="text-app-text font-semibold">{paidCnt}</span>/{secRows.length} paid
                    </span>
                    <span className="text-app-text-5">
                      Payroll: <span className="text-app-text font-semibold">{fmtMoney(secTotal)}</span>
                    </span>
                  </div>
                }
              >
                <thead>
                  <tr className="border-b border-app-border">
                    {["Name","ID","Base","App Bonus","Apps","Hours","Vol Bonus","Prod Bonus","Total","2-Wk Pay","Notes","Paid"].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-app-text-4 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {secRows.map(r => (
                    <tr key={r.docId} className={`border-b border-app-border/50 hover:bg-app-surface-2/20 transition-colors ${r.paid ? "opacity-30" : ""}`}>
                      <td className="px-4 py-2.5 text-app-text text-sm font-medium whitespace-nowrap">{r.name}</td>
                      <td className="px-4 py-2.5 text-app-text-4 text-xs font-mono">{r.contractorId || "—"}</td>
                      <td className="px-4 py-2.5 text-app-text-2 text-sm">{r.base ? fmtMoney(r.base) : <span className="text-app-text-5">$0.00</span>}</td>
                      <td className="px-4 py-2.5 text-app-text-2 text-sm">{r.appBonus ? fmtMoney(r.appBonus) : <span className="text-app-text-5">$0.00</span>}</td>
                      <td className="px-4 py-2.5">
                        {r.appCount
                          ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-900/50 border border-blue-800 text-blue-300 text-xs font-bold">{r.appCount}</span>
                          : <span className="text-app-text-5 text-xs">0</span>}
                      </td>
                      <td className="px-4 py-2.5 text-app-text-2 text-sm">{r.hours ?? 0}</td>
                      <td className="px-4 py-2.5 text-sm">{r.volumeBonus ? <span className="text-purple-400 font-semibold">{fmtMoney(r.volumeBonus)}</span> : <span className="text-app-text-5">$0.00</span>}</td>
                      <td className="px-4 py-2.5 text-sm">{r.producerBonus ? <span className="text-green-400 font-semibold">{fmtMoney(r.producerBonus)}</span> : <span className="text-app-text-5">$0.00</span>}</td>
                      <td className="px-4 py-2.5 text-app-text font-bold text-sm">{fmtMoney(r.total)}</td>
                      <td className="px-4 py-2.5 text-app-text-3 text-sm">{r.twoWeekPay ? fmtMoney(r.twoWeekPay) : <span className="text-app-text-5">$0.00</span>}</td>
                      <td className="px-4 py-2.5 text-app-text-4 text-xs max-w-36 truncate">{r.notes || <span className="text-app-text-5">—</span>}</td>
                      <td className="px-4 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={r.paid}
                          onChange={() => toggleImportedPaid(r.docId, r.paid)}
                          className="w-4 h-4 accent-green-500 cursor-pointer"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-app-border-2 bg-app-surface-2/40">
                    <td colSpan={8} className="px-4 py-2.5 text-right text-xs text-app-text-4 font-semibold uppercase tracking-wider">{sec} Total</td>
                    <td className="px-4 py-2.5 text-app-text font-bold text-sm">{fmtMoney(secTotal)}</td>
                    <td colSpan={2} />
                    <td className="px-4 py-2.5 text-center text-xs text-app-text-5">{paidCnt}/{secRows.length}</td>
                  </tr>
                </tfoot>
              </Section>
            );
          })}
        </>
      ) : (
        /* ── Live / calculated view ──────────────────────────────────────── */
        <>
          {staffList.length > 0 && (
            <Section title="Staff" locked={isLocked}>
              <THead />
              <tbody>
                {staffList.map(u => (
                  <PayrollRow
                    key={u.uid}
                    u={u}
                    s={activeStats[u.uid] ?? EMPTY_STATS}
                    entry={activeEntries[u.uid] ?? { hours: DEFAULT_HOURS, payrollChecked: false }}
                    saving={savingId === u.uid}
                    isAdmin={isAdminUser}
                    twoWeekPay={combinedStats[u.uid]?.total || 0}
                    locked={isLocked}
                    onPatch={patch => patchEntry(activePatchWeek, activePatchEntries, u.uid, patch)}
                    clawback={clawbacks[u.uid]}
                    policies={userPolicies[u.uid]}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </tbody>
              <tfoot>
                <SectionFooter members={staffList} stats={activeStats} label="Staff" />
              </tfoot>
            </Section>
          )}

          {teamNums.map(t => {
            const members   = teamMembers(t);
            const teamTotal = members.reduce((s, u) => s + (activeStats[u.uid]?.total || 0), 0);
            const paidCount = members.filter(u => activeEntries[u.uid]?.payrollChecked).length;
            return (
              <Section
                key={t}
                title={teamNames[String(t)] || `Team ${t}`}
                locked={isLocked}
                badge={
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-app-text-5">
                      <span className="text-app-text font-semibold">{paidCount}</span>/{members.length} paid
                    </span>
                    <span className="text-app-text-5">
                      Submit: <span className="text-app-accent font-semibold">{fmtMoney(activeTeamALP[t] || 0)}</span>
                    </span>
                    <span className="text-app-text-5">
                      Payroll: <span className="text-app-text font-semibold">{fmtMoney(teamTotal)}</span>
                    </span>
                  </div>
                }
              >
                <THead />
                <tbody>
                  {members.map(u => (
                    <PayrollRow
                      key={u.uid}
                      u={u}
                      s={activeStats[u.uid] ?? EMPTY_STATS}
                      entry={activeEntries[u.uid] ?? { hours: DEFAULT_HOURS, payrollChecked: false }}
                      saving={savingId === u.uid}
                      isAdmin={isAdminUser}
                      twoWeekPay={combinedStats[u.uid]?.total || 0}
                      locked={isLocked}
                      onPatch={patch => patchEntry(activePatchWeek, activePatchEntries, u.uid, patch)}
                      policies={userPolicies[u.uid]}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </tbody>
                <tfoot>
                  <SectionFooter members={members} stats={activeStats} label={teamNames[String(t)] || `Team ${t}`} />
                </tfoot>
              </Section>
            );
          })}

          {/* Dev Team — owner/developer only */}
          {isOwnerViewer && devList.length > 0 && (
            <Section
              title="Dev Team"
              locked={isLocked}
              badge={
                <span className="text-xs text-app-text-5">
                  Fixed <span className="text-app-text font-semibold">${DEV_MONTHLY}/mo</span> team cost
                </span>
              }
            >
              <THead />
              <tbody>
                {devList.map(u => {
                  const perPersonMonthly = Math.round(DEV_MONTHLY / devList.length);
                  const perPersonWeekly = Math.round((DEV_MONTHLY * 12 / 52) / devList.length * 100) / 100;
                  const perPersonBiWeekly = Math.round(perPersonWeekly * 2 * 100) / 100;
                  return (
                    <tr key={u.uid} className="border-b border-app-border/60 hover:bg-app-surface-2/20">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-app-text text-sm font-medium">{u.firstName} {u.lastName}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/25">DEV</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-app-text-4 text-sm" colSpan={9}>
                        Fixed retainer — <span className="text-app-text font-semibold">${perPersonMonthly}/mo</span>
                        <span className="text-app-text-5 ml-2">(approx {fmtMoney(perPersonBiWeekly)}/period)</span>
                      </td>
                      <td className="px-4 py-2.5 text-app-text font-bold text-sm">{fmtMoney(perPersonBiWeekly)}</td>
                      <td colSpan={2} />
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-app-border-2 bg-app-surface-2/30">
                  <td colSpan={10} className="px-4 py-2 text-right text-xs text-app-text-4 font-semibold uppercase tracking-wider">Dev Team Total</td>
                  <td className="px-4 py-2 text-app-text font-bold text-sm">{fmtMoney(Math.round((DEV_MONTHLY * 12 / 52) * 2 * 100) / 100)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </Section>
          )}

          {/* COO Payroll — owner/developer only */}
          {isOwnerViewer && cooList.length > 0 && (
            <Section title="COO / Principal" locked={isLocked}>
              <THead />
              <tbody>
                {cooList.map(u => (
                  <PayrollRow
                    key={u.uid}
                    u={u}
                    s={activeStats[u.uid] ?? EMPTY_STATS}
                    entry={activeEntries[u.uid] ?? { hours: DEFAULT_HOURS, payrollChecked: false }}
                    saving={savingId === u.uid}
                    isAdmin={isAdminUser}
                    twoWeekPay={combinedStats[u.uid]?.total || 0}
                    locked={isLocked}
                    onPatch={patch => patchEntry(activePatchWeek, activePatchEntries, u.uid, patch)}
                    clawback={clawbacks[u.uid]}
                    policies={userPolicies[u.uid]}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </tbody>
              <tfoot>
                <SectionFooter members={cooList} stats={activeStats} label="COO / Principal" />
              </tfoot>
            </Section>
          )}

          {allClients.length === 0 && (
            <p className="text-center py-10 text-app-text-5 text-sm">
              No approved apps for this pay period — base pay still calculated from hours.
            </p>
          )}

          {/* Cancelled Debt — policies cancelled within 1st year, outside current period */}
          {cancelledDebt.length > 0 && (
            <section className="mt-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-red-400 text-xs font-bold uppercase tracking-wider">Cancelled Debt (1st Year)</span>
                <span className="text-app-text-5 text-xs">{cancelledDebt.length} polic{cancelledDebt.length !== 1 ? "ies" : "y"}</span>
                <div className="flex-1 h-px bg-red-900/40" />
                <span className="text-red-400 text-sm font-bold">
                  −{fmtMoney(cancelledDebt.reduce((s, c) => s + (c.annualPremium || 0), 0))} ALP
                </span>
              </div>
              <div className="bg-app-surface border border-red-900/40 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-app-border-2 text-app-text-4 text-xs uppercase tracking-wider">
                        <th className="px-4 py-2 text-left font-semibold">Agent</th>
                        <th className="px-4 py-2 text-left font-semibold">Client</th>
                        <th className="px-4 py-2 text-left font-semibold">Carrier</th>
                        <th className="px-4 py-2 text-left font-semibold">App #</th>
                        <th className="px-4 py-2 text-left font-semibold">Date</th>
                        <th className="px-4 py-2 text-left font-semibold">Status</th>
                        <th className="px-4 py-2 text-right font-semibold">ALP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-app-border/50">
                      {cancelledDebt.sort((a, b) => (b.date > a.date ? 1 : -1)).map(c => (
                        <tr key={c.id} className="hover:bg-red-950/20 transition">
                          <td className="px-4 py-2 text-app-text-2 text-xs">{c.agentName || "—"}</td>
                          <td className="px-4 py-2 text-app-text text-xs font-medium">{c.clientName || "—"}</td>
                          <td className="px-4 py-2 text-app-text-3 text-xs">{c.carrier || "—"}</td>
                          <td className="px-4 py-2 text-app-text-3 text-xs font-mono">{c.appNumber || "—"}</td>
                          <td className="px-4 py-2 text-app-text-3 text-xs">{c.date}</td>
                          <td className="px-4 py-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-900/50 border border-red-700 text-red-400">
                              {c.adminStatus || "Cancelled"}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right text-red-400 font-semibold text-xs">{fmtMoney(c.annualPremium || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-red-900/40 bg-red-950/20">
                        <td colSpan={6} className="px-4 py-2.5 text-right text-xs text-red-400/70 font-semibold uppercase tracking-wider">Total Cancelled Debt</td>
                        <td className="px-4 py-2.5 text-right text-red-400 font-bold text-sm">{fmtMoney(cancelledDebt.reduce((s, c) => s + (c.annualPremium || 0), 0))}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
