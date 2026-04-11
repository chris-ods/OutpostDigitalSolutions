"use client";

import React, { useState, useMemo, useCallback } from "react";
import { SimpleDataTable, type ColDef } from "ods-ui-library";
import type {
  AtxState,
  AtxAction,
  AtxDeal,
  AtxContact,
  DealStage,
} from "../data/types";
import {
  DEAL_STAGES,
  STAGE_LABELS,
  STAGE_COLORS,
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

function uid(): string {
  return `d_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

type ViewMode = "board" | "table";

const POLICY_TYPES: AtxDeal["policyType"][] = ["life", "health", "auto", "home", "umbrella", "annuity"];
const CARRIERS = ["State Farm", "Allstate", "USAA", "Progressive", "Nationwide", "MetLife", "Prudential", "AIG"];

// ── Component ───────────────────────────────────────────────────────────────

export function AtxPipeline({
  state,
  dispatch,
}: {
  state: AtxState;
  dispatch: React.Dispatch<AtxAction>;
}) {
  const { deals, contacts, agents } = state;
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [showForm, setShowForm] = useState(false);

  // Lookup maps
  const contactMap = useMemo(() => {
    const m = new Map<string, AtxContact>();
    for (const c of contacts) m.set(c.id, c);
    return m;
  }, [contacts]);

  const agentMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of agents) m.set(a.id, `${a.firstName} ${a.lastName}`);
    return m;
  }, [agents]);

  // Deals grouped by stage
  const dealsByStage = useMemo(() => {
    const grouped: Record<DealStage, AtxDeal[]> = {
      lead: [], quoted: [], applied: [], underwriting: [], issued: [], paid: [],
    };
    for (const d of deals) {
      grouped[d.stage].push(d);
    }
    return grouped;
  }, [deals]);

  const moveDeal = useCallback(
    (id: string, stage: DealStage) => {
      dispatch({ type: "MOVE_DEAL_STAGE", id, stage });
    },
    [dispatch]
  );

  // ── Add Deal Form ─────────────────────────────────────────────────────────

  const emptyForm = {
    contactId: "",
    agentId: "",
    policyType: "life" as AtxDeal["policyType"],
    carrier: "",
    stage: "lead" as DealStage,
    annualPremium: "",
    commission: "",
    splitPercent: "100",
    applicationNumber: "",
    expectedCloseDate: "",
    notes: "",
  };

  const [form, setForm] = useState(emptyForm);

  const handleAdd = useCallback(() => {
    if (!form.contactId || !form.agentId) return;
    const contact = contactMap.get(form.contactId);
    const agentName = agentMap.get(form.agentId) || "";
    const now = new Date().toISOString();

    dispatch({
      type: "ADD_DEAL",
      deal: {
        id: uid(),
        contactId: form.contactId,
        contactName: contact ? `${contact.firstName} ${contact.lastName}` : "Unknown",
        agentId: form.agentId,
        agentName,
        policyType: form.policyType,
        carrier: form.carrier,
        stage: form.stage,
        annualPremium: parseFloat(form.annualPremium) || 0,
        commission: parseFloat(form.commission) || 0,
        splitPercent: parseFloat(form.splitPercent) || 100,
        applicationNumber: form.applicationNumber,
        expectedCloseDate: form.expectedCloseDate,
        createdAt: now,
        updatedAt: now,
        notes: form.notes,
      },
    });
    setForm(emptyForm);
    setShowForm(false);
  }, [form, contactMap, agentMap, dispatch]);

  // ── Table columns ─────────────────────────────────────────────────────────

  const tableColumns: ColDef<AtxDeal>[] = useMemo(
    () => [
      {
        key: "contactName",
        label: "Contact",
        sortable: true,
        render: (v) => <span className="text-gray-200 text-xs font-medium">{String(v)}</span>,
      },
      {
        key: "policyType",
        label: "Policy Type",
        sortable: true,
        render: (v) => (
          <span className="text-gray-300 text-xs">
            {POLICY_TYPE_LABELS[v as AtxDeal["policyType"]]}
          </span>
        ),
      },
      {
        key: "carrier",
        label: "Carrier",
        sortable: true,
        render: (v) => <span className="text-gray-400 text-xs">{String(v)}</span>,
      },
      {
        key: "stage",
        label: "Stage",
        sortable: true,
        render: (v) => {
          const s = v as DealStage;
          return (
            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${STAGE_COLORS[s]}`}>
              {STAGE_LABELS[s]}
            </span>
          );
        },
      },
      {
        key: "annualPremium",
        label: "Premium",
        sortable: true,
        sortValue: (row) => row.annualPremium,
        render: (_v, row) => (
          <span className="text-[#d4a843] text-xs font-semibold">{fmtUSD(row.annualPremium)}</span>
        ),
      },
      {
        key: "commission",
        label: "Commission",
        sortable: true,
        sortValue: (row) => row.commission,
        render: (_v, row) => (
          <span className="text-gray-300 text-xs">{fmtUSD(row.commission)}</span>
        ),
      },
      {
        key: "agentName",
        label: "Agent",
        sortable: true,
        render: (v) => <span className="text-gray-400 text-xs">{String(v)}</span>,
      },
      {
        key: "expectedCloseDate",
        label: "Expected Close",
        sortable: true,
        render: (v) => <span className="text-gray-500 text-xs">{String(v)}</span>,
      },
    ],
    []
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex items-center justify-between">
        <div className="flex rounded-lg border border-gray-700 overflow-hidden">
          <button
            onClick={() => setViewMode("board")}
            className={`px-4 py-1.5 text-xs font-medium transition-colors ${
              viewMode === "board"
                ? "bg-[#d4a843] text-[#0a1628]"
                : "bg-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            Board
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`px-4 py-1.5 text-xs font-medium transition-colors ${
              viewMode === "table"
                ? "bg-[#d4a843] text-[#0a1628]"
                : "bg-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            Table
          </button>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setShowForm(true); }}
          className="rounded-lg bg-[#d4a843] px-4 py-2 text-xs font-semibold text-[#0a1628] hover:bg-[#c49a3a] transition-colors"
        >
          + Add Deal
        </button>
      </div>

      {/* Board View */}
      {viewMode === "board" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {DEAL_STAGES.map((stage) => {
            const stageDeals = dealsByStage[stage];
            const stageTotal = stageDeals.reduce((s, d) => s + d.annualPremium, 0);

            return (
              <div
                key={stage}
                className="rounded-xl border border-gray-700/50 bg-[#0f1a2e]/60 flex flex-col"
              >
                {/* Column header */}
                <div className="p-3 border-b border-gray-700/50">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-semibold text-gray-200">
                      {STAGE_LABELS[stage]}
                    </h3>
                    <span className="text-[10px] text-gray-500 bg-gray-700/40 rounded-full px-1.5 py-0.5">
                      {stageDeals.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#d4a843] font-medium">
                    {fmtUSD(stageTotal)}
                  </p>
                </div>

                {/* Cards */}
                <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[400px]">
                  {stageDeals.length === 0 && (
                    <p className="text-[10px] text-gray-600 text-center py-4">No deals</p>
                  )}
                  {stageDeals.map((deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      currentStage={stage}
                      onMoveStage={moveDeal}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="rounded-xl border border-gray-700/50 bg-[#0f1a2e]/60 p-4">
          <SimpleDataTable
            rows={deals}
            columns={tableColumns}
            getRowKey={(r) => r.id}
            initialSortField="annualPremium"
            initialSortDir="desc"
          />
        </div>
      )}

      {/* Add Deal Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-lg bg-[#0f1a2e] border border-gray-700 rounded-xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-semibold text-gray-100 mb-4">Add Deal</h2>

            <div className="grid grid-cols-2 gap-3">
              {/* Contact */}
              <div className="col-span-1">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Contact *</label>
                <select
                  value={form.contactId}
                  onChange={(e) => setForm({ ...form, contactId: e.target.value })}
                  className="w-full rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 outline-none focus:border-[#d4a843]/50"
                >
                  <option value="">Select contact...</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                  ))}
                </select>
              </div>

              {/* Agent */}
              <div className="col-span-1">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Agent *</label>
                <select
                  value={form.agentId}
                  onChange={(e) => setForm({ ...form, agentId: e.target.value })}
                  className="w-full rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 outline-none focus:border-[#d4a843]/50"
                >
                  <option value="">Select agent...</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>
                  ))}
                </select>
              </div>

              {/* Policy Type */}
              <div className="col-span-1">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Policy Type</label>
                <select
                  value={form.policyType}
                  onChange={(e) => setForm({ ...form, policyType: e.target.value as AtxDeal["policyType"] })}
                  className="w-full rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 outline-none focus:border-[#d4a843]/50"
                >
                  {POLICY_TYPES.map((t) => (
                    <option key={t} value={t}>{POLICY_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>

              {/* Carrier */}
              <div className="col-span-1">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Carrier</label>
                <select
                  value={form.carrier}
                  onChange={(e) => setForm({ ...form, carrier: e.target.value })}
                  className="w-full rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 outline-none focus:border-[#d4a843]/50"
                >
                  <option value="">Select carrier...</option>
                  {CARRIERS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Stage */}
              <div className="col-span-1">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Stage</label>
                <select
                  value={form.stage}
                  onChange={(e) => setForm({ ...form, stage: e.target.value as DealStage })}
                  className="w-full rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 outline-none focus:border-[#d4a843]/50"
                >
                  {DEAL_STAGES.map((s) => (
                    <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                  ))}
                </select>
              </div>

              {/* Premium */}
              <div className="col-span-1">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Annual Premium</label>
                <input
                  type="number"
                  value={form.annualPremium}
                  onChange={(e) => setForm({ ...form, annualPremium: e.target.value })}
                  placeholder="0"
                  className="w-full rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 outline-none focus:border-[#d4a843]/50"
                />
              </div>

              {/* Commission */}
              <div className="col-span-1">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Commission</label>
                <input
                  type="number"
                  value={form.commission}
                  onChange={(e) => setForm({ ...form, commission: e.target.value })}
                  placeholder="0"
                  className="w-full rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 outline-none focus:border-[#d4a843]/50"
                />
              </div>

              {/* Split Percent */}
              <div className="col-span-1">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Split %</label>
                <input
                  type="number"
                  value={form.splitPercent}
                  onChange={(e) => setForm({ ...form, splitPercent: e.target.value })}
                  className="w-full rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 outline-none focus:border-[#d4a843]/50"
                />
              </div>

              {/* Application Number */}
              <div className="col-span-1">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">App Number</label>
                <input
                  type="text"
                  value={form.applicationNumber}
                  onChange={(e) => setForm({ ...form, applicationNumber: e.target.value })}
                  className="w-full rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 outline-none focus:border-[#d4a843]/50"
                />
              </div>

              {/* Expected Close */}
              <div className="col-span-1">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Expected Close</label>
                <input
                  type="date"
                  value={form.expectedCloseDate}
                  onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })}
                  className="w-full rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 outline-none focus:border-[#d4a843]/50"
                />
              </div>

              {/* Notes */}
              <div className="col-span-2">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 outline-none focus:border-[#d4a843]/50 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-gray-600 px-4 py-2 text-xs text-gray-300 hover:bg-gray-700/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="rounded-lg bg-[#d4a843] px-4 py-2 text-xs font-semibold text-[#0a1628] hover:bg-[#c49a3a] transition-colors"
              >
                Add Deal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Deal Card (Board View) ──────────────────────────────────────────────────

function DealCard({
  deal,
  currentStage,
  onMoveStage,
}: {
  deal: AtxDeal;
  currentStage: DealStage;
  onMoveStage: (id: string, stage: DealStage) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="rounded-lg bg-[#1a2a4a]/60 border border-gray-700/60 p-2.5 space-y-1.5 relative">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-gray-200 leading-snug">{deal.contactName}</p>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-gray-500 hover:text-gray-300 text-xs px-1"
          >
            &#8942;
          </button>
          {showMenu && (
            <div className="absolute right-0 top-5 z-20 bg-[#0f1a2e] border border-gray-700 rounded-lg shadow-xl py-1 min-w-[120px]">
              {DEAL_STAGES.filter((s) => s !== currentStage).map((stage) => (
                <button
                  key={stage}
                  onClick={() => { onMoveStage(deal.id, stage); setShowMenu(false); }}
                  className="block w-full text-left px-3 py-1.5 text-[10px] text-gray-300 hover:bg-gray-700/50"
                >
                  Move to {STAGE_LABELS[stage]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold border ${STAGE_COLORS[deal.stage]}`}>
        {POLICY_TYPE_LABELS[deal.policyType]}
      </span>
      <p className="text-[10px] text-gray-400">{deal.carrier}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#d4a843]">{fmtUSD(deal.annualPremium)}</span>
        <span className="w-5 h-5 rounded-full bg-[#1a2a4a] border border-gray-600 flex items-center justify-center text-[8px] font-bold text-gray-400">
          {deal.agentName
            .split(" ")
            .map((n) => n.charAt(0))
            .join("")}
        </span>
      </div>
    </div>
  );
}
