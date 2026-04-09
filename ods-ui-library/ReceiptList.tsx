"use client";

/**
 * ReceiptList
 *
 * A data table for receipt records using the exact same structure,
 * CSS classes, and interaction patterns as OdsList.
 *
 * Features: header + subtitle, action icon bar (columns, export),
 * search box, filter builder, drag-to-reorder columns, sort,
 * inline cell editing, pagination, totals footer.
 */

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import "./ClientList.css";
import type { ReceiptRecord, ReceiptCategory } from "./ReceiptScanner";

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterSpec =
  | { kind: "enum";  values: string[] }
  | { kind: "text";  q: string }
  | { kind: "range"; min?: string; max?: string };

interface ColDef {
  key: string;
  label: string;
  sortable?: boolean;
  noFilter?: boolean;
  filterType?: "enum" | "text" | "number" | "date";
}

interface FilterRow { id: string; field: string; operator: string; value: string; value2: string }

export interface ReceiptListProps {
  receipts: ReceiptRecord[];
  loading?: boolean;
  onSave?: (id: string, field: string, value: string | number) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  listTitle?: string;
}

// ─── Column definitions ───────────────────────────────────────────────────────

const CATEGORY_OPTIONS: ReceiptCategory[] = [
  "AI & API Services", "Software & Subscriptions", "Cloud & Infrastructure",
  "Hardware & Equipment", "Contractors & Freelancers", "Marketing & Advertising",
  "Travel & Lodging", "Meals & Entertainment", "Education & Training",
  "Legal & Professional", "Office & Supplies", "Utilities & Internet", "Other",
];

const PAYMENT_OPTIONS = [
  "Credit Card", "Debit Card", "Cash", "Check", "Apple Pay", "Google Pay", "Other",
];

const COLUMNS: ColDef[] = [
  { key: "date",          label: "Date",        sortable: true,  filterType: "date" },
  { key: "merchant",      label: "Merchant",    sortable: true,  filterType: "text" },
  { key: "category",      label: "Category",    sortable: true,  filterType: "enum" },
  { key: "total",         label: "Total",       sortable: true,  filterType: "number" },
  { key: "subtotal",      label: "Subtotal",    sortable: true,  filterType: "number" },
  { key: "tax",           label: "Tax",         sortable: false, filterType: "number" },
  { key: "tip",           label: "Tip",         sortable: false, filterType: "number" },
  { key: "paymentMethod", label: "Payment",     sortable: true,  filterType: "enum" },
  { key: "currency",      label: "Currency",    sortable: false, filterType: "enum" },
  { key: "items",         label: "Items",       noFilter: true },
  { key: "notes",         label: "Notes",       filterType: "text" },
  { key: "createdAt",     label: "Added",       sortable: true,  filterType: "date" },
];

const DEFAULT_VISIBLE = [
  "date", "merchant", "category", "total", "subtotal", "tax", "paymentMethod", "items", "notes",
];

const EDITABLE_COLS = new Set([
  "date", "merchant", "category", "total", "subtotal", "tax", "tip", "paymentMethod", "currency", "notes",
]);

const PAGE_SIZE = 50;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(s?: string) {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  if (!y || !m || !d) return s;
  return new Date(Number(y), Number(m) - 1, Number(d))
    .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtMoney(v?: number) {
  if (v === undefined || v === null) return "—";
  if (v === 0) return "$0.00";
  return "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtCreatedAt(iso?: string) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
  catch { return iso; }
}

function getOperators(ft: ColDef["filterType"]) {
  switch (ft) {
    case "enum":   return ["is"];
    case "text":   return ["contains", "is"];
    case "number": return [">", "≥", "<", "≤", "between"];
    case "date":   return ["is", "before", "after", "between"];
    default:       return ["contains"];
  }
}

function filterRowsToSpecs(rows: FilterRow[]): Record<string, FilterSpec> {
  const result: Record<string, FilterSpec> = {};
  for (const row of rows) {
    if (!row.field || !row.value) continue;
    const col = COLUMNS.find((c) => c.key === row.field);
    const ft  = col?.filterType ?? "text";
    if (ft === "enum") {
      const prev = result[row.field];
      const vals = prev?.kind === "enum" ? prev.values : [];
      if (!vals.includes(row.value)) result[row.field] = { kind: "enum", values: [...vals, row.value] };
    } else if (ft === "text") {
      result[row.field] = row.operator === "is"
        ? { kind: "enum", values: [row.value] }
        : { kind: "text", q: row.value };
    } else {
      switch (row.operator) {
        case "is": case "=": result[row.field] = { kind: "range", min: row.value, max: row.value }; break;
        case ">":            result[row.field] = { kind: "range", min: row.value }; break;
        case "≥": case "after": result[row.field] = { kind: "range", min: row.value }; break;
        case "<":            result[row.field] = { kind: "range", max: row.value }; break;
        case "≤": case "before": result[row.field] = { kind: "range", max: row.value }; break;
        case "between":      result[row.field] = { kind: "range", min: row.value, max: row.value2 || undefined }; break;
      }
    }
  }
  return result;
}

function applyFilters(receipts: ReceiptRecord[], specs: Record<string, FilterSpec>, search: string): ReceiptRecord[] {
  const q = search.toLowerCase();
  return receipts.filter((r) => {
    if (q) {
      const hay = [r.merchant, r.category, r.paymentMethod, r.notes, r.date]
        .filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    for (const [field, spec] of Object.entries(specs)) {
      const raw = r[field as keyof ReceiptRecord];
      const val = raw === undefined || raw === null ? "" : String(raw);
      if (spec.kind === "enum") { if (!spec.values.includes(val)) return false; }
      else if (spec.kind === "text") { if (!val.toLowerCase().includes(spec.q.toLowerCase())) return false; }
      else if (spec.kind === "range") {
        const num = parseFloat(val);
        if (spec.min !== undefined && num < parseFloat(spec.min)) return false;
        if (spec.max !== undefined && num > parseFloat(spec.max)) return false;
      }
    }
    return true;
  });
}

function getEnumValues(receipts: ReceiptRecord[], field: string): string[] {
  const set = new Set<string>();
  receipts.forEach((r) => {
    const v = r[field as keyof ReceiptRecord];
    if (v !== undefined && v !== null && v !== "") set.add(String(v));
  });
  return Array.from(set).sort();
}

function doExportCSV(receipts: ReceiptRecord[], visibleKeys: string[]) {
  const cols = COLUMNS.filter((c) => visibleKeys.includes(c.key));
  const header = cols.map((c) => c.label).join(",");
  const rows = receipts.map((r) =>
    cols.map((c) => {
      let v: unknown = r[c.key as keyof ReceiptRecord];
      if (c.key === "items")     v = Array.isArray(r.items) ? r.items.length : 0;
      if (c.key === "createdAt") v = fmtCreatedAt(r.createdAt);
      const s = v === undefined || v === null ? "" : String(v);
      return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(",")
  );
  const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "receipts.csv";
  a.click();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Spinner() { return <span className="cl-spinner" aria-label="Loading" />; }

function PencilIcon() {
  return (
    <svg className="cl-pencil" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

function CellInput({ type, initialValue, options, onSave, onCancel }: {
  type: "text" | "number" | "date" | "select";
  initialValue: string;
  options?: string[];
  onSave: (v: string) => void;
  onCancel: () => void;
}) {
  const [val, setVal] = useState(initialValue);
  if (type === "select" && options) {
    return (
      <select autoFocus className="cl-cell-select" value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => onSave(val)}
        onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); onCancel(); } if (e.key === "Enter") { e.stopPropagation(); onSave(val); } }}
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  return (
    <div className="cl-cell-edit-wrap">
      <input autoFocus className="cl-cell-input"
        type={type === "number" ? "number" : type === "date" ? "date" : "text"}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); onCancel(); } if (e.key === "Enter") { e.stopPropagation(); onSave(val); } }}
      />
      <div className="cl-cell-actions">
        <button className="cl-cell-cancel-btn" onMouseDown={(e) => e.preventDefault()} onClick={onCancel} title="Cancel (Esc)">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <button className="cl-cell-confirm-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => onSave(val)} title="Save (Enter)">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        </button>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ReceiptList({
  receipts,
  loading,
  onSave,
  onDelete,
  listTitle = "Receipts",
}: ReceiptListProps) {

  // ── Column state ─────────────────────────────────────────────────────────
  const [colOrder,    setColOrder]    = useState<string[]>(COLUMNS.map((c) => c.key));
  const [colVisible,  setColVisible]  = useState<string[] | null>(DEFAULT_VISIBLE);
  const [showColPicker, setShowColPicker] = useState(false);
  const [showExport,    setShowExport]    = useState(false);
  const colPickerRef = useRef<HTMLDivElement>(null);
  const exportRef    = useRef<HTMLDivElement>(null);

  // ── Sort ─────────────────────────────────────────────────────────────────
  const [sortField, setSortField] = useState<string>("date");
  const [sortDir,   setSortDir]   = useState<"asc" | "desc">("desc");

  // ── Search ───────────────────────────────────────────────────────────────
  const [searchText, setSearchText] = useState("");

  // ── Filter builder ───────────────────────────────────────────────────────
  const [filterRows,        setFilterRows]        = useState<FilterRow[]>([]);
  const [showFilterBuilder, setShowFilterBuilder] = useState(false);
  const uidRef = useRef(0);
  function newId() { return String(++uidRef.current); }

  // ── Inline editing ───────────────────────────────────────────────────────
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);

  // ── Drag-to-reorder ──────────────────────────────────────────────────────
  const [dragCol,     setDragCol]     = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  // ── Pagination ───────────────────────────────────────────────────────────
  const [page, setPage] = useState(0);

  // ── Scroll sync (horizontal scrollbar) ───────────────────────────────────
  const tableScrollRef   = useRef<HTMLDivElement>(null);
  const hScrollTrackRef  = useRef<HTMLDivElement>(null);
  const [hThumb, setHThumb] = useState({ show: false, left: 0, width: 0 });
  const thumbDragging = useRef(false);
  const thumbStartX   = useRef(0);
  const thumbStartLeft = useRef(0);

  // Close dropdowns on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (colPickerRef.current && !colPickerRef.current.contains(e.target as Node)) setShowColPicker(false);
      if (exportRef.current    && !exportRef.current.contains(e.target as Node))    setShowExport(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Sync horizontal scrollbar
  function syncHThumb() {
    const el = tableScrollRef.current;
    if (!el) return;
    const trackW = el.clientWidth;
    const scrollW = el.scrollWidth;
    if (scrollW <= trackW) { setHThumb({ show: false, left: 0, width: 0 }); return; }
    const thumbW = Math.max(40, (trackW / scrollW) * trackW);
    const maxLeft = trackW - thumbW;
    const left = (el.scrollLeft / (scrollW - trackW)) * maxLeft;
    setHThumb({ show: true, left, width: thumbW });
  }

  useEffect(() => { syncHThumb(); }, [colOrder, colVisible, receipts]);

  function onThumbMouseDown(e: React.MouseEvent) {
    thumbDragging.current = true;
    thumbStartX.current   = e.clientX;
    thumbStartLeft.current = hThumb.left;
    const onMove = (ev: MouseEvent) => {
      if (!thumbDragging.current || !tableScrollRef.current || !hScrollTrackRef.current) return;
      const el = tableScrollRef.current;
      const trackW = el.clientWidth;
      const scrollW = el.scrollWidth;
      const thumbW = hThumb.width;
      const maxLeft = trackW - thumbW;
      const newLeft = Math.max(0, Math.min(maxLeft, thumbStartLeft.current + ev.clientX - thumbStartX.current));
      el.scrollLeft = (newLeft / maxLeft) * (scrollW - trackW);
    };
    const onUp = () => { thumbDragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp,   { once: true });
  }

  function onTrackClick(e: React.MouseEvent) {
    const track = hScrollTrackRef.current;
    const el    = tableScrollRef.current;
    if (!track || !el) return;
    const rect = track.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    el.scrollLeft = ratio * (el.scrollWidth - el.clientWidth);
  }

  function scrollToLeft() { if (tableScrollRef.current) tableScrollRef.current.scrollLeft = 0; }

  // ── Derived state ────────────────────────────────────────────────────────

  const filterSpecs = useMemo(() => filterRowsToSpecs(filterRows), [filterRows]);

  const filteredReceipts = useMemo(() => {
    let rows = applyFilters(receipts, filterSpecs, searchText);
    if (sortField) {
      rows = [...rows].sort((a, b) => {
        const av = a[sortField as keyof ReceiptRecord] ?? "";
        const bv = b[sortField as keyof ReceiptRecord] ?? "";
        const an = parseFloat(String(av));
        const bn = parseFloat(String(bv));
        let cmp = !isNaN(an) && !isNaN(bn) ? an - bn : String(av).localeCompare(String(bv));
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return rows;
  }, [receipts, filterSpecs, searchText, sortField, sortDir]);

  const totalPages = Math.ceil(filteredReceipts.length / PAGE_SIZE);
  const pageReceipts = filteredReceipts.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const visibleColDefs = useMemo(() =>
    colOrder
      .map((k) => COLUMNS.find((c) => c.key === k)!)
      .filter((c) => c && (colVisible === null || colVisible.includes(c.key))),
    [colOrder, colVisible]
  );

  const totals = useMemo(() => ({
    total:    filteredReceipts.reduce((s, r) => s + (r.total ?? 0), 0),
    subtotal: filteredReceipts.reduce((s, r) => s + (r.subtotal ?? 0), 0),
    tax:      filteredReceipts.reduce((s, r) => s + (r.tax ?? 0), 0),
    tip:      filteredReceipts.reduce((s, r) => s + (r.tip ?? 0), 0),
  }), [filteredReceipts]);

  const activeFilterCount = useMemo(() =>
    Object.values(filterSpecs).filter((v) =>
      v.kind === "enum" ? v.values.length > 0 : v.kind === "text" ? !!v.q : !!(v.min || v.max)
    ).length,
    [filterSpecs]
  );

  const pickableCols = COLUMNS.filter((c) => !c.noFilter || c.key !== "items");

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleSort(key: string) {
    if (sortField === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortField(key); setSortDir("asc"); }
    setPage(0);
  }

  function addFilterRow() {
    const first = COLUMNS.find((c) => !c.noFilter);
    if (!first) return;
    setFilterRows((prev) => [...prev, {
      id: newId(), field: first.key,
      operator: getOperators(first.filterType)[0],
      value: "", value2: "",
    }]);
  }

  function updateFilterRow(id: string, patch: Partial<FilterRow>) {
    setFilterRows((prev) => prev.map((r) => r.id === id ? { ...r, ...patch } : r));
  }

  function removeFilterRow(id: string) {
    setFilterRows((prev) => prev.filter((r) => r.id !== id));
  }

  function reorderCol(from: string, to: string) {
    setColOrder((prev) => {
      const next = [...prev];
      const fi = next.indexOf(from);
      const ti = next.indexOf(to);
      if (fi === -1 || ti === -1) return prev;
      next.splice(fi, 1);
      next.splice(ti, 0, from);
      return next;
    });
  }

  function togglePickerCol(key: string) {
    setColVisible((prev) => {
      const current = prev ?? COLUMNS.map((c) => c.key);
      return current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
    });
  }

  async function commitCell(id: string, field: string, raw: string) {
    setEditingCell(null);
    if (!onSave) return;
    const numFields = new Set(["total", "subtotal", "tax", "tip"]);
    await onSave(id, field, numFields.has(field) ? parseFloat(raw) || 0 : raw);
  }

  // ── Cell renderer ────────────────────────────────────────────────────────

  function renderCell(col: ColDef, r: ReceiptRecord) {
    const isEditing = editingCell?.id === r.id && editingCell?.field === col.key;
    const canEdit   = !!onSave && EDITABLE_COLS.has(col.key);

    if (isEditing) {
      let type: "text" | "number" | "date" | "select" = "text";
      let opts: string[] | undefined;
      if (col.key === "category")      { type = "select"; opts = CATEGORY_OPTIONS as string[]; }
      else if (col.key === "paymentMethod") { type = "select"; opts = PAYMENT_OPTIONS; }
      else if (col.key === "currency") { type = "select"; opts = ["USD", "EUR", "GBP", "CAD", "AUD"]; }
      else if (col.filterType === "number") type = "number";
      else if (col.filterType === "date")   type = "date";
      const raw = r[col.key as keyof ReceiptRecord];
      const initial = raw === undefined || raw === null ? "" : String(raw);
      return (
        <td key={col.key} className="cl-td">
          <CellInput type={type} initialValue={initial} options={opts}
            onSave={(v) => commitCell(r.id, col.key, v)}
            onCancel={() => setEditingCell(null)}
          />
        </td>
      );
    }

    let content: React.ReactNode = "—";
    switch (col.key) {
      case "date":          content = fmtDate(r.date); break;
      case "merchant":      content = r.merchant || "—"; break;
      case "category":      content = r.category || "—"; break;
      case "total":         content = <span style={{ fontWeight: 600 }}>{fmtMoney(r.total)}</span>; break;
      case "subtotal":      content = fmtMoney(r.subtotal); break;
      case "tax":           content = fmtMoney(r.tax); break;
      case "tip":           content = r.tip ? fmtMoney(r.tip) : "—"; break;
      case "paymentMethod": content = r.paymentMethod || "—"; break;
      case "currency":      content = r.currency || "USD"; break;
      case "items":         content = r.items?.length ? `${r.items.length} item${r.items.length !== 1 ? "s" : ""}` : "—"; break;
      case "notes":         content = r.notes || "—"; break;
      case "createdAt":     content = fmtCreatedAt(r.createdAt); break;
      default:              content = String(r[col.key as keyof ReceiptRecord] ?? "—");
    }

    return (
      <td key={col.key} className="cl-td">
        <div
          className={"cl-cell-inner" + (canEdit ? " cl-cell-editable" : "")}
          onClick={() => canEdit && setEditingCell({ id: r.id, field: col.key })}
        >
          <span className="cl-cell-value">{content}</span>
          {canEdit && <PencilIcon />}
        </div>
      </td>
    );
  }

  // ── Filter builder renderer ───────────────────────────────────────────────

  function renderFilterBuilder() {
    if (!showFilterBuilder) return null;
    return (
      <div className="cl-filter-builder">
        {filterRows.length === 0 && (
          <div className="cl-fb-empty">No filters — click "Add filter" to start.</div>
        )}
        {filterRows.map((row) => {
          const col = COLUMNS.find((c) => c.key === row.field);
          const ft  = col?.filterType ?? "text";
          const ops = getOperators(ft);
          const enumVals = ft === "enum" ? getEnumValues(receipts, row.field) : [];
          return (
            <div key={row.id} className="cl-fb-row">
              <span className="cl-fb-where">Where</span>
              <select className="cl-fb-select" value={row.field}
                onChange={(e) => {
                  const nc = COLUMNS.find((c) => c.key === e.target.value);
                  updateFilterRow(row.id, { field: e.target.value, operator: getOperators(nc?.filterType)[0], value: "", value2: "" });
                }}
              >
                <option value="">Select field…</option>
                {COLUMNS.filter((c) => !c.noFilter).map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
              <select className="cl-fb-select cl-fb-select-op" value={row.operator}
                onChange={(e) => updateFilterRow(row.id, { operator: e.target.value, value: "", value2: "" })}
              >
                {ops.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              {ft === "enum" ? (
                <select className="cl-fb-select cl-fb-select-val" value={row.value}
                  onChange={(e) => updateFilterRow(row.id, { value: e.target.value })}
                >
                  <option value="">Select…</option>
                  {enumVals.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              ) : row.operator === "between" ? (
                <>
                  <input className="cl-fb-input" type={ft === "date" ? "date" : "number"} placeholder="From"
                    value={row.value} onChange={(e) => updateFilterRow(row.id, { value: e.target.value })} />
                  <span className="cl-fb-and">and</span>
                  <input className="cl-fb-input" type={ft === "date" ? "date" : "number"} placeholder="To"
                    value={row.value2} onChange={(e) => updateFilterRow(row.id, { value2: e.target.value })} />
                </>
              ) : (
                <input className="cl-fb-input cl-fb-input-wide"
                  type={ft === "date" ? "date" : ft === "number" ? "number" : "text"}
                  placeholder="Value…" value={row.value}
                  onChange={(e) => updateFilterRow(row.id, { value: e.target.value })} />
              )}
              <button className="cl-fb-remove" onClick={() => removeFilterRow(row.id)} title="Remove filter">
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
        <div className="cl-fb-footer">
          <button className="cl-fb-add" onClick={addFilterRow}>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add filter
          </button>
          {filterRows.length > 0 && (
            <button className="cl-fb-clear" onClick={() => setFilterRows([])}>Clear all</button>
          )}
        </div>
      </div>
    );
  }

  // ── Loading state ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="cl-root cl-loading">
        <div className="cl-loading-spinner" />
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="cl-root">

      {/* Header */}
      <div className="cl-header">
        <div className="cl-header-row">
          <div className="cl-header-left">
            <div className="cl-header-accent" />
            <div>
              <h1 className="cl-title">{listTitle}</h1>
              <p className="cl-subtitle">
                {filteredReceipts.length !== receipts.length
                  ? `${filteredReceipts.length.toLocaleString()} of ${receipts.length.toLocaleString()} receipts`
                  : `${receipts.length.toLocaleString()} receipt${receipts.length !== 1 ? "s" : ""}`}
                {filteredReceipts.length > 0 && (
                  <> · {fmtMoney(totals.total)} total</>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action icon bar */}
      <div className="cl-toolbar-row">
        <div className="cl-toolbar">
          <div className="cl-toolbar-seg" style={{ fontSize: 12, color: "var(--cl-text-4)", padding: "0 8px" }}>
            {receipts.length === 0 ? "No receipts yet" : `${receipts.length} receipt${receipts.length !== 1 ? "s" : ""}`}
          </div>
        </div>

        <div className="cl-action-bar">
          {/* Column picker */}
          <div className="cl-action-wrap" ref={colPickerRef}>
            <button className={"cl-action-btn" + (showColPicker ? " active" : "")}
              onClick={() => setShowColPicker((p) => !p)} title="Show / hide columns">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 4H5a1 1 0 00-1 1v14a1 1 0 001 1h4M9 4v16M9 4h6M9 20h6m0-16h4a1 1 0 011 1v14a1 1 0 01-1 1h-4M15 4v16" />
              </svg>
            </button>
            {showColPicker && (
              <div className="cl-export-menu cl-col-picker-menu">
                <div className="cl-export-menu-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div className="cl-export-menu-title">Show / Hide Columns</div>
                    <div className="cl-export-menu-sub">
                      {colVisible === null ? pickableCols.length : colVisible.length} of {pickableCols.length} shown
                    </div>
                  </div>
                  <button className="cl-col-picker-reset" onClick={() => setColVisible(null)}>Reset</button>
                </div>
                <div className="cl-col-picker-body">
                  {pickableCols.map((col) => {
                    const checked = colVisible === null || colVisible.includes(col.key);
                    return (
                      <label key={col.key} className="cl-col-picker-row">
                        <input type="checkbox" checked={checked} onChange={() => togglePickerCol(col.key)} />
                        <span>{col.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Export */}
          <div className="cl-action-wrap" ref={exportRef}>
            <button className={"cl-action-btn" + (showExport ? " active" : "")}
              onClick={() => setShowExport((p) => !p)}
              disabled={filteredReceipts.length === 0}
              title="Export to CSV">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </button>
            {showExport && (
              <div className="cl-export-menu">
                <div className="cl-export-menu-header">
                  <div className="cl-export-menu-title">Export to CSV</div>
                  <div className="cl-export-menu-sub">Exports all currently filtered records</div>
                </div>
                <div className="cl-export-menu-body">
                  <button className="cl-export-dl-btn" onClick={() => { doExportCSV(filteredReceipts, colVisible ?? COLUMNS.map((c) => c.key)); setShowExport(false); }}>
                    Download
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search + filter toggle */}
      <div className="cl-search-area">
        <div className="cl-search-row">
          <div className="cl-search-wrap">
            <svg className="cl-search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input className="cl-search-input" type="text"
              placeholder="Search by merchant, category, notes…"
              value={searchText}
              onChange={(e) => { setSearchText(e.target.value); setPage(0); }}
            />
            {searchText && (
              <button className="cl-search-clear" onClick={() => setSearchText("")}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button className={"cl-filter-toggle" + (showFilterBuilder || activeFilterCount > 0 ? " active" : "")}
            onClick={() => { setShowFilterBuilder((p) => !p); if (!showFilterBuilder && filterRows.length === 0) addFilterRow(); }}>
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L13 10.414V17a1 1 0 01-1.447.894l-4-2A1 1 0 017 15v-4.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
            </svg>
            Filter
            {activeFilterCount > 0 && <span className="cl-filter-toggle-count">{activeFilterCount}</span>}
          </button>
        </div>

        {/* Filter builder */}
        {renderFilterBuilder()}
      </div>

      {/* Active filter chips */}
      {showFilterBuilder && activeFilterCount > 0 && (
        <div className="cl-active-filters">
          <span className="cl-active-filters-label">Column filters:</span>
          {Object.entries(filterSpecs).map(([col, spec]) => {
            const colDef = COLUMNS.find((c) => c.key === col);
            const name   = colDef?.label || col;
            let chip = "";
            if (spec.kind === "enum"  && spec.values.length) chip = spec.values.length > 1 ? `${name}: ${spec.values.length} selected` : `${name}: ${spec.values[0]}`;
            if (spec.kind === "text"  && spec.q)             chip = `${name}: ~${spec.q}`;
            if (spec.kind === "range" && (spec.min || spec.max)) chip = `${name}: ${spec.min ?? ""}–${spec.max ?? ""}`;
            if (!chip) return null;
            return (
              <span key={col} className="cl-filter-chip">
                {chip}
                <button className="cl-filter-chip-remove" onClick={() => setFilterRows((prev) => prev.filter((r) => r.field !== col))}>×</button>
              </span>
            );
          })}
          <button className="cl-filter-clear-all" onClick={() => setFilterRows([])}>Clear all</button>
        </div>
      )}

      {/* Table */}
      <div className="cl-table-area">
        {filteredReceipts.length > 0 ? (
          <div className="cl-table-wrap">
            <div className="cl-table-scroll" ref={tableScrollRef} onScroll={syncHThumb}>
              <table className="cl-table">
                <thead className="cl-thead">
                  <tr>
                    {visibleColDefs.map((col) => {
                      const isSorted   = sortField === col.key;
                      const isDragging = dragCol === col.key;
                      const isDragOver = dragOverCol === col.key && dragCol !== col.key;
                      return (
                        <th key={col.key}
                          className={["cl-th", isDragging ? "dragging" : "", isDragOver ? "drag-over" : ""].filter(Boolean).join(" ")}
                          onDragOver={(e) => { e.preventDefault(); if (dragCol && dragCol !== col.key) setDragOverCol(col.key); }}
                          onDrop={() => { if (dragCol && dragCol !== col.key) reorderCol(dragCol, col.key); setDragOverCol(null); }}
                        >
                          <div className="cl-th-inner">
                            <span className="cl-drag-grip" draggable
                              onDragStart={(e) => { e.stopPropagation(); setDragCol(col.key); }}
                              onDragEnd={() => { setDragCol(null); setDragOverCol(null); }}
                              title="Drag to reorder">
                              <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                <circle cx="5" cy="4" r="1.5"/><circle cx="11" cy="4" r="1.5"/>
                                <circle cx="5" cy="8" r="1.5"/><circle cx="11" cy="8" r="1.5"/>
                                <circle cx="5" cy="12" r="1.5"/><circle cx="11" cy="12" r="1.5"/>
                              </svg>
                            </span>
                            {col.sortable ? (
                              <button className={"cl-sort-btn" + (isSorted ? " sorted" : "")} onClick={() => handleSort(col.key)}>
                                {col.label}
                                <span className={"cl-sort-arrow" + (isSorted ? "" : " unsorted")}>
                                  {isSorted ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                                </span>
                              </button>
                            ) : (
                              <span>{col.label}</span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                    {onDelete && <th className="cl-th-actions">Delete</th>}
                  </tr>
                </thead>
                <tbody>
                  {pageReceipts.map((r) => (
                    <tr key={r.id} className="cl-tr">
                      {visibleColDefs.map((col) => renderCell(col, r))}
                      {onDelete && (
                        <td className="cl-td-actions">
                          <button className="cl-btn-unclaim" onClick={() => onDelete(r.id)} title="Delete">
                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}

                  {/* Totals footer row */}
                  <tr className="cl-tr" style={{ borderTop: "1px solid var(--cl-border-2)", background: "var(--cl-surface)" }}>
                    {visibleColDefs.map((col) => (
                      <td key={col.key} className="cl-td" style={{ color: "var(--cl-text-3)", fontWeight: 600 }}>
                        {col.key === "merchant" ? (
                          <span style={{ color: "var(--cl-text-4)", fontWeight: 400 }}>
                            {filteredReceipts.length} receipt{filteredReceipts.length !== 1 ? "s" : ""}
                          </span>
                        ) : col.key === "total"    ? fmtMoney(totals.total)
                          : col.key === "subtotal" ? fmtMoney(totals.subtotal)
                          : col.key === "tax"      ? fmtMoney(totals.tax)
                          : col.key === "tip"      ? (totals.tip ? fmtMoney(totals.tip) : "")
                          : ""}
                      </td>
                    ))}
                    {onDelete && <td className="cl-td-actions" />}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Horizontal scrollbar */}
            {hThumb.show && (
              <div className="cl-hscroll-bar">
                <button className="cl-scroll-left-btn" onClick={scrollToLeft} title="Scroll to start">&#8249;</button>
                <div className="cl-hscroll-track" ref={hScrollTrackRef} onMouseDown={onTrackClick}>
                  <div className="cl-hscroll-thumb"
                    style={{ left: hThumb.left, width: hThumb.width }}
                    onMouseDown={onThumbMouseDown}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="cl-empty">
            <div className="cl-empty-icon">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: "var(--cl-text-4)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z" />
              </svg>
            </div>
            <p className="cl-empty-title">{receipts.length === 0 ? "No receipts yet" : "No receipts match the filters"}</p>
            <p className="cl-empty-sub">{receipts.length === 0 ? "Upload a receipt above to get started." : "Try adjusting your search or filters."}</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="cl-pagination">
            <button className="cl-page-btn" onClick={() => setPage((p) => p - 1)} disabled={page === 0}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Prev
            </button>
            <span className="cl-page-info">Page {page + 1} of {totalPages}</span>
            <button className="cl-page-btn" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1}>
              Next
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
