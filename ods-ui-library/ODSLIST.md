# OdsList — Reusable Data List Component

A production-grade, theme-adaptive, fully configurable data list for React applications. Supports table and expandable display modes, inline CRUD, role-based permissions, a dev-only schema editor, saved quick filters, and accessibility controls.

---

## Quick Start

```tsx
import { OdsList } from "ods-ui-library";
import type { OdsRecord, OdsColDef } from "ods-ui-library";

const columns: OdsColDef[] = [
  { key: "name", label: "Name", sortable: true, editable: true, filterType: "text" },
  { key: "email", label: "Email", sortable: true, editable: true, filterType: "text" },
  { key: "role", label: "Role", sortable: true, filterType: "enum", enumValues: ["Admin", "User"] },
];

const data: OdsRecord[] = [
  { id: "1", displayLabel: "Alice", name: "Alice", email: "alice@example.com", role: "Admin" },
  { id: "2", displayLabel: "Bob", name: "Bob", email: "bob@example.com", role: "User" },
];

<OdsList columns={columns} data={data} listTitle="Team" />
```

---

## Display Modes

### Table Mode (default)
Excel-like grid with column headers, inline editing (pencil/checkmark/x), column drag-to-reorder, multi-sort, and horizontal scrollbars.

### Expandable Mode
Same table layout for collapsed rows. Click a row to expand and reveal detail content below. Set `displayMode="expandable"` and provide `renderExpandedContent`.

```tsx
<OdsList
  columns={columns}
  data={data}
  displayMode="expandable"
  renderExpandedContent={(record) => <DetailPanel record={record} />}
/>
```

---

## OdsRecord

Every record must have `id`. Use `displayLabel` for the record's display name.

```typescript
interface OdsRecord {
  id: string;
  displayLabel?: string;       // primary display label
  clientName?: string;         // @deprecated — use displayLabel
  [key: string]: unknown;      // any additional fields
}
```

Use the `labelField` prop to specify which field is the display label:

```tsx
<OdsList columns={columns} data={data} labelField="name" />
```

---

## Column Definitions (OdsColDef)

```typescript
interface OdsColDef {
  key: string;                 // field key on OdsRecord
  label: string;               // column header text
  sortable?: boolean;          // clickable header for sorting
  editable?: boolean;          // inline edit with pencil icon
  filterType?: "enum" | "text" | "number" | "date";
  enumValues?: string[];       // dropdown options for enum type
  enumLabels?: Record<string, string>;  // display labels for enum values
  adminOnly?: boolean;         // only visible to admin+ roles
  meta?: boolean;              // read-only metadata (createdAt, etc.)
  noFilter?: boolean;          // exclude from filter builder
  render?: (value, record, helpers) => ReactNode;  // custom cell renderer
}
```

### Custom Render Functions

```tsx
{
  key: "role",
  label: "Role",
  render: (val, record, helpers) => (
    <span className={`badge ${val === "admin" ? "badge-blue" : "badge-gray"}`}>
      {String(val)}
    </span>
  ),
}
```

If a render function throws, the component catches it and displays "Render error" in red instead of crashing.

---

## Props Reference

### Data
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `columns` | `OdsColDef[]` | Yes | Column definitions |
| `data` | `OdsRecord[]` | Yes | Records to display |
| `loading` | `boolean` | No | Show loading spinner |
| `labelField` | `string` | No | Field key used as display label |

### Display
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `listTitle` | `string` | `"List"` | Title shown in header |
| `displayMode` | `"table" \| "expandable"` | `"table"` | Display mode |
| `initialSortField` | `string` | — | Initial sort column |
| `initialSortDir` | `"asc" \| "desc"` | `"desc"` | Initial sort direction |

### Expandable Mode
| Prop | Type | Description |
|------|------|-------------|
| `renderExpandedContent` | `(record) => ReactNode` | Custom expanded row content |
| `onExpandRow` | `(record) => void` | Callback when row expands |

### Grouping
| Prop | Type | Description |
|------|------|-------------|
| `groupBy` | `{ fn, groups }` | Group records by a function |

```tsx
groupBy={{
  fn: (r) => String(r.team),
  groups: [
    { key: "1", label: "TEAM 1", color: "#22c55e" },
    { key: "2", label: "TEAM 2", color: "#6366f1" },
  ],
}}
```

### User Context
| Prop | Type | Description |
|------|------|-------------|
| `uid` | `string` | Current user's UID |
| `userName` | `string` | Current user's display name |
| `currentRole` | `AppRole` | User's role (`"rep" \| "manager" \| "admin" \| "owner" \| "dev"`) |
| `isAdmin` | `boolean` | Show admin-only columns |

### Permissions
| Prop | Type | Description |
|------|------|-------------|
| `permissions` | `PermissionsMatrix` | Column-level CRUD permissions per role |
| `onSavePermissions` | `(matrix) => Promise<void>` | Persist permissions |

### Schema Editor (dev/owner only)
| Prop | Type | Description |
|------|------|-------------|
| `schema` | `OdsListSchema` | Saved schema overrides |
| `onSaveSchema` | `(schema) => Promise<void>` | Persist schema changes |

### Data Callbacks
| Prop | Type | Description |
|------|------|-------------|
| `onSave` | `(id, field, value, updaterName, fromValue?) => Promise<void>` | Cell edit confirmed |
| `onDeleteRecord` | `(id) => Promise<void>` | Delete entire record |
| `onDeleteField` | `(id, field) => Promise<void>` | Clear a field value |
| `onAddColumn` | `(key, defaultValue) => Promise<void>` | New column added by dev — write default to all docs |

### Views
| Prop | Type | Description |
|------|------|-------------|
| `views` | `OdsListView[]` | Saved view configurations |
| `onSaveView` | `(view) => Promise<string>` | Save new view |
| `onDeleteView` | `(id) => Promise<void>` | Delete saved view |

---

## Permissions (CRUD)

Each column has four permission flags per role:

| Flag | Controls |
|------|----------|
| **V** (View) | Column visibility |
| **C** (Create) | Can set value on new records |
| **E** (Edit) | Can inline-edit the cell |
| **D** (Delete) | Can clear/remove the value |

Owner and developer roles always bypass permissions.

```typescript
import { buildDefaultPermissions } from "ods-ui-library";

// Auto-generate full-access permissions from columns
const perms = buildDefaultPermissions(columns);
```

---

## Schema Editor

The wrench icon (visible to dev/owner roles) opens a slide-over panel with:

1. **Column Schema** — toggle sortable, editable, admin-only, visible per column. Drag to reorder.
2. **Default Sort** — field + direction
3. **Group By** — pick any column to group records by
4. **Quick Filters** — select enum columns for auto-generated pill buttons, create named filter presets
5. **Display Mode** — switch between table and expandable
6. **Add New Column** (dev only) — creates a new field on the collection

All columns from the data are auto-discovered and shown in the editor. The schema is saved to Firestore and merged with code-defined columns at render time. Code-defined `render` functions are preserved — the schema can only override labels, types, sort/edit/visible flags, and ordering.

---

## Quick Filters

Configurable from the Schema Editor:

**Auto Pills** — check enum columns to auto-generate pill buttons from distinct values.

**Saved Filter Presets** — create named filters with rules:
- Name + optional color
- Rules: field + operator (`is`, `contains`, `not`) + value
- Appear as pill buttons after auto pills

---

## Multi-Sort

- **Click** column header: sort asc → desc → clear
- **Shift+Click**: add secondary sort
- Sort indicator shows position: `1↑ 2↓`
- Active sorts shown below search bar with "Clear" button

---

## Inline Editing

1. Click cell → pencil icon
2. Click pencil → input appears (text, number, date, or select dropdown)
3. Checkmark saves, X cancels, trash clears the value
4. `onSave(id, field, newValue, userName, oldValue)` called
5. Optimistic update — reverts on error

---

## Delete

- **Delete Record**: trash icon per row → confirmation dialog → `onDeleteRecord(id)`
- **Delete Field**: trash icon in edit mode → confirmation dialog → `onDeleteField(id, field)`
- Controlled by `canDelete("_record")` and `canDelete(colKey)` permissions

---

## Theming

The component uses CSS variables that bridge to any theme system:

```css
--cl-bg          → page background
--cl-surface     → card/container background
--cl-surface-2   → elevated elements, inputs
--cl-border      → subtle borders
--cl-border-2    → pronounced borders
--cl-text        → primary text
--cl-text-2      → secondary text
--cl-text-3      → tertiary text
--cl-text-4      → placeholder, disabled
--cl-text-5      → very muted
--cl-accent      → primary action color
```

Override these variables in your app's CSS to match your theme. The component auto-adapts to light/dark mode when parent CSS variables change.

### Accessibility
- Built-in text size menu (S/M/L/XL) with localStorage persistence
- Geist Sans font with system fallbacks
- All spacing in rem for text-size scaling
- Keyboard: Escape cancels edits, Enter confirms, Shift+Click for multi-sort

---

## CSV Export

Click the download icon to export all filtered/sorted records as CSV. Headers and values are derived from visible columns.

---

## Error Handling

- Custom `render` functions are wrapped in try-catch — errors display "Render error" instead of crashing
- Schema save errors show a red banner in the editor
- Cell edit errors revert the optimistic update
- Confirmation dialogs prevent accidental deletes

---

## Integration Checklist

1. Define your columns (`OdsColDef[]`)
2. Query your data and map to `OdsRecord[]` with `id` and `displayLabel`
3. Pass `data`, `columns`, and `listTitle` to `<OdsList />`
4. Wire `onSave` for inline editing
5. Wire `onDeleteRecord` for row deletion
6. Pass `currentRole` for permission-gated features
7. Pass `schema`/`onSaveSchema` to enable the Schema Editor
8. Pass `permissions`/`onSavePermissions` to enable the Permissions Editor
9. Deploy Firestore rules for your schema/permissions storage docs

---

## Browser Support

- Chrome 111+
- Firefox 113+
- Safari 16.4+
- Edge 111+

`color-mix()` CSS is used for theme-adaptive colors. Older browsers will use CSS variable fallbacks.
