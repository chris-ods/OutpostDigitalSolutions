"use client";

import React, { useMemo } from "react";
import { SimpleDataTable, type ColDef } from "ods-ui-library";
import { MiniChart } from "./MiniChart";
import type { OdsState } from "../data/types";
import {
  PROJECT_STAGES,
  STAGE_LABELS,
  PROJECT_TYPE_LABELS,
} from "../data/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtUSD(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const STAGE_CHART_COLORS: Record<string, string> = {
  discovery: "#6b7280",
  proposal: "#3b82f6",
  in_progress: "#6366f1",
  review: "#f59e0b",
  deployed: "#22c55e",
  completed: "#10b981",
};

const PROJECT_TYPE_COLORS: Record<string, string> = {
  web_app: "#06b6d4",
  mobile_app: "#22c55e",
  saas_platform: "#8b5cf6",
  api_integration: "#f59e0b",
  consulting: "#ec4899",
  maintenance: "#6b7280",
};

// ── Team member ranking row ────────────────────────────────────────────────

type MemberRankRow = {
  id: string;
  rank: number;
  name: string;
  projects: number;
  revenue: number;
  mrr: number;
};

// ── Component ───────────────────────────────────────────────────────────────

export function OdsReports({ state }: { state: OdsState }) {
  const { projects, members } = state;

  // 1. Monthly Revenue Trend
  const monthlyData = useMemo(() => {
    const byMonth: Record<string, number> = {};
    for (const p of projects) {
      const date = new Date(p.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      byMonth[key] = (byMonth[key] || 0) + p.contractValue;
    }
    const sorted = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).slice(-8);
    return sorted.map(([key, value]) => {
      const [, month] = key.split("-");
      return { label: MONTH_NAMES[parseInt(month, 10) - 1], value };
    });
  }, [projects]);

  // 2. Team Member Rankings
  const memberRankings = useMemo<MemberRankRow[]>(() => {
    const map = new Map<string, { name: string; projects: number; revenue: number; mrr: number }>();
    for (const member of members) {
      map.set(member.id, {
        name: `${member.firstName} ${member.lastName}`,
        projects: 0,
        revenue: 0,
        mrr: 0,
      });
    }
    for (const project of projects) {
      const row = map.get(project.memberId);
      if (row) {
        row.projects++;
        row.revenue += project.contractValue;
        row.mrr += project.monthlyRecurring;
      }
    }
    return Array.from(map.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }, [members, projects]);

  const rankColumns: ColDef<MemberRankRow>[] = useMemo(
    () => [
      {
        key: "rank",
        label: "#",
        sortable: true,
        render: (v) => (
          <span className="text-cyan-400 text-xs font-bold">{String(v)}</span>
        ),
      },
      {
        key: "name",
        label: "Team Member",
        sortable: true,
        render: (v) => <span className="text-gray-200 text-xs font-medium">{String(v)}</span>,
      },
      {
        key: "projects",
        label: "Projects",
        sortable: true,
        accessor: (row) => row.projects,
        render: (v) => <span className="text-gray-300 text-xs">{String(v)}</span>,
      },
      {
        key: "revenue",
        label: "Revenue",
        sortable: true,
        accessor: (row) => row.revenue,
        render: (_v, row) => (
          <span className="text-gray-300 text-xs">{fmtUSD(row.revenue)}</span>
        ),
      },
      {
        key: "mrr",
        label: "MRR",
        sortable: true,
        accessor: (row) => row.mrr,
        render: (_v, row) => (
          <span className="text-cyan-400 text-xs font-medium">{fmtUSD(row.mrr)}</span>
        ),
      },
    ],
    []
  );

  // 3. Revenue by Project Type
  const projectTypeData = useMemo(() => {
    const byType: Record<string, number> = {};
    for (const p of projects) {
      byType[p.projectType] = (byType[p.projectType] || 0) + p.contractValue;
    }
    return Object.entries(byType)
      .sort(([, a], [, b]) => b - a)
      .map(([type, value]) => ({
        label: PROJECT_TYPE_LABELS[type as keyof typeof PROJECT_TYPE_LABELS] || type,
        value,
        color: PROJECT_TYPE_COLORS[type] || "#06b6d4",
      }));
  }, [projects]);

  // 4. Pipeline Conversion
  const pipelineConversion = useMemo(() => {
    const total = projects.length || 1;
    return PROJECT_STAGES.map((stage) => {
      const count = projects.filter((p) => p.stage === stage).length;
      return {
        label: STAGE_LABELS[stage],
        value: count,
        color: STAGE_CHART_COLORS[stage],
        pct: Math.round((count / total) * 100),
      };
    });
  }, [projects]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. Monthly Revenue Trend */}
      <div className="rounded-xl border border-gray-700/50 bg-[#0f1a2e]/60 p-5">
        <h3 className="text-sm font-semibold text-gray-200 mb-4">Monthly Revenue Trend</h3>
        {monthlyData.length === 0 ? (
          <p className="text-xs text-gray-600">No project data available.</p>
        ) : (
          <MiniChart
            data={monthlyData}
            type="bar"
            height={180}
            width={460}
            showLabels
            showValues
          />
        )}
      </div>

      {/* 2. Team Member Rankings */}
      <div className="rounded-xl border border-gray-700/50 bg-[#0f1a2e]/60 p-5">
        <h3 className="text-sm font-semibold text-gray-200 mb-4">Team Rankings</h3>
        <SimpleDataTable
          rows={memberRankings}
          columns={rankColumns}
          getRowKey={(r) => r.id}
          initialSortField="rank"
          initialSortDir="asc"
        />
      </div>

      {/* 3. Revenue by Project Type */}
      <div className="rounded-xl border border-gray-700/50 bg-[#0f1a2e]/60 p-5">
        <h3 className="text-sm font-semibold text-gray-200 mb-4">Revenue by Project Type</h3>
        {projectTypeData.length === 0 ? (
          <p className="text-xs text-gray-600">No project data available.</p>
        ) : (
          <MiniChart
            data={projectTypeData}
            type="horizontal-bar"
            height={180}
            width={420}
            showLabels
            showValues
          />
        )}
      </div>

      {/* 4. Pipeline Conversion */}
      <div className="rounded-xl border border-gray-700/50 bg-[#0f1a2e]/60 p-5">
        <h3 className="text-sm font-semibold text-gray-200 mb-4">Pipeline Conversion</h3>
        <div className="space-y-3">
          {pipelineConversion.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="w-[80px] text-xs text-gray-400 text-right shrink-0">
                {item.label}
              </span>
              <div className="flex-1 h-5 rounded bg-gray-800/50 overflow-hidden relative">
                <div
                  className="h-full rounded transition-all duration-500 ease-out"
                  style={{
                    width: `${item.pct}%`,
                    backgroundColor: item.color,
                    opacity: 0.75,
                  }}
                />
              </div>
              <span className="text-xs text-gray-300 font-medium w-[48px] text-right shrink-0">
                {item.value} <span className="text-gray-500">({item.pct}%)</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
