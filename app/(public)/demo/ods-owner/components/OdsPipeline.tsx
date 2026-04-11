"use client";

import React, { useState, useMemo, useCallback } from "react";
import { SimpleDataTable, type ColDef } from "ods-ui-library";
import type {
  OdsState,
  OdsAction,
  OdsProject,
  OdsClient,
  ProjectStage,
} from "../data/types";
import {
  PROJECT_STAGES,
  STAGE_LABELS,
  STAGE_COLORS,
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

function uid(): string {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

type ViewMode = "board" | "table";

const PROJECT_TYPES: OdsProject["projectType"][] = ["web_app", "mobile_app", "saas_platform", "api_integration", "consulting", "maintenance"];
const TECH_STACKS = ["Next.js, Firebase, Tailwind", "React Native, Firebase", "Next.js, Supabase", "Node.js, PostgreSQL", "Next.js, AWS", "Figma, Design System"];

// ── Component ───────────────────────────────────────────────────────────────

export function OdsPipeline({
  state,
  dispatch,
}: {
  state: OdsState;
  dispatch: React.Dispatch<OdsAction>;
}) {
  const { projects, clients, members } = state;
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [showForm, setShowForm] = useState(false);

  // Lookup maps
  const clientMap = useMemo(() => {
    const m = new Map<string, OdsClient>();
    for (const c of clients) m.set(c.id, c);
    return m;
  }, [clients]);

  const memberMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of members) m.set(a.id, `${a.firstName} ${a.lastName}`);
    return m;
  }, [members]);

  // Projects grouped by stage
  const projectsByStage = useMemo(() => {
    const grouped: Record<ProjectStage, OdsProject[]> = {
      discovery: [], proposal: [], in_progress: [], review: [], deployed: [], completed: [],
    };
    for (const p of projects) {
      grouped[p.stage].push(p);
    }
    return grouped;
  }, [projects]);

  const moveProject = useCallback(
    (id: string, stage: ProjectStage) => {
      dispatch({ type: "MOVE_PROJECT_STAGE", id, stage });
    },
    [dispatch]
  );

  // ── Add Project Form ──────────────────────────────────────────────────────

  const emptyForm = {
    clientId: "",
    memberId: "",
    projectType: "web_app" as OdsProject["projectType"],
    techStack: "",
    stage: "discovery" as ProjectStage,
    contractValue: "",
    monthlyRecurring: "",
    estimatedHours: "",
    startDate: "",
    expectedDelivery: "",
    notes: "",
  };

  const [form, setForm] = useState(emptyForm);

  const handleAdd = useCallback(() => {
    if (!form.clientId || !form.memberId) return;
    const client = clientMap.get(form.clientId);
    const memberName = memberMap.get(form.memberId) || "";
    const now = new Date().toISOString();

    dispatch({
      type: "ADD_PROJECT",
      project: {
        id: uid(),
        clientId: form.clientId,
        clientName: client ? `${client.company}` : "Unknown",
        memberId: form.memberId,
        memberName,
        projectType: form.projectType,
        techStack: form.techStack,
        stage: form.stage,
        contractValue: parseFloat(form.contractValue) || 0,
        monthlyRecurring: parseFloat(form.monthlyRecurring) || 0,
        estimatedHours: parseFloat(form.estimatedHours) || 0,
        startDate: form.startDate,
        expectedDelivery: form.expectedDelivery,
        createdAt: now,
        updatedAt: now,
        notes: form.notes,
      },
    });
    setForm(emptyForm);
    setShowForm(false);
  }, [form, clientMap, memberMap, dispatch]);

  // ── Table columns ─────────────────────────────────────────────────────────

  const tableColumns: ColDef<OdsProject>[] = useMemo(
    () => [
      {
        key: "clientName",
        label: "Client",
        sortable: true,
        render: (v) => <span className="text-gray-200 text-xs font-medium">{String(v)}</span>,
      },
      {
        key: "projectType",
        label: "Type",
        sortable: true,
        render: (v) => (
          <span className="text-gray-300 text-xs">
            {PROJECT_TYPE_LABELS[v as OdsProject["projectType"]]}
          </span>
        ),
      },
      {
        key: "techStack",
        label: "Tech Stack",
        sortable: true,
        render: (v) => <span className="text-gray-400 text-xs">{String(v)}</span>,
      },
      {
        key: "stage",
        label: "Stage",
        sortable: true,
        render: (v) => {
          const s = v as ProjectStage;
          return (
            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${STAGE_COLORS[s]}`}>
              {STAGE_LABELS[s]}
            </span>
          );
        },
      },
      {
        key: "contractValue",
        label: "Contract",
        sortable: true,
        sortValue: (row) => row.contractValue,
        render: (_v, row) => (
          <span className="text-cyan-400 text-xs font-semibold">{fmtUSD(row.contractValue)}</span>
        ),
      },
      {
        key: "monthlyRecurring",
        label: "MRR",
        sortable: true,
        sortValue: (row) => row.monthlyRecurring,
        render: (_v, row) => (
          <span className="text-gray-300 text-xs">{row.monthlyRecurring > 0 ? fmtUSD(row.monthlyRecurring) : "—"}</span>
        ),
      },
      {
        key: "memberName",
        label: "Lead",
        sortable: true,
        render: (v) => <span className="text-gray-400 text-xs">{String(v)}</span>,
      },
      {
        key: "expectedDelivery",
        label: "Delivery",
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
                ? "bg-cyan-500 text-[#0a1628]"
                : "bg-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            Board
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`px-4 py-1.5 text-xs font-medium transition-colors ${
              viewMode === "table"
                ? "bg-cyan-500 text-[#0a1628]"
                : "bg-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            Table
          </button>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setShowForm(true); }}
          className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-[#0a1628] hover:bg-cyan-400 transition-colors"
        >
          + Add Project
        </button>
      </div>

      {/* Board View */}
      {viewMode === "board" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {PROJECT_STAGES.map((stage) => {
            const stageProjects = projectsByStage[stage];
            const stageTotal = stageProjects.reduce((s, p) => s + p.contractValue, 0);

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
                      {stageProjects.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-cyan-400 font-medium">
                    {fmtUSD(stageTotal)}
                  </p>
                </div>

                {/* Cards */}
                <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[400px]">
                  {stageProjects.length === 0 && (
                    <p className="text-[10px] text-gray-600 text-center py-4">No projects</p>
                  )}
                  {stageProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      currentStage={stage}
                      onMoveStage={moveProject}
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
            rows={projects}
            columns={tableColumns}
            getRowKey={(r) => r.id}
            initialSortField="contractValue"
            initialSortDir="desc"
          />
        </div>
      )}

      {/* Add Project Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-lg bg-[#0f1a2e] border border-gray-700 rounded-xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-semibold text-gray-100 mb-4">Add Project</h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-1">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Client *</label>
                <select
                  value={form.clientId}
                  onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                  className="w-full rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 outline-none focus:border-cyan-500/50"
                >
                  <option value="">Select client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.company} — {c.firstName} {c.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Lead *</label>
                <select
                  value={form.memberId}
                  onChange={(e) => setForm({ ...form, memberId: e.target.value })}
                  className="w-full rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 outline-none focus:border-cyan-500/50"
                >
                  <option value="">Select team member...</option>
                  {members.map((a) => (
                    <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Project Type</label>
                <select
                  value={form.projectType}
                  onChange={(e) => setForm({ ...form, projectType: e.target.value as OdsProject["projectType"] })}
                  className="w-full rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 outline-none focus:border-cyan-500/50"
                >
                  {PROJECT_TYPES.map((t) => (
                    <option key={t} value={t}>{PROJECT_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Tech Stack</label>
                <select
                  value={form.techStack}
                  onChange={(e) => setForm({ ...form, techStack: e.target.value })}
                  className="w-full rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 outline-none focus:border-cyan-500/50"
                >
                  <option value="">Select stack...</option>
                  {TECH_STACKS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Stage</label>
                <select
                  value={form.stage}
                  onChange={(e) => setForm({ ...form, stage: e.target.value as ProjectStage })}
                  className="w-full rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 outline-none focus:border-cyan-500/50"
                >
                  {PROJECT_STAGES.map((s) => (
                    <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Contract Value</label>
                <input
                  type="number"
                  value={form.contractValue}
                  onChange={(e) => setForm({ ...form, contractValue: e.target.value })}
                  placeholder="0"
                  className="w-full rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Monthly Recurring</label>
                <input
                  type="number"
                  value={form.monthlyRecurring}
                  onChange={(e) => setForm({ ...form, monthlyRecurring: e.target.value })}
                  placeholder="0"
                  className="w-full rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Est. Hours</label>
                <input
                  type="number"
                  value={form.estimatedHours}
                  onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })}
                  placeholder="0"
                  className="w-full rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Expected Delivery</label>
                <input
                  type="date"
                  value={form.expectedDelivery}
                  onChange={(e) => setForm({ ...form, expectedDelivery: e.target.value })}
                  className="w-full rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 outline-none focus:border-cyan-500/50 resize-none"
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
                className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-[#0a1628] hover:bg-cyan-400 transition-colors"
              >
                Add Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Project Card (Board View) ──────────────────────────────────────────────

function ProjectCard({
  project,
  currentStage,
  onMoveStage,
}: {
  project: OdsProject;
  currentStage: ProjectStage;
  onMoveStage: (id: string, stage: ProjectStage) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="rounded-lg bg-[#1a2a4a]/60 border border-gray-700/60 p-2.5 space-y-1.5 relative">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-gray-200 leading-snug">{project.clientName}</p>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-gray-500 hover:text-gray-300 text-xs px-1"
          >
            &#8942;
          </button>
          {showMenu && (
            <div className="absolute right-0 top-5 z-20 bg-[#0f1a2e] border border-gray-700 rounded-lg shadow-xl py-1 min-w-[120px]">
              {PROJECT_STAGES.filter((s) => s !== currentStage).map((stage) => (
                <button
                  key={stage}
                  onClick={() => { onMoveStage(project.id, stage); setShowMenu(false); }}
                  className="block w-full text-left px-3 py-1.5 text-[10px] text-gray-300 hover:bg-gray-700/50"
                >
                  Move to {STAGE_LABELS[stage]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold border ${STAGE_COLORS[project.stage]}`}>
        {PROJECT_TYPE_LABELS[project.projectType]}
      </span>
      <p className="text-[10px] text-gray-400">{project.techStack.split(",")[0]}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-cyan-400">{fmtUSD(project.contractValue)}</span>
        <span className="w-5 h-5 rounded-full bg-[#1a2a4a] border border-gray-600 flex items-center justify-center text-[8px] font-bold text-gray-400">
          {project.memberName
            .split(" ")
            .map((n) => n.charAt(0))
            .join("")}
        </span>
      </div>
    </div>
  );
}
