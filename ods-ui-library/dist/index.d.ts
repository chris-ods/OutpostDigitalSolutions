import * as react_jsx_runtime from 'react/jsx-runtime';
import React from 'react';
import { Firestore } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';

interface UserClaim {
    loading?: boolean;
    photoURL?: string | null;
    initials: string;
    avatarBgColor: string;
    displayName?: string | null;
    email: string;
    roleBadgeStyle: string;
    badgeTag: string;
    level: number;
    title?: string;
}
interface UserClaimDisplayProps {
    claim: UserClaim;
    variant: "compact" | "normal";
    className?: string;
}

interface ColDef<T> {
    /** Unique column key — used for sort state and fallback value access via row[key]. */
    key: string;
    /** Column header label. */
    label: string;
    /** Computed accessor for the cell value. Falls back to row[key as keyof T] when omitted. */
    accessor?: (row: T) => unknown;
    /** Whether this column is sortable. Default: false. */
    sortable?: boolean;
    /** Override the sort comparison value. Falls back to the accessor/key value. */
    sortValue?: (row: T) => string | number;
    /** Custom cell renderer. Receives (value, row). Renders the raw value as a string when omitted. */
    render?: (value: unknown, row: T) => React.ReactNode;
    /** Include this column in global text search. Default: true. */
    searchable?: boolean;
    /** Class applied to each <td> in this column. */
    className?: string;
    /** Class applied to the <th> in this column. */
    headerClassName?: string;
}
interface SimpleDataTableProps<T> {
    rows: T[];
    columns: ColDef<T>[];
    /** Return a stable unique key for each row. */
    getRowKey: (row: T) => string;
    /**
     * External search query — rows are filtered against all searchable columns.
     * When provided, the page controls the search input and passes the query here.
     */
    searchQuery?: string;
    initialSortField?: string;
    initialSortDir?: "asc" | "desc";
    /**
     * Return a group label for a row. Rows with the same label are grouped together.
     * Groups render in the order they are first encountered, or per groupOrder.
     */
    groupBy?: (row: T) => string;
    /** Explicit group ordering. Groups not listed appear after those that are. */
    groupOrder?: string[];
    /**
     * Custom group header renderer. Receives the group label and number of rows in the group.
     * Defaults to a simple bold label row spanning all columns.
     */
    renderGroupHeader?: (groupKey: string, count: number) => React.ReactNode;
    /** Content rendered above the table (tabs, filters, action buttons, etc.). */
    toolbar?: React.ReactNode;
    /** Called when the user clicks a row. */
    onRowClick?: (row: T) => void;
    loading?: boolean;
    emptyMessage?: string;
    className?: string;
}
declare function SimpleDataTable<T>({ rows, columns, getRowKey, searchQuery, initialSortField, initialSortDir, groupBy, groupOrder, renderGroupHeader, toolbar, onRowClick, loading, emptyMessage, className, }: SimpleDataTableProps<T>): react_jsx_runtime.JSX.Element;

interface ChangeRecord {
    /** Client-side timestamp (seconds). serverTimestamp() cannot be nested in arrayUnion objects. */
    at: {
        seconds: number;
    };
    /** Display name of the user who made the change. */
    by: string;
    /** Field that was changed. */
    field: string;
    /** Previous value as a string. */
    from: string;
    /** New value as a string. */
    to: string;
}
interface OdsRecord {
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
    createdAt?: {
        seconds: number;
    } | null;
    createdByName?: string;
    updatedAt?: {
        seconds: number;
    } | null;
    updatedByName?: string;
    changeLog?: ChangeRecord[];
    [key: string]: unknown;
}
interface FilterRow {
    id: string;
    field: string;
    operator: string;
    value: string;
    value2: string;
}
type SortEntry = {
    field: string;
    dir: "asc" | "desc";
};
interface OdsListView {
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
interface CellHelpers {
    uid: string;
    userName: string;
    isPrivileged: boolean;
    canEdit: (colKey: string) => boolean;
    canDelete: (colKey: string) => boolean;
    startEdit: (id: string, field: string, value: string) => void;
}
interface OdsColDef {
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
/** Serializable column override — stored in Firestore. */
interface SchemaColumnOverride {
    key: string;
    label?: string;
    sortable?: boolean;
    editable?: boolean;
    filterType?: "enum" | "text" | "number" | "date";
    enumValues?: string[];
    adminOnly?: boolean;
    hidden?: boolean;
    order?: number;
}
/** Full schema config persisted to Firestore — dev-editable from the UI. */
interface OdsListSchema {
    columns?: SchemaColumnOverride[];
    defaultVisibleCols?: string[];
    defaultSortField?: string;
    defaultSortDir?: "asc" | "desc";
    addedColumns?: OdsColDef[];
    displayMode?: "table" | "expandable" | "card" | "document" | "mail";
    collapsedFields?: string[];
    expandedSections?: {
        label: string;
        fields: string[];
    }[];
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
/** The five roles in your company. Owner and dev always have full access. */
type AppRole = "rep" | "manager" | "admin" | "owner" | "dev";
/** Per-column CRUD permission for a single role. */
interface ColPermission {
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
type PermissionsMatrix = {
    rep: Record<string, ColPermission>;
    manager: Record<string, ColPermission>;
    admin: Record<string, ColPermission>;
};
/**
 * Build a default permissions matrix from a set of column definitions.
 * All columns get full CRUD for every role.
 */
declare function buildDefaultPermissions(columns: OdsColDef[]): PermissionsMatrix;
/** Backward-compatible empty default. Prefer buildDefaultPermissions(columns) at the call-site. */
declare const DEFAULT_PERMISSIONS: PermissionsMatrix;
interface OdsListProps {
    /** Column definitions — REQUIRED. Drives headers, filters, rendering, and export. */
    columns: OdsColDef[];
    /** Records to display. Also accepts legacy `clients` prop name. */
    data?: OdsRecord[];
    /** @deprecated Use `data` instead. Kept for backward compatibility. */
    clients?: OdsRecord[];
    /** Whether records are still loading. Shows a spinner. */
    loading?: boolean;
    /** Display name for this list. Defaults to "Clients". */
    listTitle?: string;
    /** Field key used as the primary display label for each record. Defaults to "displayLabel". */
    labelField?: string;
    /** Display mode: "table" for Excel-like grid, "expandable" for clickable expanding rows. Default: "table". */
    displayMode?: "table" | "expandable" | "card" | "document" | "mail";
    /** Which column keys are visible by default. Falls back to all columns. */
    defaultVisibleCols?: string[];
    /** When true and onRowClick is provided, render a narrow expand-chevron first column. */
    expandable?: boolean;
    /** Initial sort column. Defaults to no sort (preserves data order from the hook). */
    initialSortField?: string | null;
    /** Initial sort direction. Defaults to "asc". */
    initialSortDir?: "asc" | "desc";
    /** Column keys shown in the collapsed row (expandable mode). */
    collapsedFields?: string[];
    /** Sections shown when a row is expanded (expandable mode). */
    expandedSections?: {
        label: string;
        fields: string[];
    }[];
    /** Callback when a row expands (expandable mode). */
    onExpandRow?: (record: OdsRecord) => void;
    /** Custom render for expanded content — overrides auto-generated sections. */
    renderExpandedContent?: (record: OdsRecord) => React.ReactNode;
    /** Generic record grouping. When provided, rows are partitioned and rendered with section headers. */
    groupBy?: {
        fn: (record: OdsRecord) => string;
        groups: {
            key: string;
            label: string;
            color: string;
            pulse?: boolean;
        }[];
    };
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
    /** Column-level view/edit permissions per role. */
    permissions?: PermissionsMatrix;
    /** Called when an owner/dev saves the permissions matrix. */
    onSavePermissions?: (matrix: PermissionsMatrix) => Promise<void>;
    /** Per-user preferences loaded from Firestore (e.g. fontSize). */
    userPrefs?: {
        fontSize?: string;
    };
    /** Called when the user changes their preferences. Parent persists to Firestore. */
    onSaveUserPrefs?: (prefs: {
        fontSize: string;
    }) => Promise<void>;
    /** Called whenever the unread count changes. Use to drive external badge counts (e.g. nav badge).
     *  A record is "unread" if: status === "pending", or read === false, or unread === true. */
    onUnreadCount?: (count: number) => void;
    /** Saved schema overrides from Firestore. Merged with code-defined columns at render time. */
    schema?: OdsListSchema;
    /** Called when a dev saves schema changes. */
    onSaveSchema?: (schema: OdsListSchema) => Promise<void>;
    /** Called when the user edits a cell and confirms. */
    onSave?: (id: string, field: string, value: string | number, updaterName: string, fromValue?: string | number) => Promise<void>;
    /** Called when the user clicks a row (table mode expand icon, or expandable mode row). */
    onRowClick?: (record: OdsRecord) => void;
    /** Saved views shown in the toolbar. */
    views?: OdsListView[];
    /** Called when saving a new view. Returns the new view ID. */
    onSaveView?: (view: Omit<OdsListView, "id">) => Promise<string>;
    /** Called when deleting a saved view. */
    onDeleteView?: (id: string) => Promise<void>;
    /** Called when a permitted user renames the list. */
    onRenameList?: (name: string) => Promise<void>;
    /** Called when user deletes an entire record. Show confirmation first. */
    onDeleteRecord?: (id: string) => Promise<void>;
    /** Called when user clears a field value (sets to empty/null). */
    onDeleteField?: (id: string, field: string) => Promise<void>;
    /** Called when a dev adds a new column. Parent writes the default value to all docs in the collection. */
    onAddColumn?: (key: string, defaultValue: string | number | boolean) => Promise<void>;
    /** Called when user clicks the edit (pencil circle) icon on a record row. Opens a modal controlled by the parent. */
    onEditRecord?: (record: OdsRecord) => void;
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
declare function OdsList({ columns, data, clients: clientsLegacy, loading, listTitle, labelField, displayMode: displayModeProp, defaultVisibleCols, expandable, initialSortField, initialSortDir, collapsedFields: collapsedFieldsProp, expandedSections: expandedSectionsProp, onExpandRow, renderExpandedContent, groupBy, uid, userName, currentRole, isAdmin, isManager, userTeamNumber, permissions, onSavePermissions, userPrefs, onSaveUserPrefs, onUnreadCount, schema, onSaveSchema, onSave, onRowClick, onDeleteRecord, onDeleteField, onAddColumn, onEditRecord, views: viewsProp, onSaveView, onDeleteView, onRenameList, showActions, hasMore, onLoadMore, phase, historicalCutoff, }: OdsListProps): react_jsx_runtime.JSX.Element;

interface ChatUser {
    uid: string;
    firstName: string;
    lastName: string;
    photoURL: string;
    role: string;
    teamNumber: number;
    active: boolean;
    level?: number;
}
interface ChatAppProps {
    /** Firestore instance from the host app */
    db: Firestore;
    /** Firebase Storage instance from the host app */
    storage: FirebaseStorage;
    /** The currently authenticated user */
    currentUser: ChatUser;
    /** Returns true if a role string is considered admin-level */
    isAdminLevel: (role: string) => boolean;
}
declare function ChatApp({ db, storage, currentUser, isAdminLevel }: ChatAppProps): react_jsx_runtime.JSX.Element;

interface LeaderboardClient {
    agentId: string;
    agentName: string;
    agentTeamNumber: number;
    annualPremium: number;
    weekStart: string;
    createdBy?: string;
}
interface LeaderboardUser {
    uid: string;
    firstName: string;
    lastName: string;
    photoURL: string;
    email: string;
    phone: string;
    role: string;
    teamNumber: number;
    level?: number;
}
interface LeaderboardCareerLevel {
    level: number;
    tag: string;
    title?: string;
}
interface LeaderboardAppProps {
    /** Firestore instance from the host app */
    db: Firestore;
    /** Returns true when the current user can edit settings */
    isOwner: boolean;
    /** Returns true if a role string is admin-level */
    isAdminLevel: (role: string) => boolean;
    /** Career level definitions — used for level badges */
    careerLevels: readonly LeaderboardCareerLevel[];
    /** Team color overrides — keyed by team number, value is hex string */
    teamColors?: Record<number, string>;
}
declare function LeaderboardApp({ db, isOwner, isAdminLevel, careerLevels, teamColors }: LeaderboardAppProps): react_jsx_runtime.JSX.Element;

interface OdsCardProps {
    /** Card title */
    title?: string;
    /** Subtitle or description */
    subtitle?: string;
    /** Icon rendered before the title */
    icon?: React.ReactNode;
    /** Action element rendered in the top-right corner (button, link, etc.) */
    action?: React.ReactNode;
    /** Additional CSS class names */
    className?: string;
    /** Override padding (default: 1.5rem) */
    padding?: string;
    /** Children rendered in the card body */
    children?: React.ReactNode;
    /** Click handler for the entire card */
    onClick?: () => void;
}
declare function OdsCard({ title, subtitle, icon, action, className, padding, children, onClick, }: OdsCardProps): react_jsx_runtime.JSX.Element;
interface OdsStatCardProps {
    /** The metric label (e.g., "Total Revenue") */
    label: string;
    /** The main value (e.g., "$12,345" or "98") */
    value: string | number;
    /** Trend direction */
    trend?: "up" | "down" | "neutral";
    /** Trend value (e.g., "+12%" or "-3.5%") */
    trendValue?: string;
    /** Icon rendered on the left */
    icon?: React.ReactNode;
    /** Accent color for the left border (CSS color string) */
    accent?: string;
    /** Additional CSS class names */
    className?: string;
    /** Click handler */
    onClick?: () => void;
}
declare function OdsStatCard({ label, value, trend, trendValue, icon, accent, className, onClick, }: OdsStatCardProps): react_jsx_runtime.JSX.Element;

type FieldType = "text" | "email" | "tel" | "select" | "date" | "checkbox" | "number" | "currency" | "file" | "textarea";
interface FieldDef {
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
interface OdsPanelProps {
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
    transformRecord?: (values: Record<string, string>, fileUrls: Record<string, string>) => Record<string, unknown>;
}
declare function OdsPanel({ collectionId, title, subtitle, uid, userName, isAdmin, currentRole, fields, columns: columnsProp, defaultVisibleCols, transformRecord, }: OdsPanelProps): react_jsx_runtime.JSX.Element;

interface ReceiptItem {
    id: string;
    description: string;
    qty: number;
    unitPrice: number;
    total: number;
}
type ReceiptCategory = "AI & API Services" | "Software & Subscriptions" | "Cloud & Infrastructure" | "Hardware & Equipment" | "Contractors & Freelancers" | "Marketing & Advertising" | "Travel & Lodging" | "Meals & Entertainment" | "Education & Training" | "Legal & Professional" | "Office & Supplies" | "Utilities & Internet" | "Other";
interface ReceiptRecord {
    id: string;
    merchant: string;
    date: string;
    subtotal: number;
    tax: number;
    tip: number;
    total: number;
    category: ReceiptCategory;
    paymentMethod: string;
    currency: string;
    notes: string;
    items: ReceiptItem[];
    createdAt: string;
    /** Firebase Storage download URL for the original file (optional). */
    fileUrl?: string;
    /** Firebase Storage path — used for deletion (optional). */
    filePath?: string;
}
interface ReceiptScannerProps {
    /** Already-saved receipts to display below the upload zone. */
    receipts: ReceiptRecord[];
    /**
     * Called with the raw file. Implement this in your app to POST to
     * your Gemini API route and return the parsed receipt fields.
     */
    processReceipt: (file: File) => Promise<Partial<ReceiptRecord>>;
    /** Called when the user confirms and saves the reviewed form. */
    onSave: (record: Omit<ReceiptRecord, "id" | "createdAt">) => Promise<void>;
    /** Optional — shows a delete button on each saved receipt row. */
    onDelete?: (id: string) => Promise<void>;
    className?: string;
}
declare function ReceiptScanner({ receipts, processReceipt, onSave, onDelete, className, }: ReceiptScannerProps): react_jsx_runtime.JSX.Element;

interface ReceiptListProps {
    receipts: ReceiptRecord[];
    loading?: boolean;
    onSave?: (id: string, field: string, value: string | number) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    listTitle?: string;
}
declare function ReceiptList({ receipts, loading, onSave, onDelete, listTitle, }: ReceiptListProps): react_jsx_runtime.JSX.Element;

/**
 * useClientList
 *
 * Firestore-backed hook for the OdsList component.
 * Each call is scoped to a single Firestore collection (e.g. "clients").
 *
 * Data layout in Firestore:
 *   /{collectionId}/{docId}                  ← client records
 *   /{collectionId}/_config/views/{viewId}   ← saved views for this list
 *   /{collectionId}/_config                  ← permissions matrix for this list
 *
 * Usage:
 *   const props = useClientList("clients");
 *   return <OdsList {...props} uid={user.uid} userName={user.displayName} />;
 *
 * To wire up a new portal:
 *   1. Update firebase.config.ts with the project credentials.
 *   2. Call this hook with the Firestore collection name for each list.
 *   3. Pass the returned props spread to <OdsList />.
 *
 * Note: _config is an intermediate document (even segments) that enables
 * the views subcollection (odd segments). Firestore requires alternating
 * collection/document path segments.
 */

interface UseClientListResult {
    data: OdsRecord[];
    views: OdsListView[];
    permissions: PermissionsMatrix;
    loading: boolean;
    hasMore: boolean;
    listTitle: string;
    onSave: (id: string, field: string, value: string | number, updaterName: string, fromValue?: string | number) => Promise<void>;
    onSaveView: (view: Omit<OdsListView, "id">) => Promise<string>;
    onDeleteView: (id: string) => Promise<void>;
    onSavePermissions: (matrix: PermissionsMatrix) => Promise<void>;
    onRenameList: (name: string) => Promise<void>;
    onLoadMore: () => Promise<void>;
}
declare function useClientList(collectionId: string): UseClientListResult;

/**
 * useClientListMock
 *
 * Local-state version of useClientList — same interface, no Firebase.
 * Use this in Storybook stories and unit tests.
 *
 * Drop-in swap:
 *   // Production portal
 *   const props = useClientList("clients");
 *
 *   // Storybook / tests
 *   const props = useClientListMock("clients", { initialClients: SAMPLE_CLIENTS });
 */

interface MockOptions {
    /** Seed client records. */
    initialClients?: OdsRecord[];
    /** Seed saved views. */
    initialViews?: OdsListView[];
    /** Initial list title. Defaults to collectionId. */
    initialTitle?: string;
    /** Seed permissions matrix. Defaults to DEFAULT_PERMISSIONS. */
    initialPermissions?: PermissionsMatrix;
    /** Simulate initial loading state. */
    loading?: boolean;
    /** Simulate a paginated list with more records available. */
    hasMore?: boolean;
}
/**
 * @param collectionId  Ignored for mock — only here so you can swap
 *                      `useClientList` ↔ `useClientListMock` without changing call sites.
 */
declare function useClientListMock(_collectionId: string, options?: MockOptions): UseClientListResult;

/**
 * useReceiptListMock
 *
 * Local-state version of a receipt list — no Firebase, no backend.
 * Use this in the ODS portal demo, Storybook stories, and unit tests.
 *
 * Drop-in pattern (future Firestore hook would match this interface):
 *   const props = useReceiptListMock();
 */

interface UseReceiptListResult$1 {
    receipts: ReceiptRecord[];
    onSave: (record: Omit<ReceiptRecord, "id" | "createdAt">) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}
interface ReceiptMockOptions {
    /** Seed receipts to pre-populate the list. */
    initialReceipts?: ReceiptRecord[];
}
declare function useReceiptListMock(options?: ReceiptMockOptions): UseReceiptListResult$1;

/**
 * useReceiptList
 *
 * Firestore-backed hook for the ReceiptScanner component.
 *
 * Data layout in Firestore:
 *   /receipts/{docId}   ← receipt records scoped per user via uid field
 *
 * Storage layout (managed by the consuming app, path stored here):
 *   receipts/{uid}/{timestamp}_{filename}
 *
 * Usage:
 *   const { receipts, loading, onSave, onDelete } = useReceiptList(user.uid);
 */

interface UseReceiptListResult {
    receipts: ReceiptRecord[];
    loading: boolean;
    onSave: (record: Omit<ReceiptRecord, "id" | "createdAt">) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}
declare function useReceiptList(uid: string): UseReceiptListResult;

export { type AppRole, type CellHelpers, type ChangeRecord, ChatApp, type ChatAppProps, type ChatUser, type ColDef, type ColPermission, DEFAULT_PERMISSIONS, type FieldDef, type FieldType, type FilterRow, LeaderboardApp, type LeaderboardAppProps, type LeaderboardCareerLevel, type LeaderboardClient, type LeaderboardUser, type MockOptions, OdsCard, type OdsCardProps, type OdsColDef, OdsList, type OdsListProps, type OdsListSchema, type OdsListView, OdsPanel, type OdsPanelProps, type OdsRecord, OdsStatCard, type OdsStatCardProps, type PermissionsMatrix, type ReceiptCategory, type ReceiptItem, ReceiptList, type ReceiptListProps, type ReceiptMockOptions, type ReceiptRecord, ReceiptScanner, type ReceiptScannerProps, type SchemaColumnOverride, SimpleDataTable, type SimpleDataTableProps, type SortEntry, type UseClientListResult, type UseReceiptListResult, type UserClaim, type UserClaimDisplayProps, buildDefaultPermissions, useClientList, useClientListMock, useReceiptList, useReceiptListMock };
