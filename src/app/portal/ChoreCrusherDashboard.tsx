"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";

interface Overview {
  activeUsers: string;
  sessions: string;
  pageViews: string;
  engagementRate: string;
}

interface AnalyticsData {
  overview: Overview;
  error?: string;
}

function StatCard({ label, value, icon, accent }: {
  label: string; value: string; icon: React.ReactNode; accent: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl ${accent} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-white text-2xl font-bold">{value}</p>
        <p className="text-gray-500 text-xs mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<Overview | null>(null);

  const displayName = user?.displayName ?? user?.email?.split("@")[0] ?? "there";

  useEffect(() => {
    fetch("/api/analytics")
      .then(r => r.json())
      .then((d: AnalyticsData) => { if (!d.error && d.overview) setAnalytics(d.overview); })
      .catch(() => {});
  }, []);

  const engagementPct = analytics
    ? `${(parseFloat(analytics.engagementRate) * 100).toFixed(1)}%`
    : "—";

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-br from-blue-900/40 to-gray-900 border border-blue-800/40 rounded-2xl p-6">
        <h3 className="text-white font-bold text-xl">
          Welcome back, {displayName.split(" ")[0]} 👋
        </h3>
        <p className="text-gray-400 text-sm mt-1">
          Here's an overview of Outpost Digital Solutions — last 30 days.
        </p>
      </div>

      {/* Analytics snapshot */}
      <div>
        <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
          Site Analytics · Last 30 Days
        </h4>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Active Users"
            value={analytics ? parseInt(analytics.activeUsers).toLocaleString() : "—"}
            accent="bg-blue-600"
            icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          />
          <StatCard
            label="Sessions"
            value={analytics ? parseInt(analytics.sessions).toLocaleString() : "—"}
            accent="bg-indigo-600"
            icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
          />
          <StatCard
            label="Page Views"
            value={analytics ? parseInt(analytics.pageViews).toLocaleString() : "—"}
            accent="bg-violet-600"
            icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
          />
          <StatCard
            label="Engagement Rate"
            value={engagementPct}
            accent="bg-emerald-700"
            icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
          />
        </div>
      </div>

      {/* Quick nav cards */}
      <div>
        <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
          Quick Access
        </h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Clients", desc: "Manage your CRM", nav: "clients", color: "text-blue-400", bg: "bg-blue-900/20 border-blue-800/40" },
            { label: "Projects", desc: "Apps & quick links", nav: "projects", color: "text-orange-400", bg: "bg-orange-900/20 border-orange-800/40" },
            { label: "Reports", desc: "Full analytics view", nav: "reports", color: "text-emerald-400", bg: "bg-emerald-900/20 border-emerald-800/40" },
            { label: "Documents", desc: "File library", nav: "documents", color: "text-violet-400", bg: "bg-violet-900/20 border-violet-800/40" },
          ].map((item) => (
            <button
              key={item.nav}
              onClick={() => {
                const event = new CustomEvent("portal-nav", { detail: item.nav });
                window.dispatchEvent(event);
              }}
              className={`text-left p-4 rounded-xl border ${item.bg} hover:brightness-125 transition`}
            >
              <p className={`font-semibold text-sm ${item.color}`}>{item.label}</p>
              <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
