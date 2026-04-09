// OdsList component — file kept as ClientList.tsx for backward compatibility
/**
 * OdsList
 *
 * A fully-featured, reusable data table for displaying records with dynamic column definitions.
 *
 * Features:
 *  - Dynamic column definitions via props (OdsColDef[])
 *  - Column drag-to-reorder
 *  - Per-column filters (enum checkbox, text search, date/number range)
 *  - Sort (any sortable column, asc/desc)
 *  - Pill quick-filters (auto from columns, saved filter presets)
 *  - Inline cell editing with save callbacks
 *  - CSV export (dynamic, based on visible columns)
 *  - Generic groupBy with section dividers
 *  - Expandable rows with chevron column
 *
 * All data fetching and persistence is handled by the parent.
 * This component is purely UI + local interaction state.
 *
 * @example
 * <OdsList
 *   columns={CLIENT_COLUMNS}
 *   clients={clients}
 *   uid={currentUser.uid}
 *   userName="Jane Smith"
 *   isAdmin
 *   onSave={async (id, field, value) => { await updateDoc(...) }}
 * />
 */

import React, {
  useState, useMemo, useRef, useEffect, useCallback,
} from "react";
import { createPortal } from "react-dom";
import { OdsStatCard } from "./OdsCard";
import {
  CheckIcon,
  XMarkIcon,
  TrashIcon as HeroTrashIcon,
  PencilIcon as HeroPencilIcon,
  PencilSquareIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  WrenchScrewdriverIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PlusIcon,
  UserIcon,
  BoltIcon,
  XCircleIcon,
  SwatchIcon,
  EyeIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import "./ClientList.css";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChangeRecord {
  /** Client-side timestamp (seconds). serverTimestamp() cannot be nested in arrayUnion objects. */
  at: { seconds: number };
  /** Display name of the user who made the change. */
  by: string;
  /** Field that was changed. */
  field: string;
  /** Previous value as a string. */
  from: string;
  /** New value as a string. */
  to: string;
}

export interface OdsRecord {
  id: string;
  /** Primary display label. Preferred over clientName. */
  displayLabel?: string;
  /** @deprecated Use displayLabel instead */
  clientName?: string;
  agentId?: string;
  agentName?: string;
  contractorId?: string;
  agentTeamNumber?: number;
  date?: string;
  phone?: string;
  phoneSpecialCase?: boolean;
  email?: string;
  state?: string;
  carrier?: string;
  appNumber?: string;
  annualPremium?: number;
  splitPercent?: number;
  portalName?: string;
  startDate?: string;
  agentStatus?: string;
  adminStatus?: string;
  notes?: string;
  clientPaidDate?: string;
  compDate?: string;
  historical?: boolean;
  createdAt?: { seconds: number } | null;
  createdByName?: string;
  updatedAt?: { seconds: number } | null;
  updatedByName?: string;
  changeLog?: ChangeRecord[];
  [key: string]: unknown;
}

type FilterSpec =
  | { kind: "enum";  values: string[] }
  | { kind: "enum-exclude"; values: string[] }
  | { kind: "text";  q: string }
  | { kind: "text-startswith"; q: string }
  | { kind: "empty" }
  | { kind: "not-empty" }
  | { kind: "range"; min?: string; max?: string };

export interface FilterRow {
  id: string;
  field: string;
  operator: string;
  value: string;
  value2: string; // used for "between"
}

export type SortEntry = { field: string; dir: "asc" | "desc" };

export interface OdsListView {
  id: string;
  name: string;
  colOrder?: string[];
  /** Explicit list of column keys to show. If omitted, all columns are shown. */
  visibleCols?: string[];
  /** @deprecated Use `sorts` instead. Kept for backward compatibility. */
  sortField?: string | null;
  /** @deprecated Use `sorts` instead. Kept for backward compatibility. */
  sortDir?: "asc" | "desc";
  /** Multi-sort chain. Takes priority over sortField/sortDir when present. */
  sorts?: SortEntry[];
  filterRows?: FilterRow[];
  builtIn?: boolean;
  /** Mark as the default view — shown first with a divider separating it from other views. */
  isDefault?: boolean;
  /** Visual style overrides saved with this view */
  style?: OdsListSchema["style"];
  /** Rows per page. Default 30. Use 0 for "All". */
  pageSize?: number;
}

// ─── Column definition ───────────────────────────────────────────────────────

export interface CellHelpers {
  uid: string;
  userName: string;
  isPrivileged: boolean;
  canEdit: (colKey: string) => boolean;
  canDelete: (colKey: string) => boolean;
  startEdit: (id: string, field: string, value: string) => void;
}

export interface OdsColDef {
  key: string;
  label: string;
  sortable?: boolean;
  editable?: boolean;
  filterType?: "enum" | "text" | "number" | "date";
  enumValues?: string[];
  /** Optional display labels for enum values. Key = value, Value = display label. */
  enumLabels?: Record<string, string>;
  adminOnly?: boolean;
  meta?: boolean;
  noFilter?: boolean;
  /** When true, cell shows an icon instead of text. Click opens a dialog to view/edit the full content. */
  multiline?: boolean;
  render?: (value: unknown, record: OdsRecord, helpers: CellHelpers) => React.ReactNode;
}

// ─── Schema overrides ────────────────────────────────────────────────────

/** Serializable column override — stored in Firestore. */
export interface SchemaColumnOverride {
  key: string;
  label?: string;
  sortable?: boolean;
  editable?: boolean;
  filterType?: "enum" | "text" | "number" | "date";
  enumValues?: string[];
  adminOnly?: boolean;
  hidden?: boolean;         // hide from the list entirely
  order?: number;           // column ordering index
}

/** Full schema config persisted to Firestore — dev-editable from the UI. */
export interface OdsListSchema {
  columns?: SchemaColumnOverride[];
  defaultVisibleCols?: string[];
  defaultSortField?: string;
  defaultSortDir?: "asc" | "desc";
  addedColumns?: OdsColDef[];  // columns added by dev that don't exist in code
  displayMode?: "table" | "expandable" | "card" | "document" | "mail";
  collapsedFields?: string[];
  expandedSections?: { label: string; fields: string[] }[];
  /** Column key to group records by. When set, auto-generates groups from distinct values. */
  groupByField?: string;
  /** Row-level data scoping per role. Controls which records each role can see. */
  dataScope?: {
    /** Record field that contains the owner's UID (e.g. "agentId", "uid"). */
    ownerField?: string;
    /** Record field that contains the team number (e.g. "agentTeamNumber", "teamNumber"). */
    teamField?: string;
    /** What reps can see: "own" = only their records, "team" = their team, "all" = everything. Default: "own". */
    rep?: "own" | "team" | "all";
    /** What managers can see. Default: "team". */
    manager?: "own" | "team" | "all";
    /** What admins can see. Default: "all". */
    admin?: "own" | "team" | "all";
  };
  /** Rows per page. Default 30. Use 0 for "All". */
  pageSize?: number;
  /** Visual style overrides for cards/rows */
  style?: {
    bgColor?: string;
    shadowColor?: string;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    shadowBlur?: number;
    hideTitle?: boolean;
    hideViewBar?: boolean;
    hideSearch?: boolean;
    hideRecordCount?: boolean;
    hideFooter?: boolean;
    viewOnly?: boolean;
  };
}

// ─── Permissions ──────────────────────────────────────────────────────────────

/** The five roles in your company. Owner and dev always have full access. */
export type AppRole = "rep" | "manager" | "admin" | "owner" | "dev";

/** Per-column CRUD permission for a single role. */
export interface ColPermission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

/**
 * Full permissions matrix for the three configurable roles.
 * Keyed by column key (matches columns[].key).
 * Owner and dev bypass this entirely and always have full access.
 */
export type PermissionsMatrix = {
  rep:     Record<string, ColPermission>;
  manager: Record<string, ColPermission>;
  admin:   Record<string, ColPermission>;
};

/**
 * Build a default permissions matrix from a set of column definitions.
 * All columns get full CRUD for every role.
 */
export function buildDefaultPermissions(columns: OdsColDef[]): PermissionsMatrix {
  const allOn = () =>
    Object.fromEntries(columns.map((c) => [c.key, { view: true, create: true, edit: true, delete: true }]));
  const actions = {
    export: { view: true, create: true, edit: true, delete: true },
    rename: { view: true, create: true, edit: true, delete: true },
    _record: { view: true, create: true, edit: true, delete: true },
  };
  return {
    rep:     { ...allOn(), ...actions },
    manager: { ...allOn(), ...actions },
    admin:   { ...allOn(), ...actions },
  };
}

/** Backward-compatible empty default. Prefer buildDefaultPermissions(columns) at the call-site. */
export const DEFAULT_PERMISSIONS: PermissionsMatrix = buildDefaultPermissions([]);

// ─── Props ───────────────────────────────────────────────────────────────────

export interface OdsListProps {
  // === Data ===
  /** Column definitions — REQUIRED. Drives headers, filters, rendering, and export. */
  columns: OdsColDef[];
  /** Records to display. Also accepts legacy `clients` prop name. */
  data?: OdsRecord[];
  /** @deprecated Use `data` instead. Kept for backward compatibility. */
  clients?: OdsRecord[];
  /** Whether records are still loading. Shows a spinner. */
  loading?: boolean;

  // === Display ===
  /** Display name for this list. Defaults to "Clients". */
  listTitle?: string;
  /** Field key used as the primary display label for each record. Defaults to "displayLabel". */
  labelField?: string;
  /** Display mode: "table" for Excel-like grid, "expandable" for clickable expanding rows. Default: "table". */
  displayMode?: "table" | "expandable" | "card" | "document" | "mail";

  // === Table mode options ===
  /** Which column keys are visible by default. Falls back to all columns. */
  defaultVisibleCols?: string[];
  /** When true and onRowClick is provided, render a narrow expand-chevron first column. */
  expandable?: boolean;
  /** Initial sort column. Defaults to no sort (preserves data order from the hook). */
  initialSortField?: string | null;
  /** Initial sort direction. Defaults to "asc". */
  initialSortDir?: "asc" | "desc";

  // === Expandable mode options ===
  /** Column keys shown in the collapsed row (expandable mode). */
  collapsedFields?: string[];
  /** Sections shown when a row is expanded (expandable mode). */
  expandedSections?: { label: string; fields: string[] }[];
  /** Callback when a row expands (expandable mode). */
  onExpandRow?: (record: OdsRecord) => void;
  /** Custom render for expanded content — overrides auto-generated sections. */
  renderExpandedContent?: (record: OdsRecord) => React.ReactNode;

  // === Grouping ===
  /** Generic record grouping. When provided, rows are partitioned and rendered with section headers. */
  groupBy?: {
    fn: (record: OdsRecord) => string;
    groups: { key: string; label: string; color: string; pulse?: boolean }[];
  };

  // === User context ===
  /** Current user's UID — used to scope claimed/unclaimed logic. */
  uid?: string;
  /** Current user's display name — written to updatedByName on save. */
  userName?: string;
  /** The current user's role. Defaults to "owner" (full access) when omitted. */
  currentRole?: AppRole;
  /** Show admin-only columns. */
  isAdmin?: boolean;
  /** Managers see agent name + team but not all admin controls. */
  isManager?: boolean;
  /** Current user's team number — used for dataScope "team" filtering. */
  userTeamNumber?: number;

  // === Permissions ===
  /** Column-level view/edit permissions per role. */
  permissions?: PermissionsMatrix;
  /** Called when an owner/dev saves the permissions matrix. */
  onSavePermissions?: (matrix: PermissionsMatrix) => Promise<void>;

  // === Per-user preferences (accessibility) ===
  /** Per-user preferences loaded from Firestore (e.g. fontSize). */
  userPrefs?: { fontSize?: string };
  /** Called when the user changes their preferences. Parent persists to Firestore. */
  onSaveUserPrefs?: (prefs: { fontSize: string }) => Promise<void>;


  // === Badge / unread count ===
  /** Called whenever the unread count changes. Use to drive external badge counts (e.g. nav badge).
   *  A record is "unread" if: status === "pending", or read === false, or unread === true. */
  onUnreadCount?: (count: number) => void;

  // === Schema (dev-editable config) ===
  /** Saved schema overrides from Firestore. Merged with code-defined columns at render time. */
  schema?: OdsListSchema;
  /** Called when a dev saves schema changes. */
  onSaveSchema?: (schema: OdsListSchema) => Promise<void>;

  // === Data callbacks ===
  /** Called when the user edits a cell and confirms. */
  onSave?: (
    id: string,
    field: string,
    value: string | number,
    updaterName: string,
    fromValue?: string | number,
  ) => Promise<void>;
  /** Called when the user clicks a row (table mode expand icon, or expandable mode row). */
  onRowClick?: (record: OdsRecord) => void;

  // === Views ===
  /** Saved views shown in the toolbar. */
  views?: OdsListView[];
  /** Called when saving a new view. Returns the new view ID. */
  onSaveView?: (view: Omit<OdsListView, "id">) => Promise<string>;
  /** Called when deleting a saved view. */
  onDeleteView?: (id: string) => Promise<void>;
  /** Called when a permitted user renames the list. */
  onRenameList?: (name: string) => Promise<void>;

  // === Delete callbacks ===
  /** Called when user deletes an entire record. Show confirmation first. */
  onDeleteRecord?: (id: string) => Promise<void>;
  /** Called when user clears a field value (sets to empty/null). */
  onDeleteField?: (id: string, field: string) => Promise<void>;
  /** Called when a dev adds a new column. Parent writes the default value to all docs in the collection. */
  onAddColumn?: (key: string, defaultValue: string | number | boolean) => Promise<void>;
  /** Called when user clicks the edit (pencil circle) icon on a record row. Opens a modal controlled by the parent. */
  onEditRecord?: (record: OdsRecord) => void;

  // === Legacy/special ===
  /** Show the Claim/Unclaim action column. */
  showActions?: boolean;
  /** Whether more records can be fetched from the server. */
  hasMore?: boolean;
  /** Called when the user clicks "Load more". */
  onLoadMore?: () => Promise<void>;
  phase?: "testing" | "merging" | "live";
  /** YYYY-MM-DD cutoff — records before this date are "historical" and hidden unless toggled. */
  historicalCutoff?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtPhone(p?: string) {
  if (!p) return "—";
  const d = p.replace(/\D/g, "");
  if (d.length === 11 && d[0] === "1") return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return p;
}

function fmtDate(s?: string | null) {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  if (!y || !m || !d) return s;
  return new Date(Number(y), Number(m) - 1, Number(d))
    .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtTimestamp(ts?: { seconds: number } | null) {
  if (!ts) return "—";
  return new Date(ts.seconds * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const AGENT_STATUS_CLASS: Record<string, string> = {
  Approved:  "approved",
  Declined:  "declined",
  "Sent UW": "sent-uw",
  Pending:   "pending",
  Cancelled: "cancelled",
};

// ─── Filter builder helpers ─────────────────────────────────────────────────

function getOperators(filterType: OdsColDef["filterType"]) {
  switch (filterType) {
    case "enum":   return ["is", "is not", "is empty", "is not empty"];
    case "text":   return ["contains", "is", "is not", "starts with", "is empty", "is not empty"];
    case "number": return ["=", ">", "≥", "<", "≤", "between", "is empty", "is not empty"];
    case "date":   return ["is", "before", "after", "between", "is empty", "is not empty", "is today", "is this week", "is this month", "is this year", "is monday", "is tuesday", "is wednesday", "is thursday", "is friday", "is saturday", "is sunday"];
    default:       return ["contains", "is", "is empty", "is not empty"];
  }
}

function filterRowsToSpecs(rows: FilterRow[], columns: OdsColDef[]): Record<string, FilterSpec> {
  const result: Record<string, FilterSpec> = {};
  for (const row of rows) {
    if (!row.field) continue;
    if (!row.value && row.operator !== "is empty" && row.operator !== "is not empty") continue;
    const col = columns.find((c) => c.key === row.field);
    const ft  = col?.filterType ?? "text";

    // Handle empty/not-empty for any type
    if (row.operator === "is empty") {
      result[row.field] = { kind: "empty" };
      continue;
    }
    if (row.operator === "is not empty") {
      result[row.field] = { kind: "not-empty" };
      continue;
    }

    if (ft === "enum") {
      if (row.operator === "is not") {
        const prev = result[row.field];
        const vals = prev?.kind === "enum-exclude" ? prev.values : [];
        if (!vals.includes(row.value)) result[row.field] = { kind: "enum-exclude", values: [...vals, row.value] };
      } else {
        const prev = result[row.field];
        const vals = prev?.kind === "enum" ? prev.values : [];
        if (!vals.includes(row.value)) result[row.field] = { kind: "enum", values: [...vals, row.value] };
      }
    } else if (ft === "text") {
      if (row.operator === "is") {
        result[row.field] = { kind: "enum", values: [row.value] };
      } else if (row.operator === "is not") {
        result[row.field] = { kind: "enum-exclude", values: [row.value] };
      } else if (row.operator === "starts with") {
        result[row.field] = { kind: "text-startswith", q: row.value };
      } else {
        result[row.field] = { kind: "text", q: row.value };
      }
    } else {
      // number / date
      switch (row.operator) {
        case "is":
        case "=":      result[row.field] = { kind: "range", min: row.value, max: row.value }; break;
        case ">":      result[row.field] = { kind: "range", min: row.value }; break;
        case "≥":
        case "after":  result[row.field] = { kind: "range", min: row.value }; break;
        case "<":      result[row.field] = { kind: "range", max: row.value }; break;
        case "≤":
        case "before": result[row.field] = { kind: "range", max: row.value }; break;
        case "between":result[row.field] = { kind: "range", min: row.value, max: row.value2 || undefined }; break;
      }
    }
  }
  return result;
}

// ─── CSV export (dynamic) ───────────────────────────────────────────────────

function exportCSVFile(rows: OdsRecord[], cols: OdsColDef[], title: string) {
  const headers = cols.map(c => c.label);
  const body = rows.map(r =>
    cols.map(c => {
      const val = r[c.key];
      if (val == null) return '""';
      if (typeof val === "object" && val !== null && "seconds" in val) {
        return `"${new Date((val as { seconds: number }).seconds * 1000).toISOString()}"`;
      }
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(",")
  ).join("\n");
  const blob = new Blob([headers.join(",") + "\n" + body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${title}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function Spinner() {
  return <span className="cl-spinner" aria-label="Loading" />;
}

function PencilIconBtn() {
  return <HeroPencilIcon className="cl-pencil" style={{ width: 11, height: 11 }} />;
}

function TrashIconBtn({ size = 12 }: { size?: number }) {
  return <HeroTrashIcon style={{ width: size, height: size }} />;
}

function CellInput({
  type, initialValue, options, optionLabels, onSave, onCancel, onDelete,
}: {
  type: "text" | "number" | "date" | "select";
  initialValue: string;
  options?: string[];
  optionLabels?: Record<string, string>;
  onSave: (v: string) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [val, setVal] = useState(initialValue);

  if (type === "select" && options && options.length > 0) {
    return (
      <select
        autoFocus
        className="cl-cell-select"
        value={val}
        onChange={(e) => { setVal(e.target.value); onSave(e.target.value); }}
        onBlur={() => onCancel()}
        onKeyDown={(e) => {
          if (e.key === "Escape") { e.stopPropagation(); onCancel(); }
        }}
      >
        <option value="" disabled>Select...</option>
        {options.map((o) => <option key={o} value={o}>{optionLabels?.[o] ?? o}</option>)}
      </select>
    );
  }

  return (
    <div className="cl-cell-edit-wrap">
      <input
        autoFocus
        className="cl-cell-input"
        type={type === "number" ? "number" : type === "date" ? "date" : "text"}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") { e.stopPropagation(); onCancel(); }
          if (e.key === "Enter")  { e.stopPropagation(); onSave(val); }
        }}
      />
      <div className="cl-cell-actions" style={{ paddingLeft: "0.25rem", paddingRight: "0.25rem" }}>
        <button className="cl-cell-confirm-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => onSave(val)} title="Save (Enter)">
          <CheckIcon className="w-3 h-3" />
        </button>
        <button className="cl-cell-cancel-btn" onMouseDown={(e) => e.preventDefault()} onClick={onCancel} title="Cancel (Esc)">
          <XMarkIcon className="w-3 h-3" />
        </button>
        {onDelete && (
          <>
            <div style={{ width: "1px", height: "0.75rem", background: "var(--cl-border-2)", margin: "0 0.125rem" }} />
            <button className="cl-delete-btn" onMouseDown={(e) => e.preventDefault()} onClick={onDelete} title="Clear field value" aria-label="Clear field value">
              <TrashIconBtn size={11} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Default cell renderer ──────────────────────────────────────────────────

function renderCellValue(
  col: OdsColDef,
  record: OdsRecord,
  helpers: CellHelpers,
): React.ReactNode {
  const val = record[col.key];

  // If column has custom render, use it with error boundary
  if (col.render) {
    try {
      return col.render(val, record, helpers);
    } catch (err) {
      console.error(`[OdsList] Render error in column "${col.key}":`, err);
      return <span style={{ color: "var(--cl-red)", fontSize: "0.625rem" }}>Render error</span>;
    }
  }

  // Default renderers by type
  if (col.meta && col.key.includes("At")) {
    // Timestamp rendering
    const ts = val as { seconds: number } | null;
    if (!ts?.seconds) return <span style={{ color: "var(--cl-text-5)" }}>—</span>;
    const d = new Date(ts.seconds * 1000);
    return <span style={{ color: "var(--cl-text-5)" }}>{d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>;
  }

  if (col.filterType === "number") {
    const num = typeof val === "number" ? val : parseFloat(String(val ?? "0")) || 0;
    return <span style={{ color: "var(--cl-text-2)" }}>{num.toLocaleString("en-US")}</span>;
  }

  if (col.filterType === "date") {
    const str = String(val ?? "");
    if (!str) return <span style={{ color: "var(--cl-text-5)" }}>—</span>;
    const d = new Date(str + "T00:00:00");
    return <span style={{ color: "var(--cl-text-3)" }}>{d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>;
  }

  // Default: text
  const str = String(val ?? "");
  return <span style={{ color: "var(--cl-text-2)" }}>{str || "—"}</span>;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Format a field value for display in the mail detail sheet. */
function formatFieldValue(val: unknown): string {
  if (val == null) return "—";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (typeof val === "number") return val.toLocaleString();
  if (typeof val === "object" && "seconds" in (val as Record<string, unknown>)) {
    return new Date((val as { seconds: number }).seconds * 1000)
      .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  }
  if (Array.isArray(val)) return val.map(String).join(", ");
  return String(val);
}

// ─── Main component ─────────────────────────────────────────────────────────

/** Keys that are internal identifiers and should never be shown as columns. */
const HIDDEN_KEYS = new Set(["id", "displayLabel", "uid"]);

const DEFAULT_PAGE_SIZE = 30;

export function OdsList({
  columns,
  data,
  clients: clientsLegacy,
  loading = false,
  listTitle = "Clients",
  labelField,
  displayMode: displayModeProp,
  defaultVisibleCols,
  expandable = false,
  initialSortField = null,
  initialSortDir = "desc",
  collapsedFields: collapsedFieldsProp,
  expandedSections: expandedSectionsProp,
  onExpandRow,
  renderExpandedContent,
  groupBy,
  uid,
  userName = "",
  currentRole = "owner",
  isAdmin = false,
  isManager = false,
  userTeamNumber,
  permissions,
  onSavePermissions,
  userPrefs,
  onSaveUserPrefs,
  onUnreadCount,
  schema,
  onSaveSchema,
  onSave,
  onRowClick,
  onDeleteRecord,
  onDeleteField,
  onAddColumn,
  onEditRecord,
  views: viewsProp = [],
  onSaveView,
  onDeleteView,
  onRenameList,
  showActions = false,
  hasMore = false,
  onLoadMore,
  phase = "live",
  historicalCutoff = "2026-01-01",
}: OdsListProps) {

  // Resolve data: prefer `data` prop, fall back to `clients` (legacy)
  const clientsProp = data ?? clientsLegacy ?? [];

  // ── Label helper ──────────────────────────────────────────────────────────
  const getLabel = useCallback((record: OdsRecord) => {
    if (labelField && record[labelField]) return String(record[labelField]);
    if (record.displayLabel) return String(record.displayLabel);
    return String(record.clientName ?? record.id ?? "\u2014");
  }, [labelField]);

  // ── Schema merge ─────────────────────────────────────────────────────────
  const resolvedColumns = useMemo(() => {
    if (!schema) return columns;

    // Start with code-defined columns
    let merged = columns.map(col => {
      const override = schema.columns?.find(o => o.key === col.key);
      if (!override) return col;
      const mergedEnumValues = (override.enumValues && override.enumValues.length > 0) ? override.enumValues : col.enumValues;
      return {
        ...col,
        label: override.label ?? col.label,
        sortable: override.sortable ?? col.sortable,
        editable: override.editable ?? col.editable,
        // If the code passes enumValues, force filterType to "enum" regardless of saved schema
        filterType: (col.enumValues && col.enumValues.length > 0) ? "enum" : (override.filterType ?? col.filterType),
        enumValues: mergedEnumValues,
        adminOnly: override.adminOnly ?? col.adminOnly,
        enumLabels: col.enumLabels,  // always keep code-defined labels
      };
    });

    // Add schema-defined columns that aren't in code (discovered fields made visible)
    const mergedKeys = new Set(merged.map(c => c.key));
    if (schema.columns) {
      for (const override of schema.columns) {
        if (mergedKeys.has(override.key) || HIDDEN_KEYS.has(override.key)) continue;
        if (override.hidden) continue;
        // This is a discovered field the dev made visible — add it as a column
        merged.push({
          key: override.key,
          label: override.label ?? override.key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase()).trim(),
          sortable: override.sortable,
          editable: override.editable,
          filterType: override.filterType as OdsColDef["filterType"],
          enumValues: (override.enumValues && override.enumValues.length > 0) ? override.enumValues : undefined,
          adminOnly: override.adminOnly,
        });
      }
    }

    // Filter out hidden columns and internal keys
    merged = merged.filter(col => {
      if (HIDDEN_KEYS.has(col.key)) return false;
      const override = schema.columns?.find(o => o.key === col.key);
      return !override?.hidden;
    });

    // Apply ordering if specified
    if (schema.columns?.some(o => o.order != null)) {
      const orderMap = new Map(schema.columns.filter(o => o.order != null).map(o => [o.key, o.order!]));
      merged.sort((a, b) => (orderMap.get(a.key) ?? 999) - (orderMap.get(b.key) ?? 999));
    }

    // Add dev-created columns
    if (schema.addedColumns?.length) {
      merged.push(...schema.addedColumns);
    }

    return merged;
  }, [columns, schema]);

  const effectiveSortField = schema?.defaultSortField ?? initialSortField;
  const effectiveSortDir = schema?.defaultSortDir ?? initialSortDir;
  const effectiveVisibleCols = schema?.defaultVisibleCols ?? defaultVisibleCols;

  // ── Display mode ────────────────────────────────────────────────────────
  const resolvedDisplayMode = schema?.displayMode ?? displayModeProp ?? "table";
  const resolvedCollapsedFields = schema?.collapsedFields ?? collapsedFieldsProp ?? [];
  const resolvedExpandedSections = schema?.expandedSections ?? expandedSectionsProp ?? [];

  // ── Style preferences ──────────────────────────────────────────────────
  const schemaStyle = schema?.style;
  const cardBg = schemaStyle?.bgColor || "var(--cl-surface)";
  const shadowColor = schemaStyle?.shadowColor || "rgba(0,0,0,0.12)";
  const shadowOx = schemaStyle?.shadowOffsetX ?? 0;
  const shadowOy = schemaStyle?.shadowOffsetY ?? 1;
  const shadowBlur = schemaStyle?.shadowBlur ?? 3;
  const cardShadow = `${shadowOx}px ${shadowOy}px ${shadowBlur}px ${shadowColor}`;

  // Style save — updates schema in place
  function updateStyle(patch: Partial<NonNullable<OdsListSchema["style"]>>) {
    if (!onSaveSchema) return;
    const next: OdsListSchema = { ...(schema ?? {}), style: { ...(schema?.style ?? {}), ...patch } };
    onSaveSchema(next);
  }

  // ── Schema-driven groupBy ───────────────────────────────────────────────
  const resolvedGroupBy = useMemo(() => {
    // Schema groupByField takes priority, then prop
    const field = schema?.groupByField;
    if (!field) return groupBy ?? undefined;
    // Auto-generate groups from distinct values of that field
    const vals = new Set<string>();
    clientsProp.forEach(c => { const v = String(c[field] ?? ""); if (v) vals.add(v); });
    const sorted = Array.from(vals).sort((a, b) => {
      const na = Number(a), nb = Number(b);
      return !isNaN(na) && !isNaN(nb) ? na - nb : a.localeCompare(b);
    });
    const colors = ["#3b82f6", "#22c55e", "#a855f7", "#f59e0b", "#ef4444", "#6366f1", "#ec4899", "#14b8a6", "#f97316", "#6b7280"];
    return {
      fn: (r: OdsRecord) => String(r[field] ?? "_none"),
      groups: [
        ...sorted.map((v, i) => ({ key: v, label: v.toUpperCase(), color: colors[i % colors.length] })),
        { key: "_none", label: "UNGROUPED", color: "#6b7280" },
      ],
    };
  }, [schema?.groupByField, groupBy, clientsProp]);

  // ── Expandable mode state ───────────────────────────────────────────────
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());
  function toggleExpandRow(record: OdsRecord) {
    setExpandedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(record.id)) {
        next.delete(record.id);
      } else {
        next.add(record.id);
        onExpandRow?.(record);
      }
      return next;
    });
  }

  // ── Derived column order ────────────────────────────────────────────────
  const DEFAULT_COL_ORDER = useMemo(() => resolvedColumns.map((c) => c.key), [resolvedColumns]);

  const defaultCols = useMemo(
    () => effectiveVisibleCols ?? resolvedColumns.map(c => c.key),
    [effectiveVisibleCols, resolvedColumns],
  );

  const INTERNAL_DEFAULT_VIEW: OdsListView = useMemo(() => ({
    id: "default",
    name: "Default",
    colOrder: defaultCols,
    visibleCols: defaultCols,
    sorts: effectiveSortField ? [{ field: effectiveSortField, dir: effectiveSortDir }] : [],
    filterRows: [],
    builtIn: true,
  }), [defaultCols, effectiveSortField, effectiveSortDir]);

  // ── Build default permissions from columns prop ─────────────────────────
  const columnsDefaultPerms = useMemo(() => buildDefaultPermissions(resolvedColumns), [resolvedColumns]);

  // ── Local client state (optimistic updates) ──────────────────────────────
  const [clients, setClients] = useState<OdsRecord[]>(clientsProp);
  useEffect(() => { setClients(clientsProp); }, [clientsProp]);

  // ── Sort (multi-sort) ────────────────────────────────────────────────────
  const [sorts, setSorts] = useState<SortEntry[]>(() => {
    if (effectiveSortField) return [{ field: effectiveSortField, dir: effectiveSortDir }];
    return [];
  });

  // ── Filters ──────────────────────────────────────────────────────────────
  const [filterRows,        setFilterRows]        = useState<FilterRow[]>([]);
  const [showFilterBuilder, setShowFilterBuilder] = useState(false);
  const [showAddFilterMenu, setShowAddFilterMenu] = useState(false);
  const filters = useMemo(() => filterRowsToSpecs(filterRows, resolvedColumns), [filterRows, resolvedColumns]);

  // ── Pill quick-filters ───────────────────────────────────────────────────
  const [searchText,     setSearchText]     = useState("");
  const [showHistorical, setShowHistorical] = useState(false);

  // ── Column reorder ───────────────────────────────────────────────────────
  const [colOrder,    setColOrder]    = useState<string[]>(() => INTERNAL_DEFAULT_VIEW.colOrder ?? DEFAULT_COL_ORDER);
  const [colVisible,  setColVisible]  = useState<string[] | null>(() => INTERNAL_DEFAULT_VIEW.visibleCols ?? null);
  const [dragCol,     setDragCol]     = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  // ── Views ────────────────────────────────────────────────────────────────
  const [activeViewId, setActiveViewId] = useState("default");
  const [showSaveView, setShowSaveView] = useState(false);
  const [newViewName,  setNewViewName]  = useState("");
  const [savingView,   setSavingView]   = useState(false);
  const allViews = useMemo(() => {
    // If any user view is marked isDefault, use it instead of the internal default
    const userDefault = viewsProp.find(v => v.isDefault);
    const otherViews = viewsProp.filter(v => !v.isDefault);
    if (userDefault) return [userDefault, ...otherViews];
    return [INTERNAL_DEFAULT_VIEW, ...viewsProp];
  }, [INTERNAL_DEFAULT_VIEW, viewsProp]);

  // ── Rename ───────────────────────────────────────────────────────────────
  const [localTitle,  setLocalTitle]  = useState(listTitle);
  const [isRenaming,  setIsRenaming]  = useState(false);
  const [renameValue, setRenameValue] = useState(listTitle);
  useEffect(() => { setLocalTitle(listTitle); setRenameValue(listTitle); }, [listTitle]);

  // ── Inline editing ───────────────────────────────────────────────────────
  const [editCell, setEditCell] = useState<{ id: string; field: string; value: string } | null>(null);
  const [saving,   setSaving]   = useState<Record<string, string>>({});

  // ── Confirmation dialog ─────────────────────────────────────────────────
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // ── Multiline note dialog ────────────────────────────────────────────────
  const [noteDialog, setNoteDialog] = useState<{
    id: string; field: string; label: string; value: string; editable: boolean;
  } | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  // ── Info popover ─────────────────────────────────────────────────────────
  const [infoPopover, setInfoPopover] = useState<{ clientId: string; col: string } | null>(null);
  const infoPopoverRef = useRef<HTMLDivElement>(null);

  // ── Table scroll ref + custom horizontal scrollbar ───────────────────────
  const tableScrollRef  = useRef<HTMLDivElement>(null);
  const hScrollTrackRef = useRef<HTMLDivElement>(null);
  const hDragData       = useRef({ startX: 0, startScrollLeft: 0 });
  const [hThumb, setHThumb] = useState({ left: 0, width: 0, show: false });

  // ── Pagination ───────────────────────────────────────────────────────────
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(() => schema?.pageSize ?? DEFAULT_PAGE_SIZE);

  // ── Busy (claim/unclaim) ─────────────────────────────────────────────────
  const [busy, setBusy] = useState<Set<string>>(new Set());


  //MARK: Permissions
  const [showPermissions,  setShowPermissions]  = useState(false);
  const [showA11y, setShowA11y] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [mailDetailRecord, setMailDetailRecord] = useState<OdsRecord | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // ── Accessibility persistence ───────────────────────────────────────────
  const a11yKey = `odsList-a11y-${listTitle ?? "default"}`;
  const [listFontSize, setListFontSize] = useState<"sm" | "base" | "lg" | "xl">(() => {
    // Prefer Firestore-backed userPrefs, then localStorage fallback
    if (userPrefs?.fontSize) return userPrefs.fontSize as "sm" | "base" | "lg" | "xl";
    if (typeof window === "undefined") return "base";
    return (localStorage.getItem(a11yKey) as "sm" | "base" | "lg" | "xl") || "base";
  });
  // Sync when userPrefs prop changes (e.g. after Firestore load)
  useEffect(() => {
    if (userPrefs?.fontSize) setListFontSize(userPrefs.fontSize as "sm" | "base" | "lg" | "xl");
  }, [userPrefs?.fontSize]);
  const a11yRef = useRef<HTMLDivElement>(null);

  const [draftPermissions, setDraftPermissions] = useState<PermissionsMatrix>(
    () => permissions ?? columnsDefaultPerms,
  );
  const [savingPerms, setSavingPerms] = useState(false);

  // resolvedPermissions is the live permissions driving the view.
  // It starts from the prop but updates immediately on local save —
  // the view reflects changes without waiting for the parent to pass back a new prop.
  const [resolvedPermissions, setResolvedPermissions] = useState<PermissionsMatrix>(
    () => permissions ?? columnsDefaultPerms,
  );
  // Sync if the parent pushes a new value (e.g. fresh from Firestore on load).
  // Merge with columnsDefaultPerms so new columns not yet in saved data are visible by default.
  useEffect(() => {
    const base = permissions ?? columnsDefaultPerms;
    const merged: PermissionsMatrix = { rep: {}, manager: {}, admin: {} };
    (["rep", "manager", "admin"] as const).forEach((role) => {
      merged[role] = { ...columnsDefaultPerms[role], ...base[role] };
    });
    setResolvedPermissions(merged);
  }, [permissions, columnsDefaultPerms]);

  // ── Schema Editor state ──────────────────────────────────────────────────
  const [showSchemaEditor, setShowSchemaEditor] = useState(false);
  const [draftSchema, setDraftSchema] = useState<OdsListSchema>({});
  const [schemaEnumEditor, setSchemaEnumEditor] = useState<{ key: string; values: string[] } | null>(null);
  const [schemaNewCol, setSchemaNewCol] = useState({ key: "", label: "", filterType: "text" as string, sortable: true, editable: false, adminOnly: false });
  const [schemaSaving, setSchemaSaving] = useState(false);
  const schemaColDragRef = useRef<string | null>(null);

  function openSchemaEditor() {
    setDraftSchema(schema ? JSON.parse(JSON.stringify(schema)) : {
      columns: resolvedColumns.map((c, i) => ({
        key: c.key, label: c.label, sortable: !!c.sortable, editable: !!c.editable,
        filterType: c.filterType || "text", enumValues: c.enumValues || [], adminOnly: !!c.adminOnly,
        hidden: false, order: i,
      })),
      defaultVisibleCols: effectiveVisibleCols ?? resolvedColumns.map(c => c.key),
      defaultSortField: effectiveSortField || "",
      defaultSortDir: effectiveSortDir || "desc",
      displayMode: resolvedDisplayMode,
      collapsedFields: resolvedCollapsedFields.length ? [...resolvedCollapsedFields] : [],
      expandedSections: resolvedExpandedSections.length ? JSON.parse(JSON.stringify(resolvedExpandedSections)) : [],
      groupByField: "",
    });
    setSchemaEnumEditor(null);
    setSchemaNewCol({ key: "", label: "", filterType: "text", sortable: true, editable: false, adminOnly: false });
    setShowSchemaEditor(true);
  }

  const [schemaError, setSchemaError] = useState("");

  /** Recursively strip undefined values so Firestore doesn't reject the write. */
  function stripUndefined<T>(obj: T): T {
    if (obj === null || obj === undefined || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map(stripUndefined) as unknown as T;
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (v === undefined) continue;
      // Strip empty enumValues so code-defined values aren't overridden
      if (k === "enumValues" && Array.isArray(v) && v.length === 0) continue;
      clean[k] = stripUndefined(v);
    }
    return clean as T;
  }

  async function saveSchema() {
    if (!onSaveSchema || schemaSaving) return;
    setSchemaSaving(true);
    setSchemaError("");
    try {
      await onSaveSchema(stripUndefined(draftSchema));
      setShowSchemaEditor(false);
    } catch (err) {
      console.error("[OdsList] Schema save failed:", err);
      setSchemaError(err instanceof Error ? err.message : "Failed to save. Check permissions.");
    } finally {
      setSchemaSaving(false);
    }
  }

  const isPrivileged = currentRole === "owner" || currentRole === "dev" || currentRole === "admin";

  function canView(colKey: string): boolean {
    if (isPrivileged) return true;
    const role = currentRole as "rep" | "manager" | "admin";
    return resolvedPermissions[role]?.[colKey]?.view
      ?? columnsDefaultPerms[role]?.[colKey]?.view
      ?? false;
  }

  const viewOnly = !!schemaStyle?.viewOnly;

  function canEdit(colKey: string): boolean {
    if (viewOnly) return false;
    if (isPrivileged) return true;
    const role = currentRole as "rep" | "manager" | "admin";
    return resolvedPermissions[role]?.[colKey]?.edit
      ?? columnsDefaultPerms[role]?.[colKey]?.edit
      ?? false;
  }

  function canDelete(colKey: string): boolean {
    if (viewOnly) return false;
    if (isPrivileged) return true;
    const role = currentRole as "rep" | "manager" | "admin";
    return resolvedPermissions[role]?.[colKey]?.delete
      ?? columnsDefaultPerms[role]?.[colKey]?.delete
      ?? false;
  }

  function openPermissionsEditor() {
    // deep-copy so edits don't mutate the live permissions
    setDraftPermissions(JSON.parse(JSON.stringify(resolvedPermissions)));
    setShowPermissions(true);
  }

  async function savePermissions() {
    if (savingPerms) return;
    // Apply immediately so the list reflects changes without a prop round-trip.
    setResolvedPermissions(draftPermissions);
    setShowPermissions(false);
    if (!onSavePermissions) return;
    setSavingPerms(true);
    try {
      await onSavePermissions(draftPermissions);
    } finally {
      setSavingPerms(false);
    }
  }

  function toggleDraftPerm(
    role: "rep" | "manager" | "admin",
    colKey: string,
    type: "view" | "create" | "edit" | "delete",
  ) {
    setDraftPermissions((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as PermissionsMatrix;
      if (!next[role][colKey]) next[role][colKey] = { view: true, create: true, edit: true, delete: true };
      next[role][colKey][type] = !next[role][colKey][type];
      // Can't do anything if you can't view
      if (type === "view" && !next[role][colKey].view) {
        next[role][colKey].create = false;
        next[role][colKey].edit = false;
        next[role][colKey].delete = false;
      }
      // If any write permission is enabled, view must also be enabled
      if ((type === "create" || type === "edit" || type === "delete") && next[role][colKey][type]) {
        next[role][colKey].view = true;
      }
      return next;
    });
  }

  // ── Derived visible columns ──────────────────────────────────────────────
  const showSubmittedBy = isAdmin || isManager;
  const visibleColDefs = useMemo(() => {
    // If schema defines column order, use resolvedColumns (already sorted by schema).
    // Otherwise use local colOrder (drag-reorder state).
    const hasSchemaOrder = schema?.columns?.some(o => o.order != null);
    const baseOrder = hasSchemaOrder
      ? resolvedColumns.map(c => c.key)
      : [...colOrder, ...DEFAULT_COL_ORDER.filter((k) => !colOrder.includes(k))];
    return baseOrder
      .map((key) => resolvedColumns.find((c) => c.key === key))
      .filter((c): c is OdsColDef => !!c)
      .filter((c) => !c.adminOnly || showSubmittedBy)
      .filter((c) => canView(c.key));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colOrder, colVisible, showSubmittedBy, phase, currentRole, resolvedPermissions, resolvedColumns, DEFAULT_COL_ORDER, schema]);

  // ── Distinct values for enum filters ────────────────────────────────────
  const distinctValues = useMemo(() => {
    const map: Record<string, string[]> = {};
    // Pre-populate from resolvedColumns that have enumValues defined
    for (const col of resolvedColumns) {
      if (col.enumValues) {
        map[col.key] = col.enumValues;
      }
    }
    // For enum columns without enumValues, derive from data
    for (const col of resolvedColumns) {
      if (col.filterType === "enum" && !col.enumValues) {
        const vals = new Set<string>();
        clients.forEach((c) => { const v = String(c[col.key] ?? ""); if (v) vals.add(v); });
        map[col.key] = Array.from(vals).sort((a, b) => {
          const na = Number(a), nb = Number(b);
          return !isNaN(na) && !isNaN(nb) ? na - nb : a.localeCompare(b);
        });
      }
    }
    return map;
  }, [clients, resolvedColumns]);

  // ── Outside-click: action menu ──────────────────────────────────────────
  useEffect(() => {
    if (!showActionMenu) return;
    const h = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) setShowActionMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showActionMenu]);

  // ── Sync mail detail sheet with fresh data ─────────────────────────────
  useEffect(() => {
    if (mailDetailRecord) {
      const fresh = clients.find(c => c.id === mailDetailRecord.id);
      if (fresh && fresh !== mailDetailRecord) setMailDetailRecord(fresh);
    }
  }, [clients, mailDetailRecord]);

  // ── Outside-click: info popover ──────────────────────────────────────────
  useEffect(() => {
    if (!infoPopover) return;
    const h = (e: MouseEvent) => {
      if (infoPopoverRef.current && !infoPopoverRef.current.contains(e.target as Node)) {
        setInfoPopover(null);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [infoPopover]);


  // ── Apply filters + sort ─────────────────────────────────────────────────
  const displayedClients = useMemo(() => {
    let result = [...clients];

    // Data scope — filter by role
    const ds = schema?.dataScope;
    if (ds) {
      const roleKey = currentRole === "dev" || currentRole === "owner" ? "admin" : currentRole;
      const scope = ds[roleKey as "rep" | "manager" | "admin"] ?? (roleKey === "rep" ? "own" : roleKey === "manager" ? "team" : "all");
      if (scope === "own" && ds.ownerField && uid) {
        result = result.filter(r => String(r[ds.ownerField!] ?? "") === uid);
      } else if (scope === "team" && ds.teamField && userTeamNumber !== undefined) {
        result = result.filter(r => Number(r[ds.teamField!] ?? 0) === userTeamNumber);
      }
      // "all" = no filter
    }

    // Historical
    if (!showHistorical) {
      result = result.filter((c) => c.historical !== true && (!c.date || c.date >= historicalCutoff));
    }

    // Text search
    const q = searchText.trim().toLowerCase();
    if (q) {
      result = result.filter((c) => {
        // Search across all column values
        const searchable = resolvedColumns.map(col => {
          const val = c[col.key];
          if (val == null) return "";
          return String(val);
        }).join(" ").toLowerCase();
        return searchable.includes(q);
      });
    }

    // Column filters
    for (const [field, spec] of Object.entries(filters)) {
      if (spec.kind === "empty") {
        result = result.filter((c) => {
          const v = c[field];
          return v == null || v === "";
        });
      } else if (spec.kind === "not-empty") {
        result = result.filter((c) => {
          const v = c[field];
          return v != null && v !== "";
        });
      } else if (spec.kind === "enum") {
        if (!spec.values.length) continue;
        result = result.filter((c) => spec.values.includes(String(c[field] ?? "")));
      } else if (spec.kind === "enum-exclude") {
        if (!spec.values.length) continue;
        result = result.filter((c) => !spec.values.includes(String(c[field] ?? "")));
      } else if (spec.kind === "text") {
        if (!spec.q) continue;
        const sq = spec.q.toLowerCase();
        result = result.filter((c) => String(c[field] ?? "").toLowerCase().includes(sq));
      } else if (spec.kind === "text-startswith") {
        if (!spec.q) continue;
        const sq = spec.q.toLowerCase();
        result = result.filter((c) => String(c[field] ?? "").toLowerCase().startsWith(sq));
      } else if (spec.kind === "range") {
        const { min, max } = spec;
        const col = resolvedColumns.find(c => c.key === field);
        const isDate = col?.filterType === "date" || col?.meta;
        const getStr = (v: unknown) => {
          if (isDate && v && typeof v === "object" && "seconds" in v)
            return new Date((v as { seconds: number }).seconds * 1000).toISOString().slice(0, 10);
          return String(v ?? "");
        };
        if (min) result = result.filter((c) => {
          const v = c[field];
          return isDate ? getStr(v) >= min : (typeof v === "number" ? v : parseFloat(String(v)) || 0) >= parseFloat(min);
        });
        if (max) result = result.filter((c) => {
          const v = c[field];
          return isDate ? getStr(v) <= max : (typeof v === "number" ? v : parseFloat(String(v)) || 0) <= parseFloat(max);
        });
      }
    }

    // Multi-sort
    if (sorts.length > 0) {
      result.sort((a, b) => {
        for (const { field, dir } of sorts) {
          const av = a[field] ?? "", bv = b[field] ?? "";
          let cmp = 0;
          if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
          else if (av && bv && typeof av === "object" && "seconds" in av && typeof bv === "object" && "seconds" in bv)
            cmp = (av as { seconds: number }).seconds - (bv as { seconds: number }).seconds;
          else cmp = String(av).localeCompare(String(bv));
          if (cmp !== 0) return dir === "asc" ? cmp : -cmp;
        }
        return 0;
      });
    }

    return result;
  }, [clients, showHistorical, historicalCutoff, searchText, filters, sorts, resolvedColumns, resolvedGroupBy]);

  // Reset to page 0 whenever filters/sort change
  useEffect(() => { setPage(0); }, [searchText, filterRows, sorts, showHistorical]);

  // ── Unread count (for badge callbacks) ───────────────────────────────────
  const unreadCount = useMemo(() => {
    return clients.filter(r => r.read !== true && r.read !== "true").length;
  }, [clients]);

  useEffect(() => {
    onUnreadCount?.(unreadCount);
  }, [unreadCount, onUnreadCount]);

  const effectivePageSize = pageSize === 0 ? displayedClients.length || 1 : pageSize;
  const totalPages   = Math.max(1, Math.ceil(displayedClients.length / effectivePageSize));
  const pagedClients = pageSize === 0 ? displayedClients : displayedClients.slice(page * effectivePageSize, (page + 1) * effectivePageSize);

  // ── Generic groupBy ─────────────────────────────────────────────────────
  const groupedRows = useMemo(() => {
    if (!resolvedGroupBy) return [{ key: "_all", label: "", color: "", rows: pagedClients }];
    const buckets: Record<string, OdsRecord[]> = {};
    for (const group of resolvedGroupBy.groups) buckets[group.key] = [];
    for (const record of pagedClients) {
      const key = resolvedGroupBy.fn(record);
      if (buckets[key]) buckets[key].push(record);
      else {
        if (!buckets["_other"]) buckets["_other"] = [];
        buckets["_other"].push(record);
      }
    }
    return resolvedGroupBy.groups
      .filter(g => (buckets[g.key]?.length ?? 0) > 0)
      .map(g => ({ ...g, rows: buckets[g.key] }));
  }, [pagedClients, resolvedGroupBy]);

  const showActionsCol = !viewOnly && ((showActions && resolvedGroupBy) || !!onDeleteRecord || !!onEditRecord);
  const totalColSpan = visibleColDefs.length + (expandable && onRowClick ? 1 : 0) + (showActionsCol ? 1 : 0);

  // ── Column reorder ───────────────────────────────────────────────────────
  function reorderCol(from: string, to: string) {
    if (from === to) return;
    setColOrder((prev) => {
      const o = [...prev];
      const fi = o.indexOf(from), ti = o.indexOf(to);
      if (fi === -1 || ti === -1) return prev;
      o.splice(fi, 1); o.splice(ti, 0, from);
      return o;
    });
  }

  // ── Views ────────────────────────────────────────────────────────────────
  function applyView(view: OdsListView) {
    if (view.colOrder) setColOrder(view.colOrder);
    setColVisible(view.visibleCols ?? null);
    // Backward compat: convert legacy sortField/sortDir to sorts array
    if (view.sorts) {
      setSorts(view.sorts);
    } else if (view.sortField) {
      setSorts([{ field: view.sortField, dir: view.sortDir ?? "desc" }]);
    } else {
      setSorts([]);
    }
    setFilterRows(view.filterRows ?? []);
    setActiveViewId(view.id);
    setShowFilterBuilder(false);
    if (view.pageSize !== undefined) { setPageSize(view.pageSize); setPage(0); }
    // Apply view style if present — merge into schema
    if (view.style && onSaveSchema) {
      onSaveSchema({ ...(schema ?? {}), style: view.style });
    }
  }

  async function handleSaveView() {
    if (!newViewName.trim() || !onSaveView || savingView) return;
    setSavingView(true);
    try {
      const id = await onSaveView({
        name: newViewName.trim(),
        colOrder: [...colOrder],
        visibleCols: colVisible ?? undefined,
        sorts: [...sorts],
        filterRows: [...filterRows],
        style: schemaStyle ?? undefined,
        pageSize,
      });
      setActiveViewId(id);
      setNewViewName("");
      setShowSaveView(false);
    } finally {
      setSavingView(false);
    }
  }

  async function handleDeleteView(id: string) {
    await onDeleteView?.(id);
    if (activeViewId === id) applyView(INTERNAL_DEFAULT_VIEW);
  }

  // ── Rename ────────────────────────────────────────────────────────────────
  async function confirmRename() {
    const name = renameValue.trim();
    if (!name) { setIsRenaming(false); setRenameValue(localTitle); return; }
    setLocalTitle(name);
    setIsRenaming(false);
    await onRenameList?.(name);
  }

  // ── Filter builder row management ────────────────────────────────────────
  function addFilterRow() {
    const id = `r-${Date.now()}`;
    setFilterRows((prev) => [...prev, { id, field: "", operator: "contains", value: "", value2: "" }]);
  }

  function removeFilterRow(id: string) {
    setFilterRows((prev) => prev.filter((r) => r.id !== id));
  }

  function updateFilterRow(id: string, patch: Partial<FilterRow>) {
    setFilterRows((prev) => prev.map((r) => {
      if (r.id !== id) return r;
      const next = { ...r, ...patch };
      // Reset operator when field type changes
      if (patch.field && patch.field !== r.field) {
        const col = resolvedColumns.find((c) => c.key === patch.field);
        const ops = getOperators(col?.filterType);
        next.operator = ops[0];
        next.value = "";
        next.value2 = "";
      }
      return next;
    }));
  }

  // ── Sort (multi-sort: click = single sort, shift+click = add/toggle) ────
  function handleSort(field: string, shiftKey: boolean) {
    setSorts(prev => {
      const existing = prev.findIndex(s => s.field === field);
      if (shiftKey) {
        // Add or toggle in the multi-sort chain
        if (existing >= 0) {
          const next = [...prev];
          if (next[existing].dir === "asc") next[existing] = { field, dir: "desc" };
          else next.splice(existing, 1); // remove if already desc
          return next;
        }
        return [...prev, { field, dir: "asc" }];
      } else {
        // Single sort — replace all
        if (existing >= 0 && prev.length === 1) {
          if (prev[0].dir === "asc") return [{ field, dir: "desc" }];
          return []; // remove sort
        }
        return [{ field, dir: "asc" }];
      }
    });
  }

  // ── Inline editing ───────────────────────────────────────────────────────
  function startEdit(id: string, field: string, value: string) {
    if (!canEdit(field)) return;
    setEditCell({ id, field, value });
  }
  function cancelEdit() { setEditCell(null); }

  async function confirmEdit(newValue: string) {
    if (!editCell) return;
    const { id, field, value: orig } = editCell;
    setEditCell(null);
    if (newValue === orig) return;
    // Determine if this field should be stored as number
    const col = resolvedColumns.find(c => c.key === field);
    const saveVal: string | number =
      (col?.filterType === "number")
        ? (parseFloat(newValue) || 0)
        : newValue;

    const changeEntry: ChangeRecord = {
      at: { seconds: Math.floor(Date.now() / 1000) },
      by: userName,
      field,
      from: String(orig),
      to: String(saveVal),
    };

    // Optimistic update (includes changeLog append)
    setClients((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      return {
        ...c,
        [field]: saveVal,
        updatedByName: userName,
        updatedAt: changeEntry.at,
        changeLog: [...(c.changeLog ?? []), changeEntry],
      };
    }));

    setSaving((prev) => ({ ...prev, [id]: field }));
    try {
      await onSave?.(id, field, saveVal, userName, orig as string | number);
    } catch {
      // Revert on failure
      setClients(clientsProp);
    } finally {
      setSaving((prev) => { const n = { ...prev }; delete n[id]; return n; });
    }
  }

  // ── Delete record ───────────────────────────────────────────────────────
  function requestDeleteRecord(record: OdsRecord) {
    if (!onDeleteRecord) return;
    setConfirmDialog({
      title: "Delete Record",
      message: `Are you sure you want to delete ${getLabel(record)}? This cannot be undone.`,
      onConfirm: async () => {
        await onDeleteRecord(record.id);
        setClients((prev) => prev.filter((c) => c.id !== record.id));
      },
    });
  }

  // ── Mail row click — open detail sheet + mark as read ──────────────────
  function handleMailRowClick(record: OdsRecord) {
    setMailDetailRecord(record);
    // Don't call onRowClick — the built-in sheet handles the detail view
    // Mark as read if unread
    const isUnread = record.read !== true;
    if (isUnread && onSave) {
      // Optimistic local update
      setClients(prev => prev.map(c => c.id === record.id ? { ...c, read: true } : c));
      // Persist to Firestore
      onSave(record.id, "read", "true", userName).catch(() => {});
    }
  }

  // ── Delete field value ──────────────────────────────────────────────────
  function requestDeleteField(recordId: string, field: string) {
    const record = clients.find((c) => c.id === recordId);
    const col = resolvedColumns.find((c) => c.key === field);
    const clientLabel = record ? getLabel(record) : "this record";
    const fieldLabel = col?.label || field;
    setConfirmDialog({
      title: "Clear Field",
      message: `Are you sure you want to clear ${fieldLabel} for ${clientLabel}?`,
      onConfirm: async () => {
        if (onDeleteField) {
          await onDeleteField(recordId, field);
        } else if (onSave) {
          await onSave(recordId, field, "", userName);
        }
        // Optimistic update: clear the field locally
        setClients((prev) => prev.map((c) => {
          if (c.id !== recordId) return c;
          return { ...c, [field]: "" };
        }));
        setEditCell(null);
      },
    });
  }



  // ── Custom horizontal scrollbar ──────────────────────────────────────────
  const syncHThumb = useCallback(() => {
    const el = tableScrollRef.current;
    if (!el) return;
    const hasScroll = el.scrollWidth > el.clientWidth + 1;
    if (!hasScroll) { setHThumb((p) => p.show ? { left: 0, width: 0, show: false } : p); return; }
    const ratio    = el.clientWidth / el.scrollWidth;
    const thumbW   = Math.max(40, ratio * el.clientWidth);
    const maxLeft  = el.clientWidth - thumbW;
    const scrollR  = el.scrollLeft / (el.scrollWidth - el.clientWidth);
    setHThumb({ left: scrollR * maxLeft, width: thumbW, show: true });
  }, []);

  useEffect(() => {
    const el = tableScrollRef.current;
    if (!el) return;
    syncHThumb();
    const ro = new ResizeObserver(syncHThumb);
    ro.observe(el);
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncHThumb, displayedClients.length]);

  const onThumbMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const el = tableScrollRef.current;
    if (!el) return;
    hDragData.current = { startX: e.clientX, startScrollLeft: el.scrollLeft };
    const onMove = (mv: MouseEvent) => {
      const scrollRange = el.scrollWidth - el.clientWidth;
      const trackW      = el.clientWidth;
      const thumbW      = Math.max(40, (el.clientWidth / el.scrollWidth) * trackW);
      const thumbRange  = trackW - thumbW;
      const dx          = mv.clientX - hDragData.current.startX;
      el.scrollLeft     = hDragData.current.startScrollLeft + (dx / thumbRange) * scrollRange;
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  const onTrackClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const track = hScrollTrackRef.current;
    const el    = tableScrollRef.current;
    if (!track || !el) return;
    const rect  = track.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    el.scrollLeft = ratio * (el.scrollWidth - el.clientWidth);
  }, []);

  const scrollToLeft = useCallback(() => {
    if (tableScrollRef.current) tableScrollRef.current.scrollLeft = 0;
  }, []);

  // ── CSV export ───────────────────────────────────────────────────────────
  function handleExportCSV() {
    const allRows = groupedRows.flatMap(g => g.rows);
    if (!allRows.length) return;
    exportCSVFile(allRows, visibleColDefs, `${localTitle}-${new Date().toISOString().slice(0, 10)}`);
  }

  // ── Cell renderer (generic, delegates to col.render or renderCellValue) ──
  const cellHelpers: CellHelpers = useMemo(() => ({
    uid: uid ?? "",
    userName: userName ?? "",
    isPrivileged,
    canEdit,
    canDelete,
    startEdit: (id: string, field: string, value: string) => setEditCell({ id, field, value }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [uid, userName, isPrivileged, resolvedPermissions]);

  function renderCell(col: OdsColDef, client: OdsRecord) {
    const isEditing  = editCell?.id === client.id && editCell?.field === col.key;
    const isSaving   = saving[client.id] === col.key;

    // ── Multiline column: show icon, click opens dialog ──
    if (col.multiline) {
      const val = String(client[col.key] ?? "");
      const hasContent = val.trim().length > 0;
      const isEditable = !!((col.editable || isPrivileged) && canEdit(col.key));
      return (
        <td key={col.key} className={`cl-td${col.meta ? " meta" : ""}`}>
          <button
            type="button"
            title={hasContent ? val.slice(0, 100) : `${isEditable ? "Add" : "No"} ${col.label?.toLowerCase() ?? "note"}`}
            onClick={(e) => {
              e.stopPropagation();
              setNoteDialog({ id: client.id, field: col.key, label: col.label, value: val, editable: isEditable });
              setNoteDraft(val);
            }}
            style={{
              display: "flex", alignItems: "center", gap: "0.25rem",
              background: "none", border: "none", padding: 0, cursor: "pointer",
              color: hasContent ? "var(--app-accent)" : "var(--app-text-5)",
            }}
          >
            <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {hasContent ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              )}
            </svg>
            {hasContent && <span style={{ fontSize: "0.625rem", fontWeight: 600 }}>1</span>}
          </button>
        </td>
      );
    }

    // If the column is editable and currently being edited, show CellInput
    if ((col.editable || isPrivileged) && isEditing) {
      // Resolve enum options: code-defined first, then fall back to distinct values from data
      const enumOpts = (col.enumValues && col.enumValues.length > 0) ? col.enumValues : (col.filterType === "enum" ? distinctValues[col.key] : undefined);
      const inputType: "text" | "number" | "date" | "select" =
        col.filterType === "number" ? "number" :
        col.filterType === "date" ? "date" :
        (col.filterType === "enum" && enumOpts && enumOpts.length > 0) ? "select" : "text";
      const showFieldDelete = !col.meta && canDelete(col.key);
      return (
        <td key={col.key} className={`cl-td${col.meta ? " meta" : ""}`} onClick={(e) => e.stopPropagation()}>
          <CellInput
            type={inputType}
            initialValue={String(client[col.key] ?? "")}
            options={enumOpts}
            optionLabels={col.enumLabels}
            onSave={confirmEdit}
            onCancel={cancelEdit}
            onDelete={showFieldDelete ? () => requestDeleteField(client.id, col.key) : undefined}
          />
        </td>
      );
    }

    // If the column is editable (but not editing), wrap with pencil icon
    if ((col.editable || isPrivileged) && canEdit(col.key)) {
      const rendered = renderCellValue(col, client, cellHelpers);
      return (
        <td key={col.key} className={`cl-td${col.meta ? " meta" : ""}`}>
          <div className="cl-cell-edit" onClick={(e) => { e.stopPropagation(); startEdit(client.id, col.key, String(client[col.key] ?? "")); }}>
            {rendered}
            {isSaving ? <Spinner /> : <PencilIconBtn />}
          </div>
        </td>
      );
    }

    // Non-editable column: just render value
    const rendered = renderCellValue(col, client, cellHelpers);
    return (
      <td key={col.key} className={`cl-td${col.meta ? " meta" : ""}`}>
        {rendered}
      </td>
    );
  }

  // ── Permissions editor ───────────────────────────────────────────────────
  function renderPermissionsEditor() {
    if (!showPermissions) return null;

    const configurableRoles: Array<"rep" | "manager" | "admin"> = ["rep", "manager", "admin"];
    const permCols = resolvedColumns;

    return (
      <div className="cl-sheet-overlay" onClick={() => setShowPermissions(false)}>
        <div className="cl-sheet" onClick={e => e.stopPropagation()}>
          <div className="cl-sheet-header">
            <div>
              <div className="cl-sheet-title">Column Permissions</div>
              <div className="cl-sheet-sub">Owner &amp; Dev always have full access</div>
            </div>
            <button className="cl-sheet-close" onClick={() => setShowPermissions(false)}>
              <XMarkIcon style={{ width: 16, height: 16 }} />
            </button>
          </div>

          <div className="cl-sheet-body">
          <div style={{ overflowX: "auto" }}>
          <table className="cl-perm-table">
            <thead>
              <tr>
                <th className="cl-perm-th cl-perm-col-label" />
                {configurableRoles.map((role) => (
                  <th key={role} className="cl-perm-th cl-perm-role-group" colSpan={4}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </th>
                ))}
              </tr>
              <tr>
                <th className="cl-perm-th cl-perm-col-label">Column</th>
                {configurableRoles.map((role) => (
                  <React.Fragment key={role}>
                    <th className="cl-perm-th cl-perm-sub">V</th>
                    <th className="cl-perm-th cl-perm-sub">C</th>
                    <th className="cl-perm-th cl-perm-sub">E</th>
                    <th className="cl-perm-th cl-perm-sub">D</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Action rows */}
              {([
                { key: "export", label: "Export" },
                { key: "rename", label: "Rename list" },
              ] as const).map(({ key, label }) => (
                <tr key={key} className="cl-perm-tr cl-perm-tr-action">
                  <td className="cl-perm-td cl-perm-col-name">
                    {label}
                    <span className="cl-perm-tag">action</span>
                  </td>
                  {configurableRoles.map((role) => {
                    const allowed = draftPermissions[role][key]?.view ?? false;
                    return (
                      <React.Fragment key={role + "-" + key}>
                        <td className="cl-perm-td cl-perm-cell" colSpan={4}>
                          <input
                            type="checkbox"
                            className="cl-perm-check"
                            checked={allowed}
                            onChange={() => toggleDraftPerm(role, key, "view")}
                          />
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))}
              {permCols.map((col) => {
                const isMeta = !!col.meta;
                return (
                  <tr key={col.key} className="cl-perm-tr">
                    <td className="cl-perm-td cl-perm-col-name">
                      {col.label || col.key}
                      {col.adminOnly && <span className="cl-perm-tag">admin+</span>}
                      {isMeta        && <span className="cl-perm-tag">meta</span>}
                    </td>
                    {configurableRoles.map((role) => {
                      const perm = draftPermissions[role][col.key] ?? { view: true, create: true, edit: true, delete: true };
                      return (
                        <React.Fragment key={role + "-" + col.key}>
                          <td className="cl-perm-td cl-perm-cell">
                            <input type="checkbox" className="cl-perm-check"
                              checked={perm.view}
                              onChange={() => toggleDraftPerm(role, col.key, "view")}
                            />
                          </td>
                          {isMeta ? (
                            <>
                              <td className="cl-perm-td cl-perm-cell"><span style={{ color: "var(--cl-text-5)", fontSize: "0.5625rem" }}>—</span></td>
                              <td className="cl-perm-td cl-perm-cell"><span style={{ color: "var(--cl-text-5)", fontSize: "0.5625rem" }}>—</span></td>
                              <td className="cl-perm-td cl-perm-cell"><span style={{ color: "var(--cl-text-5)", fontSize: "0.5625rem" }}>—</span></td>
                            </>
                          ) : (
                            <>
                              <td className="cl-perm-td cl-perm-cell">
                                <input type="checkbox" className="cl-perm-check"
                                  checked={perm.create} disabled={!perm.view}
                                  onChange={() => toggleDraftPerm(role, col.key, "create")}
                                />
                              </td>
                              <td className="cl-perm-td cl-perm-cell">
                                <input type="checkbox" className="cl-perm-check"
                                  checked={perm.edit} disabled={!perm.view}
                                  onChange={() => toggleDraftPerm(role, col.key, "edit")}
                                />
                              </td>
                              <td className="cl-perm-td cl-perm-cell">
                                <input type="checkbox" className="cl-perm-check"
                                  checked={perm.delete} disabled={!perm.view}
                                  onChange={() => toggleDraftPerm(role, col.key, "delete")}
                                />
                              </td>
                            </>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
          </div>

          {onSavePermissions && (
          <div className="cl-sheet-footer">
            <button className="cl-perm-save" onClick={() => { savePermissions(); setShowPermissions(false); }} disabled={savingPerms}>
              {savingPerms ? "Saving\u2026" : "Save"}
            </button>
          </div>
          )}
        </div>
      </div>
    );
  }

  // ── Schema Editor (simplified: data scope + column visibility by role) ──
  function renderSchemaEditor() {
    if (!showSchemaEditor) return null;

    const rawCols: SchemaColumnOverride[] = draftSchema.columns ?? resolvedColumns.map((c, i) => ({
      key: c.key, label: c.label, sortable: !!c.sortable, editable: !!c.editable,
      filterType: c.filterType || "text", enumValues: c.enumValues || [], adminOnly: !!c.adminOnly,
      hidden: false, order: i,
    }));
    // Merge back code-defined enumValues that were stripped during save
    const baseCols = rawCols.map(col => {
      const codeDef = columns.find(c => c.key === col.key);
      if (codeDef && (!col.enumValues || col.enumValues.length === 0) && codeDef.enumValues && codeDef.enumValues.length > 0) {
        return { ...col, enumValues: codeDef.enumValues };
      }
      return col;
    });
    // Discover all fields from the data that aren't already in columns
    const knownKeys = new Set(baseCols.map(c => c.key));
    const dataKeys: string[] = [];
    for (const record of clientsProp) {
      for (const k of Object.keys(record)) {
        if (!knownKeys.has(k) && !HIDDEN_KEYS.has(k)) {
          knownKeys.add(k);
          dataKeys.push(k);
        }
      }
    }
    // Infer type from first non-null value
    const discoveredCols: SchemaColumnOverride[] = dataKeys.map((key, i) => {
      let sample: unknown = undefined;
      for (const r of clientsProp) { if (r[key] != null && r[key] !== "") { sample = r[key]; break; } }
      const filterType: SchemaColumnOverride["filterType"] =
        typeof sample === "number" ? "number" :
        typeof sample === "boolean" ? "enum" :
        (sample && typeof sample === "object" && "seconds" in (sample as Record<string, unknown>)) ? "date" :
        "text";
      const enumValues: string[] = typeof sample === "boolean" ? ["true", "false"] : [];
      // Auto-generate label from key: camelCase → Title Case
      const label = key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase()).trim();
      return { key, label, sortable: true, editable: false, filterType, enumValues, adminOnly: false, hidden: true, order: baseCols.length + i };
    });
    const draftCols = [...baseCols, ...discoveredCols].sort((a, b) => {
      if (a.order != null && b.order != null) return a.order - b.order;
      if (a.order != null) return -1;
      if (b.order != null) return 1;
      return (a.label ?? a.key).localeCompare(b.label ?? b.key);
    });
    const draftAdded: OdsColDef[] = draftSchema.addedColumns ?? [];
    const allSchemaKeys = [...draftCols.map(c => c.key), ...draftAdded.map(c => c.key)];

    function updateDraftCol(key: string, patch: Partial<SchemaColumnOverride>) {
      setDraftSchema(prev => {
        const cols = [...(prev.columns ?? draftCols)];
        const idx = cols.findIndex(c => c.key === key);
        if (idx >= 0) {
          cols[idx] = { ...cols[idx], ...patch };
        } else {
          // Column not yet in schema (discovered field) — add it
          const discovered = draftCols.find(c => c.key === key);
          if (discovered) cols.push({ ...discovered, ...patch });
        }
        return { ...prev, columns: cols };
      });
    }

    async function addNewColumn() {
      const k = schemaNewCol.key.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
      if (!k || !schemaNewCol.label.trim()) return;
      if (allSchemaKeys.includes(k)) return;
      const newCol: OdsColDef = {
        key: k,
        label: schemaNewCol.label.trim(),
        filterType: schemaNewCol.filterType as OdsColDef["filterType"],
        sortable: schemaNewCol.sortable,
        editable: schemaNewCol.editable,
        adminOnly: schemaNewCol.adminOnly,
      };
      // Write default value to all docs in the collection
      if (onAddColumn) {
        const defaultValue = schemaNewCol.filterType === "number" ? 0 : schemaNewCol.filterType === "enum" ? "" : "";
        try {
          await onAddColumn(k, defaultValue);
        } catch (err) {
          console.error("[OdsList] Failed to write new column to collection:", err);
        }
      }
      setDraftSchema(prev => ({
        ...prev,
        addedColumns: [...(prev.addedColumns ?? []), newCol],
      }));
      setSchemaNewCol({ key: "", label: "", filterType: "text", sortable: true, editable: false, adminOnly: false });
    }

    function removeAddedColumn(key: string) {
      setDraftSchema(prev => ({
        ...prev,
        addedColumns: (prev.addedColumns ?? []).filter(c => c.key !== key),
      }));
    }

    // Schema editor uses the half-sheet overlay classes
    const panelStyle: React.CSSProperties = {};
    const overlayStyle: React.CSSProperties = {};
    const headerStyle: React.CSSProperties = {
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "1rem 1.25rem", borderBottom: "1px solid var(--cl-border-2)",
    };
    const titleStyle: React.CSSProperties = {
      fontSize: "0.875rem", fontWeight: 700, color: "var(--cl-text)",
    };
    const subtitleStyle: React.CSSProperties = {
      fontSize: "0.6875rem", color: "var(--cl-text-3)", marginTop: "0.125rem",
    };
    const sectionTitleStyle: React.CSSProperties = {
      fontSize: "0.6875rem", fontWeight: 700, color: "var(--cl-text-3)",
      textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem",
      padding: "0 0.25rem",
    };
    const inputStyle: React.CSSProperties = {
      background: "var(--cl-surface-2)", border: "1px solid var(--cl-border-2)",
      borderRadius: "0.375rem", padding: "0.25rem 0.5rem", fontSize: "0.75rem",
      color: "var(--cl-text)", outline: "none",
    };
    const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };
    const checkStyle: React.CSSProperties = { accentColor: "var(--cl-accent)", cursor: "pointer" };
    const btnStyle: React.CSSProperties = {
      background: "var(--cl-accent)", color: "white", border: "none",
      borderRadius: "0.375rem", padding: "0.375rem 0.875rem", fontSize: "0.75rem",
      fontWeight: 600, cursor: "pointer",
    };
    const btnSecondaryStyle: React.CSSProperties = {
      ...btnStyle, background: "var(--cl-surface-2)", color: "var(--cl-text-3)",
      border: "1px solid var(--cl-border-2)",
    };
    const thStyle: React.CSSProperties = {
      fontSize: "0.625rem", fontWeight: 600, color: "var(--cl-text-3)",
      textTransform: "uppercase", letterSpacing: "0.04em",
      padding: "0.375rem 0.375rem", textAlign: "left", whiteSpace: "nowrap",
    };
    const tdStyle: React.CSSProperties = {
      padding: "0.375rem 0.375rem", fontSize: "0.75rem", color: "var(--cl-text)",
      borderTop: "1px solid var(--cl-border-2)", verticalAlign: "middle",
    };

    // Build role-keyed visibility from current permissions
    const roleVisibility: Record<string, Record<string, boolean>> = {
      rep: {}, manager: {}, admin: {},
    };
    const configurableRoles: Array<"rep" | "manager" | "admin"> = ["rep", "manager", "admin"];
    for (const role of configurableRoles) {
      for (const col of draftCols) {
        roleVisibility[role][col.key] = resolvedPermissions[role]?.[col.key]?.view !== false;
      }
    }

    function toggleColVisibility(role: "rep" | "manager" | "admin", key: string) {
      const current = roleVisibility[role][key] ?? true;
      const newVal = !current;
      const perm = { view: newVal, create: newVal, edit: newVal, delete: newVal };
      const updated: PermissionsMatrix = {
        ...resolvedPermissions,
        [role]: { ...resolvedPermissions[role], [key]: perm },
      };
      if (onSavePermissions) onSavePermissions(updated);
    }

    return (
      <div className="cl-sheet-overlay" onClick={() => setShowSchemaEditor(false)}>
        <div className="cl-sheet" style={{ maxHeight: "80vh" }} onClick={e => e.stopPropagation()}>
          <div className="cl-sheet-header">
            <div>
              <div className="cl-sheet-title">List Settings</div>
              <div className="cl-sheet-sub">Data scope and column visibility per role.</div>
            </div>
            <button className="cl-sheet-close" onClick={() => setShowSchemaEditor(false)}>
              <XMarkIcon style={{ width: 16, height: 16 }} />
            </button>
          </div>

          {schemaError && (
            <div style={{ padding: "0.5rem 1.25rem", background: "color-mix(in srgb, var(--cl-red) 15%, transparent)", borderBottom: "1px solid color-mix(in srgb, var(--cl-red) 30%, transparent)", color: "var(--cl-red)", fontSize: "0.75rem", fontWeight: 500 }}>
              {schemaError}
            </div>
          )}

          {/* Body */}
          <div style={{ flex: 1, overflow: "auto", padding: "1rem 1.25rem" }}>

            {/* ── Section 1: Data Scope (dev only) ── */}
            {currentRole === "dev" && <div style={{ marginBottom: "1.5rem" }}>
              <div style={sectionTitleStyle}>Data Scope</div>
              <p style={{ fontSize: "0.6875rem", color: "var(--cl-text-4)", marginBottom: "0.75rem" }}>
                Controls which records each role can see. Owner &amp; Dev always see all data.
              </p>

              {/* Owner + Team field selectors */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.625rem", fontWeight: 600, color: "var(--cl-text-4)", marginBottom: "0.25rem", textTransform: "uppercase" }}>Owner Field (UID)</label>
                  <select
                    value={draftSchema.dataScope?.ownerField ?? ""}
                    onChange={e => setDraftSchema(prev => ({ ...prev, dataScope: { ...prev.dataScope, ownerField: e.target.value || undefined } }))}
                    style={selectStyle}
                  >
                    <option value="">— none —</option>
                    {draftCols.map(c => <option key={c.key} value={c.key}>{c.label || c.key}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.625rem", fontWeight: 600, color: "var(--cl-text-4)", marginBottom: "0.25rem", textTransform: "uppercase" }}>Team Field</label>
                  <select
                    value={draftSchema.dataScope?.teamField ?? ""}
                    onChange={e => setDraftSchema(prev => ({ ...prev, dataScope: { ...prev.dataScope, teamField: e.target.value || undefined } }))}
                    style={selectStyle}
                  >
                    <option value="">— none —</option>
                    {draftCols.map(c => <option key={c.key} value={c.key}>{c.label || c.key}</option>)}
                  </select>
                </div>
              </div>

              {/* Per-role scope buttons */}
              {(["rep", "manager", "admin"] as const).map(role => {
                const ds = draftSchema.dataScope ?? {};
                const current = ds[role] ?? (role === "rep" ? "own" : role === "manager" ? "team" : "all");
                const options: Array<{ key: string; label: string; desc: string }> = [
                  { key: "own", label: "Own Records", desc: "Only records they created" },
                  { key: "team", label: "Team Records", desc: "Records from their team" },
                  { key: "all", label: "All Records", desc: "Full access to all records" },
                ];
                return (
                  <div key={role} style={{ marginBottom: "0.75rem" }}>
                    <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--cl-text-2)", marginBottom: "0.375rem", textTransform: "capitalize" }}>{role}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.375rem" }}>
                      {options.map(opt => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setDraftSchema(prev => ({ ...prev, dataScope: { ...prev.dataScope, [role]: opt.key } }))}
                          style={{
                            padding: "0.5rem", borderRadius: "0.5rem", cursor: "pointer",
                            border: current === opt.key ? "2px solid var(--cl-accent)" : "1px solid var(--cl-border-2)",
                            background: current === opt.key ? "color-mix(in srgb, var(--cl-accent) 10%, transparent)" : "var(--cl-surface-2)",
                            textAlign: "center", transition: "all 0.15s",
                          }}
                        >
                          <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: current === opt.key ? "var(--cl-accent)" : "var(--cl-text)" }}>{opt.label}</div>
                          <div style={{ fontSize: "0.5625rem", color: "var(--cl-text-4)", marginTop: "0.125rem" }}>{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>}

            {/* ── Section 2: Column Visibility by Role ── */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={sectionTitleStyle}>Column Visibility</div>
              <p style={{ fontSize: "0.6875rem", color: "var(--cl-text-4)", marginBottom: "0.75rem" }}>
                Toggle which columns each role can see. Changes save immediately.
              </p>
              <div style={{ overflow: "auto", border: "1px solid var(--cl-border-2)", borderRadius: "0.5rem" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--cl-surface-2)" }}>
                      <th style={thStyle}>Column</th>
                      {configurableRoles.map(role => (
                        <th key={role} style={{ ...thStyle, textAlign: "center", textTransform: "capitalize" }}>{role}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {draftCols.map(col => (
                      <tr key={col.key}>
                        <td style={tdStyle}>
                          <span style={{ color: "var(--cl-text-2)", fontSize: "0.6875rem", fontWeight: 500 }}>{col.label || col.key}</span>
                        </td>
                        {configurableRoles.map(role => (
                          <td key={role} style={{ ...tdStyle, textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={roleVisibility[role][col.key] !== false}
                              onChange={() => toggleColVisibility(role, col.key)}
                              style={{ accentColor: "var(--cl-accent)", cursor: "pointer", width: 16, height: 16 }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Section 3: Display Mode ── */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={sectionTitleStyle}>Display Mode</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                {(["table", "expandable"] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setDraftSchema(prev => ({ ...prev, displayMode: mode }))}
                    style={{
                      padding: "0.375rem 0.75rem", borderRadius: "0.375rem", cursor: "pointer",
                      border: draftSchema.displayMode === mode ? "2px solid var(--cl-accent)" : "1px solid var(--cl-border-2)",
                      background: draftSchema.displayMode === mode ? "color-mix(in srgb, var(--cl-accent) 10%, transparent)" : "var(--cl-surface-2)",
                      fontSize: "0.6875rem", fontWeight: 600,
                      color: draftSchema.displayMode === mode ? "var(--cl-accent)" : "var(--cl-text-3)",
                      textTransform: "capitalize",
                    }}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Section 4: Group By ── */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={sectionTitleStyle}>Group By Field</div>
              <select
                value={draftSchema.groupByField ?? ""}
                onChange={e => setDraftSchema(prev => ({ ...prev, groupByField: e.target.value || undefined }))}
                style={selectStyle}
              >
                <option value="">— none —</option>
                {draftCols.filter(c => c.filterType === "enum" || c.filterType === "text").map(c => (
                  <option key={c.key} value={c.key}>{c.label || c.key}</option>
                ))}
              </select>
            </div>

            {/* ── Section 5: View Only ── */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.625rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={!!draftSchema.style?.viewOnly}
                  onChange={() => setDraftSchema(prev => ({ ...prev, style: { ...prev.style, viewOnly: !prev.style?.viewOnly } }))}
                  style={{ accentColor: "var(--cl-accent)", width: "0.9375rem", height: "0.9375rem", cursor: "pointer" }}
                />
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--cl-text)" }}>View Only</div>
                  <div style={{ fontSize: "0.625rem", color: "var(--cl-text-4)" }}>Disable editing, deleting, and actions for all users</div>
                </div>
              </label>
            </div>

          </div>

          {/* Footer */}
          <div className="cl-sheet-footer">
            <button
              style={{ padding: "0.375rem 1rem", borderRadius: "0.5rem", border: "none", background: "var(--cl-accent)", color: "white", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
              onClick={() => { saveSchema(); }}
              disabled={schemaSaving}
            >
              {schemaSaving ? "Saving\u2026" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Filter builder ───────────────────────────────────────────────────────
  function renderFilterBuilder() {
    if (!showFilterBuilder) return null;
    const filterableColumns = resolvedColumns.filter(
      (c) => c.filterType && !c.noFilter && (!c.adminOnly || showSubmittedBy),
    );

    return (
      <div className="cl-fb">
        {filterRows.length === 0 ? (
          <p className="cl-fb-empty">No filters applied. Add one below.</p>
        ) : (
          filterRows.map((row) => {
            const col = resolvedColumns.find((c) => c.key === row.field);
            const ft  = col?.filterType ?? "text";
            const ops = getOperators(ft);
            const enumVals = row.field ? (distinctValues[row.field] ?? []) : [];

            return (
              <div key={row.id} className="cl-fb-row">
                <span className="cl-fb-where">Where</span>

                {/* Field */}
                <select
                  className="cl-fb-select"
                  value={row.field || filterableColumns[0]?.key || ""}
                  onChange={(e) => updateFilterRow(row.id, { field: e.target.value })}
                  ref={(el) => { if (el && !row.field && filterableColumns[0]) updateFilterRow(row.id, { field: filterableColumns[0].key }); }}
                >
                  {filterableColumns.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>

                {/* Operator */}
                <select
                  className="cl-fb-select cl-fb-select-op"
                  value={row.operator}
                  onChange={(e) => updateFilterRow(row.id, { operator: e.target.value })}
                >
                  {ops.map((op) => <option key={op} value={op}>{op}</option>)}
                </select>

                {/* Value */}
                {row.operator === "is empty" || row.operator === "is not empty" ? null : ft === "enum" ? (
                  <select
                    className="cl-fb-select cl-fb-select-val"
                    value={row.value || enumVals[0] || ""}
                    onChange={(e) => updateFilterRow(row.id, { value: e.target.value })}
                    ref={(el) => { if (el && !row.value && enumVals[0]) updateFilterRow(row.id, { value: enumVals[0] }); }}
                  >
                    {enumVals.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                ) : row.operator === "between" ? (
                  <>
                    <input
                      className="cl-fb-input"
                      type={ft === "date" ? "date" : "number"}
                      placeholder="From"
                      value={row.value}
                      onChange={(e) => updateFilterRow(row.id, { value: e.target.value })}
                    />
                    <span className="cl-fb-and">and</span>
                    <input
                      className="cl-fb-input"
                      type={ft === "date" ? "date" : "number"}
                      placeholder="To"
                      value={row.value2}
                      onChange={(e) => updateFilterRow(row.id, { value2: e.target.value })}
                    />
                  </>
                ) : (
                  <input
                    className="cl-fb-input cl-fb-input-wide"
                    type={ft === "date" ? "date" : ft === "number" ? "number" : "text"}
                    placeholder="Value..."
                    value={row.value}
                    onChange={(e) => updateFilterRow(row.id, { value: e.target.value })}
                  />
                )}


                {/* Remove row */}
                <button className="cl-fb-remove" onClick={() => removeFilterRow(row.id)} title="Remove filter">
                  <XMarkIcon style={{ width: 12, height: 12 }} />
                </button>
              </div>
            );
          })
        )}

        <div className="cl-fb-footer">
          <button className="cl-fb-add" onClick={addFilterRow}>
            <PlusIcon style={{ width: 10, height: 10 }} />
            Add filter
          </button>
          {filterRows.length > 0 && (
            <button className="cl-fb-clear" onClick={() => setFilterRows([])}>
              Clear all
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="cl-root cl-loading">
        <div className="cl-loading-spinner" />
      </div>
    );
  }

  const activeFilterCount = Object.values(filters).filter((v) =>
    v.kind === "enum" || v.kind === "enum-exclude" ? v.values.length > 0
      : v.kind === "text" || v.kind === "text-startswith" ? !!v.q
      : v.kind === "empty" || v.kind === "not-empty" ? true
      : !!(v.min || v.max)
  ).length;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="cl-root" style={listFontSize !== "base" ? { fontSize: listFontSize === "sm" ? "0.6875rem" : listFontSize === "lg" ? "0.9375rem" : "1.0625rem" } : undefined}>

      {/* ── Sticky bars (pinned to top on scroll) ── */}
      <div className="cl-sticky-bars">

      {/* Header */}
      {!schemaStyle?.hideTitle && (
      <div className="cl-header">
        <div className="cl-header-row">
          <div className="cl-header-left">
            <div className="cl-header-accent" />
            <div>
              {isRenaming ? (
                <input
                  autoFocus
                  className="cl-rename-input"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={confirmRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmRename();
                    if (e.key === "Escape") { setIsRenaming(false); setRenameValue(localTitle); }
                  }}
                />
              ) : (
                <h1
                  className={"cl-title" + ((isPrivileged || canView("rename")) ? " cl-title-editable" : "")}
                  onClick={() => { if (isPrivileged || canView("rename")) { setIsRenaming(true); setRenameValue(localTitle); } }}
                  title={(isPrivileged || canView("rename")) ? "Click to rename" : undefined}
                >
                  {localTitle}
                  {unreadCount > 0 && (resolvedDisplayMode === "mail" || resolvedDisplayMode === "document") && (
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      minWidth: "1.25rem", height: "1.25rem", padding: "0 0.375rem",
                      borderRadius: "9999px", fontSize: "0.625rem", fontWeight: 700,
                      background: "var(--cl-accent)", color: "white", marginLeft: "0.5rem",
                      verticalAlign: "middle",
                    }}>{unreadCount}</span>
                  )}
                </h1>
              )}
              {!schemaStyle?.hideRecordCount && (
              <p className="cl-subtitle">
                {pageSize > 0 && displayedClients.length > effectivePageSize
                  ? `${(page * effectivePageSize + 1).toLocaleString()}\u2013${Math.min((page + 1) * effectivePageSize, displayedClients.length).toLocaleString()} of ${displayedClients.length.toLocaleString()} records`
                  : `${displayedClients.length.toLocaleString()} record${displayedClients.length !== 1 ? "s" : ""}`}
              </p>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Views toolbar + settings bar */}
      <div className="cl-toolbar-row">
        {/* Action icon bar — ellipsis toggle (left-aligned) */}
        <div className="cl-action-bar" ref={actionMenuRef}>
          <button
            className={"cl-action-toggle" + (showActionMenu ? " active" : "")}
            onClick={() => setShowActionMenu(p => !p)}
            title="Menu"
            aria-label="Toggle settings menu"
          >
            <EllipsisVerticalIcon style={{ width: 18, height: 18 }} />
          </button>
          <div className={"cl-action-items" + (showActionMenu ? " open" : "")}>
            {/* Accessibility — visible to ALL users */}
            <button
              className={"cl-action-btn" + (showA11y ? " active" : "")}
              onClick={() => { setShowA11y(p => !p); setShowActionMenu(false); }}
              title="Accessibility"
              aria-label="Accessibility settings"
            >
              <UserIcon style={{ width: 15, height: 15 }} />
            </button>
            {/* ── Owner/dev-only controls ── */}
            {isPrivileged && (
            <>
            {(canView("export")) && (
              <button
                className="cl-action-btn"
                onClick={() => { handleExportCSV(); setShowActionMenu(false); }}
                disabled={displayedClients.length === 0}
                title="Export to CSV"
                aria-label="Export to CSV"
              >
                <ArrowDownTrayIcon style={{ width: 15, height: 15 }} />
              </button>
            )}
            {(currentRole === "dev" || currentRole === "owner") && onSaveSchema && (
              <button
                className={"cl-action-btn" + (showSchemaEditor ? " active" : "")}
                onClick={() => { openSchemaEditor(); setShowActionMenu(false); }}
                title="List Settings"
                aria-label="List settings"
              >
                <Cog6ToothIcon style={{ width: 15, height: 15 }} />
              </button>
            )}
            </>
            )}
          </div>
        </div>

        {!schemaStyle?.hideViewBar && (
        <div className="cl-toolbar">
          <div className="cl-toolbar-seg">
            {allViews.map((view, idx) => {
              const isFirstDefault = (view.isDefault || view.builtIn) && idx === 0;
              const nextView = allViews[idx + 1];
              const showDivider = isFirstDefault && nextView && !nextView.isDefault && !nextView.builtIn;
              return (
                <React.Fragment key={view.id}>
                  <div className="cl-toolbar-view-item">
                    <button
                      className={"cl-seg-btn" + (activeViewId === view.id ? " active" : "")}
                      onClick={() => applyView(view)}
                    >
                      {view.name}
                    </button>
                    {!view.builtIn && !view.isDefault && (
                      <button
                        className="cl-seg-delete"
                        title="Delete view"
                        onClick={() => handleDeleteView(view.id)}
                      >
                        <XMarkIcon style={{ width: 8, height: 8 }} />
                      </button>
                    )}
                  </div>
                  {showDivider && <div className="cl-pill-divider" />}
                </React.Fragment>
              );
            })}
          </div>

          {showSaveView ? (
            <div className="cl-toolbar-save-wrap">
              <input
                autoFocus
                className="cl-toolbar-save-input"
                type="text"
                placeholder="View name\u2026"
                value={newViewName}
                onChange={(e) => setNewViewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveView();
                  if (e.key === "Escape") { setShowSaveView(false); setNewViewName(""); }
                }}
              />
              <button className="cl-toolbar-save-confirm" onClick={handleSaveView} disabled={savingView || !newViewName.trim()}>
                {savingView ? "\u2026" : "Save"}
              </button>
              <button className="cl-toolbar-save-cancel" onClick={() => { setShowSaveView(false); setNewViewName(""); }}>
                Cancel
              </button>
            </div>
          ) : (
            onSaveView && (
              <button className="cl-seg-add" onClick={() => setShowSaveView(true)}>
                <PlusIcon style={{ width: 10, height: 10 }} />
                Save view
              </button>
            )
          )}
        </div>
        )}

      </div>

      {/* ── Half-sheet: Style ── */}
      {showStyleMenu && typeof document !== "undefined" && createPortal(
        <div className="cl-sheet-overlay" onClick={() => setShowStyleMenu(false)}>
          <div className="cl-sheet" onClick={e => e.stopPropagation()}>
            <div className="cl-sheet-header">
              <div>
                <div className="cl-sheet-title">Style</div>
                <div className="cl-sheet-sub">Card &amp; row appearance</div>
              </div>
              <button className="cl-sheet-close" onClick={() => setShowStyleMenu(false)}>
                <XMarkIcon style={{ width: 16, height: 16 }} />
              </button>
            </div>
            <div className="cl-sheet-body">
                  {/* Background color */}
                  <div style={{ marginBottom: "0.75rem" }}>
                    <div style={{ color: "var(--cl-text-3)", fontSize: "0.5625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem" }}>Background</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <label style={{ position: "relative", width: "1.75rem", height: "1.75rem", borderRadius: "0.375rem", overflow: "hidden", cursor: "pointer", border: "1px solid var(--cl-border-2)", flexShrink: 0 }}>
                        <input
                          type="color"
                          value={schemaStyle?.bgColor || "#111827"}
                          onChange={e => updateStyle({ bgColor: e.target.value })}
                          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "pointer", opacity: 0 }}
                        />
                        <span style={{ position: "absolute", inset: 0, borderRadius: "0.375rem", background: cardBg }} />
                      </label>
                      <input
                        type="text"
                        value={schemaStyle?.bgColor || ""}
                        onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value) || !e.target.value) updateStyle({ bgColor: e.target.value || undefined }); }}
                        placeholder="inherit"
                        style={{ flex: 1, padding: "0.25rem 0.5rem", fontSize: "0.6875rem", fontFamily: "monospace", background: "var(--cl-surface-2)", border: "1px solid var(--cl-border-2)", borderRadius: "0.375rem", color: "var(--cl-text)", outline: "none" }}
                      />
                      {schemaStyle?.bgColor && (
                        <button onClick={() => updateStyle({ bgColor: undefined })} style={{ background: "none", border: "none", color: "var(--cl-text-4)", cursor: "pointer", fontSize: "0.625rem" }}>Reset</button>
                      )}
                    </div>
                  </div>

                  {/* Shadow color */}
                  <div style={{ marginBottom: "0.75rem" }}>
                    <div style={{ color: "var(--cl-text-3)", fontSize: "0.5625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem" }}>Shadow Color</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <label style={{ position: "relative", width: "1.75rem", height: "1.75rem", borderRadius: "0.375rem", overflow: "hidden", cursor: "pointer", border: "1px solid var(--cl-border-2)", flexShrink: 0 }}>
                        <input
                          type="color"
                          value={schemaStyle?.shadowColor?.replace(/rgba?\([^)]+\)/, "") || "#000000"}
                          onChange={e => updateStyle({ shadowColor: e.target.value + "33" })}
                          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "pointer", opacity: 0 }}
                        />
                        <span style={{ position: "absolute", inset: 0, borderRadius: "0.375rem", background: shadowColor }} />
                      </label>
                      <input
                        type="text"
                        value={schemaStyle?.shadowColor || ""}
                        onChange={e => updateStyle({ shadowColor: e.target.value || undefined })}
                        placeholder="rgba(0,0,0,0.12)"
                        style={{ flex: 1, padding: "0.25rem 0.5rem", fontSize: "0.6875rem", fontFamily: "monospace", background: "var(--cl-surface-2)", border: "1px solid var(--cl-border-2)", borderRadius: "0.375rem", color: "var(--cl-text)", outline: "none" }}
                      />
                      {schemaStyle?.shadowColor && (
                        <button onClick={() => updateStyle({ shadowColor: undefined })} style={{ background: "none", border: "none", color: "var(--cl-text-4)", cursor: "pointer", fontSize: "0.625rem" }}>Reset</button>
                      )}
                    </div>
                  </div>

                  {/* Shadow offset + blur */}
                  <div>
                    <div style={{ color: "var(--cl-text-3)", fontSize: "0.5625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem" }}>Shadow Shape</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                      <div>
                        <label style={{ fontSize: "0.5625rem", color: "var(--cl-text-4)", display: "block", marginBottom: "0.125rem" }}>X Offset</label>
                        <input type="number" value={schemaStyle?.shadowOffsetX ?? 0} onChange={e => updateStyle({ shadowOffsetX: Number(e.target.value) })}
                          style={{ width: "100%", padding: "0.25rem 0.375rem", fontSize: "0.6875rem", background: "var(--cl-surface-2)", border: "1px solid var(--cl-border-2)", borderRadius: "0.375rem", color: "var(--cl-text)", outline: "none", textAlign: "center" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.5625rem", color: "var(--cl-text-4)", display: "block", marginBottom: "0.125rem" }}>Y Offset</label>
                        <input type="number" value={schemaStyle?.shadowOffsetY ?? 1} onChange={e => updateStyle({ shadowOffsetY: Number(e.target.value) })}
                          style={{ width: "100%", padding: "0.25rem 0.375rem", fontSize: "0.6875rem", background: "var(--cl-surface-2)", border: "1px solid var(--cl-border-2)", borderRadius: "0.375rem", color: "var(--cl-text)", outline: "none", textAlign: "center" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.5625rem", color: "var(--cl-text-4)", display: "block", marginBottom: "0.125rem" }}>Blur</label>
                        <input type="number" min={0} value={schemaStyle?.shadowBlur ?? 3} onChange={e => updateStyle({ shadowBlur: Math.max(0, Number(e.target.value)) })}
                          style={{ width: "100%", padding: "0.25rem 0.375rem", fontSize: "0.6875rem", background: "var(--cl-surface-2)", border: "1px solid var(--cl-border-2)", borderRadius: "0.375rem", color: "var(--cl-text)", outline: "none", textAlign: "center" }} />
                      </div>
                    </div>
                  </div>

                  {/* Section visibility toggles */}
                  <div style={{ marginTop: "0.75rem" }}>
                    <div style={{ color: "var(--cl-text-3)", fontSize: "0.5625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem" }}>Show / Hide</div>
                    {([
                      { key: "hideTitle" as const, label: "Title Bar" },
                      { key: "hideRecordCount" as const, label: "Record Count" },
                      { key: "hideViewBar" as const, label: "View Bar" },
                      { key: "hideSearch" as const, label: "Search & Filter" },
                      { key: "hideFooter" as const, label: "Footer" },
                    ] as const).map(({ key, label }) => (
                      <label key={key} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.25rem 0", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={!schemaStyle?.[key]}
                          onChange={() => updateStyle({ [key]: !schemaStyle?.[key] })}
                          style={{ accentColor: "var(--cl-accent)", width: "0.8125rem", height: "0.8125rem", cursor: "pointer" }}
                        />
                        <span style={{ fontSize: "0.75rem", color: "var(--cl-text-2)" }}>{label}</span>
                      </label>
                    ))}
                  </div>

                  {/* Preview */}
                  <div style={{ marginTop: "0.75rem", padding: "1rem", borderRadius: "0.625rem", background: "var(--cl-surface-2)" }}>
                    <div style={{ padding: "1rem", borderRadius: "0.5rem", background: cardBg, boxShadow: cardShadow }}>
                      <div style={{ fontSize: "0.5625rem", fontWeight: 600, color: "var(--cl-text-4)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Preview</div>
                      <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--cl-text)", lineHeight: 1, marginTop: "0.25rem" }}>$12,345</div>
                    </div>
                  </div>

                  {/* Save to view */}
                  {onSaveView && (
                    <button
                      onClick={() => { setShowStyleMenu(false); setShowSaveView(true); }}
                      style={{
                        width: "100%", marginTop: "0.75rem", padding: "0.5rem",
                        borderRadius: "0.5rem", border: "none",
                        background: "var(--cl-accent)", color: "white",
                        fontSize: "0.6875rem", fontWeight: 600, cursor: "pointer",
                        transition: "opacity 0.15s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                    >
                      Save to View
                    </button>
                  )}
            </div>
          </div>
        </div>
      , document.body)}

      {/* ── Half-sheet: Accessibility ── */}
      {showA11y && typeof document !== "undefined" && createPortal(
        <div className="cl-sheet-overlay" onClick={() => setShowA11y(false)}>
          <div className="cl-sheet" onClick={e => e.stopPropagation()}>
            <div className="cl-sheet-header">
              <div>
                <div className="cl-sheet-title">Accessibility</div>
                <div className="cl-sheet-sub">Geist Sans by Vercel</div>
              </div>
              <button className="cl-sheet-close" onClick={() => setShowA11y(false)}>
                <XMarkIcon style={{ width: 16, height: 16 }} />
              </button>
            </div>
            <div className="cl-sheet-body">
              <div style={{ color: "var(--cl-text-3)", fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Text Size</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.5rem" }}>
                {([
                  { key: "sm" as const, label: "Small", size: "0.75rem" },
                  { key: "base" as const, label: "Default", size: "0.875rem" },
                  { key: "lg" as const, label: "Large", size: "1rem" },
                  { key: "xl" as const, label: "X-Large", size: "1.125rem" },
                ]).map(({ key, label, size }) => (
                  <button
                    key={key}
                    onClick={() => { setListFontSize(key); if (onSaveUserPrefs) onSaveUserPrefs({ fontSize: key }); else localStorage.setItem(a11yKey, key); setShowA11y(false); }}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem",
                      padding: "0.75rem 0.5rem", borderRadius: "0.5rem",
                      border: `1px solid ${listFontSize === key ? "var(--cl-accent)" : "var(--cl-border-2)"}`,
                      background: listFontSize === key ? "var(--cl-accent)" : "var(--cl-surface-2)",
                      color: listFontSize === key ? "white" : "var(--cl-text-3)",
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    <span style={{ fontSize: size, fontWeight: 700, lineHeight: 1 }}>Aa</span>
                    <span style={{ fontSize: "0.625rem", fontWeight: 500 }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Search + filter button */}
      {!schemaStyle?.hideSearch && (
      <div className="cl-search-area">
        <div className="cl-search-row">
          <div className="cl-search-wrap">
            <MagnifyingGlassIcon className="cl-search-icon" />
            <input
              className="cl-search-input"
              type="text"
              placeholder="Search by name, phone, app #, carrier, state, notes\u2026"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            {searchText && (
              <button className="cl-search-clear" onClick={() => setSearchText("")}>
                <XMarkIcon style={{ width: 14, height: 14 }} />
              </button>
            )}
          </div>
          <button
            className={"cl-filter-toggle" + (showFilterBuilder || activeFilterCount > 0 ? " active" : "")}
            onClick={() => setShowFilterBuilder((p) => !p)}
          >
            <FunnelIcon style={{ width: 12, height: 12 }} />
            Filter
            {activeFilterCount > 0 && <span className="cl-filter-toggle-count">{activeFilterCount}</span>}
          </button>
          <div style={{ position: "relative" }}>
            <button
              className="cl-filter-toggle"
              onClick={() => setShowAddFilterMenu(p => !p)}
              title="Add a filter"
              style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
            >
              <PlusIcon style={{ width: 12, height: 12 }} />
            </button>
            {showAddFilterMenu && (
              <>
              <div style={{ position: "fixed", inset: 0, zIndex: 19 }} onClick={() => setShowAddFilterMenu(false)} />
              <div
                style={{
                  position: "absolute", top: "100%", right: 0, marginTop: "0.25rem", zIndex: 20,
                  background: "var(--app-surface, var(--cl-surface))", border: "1px solid var(--app-border-2, var(--cl-border-2))",
                  borderRadius: "0.5rem", boxShadow: "0 0.5rem 1.5rem rgba(0,0,0,0.2)",
                  padding: "0.25rem", minWidth: "10rem", maxHeight: "16rem", overflowY: "auto",
                }}
              >
                {resolvedColumns
                  .filter(c => c.filterType && !c.noFilter && (!c.adminOnly || showSubmittedBy))
                  .map(c => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => {
                        const ft = c.filterType ?? "text";
                        const ops = getOperators(ft);
                        const firstOp = ops[0] ?? "contains";
                        const firstVal = ft === "enum" ? (distinctValues[c.key]?.[0] ?? "") : "";
                        const id = `r-${Date.now()}`;
                        setFilterRows(prev => [...prev, { id, field: c.key, operator: firstOp, value: firstVal, value2: "" }]);
                        setShowFilterBuilder(true);
                        setShowAddFilterMenu(false);
                      }}
                      style={{
                        display: "block", width: "100%", textAlign: "left",
                        padding: "0.375rem 0.625rem", borderRadius: "0.375rem",
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: "0.75rem", fontWeight: 500, color: "var(--app-text, var(--cl-text))",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "var(--app-surface-2, var(--cl-surface-2))"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
                    >
                      {c.label}
                    </button>
                  ))}
              </div>
              </>
            )}
          </div>
        </div>

        {/* Multi-sort hint */}
        {sorts.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0 0.25rem", fontSize: "0.5625rem", color: "var(--cl-text-4)" }}>
            Sorted by: {sorts.map((s, i) => (
              <span key={s.field} style={{ color: "var(--cl-text-3)" }}>
                {resolvedColumns.find(c => c.key === s.field)?.label ?? s.field} {s.dir === "asc" ? "\u2191" : "\u2193"}
                {i < sorts.length - 1 ? "," : ""}
              </span>
            ))}
            <button style={{ background: "none", border: "none", color: "var(--cl-text-5)", cursor: "pointer", padding: 0, fontSize: "0.5625rem", textDecoration: "underline" }} onClick={() => setSorts([])}>Clear</button>
          </div>
        )}

        {/* Firebase-style filter builder */}
        {renderFilterBuilder()}
      </div>
      )}

      {/* Active column filters chips — only shown when builder is open */}
      {showFilterBuilder && activeFilterCount > 0 && (
        <div className="cl-active-filters">
          <span className="cl-active-filters-label">Column filters:</span>
          {Object.entries(filters).map(([col, spec]) => {
            const colDef = resolvedColumns.find((c) => c.key === col);
            const name   = colDef?.label || col;
            let chip = "";
            if (spec.kind === "enum"  && spec.values.length) chip = spec.values.length > 1 ? `${name}: ${spec.values.length} selected` : `${name}: ${spec.values[0]}`;
            if (spec.kind === "text"  && spec.q)             chip = `${name}: ~${spec.q}`;
            if (spec.kind === "range" && (spec.min || spec.max)) chip = `${name}: ${spec.min ?? ""}\u2013${spec.max ?? ""}`;
            if (!chip) return null;
            return (
              <span key={col} className="cl-filter-chip">
                {chip}
                <button className="cl-filter-chip-remove" onClick={() => setFilterRows((prev) => prev.filter((r) => r.field !== col))}>x</button>
              </span>
            );
          })}
          <button className="cl-filter-clear-all" onClick={() => setFilterRows([])}>Clear all</button>
        </div>
      )}

      </div>{/* end cl-sticky-bars */}

      {/* Table / Expandable content area */}
      <div className="cl-table-area">
        {displayedClients.length > 0 ? (
          resolvedDisplayMode === "expandable" ? (
            /* ── Expandable mode (table-based) ────────────────────── */
            (() => {
              const expandColSpan = 1 + visibleColDefs.length + (showActionsCol ? 1 : 0);
              return (
              <div className="cl-table-wrap">
                <div className="cl-table-scroll">
                  <table className="cl-table" role="grid">
                    <thead className="cl-thead">
                      <tr>
                        {/* Chevron column header */}
                        <th className="cl-th narrow" style={{ width: "2rem" }} />
                        {visibleColDefs.map((col) => {
                          const sortIdx    = sorts.findIndex(s => s.field === col.key);
                          const isSorted   = sortIdx >= 0;
                          const sortEntry  = isSorted ? sorts[sortIdx] : null;
                          const isDragging = dragCol === col.key;
                          const isDragOver = dragOverCol === col.key && dragCol !== col.key;
                          const spec       = filters[col.key];
                          const isFiltered = spec
                            ? spec.kind === "enum" || spec.kind === "enum-exclude" ? spec.values.length > 0
                              : spec.kind === "text" || spec.kind === "text-startswith" ? !!spec.q
                              : spec.kind === "empty" || spec.kind === "not-empty" ? true
                              : !!(spec.min || spec.max)
                            : false;

                          return (
                            <th
                              key={col.key}
                              aria-sort={isSorted ? (sortEntry!.dir === "asc" ? "ascending" : "descending") : "none"}
                              className={[
                                "cl-th",
                                col.meta ? "meta" : "",
                                isDragging ? "dragging" : "",
                                isDragOver ? "drag-over" : "",
                              ].filter(Boolean).join(" ")}
                              onDragOver={(e) => { e.preventDefault(); if (dragCol && dragCol !== col.key) setDragOverCol(col.key); }}
                              onDrop={() => { if (dragCol && dragCol !== col.key) reorderCol(dragCol, col.key); setDragOverCol(null); }}
                            >
                              <div className="cl-th-inner">
                                {/* Drag grip */}
                                <span
                                  className="cl-drag-grip"
                                  draggable
                                  onDragStart={(e) => { e.stopPropagation(); setDragCol(col.key); }}
                                  onDragEnd={() => { setDragCol(null); setDragOverCol(null); }}
                                  title="Drag to reorder"
                                >
                                  <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                    <circle cx="5" cy="4" r="1.5"/><circle cx="11" cy="4" r="1.5"/>
                                    <circle cx="5" cy="8" r="1.5"/><circle cx="11" cy="8" r="1.5"/>
                                    <circle cx="5" cy="12" r="1.5"/><circle cx="11" cy="12" r="1.5"/>
                                  </svg>
                                </span>

                                {col.sortable ? (
                                  <button className={"cl-sort-btn" + (isSorted ? " sorted" : "")} onClick={(e) => handleSort(col.key, e.shiftKey)}>
                                    {col.label}
                                    <span className={"cl-sort-arrow" + (isSorted ? "" : " unsorted")}>
                                      {isSorted ? (
                                        <>
                                          {sorts.length > 1 && <span style={{ fontSize: "0.5rem", color: "var(--cl-text-4)", marginRight: "0.125rem" }}>{sortIdx + 1}</span>}
                                          {sortEntry!.dir === "asc" ? "\u2191" : "\u2193"}
                                        </>
                                      ) : "\u2195"}
                                    </span>
                                  </button>
                                ) : (
                                  <span>{col.label}</span>
                                )}

                                {isFiltered && (
                                  <span className="cl-filter-count">{"\u25CF"}</span>
                                )}
                              </div>
                            </th>
                          );
                        })}
                        {showActionsCol && (
                          <th className="cl-th-actions">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {groupedRows.map((group) => {
                        const showSectionHeader = resolvedGroupBy && group.label;
                        return (
                          <React.Fragment key={group.key}>
                            {showSectionHeader && (
                              <tr className={`cl-tr-section ${group.key}-section`}>
                                <td colSpan={expandColSpan}>
                                  <div className="cl-section-label">
                                    <span
                                      className={`cl-section-dot${(group as { pulse?: boolean }).pulse ? " pulse" : ""}`}
                                      style={{ background: group.color }}
                                    />
                                    <span className="cl-section-title" style={{ color: group.color }}>{group.label}</span>
                                    <span className="cl-section-count">{group.rows.length}</span>
                                  </div>
                                </td>
                              </tr>
                            )}
                            {group.rows.map((record) => {
                              const isOpen = expandedRowIds.has(record.id);
                              const colFields = resolvedCollapsedFields.length > 0
                                ? resolvedCollapsedFields
                                : resolvedColumns.slice(0, 4).map(c => c.key);

                              return (
                                <React.Fragment key={record.id}>
                                  {/* Collapsed data row */}
                                  <tr
                                    className={"cl-tr" + (isOpen ? " expanded" : "")}
                                    aria-expanded={isOpen}
                                    role="row"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => {
                                      toggleExpandRow(record);
                                      onRowClick?.(record);
                                    }}
                                  >
                                    {/* Chevron cell */}
                                    <td className="cl-td narrow" style={{ width: "2rem" }}>
                                      <ChevronRightIcon className={"cl-expand-chevron" + (isOpen ? " open" : "")} />
                                    </td>
                                    {/* Data cells — same renderCell as table mode */}
                                    {visibleColDefs.map((col) => renderCell(col, record))}
                                    {/* Actions / delete cell */}
                                    {showActionsCol && (
                                      <td className="cl-td-actions">
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                                          {onEditRecord && (isPrivileged) && (
                                            <button
                                              className="cl-delete-btn"
                                              style={{ color: "var(--cl-accent)" }}
                                              title="Edit subcollections"
                                              aria-label="Edit record details"
                                              onClick={(e) => { e.stopPropagation(); onEditRecord(record); }}
                                            >
                                              <PencilSquareIcon style={{ width: 14, height: 14 }} />
                                            </button>
                                          )}
                                          {onDeleteRecord && canDelete("_record") && !record?.protected && (
                                            <button
                                              className="cl-delete-btn"
                                              title="Delete record"
                                              aria-label="Delete record"
                                              onClick={(e) => { e.stopPropagation(); requestDeleteRecord(record); }}
                                            >
                                              <TrashIconBtn />
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    )}
                                  </tr>
                                  {/* Expanded content row */}
                                  {isOpen && (
                                    <tr>
                                      <td colSpan={expandColSpan} style={{ padding: 0 }}>
                                        <div className="cl-expand-content">
                                          {renderExpandedContent ? (
                                            (() => {
                                              try { return renderExpandedContent(record); }
                                              catch (err) { console.error("[OdsList] Expanded content render error:", err); return <span style={{ color: "var(--cl-red)" }}>Render error</span>; }
                                            })()
                                          ) : resolvedExpandedSections.length > 0 ? (
                                            resolvedExpandedSections.map((section, sIdx) => (
                                              <div key={sIdx} className="cl-expand-section">
                                                <div className="cl-expand-section-label">{section.label}</div>
                                                <div className="cl-expand-section-grid">
                                                  {section.fields.map(fKey => {
                                                    const col = resolvedColumns.find(c => c.key === fKey);
                                                    const val = record[fKey];
                                                    const isFieldEditing = editCell?.id === record.id && editCell?.field === fKey;
                                                    const isFieldEditable = col?.editable && canEdit(fKey);
                                                    const isFieldSaving = saving[record.id] === fKey;
                                                    let display: string;
                                                    if (val == null || val === "") {
                                                      display = "—";
                                                    } else if (col?.meta && typeof val === "object" && val !== null && "seconds" in val) {
                                                      display = fmtTimestamp(val as { seconds: number });
                                                    } else if (col?.filterType === "date") {
                                                      display = fmtDate(String(val));
                                                    } else if (col?.filterType === "number" && typeof val === "number") {
                                                      display = val.toLocaleString();
                                                    } else if (fKey === "phone") {
                                                      display = fmtPhone(String(val));
                                                    } else {
                                                      display = String(val);
                                                    }
                                                    if (isFieldEditable && isFieldEditing) {
                                                      const inputType: "text" | "number" | "date" | "select" =
                                                        col.filterType === "number" ? "number" :
                                                        col.filterType === "date" ? "date" :
                                                        (col.filterType === "enum" && col.enumValues) ? "select" : "text";
                                                      const showFieldDel = !col.meta && canDelete(fKey);
                                                      return (
                                                        <div key={fKey} className="cl-expand-field-item">
                                                          <span className="cl-expand-field-label">{col?.label ?? fKey}</span>
                                                          <CellInput
                                                            type={inputType}
                                                            initialValue={String(record[fKey] ?? "")}
                                                            options={col.enumValues}
                                                            optionLabels={col.enumLabels}
                                                            onSave={confirmEdit}
                                                            onCancel={cancelEdit}
                                                            onDelete={showFieldDel ? () => requestDeleteField(record.id, fKey) : undefined}
                                                          />
                                                        </div>
                                                      );
                                                    }
                                                    return (
                                                      <div key={fKey} className="cl-expand-field-item">
                                                        <span className="cl-expand-field-label">{col?.label ?? fKey}</span>
                                                        {isFieldEditable ? (
                                                          <span
                                                            className="cl-expand-field-value cl-cell-edit"
                                                            onClick={() => startEdit(record.id, fKey, String(record[fKey] ?? ""))}
                                                          >
                                                            {display}
                                                            {isFieldSaving ? <Spinner /> : <PencilIconBtn />}
                                                          </span>
                                                        ) : (
                                                          <span className="cl-expand-field-value">{display}</span>
                                                        )}
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            ))
                                          ) : (
                                            /* Auto-generate: show all columns not in collapsed fields */
                                            <div className="cl-expand-section">
                                              <div className="cl-expand-section-label">Details</div>
                                              <div className="cl-expand-section-grid">
                                                {resolvedColumns
                                                  .filter(c => !colFields.includes(c.key))
                                                  .map(col => {
                                                    const val = record[col.key];
                                                    const isFieldEditing = editCell?.id === record.id && editCell?.field === col.key;
                                                    const isFieldEditable = (col.editable || isPrivileged) && canEdit(col.key);
                                                    const isFieldSaving = saving[record.id] === col.key;
                                                    let display: string;
                                                    if (val == null || val === "") {
                                                      display = "—";
                                                    } else if (col.meta && typeof val === "object" && val !== null && "seconds" in val) {
                                                      display = fmtTimestamp(val as { seconds: number });
                                                    } else if (col.filterType === "date") {
                                                      display = fmtDate(String(val));
                                                    } else if (col.filterType === "number" && typeof val === "number") {
                                                      display = val.toLocaleString();
                                                    } else if (col.key === "phone") {
                                                      display = fmtPhone(String(val));
                                                    } else {
                                                      display = String(val);
                                                    }
                                                    if (isFieldEditable && isFieldEditing) {
                                                      const inputType: "text" | "number" | "date" | "select" =
                                                        col.filterType === "number" ? "number" :
                                                        col.filterType === "date" ? "date" :
                                                        (col.filterType === "enum" && col.enumValues) ? "select" : "text";
                                                      const showFieldDel = !col.meta && canDelete(col.key);
                                                      return (
                                                        <div key={col.key} className="cl-expand-field-item">
                                                          <span className="cl-expand-field-label">{col.label}</span>
                                                          <CellInput
                                                            type={inputType}
                                                            initialValue={String(record[col.key] ?? "")}
                                                            options={col.enumValues}
                                                            optionLabels={col.enumLabels}
                                                            onSave={confirmEdit}
                                                            onCancel={cancelEdit}
                                                            onDelete={showFieldDel ? () => requestDeleteField(record.id, col.key) : undefined}
                                                          />
                                                        </div>
                                                      );
                                                    }
                                                    return (
                                                      <div key={col.key} className="cl-expand-field-item">
                                                        <span className="cl-expand-field-label">{col.label}</span>
                                                        {isFieldEditable ? (
                                                          <span
                                                            className="cl-expand-field-value cl-cell-edit"
                                                            onClick={() => startEdit(record.id, col.key, String(record[col.key] ?? ""))}
                                                          >
                                                            {display}
                                                            {isFieldSaving ? <Spinner /> : <PencilIconBtn />}
                                                          </span>
                                                        ) : (
                                                          <span className="cl-expand-field-value">{display}</span>
                                                        )}
                                                      </div>
                                                    );
                                                  })}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              );
            })()
          ) : resolvedDisplayMode === "card" ? (
            /* ── Card mode — uses OdsStatCard ────────────────────────────── */
            <div className="cl-table-wrap">
            <div className="cl-table-scroll">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", padding: "1rem" }}>
              {displayedClients.map((record) => {
                const label = record.displayLabel ?? record.clientName ?? String(record[visibleColDefs[0]?.key] ?? record.id);
                const primaryCol = visibleColDefs[0];
                const primaryVal = primaryCol ? record[primaryCol.key] : undefined;
                // Format the primary value
                const formattedValue = primaryCol?.render
                  ? undefined // will use children for custom render
                  : primaryCol?.filterType === "number" && typeof primaryVal === "number"
                    ? primaryVal.toLocaleString()
                    : String(primaryVal ?? "—");
                // Extract trend from the record if available
                const trend = record.trend as "up" | "down" | "neutral" | undefined;
                // Second column becomes trendValue
                const secondCol = visibleColDefs[1];
                const trendValue = secondCol ? String(record[secondCol.key] ?? "") : undefined;

                return (
                  <OdsStatCard
                    key={record.id}
                    className="flex-1"
                    label={label}
                    value={formattedValue ?? ""}
                    trend={trend}
                    trendValue={trendValue || undefined}
                    onClick={onRowClick ? () => onRowClick(record) : undefined}
                  />
                );
              })}
            </div>
            </div>
            </div>
          ) : resolvedDisplayMode === "document" ? (
            /* ── Document library mode ────────────────────────────────────── */
            <div style={{ display: "flex", flexDirection: "column" }}>
              {displayedClients.map((record) => {
                const name = record.displayLabel ?? String(record.name ?? record.fileName ?? record.id);
                const fileType = String(record.fileType ?? record.type ?? "");
                const ext = String(record.fileName ?? name).split(".").pop()?.toLowerCase() ?? "";
                const isRead = record.read === true || record.opened === true;

                // File icon color by type
                const iconColor =
                  ext === "pdf" || fileType.includes("pdf") ? "var(--app-danger, #ef4444)" :
                  ["jpg","jpeg","png","gif","svg","webp"].includes(ext) || fileType.startsWith("image") ? "var(--app-success, #22c55e)" :
                  ["xls","xlsx","csv"].includes(ext) || fileType.includes("sheet") ? "#22c55e" :
                  ["doc","docx"].includes(ext) || fileType.includes("word") ? "var(--app-accent, #3b82f6)" :
                  ["zip","rar","gz","tar"].includes(ext) ? "var(--app-warning, #f59e0b)" :
                  "var(--app-text-4, #6b7280)";

                // File icon SVG
                const fileIcon = (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth={1.5} style={{ flexShrink: 0 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                );

                const size = record.fileSize ? (() => {
                  const b = Number(record.fileSize);
                  if (b < 1024) return `${b} B`;
                  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
                  return `${(b / 1048576).toFixed(1)} MB`;
                })() : "";

                const date = record.docDate ?? record.uploadedAt ?? record.createdAt;
                const dateStr = typeof date === "string" ? date :
                  (date && typeof date === "object" && "seconds" in date) ?
                    new Date((date as { seconds: number }).seconds * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

                const category = record.category ? String(record.category) : "";
                const uploader = record.uploadedByName ? String(record.uploadedByName) : "";

                return (
                  <div
                    key={record.id}
                    onClick={() => {
                      if (onRowClick) onRowClick(record);
                      // Auto-open file URL if available
                      if (record.storageUrl) window.open(String(record.storageUrl), "_blank");
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.75rem",
                      padding: "0.75rem 1.25rem", cursor: "pointer",
                      borderBottom: "1px solid var(--app-border, #1f2937)",
                      transition: "background 0.1s",
                      opacity: isRead ? 0.65 : 1,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--app-surface-2, #1f2937)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    {fileIcon}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontWeight: 600, fontSize: "0.8125rem", color: "var(--app-text, #f9fafb)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {name}
                        </span>
                        {category && (
                          <span style={{ fontSize: "0.5625rem", fontWeight: 600, padding: "0.0625rem 0.375rem", borderRadius: "9999px", background: "var(--app-surface-2, #1f2937)", color: "var(--app-text-3, #9ca3af)" }}>
                            {category}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.6875rem", color: "var(--app-text-4, #6b7280)", marginTop: "0.125rem" }}>
                        {[uploader, dateStr, size, ext.toUpperCase()].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    {record.protected === true && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--app-text-5, #4b5563)" strokeWidth={1.5} style={{ flexShrink: 0 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    )}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--app-text-5, #4b5563)" strokeWidth={2} style={{ flexShrink: 0 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                );
              })}
            </div>
          ) : resolvedDisplayMode === "mail" ? (
            /* ── Mail / notification mode ─────────────────────────────────── */
            <div style={{ display: "flex", flexDirection: "column" }}>
              {displayedClients.map((record) => {
                const title = record.displayLabel ?? String(record.fullName ?? record.name ?? record.subject ?? record.id);
                const preview = String(record.comments ?? record.body ?? record.notes ?? record.detail ?? record.email ?? "");
                const isRead = record.read === true || record.read === "true";
                const isUnread = !isRead;
                const date = record.submittedAt ?? record.createdAt ?? record.date;
                const dateStr = typeof date === "string" ? date :
                  (date && typeof date === "object" && "seconds" in date) ?
                    new Date((date as { seconds: number }).seconds * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";

                // Status-based accent — read items get no dot
                const statusVal = String(record.status ?? "");
                const dotColor = isRead ? "transparent" :
                  statusVal === "pending" ? "var(--app-warning, #f59e0b)" :
                  statusVal === "approved" || statusVal === "resolved" ? "var(--app-success, #22c55e)" :
                  statusVal === "rejected" || statusVal === "denied" ? "var(--app-danger, #ef4444)" :
                  isUnread ? "var(--app-accent, #3b82f6)" : "transparent";

                return (
                  <div
                    key={record.id}
                    onClick={() => handleMailRowClick(record)}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: "0.75rem",
                      padding: "0.875rem 1.25rem", cursor: "pointer",
                      borderBottom: "1px solid var(--app-border, #1f2937)",
                      transition: "background 0.1s",
                      fontWeight: isUnread ? 600 : 400,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--app-surface-2, #1f2937)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    {/* Unread dot */}
                    <div style={{
                      width: "0.5rem", height: "0.5rem", borderRadius: "50%",
                      background: dotColor, flexShrink: 0, marginTop: "0.375rem",
                    }} />

                    {/* Avatar / initials */}
                    {record.photoDataURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={String(record.photoDataURL)} alt="" style={{ width: "2rem", height: "2rem", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                    ) : (
                      <div style={{
                        width: "2rem", height: "2rem", borderRadius: "50%", flexShrink: 0,
                        background: "var(--app-surface-2, #1f2937)", border: "1px solid var(--app-border-2, #374151)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.625rem", fontWeight: 700, color: "var(--app-text-2, #d1d5db)",
                      }}>
                        {title.split(" ").map(w => w[0] ?? "").join("").slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                        <span style={{
                          fontSize: "0.8125rem",
                          color: isUnread ? "var(--app-text, #f9fafb)" : "var(--app-text-2, #d1d5db)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {title}
                        </span>
                        <span style={{ fontSize: "0.625rem", color: "var(--app-text-4, #6b7280)", flexShrink: 0 }}>
                          {dateStr}
                        </span>
                      </div>
                      {preview && (
                        <p style={{
                          margin: "0.125rem 0 0", fontSize: "0.75rem",
                          color: "var(--app-text-4, #6b7280)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          fontWeight: 400,
                        }}>
                          {preview}
                        </p>
                      )}
                      {statusVal && (
                        <span style={{
                          display: "inline-block", marginTop: "0.25rem",
                          fontSize: "0.5625rem", fontWeight: 700, padding: "0.0625rem 0.375rem",
                          borderRadius: "9999px", border: `1px solid ${dotColor}`,
                          color: dotColor,
                          background: dotColor === "transparent" ? "var(--app-surface-2, #1f2937)" : undefined,
                        }}>
                          {statusVal.charAt(0).toUpperCase() + statusVal.slice(1)}
                        </span>
                      )}
                    </div>

                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--app-text-5, #4b5563)" strokeWidth={2} style={{ flexShrink: 0, marginTop: "0.25rem" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── Table mode ───────────────────────────────────────────────── */
            <div className="cl-table-wrap">
              <div className="cl-table-scroll" ref={tableScrollRef} onScroll={syncHThumb}>
                <table className="cl-table" role="grid">
                  <thead className="cl-thead">
                    <tr>
                      {expandable && onRowClick && (
                        <th className="cl-th narrow" style={{ width: "2rem" }} />
                      )}
                      {visibleColDefs.map((col) => {
                        const sortIdx    = sorts.findIndex(s => s.field === col.key);
                        const isSorted   = sortIdx >= 0;
                        const sortEntry  = isSorted ? sorts[sortIdx] : null;
                        const isDragging = dragCol === col.key;
                        const isDragOver = dragOverCol === col.key && dragCol !== col.key;
                        const spec       = filters[col.key];
                        const isFiltered = spec
                          ? spec.kind === "enum" || spec.kind === "enum-exclude" ? spec.values.length > 0
                            : spec.kind === "text" || spec.kind === "text-startswith" ? !!spec.q
                            : spec.kind === "empty" || spec.kind === "not-empty" ? true
                            : !!(spec.min || spec.max)
                          : false;

                        return (
                          <th
                            key={col.key}
                            aria-sort={isSorted ? (sortEntry!.dir === "asc" ? "ascending" : "descending") : "none"}
                            className={[
                              "cl-th",
                              col.meta ? "meta" : "",
                              isDragging ? "dragging" : "",
                              isDragOver ? "drag-over" : "",
                            ].filter(Boolean).join(" ")}
                            onDragOver={(e) => { e.preventDefault(); if (dragCol && dragCol !== col.key) setDragOverCol(col.key); }}
                            onDrop={() => { if (dragCol && dragCol !== col.key) reorderCol(dragCol, col.key); setDragOverCol(null); }}
                          >
                            <div className="cl-th-inner">
                              {/* Drag grip */}
                              <span
                                className="cl-drag-grip"
                                draggable
                                onDragStart={(e) => { e.stopPropagation(); setDragCol(col.key); }}
                                onDragEnd={() => { setDragCol(null); setDragOverCol(null); }}
                                title="Drag to reorder"
                              >
                                <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                  <circle cx="5" cy="4" r="1.5"/><circle cx="11" cy="4" r="1.5"/>
                                  <circle cx="5" cy="8" r="1.5"/><circle cx="11" cy="8" r="1.5"/>
                                  <circle cx="5" cy="12" r="1.5"/><circle cx="11" cy="12" r="1.5"/>
                                </svg>
                              </span>

                              {col.sortable ? (
                                <button className={"cl-sort-btn" + (isSorted ? " sorted" : "")} onClick={(e) => handleSort(col.key, e.shiftKey)}>
                                  {col.label}
                                  <span className={"cl-sort-arrow" + (isSorted ? "" : " unsorted")}>
                                    {isSorted ? (
                                      <>
                                        {sorts.length > 1 && <span style={{ fontSize: "0.5rem", color: "var(--cl-text-4)", marginRight: "0.125rem" }}>{sortIdx + 1}</span>}
                                        {sortEntry!.dir === "asc" ? "\u2191" : "\u2193"}
                                      </>
                                    ) : "\u2195"}
                                  </span>
                                </button>
                              ) : (
                                <span>{col.label}</span>
                              )}

                              {isFiltered && (
                                <span className="cl-filter-count">\u25CF</span>
                              )}
                            </div>
                          </th>
                        );
                      })}
                      {showActionsCol && (
                        <th className="cl-th-actions">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {groupedRows.map((group, groupIdx) => {
                      const showSectionHeader = resolvedGroupBy && group.label;

                      return (
                        <React.Fragment key={group.key}>
                          {showSectionHeader && (
                            <tr className={`cl-tr-section ${group.key}-section`}>
                              <td colSpan={totalColSpan}>
                                <div className="cl-section-label">
                                  <span
                                    className={`cl-section-dot${(group as { pulse?: boolean }).pulse ? " pulse" : ""}`}
                                    style={{ background: group.color }}
                                  />
                                  <span className="cl-section-title" style={{ color: group.color }}>{group.label}</span>
                                  <span className="cl-section-count">
                                    {group.rows.length}{hasMore ? "+" : ""}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          )}
                          {group.rows.map((client) => (
                            <tr key={client.id} className="cl-tr">
                              {expandable && onRowClick && (
                                <td className="cl-td narrow" style={{ width: "2rem", cursor: "pointer" }}>
                                  <button
                                    type="button"
                                    title="View details"
                                    onClick={() => onRowClick(client)}
                                    className="cl-expand-btn"
                                    style={{ display: "flex", alignItems: "center", opacity: 0.5, background: "none", border: "none", padding: 0, cursor: "pointer" }}
                                    onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                                    onMouseLeave={e => (e.currentTarget.style.opacity = "0.5")}
                                  >
                                    <ChevronRightIcon style={{ width: 12, height: 12 }} />
                                  </button>
                                </td>
                              )}
                              {visibleColDefs.map((col) => renderCell(col, client))}
                              {showActionsCol && (
                                <td className="cl-td-actions">
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                                    {onEditRecord && (isPrivileged) && (
                                      <button
                                        className="cl-delete-btn"
                                        style={{ color: "var(--cl-accent)" }}
                                        title="Edit subcollections"
                                        aria-label="Edit record details"
                                        onClick={() => onEditRecord(client)}
                                      >
                                        <PencilSquareIcon style={{ width: 14, height: 14 }} />
                                      </button>
                                    )}
                                    {onDeleteRecord && canDelete("_record") && !client?.protected && (
                                      <button
                                        className="cl-delete-btn"
                                        title="Delete record"
                                        aria-label="Delete record"
                                        onClick={() => requestDeleteRecord(client)}
                                      >
                                        <TrashIconBtn />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {hThumb.show && (
                <div className="cl-hscroll-bar">
                  <button className="cl-scroll-left-btn" onClick={scrollToLeft} title="Scroll to start">&#8249;</button>
                  <div className="cl-hscroll-track" ref={hScrollTrackRef} onMouseDown={onTrackClick}>
                    <div
                      className="cl-hscroll-thumb"
                      style={{ left: hThumb.left, width: hThumb.width }}
                      onMouseDown={onThumbMouseDown}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          <div className="cl-empty">
            <div className="cl-empty-icon">
              <MagnifyingGlassIcon style={{ width: 28, height: 28, color: "var(--cl-text-4)" }} />
            </div>
            <p className="cl-empty-title">No records found</p>
            <p className="cl-empty-sub">Try adjusting your search or filters.</p>
          </div>
        )}

        {!schemaStyle?.hideFooter && (
        <div className="cl-pagination">
          {/* Page size selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginRight: "auto" }}>
            <span style={{ fontSize: "0.6875rem", color: "var(--cl-text-4)" }}>Rows</span>
            <select
              value={pageSize}
              onChange={e => { const v = Number(e.target.value); setPageSize(v); setPage(0); }}
              style={{
                background: "var(--cl-surface-2)", border: "1px solid var(--cl-border-2)",
                borderRadius: "0.375rem", padding: "0.1875rem 0.375rem",
                fontSize: "0.6875rem", color: "var(--cl-text)", outline: "none", cursor: "pointer",
              }}
            >
              {[10, 20, 30, 50, 100].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
              <option value={0}>All</option>
            </select>
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <>
              <button
                className="cl-page-btn"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 0}
              >
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Prev
              </button>
              <span className="cl-page-info">Page {page + 1} of {totalPages}</span>
              <button
                className="cl-page-btn"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages - 1}
              >
                Next
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>
        )}
      </div>

      {/* Half-sheet editors — portaled to body */}
      {typeof document !== "undefined" && showPermissions && createPortal(renderPermissionsEditor(), document.body)}
      {typeof document !== "undefined" && showSchemaEditor && createPortal(renderSchemaEditor(), document.body)}

      {/* Mail detail sheet */}
      {mailDetailRecord && typeof document !== "undefined" && createPortal(
        <div className="cl-sheet-overlay" onClick={() => setMailDetailRecord(null)}>
          <div className="cl-sheet" onClick={e => e.stopPropagation()}>
            <div className="cl-sheet-header">
              <div>
                <div className="cl-sheet-title">
                  {mailDetailRecord.displayLabel ?? String(mailDetailRecord.fullName ?? mailDetailRecord.name ?? mailDetailRecord.subject ?? mailDetailRecord.id)}
                </div>
                {mailDetailRecord.email && (
                  <div className="cl-sheet-sub">{String(mailDetailRecord.email)}</div>
                )}
              </div>
              <button className="cl-sheet-close" onClick={() => setMailDetailRecord(null)}>
                <XMarkIcon style={{ width: 16, height: 16 }} />
              </button>
            </div>
            <div className="cl-sheet-body">
              {visibleColDefs
                .filter(col => {
                  const v = mailDetailRecord[col.key];
                  return v != null && String(v) !== "";
                })
                .map(col => (
                  <div key={col.key} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                    padding: "0.5rem 0", borderBottom: "1px solid var(--cl-border)",
                  }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--cl-text-4)", fontWeight: 600, flexShrink: 0 }}>
                      {col.label}
                    </span>
                    <span style={{ fontSize: "0.8125rem", color: "var(--cl-text)", textAlign: "right", marginLeft: "1rem", wordBreak: "break-word" }}>
                      {col.render
                        ? col.render(mailDetailRecord[col.key], mailDetailRecord, { uid: uid ?? "", userName, isPrivileged: isAdmin, canEdit: () => false, canDelete: () => false, startEdit: () => {} })
                        : formatFieldValue(mailDetailRecord[col.key])
                      }
                    </span>
                  </div>
                ))
              }
            </div>
            <div className="cl-sheet-footer">
              <button onClick={() => setMailDetailRecord(null)} style={{
                padding: "0.5rem 1.5rem", borderRadius: "0.5rem",
                background: "var(--cl-surface-2)", border: "1px solid var(--cl-border-2)",
                color: "var(--cl-text-3)", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
              }}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirmation dialog */}
      {confirmDialog && typeof document !== "undefined" && createPortal(
        <div className="cl-confirm-overlay" onClick={() => { if (!confirmLoading) setConfirmDialog(null); }}>
          <div className="cl-confirm-card" onClick={(e) => e.stopPropagation()}>
            <div className="cl-confirm-title">{confirmDialog.title}</div>
            <div className="cl-confirm-message">{confirmDialog.message}</div>
            <div className="cl-confirm-actions">
              <button
                className="cl-confirm-cancel"
                onClick={() => setConfirmDialog(null)}
                disabled={confirmLoading}
              >
                Cancel
              </button>
              <button
                className="cl-confirm-danger"
                disabled={confirmLoading}
                onClick={async () => {
                  setConfirmLoading(true);
                  try {
                    await confirmDialog.onConfirm();
                    setConfirmDialog(null);
                  } catch (err) {
                    console.error("[OdsList] Confirm action failed:", err);
                  } finally {
                    setConfirmLoading(false);
                  }
                }}
              >
                {confirmLoading ? <Spinner /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Multiline note dialog */}
      {noteDialog && typeof document !== "undefined" && createPortal(
        <div className="cl-confirm-overlay" onClick={() => { if (!noteSaving) setNoteDialog(null); }}>
          <div className="cl-confirm-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "32rem" }}>
            <div className="cl-confirm-title">{noteDialog.label}</div>
            {noteDialog.editable ? (
              <textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                rows={6}
                style={{
                  width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.375rem",
                  background: "var(--app-surface-2)", border: "1px solid var(--app-border-2)",
                  color: "var(--app-text)", fontSize: "0.8125rem", lineHeight: 1.6,
                  resize: "vertical", outline: "none", fontFamily: "inherit",
                  marginBottom: "1rem",
                }}
                autoFocus
              />
            ) : (
              <div style={{
                whiteSpace: "pre-wrap", fontSize: "0.8125rem", color: "var(--app-text-2)",
                lineHeight: 1.6, marginBottom: "1rem", maxHeight: "20rem", overflowY: "auto",
              }}>
                {noteDialog.value || <span style={{ color: "var(--app-text-5)", fontStyle: "italic" }}>Empty</span>}
              </div>
            )}
            <div className="cl-confirm-actions">
              <button
                className="cl-confirm-cancel"
                onClick={() => setNoteDialog(null)}
                disabled={noteSaving}
              >
                {noteDialog.editable ? "Cancel" : "Close"}
              </button>
              {noteDialog.editable && (
                <button
                  style={{
                    background: "var(--app-accent)", border: "none", color: "white",
                    padding: "0.375rem 0.875rem", borderRadius: "0.375rem",
                    fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: "0.25rem",
                    opacity: noteSaving ? 0.5 : 1,
                  }}
                  disabled={noteSaving}
                  onClick={async () => {
                    if (!onSave || noteDraft === noteDialog.value) { setNoteDialog(null); return; }
                    setNoteSaving(true);
                    try {
                      await onSave(noteDialog.id, noteDialog.field, noteDraft, userName);
                      setClients((prev) => prev.map((c) =>
                        c.id === noteDialog.id ? { ...c, [noteDialog.field]: noteDraft } : c
                      ));
                      setNoteDialog(null);
                    } catch (err) {
                      console.error("[OdsList] Note save failed:", err);
                    } finally {
                      setNoteSaving(false);
                    }
                  }}
                >
                  {noteSaving ? <Spinner /> : "Save"}
                </button>
              )}
            </div>
          </div>
        </div>
      , document.body)}

    </div>
  );
}
