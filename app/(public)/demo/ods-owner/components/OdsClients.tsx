"use client";

import React, { useState, useMemo, useCallback } from "react";
import { SimpleDataTable, type ColDef } from "ods-ui-library";
import type {
  OdsState,
  OdsAction,
  OdsClient,
} from "../data/types";
import { STAGE_LABELS } from "../data/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function initials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function uid(): string {
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const SOURCE_OPTIONS: OdsClient["source"][] = ["referral", "website", "linkedin", "cold_outreach", "conference"];
const SOURCE_LABELS: Record<OdsClient["source"], string> = {
  referral: "Referral",
  website: "Website",
  linkedin: "LinkedIn",
  cold_outreach: "Cold Outreach",
  conference: "Conference",
};

const SOURCE_COLORS: Record<OdsClient["source"], string> = {
  referral: "bg-green-500/20 text-green-300 border-green-600",
  website: "bg-blue-500/20 text-blue-300 border-blue-600",
  linkedin: "bg-cyan-500/20 text-cyan-300 border-cyan-600",
  cold_outreach: "bg-amber-500/20 text-amber-300 border-amber-600",
  conference: "bg-purple-500/20 text-purple-300 border-purple-600",
};

const EMPTY_CLIENT: Omit<OdsClient, "id" | "createdAt" | "updatedAt"> = {
  firstName: "",
  lastName: "",
  company: "",
  email: "",
  phone: "",
  industry: "",
  assignedMemberId: "",
  source: "website",
  notes: "",
};

// ── Component ───────────────────────────────────────────────────────────────

export function OdsClients({
  state,
  dispatch,
}: {
  state: OdsState;
  dispatch: React.Dispatch<OdsAction>;
}) {
  const { clients, projects, tasks, members } = state;

  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [selectedClient, setSelectedClient] = useState<OdsClient | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<OdsClient | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Filtered clients
  const filteredClients = useMemo(() => {
    if (sourceFilter === "all") return clients;
    return clients.filter((c) => c.source === sourceFilter);
  }, [clients, sourceFilter]);

  // Member lookup
  const memberMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of members) m.set(a.id, `${a.firstName} ${a.lastName}`);
    return m;
  }, [members]);

  // Related projects/tasks for detail
  const relatedProjects = useMemo(
    () => (selectedClient ? projects.filter((p) => p.clientId === selectedClient.id) : []),
    [selectedClient, projects]
  );
  const relatedTasks = useMemo(
    () => (selectedClient ? tasks.filter((t) => t.relatedClientId === selectedClient.id) : []),
    [selectedClient, tasks]
  );

  // Table columns
  const columns: ColDef<OdsClient>[] = useMemo(
    () => [
      {
        key: "name",
        label: "Name",
        sortable: true,
        accessor: (row) => `${row.firstName} ${row.lastName}`,
        sortValue: (row) => `${row.lastName} ${row.firstName}`,
        render: (_v, row) => (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#1a2a4a] border border-gray-600 flex items-center justify-center text-[10px] font-bold text-cyan-400 shrink-0">
              {initials(row.firstName, row.lastName)}
            </div>
            <div>
              <span className="text-gray-200 text-xs font-medium block">
                {row.firstName} {row.lastName}
              </span>
              <span className="text-[10px] text-gray-500">{row.company}</span>
            </div>
          </div>
        ),
      },
      {
        key: "company",
        label: "Company",
        sortable: true,
        render: (v) => <span className="text-gray-300 text-xs">{String(v)}</span>,
      },
      {
        key: "industry",
        label: "Industry",
        sortable: true,
        render: (v) => <span className="text-gray-400 text-xs">{String(v)}</span>,
      },
      {
        key: "source",
        label: "Source",
        sortable: true,
        render: (v) => {
          const src = v as OdsClient["source"];
          return (
            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${SOURCE_COLORS[src]}`}>
              {SOURCE_LABELS[src]}
            </span>
          );
        },
      },
      {
        key: "member",
        label: "Assigned To",
        accessor: (row) => memberMap.get(row.assignedMemberId) || "Unassigned",
        render: (v) => <span className="text-gray-400 text-xs">{String(v)}</span>,
      },
    ],
    [memberMap]
  );

  // Form state
  const [form, setForm] = useState(EMPTY_CLIENT);

  const openAddForm = useCallback(() => {
    setForm(EMPTY_CLIENT);
    setEditingClient(null);
    setShowForm(true);
  }, []);

  const openEditForm = useCallback((client: OdsClient) => {
    setForm({
      firstName: client.firstName,
      lastName: client.lastName,
      company: client.company,
      email: client.email,
      phone: client.phone,
      industry: client.industry,
      assignedMemberId: client.assignedMemberId,
      source: client.source,
      notes: client.notes,
    });
    setEditingClient(client);
    setShowForm(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    const now = new Date().toISOString();

    if (editingClient) {
      dispatch({
        type: "UPDATE_CLIENT",
        id: editingClient.id,
        updates: { ...form },
      });
    } else {
      dispatch({
        type: "ADD_CLIENT",
        client: {
          ...form,
          id: uid(),
          createdAt: now,
          updatedAt: now,
        },
      });
    }
    setShowForm(false);
    setEditingClient(null);
  }, [form, editingClient, dispatch]);

  const handleDelete = useCallback(
    (id: string) => {
      dispatch({ type: "DELETE_CLIENT", id });
      setDeleteConfirm(null);
      setSelectedClient(null);
    },
    [dispatch]
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-0 h-full flex flex-col">
      <SimpleDataTable
        rows={filteredClients}
        columns={columns}
        getRowKey={(r) => r.id}
        searchQuery={search}
        initialSortField="name"
        onRowClick={(row) => setSelectedClient(row)}
        toolbar={
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[180px] rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 placeholder-gray-500 outline-none focus:border-cyan-500/50"
            />
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-300 outline-none focus:border-cyan-500/50"
            >
              <option value="all">All Sources</option>
              {SOURCE_OPTIONS.map((s) => (
                <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
              ))}
            </select>
            <button
              onClick={openAddForm}
              className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-[#0a1628] hover:bg-cyan-400 transition-colors"
            >
              + Add Client
            </button>
          </div>
        }
      />

      {/* Detail Slide-over */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedClient(null)} />
          <div className="relative w-full max-w-md bg-[#0f1a2e] border-l border-gray-700 shadow-2xl overflow-y-auto">
            <div className="p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1a2a4a] border border-gray-600 flex items-center justify-center text-sm font-bold text-cyan-400">
                    {initials(selectedClient.firstName, selectedClient.lastName)}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-100">
                      {selectedClient.firstName} {selectedClient.lastName}
                    </h2>
                    <p className="text-xs text-gray-500">{selectedClient.company}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedClient(null)} className="text-gray-500 hover:text-gray-300 text-lg">&times;</button>
              </div>

              {/* Client Info */}
              <div className="space-y-3 text-xs mb-6">
                <InfoRow label="Email" value={selectedClient.email} />
                <InfoRow label="Phone" value={selectedClient.phone} />
                <InfoRow label="Industry" value={selectedClient.industry} />
                <InfoRow label="Source" value={SOURCE_LABELS[selectedClient.source]} />
                <InfoRow label="Assigned" value={memberMap.get(selectedClient.assignedMemberId) || "Unassigned"} />
                {selectedClient.notes && <InfoRow label="Notes" value={selectedClient.notes} />}
              </div>

              {/* Related Projects */}
              <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Projects ({relatedProjects.length})</h3>
              {relatedProjects.length === 0 ? (
                <p className="text-xs text-gray-600 mb-4">No projects.</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {relatedProjects.map((p) => (
                    <div key={p.id} className="rounded-lg bg-[#1a2a4a]/50 border border-gray-700 px-3 py-2 text-xs text-gray-300">
                      <span className="font-medium">{p.techStack.split(",")[0]}</span> &middot; {STAGE_LABELS[p.stage]} &middot;{" "}
                      <span className="text-cyan-400">${p.contractValue.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Related Tasks */}
              <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Tasks ({relatedTasks.length})</h3>
              {relatedTasks.length === 0 ? (
                <p className="text-xs text-gray-600 mb-4">No tasks.</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {relatedTasks.map((t) => (
                    <div key={t.id} className="rounded-lg bg-[#1a2a4a]/50 border border-gray-700 px-3 py-2 text-xs text-gray-300 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${t.status === "done" ? "bg-green-500" : t.status === "in_progress" ? "bg-blue-500" : "bg-gray-500"}`} />
                      {t.title}
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-700">
                <button
                  onClick={() => { openEditForm(selectedClient); setSelectedClient(null); }}
                  className="flex-1 rounded-lg border border-gray-600 px-3 py-2 text-xs text-gray-300 hover:bg-gray-700/50 transition-colors"
                >
                  Edit
                </button>
                {deleteConfirm === selectedClient.id ? (
                  <button
                    onClick={() => handleDelete(selectedClient.id)}
                    className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs text-white font-semibold hover:bg-red-700 transition-colors"
                  >
                    Confirm Delete
                  </button>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(selectedClient.id)}
                    className="flex-1 rounded-lg border border-red-600/50 px-3 py-2 text-xs text-red-400 hover:bg-red-900/20 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-lg bg-[#0f1a2e] border border-gray-700 rounded-xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-semibold text-gray-100 mb-4">
              {editingClient ? "Edit Client" : "Add Client"}
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="First Name" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} required />
              <FormField label="Last Name" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} required />
              <FormField label="Company" value={form.company} onChange={(v) => setForm({ ...form, company: v })} full />
              <FormField label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
              <FormField label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} type="tel" />
              <FormField label="Industry" value={form.industry} onChange={(v) => setForm({ ...form, industry: v })} />
              <div className="col-span-1">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Source</label>
                <select
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value as OdsClient["source"] })}
                  className="w-full rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 outline-none focus:border-cyan-500/50"
                >
                  {SOURCE_OPTIONS.map((s) => (
                    <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Assigned To</label>
                <select
                  value={form.assignedMemberId}
                  onChange={(e) => setForm({ ...form, assignedMemberId: e.target.value })}
                  className="w-full rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 outline-none focus:border-cyan-500/50"
                >
                  <option value="">Unassigned</option>
                  {members.map((a) => (
                    <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 placeholder-gray-500 outline-none focus:border-cyan-500/50 resize-none"
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
                onClick={handleSave}
                className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-[#0a1628] hover:bg-cyan-400 transition-colors"
              >
                {editingClient ? "Save Changes" : "Add Client"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared sub-components ───────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex">
      <span className="w-20 text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-300">{value}</span>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
  required,
  full,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  full?: boolean;
}) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 placeholder-gray-500 outline-none focus:border-cyan-500/50"
      />
    </div>
  );
}

