"use client";

import React, { useState, useMemo, useCallback } from "react";
import { SimpleDataTable, type ColDef } from "ods-ui-library";
import type {
  AtxState,
  AtxAction,
  AtxContact,
} from "../data/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function initials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function uid(): string {
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const SOURCE_OPTIONS: AtxContact["source"][] = ["referral", "web", "cold_call", "walk_in", "social_media"];
const SOURCE_LABELS: Record<AtxContact["source"], string> = {
  referral: "Referral",
  web: "Web",
  cold_call: "Cold Call",
  walk_in: "Walk-In",
  social_media: "Social Media",
};

const SOURCE_COLORS: Record<AtxContact["source"], string> = {
  referral: "bg-green-500/20 text-green-300 border-green-600",
  web: "bg-blue-500/20 text-blue-300 border-blue-600",
  cold_call: "bg-amber-500/20 text-amber-300 border-amber-600",
  walk_in: "bg-purple-500/20 text-purple-300 border-purple-600",
  social_media: "bg-pink-500/20 text-pink-300 border-pink-600",
};

const EMPTY_CONTACT: Omit<AtxContact, "id" | "createdAt" | "updatedAt"> = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  dateOfBirth: "",
  assignedAgentId: "",
  source: "web",
  tags: [],
  notes: "",
};

// ── Component ───────────────────────────────────────────────────────────────

export function AtxContacts({
  state,
  dispatch,
}: {
  state: AtxState;
  dispatch: React.Dispatch<AtxAction>;
}) {
  const { contacts, deals, tasks, agents } = state;

  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [selectedContact, setSelectedContact] = useState<AtxContact | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<AtxContact | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    if (sourceFilter === "all") return contacts;
    return contacts.filter((c) => c.source === sourceFilter);
  }, [contacts, sourceFilter]);

  // Agent lookup
  const agentMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of agents) m.set(a.id, `${a.firstName} ${a.lastName}`);
    return m;
  }, [agents]);

  // Related deals/tasks for detail
  const relatedDeals = useMemo(
    () => (selectedContact ? deals.filter((d) => d.contactId === selectedContact.id) : []),
    [selectedContact, deals]
  );
  const relatedTasks = useMemo(
    () => (selectedContact ? tasks.filter((t) => t.relatedContactId === selectedContact.id) : []),
    [selectedContact, tasks]
  );

  // Table columns
  const columns: ColDef<AtxContact>[] = useMemo(
    () => [
      {
        key: "name",
        label: "Name",
        sortable: true,
        accessor: (row) => `${row.firstName} ${row.lastName}`,
        sortValue: (row) => `${row.lastName} ${row.firstName}`,
        render: (_v, row) => (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#1a2a4a] border border-gray-600 flex items-center justify-center text-[10px] font-bold text-[#d4a843] shrink-0">
              {initials(row.firstName, row.lastName)}
            </div>
            <span className="text-gray-200 text-xs font-medium">
              {row.firstName} {row.lastName}
            </span>
          </div>
        ),
      },
      {
        key: "email",
        label: "Email",
        sortable: true,
        render: (v) => <span className="text-gray-400 text-xs">{String(v)}</span>,
      },
      {
        key: "phone",
        label: "Phone",
        render: (v) => <span className="text-gray-400 text-xs">{String(v)}</span>,
      },
      {
        key: "state",
        label: "State",
        sortable: true,
        render: (v) => <span className="text-gray-400 text-xs">{String(v)}</span>,
      },
      {
        key: "source",
        label: "Source",
        sortable: true,
        render: (v) => {
          const src = v as AtxContact["source"];
          return (
            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${SOURCE_COLORS[src]}`}>
              {SOURCE_LABELS[src]}
            </span>
          );
        },
      },
      {
        key: "agent",
        label: "Agent",
        accessor: (row) => agentMap.get(row.assignedAgentId) || "Unassigned",
        render: (v) => <span className="text-gray-400 text-xs">{String(v)}</span>,
      },
    ],
    [agentMap]
  );

  // Form state
  const [form, setForm] = useState(EMPTY_CONTACT);

  const openAddForm = useCallback(() => {
    setForm(EMPTY_CONTACT);
    setEditingContact(null);
    setShowForm(true);
  }, []);

  const openEditForm = useCallback((contact: AtxContact) => {
    setForm({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      address: contact.address,
      city: contact.city,
      state: contact.state,
      zip: contact.zip,
      dateOfBirth: contact.dateOfBirth,
      assignedAgentId: contact.assignedAgentId,
      source: contact.source,
      tags: contact.tags,
      notes: contact.notes,
    });
    setEditingContact(contact);
    setShowForm(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    const now = new Date().toISOString();

    if (editingContact) {
      dispatch({
        type: "UPDATE_CONTACT",
        id: editingContact.id,
        updates: { ...form },
      });
    } else {
      dispatch({
        type: "ADD_CONTACT",
        contact: {
          ...form,
          id: uid(),
          createdAt: now,
          updatedAt: now,
        },
      });
    }
    setShowForm(false);
    setEditingContact(null);
  }, [form, editingContact, dispatch]);

  const handleDelete = useCallback(
    (id: string) => {
      dispatch({ type: "DELETE_CONTACT", id });
      setDeleteConfirm(null);
      setSelectedContact(null);
    },
    [dispatch]
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-0 h-full flex flex-col">
      {/* Toolbar */}
      <SimpleDataTable
        rows={filteredContacts}
        columns={columns}
        getRowKey={(r) => r.id}
        searchQuery={search}
        initialSortField="name"
        onRowClick={(row) => setSelectedContact(row)}
        toolbar={
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <input
              type="text"
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[180px] rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 placeholder-gray-500 outline-none focus:border-[#d4a843]/50"
            />
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-300 outline-none focus:border-[#d4a843]/50"
            >
              <option value="all">All Sources</option>
              {SOURCE_OPTIONS.map((s) => (
                <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
              ))}
            </select>
            <button
              onClick={openAddForm}
              className="rounded-lg bg-[#d4a843] px-4 py-2 text-xs font-semibold text-[#0a1628] hover:bg-[#c49a3a] transition-colors"
            >
              + Add Contact
            </button>
          </div>
        }
      />

      {/* Detail Slide-over */}
      {selectedContact && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedContact(null)} />
          <div className="relative w-full max-w-md bg-[#0f1a2e] border-l border-gray-700 shadow-2xl overflow-y-auto">
            <div className="p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1a2a4a] border border-gray-600 flex items-center justify-center text-sm font-bold text-[#d4a843]">
                    {initials(selectedContact.firstName, selectedContact.lastName)}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-100">
                      {selectedContact.firstName} {selectedContact.lastName}
                    </h2>
                    <p className="text-xs text-gray-500">{selectedContact.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedContact(null)} className="text-gray-500 hover:text-gray-300 text-lg">&times;</button>
              </div>

              {/* Contact Info */}
              <div className="space-y-3 text-xs mb-6">
                <InfoRow label="Phone" value={selectedContact.phone} />
                <InfoRow label="Address" value={`${selectedContact.address}, ${selectedContact.city}, ${selectedContact.state} ${selectedContact.zip}`} />
                <InfoRow label="DOB" value={selectedContact.dateOfBirth} />
                <InfoRow label="Source" value={SOURCE_LABELS[selectedContact.source]} />
                <InfoRow label="Agent" value={agentMap.get(selectedContact.assignedAgentId) || "Unassigned"} />
                {selectedContact.notes && <InfoRow label="Notes" value={selectedContact.notes} />}
              </div>

              {/* Related Deals */}
              <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Deals ({relatedDeals.length})</h3>
              {relatedDeals.length === 0 ? (
                <p className="text-xs text-gray-600 mb-4">No deals.</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {relatedDeals.map((d) => (
                    <div key={d.id} className="rounded-lg bg-[#1a2a4a]/50 border border-gray-700 px-3 py-2 text-xs text-gray-300">
                      <span className="font-medium">{d.carrier}</span> &middot; {d.policyType} &middot;{" "}
                      <span className="text-[#d4a843]">${d.annualPremium.toLocaleString()}</span>
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
                  onClick={() => { openEditForm(selectedContact); setSelectedContact(null); }}
                  className="flex-1 rounded-lg border border-gray-600 px-3 py-2 text-xs text-gray-300 hover:bg-gray-700/50 transition-colors"
                >
                  Edit
                </button>
                {deleteConfirm === selectedContact.id ? (
                  <button
                    onClick={() => handleDelete(selectedContact.id)}
                    className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs text-white font-semibold hover:bg-red-700 transition-colors"
                  >
                    Confirm Delete
                  </button>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(selectedContact.id)}
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
              {editingContact ? "Edit Contact" : "Add Contact"}
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="First Name" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} required />
              <FormField label="Last Name" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} required />
              <FormField label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
              <FormField label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} type="tel" />
              <FormField label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} full />
              <FormField label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
              <FormField label="State" value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
              <FormField label="Zip" value={form.zip} onChange={(v) => setForm({ ...form, zip: v })} />
              <FormField label="Date of Birth" value={form.dateOfBirth} onChange={(v) => setForm({ ...form, dateOfBirth: v })} type="date" />
              <div className="col-span-1">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Source</label>
                <select
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value as AtxContact["source"] })}
                  className="w-full rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 outline-none focus:border-[#d4a843]/50"
                >
                  {SOURCE_OPTIONS.map((s) => (
                    <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Agent</label>
                <select
                  value={form.assignedAgentId}
                  onChange={(e) => setForm({ ...form, assignedAgentId: e.target.value })}
                  className="w-full rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 outline-none focus:border-[#d4a843]/50"
                >
                  <option value="">Unassigned</option>
                  {agents.map((a) => (
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
                  className="w-full rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 placeholder-gray-500 outline-none focus:border-[#d4a843]/50 resize-none"
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
                className="rounded-lg bg-[#d4a843] px-4 py-2 text-xs font-semibold text-[#0a1628] hover:bg-[#c49a3a] transition-colors"
              >
                {editingContact ? "Save Changes" : "Add Contact"}
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
        className="w-full rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 placeholder-gray-500 outline-none focus:border-[#d4a843]/50"
      />
    </div>
  );
}
