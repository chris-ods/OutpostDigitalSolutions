"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";

type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
};

const EMPTY: Omit<Client, "id"> = {
  name: "",
  email: "",
  phone: "",
  company: "",
  notes: "",
};

function Modal({
  title,
  form,
  onChange,
  onSave,
  onCancel,
  saving,
}: {
  title: string;
  form: Omit<Client, "id">;
  onChange: (field: keyof Omit<Client, "id">, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const field = (label: string, key: keyof Omit<Client, "id">, type = "text") => (
    <div>
      <label className="block text-gray-400 text-xs font-medium mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => onChange(key, e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-white font-semibold">{title}</h3>
          <button onClick={onCancel} className="text-gray-500 hover:text-white transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          {field("Name *", "name")}
          {field("Company", "company")}
          {field("Email", "email", "email")}
          {field("Phone", "phone", "tel")}
          <div>
            <label className="block text-gray-400 text-xs font-medium mb-1">Notes</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => onChange("notes", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        </div>
        <div className="px-6 pb-5 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving || !form.name.trim()}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClientsSection() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Client, "id">>(EMPTY);
  const [saving, setSaving] = useState(false);

  // Real-time Firestore listener
  useEffect(() => {
    const q = query(collection(db, "clients"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setClients(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Client, "id">) }))
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  const updateForm = (field: keyof Omit<Client, "id">, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleAdd = async () => {
    setSaving(true);
    await addDoc(collection(db, "clients"), { ...form, createdAt: serverTimestamp() });
    setSaving(false);
    setAdding(false);
    setForm(EMPTY);
  };

  const handleEdit = async () => {
    if (!editing) return;
    setSaving(true);
    await updateDoc(doc(db, "clients", editing.id), { ...form });
    setSaving(false);
    setEditing(null);
    setForm(EMPTY);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await deleteDoc(doc(db, "clients", id));
    setDeleting(null);
  };

  const openEdit = (client: Client) => {
    setEditing(client);
    setForm({ name: client.name, email: client.email, phone: client.phone, company: client.company, notes: client.notes });
  };

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  const initials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <>
      {/* Add modal */}
      {adding && (
        <Modal
          title="New Client"
          form={form}
          onChange={updateForm}
          onSave={handleAdd}
          onCancel={() => { setAdding(false); setForm(EMPTY); }}
          saving={saving}
        />
      )}

      {/* Edit modal */}
      {editing && (
        <Modal
          title="Edit Client"
          form={form}
          onChange={updateForm}
          onSave={handleEdit}
          onCancel={() => { setEditing(null); setForm(EMPTY); }}
          saving={saving}
        />
      )}

      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-white font-semibold text-lg">Clients</h3>
            <p className="text-gray-500 text-sm mt-0.5">{clients.length} total</p>
          </div>
          <button
            onClick={() => { setAdding(true); setForm(EMPTY); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Client
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, company, or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* List */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-gray-500 text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <svg className="w-10 h-10 text-gray-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-gray-500 text-sm">{search ? "No clients match your search." : "No clients yet. Add your first one."}</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-800">
              {filtered.map((client) => (
                <li key={client.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-800/50 transition group">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center text-white text-sm font-bold shrink-0 mt-0.5">
                    {initials(client.name)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <p className="text-white font-medium text-sm">{client.name}</p>
                      {client.company && (
                        <p className="text-gray-500 text-xs">{client.company}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
                      {client.email && (
                        <a href={`mailto:${client.email}`} className="text-blue-400 text-xs hover:underline">
                          {client.email}
                        </a>
                      )}
                      {client.phone && (
                        <a href={`tel:${client.phone}`} className="text-gray-400 text-xs hover:text-white transition">
                          {client.phone}
                        </a>
                      )}
                    </div>
                    {client.notes && (
                      <p className="text-gray-500 text-xs mt-1 line-clamp-1">{client.notes}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                    <button
                      onClick={() => openEdit(client)}
                      className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700 rounded-lg transition"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(client.id)}
                      disabled={deleting === client.id}
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded-lg transition disabled:opacity-50"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
