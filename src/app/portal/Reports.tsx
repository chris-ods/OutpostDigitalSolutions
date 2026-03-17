"use client";

import { useState, useEffect } from "react";

interface DayData {
  date: string; // YYYYMMDD
  web: number;
  ios: number;
  android: number;
  total: number;
}

interface AnalyticsResponse {
  rows: DayData[];
  fetchedAt: string;
  error?: string;
}

// YYYYMMDD → "Mar 15" or "Mar 15, 2025"
function fmtDate(d: string, showYear = false) {
  const y = +d.slice(0, 4), m = +d.slice(4, 6) - 1, day = +d.slice(6, 8);
  return new Date(y, m, day).toLocaleDateString("en-US", {
    month: "short", day: "numeric", ...(showYear ? { year: "numeric" } : {}),
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function StatCard({
  label, value, sublabel, icon, bg,
}: {
  label: string; value: number; sublabel: string; icon: React.ReactNode; bg: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-3">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-bold text-white tracking-tight">{value.toLocaleString()}</p>
        <p className="text-white text-sm font-medium mt-0.5">{label}</p>
        <p className="text-gray-500 text-xs mt-0.5">{sublabel}</p>
      </div>
    </div>
  );
}

// Simple inline bar — no chart library needed
function MiniBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-gray-300 text-xs w-8 text-right">{value.toLocaleString()}</span>
    </div>
  );
}

export default function Reports() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d: AnalyticsResponse) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Could not reach the analytics service."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <svg className="w-6 h-6 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span className="ml-3 text-gray-400 text-sm">Loading analytics…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-950/40 border border-red-800 rounded-xl p-6 text-center">
        <svg className="w-8 h-8 text-red-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        <p className="text-red-300 font-medium mb-1">Analytics unavailable</p>
        <p className="text-red-400/70 text-sm">{error}</p>
        <p className="text-gray-600 text-xs mt-3">Make sure the GA4_SERVICE_ACCOUNT secret is configured in Firebase App Hosting.</p>
      </div>
    );
  }

  if (!data || data.rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-gray-500 text-sm">No analytics data available yet.</p>
      </div>
    );
  }

  // Most recent complete day = last row
  const latest = data.rows[data.rows.length - 1];
  // Last 7 days for the trend table
  const last7 = data.rows.slice(-7);
  const maxTotal = Math.max(...last7.map((r) => r.total));

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-white font-semibold text-lg">Chore Crusher Analytics</h3>
          <p className="text-gray-500 text-sm">Daily active users across all platforms</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-gray-600 text-xs">Last updated</p>
          <p className="text-gray-400 text-xs">{fmtTime(data.fetchedAt)}</p>
        </div>
      </div>

      {/* Most recent day banner */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-3 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <p className="text-gray-400 text-sm">
          Showing most recent complete day: <span className="text-white font-medium">{fmtDate(latest.date, true)}</span>
          <span className="text-gray-600 ml-2 text-xs">(GA4 data processes within 24–48 hrs)</span>
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Active Users"
          value={latest.total}
          sublabel="All platforms combined"
          bg="bg-blue-600"
          icon={
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          label="Web Users"
          value={latest.web}
          sublabel="Browser / desktop"
          bg="bg-purple-700"
          icon={
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
            </svg>
          }
        />
        <StatCard
          label="iOS Users"
          value={latest.ios}
          sublabel="iPhone / iPad"
          bg="bg-slate-600"
          icon={
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          label="Android Users"
          value={latest.android}
          sublabel="Android devices"
          bg="bg-green-700"
          icon={
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          }
        />
      </div>

      {/* 7-day trend table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h4 className="text-white font-semibold">7-Day Trend</h4>
          <p className="text-gray-500 text-xs mt-0.5">Active users per day, last 7 days</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Date</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Total</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-purple-400 uppercase tracking-wide">Web</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">iOS</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-green-400 uppercase tracking-wide">Android</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {last7.map((row, i) => {
                const isLatest = i === last7.length - 1;
                return (
                  <tr key={row.date} className={isLatest ? "bg-blue-950/20" : "hover:bg-gray-800/40 transition"}>
                    <td className="px-5 py-3">
                      <span className="text-white font-medium">{fmtDate(row.date)}</span>
                      {isLatest && (
                        <span className="ml-2 text-xs text-blue-400 font-medium">latest</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <MiniBar value={row.total} max={maxTotal} />
                    </td>
                    <td className="px-5 py-3 text-purple-300">{row.web.toLocaleString()}</td>
                    <td className="px-5 py-3 text-slate-300">{row.ios.toLocaleString()}</td>
                    <td className="px-5 py-3 text-green-300">{row.android.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 30-day summary */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h4 className="text-white font-semibold mb-4">30-Day Summary</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(["total", "web", "ios", "android"] as const).map((key) => {
            const sum = data.rows.reduce((acc, r) => acc + r[key], 0);
            const avg = Math.round(sum / data.rows.length);
            const labels: Record<string, string> = { total: "All Platforms", web: "Web", ios: "iOS", android: "Android" };
            return (
              <div key={key}>
                <p className="text-gray-500 text-xs mb-1">{labels[key]}</p>
                <p className="text-white text-xl font-bold">{sum.toLocaleString()}</p>
                <p className="text-gray-500 text-xs">avg {avg.toLocaleString()}/day</p>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
