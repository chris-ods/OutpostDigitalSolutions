"use client";

import { useState, useEffect, useCallback } from "react";
import { collection, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { OdsRecord } from "ods-ui-library";
import { Spinner } from "../../../lib/components/Spinner";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SubItem {
  id: string;
  [key: string]: unknown;
}

interface SubField {
  key: string;
  label: string;
  type?: "text" | "password" | "date" | "number" | "select";
  mono?: boolean;
  options?: { value: string; label: string }[];
  linkedField?: { key: string; extract: "before" | "after" }; // auto-fill another field from selection
}

interface SubCollection {
  name: string;
  label: string;
  fields: SubField[];
  isSingle?: boolean; // true for "secrets/identity" which is a single doc, not a collection
}

const US_STATES: { value: string; label: string }[] = [
  { value: "AL", label: "AL - Alabama" }, { value: "AK", label: "AK - Alaska" }, { value: "AZ", label: "AZ - Arizona" },
  { value: "AR", label: "AR - Arkansas" }, { value: "CA", label: "CA - California" }, { value: "CO", label: "CO - Colorado" },
  { value: "CT", label: "CT - Connecticut" }, { value: "DC", label: "DC - District of Columbia" }, { value: "DE", label: "DE - Delaware" },
  { value: "FL", label: "FL - Florida" }, { value: "GA", label: "GA - Georgia" }, { value: "HI", label: "HI - Hawaii" },
  { value: "ID", label: "ID - Idaho" }, { value: "IL", label: "IL - Illinois" }, { value: "IN", label: "IN - Indiana" },
  { value: "IA", label: "IA - Iowa" }, { value: "KS", label: "KS - Kansas" }, { value: "KY", label: "KY - Kentucky" },
  { value: "LA", label: "LA - Louisiana" }, { value: "ME", label: "ME - Maine" }, { value: "MD", label: "MD - Maryland" },
  { value: "MA", label: "MA - Massachusetts" }, { value: "MI", label: "MI - Michigan" }, { value: "MN", label: "MN - Minnesota" },
  { value: "MS", label: "MS - Mississippi" }, { value: "MO", label: "MO - Missouri" }, { value: "MT", label: "MT - Montana" },
  { value: "NE", label: "NE - Nebraska" }, { value: "NV", label: "NV - Nevada" }, { value: "NH", label: "NH - New Hampshire" },
  { value: "NJ", label: "NJ - New Jersey" }, { value: "NM", label: "NM - New Mexico" }, { value: "NY", label: "NY - New York" },
  { value: "NC", label: "NC - North Carolina" }, { value: "ND", label: "ND - North Dakota" }, { value: "OH", label: "OH - Ohio" },
  { value: "OK", label: "OK - Oklahoma" }, { value: "OR", label: "OR - Oregon" }, { value: "PA", label: "PA - Pennsylvania" },
  { value: "RI", label: "RI - Rhode Island" }, { value: "SC", label: "SC - South Carolina" }, { value: "SD", label: "SD - South Dakota" },
  { value: "TN", label: "TN - Tennessee" }, { value: "TX", label: "TX - Texas" }, { value: "UT", label: "UT - Utah" },
  { value: "VT", label: "VT - Vermont" }, { value: "VA", label: "VA - Virginia" }, { value: "WA", label: "WA - Washington" },
  { value: "WV", label: "WV - West Virginia" }, { value: "WI", label: "WI - Wisconsin" }, { value: "WY", label: "WY - Wyoming" }, { value: "DC", label: "DC - District of Columbia" },
];

const STATE_NAME_MAP: Record<string, string> = {};
US_STATES.forEach(s => { STATE_NAME_MAP[s.value] = s.label.split(" - ")[1]; });

const SUB_COLLECTIONS: SubCollection[] = [
  {
    name: "credentials",
    label: "Credentials",
    fields: [
      { key: "platform", label: "Platform" },
      { key: "username", label: "Username" },
      { key: "password", label: "Password", type: "password" },
      { key: "link", label: "Link" },
      { key: "notes", label: "Notes" },
    ],
  },
  {
    name: "writingNumbers",
    label: "Writing Numbers",
    fields: [
      { key: "carrier", label: "Carrier" },
      { key: "individualNumber", label: "Individual #", mono: true },
      { key: "agencyNumber", label: "Agency #", mono: true },
      { key: "notes", label: "Notes" },
    ],
  },
  {
    name: "stateLicenses",
    label: "State Licenses",
    fields: [
      { key: "stateCode", label: "State", type: "select", options: US_STATES, linkedField: { key: "state", extract: "after" } },
      { key: "individualLicense", label: "License #", mono: true },
      { key: "individualExpiry", label: "Expiry", type: "date" },
      { key: "agencyLicense", label: "Agency License" },
      { key: "agencyExpiry", label: "Agency Expiry", type: "date" },
    ],
  },
  {
    name: "secrets",
    label: "Identity / Secrets",
    isSingle: true,
    fields: [
      { key: "dob", label: "DOB", type: "date" },
      { key: "ssn", label: "SSN", type: "password" },
      { key: "npnPersonal", label: "NPN Personal", mono: true },
      { key: "npnBusiness", label: "NPN Business", mono: true },
      { key: "ein", label: "EIN", mono: true },
      { key: "address", label: "Address" },
      { key: "notes", label: "Notes" },
    ],
  },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function SubCollectionModal({
  record,
  onClose,
}: {
  record: OdsRecord;
  onClose: () => void;
}) {
  const uid = String(record.id);
  const displayName = String(record.displayLabel ?? record.firstName ?? record.id);
  const [activeTab, setActiveTab] = useState(SUB_COLLECTIONS[0].name);
  const [data, setData] = useState<Record<string, SubItem[]>>({});
  const [singleData, setSingleData] = useState<Record<string, Record<string, unknown>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<{ sub: string; id: string; values: Record<string, string> } | null>(null);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Record<string, string>>({});
  const [showPw, setShowPw] = useState<Set<string>>(new Set());

  // ── Load all subcollections ──────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const result: Record<string, SubItem[]> = {};
      const singles: Record<string, Record<string, unknown>> = {};
      for (const sub of SUB_COLLECTIONS) {
        if (sub.isSingle) {
          // Secrets are encrypted — read via API to get decrypted values
          try {
            const res = await fetch(`/api/admin/secrets?uid=${uid}&type=identity&reveal=true&callerUid=${uid}`);
            if (res.ok) {
              const json = await res.json();
              singles[sub.name] = json.data ?? {};
            } else {
              singles[sub.name] = {};
            }
          } catch {
            singles[sub.name] = {};
          }
        } else {
          const snap = await getDocs(collection(db, "users", uid, sub.name));
          result[sub.name] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
      }
      setData(result);
      setSingleData(singles);
      setLoading(false);
    })();
  }, [uid]);

  // ── CRUD handlers ───────────────────────────────────────────────────────
  const handleAdd = useCallback(async (subName: string) => {
    setSaving(true);
    try {
      const ref = await addDoc(collection(db, "users", uid, subName), { ...newItem, createdAt: serverTimestamp() });
      setData(prev => ({ ...prev, [subName]: [...(prev[subName] ?? []), { id: ref.id, ...newItem }] }));
      setNewItem({});
      setAddingTo(null);
    } finally { setSaving(false); }
  }, [uid, newItem]);

  const handleUpdate = useCallback(async (subName: string, itemId: string, values: Record<string, string>) => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", uid, subName, itemId), values);
      setData(prev => ({
        ...prev,
        [subName]: (prev[subName] ?? []).map(item => item.id === itemId ? { ...item, ...values } : item),
      }));
      setEditingItem(null);
    } finally { setSaving(false); }
  }, [uid]);

  const handleDelete = useCallback(async (subName: string, itemId: string) => {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    await deleteDoc(doc(db, "users", uid, subName, itemId));
    setData(prev => ({ ...prev, [subName]: (prev[subName] ?? []).filter(item => item.id !== itemId) }));
  }, [uid]);

  const handleSaveSingle = useCallback(async (subName: string, values: Record<string, unknown>) => {
    setSaving(true);
    try {
      if (subName === "secrets") {
        // Write via API so values are encrypted at rest
        await fetch("/api/admin/secrets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid, type: "identity", callerUid: uid, data: values }),
        });
      } else {
        const ref = doc(db, "users", uid, subName, "identity");
        const snap = await getDoc(ref);
        if (snap.exists()) {
          await updateDoc(ref, values);
        } else {
          const { setDoc: sd } = await import("firebase/firestore");
          await sd(ref, values);
        }
      }
      setSingleData(prev => ({ ...prev, [subName]: { ...prev[subName], ...values } }));
      setEditingItem(null);
    } finally { setSaving(false); }
  }, [uid]);

  const togglePw = (id: string) => setShowPw(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // ── Styles ──────────────────────────────────────────────────────────────
  const thStyle: React.CSSProperties = { textAlign: "left", padding: "0.375rem 0.75rem", fontWeight: 600, fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--app-text-4)", borderBottom: "1px solid var(--app-border)" };
  const tdStyle: React.CSSProperties = { padding: "0.375rem 0.75rem", color: "var(--app-text-2)", borderBottom: "1px solid var(--app-border)", fontSize: "0.75rem" };
  const inputStyle: React.CSSProperties = { width: "100%", padding: "0.375rem 0.5rem", background: "var(--app-surface-2)", border: "1px solid var(--app-border-2)", borderRadius: "0.375rem", color: "var(--app-text)", fontSize: "0.75rem", outline: "none" };

  const activeSub = SUB_COLLECTIONS.find(s => s.name === activeTab)!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="relative bg-app-surface border border-app-border-2 rounded-xl shadow-2xl w-full max-w-4xl flex flex-col" style={{ maxHeight: "90vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-app-border shrink-0">
          <div>
            <h3 className="text-app-text font-semibold text-lg">{displayName}</h3>
            <p className="text-app-text-4 text-xs mt-0.5">Edit subcollection data</p>
          </div>
          <button type="button" onClick={onClose} className="text-app-text-4 hover:text-app-text transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-3 pb-2 border-b border-app-border shrink-0">
          {SUB_COLLECTIONS.map(sub => (
            <button
              key={sub.name}
              onClick={() => { setActiveTab(sub.name); setEditingItem(null); setAddingTo(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === sub.name
                  ? "bg-app-accent text-white"
                  : "text-app-text-3 hover:text-app-text hover:bg-app-surface-2"
              }`}
            >
              {sub.label}
              {!sub.isSingle && data[sub.name] && (
                <span className="ml-1 text-[0.5625rem] opacity-60">({data[sub.name].length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex justify-center py-8"><Spinner className="w-6 h-6" /></div>
          ) : activeSub.isSingle ? (
            /* ── Single doc (secrets/identity) ── */
            <div className="space-y-3">
              {activeSub.fields.map(field => {
                const val = String(singleData[activeSub.name]?.[field.key] ?? "");
                const isEditing = editingItem?.sub === activeSub.name;
                const editVal = editingItem?.values[field.key] ?? val;
                const isPw = field.type === "password";
                return (
                  <div key={field.key} className="flex items-center gap-3">
                    <label className="text-app-text-4 text-xs font-semibold uppercase w-32 shrink-0">{field.label}</label>
                    {isEditing ? (
                      <input
                        style={inputStyle}
                        type={isPw && !showPw.has(field.key) ? "password" : "text"}
                        value={editVal}
                        onChange={e => setEditingItem(prev => prev ? { ...prev, values: { ...prev.values, [field.key]: e.target.value } } : null)}
                      />
                    ) : (
                      <span className={`text-app-text-2 text-sm ${field.mono ? "font-mono" : ""}`}>
                        {isPw ? (showPw.has(field.key) ? val : val ? "••••••••" : "—") : (val || "—")}
                        {isPw && val && (
                          <button type="button" onClick={() => togglePw(field.key)} className="ml-2 text-app-text-5 hover:text-app-text-3">
                            <svg className="w-3 h-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            </svg>
                          </button>
                        )}
                      </span>
                    )}
                  </div>
                );
              })}
              <div className="flex gap-2 pt-2">
                {editingItem?.sub === activeSub.name ? (
                  <>
                    <button
                      onClick={() => handleSaveSingle(activeSub.name, editingItem.values)}
                      disabled={saving}
                      className="px-4 py-1.5 bg-app-accent text-white text-xs font-semibold rounded-lg transition hover:opacity-90 disabled:opacity-50"
                    >{saving ? "Saving..." : "Save"}</button>
                    <button onClick={() => setEditingItem(null)} className="px-4 py-1.5 text-app-text-3 text-xs hover:text-app-text transition">Cancel</button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      const values: Record<string, string> = {};
                      activeSub.fields.forEach(f => { values[f.key] = String(singleData[activeSub.name]?.[f.key] ?? ""); });
                      setEditingItem({ sub: activeSub.name, id: "identity", values });
                    }}
                    className="px-4 py-1.5 bg-app-surface-2 border border-app-border-2 text-app-text-3 text-xs font-semibold rounded-lg transition hover:text-app-text"
                  >Edit</button>
                )}
              </div>
            </div>
          ) : (
            /* ── Collection (credentials, writingNumbers, stateLicenses) ── */
            <>
              <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {activeSub.fields.map(f => <th key={f.key} style={thStyle}>{f.label}</th>)}
                    <th style={{ ...thStyle, width: "5rem", textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(data[activeSub.name] ?? []).map(item => {
                    const isEditing = editingItem?.sub === activeSub.name && editingItem?.id === item.id;
                    return (
                      <tr key={item.id}>
                        {activeSub.fields.map(field => (
                          <td key={field.key} style={{ ...tdStyle, fontFamily: field.mono ? "monospace" : undefined }}>
                            {isEditing ? (
                              field.type === "select" && field.options ? (
                                <select
                                  style={{ ...inputStyle, cursor: "pointer" }}
                                  value={editingItem.values[field.key] ?? ""}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setEditingItem(prev => {
                                      if (!prev) return null;
                                      const updates: Record<string, string> = { [field.key]: val };
                                      if (field.linkedField) {
                                        const opt = field.options!.find(o => o.value === val);
                                        updates[field.linkedField.key] = opt ? opt.label.split(" - ")[1] ?? opt.label : "";
                                      }
                                      return { ...prev, values: { ...prev.values, ...updates } };
                                    });
                                  }}
                                >
                                  <option value="">Select...</option>
                                  {field.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                              ) : (
                                <input
                                  style={inputStyle}
                                  type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
                                  value={editingItem.values[field.key] ?? ""}
                                  onChange={e => setEditingItem(prev => prev ? { ...prev, values: { ...prev.values, [field.key]: e.target.value } } : null)}
                                />
                              )
                            ) : field.type === "select" ? (
                              <span>{field.options?.find(o => o.value === String(item[field.key] ?? ""))?.label ?? (String(item[field.key] ?? "") || "\u2014")}</span>
                            ) : field.type === "password" ? (
                              <span>
                                {showPw.has(item.id) ? String(item[field.key] ?? "") : (item[field.key] ? "••••••••" : "—")}
                                {!!item[field.key] && (
                                  <button type="button" onClick={() => togglePw(item.id)} className="ml-1 text-app-text-5 hover:text-app-text-3">
                                    <svg className="w-3 h-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                    </svg>
                                  </button>
                                )}
                              </span>
                            ) : (
                              String(item[field.key] ?? "") || "—"
                            )}
                          </td>
                        ))}
                        <td style={{ ...tdStyle, textAlign: "center" }}>
                          <div className="flex items-center justify-center gap-2">
                            {isEditing ? (
                              <>
                                <button onClick={() => handleUpdate(activeSub.name, item.id, editingItem.values)} disabled={saving} className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold">{saving ? "..." : "Save"}</button>
                                <button onClick={() => setEditingItem(null)} className="text-app-text-4 hover:text-app-text-3 text-xs">Cancel</button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    const values: Record<string, string> = {};
                                    activeSub.fields.forEach(f => { values[f.key] = String(item[f.key] ?? ""); });
                                    setEditingItem({ sub: activeSub.name, id: item.id, values });
                                  }}
                                  className="text-app-accent hover:opacity-80 transition"
                                  title="Edit"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDelete(activeSub.name, item.id)}
                                  className="text-app-text-5 hover:text-red-400 transition"
                                  title="Delete"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Add new item */}
              {addingTo === activeSub.name ? (
                <div className="mt-3 p-3 bg-app-surface-2 border border-app-border-2 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {activeSub.fields.map(f => (
                      <div key={f.key}>
                        <label className="text-app-text-4 text-[0.625rem] font-semibold uppercase">{f.label}</label>
                        {f.type === "select" && f.options ? (
                          <select
                            style={{ ...inputStyle, cursor: "pointer" }}
                            value={newItem[f.key] ?? ""}
                            onChange={e => {
                              const val = e.target.value;
                              const updates: Record<string, string> = { [f.key]: val };
                              if (f.linkedField) {
                                const opt = f.options!.find(o => o.value === val);
                                updates[f.linkedField.key] = opt ? opt.label.split(" - ")[1] ?? opt.label : "";
                              }
                              setNewItem(prev => ({ ...prev, ...updates }));
                            }}
                          >
                            <option value="">Select...</option>
                            {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        ) : (
                          <input
                            style={inputStyle}
                            type={f.type === "date" ? "date" : "text"}
                            value={newItem[f.key] ?? ""}
                            onChange={e => setNewItem(prev => ({ ...prev, [f.key]: e.target.value }))}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAdd(activeSub.name)} disabled={saving} className="px-4 py-1.5 bg-app-accent text-white text-xs font-semibold rounded-lg hover:opacity-90 disabled:opacity-50">{saving ? "Adding..." : "Add"}</button>
                    <button onClick={() => { setAddingTo(null); setNewItem({}); }} className="px-4 py-1.5 text-app-text-3 text-xs hover:text-app-text">Cancel</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingTo(activeSub.name)}
                  className="mt-3 flex items-center gap-1.5 px-3 py-1.5 text-app-accent text-xs font-semibold hover:bg-app-surface-2 rounded-lg transition"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add {activeSub.label.replace(/s$/, "")}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
