"use client";

import React, { useMemo } from "react";
import { OdsStatCard, SimpleDataTable, type ColDef } from "ods-ui-library";
import { MiniChart } from "./MiniChart";
import type {
  AtxState,
  AtxAgent,
  AtxDeal,
  AtxActivity,
  DealStage,
} from "../data/types";
import { DEAL_STAGES, STAGE_LABELS } from "../data/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtUSD(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function relativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const ACTIVITY_ICONS: Record<AtxActivity["type"], string> = {
  deal_created: "\u{1F4CB}",
  deal_stage_changed: "\u{1F504}",
  contact_added: "\u{1F464}",
  task_completed: "\u2705",
  note_added: "\u{1F4DD}",
  policy_issued: "\u{1F3C6}",
};

const PIPELINE_STAGES: DealStage[] = ["lead", "quoted", "applied", "underwriting"];

const STAGE_CHART_COLORS: Record<DealStage, string> = {
  lead: "#6b7280",
  quoted: "#3b82f6",
  applied: "#6366f1",
  underwriting: "#f59e0b",
  issued: "#22c55e",
  paid: "#10b981",
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ── Agent performance row type ──────────────────────────────────────────────

type AgentRow = {
  id: string;
  name: string;
  deals: number;
  totalPremium: number;
  commission: number;
};

// ── Component ───────────────────────────────────────────────────────────────

export function AtxDashboard({ state }: { state: AtxState }) {
  const { deals, tasks, activities, agents } = state;

  // KPI computations
  const totalALP = useMemo(() => deals.reduce((s, d) => s + d.annualPremium, 0), [deals]);
  const activePolicies = useMemo(() => deals.filter((d) => d.stage === "issued" || d.stage === "paid").length, [deals]);
  const pipelineValue = useMemo(
    () =>
      deals
        .filter((d) => PIPELINE_STAGES.includes(d.stage))
        .reduce((s, d) => s + d.annualPremium, 0),
    [deals]
  );
  const openTasks = useMemo(() => tasks.filter((t) => t.status !== "done").length, [tasks]);

  // Monthly premium bar chart data
  const monthlyData = useMemo(() => {
    const byMonth: Record<string, number> = {};
    for (const d of deals) {
      const date = new Date(d.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      byMonth[key] = (byMonth[key] || 0) + d.annualPremium;
    }
    const sorted = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).slice(-6);
    return sorted.map(([key, value]) => {
      const [, month] = key.split("-");
      return { label: MONTH_NAMES[parseInt(month, 10) - 1], value };
    });
  }, [deals]);

  // Pipeline funnel data
  const funnelData = useMemo(
    () =>
      DEAL_STAGES.map((stage) => ({
        label: STAGE_LABELS[stage],
        value: deals.filter((d) => d.stage === stage).length,
        color: STAGE_CHART_COLORS[stage],
      })),
    [deals]
  );

  // Recent activities
  const recentActivities = useMemo(
    () => [...activities].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10),
    [activities]
  );

  // Agent performance
  const agentPerformance = useMemo<AgentRow[]>(() => {
    const map = new Map<string, AgentRow>();
    for (const agent of agents) {
      map.set(agent.id, {
        id: agent.id,
        name: `${agent.firstName} ${agent.lastName}`,
        deals: 0,
        totalPremium: 0,
        commission: 0,
      });
    }
    for (const deal of deals) {
      const row = map.get(deal.agentId);
      if (row) {
        row.deals++;
        row.totalPremium += deal.annualPremium;
        row.commission += deal.commission;
      }
    }
    return Array.from(map.values()).sort((a, b) => b.totalPremium - a.totalPremium);
  }, [agents, deals]);

  const agentColumns: ColDef<AgentRow>[] = useMemo(
    () => [
      {
        key: "name",
        label: "Agent",
        sortable: true,
        render: (_v, row) => (
          <span className="text-gray-200 text-xs font-medium">{row.name}</span>
        ),
      },
      {
        key: "deals",
        label: "Deals",
        sortable: true,
        accessor: (row) => row.deals,
        render: (v) => <span className="text-gray-300 text-xs">{String(v)}</span>,
      },
      {
        key: "totalPremium",
        label: "Premium",
        sortable: true,
        accessor: (row) => row.totalPremium,
        render: (_v, row) => (
          <span className="text-gray-300 text-xs">{fmtUSD(row.totalPremium)}</span>
        ),
      },
      {
        key: "commission",
        label: "Commission",
        sortable: true,
        accessor: (row) => row.commission,
        render: (_v, row) => (
          <span className="text-gray-300 text-xs">{fmtUSD(row.commission)}</span>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <OdsStatCard
          label="Total ALP"
          value={fmtUSD(totalALP)}
          trend="up"
          trendValue="+8.2%"
          icon={<DollarIcon />}
          accent="#d4a843"
        />
        <OdsStatCard
          label="Active Policies"
          value={activePolicies}
          trend="up"
          trendValue="+3"
          icon={<ShieldCheckIcon />}
          accent="#22c55e"
        />
        <OdsStatCard
          label="Pipeline Value"
          value={fmtUSD(pipelineValue)}
          trend="neutral"
          trendValue="Steady"
          icon={<TrendIcon />}
          accent="#3b82f6"
        />
        <OdsStatCard
          label="Open Tasks"
          value={openTasks}
          trend={openTasks > 10 ? "down" : "neutral"}
          trendValue={`${openTasks} pending`}
          icon={<ClipboardIcon />}
          accent="#f59e0b"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Premium Chart */}
        <div className="rounded-xl border border-gray-700/50 bg-[#0f1a2e]/60 p-5">
          <h3 className="text-sm font-semibold text-gray-200 mb-4">Monthly Premium</h3>
          <MiniChart
            data={monthlyData}
            type="bar"
            height={160}
            width={420}
            showLabels
            showValues
          />
        </div>

        {/* Pipeline Funnel */}
        <div className="rounded-xl border border-gray-700/50 bg-[#0f1a2e]/60 p-5">
          <h3 className="text-sm font-semibold text-gray-200 mb-4">Pipeline Funnel</h3>
          <MiniChart
            data={funnelData}
            type="horizontal-bar"
            height={180}
            width={360}
            showLabels
            showValues
          />
        </div>
      </div>

      {/* Activity Feed + Agent Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Activity Feed */}
        <div className="rounded-xl border border-gray-700/50 bg-[#0f1a2e]/60 p-5">
          <h3 className="text-sm font-semibold text-gray-200 mb-4">Recent Activity</h3>
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {recentActivities.length === 0 && (
              <p className="text-gray-500 text-xs">No recent activity.</p>
            )}
            {recentActivities.map((a) => (
              <div key={a.id} className="flex items-start gap-3">
                <span className="text-base mt-0.5 shrink-0">
                  {ACTIVITY_ICONS[a.type] || "\u{1F4CC}"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-300 leading-snug truncate">
                    {a.description}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {a.agentName} &middot; {relativeTime(a.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agent Performance Table */}
        <div className="rounded-xl border border-gray-700/50 bg-[#0f1a2e]/60 p-5">
          <h3 className="text-sm font-semibold text-gray-200 mb-4">Agent Performance</h3>
          <SimpleDataTable
            rows={agentPerformance}
            columns={agentColumns}
            getRowKey={(r) => r.id}
            initialSortField="totalPremium"
            initialSortDir="desc"
          />
        </div>
      </div>
    </div>
  );
}

// ── Inline SVG Icons ────────────────────────────────────────────────────────

function DollarIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 1v22m5-18H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H7" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}
