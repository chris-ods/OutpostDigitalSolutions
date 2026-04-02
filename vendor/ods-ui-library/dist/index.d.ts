import * as react_jsx_runtime from 'react/jsx-runtime';

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
interface ClientRecord {
    id: string;
    agentId?: string;
    agentName?: string;
    contractorId?: string;
    agentTeamNumber?: number;
    date?: string;
    clientName: string;
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
interface ClientListView {
    id: string;
    name: string;
    colOrder?: string[];
    /** Explicit list of column keys to show. If omitted, all columns are shown. */
    visibleCols?: string[];
    sortField?: string | null;
    sortDir?: "asc" | "desc";
    filterRows?: FilterRow[];
    builtIn?: boolean;
}
/** The five roles in your company. Owner and dev always have full access. */
type AppRole = "rep" | "manager" | "admin" | "owner" | "dev";
/** Per-column permission for a single role. */
interface ColPermission {
    view: boolean;
    edit: boolean;
}
/**
 * Full permissions matrix for the three configurable roles.
 * Keyed by column key (matches COLUMNS[].key).
 * Owner and dev bypass this entirely and always have full access.
 */
type PermissionsMatrix = {
    rep: Record<string, ColPermission>;
    manager: Record<string, ColPermission>;
    admin: Record<string, ColPermission>;
};
interface ClientListProps {
    /** All client records to display. */
    clients: ClientRecord[];
    /** Current user's UID — used to scope claimed/unclaimed logic. */
    uid?: string;
    /** Current user's display name — written to updatedByName on save. */
    userName?: string;
    /** Show admin-only columns (Agent Name, Contractor ID, Team). */
    isAdmin?: boolean;
    /** Managers see agent name + team but not all admin controls. */
    isManager?: boolean;
    /** Show the Claim/Unclaim action column. */
    showActions?: boolean;
    /** Whether records are still loading. Shows a spinner. */
    loading?: boolean;
    /** Whether more records can be fetched from the server. */
    hasMore?: boolean;
    /** Called when the user clicks "Load more". */
    onLoadMore?: () => Promise<void>;
    /**
     * Called when the user edits a cell and confirms.
     * Return a promise; the UI will optimistically update immediately.
     * `fromValue` is the original value before the edit — used for the audit log.
     */
    onSave?: (id: string, field: string, value: string | number, updaterName: string, fromValue?: string | number) => Promise<void>;
    /** Called when the user clicks "Claim" on a pending record. */
    onClaim?: (client: ClientRecord) => Promise<void>;
    /** Called when the user clicks "Unclaim" on a claimed record. */
    onUnclaim?: (client: ClientRecord) => Promise<void>;
    /** Controls the "claimed" column visibility (live mode hides it). */
    phase?: "testing" | "merging" | "live";
    /** YYYY-MM-DD cutoff — records before this date are "historical" and hidden unless toggled. */
    historicalCutoff?: string;
    /**
     * The current user's role. Owner and dev always have full access.
     * Rep, manager, and admin are gated by `permissions`.
     * Defaults to "owner" (full access) when omitted.
     */
    currentRole?: AppRole;
    /**
     * Column-level view/edit permissions per role.
     * When omitted, falls back to DEFAULT_PERMISSIONS.
     * Pass the return value of onSavePermissions back in to apply changes.
     */
    permissions?: PermissionsMatrix;
    /**
     * Called when an owner/dev saves the permissions matrix.
     * Persist this value (e.g. Firestore) and pass it back as `permissions`.
     */
    onSavePermissions?: (matrix: PermissionsMatrix) => Promise<void>;
    /** Display name for this list. Defaults to "Clients". */
    listTitle?: string;
    /** Initial sort column. Defaults to no sort (preserves data order from the hook). */
    initialSortField?: string | null;
    /** Initial sort direction. Defaults to "asc". */
    initialSortDir?: "asc" | "desc";
    /** Called when a permitted user renames the list. */
    onRenameList?: (name: string) => Promise<void>;
    /** Saved views shown in the toolbar. */
    views?: ClientListView[];
    /** Called when saving a new view. Returns the new view ID. */
    onSaveView?: (view: Omit<ClientListView, "id">) => Promise<string>;
    /** Called when deleting a saved view. */
    onDeleteView?: (id: string) => Promise<void>;
}
/**
 * Sensible out-of-the-box permissions.
 * Pass this as the `permissions` prop default, or let the component fall back to it.
 */
declare const DEFAULT_PERMISSIONS: PermissionsMatrix;
declare function ClientList({ clients: clientsProp, uid, userName, isAdmin, isManager, showActions, loading, hasMore, onLoadMore, onSave, onClaim, onUnclaim, phase, historicalCutoff, currentRole, permissions, onSavePermissions, listTitle, onRenameList, views: viewsProp, onSaveView, onDeleteView, initialSortField, initialSortDir, }: ClientListProps): react_jsx_runtime.JSX.Element;

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
    /**
     * Transform applied to form values before writing to Firestore.
     * Receives raw string values AND any uploaded file URLs keyed by field.key.
     * If omitted, values are written as-is (with type coercion for number/currency).
     */
    transformRecord?: (values: Record<string, string>, fileUrls: Record<string, string>) => Record<string, unknown>;
}
declare function OdsPanel({ collectionId, title, subtitle, uid, userName, isAdmin, currentRole, fields, transformRecord, }: OdsPanelProps): react_jsx_runtime.JSX.Element;

interface ReceiptItem {
    id: string;
    description: string;
    qty: number;
    unitPrice: number;
    total: number;
}
type ReceiptCategory = "Food & Dining" | "Travel" | "Transportation" | "Office Supplies" | "Utilities" | "Entertainment" | "Healthcare" | "Shopping" | "Other";
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

/**
 * useClientList
 *
 * Firestore-backed hook for the ClientList component.
 * Each call is scoped to a single Firestore collection (e.g. "clients").
 *
 * Data layout in Firestore:
 *   /{collectionId}/{docId}          ← client records
 *   /{collectionId}/_views/{viewId}  ← saved views for this list
 *   /permissions/{collectionId}      ← permissions matrix for this list
 *
 * Usage:
 *   const props = useClientList("clients");
 *   return <ClientList {...props} uid={user.uid} userName={user.displayName} />;
 *
 * To wire up a new portal:
 *   1. Update firebase.config.ts with the project credentials.
 *   2. Call this hook with the Firestore collection name for each list.
 *   3. Pass the returned props spread to <ClientList />.
 */

interface UseClientListResult {
    clients: ClientRecord[];
    views: ClientListView[];
    permissions: PermissionsMatrix;
    loading: boolean;
    hasMore: boolean;
    listTitle: string;
    onSave: (id: string, field: string, value: string | number, updaterName: string, fromValue?: string | number) => Promise<void>;
    onSaveView: (view: Omit<ClientListView, "id">) => Promise<string>;
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
    initialClients?: ClientRecord[];
    /** Seed saved views. */
    initialViews?: ClientListView[];
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
 *   /receipts/{docId}   ← receipt records (scoped to the authenticated user via uid)
 *
 * Usage:
 *   const props = useReceiptList(user.uid);
 *   return <ReceiptScanner {...props} processReceipt={processReceipt} />;
 */

interface UseReceiptListResult {
    receipts: ReceiptRecord[];
    loading: boolean;
    onSave: (record: Omit<ReceiptRecord, "id" | "createdAt">) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}
/**
 * @param uid  The current user's Firebase UID. Receipts are scoped per user.
 */
declare function useReceiptList(uid: string): UseReceiptListResult;

export { type AppRole, type ChangeRecord, ClientList, type ClientListProps, type ClientListView, type ClientRecord, type ColPermission, DEFAULT_PERMISSIONS, type FieldDef, type FieldType, type FilterRow, type MockOptions, OdsPanel, type OdsPanelProps, type PermissionsMatrix, type ReceiptCategory, type ReceiptItem, type ReceiptMockOptions, type ReceiptRecord, ReceiptScanner, type ReceiptScannerProps, type UseClientListResult, type UseReceiptListResult, type UserClaim, type UserClaimDisplayProps, useClientList, useClientListMock, useReceiptList, useReceiptListMock };
