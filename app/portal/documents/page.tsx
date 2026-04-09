"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  collection, addDoc, onSnapshot, deleteDoc, getDoc, setDoc,
  doc as fsDoc, serverTimestamp, query, orderBy, where,
} from "firebase/firestore";
import {
  ref, uploadBytesResumable, getDownloadURL, deleteObject,
} from "firebase/storage";
import { db, storage } from "../../../lib/firebase";
import { isAdminLevel } from "../../../lib/types";
import { useUserClaim } from "../../../lib/hooks/useUserClaim";
import { useListUserPrefs } from "../../../lib/hooks/useListUserPrefs";
import { Spinner } from "../../../lib/components/Spinner";
import { OdsList, buildDefaultPermissions } from "ods-ui-library";
import type { OdsRecord, OdsColDef, OdsListSchema, PermissionsMatrix, AppRole } from "ods-ui-library";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ["License", "Contracts", "Compliance", "Marketing", "Training", "HR", "Other"] as const;
type Category = (typeof CATEGORIES)[number];


// ─── Types ────────────────────────────────────────────────────────────────────

interface BizDoc {
  id: string;
  name: string;
  fileName: string;
  category: Category;
  docDate: string;
  notes: string;
  storageUrl: string;
  storagePath: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedByRole: string;
  uploadedByTeam: number;
  uploadedAt: { seconds: number } | null;
  protected?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtBytes(b: number) {
  if (b < 1024)    return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

function toAppRole(role: string | undefined): AppRole {
  if (role === "developer") return "dev";
  return (role as AppRole) ?? "rep";
}

// ─── Columns ──────────────────────────────────────────────────────────────────

const DOC_COLUMNS: OdsColDef[] = [
  {
    key: "name",
    label: "Name",
    sortable: true,
    filterType: "text",
    render: (_v, record) => {
      const fileType = String(record.fileType ?? "");
      const isPdf   = fileType === "application/pdf";
      const isImage = fileType.startsWith("image/");
      const isSheet = fileType.includes("sheet") || fileType.includes("excel") || fileType.includes("csv");
      const isWord  = fileType.includes("word") || fileType.includes("document");
      const color = isPdf ? "text-red-400" : isImage ? "text-green-400" : isSheet ? "text-emerald-400" : isWord ? "text-app-accent" : "text-app-text-3";
      return (
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }} className="bg-app-surface-2">
            <svg className={`w-4 h-4 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <p className="text-app-text" style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px" }}>{String(record.name ?? "")}</p>
            <p className="text-app-text-4" style={{ fontSize: "0.6875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px" }}>{String(record.fileName ?? "")}</p>
          </div>
        </div>
      );
    },
  },
  {
    key: "category",
    label: "Category",
    sortable: true,
    filterType: "enum",
    enumValues: [...CATEGORIES],
  },
  { key: "docDate",         label: "Date",        sortable: true, filterType: "date" },
  {
    key: "fileSize",
    label: "Size",
    sortable: true,
    render: (v) => <span className="text-app-text-3">{fmtBytes(Number(v ?? 0))}</span>,
  },
  { key: "uploadedByName",  label: "Uploaded By",  sortable: true, filterType: "text", adminOnly: true },
  { key: "notes",           label: "Notes",        filterType: "text", multiline: true },
  {
    key: "storageUrl",
    label: "Download",
    noFilter: true,
    render: (v) => (
      <a
        href={String(v ?? "#")}
        target="_blank"
        rel="noopener noreferrer"
        className="text-app-text-4 hover:text-app-text transition"
        title="View / Download"
        onClick={(e) => e.stopPropagation()}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </a>
    ),
  },
];

const DEFAULT_VISIBLE_COLS = ["name", "category", "docDate", "fileSize", "uploadedByName", "storageUrl"];

// ─── Component ────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const claim = useUserClaim();
  const { uid, profile } = claim;
  const { prefs: userPrefs, savePrefs: saveUserPrefs } = useListUserPrefs(uid, "documents");

  const [docs, setDocs]       = useState<BizDoc[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);

  // OdsList schema + permissions
  const [schema, setSchema] = useState<OdsListSchema | undefined>();
  const [permissions, setPermissions] = useState<PermissionsMatrix | undefined>();

  // Upload modal
  const [showUpload,      setShowUpload]      = useState(false);
  const [file,            setFile]            = useState<File | null>(null);
  const [dragOver,        setDragOver]        = useState(false);
  const [uploading,       setUploading]       = useState(false);
  const [uploadProgress,  setUploadProgress]  = useState(0);
  const [uploadError,     setUploadError]     = useState<string | null>(null);
  const [form, setForm] = useState({
    name:     "",
    category: "Contracts" as Category,
    docDate:  new Date().toISOString().split("T")[0],
    notes:    "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState<BizDoc | null>(null);
  const [deleting,      setDeleting]      = useState(false);

  const role = profile?.role;
  const isAdmin = isAdminLevel(role);

  // ── Load schema + permissions ─────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      getDoc(fsDoc(db, "settings", "docListSchema")),
      getDoc(fsDoc(db, "settings", "docListPermissions")),
    ]).then(([schemaSnap, permsSnap]) => {
      if (schemaSnap.exists()) setSchema(schemaSnap.data() as OdsListSchema);
      if (permsSnap.exists()) setPermissions(permsSnap.data() as PermissionsMatrix);
    }).catch(() => { /* use defaults */ });
  }, []);

  // ── Real-time documents listener (role-scoped) ────────────────────────────
  useEffect(() => {
    if (!uid || !profile) return;

    let q;
    if (isAdminLevel(profile.role)) {
      q = query(collection(db, "documents"), orderBy("uploadedAt", "desc"));
    } else if (profile.role === "manager") {
      q = query(collection(db, "documents"), where("uploadedByTeam", "==", profile.teamNumber));
    } else {
      q = query(collection(db, "documents"), where("uploadedBy", "==", uid));
    }

    return onSnapshot(q, (snap) => {
      setDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as BizDoc)));
      setDocsLoading(false);
    });
  }, [uid, profile]);

  // ── Map to OdsRecord[] ────────────────────────────────────────────────────
  const data: OdsRecord[] = useMemo(() => docs.map(d => ({
    ...d,
    id: d.id,
    displayLabel: d.name,
  })), [docs]);

  // ── Callbacks ─────────────────────────────────────────────────────────────
  const handleSaveSchema = useCallback(async (s: OdsListSchema) => {
    await setDoc(fsDoc(db, "settings", "docListSchema"), s);
    setSchema(s);
  }, []);

  const handleSavePermissions = useCallback(async (m: PermissionsMatrix) => {
    await setDoc(fsDoc(db, "settings", "docListPermissions"), m);
    setPermissions(m);
  }, []);

  const handleDeleteRecord = useCallback(async (id: string) => {
    const d = docs.find(x => x.id === id);
    if (!d) return;
    if (d.protected) return; // protected documents cannot be deleted
    try { await deleteObject(ref(storage, d.storagePath)); } catch { /* non-fatal */ }
    await deleteDoc(fsDoc(db, "documents", id));
  }, [docs]);

  // ── File pick ─────────────────────────────────────────────────────────────
  function pickFile(f: File) {
    setFile(f);
    setForm((p) => ({ ...p, name: p.name || f.name.replace(/\.[^/.]+$/, "") }));
  }

  function resetUpload() {
    setFile(null);
    setForm({ name: "", category: "Contracts", docDate: new Date().toISOString().split("T")[0], notes: "" });
    setUploadError(null);
    setUploadProgress(0);
    setShowUpload(false);
  }

  // ── Upload ─────────────────────────────────────────────────────────────────
  async function handleUpload() {
    if (!file || !uid || !profile) return;
    setUploading(true);
    setUploadError(null);
    try {
      const storagePath = `documents/${uid}/${Date.now()}-${file.name}`;
      const storageRef  = ref(storage, storagePath);

      await new Promise<void>((resolve, reject) => {
        const task = uploadBytesResumable(storageRef, file);
        task.on(
          "state_changed",
          (s) => setUploadProgress(Math.round((s.bytesTransferred / s.totalBytes) * 100)),
          reject,
          resolve,
        );
      });

      const storageUrl = await getDownloadURL(ref(storage, storagePath));

      await addDoc(collection(db, "documents"), {
        name:           form.name.trim() || file.name,
        fileName:       file.name,
        category:       form.category,
        docDate:        form.docDate,
        notes:          form.notes.trim(),
        fileSize:       file.size,
        fileType:       file.type,
        storagePath,
        storageUrl,
        uploadedBy:     uid,
        uploadedByName: `${profile.firstName} ${profile.lastName}`,
        uploadedByRole: profile.role,
        uploadedByTeam: profile.teamNumber || 0,
        uploadedAt:     serverTimestamp(),
        createdAt:      serverTimestamp(),
        createdBy:      uid,
        createdByName:  `${profile.firstName} ${profile.lastName}`,
        updatedAt:      serverTimestamp(),
        updatedBy:      uid,
        updatedByName:  `${profile.firstName} ${profile.lastName}`,
      });

      resetUpload();
    } catch {
      setUploadError("Upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  // ── Delete confirm handler ────────────────────────────────────────────────
  async function handleDeleteConfirm() {
    if (!confirmDelete) return;
    setDeleting(true);
    try { await deleteObject(ref(storage, confirmDelete.storagePath)); } catch { /* non-fatal */ }
    try { await deleteDoc(fsDoc(db, "documents", confirmDelete.id)); } catch { setDeleting(false); return; }
    setConfirmDelete(null);
    setDeleting(false);
  }

  const inputClass = "w-full px-3 py-2 bg-app-surface-2 border border-app-border-2 rounded-lg text-white placeholder-app-text-4 text-sm focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-app-bg p-5 overflow-y-auto gap-5">

      {/* Header with upload button + license prompt */}
      <div className="px-6 pt-4 shrink-0 space-y-3">
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 bg-app-accent hover:bg-app-accent-hover text-white text-sm font-semibold rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload Document
          </button>
        </div>

        {/* License upload prompt for reps/managers */}
        {profile && !isAdminLevel(profile.role) && (
          <div className="flex items-center gap-4 bg-amber-950/30 border border-amber-700/40 rounded-xl px-5 py-3.5">
            <svg className="w-5 h-5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-amber-300 text-sm font-semibold">Insurance License Required for Promotion</p>
              <p className="text-amber-600 text-xs mt-0.5">Team Leads must have an active license on file.</p>
            </div>
            <button
              type="button"
              onClick={() => { setForm(p => ({ ...p, category: "License" as Category })); setShowUpload(true); }}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload License
            </button>
          </div>
        )}
      </div>

      {/* OdsList */}
      <OdsList
        columns={DOC_COLUMNS}
        defaultVisibleCols={DEFAULT_VISIBLE_COLS}
        data={data}
        loading={docsLoading}
        uid={uid ?? ""}
        userName={claim.displayName}
        isAdmin={isAdmin}
        isManager={role === "manager"}
        currentRole={toAppRole(role)}
        permissions={permissions ?? buildDefaultPermissions(DOC_COLUMNS)}
        onSavePermissions={handleSavePermissions}
        onDeleteRecord={handleDeleteRecord}
        schema={schema ?? { displayMode: "document" }}
        onSaveSchema={handleSaveSchema}
        displayMode="document"
        userPrefs={userPrefs}
        onSaveUserPrefs={saveUserPrefs}
        listTitle="Documents"
        initialSortField="docDate"
        initialSortDir="desc"
      />

      {/* ── Upload modal ─────────────────────────────────────────────────────── */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-app-surface border border-app-border-2 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-app-text font-semibold text-lg">Upload Document</h2>
              <button type="button" onClick={resetUpload} className="text-app-text-3 hover:text-app-text transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) pickFile(f); }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                  dragOver ? "border-app-accent bg-app-accent/20"
                  : file    ? "border-green-600 bg-green-900/10"
                  :           "border-app-border-2 hover:border-app-border-2"
                }`}
              >
                <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }} />
                {file ? (
                  <>
                    <svg className="w-8 h-8 text-green-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-app-text text-sm font-medium">{file.name}</p>
                    <p className="text-app-text-3 text-xs mt-0.5">{fmtBytes(file.size)}</p>
                  </>
                ) : (
                  <>
                    <svg className="w-8 h-8 text-app-text-5 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-app-text-3 text-sm">Drop a file or <span className="text-app-accent">browse</span></p>
                    <p className="text-app-text-5 text-xs mt-1">PDF, Word, Excel, images, and more</p>
                  </>
                )}
              </div>

              {/* Document Name */}
              <div>
                <label className="block text-xs font-medium text-app-text-3 mb-1.5">
                  Document Name <span className="text-red-400">*</span>
                </label>
                <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Americo Agent Contract 2025" className={inputClass} />
              </div>

              {/* Category + Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-app-text-3 mb-1.5">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as Category }))} className={inputClass}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-app-text-3 mb-1.5">Document Date</label>
                  <input type="date" value={form.docDate} onChange={(e) => setForm((p) => ({ ...p, docDate: e.target.value }))} className={inputClass + " [color-scheme:dark]"} />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-app-text-3 mb-1.5">
                  Notes <span className="text-app-text-5">(optional)</span>
                </label>
                <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="e.g. Expires Dec 2025, for Texas agents..." rows={2} className={inputClass + " resize-none"} />
              </div>

              {/* Progress bar */}
              {uploading && (
                <div>
                  <div className="flex justify-between text-xs text-app-text-3 mb-1">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-app-surface-2 rounded-full overflow-hidden">
                    <div className="h-full bg-app-accent rounded-full transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              {uploadError && (
                <p className="text-red-400 text-sm bg-red-950/50 border border-red-800 rounded-lg px-3 py-2">{uploadError}</p>
              )}

              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || !form.name.trim() || uploading}
                className="w-full py-2.5 bg-app-accent hover:bg-app-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg transition"
              >
                {uploading ? "Uploading..." : "Upload Document"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ───────────────────────────────────────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-app-surface border border-app-border-2 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-app-text font-semibold mb-2">Delete Document?</h3>
            <p className="text-app-text-3 text-sm mb-5">
              <span className="text-app-text">&ldquo;{confirmDelete.name}&rdquo;</span> will be permanently removed from storage and cannot be recovered.
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setConfirmDelete(null)} className="flex-1 py-2 bg-app-surface-2 hover:bg-app-surface-2 text-app-text-2 text-sm font-medium rounded-lg transition">
                Cancel
              </button>
              <button type="button" onClick={handleDeleteConfirm} disabled={deleting} className="flex-1 py-2 bg-red-700 hover:bg-red-600 disabled:bg-red-900 text-white text-sm font-medium rounded-lg transition">
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
