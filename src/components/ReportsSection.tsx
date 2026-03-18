"use client";

import { useEffect, useState } from "react";

type Overview = {
  activeUsers: string;
  sessions: string;
  pageViews: string;
  engagementRate: string;
};

type PageRow = { page: string; views: number };
type DayRow = { date: string; users: number };
type ChannelRow = { channel: string; sessions: number };

type AnalyticsData = {
  overview: Overview;
  topPages: PageRow[];
  dailyUsers: DayRow[];
  channels: ChannelRow[];
};

function fmt(n: string | number) {
  return Number(n).toLocaleString();
}

function pct(n: string) {
  return (parseFloat(n) * 100).toFixed(1) + "%";
}

export default function ReportsSection() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500 text-sm">
        Loading analytics…
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-950 border border-red-800 rounded-xl p-6 text-red-300 text-sm">
        <p className="font-semibold mb-1">Could not load analytics</p>
        <p className="text-red-400">{error}</p>
        <p className="mt-3 text-red-500 text-xs">
          Check that GA_PROPERTY_ID, GA_SERVICE_ACCOUNT_EMAIL, and GA_PRIVATE_KEY are set in your
          environment variables.
        </p>
      </div>
    );
  }

  if (!data) return null;

  const { overview, topPages, dailyUsers, channels } = data;
  const maxUsers = Math.max(...dailyUsers.map((d) => d.users), 1);
  const maxPageViews = Math.max(...topPages.map((p) => p.views), 1);
  const totalChannelSessions = channels.reduce((sum, c) => sum + c.sessions, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-white font-semibold text-lg">Site Analytics</h3>
        <p className="text-gray-500 text-sm mt-0.5">Last 30 days · outpostdigitalsolutions.com</p>
      </div>

      {/* Overview stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Users", value: fmt(overview.activeUsers) },
          { label: "Sessions", value: fmt(overview.sessions) },
          { label: "Page Views", value: fmt(overview.pageViews) },
          { label: "Engagement Rate", value: pct(overview.engagementRate) },
        ].map((s) => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">
              {s.label}
            </p>
            <p className="text-white text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Daily visitors bar chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h4 className="text-white font-semibold mb-5">Daily Active Users (last 14 days)</h4>
        <div className="flex items-end gap-1.5 h-28">
          {dailyUsers.map((d) => {
            const heightPct = Math.round((d.users / maxUsers) * 100);
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="relative w-full">
                  {/* Tooltip */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {d.users} users
                  </div>
                  <div
                    className="w-full bg-blue-600 rounded-t"
                    style={{ height: `${Math.max(heightPct, 4)}%`, minHeight: "4px" }}
                  />
                </div>
                <span className="text-gray-600 text-[10px] rotate-45 origin-left translate-x-1">
                  {d.date}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top pages */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h4 className="text-white font-semibold mb-4">Top Pages</h4>
          <div className="space-y-3">
            {topPages.map((p) => (
              <div key={p.page}>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-gray-300 text-sm truncate max-w-[70%]" title={p.page}>
                    {p.page === "/" ? "Home" : p.page}
                  </span>
                  <span className="text-gray-500 text-xs">{fmt(p.views)}</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${(p.views / maxPageViews) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic sources */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h4 className="text-white font-semibold mb-4">Traffic Sources</h4>
          <div className="space-y-3">
            {channels.map((c) => {
              const share = Math.round((c.sessions / totalChannelSessions) * 100);
              return (
                <div key={c.channel}>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-gray-300 text-sm">{c.channel}</span>
                    <span className="text-gray-500 text-xs">
                      {fmt(c.sessions)} ({share}%)
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${share}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-gray-600 text-xs text-right">
        Data from Google Analytics 4 · Refreshes on page load
      </p>
    </div>
  );
}
