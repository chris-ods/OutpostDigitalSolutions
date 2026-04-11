"use client";

import React, { useMemo } from "react";
import { SimpleDataTable, type ColDef } from "ods-ui-library";
import { MiniChart } from "./MiniChart";
import type { AtxState } from "../data/types";
import {
  DEAL_STAGES,
  STAGE_LABELS,
  POLICY_TYPE_LABELS,
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
  lead: "#6b7280",
  quoted: "#3b82f6",
  applied: "#6366f1",
  underwriting: "#f59e0b",
  issued: "#22c55e",
  paid: "#10b981",
};

const POLICY_CHART_COLORS: Record<string, string> = {
  life: "#3b82f6",
  health: "#22c55e",
  auto: "#f59e0b",
  home: "#8b5cf6",
  umbrella: "#ec4899",
  annuity: "#06b6d4",
};

// ── Agent ranking row ───────────────────────────────────────────────────────

type AgentRankRow = {
  id: string;
  rank: number;
  name: string;
  deals: number;
  premium: number;
  commission: number;
};

// ── Component ───────────────────────────────────────────────────────────────

export function AtxReports({ state }: { state: AtxState }) {
  const { deals, agents } = state;

  // 1. Monthly Premium Trend
  const monthlyData = useMemo(() => {
    const byMonth: Record<string, number> = {};
    for (const d of deals) {
      const date = new Date(d.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      byMonth[key] = (byMonth[key] || 0) + d.annualPremium;
    }
    const sorted = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).slice(-8);
    return sorted.map(([key, value]) => {
      const [, month] = key.split("-");
      return { label: MONTH_NAMES[parseInt(month, 10) - 1], value };
    });
  }, [deals]);

  // 2. Agent Rankings
  const agentRankings = useMemo<AgentRankRow[]>(() => {
    const map = new Map<string, { name: string; deals: number; premium: number; commission: number }>();
    for (const agent of agents) {
      map.set(agent.id, {
        name: `${agent.firstName} ${agent.lastName}`,
        deals: 0,
        premium: 0,
        commission: 0,
      });
    }
    for (const deal of deals) {
      const row = map.get(deal.agentId);
      if (row) {
        row.deals++;
        row.premium += deal.annualPremium;
        row.commission += deal.commission;
      }
    }
    return Array.from(map.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.premium - a.premium)
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }, [agents, deals]);

  const rankColumns: ColDef<AgentRankRow>[] = useMemo(
    () => [
      {
        key: "rank",
        label: "#",
        sortable: true,
        render: (v) => (
          <span className="text-[#d4a843] text-xs font-bold">{String(v)}</span>
        ),
      },
      {
        key: "name",
        label: "Agent",
        sortable: true,
        render: (v) => <span className="text-gray-200 text-xs font-medium">{String(v)}</span>,
      },
      {
        key: "deals",
        label: "Deals",
        sortable: true,
        accessor: (row) => row.deals,
        render: (v) => <span className="text-gray-300 text-xs">{String(v)}</span>,
      },
      {
        key: "premium",
        label: "Premium",
        sortable: true,
        accessor: (row) => row.premium,
        render: (_v, row) => (
          <span className="text-gray-300 text-xs">{fmtUSD(row.premium)}</span>
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

  // 3. Revenue by Policy Type
  const policyTypeData = useMemo(() => {
    const byType: Record<string, number> = {};
    for (const d of deals) {
      byType[d.policyType] = (byType[d.policyType] || 0) + d.annualPremium;
    }
    return Object.entries(byType)
      .sort(([, a], [, b]) => b - a)
      .map(([type, value]) => ({
        label: POLICY_TYPE_LABELS[type as keyof typeof POLICY_TYPE_LABELS] || type,
        value,
        color: POLICY_CHART_COLORS[type] || "#3b82f6",
      }));
  }, [deals]);

  // 4. Pipeline Conversion
  const pipelineConversion = useMemo(() => {
    const total = deals.length || 1;
    return DEAL_STAGES.map((stage) => {
      const count = deals.filter((d) => d.stage === stage).length;
      return {
        label: STAGE_LABELS[stage],
        value: count,
        color: STAGE_CHART_COLORS[stage],
        pct: Math.round((count / total) * 100),
      };
    });
  }, [deals]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. Monthly Premium Trend */}
      <div className="rounded-xl border border-gray-700/50 bg-[#0f1a2e]/60 p-5">
        <h3 className="text-sm font-semibold text-gray-200 mb-4">Monthly Premium Trend</h3>
        {monthlyData.length === 0 ? (
          <p className="text-xs text-gray-600">No deal data available.</p>
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

      {/* 2. Agent Rankings */}
      <div className="rounded-xl border border-gray-700/50 bg-[#0f1a2e]/60 p-5">
        <h3 className="text-sm font-semibold text-gray-200 mb-4">Agent Rankings</h3>
        <SimpleDataTable
          rows={agentRankings}
          columns={rankColumns}
          getRowKey={(r) => r.id}
          initialSortField="rank"
          initialSortDir="asc"
        />
      </div>

      {/* 3. Revenue by Policy Type */}
      <div className="rounded-xl border border-gray-700/50 bg-[#0f1a2e]/60 p-5">
        <h3 className="text-sm font-semibold text-gray-200 mb-4">Revenue by Policy Type</h3>
        {policyTypeData.length === 0 ? (
          <p className="text-xs text-gray-600">No deal data available.</p>
        ) : (
          <MiniChart
            data={policyTypeData}
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
