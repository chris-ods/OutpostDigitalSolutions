import React, { useState, useMemo } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ColDef<T> {
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

export interface SimpleDataTableProps<T> {
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

// ── Component ──────────────────────────────────────────────────────────────────

export function SimpleDataTable<T>({
  rows,
  columns,
  getRowKey,
  searchQuery = "",
  initialSortField,
  initialSortDir = "asc",
  groupBy,
  groupOrder,
  renderGroupHeader,
  toolbar,
  onRowClick,
  loading = false,
  emptyMessage = "Nothing to show.",
  className = "",
}: SimpleDataTableProps<T>) {
  const [sortField, setSortField] = useState<string>(initialSortField ?? "");
  const [sortDir, setSortDir]     = useState<"asc" | "desc">(initialSortDir);

  function toggleSort(key: string) {
    if (sortField === key) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortField(key); setSortDir("asc"); }
  }

  // ── Filtered + sorted rows ─────────────────────────────────────────────────

  const displayRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    let result = q
      ? rows.filter(row =>
          columns.some(col => {
            if (col.searchable === false) return false;
            const val = col.accessor ? col.accessor(row) : (row as Record<string, unknown>)[col.key];
            return String(val ?? "").toLowerCase().includes(q);
          })
        )
      : rows;

    if (!sortField) return result;

    const col = columns.find(c => c.key === sortField);
    return [...result].sort((a, b) => {
      const av = col?.sortValue
        ? col.sortValue(a)
        : col?.accessor
          ? col.accessor(a)
          : (a as Record<string, unknown>)[sortField];
      const bv = col?.sortValue
        ? col.sortValue(b)
        : col?.accessor
          ? col.accessor(b)
          : (b as Record<string, unknown>)[sortField];

      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      const as = String(av ?? "").toLowerCase();
      const bs = String(bv ?? "").toLowerCase();
      return sortDir === "asc" ? as.localeCompare(bs) : bs.localeCompare(as);
    });
  }, [rows, columns, searchQuery, sortField, sortDir]);

  // ── Grouped structure ──────────────────────────────────────────────────────

  type GroupedItem =
    | { type: "header"; key: string; count: number }
    | { type: "row"; row: T };

  const grouped = useMemo((): GroupedItem[] | null => {
    if (!groupBy) return null;

    // Collect rows per group in encounter order
    const order: string[] = [];
    const map = new Map<string, T[]>();
    for (const row of displayRows) {
      const key = groupBy(row);
      if (!map.has(key)) { map.set(key, []); order.push(key); }
      map.get(key)!.push(row);
    }

    // Apply explicit order if provided
    const keys = groupOrder
      ? [...groupOrder.filter(k => map.has(k)), ...order.filter(k => !groupOrder.includes(k))]
      : order;

    const items: GroupedItem[] = [];
    for (const key of keys) {
      const groupRows = map.get(key) ?? [];
      if (groupRows.length === 0) continue;
      items.push({ type: "header", key, count: groupRows.length });
      for (const row of groupRows) items.push({ type: "row", row });
    }
    return items;
  }, [displayRows, groupBy, groupOrder]);

  // ── Cell value ─────────────────────────────────────────────────────────────

  function cellValue(col: ColDef<T>, row: T): unknown {
    return col.accessor ? col.accessor(row) : (row as Record<string, unknown>)[col.key];
  }

  function renderCell(col: ColDef<T>, row: T): React.ReactNode {
    const val = cellValue(col, row);
    return col.render ? col.render(val, row) : <span className="text-app-text-2 text-[12px]">{String(val ?? "—")}</span>;
  }

  // ── Default group header ───────────────────────────────────────────────────

  function defaultGroupHeader(key: string, count: number): React.ReactNode {
    return (
      <tr>
        <td colSpan={columns.length} className="px-3 pt-5 pb-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-app-text-4 whitespace-nowrap">
              {key}
            </span>
            <div className="flex-1 h-px bg-app-border" />
            <span className="text-[10px] text-app-text-5">{count}</span>
          </div>
        </td>
      </tr>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const rowClass = `border-b border-app-border hover:bg-app-surface/60 transition-colors${onRowClick ? " cursor-pointer" : ""}`;

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {toolbar && <div className="shrink-0">{toolbar}</div>}

      <div className="flex-1 overflow-auto">
        <table className="w-full text-[13px] border-collapse">
          <thead>
            <tr className="bg-app-bg sticky top-0 z-10 shadow-sm">
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                  className={`text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider border-b border-app-border whitespace-nowrap
                    ${col.sortable ? "cursor-pointer select-none text-app-text-4 hover:text-app-text-2" : "text-app-text-5"}
                    ${col.headerClassName ?? ""}`}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortField === col.key && (
                      <span className="text-blue-400 text-[10px]">{sortDir === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-20 text-app-text-5">
                  Loading…
                </td>
              </tr>
            ) : displayRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-20 text-app-text-2 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : grouped ? (
              grouped.map((item, i) =>
                item.type === "header" ? (
                  <React.Fragment key={`hdr-${item.key}-${i}`}>
                    {renderGroupHeader
                      ? renderGroupHeader(item.key, item.count)
                      : defaultGroupHeader(item.key, item.count)}
                  </React.Fragment>
                ) : (
                  <tr
                    key={getRowKey(item.row)}
                    className={rowClass}
                    onClick={onRowClick ? () => onRowClick(item.row) : undefined}
                  >
                    {columns.map(col => (
                      <td key={col.key} className={`px-3 py-2.5 max-w-[220px] ${col.className ?? ""}`}>
                        {renderCell(col, item.row)}
                      </td>
                    ))}
                  </tr>
                )
              )
            ) : (
              displayRows.map(row => (
                <tr
                  key={getRowKey(row)}
                  className={rowClass}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map(col => (
                    <td key={col.key} className={`px-3 py-2.5 max-w-[220px] ${col.className ?? ""}`}>
                      {renderCell(col, row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
