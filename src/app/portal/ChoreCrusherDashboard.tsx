"use client";

import { useState, useEffect } from "react";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface Summary {
  mau: number; dau: number; dauMauRatio: number;
  newUsersThisWeek: number; newUsersLastWeek: number; weekGrowthPct: number | null;
  monthNewUsers: number; monthSessions: number; avgSessionMin: number;
}
interface PlatformRow { name: string; users: number; pct: number; }
interface WeekRow     { weekStart: string; newUsers: number; avgDau: number; }
interface CountryRow  { country: string; users: number; }

interface AnalyticsData {
  summary: Summary;
  platforms: PlatformRow[];
  weeklyTrend: WeekRow[];
  topCountries: CountryRow[];
  fetchedAt: string;
  error?: string;
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function ga4ToDate(d: string, short = true) {
  const y = +d.slice(0,4), m = +d.slice(4,6)-1, day = +d.slice(6,8);
  return new Date(y, m, day).toLocaleDateString("en-US", {
    month: "short", day: "numeric", ...(short ? {} : { year: "numeric" }),
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function stickinessLabel(ratio: number) {
  if (ratio >= 50) return { text: "Exceptional", color: "text-emerald-400" };
  if (ratio >= 20) return { text: "Strong",      color: "text-green-400" };
  if (ratio >= 10) return { text: "Healthy",     color: "text-blue-400" };
  return { text: "Growing",                       color: "text-amber-400" };
}

/* ─── Sub-components ──────────────────────────────────────────────────────── */

function KpiCard({
  label, value, unit = "", sublabel, growth, growthLabel, icon, accent,
}: {
  label: string; value: string | number; unit?: string;
  sublabel: string; growth?: number | null; growthLabel?: string;
  icon: React.ReactNode; accent: string;
}) {
  const hasGrowth = growth !== null && growth !== undefined;
  const positive  = (growth ?? 0) >= 0;
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-4">
      <div className={`w-10 h-10 rounded-xl ${accent} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <div className="flex items-end gap-1.5 flex-wrap">
          <span className="text-3xl font-bold text-white tracking-tight leading-none">
            {typeof value === "number" ? value.toLocaleString() : value}
          </span>
          {unit && <span className="text-gray-400 text-sm mb-0.5">{unit}</span>}
        </div>
        <p className="text-white text-sm font-medium mt-1">{label}</p>
        <p className="text-gray-500 text-xs mt-0.5">{sublabel}</p>
        {hasGrowth && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${positive ? "text-emerald-400" : "text-red-400"}`}>
            <span>{positive ? "▲" : "▼"}</span>
            <span>{Math.abs(growth!)}% {growthLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function PlatformBar({ name, users, pct }: PlatformRow) {
  const colors: Record<string, { bar: string; text: string; bg: string }> = {
    ios:     { bar: "bg-slate-400",   text: "text-slate-300",   bg: "bg-slate-900/50" },
    android: { bar: "bg-emerald-500", text: "text-emerald-300", bg: "bg-emerald-900/30" },
    web:     { bar: "bg-violet-500",  text: "text-violet-300",  bg: "bg-violet-900/30" },
  };
  const key   = name.toLowerCase();
  const color = colors[key] ?? { bar: "bg-blue-500", text: "text-blue-300", bg: "bg-blue-900/30" };
  const displayName = key === "ios" ? "iOS" : key === "android" ? "Android" : "Web";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-300 font-medium">{displayName}</span>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-xs">{users.toLocaleString()} users</span>
          <span className={`text-xs font-bold ${color.text}`}>{pct}%</span>
        </div>
      </div>
      <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${color.bar} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function WeeklyChart({ weeks }: { weeks: WeekRow[] }) {
  const maxNewUsers = Math.max(...weeks.map(w => w.newUsers), 1);
  return (
    <div className="flex items-end gap-2 h-40 px-1 pt-4">
      {weeks.map((week, i) => {
        const heightPct = Math.max((week.newUsers / maxNewUsers) * 100, 2);
        const isLatest  = i === weeks.length - 1;
        return (
          <div key={week.weekStart} className="flex-1 flex flex-col items-center gap-1 group">
            {/* Tooltip value */}
            <span className="text-xs text-gray-500 group-hover:text-white transition-colors">
              {week.newUsers > 0 ? week.newUsers.toLocaleString() : "–"}
            </span>
            {/* Bar */}
            <div className="w-full flex items-end" style={{ height: "100px" }}>
              <div
                className={`w-full rounded-t transition-all duration-300 group-hover:opacity-90 ${
                  isLatest ? "bg-blue-500" : "bg-blue-700/60"
                }`}
                style={{ height: `${heightPct}%` }}
              />
            </div>
            {/* Label */}
            <span className={`text-xs whitespace-nowrap ${isLatest ? "text-blue-400 font-medium" : "text-gray-600"}`}>
              {ga4ToDate(week.weekStart)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function CountryRow({ country, users, max }: CountryRow & { max: number }) {
  const pct = max > 0 ? (users / max) * 100 : 0;
  const flags: Record<string, string> = {
    "United States": "🇺🇸", "United Kingdom": "🇬🇧", Canada: "🇨🇦",
    Australia: "🇦🇺", Germany: "🇩🇪", France: "🇫🇷", India: "🇮🇳",
    Brazil: "🇧🇷", Mexico: "🇲🇽", Japan: "🇯🇵",
  };
  return (
    <div className="flex items-center gap-3">
      <span className="text-lg w-6 shrink-0">{flags[country] ?? "🌍"}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-gray-300 text-sm truncate">{country}</span>
          <span className="text-gray-500 text-xs ml-2 shrink-0">{users.toLocaleString()}</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────────────────────── */

export default function ChoreCrusherDashboard() {
  const [data, setData]       = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then(r => r.json())
      .then((d: AnalyticsData) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Could not reach the analytics service."))
      .finally(() => setLoading(false));
  }, []);

  /* Loading */
  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <svg className="w-6 h-6 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      <span className="ml-3 text-gray-400 text-sm">Loading Chore Crusher data…</span>
    </div>
  );

  /* Error — guide user to finish setup */
  if (error) return (
    <div className="space-y-4">
      <div className="bg-amber-950/40 border border-amber-700/50 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div>
            <p className="text-amber-300 font-semibold">Analytics setup required</p>
            <p className="text-amber-400/70 text-sm mt-1">{error}</p>
            <p className="text-gray-500 text-xs mt-2">
              Run <code className="bg-gray-800 px-1 rounded text-gray-300">firebase apphosting:secrets:set ga4ServiceAccount</code> and paste your service account JSON to activate this dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (!data) return null;

  const { summary, platforms, weeklyTrend, topCountries } = data;
  const sticky = stickinessLabel(summary.dauMauRatio);
  const maxCountry = Math.max(...topCountries.map(c => c.users), 1);

  return (
    <div className="space-y-6">

      {/* ── App header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-white font-bold text-xl">Chore Crusher</h3>
            <span className="px-2 py-0.5 bg-amber-900/50 text-amber-300 border border-amber-700/50 text-xs font-medium rounded-full">
              Testing Phase
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">
            Live analytics · GA4 property 525314290
          </p>
        </div>
        <div className="text-right">
          <p className="text-gray-600 text-xs">Data as of</p>
          <p className="text-gray-400 text-xs">{fmtTime(data.fetchedAt)}</p>
          <p className="text-gray-600 text-xs">GA4 processes within 24–48 hrs</p>
        </div>
      </div>

      {/* ── KPI cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Monthly Active Users"
          value={summary.mau}
          sublabel="Unique users, last 28 days"
          accent="bg-blue-600"
          icon={
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <KpiCard
          label="Daily Active Users"
          value={summary.dau}
          sublabel="Most recent complete day"
          accent="bg-indigo-600"
          icon={
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />
        <KpiCard
          label="New Users This Week"
          value={summary.newUsersThisWeek}
          sublabel="Last 7 days"
          growth={summary.weekGrowthPct}
          growthLabel="vs prior week"
          accent="bg-emerald-700"
          icon={
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          }
        />
        <KpiCard
          label="App Stickiness"
          value={summary.dauMauRatio}
          unit="%"
          sublabel={`DAU ÷ MAU — ${sticky.text}`}
          accent="bg-amber-700"
          icon={
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
      </div>

      {/* ── Platform + Countries ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Platform breakdown */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h4 className="text-white font-semibold mb-1">Platform Breakdown</h4>
          <p className="text-gray-500 text-xs mb-5">Share of active users by platform, last 28 days</p>
          <div className="space-y-4">
            {platforms.map(p => <PlatformBar key={p.name} {...p} />)}
            {platforms.length === 0 && (
              <p className="text-gray-600 text-sm">No platform data available.</p>
            )}
          </div>
        </div>

        {/* Top countries */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h4 className="text-white font-semibold mb-1">Top Countries</h4>
          <p className="text-gray-500 text-xs mb-5">Where your users are coming from, last 28 days</p>
          <div className="space-y-4">
            {topCountries.map(c => (
              <CountryRow key={c.country} {...c} max={maxCountry} />
            ))}
            {topCountries.length === 0 && (
              <p className="text-gray-600 text-sm">No country data available.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Weekly new user growth chart ─────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h4 className="text-white font-semibold">New User Growth</h4>
            <p className="text-gray-500 text-xs mt-0.5">New users acquired per week, last 8 weeks</p>
          </div>
          <div className="text-right">
            <p className="text-white font-bold text-lg">{summary.monthNewUsers.toLocaleString()}</p>
            <p className="text-gray-500 text-xs">new users this month</p>
          </div>
        </div>
        {weeklyTrend.length > 0
          ? <WeeklyChart weeks={weeklyTrend} />
          : <p className="text-gray-600 text-sm py-8 text-center">Not enough data yet.</p>
        }
      </div>

      {/* ── Session quality ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-3">Avg Session Length</p>
          <p className="text-white text-3xl font-bold">
            {summary.avgSessionMin > 0 ? `${summary.avgSessionMin}` : "—"}
            <span className="text-gray-400 text-base font-normal ml-1">min</span>
          </p>
          <p className="text-gray-500 text-xs mt-1">How long users stay in the app per session</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-3">Sessions This Month</p>
          <p className="text-white text-3xl font-bold">{summary.monthSessions.toLocaleString()}</p>
          <p className="text-gray-500 text-xs mt-1">Total app opens, last 28 days</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-3">Sessions Per User</p>
          <p className="text-white text-3xl font-bold">
            {summary.mau > 0 ? (summary.monthSessions / summary.mau).toFixed(1) : "—"}
          </p>
          <p className="text-gray-500 text-xs mt-1">Avg times each user opened the app this month</p>
        </div>
      </div>

    </div>
  );
}
