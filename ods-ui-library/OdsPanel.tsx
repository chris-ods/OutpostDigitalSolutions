/**
 * OdsPanel — ODS UI Library
 *
 * A single self-contained data panel. Drop one component into any portal page
 * to get a fully-featured CRM panel: live Firestore table, Add Record drawer,
 * file uploads, and permissions seeding — all configured by props.
 *
 * The consuming app MUST initialise Firebase before rendering this component.
 * getApp() picks up the existing default app automatically.
 *
 * @example
 * <OdsPanel
 *   collectionId="contacts"
 *   title="Contact"
 *   subtitle="Voters · Volunteers · Donors"
 *   fields={CONTACT_FIELDS}
 *   uid={user.uid}
 *   userName={user.displayName ?? ''}
 *   currentRole="admin"
 * />
 */

import React, { useState, useCallback, useEffect } from "react";
import { getApp }                                   from "firebase/app";
import {
  getFirestore, collection, addDoc, serverTimestamp,
  doc, getDoc, setDoc,
}                                                   from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { OdsList, DEFAULT_PERMISSIONS } from "./ClientList";
import type { AppRole, PermissionsMatrix, OdsColDef } from "./ClientList";
import { useClientList }                  from "./hooks/useClientList";

// ── Field types ───────────────────────────────────────────────────────────────

export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "select"
  | "date"
  | "checkbox"
  | "number"
  | "currency"
  | "file"
  | "textarea";

export interface FieldDef {
  /** Firestore field key */
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  /** Used when type = "select" */
  options?: string[];
  defaultValue?: string;
  /** Storage sub-path prefix for file uploads (defaults to collectionId) */
  storagePath?: string;
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface OdsPanelProps {
  /** Firestore collection name — also used as the permissions document ID */
  collectionId: string;
  /** Panel heading */
  title: string;
  subtitle?: string;
  uid: string;
  userName: string;
  isAdmin?: boolean;
  /** All five ODS roles: rep | manager | admin | owner | dev */
  currentRole?: AppRole;
  /** Field definitions for the Add Record drawer */
  fields: FieldDef[];
  /** Column definitions for the OdsList table. When omitted, a minimal set is derived from fields. */
  columns?: OdsColDef[];
  /** Which column keys are visible by default. Falls back to all columns. */
  defaultVisibleCols?: string[];
  /**
   * Transform applied to form values before writing to Firestore.
   * Receives raw string values AND any uploaded file URLs keyed by field.key.
   * If omitted, values are written as-is (with type coercion for number/currency).
   */
  transformRecord?: (
    values: Record<string, string>,
    fileUrls: Record<string, string>,
  ) => Record<string, unknown>;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
    zIndex: 1000, display: "flex", alignItems: "stretch", justifyContent: "flex-end",
  },
  drawer: {
    width: "440px", maxWidth: "100vw",
    background: "var(--app-surface)", borderLeft: "1px solid var(--app-border)",
    display: "flex", flexDirection: "column",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
    overflowY: "hidden",
  },
  drawerHeader: {
    padding: "20px 24px", borderBottom: "1px solid var(--app-border)",
    display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px",
    flexShrink: 0,
  },
  drawerBody: { flex: 1, overflowY: "auto", padding: "20px 24px" },
  drawerFooter: {
    padding: "14px 24px", borderTop: "1px solid var(--app-border)",
    display: "flex", gap: "10px", justifyContent: "flex-end", flexShrink: 0,
  },
  label: {
    display: "block", fontSize: "11px", fontWeight: 600,
    color: "var(--app-text-3)", letterSpacing: "0.06em", textTransform: "uppercase" as const,
    marginBottom: "6px",
  },
  input: {
    width: "100%", padding: "9px 12px",
    background: "var(--app-surface-2)", border: "1px solid var(--app-border-2)",
    borderRadius: "8px", color: "var(--app-text)", fontSize: "13px",
    outline: "none", fontFamily: "inherit", boxSizing: "border-box" as const,
  },
  currencyWrap: { position: "relative" as const },
  currencyPrefix: {
    position: "absolute" as const, left: "12px", top: "50%",
    transform: "translateY(-50%)", color: "var(--app-text-3)", fontSize: "13px", pointerEvents: "none" as const,
  },
  fieldGroup: { marginBottom: "16px" },
  btnPrimary: {
    padding: "9px 20px", background: "#3b82f6", color: "#fff",
    border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit",
  },
  btnGhost: {
    padding: "9px 20px", background: "transparent", color: "var(--app-text-3)",
    border: "1px solid var(--app-border-2)", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit",
  },
  addBtn: {
    padding: "7px 16px", background: "#3b82f6", color: "#fff",
    border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" as const,
  },
  toolbar: {
    background: "var(--app-bg)", borderBottom: "1px solid var(--app-border)",
    padding: "8px 20px", display: "flex", alignItems: "center",
    justifyContent: "space-between", gap: "12px", flexShrink: 0,
  },
  errorBox: {
    background: "#2d1515", border: "1px solid #7f1d1d", borderRadius: "8px",
    padding: "10px 14px", fontSize: "12px", color: "#fca5a5", marginBottom: "14px",
  },
  fileBtn: {
    display: "inline-block", padding: "8px 14px",
    background: "var(--app-surface-2)", border: "1px dashed var(--app-border-2)",
    borderRadius: "8px", color: "var(--app-text-2)", fontSize: "12px", cursor: "pointer",
    fontFamily: "inherit",
  },
  fileName: { fontSize: "11px", color: "var(--app-text-4)", marginTop: "4px" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDB()      { return getFirestore(getApp()); }
function getStore()   { return getStorage(getApp()); }

/** Seed /permissions/{collectionId} on first load — all 5 roles with defaults. */
async function seedPermissionsIfAbsent(collectionId: string) {
  const db      = getDB();
  const permRef = doc(db, "permissions", collectionId);
  const snap    = await getDoc(permRef);
  if (!snap.exists()) {
    // owner and dev bypass the matrix entirely (OdsList handles this).
    // We store rep / manager / admin with reasonable defaults.
    const matrix: PermissionsMatrix = {
      rep:     { ...DEFAULT_PERMISSIONS.rep },
      manager: { ...DEFAULT_PERMISSIONS.manager },
      admin:   { ...DEFAULT_PERMISSIONS.admin },
    };
    await setDoc(permRef, matrix);
  }
}

// ── Add Record Drawer ─────────────────────────────────────────────────────────

interface AddDrawerProps {
  fields: FieldDef[];
  collectionId: string;
  title: string;
  onClose: () => void;
  onSubmit: (
    values: Record<string, string>,
    files: Record<string, File>,
  ) => Promise<void>;
}

function AddDrawer({ fields, title, onClose, onSubmit }: AddDrawerProps) {
  const initial = Object.fromEntries(
    fields.map(f => [f.key, f.defaultValue ?? (f.type === "checkbox" ? "false" : "")]),
  );
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [files,  setFiles]  = useState<Record<string, File>>({});
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const set = (key: string, val: string) => setValues(v => ({ ...v, [key]: val }));
  const setFile = (key: string, file: File) => setFiles(f => ({ ...f, [key]: file }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const missing = fields.filter(f => f.required && f.type !== "file" && !values[f.key]?.trim());
    const missingFiles = fields.filter(f => f.required && f.type === "file" && !files[f.key]);
    if (missing.length || missingFiles.length) {
      setError(`Required: ${[...missing, ...missingFiles].map(f => f.label).join(", ")}`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit(values, files);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function renderField(field: FieldDef) {
    const val = values[field.key];
    switch (field.type) {
      case "select":
        return (
          <select value={val} onChange={e => set(field.key, e.target.value)}
            style={{ ...S.input, cursor: "pointer" }}>
            <option value="">Select…</option>
            {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        );
      case "checkbox":
        return (
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input type="checkbox" checked={val === "true"}
              onChange={e => set(field.key, e.target.checked ? "true" : "false")}
              style={{ width: "16px", height: "16px", accentColor: "#3b82f6" }} />
            <span style={{ fontSize: "13px", color: "var(--app-text-2)" }}>Yes</span>
          </label>
        );
      case "currency":
        return (
          <div style={S.currencyWrap}>
            <span style={S.currencyPrefix}>$</span>
            <input type="number" min="0" step="0.01" value={val}
              onChange={e => set(field.key, e.target.value)}
              placeholder={field.placeholder ?? "0.00"}
              style={{ ...S.input, paddingLeft: "24px" }} />
          </div>
        );
      case "number":
        return (
          <input type="number" value={val} onChange={e => set(field.key, e.target.value)}
            placeholder={field.placeholder} style={S.input} />
        );
      case "textarea":
        return (
          <textarea value={val} onChange={e => set(field.key, e.target.value)}
            placeholder={field.placeholder} rows={3}
            style={{ ...S.input, resize: "vertical" }} />
        );
      case "file":
        return (
          <div>
            <label style={S.fileBtn}>
              {files[field.key] ? "Change file" : "Choose file"}
              <input type="file" style={{ display: "none" }}
                onChange={e => { if (e.target.files?.[0]) setFile(field.key, e.target.files[0]); }} />
            </label>
            {files[field.key] && (
              <div style={S.fileName}>{files[field.key].name}</div>
            )}
          </div>
        );
      default:
        return (
          <input type={field.type} value={val}
            onChange={e => set(field.key, e.target.value)}
            placeholder={field.placeholder} style={S.input} />
        );
    }
  }

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.drawer}>
        <div style={S.drawerHeader}>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--app-text)" }}>Add {title}</div>
            <div style={{ fontSize: "11px", color: "var(--app-text-4)", marginTop: "3px" }}>
              Appears in the list immediately after saving
            </div>
          </div>
          <button onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--app-text-4)", cursor: "pointer", fontSize: "20px", lineHeight: 1, padding: "0 4px" }}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "contents" }}>
          <div style={S.drawerBody}>
            {error && <div style={S.errorBox}>{error}</div>}
            {fields.map(f => (
              <div key={f.key} style={S.fieldGroup}>
                <label style={S.label}>
                  {f.label}
                  {f.required && <span style={{ color: "#ef4444", marginLeft: "3px" }}>*</span>}
                </label>
                {renderField(f)}
              </div>
            ))}
          </div>

          <div style={S.drawerFooter}>
            <button type="button" onClick={onClose} style={S.btnGhost}>Cancel</button>
            <button type="submit" style={{ ...S.btnPrimary, opacity: saving ? 0.65 : 1 }} disabled={saving}>
              {saving ? "Saving…" : `Add ${title}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── OdsPanel ──────────────────────────────────────────────────────────────────

export function OdsPanel({
  collectionId,
  title,
  subtitle,
  uid,
  userName,
  isAdmin = false,
  currentRole = "admin",
  fields,
  columns: columnsProp,
  defaultVisibleCols,
  transformRecord,
}: OdsPanelProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // All list state + Firestore callbacks from the hook
  const listProps = useClientList(collectionId);

  // Derive columns from fields if not explicitly provided
  const columns: OdsColDef[] = React.useMemo(() => {
    if (columnsProp) return columnsProp;
    return fields.map((f) => ({
      key: f.key,
      label: f.label,
      sortable: true,
      editable: f.type !== "file" && f.type !== "checkbox",
      filterType: (f.type === "number" || f.type === "currency")
        ? "number" as const
        : f.type === "date"
          ? "date" as const
          : f.type === "select"
            ? "enum" as const
            : "text" as const,
      enumValues: f.options,
    }));
  }, [columnsProp, fields]);

  // Seed permissions for all 5 roles on first mount
  useEffect(() => {
    seedPermissionsIfAbsent(collectionId).catch(console.error);
  }, [collectionId]);

  const handleAdd = useCallback(async (
    values: Record<string, string>,
    files: Record<string, File>,
  ) => {
    const db      = getDB();
    const storage = getStore();

    // Upload any file fields first
    const fileUrls: Record<string, string> = {};
    for (const [key, file] of Object.entries(files)) {
      const fieldDef  = fields.find(f => f.key === key);
      const basePath  = fieldDef?.storagePath ?? collectionId;
      const storageRef = ref(storage, `${basePath}/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      fileUrls[key] = await getDownloadURL(storageRef);
    }

    // Coerce number / currency fields
    const coerced: Record<string, string | number> = { ...values };
    for (const f of fields) {
      if ((f.type === "number" || f.type === "currency") && values[f.key]) {
        coerced[f.key] = parseFloat(values[f.key]) || 0;
      }
    }

    const base = transformRecord
      ? transformRecord(values, fileUrls)
      : { ...coerced, ...fileUrls };

    await addDoc(collection(db, collectionId), {
      ...base,
      date:          base.date ?? new Date().toISOString().split("T")[0],
      createdAt:     serverTimestamp(),
      createdBy:     uid,
      createdByName: userName,
    });
  }, [collectionId, fields, uid, userName, transformRecord]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--app-bg)" }}>
      {/* Toolbar */}
      <div style={S.toolbar}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {subtitle && (
            <span style={{ fontSize: "11px", color: "var(--app-text-5)", letterSpacing: "0.04em" }}>
              {subtitle}
            </span>
          )}
        </div>
        <button style={S.addBtn} onClick={() => setDrawerOpen(true)}>
          + Add {title}
        </button>
      </div>

      {/* OdsList */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <OdsList
          {...listProps}
          columns={columns}
          defaultVisibleCols={defaultVisibleCols}
          uid={uid}
          userName={userName}
          isAdmin={isAdmin}
          currentRole={currentRole}
        />
      </div>

      {/* Add Record drawer */}
      {drawerOpen && (
        <AddDrawer
          fields={fields}
          collectionId={collectionId}
          title={title}
          onClose={() => setDrawerOpen(false)}
          onSubmit={handleAdd}
        />
      )}
    </div>
  );
}
