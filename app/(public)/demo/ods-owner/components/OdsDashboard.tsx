"use client";

import React, { useMemo } from "react";
import { OdsStatCard, SimpleDataTable, type ColDef } from "ods-ui-library";
import { MiniChart } from "./MiniChart";
import type {
  OdsState,
  OdsTeamMember,
  OdsProject,
  OdsActivity,
  ProjectStage,
} from "../data/types";
import { PROJECT_STAGES, STAGE_LABELS } from "../data/types";

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

const ACTIVITY_ICONS: Record<OdsActivity["type"], string> = {
  project_created: "\u{1F4CB}",
  project_stage_changed: "\u{1F504}",
  client_added: "\u{1F464}",
  task_completed: "\u2705",
  note_added: "\u{1F4DD}",
  project_deployed: "\u{1F680}",
};

const PIPELINE_STAGES: ProjectStage[] = ["discovery", "proposal", "in_progress", "review"];

const STAGE_CHART_COLORS: Record<ProjectStage, string> = {
  discovery: "#6b7280",
  proposal: "#3b82f6",
  in_progress: "#6366f1",
  review: "#f59e0b",
  deployed: "#22c55e",
  completed: "#10b981",
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ── Team member performance row type ───────────────────────────────────────

type MemberRow = {
  id: string;
  name: string;
  projects: number;
  totalRevenue: number;
  monthlyRecurring: number;
};

// ── Component ───────────────────────────────────────────────────────────────

export function OdsDashboard({ state }: { state: OdsState }) {
  const { projects, tasks, activities, members } = state;

  // KPI computations
  const totalRevenue = useMemo(() => projects.reduce((s, p) => s + p.contractValue, 0), [projects]);
  const activeProjects = useMemo(() => projects.filter((p) => p.stage === "in_progress" || p.stage === "review").length, [projects]);
  const pipelineValue = useMemo(
    () =>
      projects
        .filter((p) => PIPELINE_STAGES.includes(p.stage))
        .reduce((s, p) => s + p.contractValue, 0),
    [projects]
  );
  const openTasks = useMemo(() => tasks.filter((t) => t.status !== "done").length, [tasks]);
  const mrr = useMemo(() => projects.filter(p => p.stage === "deployed" || p.stage === "in_progress").reduce((s, p) => s + p.monthlyRecurring, 0), [projects]);

  // Monthly revenue bar chart data
  const monthlyData = useMemo(() => {
    const byMonth: Record<string, number> = {};
    for (const p of projects) {
      const date = new Date(p.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      byMonth[key] = (byMonth[key] || 0) + p.contractValue;
    }
    const sorted = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).slice(-6);
    return sorted.map(([key, value]) => {
      const [, month] = key.split("-");
      return { label: MONTH_NAMES[parseInt(month, 10) - 1], value };
    });
  }, [projects]);

  // Pipeline funnel data
  const funnelData = useMemo(
    () =>
      PROJECT_STAGES.map((stage) => ({
        label: STAGE_LABELS[stage],
        value: projects.filter((p) => p.stage === stage).length,
        color: STAGE_CHART_COLORS[stage],
      })),
    [projects]
  );

  // Recent activities
  const recentActivities = useMemo(
    () => [...activities].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10),
    [activities]
  );

  // Team member performance
  const memberPerformance = useMemo<MemberRow[]>(() => {
    const map = new Map<string, MemberRow>();
    for (const member of members) {
      map.set(member.id, {
        id: member.id,
        name: `${member.firstName} ${member.lastName}`,
        projects: 0,
        totalRevenue: 0,
        monthlyRecurring: 0,
      });
    }
    for (const project of projects) {
      const row = map.get(project.memberId);
      if (row) {
        row.projects++;
        row.totalRevenue += project.contractValue;
        row.monthlyRecurring += project.monthlyRecurring;
      }
    }
    return Array.from(map.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [members, projects]);

  const memberColumns: ColDef<MemberRow>[] = useMemo(
    () => [
      {
        key: "name",
        label: "Team Member",
        sortable: true,
        render: (_v, row) => (
          <span className="text-gray-200 text-xs font-medium">{row.name}</span>
        ),
      },
      {
        key: "projects",
        label: "Projects",
        sortable: true,
        accessor: (row) => row.projects,
        render: (v) => <span className="text-gray-300 text-xs">{String(v)}</span>,
      },
      {
        key: "totalRevenue",
        label: "Revenue",
        sortable: true,
        accessor: (row) => row.totalRevenue,
        render: (_v, row) => (
          <span className="text-gray-300 text-xs">{fmtUSD(row.totalRevenue)}</span>
        ),
      },
      {
        key: "monthlyRecurring",
        label: "MRR",
        sortable: true,
        accessor: (row) => row.monthlyRecurring,
        render: (_v, row) => (
          <span className="text-cyan-400 text-xs font-medium">{fmtUSD(row.monthlyRecurring)}</span>
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
          label="Total Revenue"
          value={fmtUSD(totalRevenue)}
          trend="up"
          trendValue="+12.4%"
          icon={<RevenueIcon />}
          accent="#06b6d4"
        />
        <OdsStatCard
          label="Active Projects"
          value={activeProjects}
          trend="up"
          trendValue="+2 this month"
          icon={<ProjectIcon />}
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
          label="Monthly Recurring"
          value={fmtUSD(mrr)}
          trend="up"
          trendValue={`${openTasks} open tasks`}
          icon={<RecurringIcon />}
          accent="#f59e0b"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Revenue Chart */}
        <div className="rounded-xl border border-gray-700/50 bg-[#0f1a2e]/60 p-5">
          <h3 className="text-sm font-semibold text-gray-200 mb-4">Monthly Revenue</h3>
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
          <h3 className="text-sm font-semibold text-gray-200 mb-4">Project Pipeline</h3>
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

      {/* Activity Feed + Team Performance */}
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
                    {a.memberName} &middot; {relativeTime(a.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Performance Table */}
        <div className="rounded-xl border border-gray-700/50 bg-[#0f1a2e]/60 p-5">
          <h3 className="text-sm font-semibold text-gray-200 mb-4">Team Performance</h3>
          <SimpleDataTable
            rows={memberPerformance}
            columns={memberColumns}
            getRowKey={(r) => r.id}
            initialSortField="totalRevenue"
            initialSortDir="desc"
          />
        </div>
      </div>
    </div>
  );
}

// ── Inline SVG Icons ────────────────────────────────────────────────────────

function RevenueIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 1v22m5-18H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H7" />
    </svg>
  );
}

function ProjectIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
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

function RecurringIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}
