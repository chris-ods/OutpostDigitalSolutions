// UserClaimDisplay.tsx
import { jsx, jsxs } from "react/jsx-runtime";

// SimpleDataTable.tsx
import React, { useState, useMemo } from "react";
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function SimpleDataTable({
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
  className = ""
}) {
  const [sortField, setSortField] = useState(initialSortField ?? "");
  const [sortDir, setSortDir] = useState(initialSortDir);
  function toggleSort(key) {
    if (sortField === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else {
      setSortField(key);
      setSortDir("asc");
    }
  }
  const displayRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let result = q ? rows.filter(
      (row) => columns.some((col2) => {
        if (col2.searchable === false) return false;
        const val = col2.accessor ? col2.accessor(row) : row[col2.key];
        return String(val ?? "").toLowerCase().includes(q);
      })
    ) : rows;
    if (!sortField) return result;
    const col = columns.find((c) => c.key === sortField);
    return [...result].sort((a, b) => {
      const av = col?.sortValue ? col.sortValue(a) : col?.accessor ? col.accessor(a) : a[sortField];
      const bv = col?.sortValue ? col.sortValue(b) : col?.accessor ? col.accessor(b) : b[sortField];
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      const as = String(av ?? "").toLowerCase();
      const bs = String(bv ?? "").toLowerCase();
      return sortDir === "asc" ? as.localeCompare(bs) : bs.localeCompare(as);
    });
  }, [rows, columns, searchQuery, sortField, sortDir]);
  const grouped = useMemo(() => {
    if (!groupBy) return null;
    const order = [];
    const map = /* @__PURE__ */ new Map();
    for (const row of displayRows) {
      const key = groupBy(row);
      if (!map.has(key)) {
        map.set(key, []);
        order.push(key);
      }
      map.get(key).push(row);
    }
    const keys = groupOrder ? [...groupOrder.filter((k) => map.has(k)), ...order.filter((k) => !groupOrder.includes(k))] : order;
    const items = [];
    for (const key of keys) {
      const groupRows = map.get(key) ?? [];
      if (groupRows.length === 0) continue;
      items.push({ type: "header", key, count: groupRows.length });
      for (const row of groupRows) items.push({ type: "row", row });
    }
    return items;
  }, [displayRows, groupBy, groupOrder]);
  function cellValue(col, row) {
    return col.accessor ? col.accessor(row) : row[col.key];
  }
  function renderCell(col, row) {
    const val = cellValue(col, row);
    return col.render ? col.render(val, row) : /* @__PURE__ */ jsx2("span", { className: "text-app-text-2 text-[12px]", children: String(val ?? "\u2014") });
  }
  function defaultGroupHeader(key, count) {
    return /* @__PURE__ */ jsx2("tr", { children: /* @__PURE__ */ jsx2("td", { colSpan: columns.length, className: "px-3 pt-5 pb-1", children: /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx2("span", { className: "text-[10px] font-bold uppercase tracking-widest text-app-text-4 whitespace-nowrap", children: key }),
      /* @__PURE__ */ jsx2("div", { className: "flex-1 h-px bg-app-border" }),
      /* @__PURE__ */ jsx2("span", { className: "text-[10px] text-app-text-5", children: count })
    ] }) }) });
  }
  const rowClass = `border-b border-app-border hover:bg-app-surface/60 transition-colors${onRowClick ? " cursor-pointer" : ""}`;
  return /* @__PURE__ */ jsxs2("div", { className: `flex flex-col h-full ${className}`, children: [
    toolbar && /* @__PURE__ */ jsx2("div", { className: "shrink-0", children: toolbar }),
    /* @__PURE__ */ jsx2("div", { className: "flex-1 overflow-auto", children: /* @__PURE__ */ jsxs2("table", { className: "w-full text-[13px] border-collapse", children: [
      /* @__PURE__ */ jsx2("thead", { children: /* @__PURE__ */ jsx2("tr", { className: "bg-app-bg sticky top-0 z-10 shadow-sm", children: columns.map((col) => /* @__PURE__ */ jsx2(
        "th",
        {
          onClick: col.sortable ? () => toggleSort(col.key) : void 0,
          className: `text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider border-b border-app-border whitespace-nowrap
                    ${col.sortable ? "cursor-pointer select-none text-app-text-4 hover:text-app-text-2" : "text-app-text-5"}
                    ${col.headerClassName ?? ""}`,
          children: /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-1", children: [
            col.label,
            col.sortable && sortField === col.key && /* @__PURE__ */ jsx2("span", { className: "text-blue-400 text-[10px]", children: sortDir === "asc" ? "\u2191" : "\u2193" })
          ] })
        },
        col.key
      )) }) }),
      /* @__PURE__ */ jsx2("tbody", { children: loading ? /* @__PURE__ */ jsx2("tr", { children: /* @__PURE__ */ jsx2("td", { colSpan: columns.length, className: "text-center py-20 text-app-text-5", children: "Loading\u2026" }) }) : displayRows.length === 0 ? /* @__PURE__ */ jsx2("tr", { children: /* @__PURE__ */ jsx2("td", { colSpan: columns.length, className: "text-center py-20 text-app-text-2 text-sm", children: emptyMessage }) }) : grouped ? grouped.map(
        (item, i) => item.type === "header" ? /* @__PURE__ */ jsx2(React.Fragment, { children: renderGroupHeader ? renderGroupHeader(item.key, item.count) : defaultGroupHeader(item.key, item.count) }, `hdr-${item.key}-${i}`) : /* @__PURE__ */ jsx2(
          "tr",
          {
            className: rowClass,
            onClick: onRowClick ? () => onRowClick(item.row) : void 0,
            children: columns.map((col) => /* @__PURE__ */ jsx2("td", { className: `px-3 py-2.5 max-w-[220px] ${col.className ?? ""}`, children: renderCell(col, item.row) }, col.key))
          },
          getRowKey(item.row)
        )
      ) : displayRows.map((row) => /* @__PURE__ */ jsx2(
        "tr",
        {
          className: rowClass,
          onClick: onRowClick ? () => onRowClick(row) : void 0,
          children: columns.map((col) => /* @__PURE__ */ jsx2("td", { className: `px-3 py-2.5 max-w-[220px] ${col.className ?? ""}`, children: renderCell(col, row) }, col.key))
        },
        getRowKey(row)
      )) })
    ] }) })
  ] });
}

// ClientList.tsx
import React2, {
  useState as useState2,
  useMemo as useMemo2,
  useRef,
  useEffect,
  useCallback
} from "react";
import { createPortal } from "react-dom";

// OdsCard.tsx
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
function OdsCard({
  title,
  subtitle,
  icon,
  action,
  className = "",
  padding = "1.5rem",
  children,
  onClick
}) {
  return /* @__PURE__ */ jsxs3(
    "div",
    {
      className: `bg-app-surface border border-app-border text-app-text ${className}`,
      onClick,
      style: {
        borderRadius: "0.75rem",
        padding,
        cursor: onClick ? "pointer" : void 0,
        transition: "border-color 0.15s, box-shadow 0.15s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.12)"
      },
      onMouseEnter: (e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.15)";
        }
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.12)";
      },
      children: [
        (title || subtitle || icon || action) && /* @__PURE__ */ jsxs3("div", { style: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: children ? "1rem" : 0 }, children: [
          /* @__PURE__ */ jsxs3("div", { style: { display: "flex", alignItems: "center", gap: "0.75rem" }, children: [
            icon && /* @__PURE__ */ jsx3("div", { className: "text-app-accent", style: { flexShrink: 0 }, children: icon }),
            /* @__PURE__ */ jsxs3("div", { children: [
              title && /* @__PURE__ */ jsx3("h3", { className: "text-app-text", style: { margin: 0, fontSize: "0.9375rem", fontWeight: 600, lineHeight: 1.3 }, children: title }),
              subtitle && /* @__PURE__ */ jsx3("p", { className: "text-app-text-4", style: { margin: "0.125rem 0 0", fontSize: "0.75rem", lineHeight: 1.4 }, children: subtitle })
            ] })
          ] }),
          action && /* @__PURE__ */ jsx3("div", { style: { flexShrink: 0 }, children: action })
        ] }),
        children
      ]
    }
  );
}
function OdsStatCard({
  label,
  value,
  trend,
  trendValue,
  icon,
  accent,
  className = "",
  onClick
}) {
  const trendColor = trend === "up" ? "var(--app-success, #22c55e)" : trend === "down" ? "var(--app-danger, #ef4444)" : void 0;
  const trendArrow = trend === "up" ? "\u2191" : trend === "down" ? "\u2193" : "";
  return /* @__PURE__ */ jsxs3(
    "div",
    {
      className: `bg-app-surface border border-app-border text-app-text ${className}`,
      onClick,
      style: {
        borderRadius: "0.75rem",
        padding: "1.25rem 1.5rem",
        cursor: onClick ? "pointer" : void 0,
        transition: "border-color 0.15s, box-shadow 0.15s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.12)",
        display: "flex",
        alignItems: "center",
        gap: "1rem"
      },
      onMouseEnter: (e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.15)";
        }
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.12)";
      },
      children: [
        icon && /* @__PURE__ */ jsx3(
          "div",
          {
            className: `${accent ? "" : "bg-app-surface-2"} text-app-accent`,
            style: {
              width: "2.5rem",
              height: "2.5rem",
              borderRadius: "0.625rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              ...accent ? { background: `color-mix(in srgb, ${accent} 15%, transparent)`, color: accent } : {}
            },
            children: icon
          }
        ),
        /* @__PURE__ */ jsxs3("div", { style: { flex: 1, minWidth: 0 }, children: [
          /* @__PURE__ */ jsx3("p", { className: "text-app-text-4", style: { margin: 0, fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }, children: label }),
          /* @__PURE__ */ jsxs3("div", { style: { display: "flex", alignItems: "baseline", gap: "0.5rem", marginTop: "0.25rem" }, children: [
            /* @__PURE__ */ jsx3("span", { className: "text-app-text", style: { fontSize: "1.5rem", fontWeight: 700, lineHeight: 1 }, children: typeof value === "number" ? value.toLocaleString() : value }),
            trendValue && /* @__PURE__ */ jsxs3("span", { className: trend === "neutral" ? "text-app-text-4" : "", style: { fontSize: "0.6875rem", fontWeight: 600, color: trendColor }, children: [
              trendArrow,
              " ",
              trendValue
            ] })
          ] })
        ] })
      ]
    }
  );
}

// ClientList.tsx
import {
  CheckIcon,
  XMarkIcon,
  TrashIcon as HeroTrashIcon,
  PencilIcon as HeroPencilIcon,
  PencilSquareIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  UserIcon,
  EllipsisVerticalIcon
} from "@heroicons/react/24/outline";

// #style-inject:#style-inject
function styleInject(css, { insertAt } = {}) {
  if (!css || typeof document === "undefined") return;
  const head = document.head || document.getElementsByTagName("head")[0];
  const style = document.createElement("style");
  style.type = "text/css";
  if (insertAt === "top") {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }
  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

// ClientList.css
styleInject('.cl-root {\n  --cl-bg: var(--app-bg, #030712);\n  --cl-surface: var(--app-surface, #111827);\n  --cl-surface-2: var(--app-surface-2, #1f2937);\n  --cl-border: var(--app-border, #1f2937);\n  --cl-border-2: var(--app-border-2, #374151);\n  --cl-text: var(--app-text, #f9fafb);\n  --cl-text-2: var(--app-text-2, #d1d5db);\n  --cl-text-3: var(--app-text-3, #9ca3af);\n  --cl-text-4: var(--app-text-4, #6b7280);\n  --cl-text-5: var(--app-text-5, #4b5563);\n  --cl-accent: var(--app-accent, #3b82f6);\n  --cl-accent-dark: var(--app-accent-hover, #1d4ed8);\n  --cl-indigo: #6366f1;\n  --cl-green: #22c55e;\n  --cl-amber: #f59e0b;\n  --cl-red: #ef4444;\n  --cl-purple: #a855f7;\n  --cl-yellow: #facc15;\n  font-family:\n    var(--font-geist-sans, ui-sans-serif),\n    system-ui,\n    -apple-system,\n    sans-serif;\n  font-size: 0.8125rem;\n  background: var(--cl-surface);\n  color: var(--cl-text);\n  display: flex;\n  flex-direction: column;\n  flex-shrink: 0;\n  border-radius: 0.75rem;\n  border: 1px solid var(--cl-border);\n  overflow: hidden;\n}\n.cl-sticky-bars {\n  z-index: 30;\n  background: var(--cl-surface);\n  border-radius: 0.75rem 0.75rem 0 0;\n  flex-shrink: 0;\n}\n.cl-header {\n  border-bottom: 1px solid var(--cl-border);\n  padding: 1.25rem 1.5rem;\n}\n.cl-header-row {\n  display: flex;\n  align-items: flex-start;\n  justify-content: space-between;\n  gap: 1rem;\n  flex-wrap: wrap;\n}\n.cl-header-left {\n  display: flex;\n  align-items: center;\n  gap: 1rem;\n}\n.cl-header-accent {\n  width: 0.25rem;\n  height: 2.25rem;\n  border-radius: 9999px;\n  background: var(--cl-accent);\n}\n.cl-title {\n  font-size: 1.375rem;\n  font-weight: 700;\n  line-height: 1;\n  color: var(--cl-text);\n}\n.cl-subtitle {\n  font-size: 0.6875rem;\n  color: var(--cl-text-4);\n  margin-top: 0.375rem;\n}\n.cl-header-right {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n}\n.cl-search-area {\n  padding: 1.25rem 1.5rem 0.75rem;\n  display: flex;\n  flex-direction: column;\n  gap: 0.75rem;\n}\n.cl-search-wrap {\n  position: relative;\n}\n.cl-search-icon {\n  position: absolute;\n  left: 0.875rem;\n  top: 50%;\n  transform: translateY(-50%);\n  width: 1rem;\n  height: 1rem;\n  color: var(--cl-text-4);\n  pointer-events: none;\n}\n.cl-search-input {\n  width: 100%;\n  padding: 0.625rem 2.25rem 0.625rem 2.5rem;\n  background: var(--cl-surface);\n  border: 1px solid var(--cl-border-2);\n  border-radius: 0.625rem;\n  color: var(--cl-text);\n  font-size: 0.8125rem;\n  outline: none;\n  transition: border-color 0.15s, box-shadow 0.15s;\n  box-sizing: border-box;\n}\n.cl-search-input:focus {\n  border-color: var(--cl-accent);\n  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);\n  box-shadow: 0 0 0 2px color-mix(in srgb, var(--cl-accent) 25%, transparent);\n}\n.cl-search-input::placeholder {\n  color: var(--cl-text-4);\n}\n.cl-search-clear {\n  position: absolute;\n  right: 0.75rem;\n  top: 50%;\n  transform: translateY(-50%);\n  background: none;\n  border: none;\n  color: var(--cl-text-4);\n  cursor: pointer;\n  padding: 0.125rem;\n}\n.cl-search-clear:hover {\n  color: var(--cl-text);\n}\n.cl-pills {\n  display: flex;\n  align-items: center;\n  gap: 0;\n  flex-wrap: wrap;\n  background: var(--cl-surface-2);\n  border: 1px solid var(--cl-border-2);\n  border-radius: 0.5rem;\n  padding: 0.125rem;\n  width: fit-content;\n}\n.cl-pill-divider {\n  width: 1px;\n  height: 1.25rem;\n  background: var(--cl-border-2);\n  margin: 0 0.25rem;\n  flex-shrink: 0;\n}\n.cl-pill-label {\n  font-size: 0.5625rem;\n  font-weight: 700;\n  color: var(--cl-text-4);\n  text-transform: uppercase;\n  letter-spacing: 0.04em;\n  user-select: none;\n  white-space: nowrap;\n  padding: 0 0.125rem;\n}\n.cl-pill {\n  padding: 0.3125rem 0.625rem;\n  border-radius: 0.375rem;\n  font-size: 0.6875rem;\n  font-weight: 600;\n  border: none;\n  background: transparent;\n  color: var(--cl-text-3);\n  cursor: pointer;\n  transition: all 0.15s;\n  white-space: nowrap;\n  min-width: 2rem;\n  text-align: center;\n}\n.cl-pill:hover {\n  color: var(--cl-text);\n  background: color-mix(in srgb, var(--cl-text) 6%, transparent);\n}\n.cl-pill:focus-visible {\n  outline: 2px solid var(--cl-accent);\n  outline-offset: 1px;\n}\n.cl-pill.active {\n  background: color-mix(in srgb, var(--cl-accent) 15%, transparent);\n  color: var(--cl-accent);\n  font-weight: 700;\n  border-bottom: 2px solid var(--cl-accent);\n  border-radius: 0.375rem 0.375rem 0 0;\n}\n.cl-clear-btn {\n  margin-left: auto;\n  font-size: 0.6875rem;\n  color: var(--cl-text-4);\n  background: none;\n  border: none;\n  cursor: pointer;\n  display: flex;\n  align-items: center;\n  gap: 0.25rem;\n}\n.cl-clear-btn:hover {\n  color: var(--cl-text);\n}\n.cl-toolbar-row {\n  display: flex;\n  align-items: center;\n  border-bottom: 1px solid var(--cl-border);\n  position: relative;\n  z-index: 5;\n}\n.cl-toolbar {\n  flex: 1;\n  min-width: 0;\n  display: flex;\n  align-items: center;\n  gap: 0.625rem;\n  padding: 0.4375rem 1.5rem;\n  overflow-x: auto;\n  overflow-y: visible;\n}\n.cl-action-bar {\n  display: flex;\n  align-items: center;\n  flex-shrink: 0;\n  padding: 0 0.75rem;\n  position: relative;\n}\n.cl-action-toggle {\n  background: none;\n  border: none;\n  border-radius: 0.375rem;\n  color: var(--cl-text-4);\n  cursor: pointer;\n  padding: 0.3125rem 0.25rem;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  transition: background 0.15s, color 0.15s;\n}\n.cl-action-toggle:hover {\n  background: var(--cl-surface-2);\n  color: var(--cl-text-2);\n}\n.cl-action-toggle.active {\n  color: var(--cl-accent);\n}\n.cl-action-items {\n  display: flex;\n  align-items: center;\n  gap: 0.0625rem;\n  overflow: hidden;\n  max-width: 0;\n  opacity: 0;\n  transition: max-width 0.25s ease, opacity 0.2s ease;\n}\n.cl-action-items.open {\n  max-width: 20rem;\n  opacity: 1;\n}\n.cl-action-wrap {\n  position: relative;\n}\n.cl-action-btn {\n  background: none;\n  border: none;\n  border-radius: 0.375rem;\n  color: var(--cl-text-4);\n  cursor: pointer;\n  padding: 0.3125rem 0.375rem;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  transition: background 0.15s, color 0.15s;\n}\n.cl-action-btn:hover:not(:disabled) {\n  background: var(--cl-surface-2);\n  color: var(--cl-text-2);\n}\n.cl-action-btn.active {\n  color: var(--cl-accent);\n  background: rgba(59, 130, 246, 0.12);\n  background: color-mix(in srgb, var(--cl-accent) 12%, transparent);\n}\n.cl-action-btn:disabled {\n  opacity: 0.35;\n  cursor: not-allowed;\n}\n.cl-action-wrap .cl-export-menu {\n  right: 0;\n  top: calc(100% + 0.25rem);\n}\n.cl-day-seg {\n  display: flex;\n  align-items: center;\n  background: var(--cl-surface-2);\n  border: 1px solid var(--cl-border-2);\n  border-radius: 0.375rem;\n  padding: 0.125rem;\n  gap: 0.0625rem;\n  flex-shrink: 0;\n}\n.cl-day-btn {\n  background: none;\n  border: none;\n  border-radius: 0.25rem;\n  color: var(--cl-text-4);\n  font-size: 0.625rem;\n  font-weight: 600;\n  cursor: pointer;\n  padding: 0.1875rem 0.375rem;\n  line-height: 1;\n  transition: background 0.1s, color 0.1s;\n  white-space: nowrap;\n}\n.cl-day-btn:hover {\n  background: var(--cl-border-2);\n  color: var(--cl-text-2);\n}\n.cl-day-btn.active {\n  background: var(--cl-accent);\n  color: white;\n}\n.cl-day-week-btn {\n  font-size: 0.625rem;\n  padding: 0.1875rem 0.5rem;\n}\n.cl-day-sep {\n  width: 1px;\n  height: 0.875rem;\n  background: var(--cl-border-2);\n  margin: 0 0.125rem;\n  flex-shrink: 0;\n}\n.cl-toolbar-seg {\n  display: flex;\n  align-items: center;\n  background: var(--cl-surface-2);\n  border: 1px solid var(--cl-border-2);\n  border-radius: 0.5rem;\n  padding: 0.125rem;\n  gap: 0.0625rem;\n  flex-shrink: 0;\n}\n.cl-toolbar-view-item {\n  display: flex;\n  align-items: center;\n}\n.cl-seg-btn {\n  padding: 0.1875rem 0.625rem;\n  border-radius: 0.375rem;\n  font-size: 0.6875rem;\n  font-weight: 500;\n  border: none;\n  background: none;\n  color: var(--cl-text-4);\n  cursor: pointer;\n  white-space: nowrap;\n  transition: background 0.1s, color 0.1s;\n}\n.cl-seg-btn:hover {\n  background: var(--cl-border-2);\n  color: var(--cl-text-2);\n}\n.cl-seg-btn.active {\n  background: var(--cl-surface);\n  color: var(--cl-text);\n  box-shadow: 0 1px 3px rgba(249, 250, 251, 0.15);\n  box-shadow: 0 1px 3px color-mix(in srgb, var(--cl-text) 15%, transparent);\n}\n.cl-seg-delete {\n  display: flex;\n  align-items: center;\n  padding: 0.125rem 0.25rem 0.125rem 0;\n  background: none;\n  border: none;\n  color: var(--cl-text-5);\n  cursor: pointer;\n  opacity: 0;\n  transition: opacity 0.15s, color 0.15s;\n}\n.cl-toolbar-view-item:hover .cl-seg-delete {\n  opacity: 1;\n}\n.cl-seg-delete:hover {\n  color: var(--cl-red);\n}\n.cl-seg-add {\n  display: flex;\n  align-items: center;\n  gap: 0.25rem;\n  padding: 0.1875rem 0.625rem;\n  border-radius: 0.375rem;\n  font-size: 0.6875rem;\n  font-weight: 500;\n  border: 1px dashed var(--cl-border-2);\n  background: none;\n  color: var(--cl-text-4);\n  cursor: pointer;\n  white-space: nowrap;\n  transition: color 0.1s, border-color 0.1s;\n  flex-shrink: 0;\n}\n.cl-seg-add:hover {\n  color: var(--cl-text-2);\n  border-color: var(--cl-text-4);\n}\n.cl-toolbar-save-wrap {\n  display: flex;\n  align-items: center;\n  gap: 0.375rem;\n  flex-shrink: 0;\n}\n.cl-toolbar-save-input {\n  padding: 0.1875rem 0.5rem;\n  background: var(--cl-surface-2);\n  border: 1px solid var(--cl-border-2);\n  border-radius: 0.375rem;\n  color: var(--cl-text);\n  font-size: 0.6875rem;\n  outline: none;\n  width: 7.5rem;\n}\n.cl-toolbar-save-input:focus {\n  border-color: var(--cl-indigo);\n}\n.cl-toolbar-save-input::placeholder {\n  color: var(--cl-text-4);\n}\n.cl-toolbar-save-confirm {\n  padding: 0.1875rem 0.5rem;\n  background: var(--cl-indigo);\n  border: none;\n  border-radius: 0.375rem;\n  color: white;\n  font-size: 0.6875rem;\n  font-weight: 500;\n  cursor: pointer;\n}\n.cl-toolbar-save-confirm:hover:not(:disabled) {\n  background: rgba(99, 102, 241, 0.8);\n  background: color-mix(in srgb, var(--cl-indigo) 80%, var(--cl-bg));\n}\n.cl-toolbar-save-confirm:disabled {\n  opacity: 0.5;\n  cursor: default;\n}\n.cl-toolbar-save-cancel {\n  padding: 0.1875rem 0.5rem;\n  background: none;\n  border: none;\n  color: var(--cl-text-4);\n  font-size: 0.6875rem;\n  cursor: pointer;\n}\n.cl-toolbar-save-cancel:hover {\n  color: var(--cl-text);\n}\n.cl-title-editable {\n  cursor: pointer;\n}\n.cl-title-editable:hover {\n  color: var(--cl-accent);\n}\n.cl-rename-input {\n  font-size: 1.375rem;\n  font-weight: 700;\n  line-height: 1;\n  background: none;\n  border: none;\n  border-bottom: 2px solid var(--cl-accent);\n  color: var(--cl-text);\n  outline: none;\n  width: 16.25rem;\n  padding: 0 0.125rem;\n}\n.cl-table-area {\n  display: flex;\n  flex-direction: column;\n}\n.cl-table-wrap {\n  display: flex;\n  flex-direction: column;\n}\n.cl-table-scroll {\n  overflow-x: auto;\n  scrollbar-color: var(--cl-border-2) var(--cl-surface);\n  scrollbar-width: auto;\n  scrollbar-gutter: stable both-edges;\n}\n.cl-table-scroll::-webkit-scrollbar {\n  width: 0.625rem;\n  height: 0.625rem;\n  -webkit-appearance: none;\n}\n.cl-table-scroll::-webkit-scrollbar-track {\n  background: var(--cl-surface-2);\n  border-radius: 0.3125rem;\n}\n.cl-table-scroll::-webkit-scrollbar-thumb {\n  background: var(--cl-border-2);\n  border-radius: 0.3125rem;\n  border: 2px solid var(--cl-surface-2);\n  min-height: 2.5rem;\n}\n.cl-table-scroll::-webkit-scrollbar-thumb:hover {\n  background: var(--cl-text-4);\n}\n.cl-table-scroll::-webkit-scrollbar-corner {\n  background: var(--cl-surface-2);\n}\n.cl-hscroll-bar {\n  display: flex;\n  align-items: center;\n  flex-shrink: 0;\n}\n.cl-scroll-left-btn {\n  flex-shrink: 0;\n  width: 1.75rem;\n  height: 0.75rem;\n  background: var(--cl-surface-2);\n  border: none;\n  border-radius: 0 0 0 0.75rem;\n  color: var(--cl-text-3);\n  cursor: pointer;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-size: 1rem;\n  padding: 0;\n  line-height: 1;\n}\n.cl-scroll-left-btn:hover {\n  background: var(--cl-border-2);\n  color: var(--cl-text);\n}\n.cl-hscroll-track {\n  flex: 1;\n  height: 0.75rem;\n  background: var(--cl-surface-2);\n  border-radius: 0 0 0.75rem 0;\n  position: relative;\n  cursor: pointer;\n  user-select: none;\n}\n.cl-hscroll-thumb {\n  position: absolute;\n  top: 0.125rem;\n  height: 0.5rem;\n  background: var(--cl-border-2);\n  border-radius: 0.25rem;\n  cursor: grab;\n  transition: background 0.15s;\n}\n.cl-hscroll-thumb:hover {\n  background: var(--cl-text-4);\n}\n.cl-hscroll-thumb:active {\n  cursor: grabbing;\n  background: var(--cl-text-4);\n}\n.cl-table {\n  min-width: 100%;\n  width: max-content;\n  font-size: 0.6875rem;\n  white-space: nowrap;\n  border-collapse: collapse;\n}\n.cl-thead {\n  position: sticky;\n  top: 0;\n  z-index: 10;\n  background: var(--cl-surface);\n  border-bottom: 1px solid var(--cl-border);\n}\n.cl-th {\n  padding: 0.625rem 0.75rem;\n  text-align: left;\n  font-size: 0.6875rem;\n  color: var(--cl-text-3);\n  font-weight: 500;\n  white-space: nowrap;\n  transition: border-left 0.1s;\n}\n.cl-th.meta {\n  color: var(--cl-text-5);\n}\n.cl-th.drag-over {\n  border-left: 2px solid var(--cl-accent);\n  padding-left: 0.625rem;\n}\n.cl-th.dragging {\n  opacity: 0.4;\n}\n.cl-th-inner {\n  display: flex;\n  align-items: center;\n  gap: 0.25rem;\n}\n.cl-th-inner:hover .cl-drag-grip {\n  opacity: 1;\n}\n.cl-drag-grip {\n  cursor: grab;\n  color: var(--cl-text-5);\n  opacity: 0;\n  transition: opacity 0.15s;\n  flex-shrink: 0;\n  display: flex;\n  align-items: center;\n}\n.cl-drag-grip:active {\n  cursor: grabbing;\n}\n.cl-drag-grip:hover {\n  color: var(--cl-text-3);\n}\n.cl-sort-btn {\n  display: flex;\n  align-items: center;\n  gap: 0.25rem;\n  background: none;\n  border: none;\n  color: inherit;\n  font-size: inherit;\n  font-weight: inherit;\n  cursor: pointer;\n  padding: 0;\n}\n.cl-sort-btn:hover {\n  color: var(--cl-text);\n}\n.cl-sort-btn.sorted {\n  color: var(--cl-text);\n}\n.cl-sort-arrow {\n  font-size: 0.5625rem;\n  color: var(--cl-accent);\n}\n.cl-sort-arrow.unsorted {\n  color: var(--cl-text-5);\n}\n.cl-filter-btn {\n  padding: 0.125rem;\n  border-radius: 0.25rem;\n  background: none;\n  border: none;\n  cursor: pointer;\n  transition: color 0.15s;\n  opacity: 0;\n  display: flex;\n}\n.cl-th-inner:hover .cl-filter-btn {\n  opacity: 1;\n}\n.cl-filter-btn.filtered {\n  color: var(--cl-accent);\n  opacity: 1 !important;\n}\n.cl-filter-btn:not(.filtered) {\n  color: var(--cl-text-5);\n}\n.cl-filter-btn:not(.filtered):hover {\n  color: var(--cl-text-3);\n}\n.cl-filter-count {\n  font-size: 0.5625rem;\n  background: var(--cl-accent);\n  color: white;\n  border-radius: 9999px;\n  width: 0.875rem;\n  height: 0.875rem;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-weight: 700;\n  line-height: 1;\n  flex-shrink: 0;\n}\n.cl-th-actions {\n  position: sticky;\n  right: 0;\n  background: var(--cl-surface);\n  border-left: 1px solid rgba(31, 41, 55, 0.6);\n  border-left: 1px solid color-mix(in srgb, var(--cl-border) 60%, transparent);\n  padding: 0.625rem 0.75rem;\n  color: var(--cl-text-3);\n  font-weight: 500;\n  font-size: 0.6875rem;\n}\n.cl-tr {\n  border-bottom: 1px solid rgba(31, 41, 55, 0.5);\n  border-bottom: 1px solid color-mix(in srgb, var(--cl-border) 50%, transparent);\n  transition: background 0.1s;\n}\n.cl-tr:last-child {\n  border-bottom: 0;\n}\n.cl-tr:hover {\n  background: rgba(31, 41, 55, 0.2);\n  background: color-mix(in srgb, var(--cl-surface-2) 20%, transparent);\n}\n.cl-tr-section {\n  border-bottom: 1px solid;\n}\n.cl-tr-section td {\n  padding: 0.375rem 0.75rem;\n}\n.cl-section-label {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n}\n.cl-section-dot {\n  width: 0.5rem;\n  height: 0.5rem;\n  border-radius: 9999px;\n  flex-shrink: 0;\n}\n.cl-section-dot.pulse {\n  animation: pulse 1.5s infinite;\n}\n.cl-section-title {\n  font-size: 0.5625rem;\n  font-weight: 700;\n  text-transform: uppercase;\n  letter-spacing: 0.15em;\n}\n.cl-section-count {\n  font-size: 0.5625rem;\n  color: var(--cl-text-5);\n}\n@keyframes pulse {\n  0%, 100% {\n    opacity: 1;\n  }\n  50% {\n    opacity: 0.4;\n  }\n}\n.cl-td {\n  padding: 0.5rem 0.75rem;\n  font-size: 0.6875rem;\n  color: var(--cl-text-2);\n}\n.cl-td.text-primary {\n  color: var(--cl-text);\n  font-weight: 500;\n}\n.cl-td.mono {\n  font-family: ui-monospace, monospace;\n}\n.cl-td.meta {\n  color: var(--cl-text-5);\n}\n.cl-td.narrow {\n  width: 1.5rem;\n}\n.cl-td-actions {\n  position: sticky;\n  right: 0;\n  background: var(--cl-bg);\n  border-left: 1px solid rgba(31, 41, 55, 0.6);\n  border-left: 1px solid color-mix(in srgb, var(--cl-border) 60%, transparent);\n  padding: 0.5rem 0.75rem;\n}\n.cl-cell-edit {\n  display: flex;\n  align-items: center;\n  gap: 0.25rem;\n  cursor: pointer;\n}\n.cl-cell-edit:hover .cl-pencil {\n  opacity: 1;\n}\n.cl-pencil {\n  opacity: 0;\n  transition: opacity 0.15s;\n  flex-shrink: 0;\n  color: var(--cl-text-5);\n}\n.cl-cell-edit-wrap {\n  display: flex;\n  flex-direction: column;\n  gap: 0.3125rem;\n}\n.cl-cell-input {\n  background: var(--cl-surface-2);\n  border: 1px solid var(--cl-accent);\n  border-radius: 0.3125rem;\n  color: var(--cl-text);\n  font-size: 0.75rem;\n  padding: 0.3125rem 0.5rem;\n  outline: none;\n  min-width: 9.375rem;\n  width: 100%;\n  box-sizing: border-box;\n  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);\n  box-shadow: 0 0 0 2px color-mix(in srgb, var(--cl-accent) 20%, transparent);\n}\n.cl-cell-actions {\n  display: flex;\n  gap: 0.3125rem;\n}\n.cl-cell-cancel-btn,\n.cl-cell-confirm-btn {\n  width: 1.125rem;\n  height: 1.125rem;\n  border-radius: 50%;\n  border: none;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  cursor: pointer;\n  flex-shrink: 0;\n  transition: opacity 0.1s;\n}\n.cl-cell-cancel-btn {\n  background: var(--cl-red);\n  color: white;\n}\n.cl-cell-confirm-btn {\n  background: var(--cl-green);\n  color: white;\n}\n.cl-cell-cancel-btn:hover,\n.cl-cell-confirm-btn:hover {\n  opacity: 0.85;\n}\n.cl-cell-select {\n  background: var(--cl-surface-2);\n  border: 1px solid var(--cl-accent);\n  border-radius: 0.25rem;\n  color: var(--cl-text);\n  font-size: 0.6875rem;\n  padding: 0.125rem 0.25rem;\n  outline: none;\n  width: 100%;\n}\n.cl-inline-select-wrap {\n  display: inline-flex;\n  align-items: center;\n}\n.cl-cell-select-plain {\n  background: transparent;\n  border: none;\n  color: var(--cl-text-2);\n  font: inherit;\n  font-size: 0.6875rem;\n  cursor: pointer;\n  outline: none;\n  -webkit-appearance: auto;\n  appearance: auto;\n  padding: 0;\n  max-width: 7.5rem;\n}\n.cl-cell-select-plain:hover {\n  color: var(--cl-text);\n}\n.cl-badge-select {\n  font: inherit;\n  cursor: pointer;\n  outline: none;\n  border: none;\n  -webkit-appearance: auto;\n  appearance: auto;\n}\n.cl-badge {\n  display: inline-flex;\n  align-items: center;\n  padding: 0.125rem 0.375rem;\n  border-radius: 0.25rem;\n  border: 1px solid;\n  font-size: 0.5625rem;\n  font-weight: 500;\n}\n.cl-badge.approved {\n  background: rgba(34, 197, 94, 0.15);\n  background: color-mix(in srgb, var(--cl-green) 15%, transparent);\n  color: var(--cl-green);\n  border-color: rgba(34, 197, 94, 0.3);\n  border-color: color-mix(in srgb, var(--cl-green) 30%, transparent);\n}\n.cl-badge.declined {\n  background: rgba(239, 68, 68, 0.15);\n  background: color-mix(in srgb, var(--cl-red) 15%, transparent);\n  color: var(--cl-red);\n  border-color: rgba(239, 68, 68, 0.3);\n  border-color: color-mix(in srgb, var(--cl-red) 30%, transparent);\n}\n.cl-badge.sent-uw {\n  background: rgba(59, 130, 246, 0.15);\n  background: color-mix(in srgb, var(--cl-accent) 15%, transparent);\n  color: var(--cl-accent);\n  border-color: rgba(59, 130, 246, 0.3);\n  border-color: color-mix(in srgb, var(--cl-accent) 30%, transparent);\n}\n.cl-badge.pending {\n  background: rgba(245, 158, 11, 0.15);\n  background: color-mix(in srgb, var(--cl-amber) 15%, transparent);\n  color: var(--cl-amber);\n  border-color: rgba(245, 158, 11, 0.3);\n  border-color: color-mix(in srgb, var(--cl-amber) 30%, transparent);\n}\n.cl-badge.cancelled {\n  background: var(--cl-surface-2);\n  color: var(--cl-text-4);\n  border-color: var(--cl-border-2);\n}\n.cl-badge.split {\n  background: rgba(168, 85, 247, 0.15);\n  background: color-mix(in srgb, var(--cl-purple) 15%, transparent);\n  color: var(--cl-purple);\n  border-color: rgba(168, 85, 247, 0.3);\n  border-color: color-mix(in srgb, var(--cl-purple) 30%, transparent);\n}\n.cl-badge.alp {\n  background: rgba(245, 158, 11, 0.15);\n  background: color-mix(in srgb, var(--cl-amber) 15%, transparent);\n  color: var(--cl-amber);\n  border-color: rgba(245, 158, 11, 0.3);\n  border-color: color-mix(in srgb, var(--cl-amber) 30%, transparent);\n}\n.cl-badge.special {\n  background: rgba(245, 158, 11, 0.15);\n  background: color-mix(in srgb, var(--cl-amber) 15%, transparent);\n  color: var(--cl-amber);\n  border-color: rgba(245, 158, 11, 0.3);\n  border-color: color-mix(in srgb, var(--cl-amber) 30%, transparent);\n}\n.cl-badge.unclaimed {\n  color: var(--cl-amber);\n}\n.cl-badge.claimed {\n  color: var(--cl-green);\n}\n.cl-note-text {\n  color: var(--cl-yellow);\n  display: block;\n}\n.cl-note-add {\n  color: var(--cl-text-5);\n  font-style: italic;\n}\n.cl-no-agent {\n  color: var(--cl-text-5);\n  font-style: italic;\n}\n.cl-dup-warn {\n  color: var(--cl-red);\n  font-weight: 600;\n}\n.cl-premium {\n  font-weight: 600;\n}\n.cl-spinner {\n  width: 0.75rem;\n  height: 0.75rem;\n  border: 2px solid var(--cl-border-2);\n  border-top-color: var(--cl-accent);\n  border-radius: 50%;\n  animation: cl-spin 0.7s linear infinite;\n  flex-shrink: 0;\n}\n@keyframes cl-spin {\n  to {\n    transform: rotate(360deg);\n  }\n}\n.cl-export-wrap {\n  position: relative;\n}\n.cl-export-btn {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  padding: 0.5rem 1rem;\n  background: var(--cl-surface-2);\n  border: 1px solid var(--cl-border-2);\n  border-radius: 0.5rem;\n  color: var(--cl-text-2);\n  font-size: 0.8125rem;\n  font-weight: 500;\n  cursor: pointer;\n  transition: background 0.15s;\n}\n.cl-export-btn:hover:not(:disabled) {\n  background: var(--cl-border-2);\n}\n.cl-export-btn:disabled {\n  opacity: 0.4;\n  cursor: not-allowed;\n}\n.cl-export-menu {\n  position: absolute;\n  right: 0;\n  top: calc(100% + 0.375rem);\n  z-index: 100;\n  background: var(--cl-surface);\n  border: 1px solid var(--cl-border-2);\n  border-radius: 0.75rem;\n  box-shadow: 0 20px 40px rgba(249, 250, 251, 0.12);\n  box-shadow: 0 20px 40px color-mix(in srgb, var(--cl-text) 12%, transparent);\n  width: 15rem;\n  overflow: hidden;\n}\n.cl-export-menu-header {\n  padding: 0.75rem 1rem;\n  border-bottom: 1px solid var(--cl-border);\n}\n.cl-export-menu-title {\n  font-size: 0.75rem;\n  font-weight: 600;\n  color: var(--cl-text-2);\n}\n.cl-export-menu-sub {\n  font-size: 0.6875rem;\n  color: var(--cl-text-4);\n  margin-top: 0.125rem;\n}\n.cl-export-menu-body {\n  padding: 0.75rem 1rem;\n}\n.cl-export-dl-btn {\n  width: 100%;\n  padding: 0.5rem;\n  background: var(--cl-accent);\n  border: none;\n  border-radius: 0.5rem;\n  color: white;\n  font-size: 0.8125rem;\n  font-weight: 600;\n  cursor: pointer;\n  transition: background 0.15s;\n}\n.cl-export-dl-btn:hover {\n  background: var(--cl-accent-dark);\n}\n.cl-day-week-pick {\n  display: inline-flex;\n  align-items: center;\n  gap: 0.1875rem;\n}\n.cl-week-dropdown {\n  position: absolute;\n  left: 0;\n  top: calc(100% + 0.25rem);\n  z-index: 100;\n  background: var(--cl-surface);\n  border: 1px solid var(--cl-border-2);\n  border-radius: 0.75rem;\n  box-shadow: 0 20px 40px rgba(249, 250, 251, 0.12);\n  box-shadow: 0 20px 40px color-mix(in srgb, var(--cl-text) 12%, transparent);\n  width: 14.5rem;\n  overflow: hidden;\n}\n.cl-wcal {\n  padding: 0.625rem 0.625rem 0;\n}\n.cl-wcal-nav {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  margin-bottom: 0.5rem;\n}\n.cl-wcal-month {\n  font-size: 0.6875rem;\n  font-weight: 600;\n  color: var(--cl-text-2);\n}\n.cl-wcal-nav-btn {\n  background: none;\n  border: none;\n  cursor: pointer;\n  color: var(--cl-text-4);\n  font-size: 0.875rem;\n  line-height: 1;\n  padding: 0.125rem 0.375rem;\n  border-radius: 0.25rem;\n  transition: background 0.1s, color 0.1s;\n}\n.cl-wcal-nav-btn:hover {\n  background: var(--cl-border-2);\n  color: var(--cl-text-1);\n}\n.cl-wcal-grid {\n  display: grid;\n  grid-template-columns: repeat(7, 1fr);\n  gap: 0.0625rem;\n  margin-bottom: 0.5rem;\n}\n.cl-wcal-hdr {\n  font-size: 0.5625rem;\n  font-weight: 600;\n  color: var(--cl-text-5);\n  text-align: center;\n  padding-bottom: 0.1875rem;\n  text-transform: uppercase;\n}\n.cl-wcal-day {\n  background: none;\n  border: none;\n  cursor: pointer;\n  font-size: 0.625rem;\n  color: var(--cl-text-4);\n  padding: 0.25rem 0.125rem;\n  border-radius: 0.25rem;\n  text-align: center;\n  line-height: 1;\n  transition: background 0.1s, color 0.1s;\n  position: relative;\n}\n.cl-wcal-day:hover {\n  background: var(--cl-border-2);\n  color: var(--cl-text-1);\n}\n.cl-wcal-day.out {\n  color: var(--cl-text-6, #444);\n}\n.cl-wcal-day.today {\n  font-weight: 700;\n  color: var(--cl-accent);\n}\n.cl-wcal-day.has-data::after {\n  content: "";\n  position: absolute;\n  bottom: 0.125rem;\n  left: 50%;\n  transform: translateX(-50%);\n  width: 0.1875rem;\n  height: 0.1875rem;\n  border-radius: 50%;\n  background: var(--cl-accent);\n  opacity: 0.5;\n}\n.cl-wcal-day.sel {\n  background: var(--cl-accent);\n  color: white;\n}\n.cl-wcal-day.sel.today {\n  background: var(--cl-accent);\n}\n.cl-export-btn.active {\n  background: var(--cl-border-2);\n}\n.cl-col-picker-menu {\n  width: 13.75rem;\n}\n.cl-col-picker-body {\n  padding: 0.5rem;\n  max-height: 20rem;\n  overflow-y: auto;\n}\n.cl-col-picker-row {\n  display: flex;\n  align-items: center;\n  gap: 0.625rem;\n  padding: 0.375rem 0.5rem;\n  border-radius: 0.375rem;\n  cursor: pointer;\n  font-size: 0.8125rem;\n  color: var(--cl-text-2);\n  user-select: none;\n}\n.cl-col-picker-row:hover {\n  background: var(--cl-surface-2);\n}\n.cl-col-picker-row input[type=checkbox] {\n  accent-color: var(--cl-accent);\n  width: 0.875rem;\n  height: 0.875rem;\n  flex-shrink: 0;\n  cursor: pointer;\n}\n.cl-col-picker-reset {\n  background: none;\n  border: 1px solid var(--cl-border-2);\n  border-radius: 0.375rem;\n  color: var(--cl-text-3);\n  font-size: 0.6875rem;\n  font-weight: 500;\n  padding: 0.1875rem 0.5rem;\n  cursor: pointer;\n}\n.cl-col-picker-reset:hover {\n  background: var(--cl-surface-2);\n  color: var(--cl-text-2);\n}\n.cl-active-filters {\n  padding: 0 1.5rem 1rem;\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  flex-wrap: wrap;\n}\n.cl-active-filters-label {\n  font-size: 0.6875rem;\n  color: var(--cl-text-4);\n}\n.cl-filter-chip {\n  display: flex;\n  align-items: center;\n  gap: 0.25rem;\n  padding: 0.125rem 0.5rem;\n  background: rgba(59, 130, 246, 0.15);\n  background: color-mix(in srgb, var(--cl-accent) 15%, transparent);\n  border: 1px solid rgba(59, 130, 246, 0.3);\n  border: 1px solid color-mix(in srgb, var(--cl-accent) 30%, transparent);\n  border-radius: 9999px;\n  font-size: 0.6875rem;\n  color: var(--cl-accent);\n  white-space: nowrap;\n}\n.cl-filter-chip-remove {\n  background: none;\n  border: none;\n  color: inherit;\n  cursor: pointer;\n  padding: 0;\n  line-height: 1;\n  margin-left: 0.125rem;\n}\n.cl-filter-chip-remove:hover {\n  color: white;\n}\n.cl-filter-clear-all {\n  font-size: 0.6875rem;\n  color: var(--cl-text-4);\n  background: none;\n  border: none;\n  cursor: pointer;\n}\n.cl-filter-clear-all:hover {\n  color: var(--cl-red);\n}\n.cl-perm-btn {\n  display: flex;\n  align-items: center;\n  gap: 0.375rem;\n  padding: 0.4375rem 0.75rem;\n  background: var(--cl-surface-2);\n  border: 1px solid var(--cl-border-2);\n  border-radius: 0.5rem;\n  color: var(--cl-text-3);\n  font-size: 0.75rem;\n  font-weight: 500;\n  cursor: pointer;\n  transition: all 0.15s;\n  white-space: nowrap;\n}\n.cl-perm-btn:hover {\n  color: var(--cl-text);\n  border-color: var(--cl-text-4);\n}\n.cl-perm-btn.active {\n  background: rgba(99, 102, 241, 0.15);\n  background: color-mix(in srgb, var(--cl-indigo) 15%, transparent);\n  border-color: rgba(99, 102, 241, 0.6);\n  border-color: color-mix(in srgb, var(--cl-indigo) 60%, transparent);\n  color: var(--cl-indigo);\n}\n.cl-perm {\n  margin: 0 0 0 0;\n  border-bottom: 1px solid var(--cl-border);\n  background: var(--cl-surface);\n}\n.cl-perm-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 0.75rem 1.5rem;\n  border-bottom: 1px solid var(--cl-border);\n  background: rgba(31, 41, 55, 0.5);\n  background: color-mix(in srgb, var(--cl-surface-2) 50%, transparent);\n}\n.cl-perm-title {\n  font-size: 0.8125rem;\n  font-weight: 600;\n  color: var(--cl-text);\n  margin-right: 0.5rem;\n}\n.cl-perm-subtitle {\n  font-size: 0.6875rem;\n  color: var(--cl-text-4);\n}\n.cl-perm-save {\n  padding: 0.375rem 0.875rem;\n  background: var(--cl-indigo);\n  border: none;\n  border-radius: 0.375rem;\n  color: white;\n  font-size: 0.75rem;\n  font-weight: 600;\n  cursor: pointer;\n  transition: background 0.15s;\n}\n.cl-perm-save:hover:not(:disabled) {\n  background: rgba(99, 102, 241, 0.8);\n  background: color-mix(in srgb, var(--cl-indigo) 80%, var(--cl-bg));\n}\n.cl-perm-save:disabled {\n  opacity: 0.5;\n  cursor: default;\n}\n.cl-perm-close {\n  padding: 0.25rem;\n  background: none;\n  border: none;\n  color: var(--cl-text-4);\n  cursor: pointer;\n  border-radius: 0.25rem;\n  display: flex;\n  align-items: center;\n  transition: color 0.15s;\n}\n.cl-perm-close:hover {\n  color: var(--cl-text);\n}\n.cl-perm-scroll {\n  overflow-x: auto;\n  max-height: 26.25rem;\n  overflow-y: auto;\n}\n.cl-perm-table {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 0.75rem;\n}\n.cl-perm-th {\n  padding: 0.5rem 0.75rem;\n  text-align: center;\n  font-size: 0.6875rem;\n  font-weight: 600;\n  color: var(--cl-text-3);\n  background: var(--cl-surface);\n  border-bottom: 1px solid var(--cl-border);\n  position: sticky;\n  top: 0;\n  z-index: 2;\n}\n.cl-perm-th.cl-perm-col-label {\n  text-align: left;\n  min-width: 8.75rem;\n}\n.cl-perm-th.cl-perm-role-group {\n  border-left: 1px solid var(--cl-border-2);\n  color: var(--cl-text-2);\n  font-size: 0.75rem;\n}\n.cl-perm-th.cl-perm-sub {\n  font-weight: 400;\n  color: var(--cl-text-4);\n  font-size: 0.625rem;\n}\n.cl-perm-th.cl-perm-sub:nth-child(odd) {\n  border-left: 1px solid var(--cl-border-2);\n}\n.cl-perm-tr {\n  border-bottom: 1px solid rgba(31, 41, 55, 0.4);\n  border-bottom: 1px solid color-mix(in srgb, var(--cl-border) 40%, transparent);\n}\n.cl-perm-tr:hover {\n  background: rgba(31, 41, 55, 0.3);\n  background: color-mix(in srgb, var(--cl-surface-2) 30%, transparent);\n}\n.cl-perm-td {\n  padding: 0.4375rem 0.75rem;\n}\n.cl-perm-td.cl-perm-col-name {\n  font-size: 0.75rem;\n  color: var(--cl-text-2);\n  display: flex;\n  align-items: center;\n  gap: 0.375rem;\n}\n.cl-perm-td.cl-perm-cell {\n  text-align: center;\n  border-left: 1px solid rgba(31, 41, 55, 0.4);\n  border-left: 1px solid color-mix(in srgb, var(--cl-border) 40%, transparent);\n}\n.cl-perm-td.cl-perm-cell:nth-child(odd) {\n  border-left: 1px solid var(--cl-border-2);\n}\n.cl-perm-check {\n  width: 0.9375rem;\n  height: 0.9375rem;\n  accent-color: var(--cl-indigo);\n  cursor: pointer;\n  border-radius: 0.1875rem;\n}\n.cl-perm-check:disabled {\n  opacity: 0.25;\n  cursor: default;\n}\n.cl-perm-tag {\n  font-size: 0.5625rem;\n  font-weight: 600;\n  text-transform: uppercase;\n  padding: 0.0625rem 0.3125rem;\n  border-radius: 0.25rem;\n  letter-spacing: 0.05em;\n  background: rgba(31, 41, 55, 0.8);\n  background: color-mix(in srgb, var(--cl-surface-2) 80%, transparent);\n  border: 1px solid var(--cl-border-2);\n  color: var(--cl-text-5);\n}\n.cl-search-row {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n}\n.cl-search-row .cl-search-wrap {\n  flex: 1;\n}\n.cl-filter-toggle {\n  display: flex;\n  align-items: center;\n  gap: 0.375rem;\n  flex-shrink: 0;\n  padding: 0.5625rem 0.875rem;\n  background: var(--cl-surface-2);\n  border: 1px solid var(--cl-border-2);\n  border-radius: 0.625rem;\n  color: var(--cl-text-3);\n  font-size: 0.8125rem;\n  font-weight: 500;\n  cursor: pointer;\n  transition: all 0.15s;\n  white-space: nowrap;\n}\n.cl-filter-toggle:hover {\n  color: var(--cl-text);\n  border-color: var(--cl-text-4);\n}\n.cl-filter-toggle.active {\n  background: rgba(59, 130, 246, 0.15);\n  background: color-mix(in srgb, var(--cl-accent) 15%, transparent);\n  border-color: rgba(59, 130, 246, 0.6);\n  border-color: color-mix(in srgb, var(--cl-accent) 60%, transparent);\n  color: var(--cl-accent);\n}\n.cl-filter-toggle-count {\n  background: var(--cl-accent);\n  color: white;\n  border-radius: 9999px;\n  padding: 0 0.3125rem;\n  font-size: 0.625rem;\n  font-weight: 700;\n  line-height: 1rem;\n}\n.cl-fb {\n  margin-top: 0.5rem;\n  background: var(--cl-surface);\n  border: 1px solid var(--cl-border-2);\n  border-radius: 0.625rem;\n  overflow: hidden;\n}\n.cl-fb-empty {\n  padding: 0.75rem 1.25rem;\n  font-size: 0.75rem;\n  color: var(--cl-text-4);\n  margin: 0;\n}\n.cl-fb-row {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  padding: 0.5rem 1.25rem;\n  border-bottom: 1px solid rgba(31, 41, 55, 0.6);\n  border-bottom: 1px solid color-mix(in srgb, var(--cl-border) 60%, transparent);\n}\n.cl-fb-row:last-of-type {\n  border-bottom: none;\n}\n.cl-fb-where {\n  font-size: 0.6875rem;\n  font-weight: 600;\n  color: var(--cl-text-4);\n  text-transform: uppercase;\n  letter-spacing: 0.08em;\n  flex-shrink: 0;\n  width: 2.25rem;\n  margin-right: 0.5rem;\n}\n.cl-fb-select {\n  padding: 0.25rem 0.375rem;\n  background: var(--cl-surface-2);\n  border: 1px solid var(--cl-border-2);\n  border-radius: 0.375rem;\n  color: var(--cl-text);\n  font-size: 0.625rem;\n  outline: none;\n  cursor: pointer;\n  transition: border-color 0.15s;\n}\n.cl-fb-select:focus {\n  border-color: var(--cl-accent);\n}\n.cl-fb-select-op {\n  min-width: 4.5rem;\n}\n.cl-fb-select-val {\n  flex: 1;\n}\n.cl-fb-input {\n  padding: 0.25rem 0.375rem;\n  background: var(--cl-surface-2);\n  border: 1px solid var(--cl-border-2);\n  border-radius: 0.375rem;\n  color: var(--cl-text);\n  font-size: 0.625rem;\n  outline: none;\n  transition: border-color 0.15s;\n  min-width: 4rem;\n}\n.cl-fb-input:focus {\n  border-color: var(--cl-accent);\n}\n.cl-fb-input::placeholder {\n  color: var(--cl-text-4);\n}\n.cl-fb-input-wide {\n  flex: 1;\n}\n.cl-fb-and {\n  font-size: 0.6875rem;\n  color: var(--cl-text-4);\n  flex-shrink: 0;\n}\n.cl-fb-remove {\n  flex-shrink: 0;\n  background: none;\n  border: none;\n  color: var(--cl-text-5);\n  cursor: pointer;\n  padding: 0.25rem;\n  border-radius: 0.25rem;\n  display: flex;\n  align-items: center;\n  transition: color 0.15s;\n}\n.cl-fb-remove:hover {\n  color: var(--cl-red);\n}\n.cl-fb-footer {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n  padding: 0.5rem 1.25rem;\n  border-top: 1px solid rgba(31, 41, 55, 0.6);\n  border-top: 1px solid color-mix(in srgb, var(--cl-border) 60%, transparent);\n  background: rgba(31, 41, 55, 0.4);\n  background: color-mix(in srgb, var(--cl-surface-2) 40%, transparent);\n}\n.cl-fb-add {\n  display: flex;\n  align-items: center;\n  gap: 0.3125rem;\n  background: none;\n  border: none;\n  color: var(--cl-accent);\n  font-size: 0.75rem;\n  font-weight: 500;\n  cursor: pointer;\n  padding: 0;\n}\n.cl-fb-add:hover {\n  color: rgba(59, 130, 246, 0.8);\n  color: color-mix(in srgb, var(--cl-accent) 80%, var(--cl-bg));\n}\n.cl-fb-clear {\n  background: none;\n  border: none;\n  color: var(--cl-text-4);\n  font-size: 0.75rem;\n  cursor: pointer;\n  margin-left: auto;\n  padding: 0;\n}\n.cl-fb-clear:hover {\n  color: var(--cl-red);\n}\n.cl-empty {\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  text-align: center;\n  padding: 2.5rem 0;\n}\n.cl-empty-icon {\n  width: 3.5rem;\n  height: 3.5rem;\n  border-radius: 9999px;\n  background: var(--cl-surface-2);\n  border: 1px solid var(--cl-border-2);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  margin: 0 auto 1rem;\n}\n.cl-empty-title {\n  font-size: 1.125rem;\n  font-weight: 600;\n  color: var(--cl-text);\n  margin-bottom: 0.25rem;\n}\n.cl-empty-sub {\n  font-size: 0.8125rem;\n  color: var(--cl-text-4);\n}\n.cl-load-more {\n  display: flex;\n  justify-content: center;\n  padding-top: 1rem;\n}\n.cl-load-more-btn {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  padding: 0.625rem 1.5rem;\n  background: var(--cl-surface-2);\n  border: 1px solid var(--cl-border-2);\n  border-radius: 0.75rem;\n  color: var(--cl-text-2);\n  font-size: 0.8125rem;\n  font-weight: 500;\n  cursor: pointer;\n  transition: all 0.15s;\n}\n.cl-load-more-btn:hover:not(:disabled) {\n  background: var(--cl-border-2);\n  border-color: var(--cl-text-4);\n}\n.cl-load-more-btn:disabled {\n  opacity: 0.6;\n  cursor: not-allowed;\n}\n.cl-all-loaded {\n  text-align: center;\n  color: var(--cl-text-5);\n  font-size: 0.6875rem;\n  margin-top: 1rem;\n}\n.cl-pagination {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  gap: 0.75rem;\n  padding: 0.625rem 1.5rem 0.75rem;\n  flex-shrink: 0;\n  border-top: 1px solid var(--cl-border);\n}\n.cl-page-btn {\n  display: flex;\n  align-items: center;\n  gap: 0.3125rem;\n  padding: 0.375rem 0.875rem;\n  background: var(--cl-surface-2);\n  border: 1px solid var(--cl-border-2);\n  border-radius: 0.5rem;\n  color: var(--cl-text-2);\n  font-size: 0.75rem;\n  font-weight: 500;\n  cursor: pointer;\n  transition: all 0.15s;\n}\n.cl-page-btn:hover:not(:disabled) {\n  background: var(--cl-border-2);\n  border-color: var(--cl-text-4);\n  color: var(--cl-text);\n}\n.cl-page-btn:disabled {\n  opacity: 0.4;\n  cursor: not-allowed;\n}\n.cl-page-info {\n  font-size: 0.75rem;\n  color: var(--cl-text-4);\n  min-width: 5.625rem;\n  text-align: center;\n}\n.cl-meta-cell {\n  display: flex;\n  align-items: center;\n  gap: 0.3125rem;\n  position: relative;\n}\n.cl-info-btn {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 1rem;\n  height: 1rem;\n  border-radius: 50%;\n  background: none;\n  border: none;\n  padding: 0;\n  color: var(--cl-text-4);\n  cursor: pointer;\n  flex-shrink: 0;\n  opacity: 0;\n  transition: opacity 0.15s, color 0.15s;\n}\n.cl-meta-cell:hover .cl-info-btn,\n.cl-info-btn:focus-visible {\n  opacity: 1;\n}\n.cl-info-btn:hover {\n  color: var(--cl-accent);\n}\n.cl-info-popover {\n  position: absolute;\n  top: calc(100% + 0.375rem);\n  left: 0;\n  z-index: 100;\n  min-width: 13.75rem;\n  background: var(--cl-surface-2);\n  border: 1px solid var(--cl-border-2);\n  border-radius: 0.625rem;\n  padding: 0.625rem 0.75rem;\n  box-shadow: 0 8px 24px rgba(249, 250, 251, 0.15);\n  box-shadow: 0 8px 24px color-mix(in srgb, var(--cl-text) 15%, transparent);\n  font-size: 0.6875rem;\n  white-space: nowrap;\n}\n.cl-info-popover--log {\n  min-width: 17.5rem;\n  max-height: 20rem;\n  overflow-y: auto;\n  white-space: normal;\n}\n.cl-info-popover-row {\n  display: flex;\n  align-items: baseline;\n  gap: 0.5rem;\n  padding: 0.125rem 0;\n  color: var(--cl-text-2);\n}\n.cl-info-label {\n  font-weight: 600;\n  color: var(--cl-text-3);\n  min-width: 3.75rem;\n  flex-shrink: 0;\n}\n.cl-info-divider {\n  border: none;\n  border-top: 1px solid var(--cl-border-2);\n  margin: 0.5rem 0 0.375rem;\n}\n.cl-info-log-header {\n  font-size: 0.625rem;\n  font-weight: 700;\n  letter-spacing: 0.06em;\n  text-transform: uppercase;\n  color: var(--cl-text-4);\n  margin-bottom: 0.375rem;\n}\n.cl-info-log-entry {\n  padding: 0.3125rem 0;\n  border-bottom: 1px solid var(--cl-border);\n}\n.cl-info-log-entry:last-child {\n  border-bottom: none;\n}\n.cl-info-log-meta {\n  font-size: 0.625rem;\n  color: var(--cl-text-4);\n  margin-bottom: 0.1875rem;\n}\n.cl-info-log-change {\n  display: flex;\n  align-items: center;\n  gap: 0.3125rem;\n  font-size: 0.6875rem;\n  flex-wrap: wrap;\n}\n.cl-info-field {\n  font-weight: 600;\n  color: var(--cl-text-3);\n  margin-right: 0.125rem;\n}\n.cl-info-from {\n  color: var(--cl-red);\n  text-decoration: line-through;\n  opacity: 0.8;\n  max-width: 6.25rem;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n.cl-info-to {\n  color: var(--cl-green);\n  max-width: 6.25rem;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n.cl-info-log-empty {\n  font-size: 0.6875rem;\n  color: var(--cl-text-4);\n  font-style: italic;\n  padding: 0.25rem 0;\n}\n.cl-loading {\n  flex: 1;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n.cl-loading-spinner {\n  width: 2rem;\n  height: 2rem;\n  border: 3px solid var(--cl-border-2);\n  border-top-color: var(--cl-accent);\n  border-radius: 50%;\n  animation: cl-spin 0.7s linear infinite;\n}\n.cl-expand-row {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n  padding: 0.625rem 0.75rem;\n  cursor: pointer;\n  border-bottom: 1px solid var(--cl-border);\n  transition: background 0.1s;\n}\n.cl-expand-row:hover {\n  background: rgba(31, 41, 55, 0.3);\n  background: color-mix(in srgb, var(--cl-surface-2) 30%, transparent);\n}\n.cl-expand-row.expanded {\n  background: var(--cl-surface);\n}\n.cl-expand-chevron {\n  width: 1rem;\n  height: 1rem;\n  transition: transform 0.15s;\n  color: var(--cl-text-4);\n  flex-shrink: 0;\n}\n.cl-expand-chevron.open {\n  transform: rotate(90deg);\n}\n.cl-expand-field {\n  font-size: 0.6875rem;\n  color: var(--cl-text-2);\n}\n.cl-expand-field.primary {\n  color: var(--cl-text);\n  font-weight: 600;\n}\n.cl-expand-content {\n  background: rgba(17, 24, 39, 0.7);\n  background: color-mix(in srgb, var(--cl-surface) 70%, var(--cl-bg));\n  border-bottom: 1px solid var(--cl-border);\n  padding: 0.75rem 1rem 0.75rem 2.5rem;\n}\n.cl-expand-section {\n  margin-bottom: 0.75rem;\n}\n.cl-expand-section:last-child {\n  margin-bottom: 0;\n}\n.cl-expand-section-label {\n  font-size: 0.5625rem;\n  font-weight: 700;\n  text-transform: uppercase;\n  letter-spacing: 0.1em;\n  color: var(--cl-text-4);\n  margin-bottom: 0.375rem;\n}\n.cl-expand-section-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));\n  gap: 0.25rem 1rem;\n}\n.cl-expand-field-item {\n  display: flex;\n  flex-direction: column;\n  gap: 0.0625rem;\n}\n.cl-expand-field-label {\n  font-size: 0.5625rem;\n  color: var(--cl-text-5);\n}\n.cl-expand-field-value {\n  font-size: 0.6875rem;\n  color: var(--cl-text-2);\n}\n.cl-delete-btn {\n  background: none;\n  border: none;\n  cursor: pointer;\n  color: var(--cl-text-5);\n  padding: 0.125rem;\n  display: flex;\n  align-items: center;\n  transition: color 0.15s;\n}\n.cl-delete-btn:hover {\n  color: var(--cl-red);\n}\n.cl-sheet-overlay {\n  position: fixed;\n  inset: 0;\n  z-index: 9990;\n  background: rgba(0, 0, 0, 0.45);\n  display: flex;\n  align-items: flex-end;\n  justify-content: center;\n  animation: cl-fade-in 0.15s ease-out;\n}\n.cl-sheet {\n  --cl-bg: var(--app-bg, #030712);\n  --cl-surface: var(--app-surface, #111827);\n  --cl-surface-2: var(--app-surface-2, #1f2937);\n  --cl-border: var(--app-border, #1f2937);\n  --cl-border-2: var(--app-border-2, #374151);\n  --cl-text: var(--app-text, #f9fafb);\n  --cl-text-2: var(--app-text-2, #d1d5db);\n  --cl-text-3: var(--app-text-3, #9ca3af);\n  --cl-text-4: var(--app-text-4, #6b7280);\n  --cl-text-5: var(--app-text-5, #4b5563);\n  --cl-accent: var(--app-accent, #3b82f6);\n  --cl-accent-dark: var(--app-accent-hover, #1d4ed8);\n  --cl-indigo: #6366f1;\n  --cl-green: var(--app-success, #22c55e);\n  --cl-amber: var(--app-warning, #f59e0b);\n  --cl-red: var(--app-danger, #ef4444);\n  width: 100%;\n  max-width: 40rem;\n  max-height: 60vh;\n  background: var(--app-surface, #111827);\n  border: 1px solid var(--app-border-2, #374151);\n  border-radius: 0.75rem 0.75rem 0 0;\n  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.25);\n  display: flex;\n  flex-direction: column;\n  animation: cl-slide-up 0.2s ease-out;\n  overflow: hidden;\n  color: var(--app-text, #f9fafb);\n  font-family:\n    var(--font-geist-sans, ui-sans-serif),\n    system-ui,\n    -apple-system,\n    sans-serif;\n  font-size: 0.8125rem;\n}\n.cl-sheet-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 1rem 1.25rem;\n  border-bottom: 1px solid var(--app-border, #1f2937);\n  flex-shrink: 0;\n}\n.cl-sheet-title {\n  font-size: 0.875rem;\n  font-weight: 600;\n  color: var(--app-text, #f9fafb);\n}\n.cl-sheet-sub {\n  font-size: 0.6875rem;\n  color: var(--app-text-4, #6b7280);\n  margin-top: 0.125rem;\n}\n.cl-sheet-close {\n  background: none;\n  border: none;\n  color: var(--app-text-4, #6b7280);\n  cursor: pointer;\n  padding: 0.25rem;\n  display: flex;\n  border-radius: 0.375rem;\n  transition: color 0.15s, background 0.15s;\n}\n.cl-sheet-close:hover {\n  color: var(--app-text, #f9fafb);\n  background: var(--app-surface-2, #1f2937);\n}\n.cl-sheet-body {\n  flex: 1;\n  overflow-y: auto;\n  padding: 1rem 1.25rem;\n}\n.cl-sheet-footer {\n  display: flex;\n  align-items: center;\n  justify-content: flex-end;\n  gap: 0.5rem;\n  padding: 0.75rem 1.25rem;\n  border-top: 1px solid var(--app-border, #1f2937);\n  flex-shrink: 0;\n}\n@keyframes cl-slide-up {\n  from {\n    transform: translateY(100%);\n  }\n  to {\n    transform: translateY(0);\n  }\n}\n@keyframes cl-fade-in {\n  from {\n    opacity: 0;\n  }\n  to {\n    opacity: 1;\n  }\n}\n.cl-confirm-overlay {\n  position: fixed;\n  inset: 0;\n  z-index: 9999;\n  background: rgba(0, 0, 0, 0.6);\n  backdrop-filter: blur(2px);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n.cl-confirm-card {\n  background: var(--app-surface);\n  border: 1px solid var(--app-border-2);\n  border-radius: 0.75rem;\n  padding: 1.5rem;\n  width: 100%;\n  max-width: 24rem;\n  box-shadow: 0 1.25rem 2.5rem rgba(0, 0, 0, 0.3);\n  color: var(--app-text);\n}\n.cl-confirm-title {\n  font-size: 0.875rem;\n  font-weight: 700;\n  color: var(--app-text);\n  margin-bottom: 0.375rem;\n}\n.cl-confirm-message {\n  font-size: 0.75rem;\n  color: var(--app-text-3);\n  margin-bottom: 1.25rem;\n  line-height: 1.5;\n}\n.cl-confirm-actions {\n  display: flex;\n  justify-content: flex-end;\n  gap: 0.5rem;\n}\n.cl-confirm-cancel {\n  background: var(--app-surface-2);\n  border: 1px solid var(--app-border-2);\n  color: var(--app-text-3);\n  padding: 0.375rem 0.875rem;\n  border-radius: 0.375rem;\n  font-size: 0.75rem;\n  font-weight: 600;\n  cursor: pointer;\n  transition: all 0.15s;\n}\n.cl-confirm-cancel:hover {\n  color: var(--app-text);\n  border-color: var(--app-text-4);\n}\n.cl-confirm-danger {\n  background: var(--app-danger, #ef4444);\n  border: none;\n  color: white;\n  padding: 0.375rem 0.875rem;\n  border-radius: 0.375rem;\n  font-size: 0.75rem;\n  font-weight: 600;\n  cursor: pointer;\n  transition: opacity 0.15s;\n  display: flex;\n  align-items: center;\n  gap: 0.25rem;\n}\n.cl-confirm-danger:hover {\n  opacity: 0.85;\n}\n.cl-confirm-danger:disabled {\n  opacity: 0.5;\n  cursor: not-allowed;\n}\n');

// ClientList.tsx
import { Fragment, jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
function buildDefaultPermissions(columns) {
  const allOn = () => Object.fromEntries(columns.map((c) => [c.key, { view: true, create: true, edit: true, delete: true }]));
  const actions = {
    export: { view: true, create: true, edit: true, delete: true },
    rename: { view: true, create: true, edit: true, delete: true },
    _record: { view: true, create: true, edit: true, delete: true }
  };
  return {
    rep: { ...allOn(), ...actions },
    manager: { ...allOn(), ...actions },
    admin: { ...allOn(), ...actions }
  };
}
var DEFAULT_PERMISSIONS = buildDefaultPermissions([]);
function fmtPhone(p) {
  if (!p) return "\u2014";
  const d = p.replace(/\D/g, "");
  if (d.length === 11 && d[0] === "1") return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return p;
}
function fmtDate(s) {
  if (!s) return "\u2014";
  const [y, m, d] = s.split("-");
  if (!y || !m || !d) return s;
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function fmtTimestamp(ts) {
  if (!ts) return "\u2014";
  return new Date(ts.seconds * 1e3).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function getOperators(filterType) {
  switch (filterType) {
    case "enum":
      return ["is", "is not", "is empty", "is not empty"];
    case "text":
      return ["contains", "is", "is not", "starts with", "is empty", "is not empty"];
    case "number":
      return ["=", ">", "\u2265", "<", "\u2264", "between", "is empty", "is not empty"];
    case "date":
      return ["is", "before", "after", "between", "is empty", "is not empty", "is today", "is this week", "is this month", "is this year", "is monday", "is tuesday", "is wednesday", "is thursday", "is friday", "is saturday", "is sunday"];
    default:
      return ["contains", "is", "is empty", "is not empty"];
  }
}
function filterRowsToSpecs(rows, columns) {
  const result = {};
  for (const row of rows) {
    if (!row.field) continue;
    if (!row.value && row.operator !== "is empty" && row.operator !== "is not empty") continue;
    const col = columns.find((c) => c.key === row.field);
    const ft = col?.filterType ?? "text";
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
      switch (row.operator) {
        case "is":
        case "=":
          result[row.field] = { kind: "range", min: row.value, max: row.value };
          break;
        case ">":
          result[row.field] = { kind: "range", min: row.value };
          break;
        case "\u2265":
        case "after":
          result[row.field] = { kind: "range", min: row.value };
          break;
        case "<":
          result[row.field] = { kind: "range", max: row.value };
          break;
        case "\u2264":
        case "before":
          result[row.field] = { kind: "range", max: row.value };
          break;
        case "between":
          result[row.field] = { kind: "range", min: row.value, max: row.value2 || void 0 };
          break;
      }
    }
  }
  return result;
}
function exportCSVFile(rows, cols, title) {
  const headers = cols.map((c) => c.label);
  const body = rows.map(
    (r) => cols.map((c) => {
      const val = r[c.key];
      if (val == null) return '""';
      if (typeof val === "object" && val !== null && "seconds" in val) {
        return `"${new Date(val.seconds * 1e3).toISOString()}"`;
      }
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(",")
  ).join("\n");
  const blob = new Blob([headers.join(",") + "\n" + body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
function Spinner() {
  return /* @__PURE__ */ jsx4("span", { className: "cl-spinner", "aria-label": "Loading" });
}
function PencilIconBtn() {
  return /* @__PURE__ */ jsx4(HeroPencilIcon, { className: "cl-pencil", style: { width: 11, height: 11 } });
}
function TrashIconBtn({ size = 12 }) {
  return /* @__PURE__ */ jsx4(HeroTrashIcon, { style: { width: size, height: size } });
}
function CellInput({
  type,
  initialValue,
  options,
  optionLabels,
  onSave,
  onCancel,
  onDelete
}) {
  const [val, setVal] = useState2(initialValue);
  if (type === "select" && options && options.length > 0) {
    return /* @__PURE__ */ jsxs4(
      "select",
      {
        autoFocus: true,
        className: "cl-cell-select",
        value: val,
        onChange: (e) => {
          setVal(e.target.value);
          onSave(e.target.value);
        },
        onBlur: () => onCancel(),
        onKeyDown: (e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            onCancel();
          }
        },
        children: [
          /* @__PURE__ */ jsx4("option", { value: "", disabled: true, children: "Select..." }),
          options.map((o) => /* @__PURE__ */ jsx4("option", { value: o, children: optionLabels?.[o] ?? o }, o))
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxs4("div", { className: "cl-cell-edit-wrap", children: [
    /* @__PURE__ */ jsx4(
      "input",
      {
        autoFocus: true,
        className: "cl-cell-input",
        type: type === "number" ? "number" : type === "date" ? "date" : "text",
        value: val,
        onChange: (e) => setVal(e.target.value),
        onKeyDown: (e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            onCancel();
          }
          if (e.key === "Enter") {
            e.stopPropagation();
            onSave(val);
          }
        }
      }
    ),
    /* @__PURE__ */ jsxs4("div", { className: "cl-cell-actions", style: { paddingLeft: "0.25rem", paddingRight: "0.25rem" }, children: [
      /* @__PURE__ */ jsx4("button", { className: "cl-cell-confirm-btn", onMouseDown: (e) => e.preventDefault(), onClick: () => onSave(val), title: "Save (Enter)", children: /* @__PURE__ */ jsx4(CheckIcon, { className: "w-3 h-3" }) }),
      /* @__PURE__ */ jsx4("button", { className: "cl-cell-cancel-btn", onMouseDown: (e) => e.preventDefault(), onClick: onCancel, title: "Cancel (Esc)", children: /* @__PURE__ */ jsx4(XMarkIcon, { className: "w-3 h-3" }) }),
      onDelete && /* @__PURE__ */ jsxs4(Fragment, { children: [
        /* @__PURE__ */ jsx4("div", { style: { width: "1px", height: "0.75rem", background: "var(--cl-border-2)", margin: "0 0.125rem" } }),
        /* @__PURE__ */ jsx4("button", { className: "cl-delete-btn", onMouseDown: (e) => e.preventDefault(), onClick: onDelete, title: "Clear field value", "aria-label": "Clear field value", children: /* @__PURE__ */ jsx4(TrashIconBtn, { size: 11 }) })
      ] })
    ] })
  ] });
}
function renderCellValue(col, record, helpers) {
  const val = record[col.key];
  if (col.render) {
    try {
      return col.render(val, record, helpers);
    } catch (err) {
      console.error(`[OdsList] Render error in column "${col.key}":`, err);
      return /* @__PURE__ */ jsx4("span", { style: { color: "var(--cl-red)", fontSize: "0.625rem" }, children: "Render error" });
    }
  }
  if (col.meta && col.key.includes("At")) {
    const ts = val;
    if (!ts?.seconds) return /* @__PURE__ */ jsx4("span", { style: { color: "var(--cl-text-5)" }, children: "\u2014" });
    const d = new Date(ts.seconds * 1e3);
    return /* @__PURE__ */ jsx4("span", { style: { color: "var(--cl-text-5)" }, children: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) });
  }
  if (col.filterType === "number") {
    const num = typeof val === "number" ? val : parseFloat(String(val ?? "0")) || 0;
    return /* @__PURE__ */ jsx4("span", { style: { color: "var(--cl-text-2)" }, children: num.toLocaleString("en-US") });
  }
  if (col.filterType === "date") {
    const str2 = String(val ?? "");
    if (!str2) return /* @__PURE__ */ jsx4("span", { style: { color: "var(--cl-text-5)" }, children: "\u2014" });
    const d = /* @__PURE__ */ new Date(str2 + "T00:00:00");
    return /* @__PURE__ */ jsx4("span", { style: { color: "var(--cl-text-3)" }, children: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) });
  }
  const str = String(val ?? "");
  return /* @__PURE__ */ jsx4("span", { style: { color: "var(--cl-text-2)" }, children: str || "\u2014" });
}
function formatFieldValue(val) {
  if (val == null) return "\u2014";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (typeof val === "number") return val.toLocaleString();
  if (typeof val === "object" && "seconds" in val) {
    return new Date(val.seconds * 1e3).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  }
  if (Array.isArray(val)) return val.map(String).join(", ");
  return String(val);
}
var HIDDEN_KEYS = /* @__PURE__ */ new Set(["id", "displayLabel", "uid"]);
var DEFAULT_PAGE_SIZE = 30;
function OdsList({
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
  uid: uid3,
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
  historicalCutoff = "2026-01-01"
}) {
  const clientsProp = data ?? clientsLegacy ?? [];
  const getLabel = useCallback((record) => {
    if (labelField && record[labelField]) return String(record[labelField]);
    if (record.displayLabel) return String(record.displayLabel);
    return String(record.clientName ?? record.id ?? "\u2014");
  }, [labelField]);
  const resolvedColumns = useMemo2(() => {
    if (!schema) return columns;
    let merged = columns.map((col) => {
      const override = schema.columns?.find((o) => o.key === col.key);
      if (!override) return col;
      const mergedEnumValues = override.enumValues && override.enumValues.length > 0 ? override.enumValues : col.enumValues;
      return {
        ...col,
        label: override.label ?? col.label,
        sortable: override.sortable ?? col.sortable,
        editable: override.editable ?? col.editable,
        // If the code passes enumValues, force filterType to "enum" regardless of saved schema
        filterType: col.enumValues && col.enumValues.length > 0 ? "enum" : override.filterType ?? col.filterType,
        enumValues: mergedEnumValues,
        adminOnly: override.adminOnly ?? col.adminOnly,
        enumLabels: col.enumLabels
        // always keep code-defined labels
      };
    });
    const mergedKeys = new Set(merged.map((c) => c.key));
    if (schema.columns) {
      for (const override of schema.columns) {
        if (mergedKeys.has(override.key) || HIDDEN_KEYS.has(override.key)) continue;
        if (override.hidden) continue;
        merged.push({
          key: override.key,
          label: override.label ?? override.key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim(),
          sortable: override.sortable,
          editable: override.editable,
          filterType: override.filterType,
          enumValues: override.enumValues && override.enumValues.length > 0 ? override.enumValues : void 0,
          adminOnly: override.adminOnly
        });
      }
    }
    merged = merged.filter((col) => {
      if (HIDDEN_KEYS.has(col.key)) return false;
      const override = schema.columns?.find((o) => o.key === col.key);
      return !override?.hidden;
    });
    if (schema.columns?.some((o) => o.order != null)) {
      const orderMap = new Map(schema.columns.filter((o) => o.order != null).map((o) => [o.key, o.order]));
      merged.sort((a, b) => (orderMap.get(a.key) ?? 999) - (orderMap.get(b.key) ?? 999));
    }
    if (schema.addedColumns?.length) {
      merged.push(...schema.addedColumns);
    }
    return merged;
  }, [columns, schema]);
  const effectiveSortField = schema?.defaultSortField ?? initialSortField;
  const effectiveSortDir = schema?.defaultSortDir ?? initialSortDir;
  const effectiveVisibleCols = schema?.defaultVisibleCols ?? defaultVisibleCols;
  const resolvedDisplayMode = schema?.displayMode ?? displayModeProp ?? "table";
  const resolvedCollapsedFields = schema?.collapsedFields ?? collapsedFieldsProp ?? [];
  const resolvedExpandedSections = schema?.expandedSections ?? expandedSectionsProp ?? [];
  const schemaStyle = schema?.style;
  const cardBg = schemaStyle?.bgColor || "var(--cl-surface)";
  const shadowColor = schemaStyle?.shadowColor || "rgba(0,0,0,0.12)";
  const shadowOx = schemaStyle?.shadowOffsetX ?? 0;
  const shadowOy = schemaStyle?.shadowOffsetY ?? 1;
  const shadowBlur = schemaStyle?.shadowBlur ?? 3;
  const cardShadow = `${shadowOx}px ${shadowOy}px ${shadowBlur}px ${shadowColor}`;
  function updateStyle(patch) {
    if (!onSaveSchema) return;
    const next = { ...schema ?? {}, style: { ...schema?.style ?? {}, ...patch } };
    onSaveSchema(next);
  }
  const resolvedGroupBy = useMemo2(() => {
    const field = schema?.groupByField;
    if (!field) return groupBy ?? void 0;
    const vals = /* @__PURE__ */ new Set();
    clientsProp.forEach((c) => {
      const v = String(c[field] ?? "");
      if (v) vals.add(v);
    });
    const sorted = Array.from(vals).sort((a, b) => {
      const na = Number(a), nb = Number(b);
      return !isNaN(na) && !isNaN(nb) ? na - nb : a.localeCompare(b);
    });
    const colors = ["#3b82f6", "#22c55e", "#a855f7", "#f59e0b", "#ef4444", "#6366f1", "#ec4899", "#14b8a6", "#f97316", "#6b7280"];
    return {
      fn: (r) => String(r[field] ?? "_none"),
      groups: [
        ...sorted.map((v, i) => ({ key: v, label: v.toUpperCase(), color: colors[i % colors.length] })),
        { key: "_none", label: "UNGROUPED", color: "#6b7280" }
      ]
    };
  }, [schema?.groupByField, groupBy, clientsProp]);
  const [expandedRowIds, setExpandedRowIds] = useState2(/* @__PURE__ */ new Set());
  function toggleExpandRow(record) {
    setExpandedRowIds((prev) => {
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
  const DEFAULT_COL_ORDER = useMemo2(() => resolvedColumns.map((c) => c.key), [resolvedColumns]);
  const defaultCols = useMemo2(
    () => effectiveVisibleCols ?? resolvedColumns.map((c) => c.key),
    [effectiveVisibleCols, resolvedColumns]
  );
  const INTERNAL_DEFAULT_VIEW = useMemo2(() => ({
    id: "default",
    name: "Default",
    colOrder: defaultCols,
    visibleCols: defaultCols,
    sorts: effectiveSortField ? [{ field: effectiveSortField, dir: effectiveSortDir }] : [],
    filterRows: [],
    builtIn: true
  }), [defaultCols, effectiveSortField, effectiveSortDir]);
  const columnsDefaultPerms = useMemo2(() => buildDefaultPermissions(resolvedColumns), [resolvedColumns]);
  const [clients, setClients] = useState2(clientsProp);
  useEffect(() => {
    setClients(clientsProp);
  }, [clientsProp]);
  const [sorts, setSorts] = useState2(() => {
    if (effectiveSortField) return [{ field: effectiveSortField, dir: effectiveSortDir }];
    return [];
  });
  const [filterRows, setFilterRows] = useState2([]);
  const [showFilterBuilder, setShowFilterBuilder] = useState2(false);
  const [showAddFilterMenu, setShowAddFilterMenu] = useState2(false);
  const filters = useMemo2(() => filterRowsToSpecs(filterRows, resolvedColumns), [filterRows, resolvedColumns]);
  const [searchText, setSearchText] = useState2("");
  const [showHistorical, setShowHistorical] = useState2(false);
  const [colOrder, setColOrder] = useState2(() => INTERNAL_DEFAULT_VIEW.colOrder ?? DEFAULT_COL_ORDER);
  const [colVisible, setColVisible] = useState2(() => INTERNAL_DEFAULT_VIEW.visibleCols ?? null);
  const [dragCol, setDragCol] = useState2(null);
  const [dragOverCol, setDragOverCol] = useState2(null);
  const [activeViewId, setActiveViewId] = useState2("default");
  const [showSaveView, setShowSaveView] = useState2(false);
  const [newViewName, setNewViewName] = useState2("");
  const [savingView, setSavingView] = useState2(false);
  const allViews = useMemo2(() => {
    const userDefault = viewsProp.find((v) => v.isDefault);
    const otherViews = viewsProp.filter((v) => !v.isDefault);
    if (userDefault) return [userDefault, ...otherViews];
    return [INTERNAL_DEFAULT_VIEW, ...viewsProp];
  }, [INTERNAL_DEFAULT_VIEW, viewsProp]);
  const [localTitle, setLocalTitle] = useState2(listTitle);
  const [isRenaming, setIsRenaming] = useState2(false);
  const [renameValue, setRenameValue] = useState2(listTitle);
  useEffect(() => {
    setLocalTitle(listTitle);
    setRenameValue(listTitle);
  }, [listTitle]);
  const [editCell, setEditCell] = useState2(null);
  const [saving, setSaving] = useState2({});
  const [confirmDialog, setConfirmDialog] = useState2(null);
  const [confirmLoading, setConfirmLoading] = useState2(false);
  const [noteDialog, setNoteDialog] = useState2(null);
  const [noteDraft, setNoteDraft] = useState2("");
  const [noteSaving, setNoteSaving] = useState2(false);
  const [infoPopover, setInfoPopover] = useState2(null);
  const infoPopoverRef = useRef(null);
  const tableScrollRef = useRef(null);
  const hScrollTrackRef = useRef(null);
  const hDragData = useRef({ startX: 0, startScrollLeft: 0 });
  const [hThumb, setHThumb] = useState2({ left: 0, width: 0, show: false });
  const [page, setPage] = useState2(0);
  const [pageSize, setPageSize] = useState2(() => schema?.pageSize ?? DEFAULT_PAGE_SIZE);
  const [busy, setBusy] = useState2(/* @__PURE__ */ new Set());
  const [showPermissions, setShowPermissions] = useState2(false);
  const [showA11y, setShowA11y] = useState2(false);
  const [showStyleMenu, setShowStyleMenu] = useState2(false);
  const [showActionMenu, setShowActionMenu] = useState2(false);
  const [mailDetailRecord, setMailDetailRecord] = useState2(null);
  const actionMenuRef = useRef(null);
  const a11yKey = `odsList-a11y-${listTitle ?? "default"}`;
  const [listFontSize, setListFontSize] = useState2(() => {
    if (userPrefs?.fontSize) return userPrefs.fontSize;
    if (typeof window === "undefined") return "base";
    return localStorage.getItem(a11yKey) || "base";
  });
  useEffect(() => {
    if (userPrefs?.fontSize) setListFontSize(userPrefs.fontSize);
  }, [userPrefs?.fontSize]);
  const a11yRef = useRef(null);
  const [draftPermissions, setDraftPermissions] = useState2(
    () => permissions ?? columnsDefaultPerms
  );
  const [savingPerms, setSavingPerms] = useState2(false);
  const [resolvedPermissions, setResolvedPermissions] = useState2(
    () => permissions ?? columnsDefaultPerms
  );
  useEffect(() => {
    const base = permissions ?? columnsDefaultPerms;
    const merged = { rep: {}, manager: {}, admin: {} };
    ["rep", "manager", "admin"].forEach((role) => {
      merged[role] = { ...columnsDefaultPerms[role], ...base[role] };
    });
    setResolvedPermissions(merged);
  }, [permissions, columnsDefaultPerms]);
  const [showSchemaEditor, setShowSchemaEditor] = useState2(false);
  const [draftSchema, setDraftSchema] = useState2({});
  const [schemaEnumEditor, setSchemaEnumEditor] = useState2(null);
  const [schemaNewCol, setSchemaNewCol] = useState2({ key: "", label: "", filterType: "text", sortable: true, editable: false, adminOnly: false });
  const [schemaSaving, setSchemaSaving] = useState2(false);
  const schemaColDragRef = useRef(null);
  function openSchemaEditor() {
    setDraftSchema(schema ? JSON.parse(JSON.stringify(schema)) : {
      columns: resolvedColumns.map((c, i) => ({
        key: c.key,
        label: c.label,
        sortable: !!c.sortable,
        editable: !!c.editable,
        filterType: c.filterType || "text",
        enumValues: c.enumValues || [],
        adminOnly: !!c.adminOnly,
        hidden: false,
        order: i
      })),
      defaultVisibleCols: effectiveVisibleCols ?? resolvedColumns.map((c) => c.key),
      defaultSortField: effectiveSortField || "",
      defaultSortDir: effectiveSortDir || "desc",
      displayMode: resolvedDisplayMode,
      collapsedFields: resolvedCollapsedFields.length ? [...resolvedCollapsedFields] : [],
      expandedSections: resolvedExpandedSections.length ? JSON.parse(JSON.stringify(resolvedExpandedSections)) : [],
      groupByField: ""
    });
    setSchemaEnumEditor(null);
    setSchemaNewCol({ key: "", label: "", filterType: "text", sortable: true, editable: false, adminOnly: false });
    setShowSchemaEditor(true);
  }
  const [schemaError, setSchemaError] = useState2("");
  function stripUndefined(obj) {
    if (obj === null || obj === void 0 || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map(stripUndefined);
    const clean = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v === void 0) continue;
      if (k === "enumValues" && Array.isArray(v) && v.length === 0) continue;
      clean[k] = stripUndefined(v);
    }
    return clean;
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
  function canView(colKey) {
    if (isPrivileged) return true;
    const role = currentRole;
    return resolvedPermissions[role]?.[colKey]?.view ?? columnsDefaultPerms[role]?.[colKey]?.view ?? false;
  }
  const viewOnly = !!schemaStyle?.viewOnly;
  function canEdit(colKey) {
    if (viewOnly) return false;
    if (isPrivileged) return true;
    const role = currentRole;
    return resolvedPermissions[role]?.[colKey]?.edit ?? columnsDefaultPerms[role]?.[colKey]?.edit ?? false;
  }
  function canDelete(colKey) {
    if (viewOnly) return false;
    if (isPrivileged) return true;
    const role = currentRole;
    return resolvedPermissions[role]?.[colKey]?.delete ?? columnsDefaultPerms[role]?.[colKey]?.delete ?? false;
  }
  function openPermissionsEditor() {
    setDraftPermissions(JSON.parse(JSON.stringify(resolvedPermissions)));
    setShowPermissions(true);
  }
  async function savePermissions() {
    if (savingPerms) return;
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
  function toggleDraftPerm(role, colKey, type) {
    setDraftPermissions((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next[role][colKey]) next[role][colKey] = { view: true, create: true, edit: true, delete: true };
      next[role][colKey][type] = !next[role][colKey][type];
      if (type === "view" && !next[role][colKey].view) {
        next[role][colKey].create = false;
        next[role][colKey].edit = false;
        next[role][colKey].delete = false;
      }
      if ((type === "create" || type === "edit" || type === "delete") && next[role][colKey][type]) {
        next[role][colKey].view = true;
      }
      return next;
    });
  }
  const showSubmittedBy = isAdmin || isManager;
  const visibleColDefs = useMemo2(() => {
    const hasSchemaOrder = schema?.columns?.some((o) => o.order != null);
    const baseOrder = hasSchemaOrder ? resolvedColumns.map((c) => c.key) : [...colOrder, ...DEFAULT_COL_ORDER.filter((k) => !colOrder.includes(k))];
    return baseOrder.map((key) => resolvedColumns.find((c) => c.key === key)).filter((c) => !!c).filter((c) => !c.adminOnly || showSubmittedBy).filter((c) => canView(c.key));
  }, [colOrder, colVisible, showSubmittedBy, phase, currentRole, resolvedPermissions, resolvedColumns, DEFAULT_COL_ORDER, schema]);
  const distinctValues = useMemo2(() => {
    const map = {};
    for (const col of resolvedColumns) {
      if (col.enumValues) {
        map[col.key] = col.enumValues;
      }
    }
    for (const col of resolvedColumns) {
      if (col.filterType === "enum" && !col.enumValues) {
        const vals = /* @__PURE__ */ new Set();
        clients.forEach((c) => {
          const v = String(c[col.key] ?? "");
          if (v) vals.add(v);
        });
        map[col.key] = Array.from(vals).sort((a, b) => {
          const na = Number(a), nb = Number(b);
          return !isNaN(na) && !isNaN(nb) ? na - nb : a.localeCompare(b);
        });
      }
    }
    return map;
  }, [clients, resolvedColumns]);
  useEffect(() => {
    if (!showActionMenu) return;
    const h = (e) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target)) setShowActionMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showActionMenu]);
  useEffect(() => {
    if (mailDetailRecord) {
      const fresh = clients.find((c) => c.id === mailDetailRecord.id);
      if (fresh && fresh !== mailDetailRecord) setMailDetailRecord(fresh);
    }
  }, [clients, mailDetailRecord]);
  useEffect(() => {
    if (!infoPopover) return;
    const h = (e) => {
      if (infoPopoverRef.current && !infoPopoverRef.current.contains(e.target)) {
        setInfoPopover(null);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [infoPopover]);
  const displayedClients = useMemo2(() => {
    let result = [...clients];
    const ds = schema?.dataScope;
    if (ds) {
      const roleKey = currentRole === "dev" || currentRole === "owner" ? "admin" : currentRole;
      const scope = ds[roleKey] ?? (roleKey === "rep" ? "own" : roleKey === "manager" ? "team" : "all");
      if (scope === "own" && ds.ownerField && uid3) {
        result = result.filter((r) => String(r[ds.ownerField] ?? "") === uid3);
      } else if (scope === "team" && ds.teamField && userTeamNumber !== void 0) {
        result = result.filter((r) => Number(r[ds.teamField] ?? 0) === userTeamNumber);
      }
    }
    if (!showHistorical) {
      result = result.filter((c) => c.historical !== true && (!c.date || c.date >= historicalCutoff));
    }
    const q = searchText.trim().toLowerCase();
    if (q) {
      result = result.filter((c) => {
        const searchable = resolvedColumns.map((col) => {
          const val = c[col.key];
          if (val == null) return "";
          return String(val);
        }).join(" ").toLowerCase();
        return searchable.includes(q);
      });
    }
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
        const col = resolvedColumns.find((c) => c.key === field);
        const isDate = col?.filterType === "date" || col?.meta;
        const getStr = (v) => {
          if (isDate && v && typeof v === "object" && "seconds" in v)
            return new Date(v.seconds * 1e3).toISOString().slice(0, 10);
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
    if (sorts.length > 0) {
      result.sort((a, b) => {
        for (const { field, dir } of sorts) {
          const av = a[field] ?? "", bv = b[field] ?? "";
          let cmp = 0;
          if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
          else if (av && bv && typeof av === "object" && "seconds" in av && typeof bv === "object" && "seconds" in bv)
            cmp = av.seconds - bv.seconds;
          else cmp = String(av).localeCompare(String(bv));
          if (cmp !== 0) return dir === "asc" ? cmp : -cmp;
        }
        return 0;
      });
    }
    return result;
  }, [clients, showHistorical, historicalCutoff, searchText, filters, sorts, resolvedColumns, resolvedGroupBy]);
  useEffect(() => {
    setPage(0);
  }, [searchText, filterRows, sorts, showHistorical]);
  const unreadCount = useMemo2(() => {
    return clients.filter((r) => r.read !== true && r.read !== "true").length;
  }, [clients]);
  useEffect(() => {
    onUnreadCount?.(unreadCount);
  }, [unreadCount, onUnreadCount]);
  const effectivePageSize = pageSize === 0 ? displayedClients.length || 1 : pageSize;
  const totalPages = Math.max(1, Math.ceil(displayedClients.length / effectivePageSize));
  const pagedClients = pageSize === 0 ? displayedClients : displayedClients.slice(page * effectivePageSize, (page + 1) * effectivePageSize);
  const groupedRows = useMemo2(() => {
    if (!resolvedGroupBy) return [{ key: "_all", label: "", color: "", rows: pagedClients }];
    const buckets = {};
    for (const group of resolvedGroupBy.groups) buckets[group.key] = [];
    for (const record of pagedClients) {
      const key = resolvedGroupBy.fn(record);
      if (buckets[key]) buckets[key].push(record);
      else {
        if (!buckets["_other"]) buckets["_other"] = [];
        buckets["_other"].push(record);
      }
    }
    return resolvedGroupBy.groups.filter((g) => (buckets[g.key]?.length ?? 0) > 0).map((g) => ({ ...g, rows: buckets[g.key] }));
  }, [pagedClients, resolvedGroupBy]);
  const showActionsCol = !viewOnly && (showActions && resolvedGroupBy || !!onDeleteRecord || !!onEditRecord);
  const totalColSpan = visibleColDefs.length + (expandable && onRowClick ? 1 : 0) + (showActionsCol ? 1 : 0);
  function reorderCol(from, to) {
    if (from === to) return;
    setColOrder((prev) => {
      const o = [...prev];
      const fi = o.indexOf(from), ti = o.indexOf(to);
      if (fi === -1 || ti === -1) return prev;
      o.splice(fi, 1);
      o.splice(ti, 0, from);
      return o;
    });
  }
  function applyView(view) {
    if (view.colOrder) setColOrder(view.colOrder);
    setColVisible(view.visibleCols ?? null);
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
    if (view.pageSize !== void 0) {
      setPageSize(view.pageSize);
      setPage(0);
    }
    if (view.style && onSaveSchema) {
      onSaveSchema({ ...schema ?? {}, style: view.style });
    }
  }
  async function handleSaveView() {
    if (!newViewName.trim() || !onSaveView || savingView) return;
    setSavingView(true);
    try {
      const id = await onSaveView({
        name: newViewName.trim(),
        colOrder: [...colOrder],
        visibleCols: colVisible ?? void 0,
        sorts: [...sorts],
        filterRows: [...filterRows],
        style: schemaStyle ?? void 0,
        pageSize
      });
      setActiveViewId(id);
      setNewViewName("");
      setShowSaveView(false);
    } finally {
      setSavingView(false);
    }
  }
  async function handleDeleteView(id) {
    await onDeleteView?.(id);
    if (activeViewId === id) applyView(INTERNAL_DEFAULT_VIEW);
  }
  async function confirmRename() {
    const name = renameValue.trim();
    if (!name) {
      setIsRenaming(false);
      setRenameValue(localTitle);
      return;
    }
    setLocalTitle(name);
    setIsRenaming(false);
    await onRenameList?.(name);
  }
  function addFilterRow() {
    const id = `r-${Date.now()}`;
    setFilterRows((prev) => [...prev, { id, field: "", operator: "contains", value: "", value2: "" }]);
  }
  function removeFilterRow(id) {
    setFilterRows((prev) => prev.filter((r) => r.id !== id));
  }
  function updateFilterRow(id, patch) {
    setFilterRows((prev) => prev.map((r) => {
      if (r.id !== id) return r;
      const next = { ...r, ...patch };
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
  function handleSort(field, shiftKey) {
    setSorts((prev) => {
      const existing = prev.findIndex((s) => s.field === field);
      if (shiftKey) {
        if (existing >= 0) {
          const next = [...prev];
          if (next[existing].dir === "asc") next[existing] = { field, dir: "desc" };
          else next.splice(existing, 1);
          return next;
        }
        return [...prev, { field, dir: "asc" }];
      } else {
        if (existing >= 0 && prev.length === 1) {
          if (prev[0].dir === "asc") return [{ field, dir: "desc" }];
          return [];
        }
        return [{ field, dir: "asc" }];
      }
    });
  }
  function startEdit(id, field, value) {
    if (!canEdit(field)) return;
    setEditCell({ id, field, value });
  }
  function cancelEdit() {
    setEditCell(null);
  }
  async function confirmEdit(newValue) {
    if (!editCell) return;
    const { id, field, value: orig } = editCell;
    setEditCell(null);
    if (newValue === orig) return;
    const col = resolvedColumns.find((c) => c.key === field);
    const saveVal = col?.filterType === "number" ? parseFloat(newValue) || 0 : newValue;
    const changeEntry = {
      at: { seconds: Math.floor(Date.now() / 1e3) },
      by: userName,
      field,
      from: String(orig),
      to: String(saveVal)
    };
    setClients((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      return {
        ...c,
        [field]: saveVal,
        updatedByName: userName,
        updatedAt: changeEntry.at,
        changeLog: [...c.changeLog ?? [], changeEntry]
      };
    }));
    setSaving((prev) => ({ ...prev, [id]: field }));
    try {
      await onSave?.(id, field, saveVal, userName, orig);
    } catch {
      setClients(clientsProp);
    } finally {
      setSaving((prev) => {
        const n = { ...prev };
        delete n[id];
        return n;
      });
    }
  }
  function requestDeleteRecord(record) {
    if (!onDeleteRecord) return;
    setConfirmDialog({
      title: "Delete Record",
      message: `Are you sure you want to delete ${getLabel(record)}? This cannot be undone.`,
      onConfirm: async () => {
        await onDeleteRecord(record.id);
        setClients((prev) => prev.filter((c) => c.id !== record.id));
      }
    });
  }
  function handleMailRowClick(record) {
    setMailDetailRecord(record);
    const isUnread = record.read !== true;
    if (isUnread && onSave) {
      setClients((prev) => prev.map((c) => c.id === record.id ? { ...c, read: true } : c));
      onSave(record.id, "read", "true", userName).catch(() => {
      });
    }
  }
  function requestDeleteField(recordId, field) {
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
        setClients((prev) => prev.map((c) => {
          if (c.id !== recordId) return c;
          return { ...c, [field]: "" };
        }));
        setEditCell(null);
      }
    });
  }
  const syncHThumb = useCallback(() => {
    const el = tableScrollRef.current;
    if (!el) return;
    const hasScroll = el.scrollWidth > el.clientWidth + 1;
    if (!hasScroll) {
      setHThumb((p) => p.show ? { left: 0, width: 0, show: false } : p);
      return;
    }
    const ratio = el.clientWidth / el.scrollWidth;
    const thumbW = Math.max(40, ratio * el.clientWidth);
    const maxLeft = el.clientWidth - thumbW;
    const scrollR = el.scrollLeft / (el.scrollWidth - el.clientWidth);
    setHThumb({ left: scrollR * maxLeft, width: thumbW, show: true });
  }, []);
  useEffect(() => {
    const el = tableScrollRef.current;
    if (!el) return;
    syncHThumb();
    const ro = new ResizeObserver(syncHThumb);
    ro.observe(el);
    return () => ro.disconnect();
  }, [syncHThumb, displayedClients.length]);
  const onThumbMouseDown = useCallback((e) => {
    e.preventDefault();
    const el = tableScrollRef.current;
    if (!el) return;
    hDragData.current = { startX: e.clientX, startScrollLeft: el.scrollLeft };
    const onMove = (mv) => {
      const scrollRange = el.scrollWidth - el.clientWidth;
      const trackW = el.clientWidth;
      const thumbW = Math.max(40, el.clientWidth / el.scrollWidth * trackW);
      const thumbRange = trackW - thumbW;
      const dx = mv.clientX - hDragData.current.startX;
      el.scrollLeft = hDragData.current.startScrollLeft + dx / thumbRange * scrollRange;
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);
  const onTrackClick = useCallback((e) => {
    const track = hScrollTrackRef.current;
    const el = tableScrollRef.current;
    if (!track || !el) return;
    const rect = track.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    el.scrollLeft = ratio * (el.scrollWidth - el.clientWidth);
  }, []);
  const scrollToLeft = useCallback(() => {
    if (tableScrollRef.current) tableScrollRef.current.scrollLeft = 0;
  }, []);
  function handleExportCSV() {
    const allRows = groupedRows.flatMap((g) => g.rows);
    if (!allRows.length) return;
    exportCSVFile(allRows, visibleColDefs, `${localTitle}-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}`);
  }
  const cellHelpers = useMemo2(() => ({
    uid: uid3 ?? "",
    userName: userName ?? "",
    isPrivileged,
    canEdit,
    canDelete,
    startEdit: (id, field, value) => setEditCell({ id, field, value })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [uid3, userName, isPrivileged, resolvedPermissions]);
  function renderCell(col, client) {
    const isEditing = editCell?.id === client.id && editCell?.field === col.key;
    const isSaving = saving[client.id] === col.key;
    if (col.multiline) {
      const val = String(client[col.key] ?? "");
      const hasContent = val.trim().length > 0;
      const isEditable = !!((col.editable || isPrivileged) && canEdit(col.key));
      return /* @__PURE__ */ jsx4("td", { className: `cl-td${col.meta ? " meta" : ""}`, children: /* @__PURE__ */ jsxs4(
        "button",
        {
          type: "button",
          title: hasContent ? val.slice(0, 100) : `${isEditable ? "Add" : "No"} ${col.label?.toLowerCase() ?? "note"}`,
          onClick: (e) => {
            e.stopPropagation();
            setNoteDialog({ id: client.id, field: col.key, label: col.label, value: val, editable: isEditable });
            setNoteDraft(val);
          },
          style: {
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            color: hasContent ? "var(--app-accent)" : "var(--app-text-5)"
          },
          children: [
            /* @__PURE__ */ jsx4("svg", { style: { width: 14, height: 14 }, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: hasContent ? /* @__PURE__ */ jsx4("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" }) : /* @__PURE__ */ jsx4("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" }) }),
            hasContent && /* @__PURE__ */ jsx4("span", { style: { fontSize: "0.625rem", fontWeight: 600 }, children: "1" })
          ]
        }
      ) }, col.key);
    }
    if ((col.editable || isPrivileged) && isEditing) {
      const enumOpts = col.enumValues && col.enumValues.length > 0 ? col.enumValues : col.filterType === "enum" ? distinctValues[col.key] : void 0;
      const inputType = col.filterType === "number" ? "number" : col.filterType === "date" ? "date" : col.filterType === "enum" && enumOpts && enumOpts.length > 0 ? "select" : "text";
      const showFieldDelete = !col.meta && canDelete(col.key);
      return /* @__PURE__ */ jsx4("td", { className: `cl-td${col.meta ? " meta" : ""}`, onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsx4(
        CellInput,
        {
          type: inputType,
          initialValue: String(client[col.key] ?? ""),
          options: enumOpts,
          optionLabels: col.enumLabels,
          onSave: confirmEdit,
          onCancel: cancelEdit,
          onDelete: showFieldDelete ? () => requestDeleteField(client.id, col.key) : void 0
        }
      ) }, col.key);
    }
    if ((col.editable || isPrivileged) && canEdit(col.key)) {
      const rendered2 = renderCellValue(col, client, cellHelpers);
      return /* @__PURE__ */ jsx4("td", { className: `cl-td${col.meta ? " meta" : ""}`, children: /* @__PURE__ */ jsxs4("div", { className: "cl-cell-edit", onClick: (e) => {
        e.stopPropagation();
        startEdit(client.id, col.key, String(client[col.key] ?? ""));
      }, children: [
        rendered2,
        isSaving ? /* @__PURE__ */ jsx4(Spinner, {}) : /* @__PURE__ */ jsx4(PencilIconBtn, {})
      ] }) }, col.key);
    }
    const rendered = renderCellValue(col, client, cellHelpers);
    return /* @__PURE__ */ jsx4("td", { className: `cl-td${col.meta ? " meta" : ""}`, children: rendered }, col.key);
  }
  function renderPermissionsEditor() {
    if (!showPermissions) return null;
    const configurableRoles = ["rep", "manager", "admin"];
    const permCols = resolvedColumns;
    return /* @__PURE__ */ jsx4("div", { className: "cl-sheet-overlay", onClick: () => setShowPermissions(false), children: /* @__PURE__ */ jsxs4("div", { className: "cl-sheet", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxs4("div", { className: "cl-sheet-header", children: [
        /* @__PURE__ */ jsxs4("div", { children: [
          /* @__PURE__ */ jsx4("div", { className: "cl-sheet-title", children: "Column Permissions" }),
          /* @__PURE__ */ jsx4("div", { className: "cl-sheet-sub", children: "Owner & Dev always have full access" })
        ] }),
        /* @__PURE__ */ jsx4("button", { className: "cl-sheet-close", onClick: () => setShowPermissions(false), children: /* @__PURE__ */ jsx4(XMarkIcon, { style: { width: 16, height: 16 } }) })
      ] }),
      /* @__PURE__ */ jsx4("div", { className: "cl-sheet-body", children: /* @__PURE__ */ jsx4("div", { style: { overflowX: "auto" }, children: /* @__PURE__ */ jsxs4("table", { className: "cl-perm-table", children: [
        /* @__PURE__ */ jsxs4("thead", { children: [
          /* @__PURE__ */ jsxs4("tr", { children: [
            /* @__PURE__ */ jsx4("th", { className: "cl-perm-th cl-perm-col-label" }),
            configurableRoles.map((role) => /* @__PURE__ */ jsx4("th", { className: "cl-perm-th cl-perm-role-group", colSpan: 4, children: role.charAt(0).toUpperCase() + role.slice(1) }, role))
          ] }),
          /* @__PURE__ */ jsxs4("tr", { children: [
            /* @__PURE__ */ jsx4("th", { className: "cl-perm-th cl-perm-col-label", children: "Column" }),
            configurableRoles.map((role) => /* @__PURE__ */ jsxs4(React2.Fragment, { children: [
              /* @__PURE__ */ jsx4("th", { className: "cl-perm-th cl-perm-sub", children: "V" }),
              /* @__PURE__ */ jsx4("th", { className: "cl-perm-th cl-perm-sub", children: "C" }),
              /* @__PURE__ */ jsx4("th", { className: "cl-perm-th cl-perm-sub", children: "E" }),
              /* @__PURE__ */ jsx4("th", { className: "cl-perm-th cl-perm-sub", children: "D" })
            ] }, role))
          ] })
        ] }),
        /* @__PURE__ */ jsxs4("tbody", { children: [
          [
            { key: "export", label: "Export" },
            { key: "rename", label: "Rename list" }
          ].map(({ key, label }) => /* @__PURE__ */ jsxs4("tr", { className: "cl-perm-tr cl-perm-tr-action", children: [
            /* @__PURE__ */ jsxs4("td", { className: "cl-perm-td cl-perm-col-name", children: [
              label,
              /* @__PURE__ */ jsx4("span", { className: "cl-perm-tag", children: "action" })
            ] }),
            configurableRoles.map((role) => {
              const allowed = draftPermissions[role][key]?.view ?? false;
              return /* @__PURE__ */ jsx4(React2.Fragment, { children: /* @__PURE__ */ jsx4("td", { className: "cl-perm-td cl-perm-cell", colSpan: 4, children: /* @__PURE__ */ jsx4(
                "input",
                {
                  type: "checkbox",
                  className: "cl-perm-check",
                  checked: allowed,
                  onChange: () => toggleDraftPerm(role, key, "view")
                }
              ) }) }, role + "-" + key);
            })
          ] }, key)),
          permCols.map((col) => {
            const isMeta = !!col.meta;
            return /* @__PURE__ */ jsxs4("tr", { className: "cl-perm-tr", children: [
              /* @__PURE__ */ jsxs4("td", { className: "cl-perm-td cl-perm-col-name", children: [
                col.label || col.key,
                col.adminOnly && /* @__PURE__ */ jsx4("span", { className: "cl-perm-tag", children: "admin+" }),
                isMeta && /* @__PURE__ */ jsx4("span", { className: "cl-perm-tag", children: "meta" })
              ] }),
              configurableRoles.map((role) => {
                const perm = draftPermissions[role][col.key] ?? { view: true, create: true, edit: true, delete: true };
                return /* @__PURE__ */ jsxs4(React2.Fragment, { children: [
                  /* @__PURE__ */ jsx4("td", { className: "cl-perm-td cl-perm-cell", children: /* @__PURE__ */ jsx4(
                    "input",
                    {
                      type: "checkbox",
                      className: "cl-perm-check",
                      checked: perm.view,
                      onChange: () => toggleDraftPerm(role, col.key, "view")
                    }
                  ) }),
                  isMeta ? /* @__PURE__ */ jsxs4(Fragment, { children: [
                    /* @__PURE__ */ jsx4("td", { className: "cl-perm-td cl-perm-cell", children: /* @__PURE__ */ jsx4("span", { style: { color: "var(--cl-text-5)", fontSize: "0.5625rem" }, children: "\u2014" }) }),
                    /* @__PURE__ */ jsx4("td", { className: "cl-perm-td cl-perm-cell", children: /* @__PURE__ */ jsx4("span", { style: { color: "var(--cl-text-5)", fontSize: "0.5625rem" }, children: "\u2014" }) }),
                    /* @__PURE__ */ jsx4("td", { className: "cl-perm-td cl-perm-cell", children: /* @__PURE__ */ jsx4("span", { style: { color: "var(--cl-text-5)", fontSize: "0.5625rem" }, children: "\u2014" }) })
                  ] }) : /* @__PURE__ */ jsxs4(Fragment, { children: [
                    /* @__PURE__ */ jsx4("td", { className: "cl-perm-td cl-perm-cell", children: /* @__PURE__ */ jsx4(
                      "input",
                      {
                        type: "checkbox",
                        className: "cl-perm-check",
                        checked: perm.create,
                        disabled: !perm.view,
                        onChange: () => toggleDraftPerm(role, col.key, "create")
                      }
                    ) }),
                    /* @__PURE__ */ jsx4("td", { className: "cl-perm-td cl-perm-cell", children: /* @__PURE__ */ jsx4(
                      "input",
                      {
                        type: "checkbox",
                        className: "cl-perm-check",
                        checked: perm.edit,
                        disabled: !perm.view,
                        onChange: () => toggleDraftPerm(role, col.key, "edit")
                      }
                    ) }),
                    /* @__PURE__ */ jsx4("td", { className: "cl-perm-td cl-perm-cell", children: /* @__PURE__ */ jsx4(
                      "input",
                      {
                        type: "checkbox",
                        className: "cl-perm-check",
                        checked: perm.delete,
                        disabled: !perm.view,
                        onChange: () => toggleDraftPerm(role, col.key, "delete")
                      }
                    ) })
                  ] })
                ] }, role + "-" + col.key);
              })
            ] }, col.key);
          })
        ] })
      ] }) }) }),
      onSavePermissions && /* @__PURE__ */ jsx4("div", { className: "cl-sheet-footer", children: /* @__PURE__ */ jsx4("button", { className: "cl-perm-save", onClick: () => {
        savePermissions();
        setShowPermissions(false);
      }, disabled: savingPerms, children: savingPerms ? "Saving\u2026" : "Save" }) })
    ] }) });
  }
  function renderSchemaEditor() {
    if (!showSchemaEditor) return null;
    const rawCols = draftSchema.columns ?? resolvedColumns.map((c, i) => ({
      key: c.key,
      label: c.label,
      sortable: !!c.sortable,
      editable: !!c.editable,
      filterType: c.filterType || "text",
      enumValues: c.enumValues || [],
      adminOnly: !!c.adminOnly,
      hidden: false,
      order: i
    }));
    const baseCols = rawCols.map((col) => {
      const codeDef = columns.find((c) => c.key === col.key);
      if (codeDef && (!col.enumValues || col.enumValues.length === 0) && codeDef.enumValues && codeDef.enumValues.length > 0) {
        return { ...col, enumValues: codeDef.enumValues };
      }
      return col;
    });
    const knownKeys = new Set(baseCols.map((c) => c.key));
    const dataKeys = [];
    for (const record of clientsProp) {
      for (const k of Object.keys(record)) {
        if (!knownKeys.has(k) && !HIDDEN_KEYS.has(k)) {
          knownKeys.add(k);
          dataKeys.push(k);
        }
      }
    }
    const discoveredCols = dataKeys.map((key, i) => {
      let sample = void 0;
      for (const r of clientsProp) {
        if (r[key] != null && r[key] !== "") {
          sample = r[key];
          break;
        }
      }
      const filterType = typeof sample === "number" ? "number" : typeof sample === "boolean" ? "enum" : sample && typeof sample === "object" && "seconds" in sample ? "date" : "text";
      const enumValues = typeof sample === "boolean" ? ["true", "false"] : [];
      const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim();
      return { key, label, sortable: true, editable: false, filterType, enumValues, adminOnly: false, hidden: true, order: baseCols.length + i };
    });
    const draftCols = [...baseCols, ...discoveredCols].sort((a, b) => {
      if (a.order != null && b.order != null) return a.order - b.order;
      if (a.order != null) return -1;
      if (b.order != null) return 1;
      return (a.label ?? a.key).localeCompare(b.label ?? b.key);
    });
    const draftAdded = draftSchema.addedColumns ?? [];
    const allSchemaKeys = [...draftCols.map((c) => c.key), ...draftAdded.map((c) => c.key)];
    function updateDraftCol(key, patch) {
      setDraftSchema((prev) => {
        const cols = [...prev.columns ?? draftCols];
        const idx = cols.findIndex((c) => c.key === key);
        if (idx >= 0) {
          cols[idx] = { ...cols[idx], ...patch };
        } else {
          const discovered = draftCols.find((c) => c.key === key);
          if (discovered) cols.push({ ...discovered, ...patch });
        }
        return { ...prev, columns: cols };
      });
    }
    async function addNewColumn() {
      const k = schemaNewCol.key.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
      if (!k || !schemaNewCol.label.trim()) return;
      if (allSchemaKeys.includes(k)) return;
      const newCol = {
        key: k,
        label: schemaNewCol.label.trim(),
        filterType: schemaNewCol.filterType,
        sortable: schemaNewCol.sortable,
        editable: schemaNewCol.editable,
        adminOnly: schemaNewCol.adminOnly
      };
      if (onAddColumn) {
        const defaultValue = schemaNewCol.filterType === "number" ? 0 : schemaNewCol.filterType === "enum" ? "" : "";
        try {
          await onAddColumn(k, defaultValue);
        } catch (err) {
          console.error("[OdsList] Failed to write new column to collection:", err);
        }
      }
      setDraftSchema((prev) => ({
        ...prev,
        addedColumns: [...prev.addedColumns ?? [], newCol]
      }));
      setSchemaNewCol({ key: "", label: "", filterType: "text", sortable: true, editable: false, adminOnly: false });
    }
    function removeAddedColumn(key) {
      setDraftSchema((prev) => ({
        ...prev,
        addedColumns: (prev.addedColumns ?? []).filter((c) => c.key !== key)
      }));
    }
    const panelStyle = {};
    const overlayStyle = {};
    const headerStyle = {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "1rem 1.25rem",
      borderBottom: "1px solid var(--cl-border-2)"
    };
    const titleStyle = {
      fontSize: "0.875rem",
      fontWeight: 700,
      color: "var(--cl-text)"
    };
    const subtitleStyle = {
      fontSize: "0.6875rem",
      color: "var(--cl-text-3)",
      marginTop: "0.125rem"
    };
    const sectionTitleStyle = {
      fontSize: "0.6875rem",
      fontWeight: 700,
      color: "var(--cl-text-3)",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      marginBottom: "0.5rem",
      padding: "0 0.25rem"
    };
    const inputStyle = {
      background: "var(--cl-surface-2)",
      border: "1px solid var(--cl-border-2)",
      borderRadius: "0.375rem",
      padding: "0.25rem 0.5rem",
      fontSize: "0.75rem",
      color: "var(--cl-text)",
      outline: "none"
    };
    const selectStyle = { ...inputStyle, cursor: "pointer" };
    const checkStyle = { accentColor: "var(--cl-accent)", cursor: "pointer" };
    const btnStyle = {
      background: "var(--cl-accent)",
      color: "white",
      border: "none",
      borderRadius: "0.375rem",
      padding: "0.375rem 0.875rem",
      fontSize: "0.75rem",
      fontWeight: 600,
      cursor: "pointer"
    };
    const btnSecondaryStyle = {
      ...btnStyle,
      background: "var(--cl-surface-2)",
      color: "var(--cl-text-3)",
      border: "1px solid var(--cl-border-2)"
    };
    const thStyle = {
      fontSize: "0.625rem",
      fontWeight: 600,
      color: "var(--cl-text-3)",
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      padding: "0.375rem 0.375rem",
      textAlign: "left",
      whiteSpace: "nowrap"
    };
    const tdStyle = {
      padding: "0.375rem 0.375rem",
      fontSize: "0.75rem",
      color: "var(--cl-text)",
      borderTop: "1px solid var(--cl-border-2)",
      verticalAlign: "middle"
    };
    const roleVisibility = {
      rep: {},
      manager: {},
      admin: {}
    };
    const configurableRoles = ["rep", "manager", "admin"];
    for (const role of configurableRoles) {
      for (const col of draftCols) {
        roleVisibility[role][col.key] = resolvedPermissions[role]?.[col.key]?.view !== false;
      }
    }
    function toggleColVisibility(role, key) {
      const current = roleVisibility[role][key] ?? true;
      const newVal = !current;
      const perm = { view: newVal, create: newVal, edit: newVal, delete: newVal };
      const updated = {
        ...resolvedPermissions,
        [role]: { ...resolvedPermissions[role], [key]: perm }
      };
      if (onSavePermissions) onSavePermissions(updated);
    }
    return /* @__PURE__ */ jsx4("div", { className: "cl-sheet-overlay", onClick: () => setShowSchemaEditor(false), children: /* @__PURE__ */ jsxs4("div", { className: "cl-sheet", style: { maxHeight: "80vh" }, onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxs4("div", { className: "cl-sheet-header", children: [
        /* @__PURE__ */ jsxs4("div", { children: [
          /* @__PURE__ */ jsx4("div", { className: "cl-sheet-title", children: "List Settings" }),
          /* @__PURE__ */ jsx4("div", { className: "cl-sheet-sub", children: "Data scope and column visibility per role." })
        ] }),
        /* @__PURE__ */ jsx4("button", { className: "cl-sheet-close", onClick: () => setShowSchemaEditor(false), children: /* @__PURE__ */ jsx4(XMarkIcon, { style: { width: 16, height: 16 } }) })
      ] }),
      schemaError && /* @__PURE__ */ jsx4("div", { style: { padding: "0.5rem 1.25rem", background: "color-mix(in srgb, var(--cl-red) 15%, transparent)", borderBottom: "1px solid color-mix(in srgb, var(--cl-red) 30%, transparent)", color: "var(--cl-red)", fontSize: "0.75rem", fontWeight: 500 }, children: schemaError }),
      /* @__PURE__ */ jsxs4("div", { style: { flex: 1, overflow: "auto", padding: "1rem 1.25rem" }, children: [
        currentRole === "dev" && /* @__PURE__ */ jsxs4("div", { style: { marginBottom: "1.5rem" }, children: [
          /* @__PURE__ */ jsx4("div", { style: sectionTitleStyle, children: "Data Scope" }),
          /* @__PURE__ */ jsx4("p", { style: { fontSize: "0.6875rem", color: "var(--cl-text-4)", marginBottom: "0.75rem" }, children: "Controls which records each role can see. Owner & Dev always see all data." }),
          /* @__PURE__ */ jsxs4("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1rem" }, children: [
            /* @__PURE__ */ jsxs4("div", { children: [
              /* @__PURE__ */ jsx4("label", { style: { display: "block", fontSize: "0.625rem", fontWeight: 600, color: "var(--cl-text-4)", marginBottom: "0.25rem", textTransform: "uppercase" }, children: "Owner Field (UID)" }),
              /* @__PURE__ */ jsxs4(
                "select",
                {
                  value: draftSchema.dataScope?.ownerField ?? "",
                  onChange: (e) => setDraftSchema((prev) => ({ ...prev, dataScope: { ...prev.dataScope, ownerField: e.target.value || void 0 } })),
                  style: selectStyle,
                  children: [
                    /* @__PURE__ */ jsx4("option", { value: "", children: "\u2014 none \u2014" }),
                    draftCols.map((c) => /* @__PURE__ */ jsx4("option", { value: c.key, children: c.label || c.key }, c.key))
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs4("div", { children: [
              /* @__PURE__ */ jsx4("label", { style: { display: "block", fontSize: "0.625rem", fontWeight: 600, color: "var(--cl-text-4)", marginBottom: "0.25rem", textTransform: "uppercase" }, children: "Team Field" }),
              /* @__PURE__ */ jsxs4(
                "select",
                {
                  value: draftSchema.dataScope?.teamField ?? "",
                  onChange: (e) => setDraftSchema((prev) => ({ ...prev, dataScope: { ...prev.dataScope, teamField: e.target.value || void 0 } })),
                  style: selectStyle,
                  children: [
                    /* @__PURE__ */ jsx4("option", { value: "", children: "\u2014 none \u2014" }),
                    draftCols.map((c) => /* @__PURE__ */ jsx4("option", { value: c.key, children: c.label || c.key }, c.key))
                  ]
                }
              )
            ] })
          ] }),
          ["rep", "manager", "admin"].map((role) => {
            const ds = draftSchema.dataScope ?? {};
            const current = ds[role] ?? (role === "rep" ? "own" : role === "manager" ? "team" : "all");
            const options = [
              { key: "own", label: "Own Records", desc: "Only records they created" },
              { key: "team", label: "Team Records", desc: "Records from their team" },
              { key: "all", label: "All Records", desc: "Full access to all records" }
            ];
            return /* @__PURE__ */ jsxs4("div", { style: { marginBottom: "0.75rem" }, children: [
              /* @__PURE__ */ jsx4("div", { style: { fontSize: "0.6875rem", fontWeight: 700, color: "var(--cl-text-2)", marginBottom: "0.375rem", textTransform: "capitalize" }, children: role }),
              /* @__PURE__ */ jsx4("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.375rem" }, children: options.map((opt) => /* @__PURE__ */ jsxs4(
                "button",
                {
                  type: "button",
                  onClick: () => setDraftSchema((prev) => ({ ...prev, dataScope: { ...prev.dataScope, [role]: opt.key } })),
                  style: {
                    padding: "0.5rem",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                    border: current === opt.key ? "2px solid var(--cl-accent)" : "1px solid var(--cl-border-2)",
                    background: current === opt.key ? "color-mix(in srgb, var(--cl-accent) 10%, transparent)" : "var(--cl-surface-2)",
                    textAlign: "center",
                    transition: "all 0.15s"
                  },
                  children: [
                    /* @__PURE__ */ jsx4("div", { style: { fontSize: "0.6875rem", fontWeight: 700, color: current === opt.key ? "var(--cl-accent)" : "var(--cl-text)" }, children: opt.label }),
                    /* @__PURE__ */ jsx4("div", { style: { fontSize: "0.5625rem", color: "var(--cl-text-4)", marginTop: "0.125rem" }, children: opt.desc })
                  ]
                },
                opt.key
              )) })
            ] }, role);
          })
        ] }),
        /* @__PURE__ */ jsxs4("div", { style: { marginBottom: "1.5rem" }, children: [
          /* @__PURE__ */ jsx4("div", { style: sectionTitleStyle, children: "Column Visibility" }),
          /* @__PURE__ */ jsx4("p", { style: { fontSize: "0.6875rem", color: "var(--cl-text-4)", marginBottom: "0.75rem" }, children: "Toggle which columns each role can see. Changes save immediately." }),
          /* @__PURE__ */ jsx4("div", { style: { overflow: "auto", border: "1px solid var(--cl-border-2)", borderRadius: "0.5rem" }, children: /* @__PURE__ */ jsxs4("table", { style: { width: "100%", borderCollapse: "collapse" }, children: [
            /* @__PURE__ */ jsx4("thead", { children: /* @__PURE__ */ jsxs4("tr", { style: { background: "var(--cl-surface-2)" }, children: [
              /* @__PURE__ */ jsx4("th", { style: thStyle, children: "Column" }),
              configurableRoles.map((role) => /* @__PURE__ */ jsx4("th", { style: { ...thStyle, textAlign: "center", textTransform: "capitalize" }, children: role }, role))
            ] }) }),
            /* @__PURE__ */ jsx4("tbody", { children: draftCols.map((col) => /* @__PURE__ */ jsxs4("tr", { children: [
              /* @__PURE__ */ jsx4("td", { style: tdStyle, children: /* @__PURE__ */ jsx4("span", { style: { color: "var(--cl-text-2)", fontSize: "0.6875rem", fontWeight: 500 }, children: col.label || col.key }) }),
              configurableRoles.map((role) => /* @__PURE__ */ jsx4("td", { style: { ...tdStyle, textAlign: "center" }, children: /* @__PURE__ */ jsx4(
                "input",
                {
                  type: "checkbox",
                  checked: roleVisibility[role][col.key] !== false,
                  onChange: () => toggleColVisibility(role, col.key),
                  style: { accentColor: "var(--cl-accent)", cursor: "pointer", width: 16, height: 16 }
                }
              ) }, role))
            ] }, col.key)) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs4("div", { style: { marginBottom: "1.5rem" }, children: [
          /* @__PURE__ */ jsx4("div", { style: sectionTitleStyle, children: "Display Mode" }),
          /* @__PURE__ */ jsx4("div", { style: { display: "flex", flexWrap: "wrap", gap: "0.375rem" }, children: ["table", "expandable"].map((mode) => /* @__PURE__ */ jsx4(
            "button",
            {
              type: "button",
              onClick: () => setDraftSchema((prev) => ({ ...prev, displayMode: mode })),
              style: {
                padding: "0.375rem 0.75rem",
                borderRadius: "0.375rem",
                cursor: "pointer",
                border: draftSchema.displayMode === mode ? "2px solid var(--cl-accent)" : "1px solid var(--cl-border-2)",
                background: draftSchema.displayMode === mode ? "color-mix(in srgb, var(--cl-accent) 10%, transparent)" : "var(--cl-surface-2)",
                fontSize: "0.6875rem",
                fontWeight: 600,
                color: draftSchema.displayMode === mode ? "var(--cl-accent)" : "var(--cl-text-3)",
                textTransform: "capitalize"
              },
              children: mode
            },
            mode
          )) })
        ] }),
        /* @__PURE__ */ jsxs4("div", { style: { marginBottom: "1.5rem" }, children: [
          /* @__PURE__ */ jsx4("div", { style: sectionTitleStyle, children: "Group By Field" }),
          /* @__PURE__ */ jsxs4(
            "select",
            {
              value: draftSchema.groupByField ?? "",
              onChange: (e) => setDraftSchema((prev) => ({ ...prev, groupByField: e.target.value || void 0 })),
              style: selectStyle,
              children: [
                /* @__PURE__ */ jsx4("option", { value: "", children: "\u2014 none \u2014" }),
                draftCols.filter((c) => c.filterType === "enum" || c.filterType === "text").map((c) => /* @__PURE__ */ jsx4("option", { value: c.key, children: c.label || c.key }, c.key))
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx4("div", { style: { marginBottom: "1.5rem" }, children: /* @__PURE__ */ jsxs4("label", { style: { display: "flex", alignItems: "center", gap: "0.625rem", cursor: "pointer" }, children: [
          /* @__PURE__ */ jsx4(
            "input",
            {
              type: "checkbox",
              checked: !!draftSchema.style?.viewOnly,
              onChange: () => setDraftSchema((prev) => ({ ...prev, style: { ...prev.style, viewOnly: !prev.style?.viewOnly } })),
              style: { accentColor: "var(--cl-accent)", width: "0.9375rem", height: "0.9375rem", cursor: "pointer" }
            }
          ),
          /* @__PURE__ */ jsxs4("div", { children: [
            /* @__PURE__ */ jsx4("div", { style: { fontSize: "0.75rem", fontWeight: 700, color: "var(--cl-text)" }, children: "View Only" }),
            /* @__PURE__ */ jsx4("div", { style: { fontSize: "0.625rem", color: "var(--cl-text-4)" }, children: "Disable editing, deleting, and actions for all users" })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsx4("div", { className: "cl-sheet-footer", children: /* @__PURE__ */ jsx4(
        "button",
        {
          style: { padding: "0.375rem 1rem", borderRadius: "0.5rem", border: "none", background: "var(--cl-accent)", color: "white", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" },
          onClick: () => {
            saveSchema();
          },
          disabled: schemaSaving,
          children: schemaSaving ? "Saving\u2026" : "Save Changes"
        }
      ) })
    ] }) });
  }
  function renderFilterBuilder() {
    if (!showFilterBuilder) return null;
    const filterableColumns = resolvedColumns.filter(
      (c) => c.filterType && !c.noFilter && (!c.adminOnly || showSubmittedBy)
    );
    return /* @__PURE__ */ jsxs4("div", { className: "cl-fb", children: [
      filterRows.length === 0 ? /* @__PURE__ */ jsx4("p", { className: "cl-fb-empty", children: "No filters applied. Add one below." }) : filterRows.map((row) => {
        const col = resolvedColumns.find((c) => c.key === row.field);
        const ft = col?.filterType ?? "text";
        const ops = getOperators(ft);
        const enumVals = row.field ? distinctValues[row.field] ?? [] : [];
        return /* @__PURE__ */ jsxs4("div", { className: "cl-fb-row", children: [
          /* @__PURE__ */ jsx4("span", { className: "cl-fb-where", children: "Where" }),
          /* @__PURE__ */ jsx4(
            "select",
            {
              className: "cl-fb-select",
              value: row.field || filterableColumns[0]?.key || "",
              onChange: (e) => updateFilterRow(row.id, { field: e.target.value }),
              ref: (el) => {
                if (el && !row.field && filterableColumns[0]) updateFilterRow(row.id, { field: filterableColumns[0].key });
              },
              children: filterableColumns.map((c) => /* @__PURE__ */ jsx4("option", { value: c.key, children: c.label }, c.key))
            }
          ),
          /* @__PURE__ */ jsx4(
            "select",
            {
              className: "cl-fb-select cl-fb-select-op",
              value: row.operator,
              onChange: (e) => updateFilterRow(row.id, { operator: e.target.value }),
              children: ops.map((op) => /* @__PURE__ */ jsx4("option", { value: op, children: op }, op))
            }
          ),
          row.operator === "is empty" || row.operator === "is not empty" ? null : ft === "enum" ? /* @__PURE__ */ jsx4(
            "select",
            {
              className: "cl-fb-select cl-fb-select-val",
              value: row.value || enumVals[0] || "",
              onChange: (e) => updateFilterRow(row.id, { value: e.target.value }),
              ref: (el) => {
                if (el && !row.value && enumVals[0]) updateFilterRow(row.id, { value: enumVals[0] });
              },
              children: enumVals.map((v) => /* @__PURE__ */ jsx4("option", { value: v, children: v }, v))
            }
          ) : row.operator === "between" ? /* @__PURE__ */ jsxs4(Fragment, { children: [
            /* @__PURE__ */ jsx4(
              "input",
              {
                className: "cl-fb-input",
                type: ft === "date" ? "date" : "number",
                placeholder: "From",
                value: row.value,
                onChange: (e) => updateFilterRow(row.id, { value: e.target.value })
              }
            ),
            /* @__PURE__ */ jsx4("span", { className: "cl-fb-and", children: "and" }),
            /* @__PURE__ */ jsx4(
              "input",
              {
                className: "cl-fb-input",
                type: ft === "date" ? "date" : "number",
                placeholder: "To",
                value: row.value2,
                onChange: (e) => updateFilterRow(row.id, { value2: e.target.value })
              }
            )
          ] }) : /* @__PURE__ */ jsx4(
            "input",
            {
              className: "cl-fb-input cl-fb-input-wide",
              type: ft === "date" ? "date" : ft === "number" ? "number" : "text",
              placeholder: "Value...",
              value: row.value,
              onChange: (e) => updateFilterRow(row.id, { value: e.target.value })
            }
          ),
          /* @__PURE__ */ jsx4("button", { className: "cl-fb-remove", onClick: () => removeFilterRow(row.id), title: "Remove filter", children: /* @__PURE__ */ jsx4(XMarkIcon, { style: { width: 12, height: 12 } }) })
        ] }, row.id);
      }),
      /* @__PURE__ */ jsxs4("div", { className: "cl-fb-footer", children: [
        /* @__PURE__ */ jsxs4("button", { className: "cl-fb-add", onClick: addFilterRow, children: [
          /* @__PURE__ */ jsx4(PlusIcon, { style: { width: 10, height: 10 } }),
          "Add filter"
        ] }),
        filterRows.length > 0 && /* @__PURE__ */ jsx4("button", { className: "cl-fb-clear", onClick: () => setFilterRows([]), children: "Clear all" })
      ] })
    ] });
  }
  if (loading) {
    return /* @__PURE__ */ jsx4("div", { className: "cl-root cl-loading", children: /* @__PURE__ */ jsx4("div", { className: "cl-loading-spinner" }) });
  }
  const activeFilterCount = Object.values(filters).filter(
    (v) => v.kind === "enum" || v.kind === "enum-exclude" ? v.values.length > 0 : v.kind === "text" || v.kind === "text-startswith" ? !!v.q : v.kind === "empty" || v.kind === "not-empty" ? true : !!(v.min || v.max)
  ).length;
  return /* @__PURE__ */ jsxs4("div", { className: "cl-root", style: listFontSize !== "base" ? { fontSize: listFontSize === "sm" ? "0.6875rem" : listFontSize === "lg" ? "0.9375rem" : "1.0625rem" } : void 0, children: [
    /* @__PURE__ */ jsxs4("div", { className: "cl-sticky-bars", children: [
      !schemaStyle?.hideTitle && /* @__PURE__ */ jsx4("div", { className: "cl-header", children: /* @__PURE__ */ jsx4("div", { className: "cl-header-row", children: /* @__PURE__ */ jsxs4("div", { className: "cl-header-left", children: [
        /* @__PURE__ */ jsx4("div", { className: "cl-header-accent" }),
        /* @__PURE__ */ jsxs4("div", { children: [
          isRenaming ? /* @__PURE__ */ jsx4(
            "input",
            {
              autoFocus: true,
              className: "cl-rename-input",
              value: renameValue,
              onChange: (e) => setRenameValue(e.target.value),
              onBlur: confirmRename,
              onKeyDown: (e) => {
                if (e.key === "Enter") confirmRename();
                if (e.key === "Escape") {
                  setIsRenaming(false);
                  setRenameValue(localTitle);
                }
              }
            }
          ) : /* @__PURE__ */ jsxs4(
            "h1",
            {
              className: "cl-title" + (isPrivileged || canView("rename") ? " cl-title-editable" : ""),
              onClick: () => {
                if (isPrivileged || canView("rename")) {
                  setIsRenaming(true);
                  setRenameValue(localTitle);
                }
              },
              title: isPrivileged || canView("rename") ? "Click to rename" : void 0,
              children: [
                localTitle,
                unreadCount > 0 && (resolvedDisplayMode === "mail" || resolvedDisplayMode === "document") && /* @__PURE__ */ jsx4("span", { style: {
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: "1.25rem",
                  height: "1.25rem",
                  padding: "0 0.375rem",
                  borderRadius: "9999px",
                  fontSize: "0.625rem",
                  fontWeight: 700,
                  background: "var(--cl-accent)",
                  color: "white",
                  marginLeft: "0.5rem",
                  verticalAlign: "middle"
                }, children: unreadCount })
              ]
            }
          ),
          !schemaStyle?.hideRecordCount && /* @__PURE__ */ jsx4("p", { className: "cl-subtitle", children: pageSize > 0 && displayedClients.length > effectivePageSize ? `${(page * effectivePageSize + 1).toLocaleString()}\u2013${Math.min((page + 1) * effectivePageSize, displayedClients.length).toLocaleString()} of ${displayedClients.length.toLocaleString()} records` : `${displayedClients.length.toLocaleString()} record${displayedClients.length !== 1 ? "s" : ""}` })
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsxs4("div", { className: "cl-toolbar-row", children: [
        /* @__PURE__ */ jsxs4("div", { className: "cl-action-bar", ref: actionMenuRef, children: [
          /* @__PURE__ */ jsx4(
            "button",
            {
              className: "cl-action-toggle" + (showActionMenu ? " active" : ""),
              onClick: () => setShowActionMenu((p) => !p),
              title: "Menu",
              "aria-label": "Toggle settings menu",
              children: /* @__PURE__ */ jsx4(EllipsisVerticalIcon, { style: { width: 18, height: 18 } })
            }
          ),
          /* @__PURE__ */ jsxs4("div", { className: "cl-action-items" + (showActionMenu ? " open" : ""), children: [
            /* @__PURE__ */ jsx4(
              "button",
              {
                className: "cl-action-btn" + (showA11y ? " active" : ""),
                onClick: () => {
                  setShowA11y((p) => !p);
                  setShowActionMenu(false);
                },
                title: "Accessibility",
                "aria-label": "Accessibility settings",
                children: /* @__PURE__ */ jsx4(UserIcon, { style: { width: 15, height: 15 } })
              }
            ),
            isPrivileged && /* @__PURE__ */ jsxs4(Fragment, { children: [
              canView("export") && /* @__PURE__ */ jsx4(
                "button",
                {
                  className: "cl-action-btn",
                  onClick: () => {
                    handleExportCSV();
                    setShowActionMenu(false);
                  },
                  disabled: displayedClients.length === 0,
                  title: "Export to CSV",
                  "aria-label": "Export to CSV",
                  children: /* @__PURE__ */ jsx4(ArrowDownTrayIcon, { style: { width: 15, height: 15 } })
                }
              ),
              (currentRole === "dev" || currentRole === "owner") && onSaveSchema && /* @__PURE__ */ jsx4(
                "button",
                {
                  className: "cl-action-btn" + (showSchemaEditor ? " active" : ""),
                  onClick: () => {
                    openSchemaEditor();
                    setShowActionMenu(false);
                  },
                  title: "List Settings",
                  "aria-label": "List settings",
                  children: /* @__PURE__ */ jsx4(Cog6ToothIcon, { style: { width: 15, height: 15 } })
                }
              )
            ] })
          ] })
        ] }),
        !schemaStyle?.hideViewBar && /* @__PURE__ */ jsxs4("div", { className: "cl-toolbar", children: [
          /* @__PURE__ */ jsx4("div", { className: "cl-toolbar-seg", children: allViews.map((view, idx) => {
            const isFirstDefault = (view.isDefault || view.builtIn) && idx === 0;
            const nextView = allViews[idx + 1];
            const showDivider = isFirstDefault && nextView && !nextView.isDefault && !nextView.builtIn;
            return /* @__PURE__ */ jsxs4(React2.Fragment, { children: [
              /* @__PURE__ */ jsxs4("div", { className: "cl-toolbar-view-item", children: [
                /* @__PURE__ */ jsx4(
                  "button",
                  {
                    className: "cl-seg-btn" + (activeViewId === view.id ? " active" : ""),
                    onClick: () => applyView(view),
                    children: view.name
                  }
                ),
                !view.builtIn && !view.isDefault && /* @__PURE__ */ jsx4(
                  "button",
                  {
                    className: "cl-seg-delete",
                    title: "Delete view",
                    onClick: () => handleDeleteView(view.id),
                    children: /* @__PURE__ */ jsx4(XMarkIcon, { style: { width: 8, height: 8 } })
                  }
                )
              ] }),
              showDivider && /* @__PURE__ */ jsx4("div", { className: "cl-pill-divider" })
            ] }, view.id);
          }) }),
          showSaveView ? /* @__PURE__ */ jsxs4("div", { className: "cl-toolbar-save-wrap", children: [
            /* @__PURE__ */ jsx4(
              "input",
              {
                autoFocus: true,
                className: "cl-toolbar-save-input",
                type: "text",
                placeholder: "View name\\u2026",
                value: newViewName,
                onChange: (e) => setNewViewName(e.target.value),
                onKeyDown: (e) => {
                  if (e.key === "Enter") handleSaveView();
                  if (e.key === "Escape") {
                    setShowSaveView(false);
                    setNewViewName("");
                  }
                }
              }
            ),
            /* @__PURE__ */ jsx4("button", { className: "cl-toolbar-save-confirm", onClick: handleSaveView, disabled: savingView || !newViewName.trim(), children: savingView ? "\u2026" : "Save" }),
            /* @__PURE__ */ jsx4("button", { className: "cl-toolbar-save-cancel", onClick: () => {
              setShowSaveView(false);
              setNewViewName("");
            }, children: "Cancel" })
          ] }) : onSaveView && /* @__PURE__ */ jsxs4("button", { className: "cl-seg-add", onClick: () => setShowSaveView(true), children: [
            /* @__PURE__ */ jsx4(PlusIcon, { style: { width: 10, height: 10 } }),
            "Save view"
          ] })
        ] })
      ] }),
      showStyleMenu && typeof document !== "undefined" && createPortal(
        /* @__PURE__ */ jsx4("div", { className: "cl-sheet-overlay", onClick: () => setShowStyleMenu(false), children: /* @__PURE__ */ jsxs4("div", { className: "cl-sheet", onClick: (e) => e.stopPropagation(), children: [
          /* @__PURE__ */ jsxs4("div", { className: "cl-sheet-header", children: [
            /* @__PURE__ */ jsxs4("div", { children: [
              /* @__PURE__ */ jsx4("div", { className: "cl-sheet-title", children: "Style" }),
              /* @__PURE__ */ jsx4("div", { className: "cl-sheet-sub", children: "Card & row appearance" })
            ] }),
            /* @__PURE__ */ jsx4("button", { className: "cl-sheet-close", onClick: () => setShowStyleMenu(false), children: /* @__PURE__ */ jsx4(XMarkIcon, { style: { width: 16, height: 16 } }) })
          ] }),
          /* @__PURE__ */ jsxs4("div", { className: "cl-sheet-body", children: [
            /* @__PURE__ */ jsxs4("div", { style: { marginBottom: "0.75rem" }, children: [
              /* @__PURE__ */ jsx4("div", { style: { color: "var(--cl-text-3)", fontSize: "0.5625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem" }, children: "Background" }),
              /* @__PURE__ */ jsxs4("div", { style: { display: "flex", alignItems: "center", gap: "0.5rem" }, children: [
                /* @__PURE__ */ jsxs4("label", { style: { position: "relative", width: "1.75rem", height: "1.75rem", borderRadius: "0.375rem", overflow: "hidden", cursor: "pointer", border: "1px solid var(--cl-border-2)", flexShrink: 0 }, children: [
                  /* @__PURE__ */ jsx4(
                    "input",
                    {
                      type: "color",
                      value: schemaStyle?.bgColor || "#111827",
                      onChange: (e) => updateStyle({ bgColor: e.target.value }),
                      style: { position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "pointer", opacity: 0 }
                    }
                  ),
                  /* @__PURE__ */ jsx4("span", { style: { position: "absolute", inset: 0, borderRadius: "0.375rem", background: cardBg } })
                ] }),
                /* @__PURE__ */ jsx4(
                  "input",
                  {
                    type: "text",
                    value: schemaStyle?.bgColor || "",
                    onChange: (e) => {
                      if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value) || !e.target.value) updateStyle({ bgColor: e.target.value || void 0 });
                    },
                    placeholder: "inherit",
                    style: { flex: 1, padding: "0.25rem 0.5rem", fontSize: "0.6875rem", fontFamily: "monospace", background: "var(--cl-surface-2)", border: "1px solid var(--cl-border-2)", borderRadius: "0.375rem", color: "var(--cl-text)", outline: "none" }
                  }
                ),
                schemaStyle?.bgColor && /* @__PURE__ */ jsx4("button", { onClick: () => updateStyle({ bgColor: void 0 }), style: { background: "none", border: "none", color: "var(--cl-text-4)", cursor: "pointer", fontSize: "0.625rem" }, children: "Reset" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs4("div", { style: { marginBottom: "0.75rem" }, children: [
              /* @__PURE__ */ jsx4("div", { style: { color: "var(--cl-text-3)", fontSize: "0.5625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem" }, children: "Shadow Color" }),
              /* @__PURE__ */ jsxs4("div", { style: { display: "flex", alignItems: "center", gap: "0.5rem" }, children: [
                /* @__PURE__ */ jsxs4("label", { style: { position: "relative", width: "1.75rem", height: "1.75rem", borderRadius: "0.375rem", overflow: "hidden", cursor: "pointer", border: "1px solid var(--cl-border-2)", flexShrink: 0 }, children: [
                  /* @__PURE__ */ jsx4(
                    "input",
                    {
                      type: "color",
                      value: schemaStyle?.shadowColor?.replace(/rgba?\([^)]+\)/, "") || "#000000",
                      onChange: (e) => updateStyle({ shadowColor: e.target.value + "33" }),
                      style: { position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "pointer", opacity: 0 }
                    }
                  ),
                  /* @__PURE__ */ jsx4("span", { style: { position: "absolute", inset: 0, borderRadius: "0.375rem", background: shadowColor } })
                ] }),
                /* @__PURE__ */ jsx4(
                  "input",
                  {
                    type: "text",
                    value: schemaStyle?.shadowColor || "",
                    onChange: (e) => updateStyle({ shadowColor: e.target.value || void 0 }),
                    placeholder: "rgba(0,0,0,0.12)",
                    style: { flex: 1, padding: "0.25rem 0.5rem", fontSize: "0.6875rem", fontFamily: "monospace", background: "var(--cl-surface-2)", border: "1px solid var(--cl-border-2)", borderRadius: "0.375rem", color: "var(--cl-text)", outline: "none" }
                  }
                ),
                schemaStyle?.shadowColor && /* @__PURE__ */ jsx4("button", { onClick: () => updateStyle({ shadowColor: void 0 }), style: { background: "none", border: "none", color: "var(--cl-text-4)", cursor: "pointer", fontSize: "0.625rem" }, children: "Reset" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs4("div", { children: [
              /* @__PURE__ */ jsx4("div", { style: { color: "var(--cl-text-3)", fontSize: "0.5625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem" }, children: "Shadow Shape" }),
              /* @__PURE__ */ jsxs4("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }, children: [
                /* @__PURE__ */ jsxs4("div", { children: [
                  /* @__PURE__ */ jsx4("label", { style: { fontSize: "0.5625rem", color: "var(--cl-text-4)", display: "block", marginBottom: "0.125rem" }, children: "X Offset" }),
                  /* @__PURE__ */ jsx4(
                    "input",
                    {
                      type: "number",
                      value: schemaStyle?.shadowOffsetX ?? 0,
                      onChange: (e) => updateStyle({ shadowOffsetX: Number(e.target.value) }),
                      style: { width: "100%", padding: "0.25rem 0.375rem", fontSize: "0.6875rem", background: "var(--cl-surface-2)", border: "1px solid var(--cl-border-2)", borderRadius: "0.375rem", color: "var(--cl-text)", outline: "none", textAlign: "center" }
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs4("div", { children: [
                  /* @__PURE__ */ jsx4("label", { style: { fontSize: "0.5625rem", color: "var(--cl-text-4)", display: "block", marginBottom: "0.125rem" }, children: "Y Offset" }),
                  /* @__PURE__ */ jsx4(
                    "input",
                    {
                      type: "number",
                      value: schemaStyle?.shadowOffsetY ?? 1,
                      onChange: (e) => updateStyle({ shadowOffsetY: Number(e.target.value) }),
                      style: { width: "100%", padding: "0.25rem 0.375rem", fontSize: "0.6875rem", background: "var(--cl-surface-2)", border: "1px solid var(--cl-border-2)", borderRadius: "0.375rem", color: "var(--cl-text)", outline: "none", textAlign: "center" }
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs4("div", { children: [
                  /* @__PURE__ */ jsx4("label", { style: { fontSize: "0.5625rem", color: "var(--cl-text-4)", display: "block", marginBottom: "0.125rem" }, children: "Blur" }),
                  /* @__PURE__ */ jsx4(
                    "input",
                    {
                      type: "number",
                      min: 0,
                      value: schemaStyle?.shadowBlur ?? 3,
                      onChange: (e) => updateStyle({ shadowBlur: Math.max(0, Number(e.target.value)) }),
                      style: { width: "100%", padding: "0.25rem 0.375rem", fontSize: "0.6875rem", background: "var(--cl-surface-2)", border: "1px solid var(--cl-border-2)", borderRadius: "0.375rem", color: "var(--cl-text)", outline: "none", textAlign: "center" }
                    }
                  )
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs4("div", { style: { marginTop: "0.75rem" }, children: [
              /* @__PURE__ */ jsx4("div", { style: { color: "var(--cl-text-3)", fontSize: "0.5625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem" }, children: "Show / Hide" }),
              [
                { key: "hideTitle", label: "Title Bar" },
                { key: "hideRecordCount", label: "Record Count" },
                { key: "hideViewBar", label: "View Bar" },
                { key: "hideSearch", label: "Search & Filter" },
                { key: "hideFooter", label: "Footer" }
              ].map(({ key, label }) => /* @__PURE__ */ jsxs4("label", { style: { display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.25rem 0", cursor: "pointer" }, children: [
                /* @__PURE__ */ jsx4(
                  "input",
                  {
                    type: "checkbox",
                    checked: !schemaStyle?.[key],
                    onChange: () => updateStyle({ [key]: !schemaStyle?.[key] }),
                    style: { accentColor: "var(--cl-accent)", width: "0.8125rem", height: "0.8125rem", cursor: "pointer" }
                  }
                ),
                /* @__PURE__ */ jsx4("span", { style: { fontSize: "0.75rem", color: "var(--cl-text-2)" }, children: label })
              ] }, key))
            ] }),
            /* @__PURE__ */ jsx4("div", { style: { marginTop: "0.75rem", padding: "1rem", borderRadius: "0.625rem", background: "var(--cl-surface-2)" }, children: /* @__PURE__ */ jsxs4("div", { style: { padding: "1rem", borderRadius: "0.5rem", background: cardBg, boxShadow: cardShadow }, children: [
              /* @__PURE__ */ jsx4("div", { style: { fontSize: "0.5625rem", fontWeight: 600, color: "var(--cl-text-4)", textTransform: "uppercase", letterSpacing: "0.04em" }, children: "Preview" }),
              /* @__PURE__ */ jsx4("div", { style: { fontSize: "1.25rem", fontWeight: 700, color: "var(--cl-text)", lineHeight: 1, marginTop: "0.25rem" }, children: "$12,345" })
            ] }) }),
            onSaveView && /* @__PURE__ */ jsx4(
              "button",
              {
                onClick: () => {
                  setShowStyleMenu(false);
                  setShowSaveView(true);
                },
                style: {
                  width: "100%",
                  marginTop: "0.75rem",
                  padding: "0.5rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  background: "var(--cl-accent)",
                  color: "white",
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "opacity 0.15s"
                },
                onMouseEnter: (e) => {
                  e.currentTarget.style.opacity = "0.85";
                },
                onMouseLeave: (e) => {
                  e.currentTarget.style.opacity = "1";
                },
                children: "Save to View"
              }
            )
          ] })
        ] }) }),
        document.body
      ),
      showA11y && typeof document !== "undefined" && createPortal(
        /* @__PURE__ */ jsx4("div", { className: "cl-sheet-overlay", onClick: () => setShowA11y(false), children: /* @__PURE__ */ jsxs4("div", { className: "cl-sheet", onClick: (e) => e.stopPropagation(), children: [
          /* @__PURE__ */ jsxs4("div", { className: "cl-sheet-header", children: [
            /* @__PURE__ */ jsxs4("div", { children: [
              /* @__PURE__ */ jsx4("div", { className: "cl-sheet-title", children: "Accessibility" }),
              /* @__PURE__ */ jsx4("div", { className: "cl-sheet-sub", children: "Geist Sans by Vercel" })
            ] }),
            /* @__PURE__ */ jsx4("button", { className: "cl-sheet-close", onClick: () => setShowA11y(false), children: /* @__PURE__ */ jsx4(XMarkIcon, { style: { width: 16, height: 16 } }) })
          ] }),
          /* @__PURE__ */ jsxs4("div", { className: "cl-sheet-body", children: [
            /* @__PURE__ */ jsx4("div", { style: { color: "var(--cl-text-3)", fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }, children: "Text Size" }),
            /* @__PURE__ */ jsx4("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.5rem" }, children: [
              { key: "sm", label: "Small", size: "0.75rem" },
              { key: "base", label: "Default", size: "0.875rem" },
              { key: "lg", label: "Large", size: "1rem" },
              { key: "xl", label: "X-Large", size: "1.125rem" }
            ].map(({ key, label, size }) => /* @__PURE__ */ jsxs4(
              "button",
              {
                onClick: () => {
                  setListFontSize(key);
                  if (onSaveUserPrefs) onSaveUserPrefs({ fontSize: key });
                  else localStorage.setItem(a11yKey, key);
                  setShowA11y(false);
                },
                style: {
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.25rem",
                  padding: "0.75rem 0.5rem",
                  borderRadius: "0.5rem",
                  border: `1px solid ${listFontSize === key ? "var(--cl-accent)" : "var(--cl-border-2)"}`,
                  background: listFontSize === key ? "var(--cl-accent)" : "var(--cl-surface-2)",
                  color: listFontSize === key ? "white" : "var(--cl-text-3)",
                  cursor: "pointer",
                  transition: "all 0.15s"
                },
                children: [
                  /* @__PURE__ */ jsx4("span", { style: { fontSize: size, fontWeight: 700, lineHeight: 1 }, children: "Aa" }),
                  /* @__PURE__ */ jsx4("span", { style: { fontSize: "0.625rem", fontWeight: 500 }, children: label })
                ]
              },
              key
            )) })
          ] })
        ] }) }),
        document.body
      ),
      !schemaStyle?.hideSearch && /* @__PURE__ */ jsxs4("div", { className: "cl-search-area", children: [
        /* @__PURE__ */ jsxs4("div", { className: "cl-search-row", children: [
          /* @__PURE__ */ jsxs4("div", { className: "cl-search-wrap", children: [
            /* @__PURE__ */ jsx4(MagnifyingGlassIcon, { className: "cl-search-icon" }),
            /* @__PURE__ */ jsx4(
              "input",
              {
                className: "cl-search-input",
                type: "text",
                placeholder: "Search by name, phone, app #, carrier, state, notes\\u2026",
                value: searchText,
                onChange: (e) => setSearchText(e.target.value)
              }
            ),
            searchText && /* @__PURE__ */ jsx4("button", { className: "cl-search-clear", onClick: () => setSearchText(""), children: /* @__PURE__ */ jsx4(XMarkIcon, { style: { width: 14, height: 14 } }) })
          ] }),
          /* @__PURE__ */ jsxs4(
            "button",
            {
              className: "cl-filter-toggle" + (showFilterBuilder || activeFilterCount > 0 ? " active" : ""),
              onClick: () => setShowFilterBuilder((p) => !p),
              children: [
                /* @__PURE__ */ jsx4(FunnelIcon, { style: { width: 12, height: 12 } }),
                "Filter",
                activeFilterCount > 0 && /* @__PURE__ */ jsx4("span", { className: "cl-filter-toggle-count", children: activeFilterCount })
              ]
            }
          ),
          /* @__PURE__ */ jsxs4("div", { style: { position: "relative" }, children: [
            /* @__PURE__ */ jsx4(
              "button",
              {
                className: "cl-filter-toggle",
                onClick: () => setShowAddFilterMenu((p) => !p),
                title: "Add a filter",
                style: { display: "flex", alignItems: "center", gap: "0.25rem" },
                children: /* @__PURE__ */ jsx4(PlusIcon, { style: { width: 12, height: 12 } })
              }
            ),
            showAddFilterMenu && /* @__PURE__ */ jsxs4(Fragment, { children: [
              /* @__PURE__ */ jsx4("div", { style: { position: "fixed", inset: 0, zIndex: 19 }, onClick: () => setShowAddFilterMenu(false) }),
              /* @__PURE__ */ jsx4(
                "div",
                {
                  style: {
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: "0.25rem",
                    zIndex: 20,
                    background: "var(--app-surface, var(--cl-surface))",
                    border: "1px solid var(--app-border-2, var(--cl-border-2))",
                    borderRadius: "0.5rem",
                    boxShadow: "0 0.5rem 1.5rem rgba(0,0,0,0.2)",
                    padding: "0.25rem",
                    minWidth: "10rem",
                    maxHeight: "16rem",
                    overflowY: "auto"
                  },
                  children: resolvedColumns.filter((c) => c.filterType && !c.noFilter && (!c.adminOnly || showSubmittedBy)).map((c) => /* @__PURE__ */ jsx4(
                    "button",
                    {
                      type: "button",
                      onClick: () => {
                        const ft = c.filterType ?? "text";
                        const ops = getOperators(ft);
                        const firstOp = ops[0] ?? "contains";
                        const firstVal = ft === "enum" ? distinctValues[c.key]?.[0] ?? "" : "";
                        const id = `r-${Date.now()}`;
                        setFilterRows((prev) => [...prev, { id, field: c.key, operator: firstOp, value: firstVal, value2: "" }]);
                        setShowFilterBuilder(true);
                        setShowAddFilterMenu(false);
                      },
                      style: {
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        padding: "0.375rem 0.625rem",
                        borderRadius: "0.375rem",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        color: "var(--app-text, var(--cl-text))",
                        transition: "background 0.1s"
                      },
                      onMouseEnter: (e) => {
                        e.currentTarget.style.background = "var(--app-surface-2, var(--cl-surface-2))";
                      },
                      onMouseLeave: (e) => {
                        e.currentTarget.style.background = "none";
                      },
                      children: c.label
                    },
                    c.key
                  ))
                }
              )
            ] })
          ] })
        ] }),
        sorts.length > 0 && /* @__PURE__ */ jsxs4("div", { style: { display: "flex", alignItems: "center", gap: "0.375rem", padding: "0 0.25rem", fontSize: "0.5625rem", color: "var(--cl-text-4)" }, children: [
          "Sorted by: ",
          sorts.map((s, i) => /* @__PURE__ */ jsxs4("span", { style: { color: "var(--cl-text-3)" }, children: [
            resolvedColumns.find((c) => c.key === s.field)?.label ?? s.field,
            " ",
            s.dir === "asc" ? "\u2191" : "\u2193",
            i < sorts.length - 1 ? "," : ""
          ] }, s.field)),
          /* @__PURE__ */ jsx4("button", { style: { background: "none", border: "none", color: "var(--cl-text-5)", cursor: "pointer", padding: 0, fontSize: "0.5625rem", textDecoration: "underline" }, onClick: () => setSorts([]), children: "Clear" })
        ] }),
        renderFilterBuilder()
      ] }),
      showFilterBuilder && activeFilterCount > 0 && /* @__PURE__ */ jsxs4("div", { className: "cl-active-filters", children: [
        /* @__PURE__ */ jsx4("span", { className: "cl-active-filters-label", children: "Column filters:" }),
        Object.entries(filters).map(([col, spec]) => {
          const colDef = resolvedColumns.find((c) => c.key === col);
          const name = colDef?.label || col;
          let chip = "";
          if (spec.kind === "enum" && spec.values.length) chip = spec.values.length > 1 ? `${name}: ${spec.values.length} selected` : `${name}: ${spec.values[0]}`;
          if (spec.kind === "text" && spec.q) chip = `${name}: ~${spec.q}`;
          if (spec.kind === "range" && (spec.min || spec.max)) chip = `${name}: ${spec.min ?? ""}\u2013${spec.max ?? ""}`;
          if (!chip) return null;
          return /* @__PURE__ */ jsxs4("span", { className: "cl-filter-chip", children: [
            chip,
            /* @__PURE__ */ jsx4("button", { className: "cl-filter-chip-remove", onClick: () => setFilterRows((prev) => prev.filter((r) => r.field !== col)), children: "x" })
          ] }, col);
        }),
        /* @__PURE__ */ jsx4("button", { className: "cl-filter-clear-all", onClick: () => setFilterRows([]), children: "Clear all" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs4("div", { className: "cl-table-area", children: [
      displayedClients.length > 0 ? resolvedDisplayMode === "expandable" ? (
        /* ── Expandable mode (table-based) ────────────────────── */
        (() => {
          const expandColSpan = 1 + visibleColDefs.length + (showActionsCol ? 1 : 0);
          return /* @__PURE__ */ jsx4("div", { className: "cl-table-wrap", children: /* @__PURE__ */ jsx4("div", { className: "cl-table-scroll", children: /* @__PURE__ */ jsxs4("table", { className: "cl-table", role: "grid", children: [
            /* @__PURE__ */ jsx4("thead", { className: "cl-thead", children: /* @__PURE__ */ jsxs4("tr", { children: [
              /* @__PURE__ */ jsx4("th", { className: "cl-th narrow", style: { width: "2rem" } }),
              visibleColDefs.map((col) => {
                const sortIdx = sorts.findIndex((s) => s.field === col.key);
                const isSorted = sortIdx >= 0;
                const sortEntry = isSorted ? sorts[sortIdx] : null;
                const isDragging = dragCol === col.key;
                const isDragOver = dragOverCol === col.key && dragCol !== col.key;
                const spec = filters[col.key];
                const isFiltered = spec ? spec.kind === "enum" || spec.kind === "enum-exclude" ? spec.values.length > 0 : spec.kind === "text" || spec.kind === "text-startswith" ? !!spec.q : spec.kind === "empty" || spec.kind === "not-empty" ? true : !!(spec.min || spec.max) : false;
                return /* @__PURE__ */ jsx4(
                  "th",
                  {
                    "aria-sort": isSorted ? sortEntry.dir === "asc" ? "ascending" : "descending" : "none",
                    className: [
                      "cl-th",
                      col.meta ? "meta" : "",
                      isDragging ? "dragging" : "",
                      isDragOver ? "drag-over" : ""
                    ].filter(Boolean).join(" "),
                    onDragOver: (e) => {
                      e.preventDefault();
                      if (dragCol && dragCol !== col.key) setDragOverCol(col.key);
                    },
                    onDrop: () => {
                      if (dragCol && dragCol !== col.key) reorderCol(dragCol, col.key);
                      setDragOverCol(null);
                    },
                    children: /* @__PURE__ */ jsxs4("div", { className: "cl-th-inner", children: [
                      /* @__PURE__ */ jsx4(
                        "span",
                        {
                          className: "cl-drag-grip",
                          draggable: true,
                          onDragStart: (e) => {
                            e.stopPropagation();
                            setDragCol(col.key);
                          },
                          onDragEnd: () => {
                            setDragCol(null);
                            setDragOverCol(null);
                          },
                          title: "Drag to reorder",
                          children: /* @__PURE__ */ jsxs4("svg", { width: "12", height: "12", fill: "currentColor", viewBox: "0 0 16 16", children: [
                            /* @__PURE__ */ jsx4("circle", { cx: "5", cy: "4", r: "1.5" }),
                            /* @__PURE__ */ jsx4("circle", { cx: "11", cy: "4", r: "1.5" }),
                            /* @__PURE__ */ jsx4("circle", { cx: "5", cy: "8", r: "1.5" }),
                            /* @__PURE__ */ jsx4("circle", { cx: "11", cy: "8", r: "1.5" }),
                            /* @__PURE__ */ jsx4("circle", { cx: "5", cy: "12", r: "1.5" }),
                            /* @__PURE__ */ jsx4("circle", { cx: "11", cy: "12", r: "1.5" })
                          ] })
                        }
                      ),
                      col.sortable ? /* @__PURE__ */ jsxs4("button", { className: "cl-sort-btn" + (isSorted ? " sorted" : ""), onClick: (e) => handleSort(col.key, e.shiftKey), children: [
                        col.label,
                        /* @__PURE__ */ jsx4("span", { className: "cl-sort-arrow" + (isSorted ? "" : " unsorted"), children: isSorted ? /* @__PURE__ */ jsxs4(Fragment, { children: [
                          sorts.length > 1 && /* @__PURE__ */ jsx4("span", { style: { fontSize: "0.5rem", color: "var(--cl-text-4)", marginRight: "0.125rem" }, children: sortIdx + 1 }),
                          sortEntry.dir === "asc" ? "\u2191" : "\u2193"
                        ] }) : "\u2195" })
                      ] }) : /* @__PURE__ */ jsx4("span", { children: col.label }),
                      isFiltered && /* @__PURE__ */ jsx4("span", { className: "cl-filter-count", children: "\u25CF" })
                    ] })
                  },
                  col.key
                );
              }),
              showActionsCol && /* @__PURE__ */ jsx4("th", { className: "cl-th-actions", children: "Actions" })
            ] }) }),
            /* @__PURE__ */ jsx4("tbody", { children: groupedRows.map((group) => {
              const showSectionHeader = resolvedGroupBy && group.label;
              return /* @__PURE__ */ jsxs4(React2.Fragment, { children: [
                showSectionHeader && /* @__PURE__ */ jsx4("tr", { className: `cl-tr-section ${group.key}-section`, children: /* @__PURE__ */ jsx4("td", { colSpan: expandColSpan, children: /* @__PURE__ */ jsxs4("div", { className: "cl-section-label", children: [
                  /* @__PURE__ */ jsx4(
                    "span",
                    {
                      className: `cl-section-dot${group.pulse ? " pulse" : ""}`,
                      style: { background: group.color }
                    }
                  ),
                  /* @__PURE__ */ jsx4("span", { className: "cl-section-title", style: { color: group.color }, children: group.label }),
                  /* @__PURE__ */ jsx4("span", { className: "cl-section-count", children: group.rows.length })
                ] }) }) }),
                group.rows.map((record) => {
                  const isOpen = expandedRowIds.has(record.id);
                  const colFields = resolvedCollapsedFields.length > 0 ? resolvedCollapsedFields : resolvedColumns.slice(0, 4).map((c) => c.key);
                  return /* @__PURE__ */ jsxs4(React2.Fragment, { children: [
                    /* @__PURE__ */ jsxs4(
                      "tr",
                      {
                        className: "cl-tr" + (isOpen ? " expanded" : ""),
                        "aria-expanded": isOpen,
                        role: "row",
                        style: { cursor: "pointer" },
                        onClick: () => {
                          toggleExpandRow(record);
                          onRowClick?.(record);
                        },
                        children: [
                          /* @__PURE__ */ jsx4("td", { className: "cl-td narrow", style: { width: "2rem" }, children: /* @__PURE__ */ jsx4(ChevronRightIcon, { className: "cl-expand-chevron" + (isOpen ? " open" : "") }) }),
                          visibleColDefs.map((col) => renderCell(col, record)),
                          showActionsCol && /* @__PURE__ */ jsx4("td", { className: "cl-td-actions", children: /* @__PURE__ */ jsxs4("div", { style: { display: "flex", alignItems: "center", gap: "0.375rem" }, children: [
                            onEditRecord && isPrivileged && /* @__PURE__ */ jsx4(
                              "button",
                              {
                                className: "cl-delete-btn",
                                style: { color: "var(--cl-accent)" },
                                title: "Edit subcollections",
                                "aria-label": "Edit record details",
                                onClick: (e) => {
                                  e.stopPropagation();
                                  onEditRecord(record);
                                },
                                children: /* @__PURE__ */ jsx4(PencilSquareIcon, { style: { width: 14, height: 14 } })
                              }
                            ),
                            onDeleteRecord && canDelete("_record") && !record?.protected && /* @__PURE__ */ jsx4(
                              "button",
                              {
                                className: "cl-delete-btn",
                                title: "Delete record",
                                "aria-label": "Delete record",
                                onClick: (e) => {
                                  e.stopPropagation();
                                  requestDeleteRecord(record);
                                },
                                children: /* @__PURE__ */ jsx4(TrashIconBtn, {})
                              }
                            )
                          ] }) })
                        ]
                      }
                    ),
                    isOpen && /* @__PURE__ */ jsx4("tr", { children: /* @__PURE__ */ jsx4("td", { colSpan: expandColSpan, style: { padding: 0 }, children: /* @__PURE__ */ jsx4("div", { className: "cl-expand-content", children: renderExpandedContent ? (() => {
                      try {
                        return renderExpandedContent(record);
                      } catch (err) {
                        console.error("[OdsList] Expanded content render error:", err);
                        return /* @__PURE__ */ jsx4("span", { style: { color: "var(--cl-red)" }, children: "Render error" });
                      }
                    })() : resolvedExpandedSections.length > 0 ? resolvedExpandedSections.map((section, sIdx) => /* @__PURE__ */ jsxs4("div", { className: "cl-expand-section", children: [
                      /* @__PURE__ */ jsx4("div", { className: "cl-expand-section-label", children: section.label }),
                      /* @__PURE__ */ jsx4("div", { className: "cl-expand-section-grid", children: section.fields.map((fKey) => {
                        const col = resolvedColumns.find((c) => c.key === fKey);
                        const val = record[fKey];
                        const isFieldEditing = editCell?.id === record.id && editCell?.field === fKey;
                        const isFieldEditable = col?.editable && canEdit(fKey);
                        const isFieldSaving = saving[record.id] === fKey;
                        let display;
                        if (val == null || val === "") {
                          display = "\u2014";
                        } else if (col?.meta && typeof val === "object" && val !== null && "seconds" in val) {
                          display = fmtTimestamp(val);
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
                          const inputType = col.filterType === "number" ? "number" : col.filterType === "date" ? "date" : col.filterType === "enum" && col.enumValues ? "select" : "text";
                          const showFieldDel = !col.meta && canDelete(fKey);
                          return /* @__PURE__ */ jsxs4("div", { className: "cl-expand-field-item", children: [
                            /* @__PURE__ */ jsx4("span", { className: "cl-expand-field-label", children: col?.label ?? fKey }),
                            /* @__PURE__ */ jsx4(
                              CellInput,
                              {
                                type: inputType,
                                initialValue: String(record[fKey] ?? ""),
                                options: col.enumValues,
                                optionLabels: col.enumLabels,
                                onSave: confirmEdit,
                                onCancel: cancelEdit,
                                onDelete: showFieldDel ? () => requestDeleteField(record.id, fKey) : void 0
                              }
                            )
                          ] }, fKey);
                        }
                        return /* @__PURE__ */ jsxs4("div", { className: "cl-expand-field-item", children: [
                          /* @__PURE__ */ jsx4("span", { className: "cl-expand-field-label", children: col?.label ?? fKey }),
                          isFieldEditable ? /* @__PURE__ */ jsxs4(
                            "span",
                            {
                              className: "cl-expand-field-value cl-cell-edit",
                              onClick: () => startEdit(record.id, fKey, String(record[fKey] ?? "")),
                              children: [
                                display,
                                isFieldSaving ? /* @__PURE__ */ jsx4(Spinner, {}) : /* @__PURE__ */ jsx4(PencilIconBtn, {})
                              ]
                            }
                          ) : /* @__PURE__ */ jsx4("span", { className: "cl-expand-field-value", children: display })
                        ] }, fKey);
                      }) })
                    ] }, sIdx)) : (
                      /* Auto-generate: show all columns not in collapsed fields */
                      /* @__PURE__ */ jsxs4("div", { className: "cl-expand-section", children: [
                        /* @__PURE__ */ jsx4("div", { className: "cl-expand-section-label", children: "Details" }),
                        /* @__PURE__ */ jsx4("div", { className: "cl-expand-section-grid", children: resolvedColumns.filter((c) => !colFields.includes(c.key)).map((col) => {
                          const val = record[col.key];
                          const isFieldEditing = editCell?.id === record.id && editCell?.field === col.key;
                          const isFieldEditable = (col.editable || isPrivileged) && canEdit(col.key);
                          const isFieldSaving = saving[record.id] === col.key;
                          let display;
                          if (val == null || val === "") {
                            display = "\u2014";
                          } else if (col.meta && typeof val === "object" && val !== null && "seconds" in val) {
                            display = fmtTimestamp(val);
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
                            const inputType = col.filterType === "number" ? "number" : col.filterType === "date" ? "date" : col.filterType === "enum" && col.enumValues ? "select" : "text";
                            const showFieldDel = !col.meta && canDelete(col.key);
                            return /* @__PURE__ */ jsxs4("div", { className: "cl-expand-field-item", children: [
                              /* @__PURE__ */ jsx4("span", { className: "cl-expand-field-label", children: col.label }),
                              /* @__PURE__ */ jsx4(
                                CellInput,
                                {
                                  type: inputType,
                                  initialValue: String(record[col.key] ?? ""),
                                  options: col.enumValues,
                                  optionLabels: col.enumLabels,
                                  onSave: confirmEdit,
                                  onCancel: cancelEdit,
                                  onDelete: showFieldDel ? () => requestDeleteField(record.id, col.key) : void 0
                                }
                              )
                            ] }, col.key);
                          }
                          return /* @__PURE__ */ jsxs4("div", { className: "cl-expand-field-item", children: [
                            /* @__PURE__ */ jsx4("span", { className: "cl-expand-field-label", children: col.label }),
                            isFieldEditable ? /* @__PURE__ */ jsxs4(
                              "span",
                              {
                                className: "cl-expand-field-value cl-cell-edit",
                                onClick: () => startEdit(record.id, col.key, String(record[col.key] ?? "")),
                                children: [
                                  display,
                                  isFieldSaving ? /* @__PURE__ */ jsx4(Spinner, {}) : /* @__PURE__ */ jsx4(PencilIconBtn, {})
                                ]
                              }
                            ) : /* @__PURE__ */ jsx4("span", { className: "cl-expand-field-value", children: display })
                          ] }, col.key);
                        }) })
                      ] })
                    ) }) }) })
                  ] }, record.id);
                })
              ] }, group.key);
            }) })
          ] }) }) });
        })()
      ) : resolvedDisplayMode === "card" ? (
        /* ── Card mode — uses OdsStatCard ────────────────────────────── */
        /* @__PURE__ */ jsx4("div", { className: "cl-table-wrap", children: /* @__PURE__ */ jsx4("div", { className: "cl-table-scroll", children: /* @__PURE__ */ jsx4("div", { style: { display: "flex", flexWrap: "wrap", gap: "1rem", padding: "1rem" }, children: displayedClients.map((record) => {
          const label = record.displayLabel ?? record.clientName ?? String(record[visibleColDefs[0]?.key] ?? record.id);
          const primaryCol = visibleColDefs[0];
          const primaryVal = primaryCol ? record[primaryCol.key] : void 0;
          const formattedValue = primaryCol?.render ? void 0 : primaryCol?.filterType === "number" && typeof primaryVal === "number" ? primaryVal.toLocaleString() : String(primaryVal ?? "\u2014");
          const trend = record.trend;
          const secondCol = visibleColDefs[1];
          const trendValue = secondCol ? String(record[secondCol.key] ?? "") : void 0;
          return /* @__PURE__ */ jsx4(
            OdsStatCard,
            {
              className: "flex-1",
              label,
              value: formattedValue ?? "",
              trend,
              trendValue: trendValue || void 0,
              onClick: onRowClick ? () => onRowClick(record) : void 0
            },
            record.id
          );
        }) }) }) })
      ) : resolvedDisplayMode === "document" ? (
        /* ── Document library mode ────────────────────────────────────── */
        /* @__PURE__ */ jsx4("div", { style: { display: "flex", flexDirection: "column" }, children: displayedClients.map((record) => {
          const name = record.displayLabel ?? String(record.name ?? record.fileName ?? record.id);
          const fileType = String(record.fileType ?? record.type ?? "");
          const ext = String(record.fileName ?? name).split(".").pop()?.toLowerCase() ?? "";
          const isRead = record.read === true || record.opened === true;
          const iconColor = ext === "pdf" || fileType.includes("pdf") ? "var(--app-danger, #ef4444)" : ["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext) || fileType.startsWith("image") ? "var(--app-success, #22c55e)" : ["xls", "xlsx", "csv"].includes(ext) || fileType.includes("sheet") ? "#22c55e" : ["doc", "docx"].includes(ext) || fileType.includes("word") ? "var(--app-accent, #3b82f6)" : ["zip", "rar", "gz", "tar"].includes(ext) ? "var(--app-warning, #f59e0b)" : "var(--app-text-4, #6b7280)";
          const fileIcon = /* @__PURE__ */ jsx4("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: iconColor, strokeWidth: 1.5, style: { flexShrink: 0 }, children: /* @__PURE__ */ jsx4("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" }) });
          const size = record.fileSize ? (() => {
            const b = Number(record.fileSize);
            if (b < 1024) return `${b} B`;
            if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
            return `${(b / 1048576).toFixed(1)} MB`;
          })() : "";
          const date = record.docDate ?? record.uploadedAt ?? record.createdAt;
          const dateStr = typeof date === "string" ? date : date && typeof date === "object" && "seconds" in date ? new Date(date.seconds * 1e3).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
          const category = record.category ? String(record.category) : "";
          const uploader = record.uploadedByName ? String(record.uploadedByName) : "";
          return /* @__PURE__ */ jsxs4(
            "div",
            {
              onClick: () => {
                if (onRowClick) onRowClick(record);
                if (record.storageUrl) window.open(String(record.storageUrl), "_blank");
              },
              style: {
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.75rem 1.25rem",
                cursor: "pointer",
                borderBottom: "1px solid var(--app-border, #1f2937)",
                transition: "background 0.1s",
                opacity: isRead ? 0.65 : 1
              },
              onMouseEnter: (e) => {
                e.currentTarget.style.background = "var(--app-surface-2, #1f2937)";
              },
              onMouseLeave: (e) => {
                e.currentTarget.style.background = "transparent";
              },
              children: [
                fileIcon,
                /* @__PURE__ */ jsxs4("div", { style: { flex: 1, minWidth: 0 }, children: [
                  /* @__PURE__ */ jsxs4("div", { style: { display: "flex", alignItems: "center", gap: "0.5rem" }, children: [
                    /* @__PURE__ */ jsx4("span", { style: { fontWeight: 600, fontSize: "0.8125rem", color: "var(--app-text, #f9fafb)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: name }),
                    category && /* @__PURE__ */ jsx4("span", { style: { fontSize: "0.5625rem", fontWeight: 600, padding: "0.0625rem 0.375rem", borderRadius: "9999px", background: "var(--app-surface-2, #1f2937)", color: "var(--app-text-3, #9ca3af)" }, children: category })
                  ] }),
                  /* @__PURE__ */ jsx4("div", { style: { fontSize: "0.6875rem", color: "var(--app-text-4, #6b7280)", marginTop: "0.125rem" }, children: [uploader, dateStr, size, ext.toUpperCase()].filter(Boolean).join(" \xB7 ") })
                ] }),
                record.protected === true && /* @__PURE__ */ jsx4("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "var(--app-text-5, #4b5563)", strokeWidth: 1.5, style: { flexShrink: 0 }, children: /* @__PURE__ */ jsx4("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" }) }),
                /* @__PURE__ */ jsx4("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "var(--app-text-5, #4b5563)", strokeWidth: 2, style: { flexShrink: 0 }, children: /* @__PURE__ */ jsx4("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M8.25 4.5l7.5 7.5-7.5 7.5" }) })
              ]
            },
            record.id
          );
        }) })
      ) : resolvedDisplayMode === "mail" ? (
        /* ── Mail / notification mode ─────────────────────────────────── */
        /* @__PURE__ */ jsx4("div", { style: { display: "flex", flexDirection: "column" }, children: displayedClients.map((record) => {
          const title = record.displayLabel ?? String(record.fullName ?? record.name ?? record.subject ?? record.id);
          const preview = String(record.comments ?? record.body ?? record.notes ?? record.detail ?? record.email ?? "");
          const isRead = record.read === true || record.read === "true";
          const isUnread = !isRead;
          const date = record.submittedAt ?? record.createdAt ?? record.date;
          const dateStr = typeof date === "string" ? date : date && typeof date === "object" && "seconds" in date ? new Date(date.seconds * 1e3).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
          const statusVal = String(record.status ?? "");
          const dotColor = isRead ? "transparent" : statusVal === "pending" ? "var(--app-warning, #f59e0b)" : statusVal === "approved" || statusVal === "resolved" ? "var(--app-success, #22c55e)" : statusVal === "rejected" || statusVal === "denied" ? "var(--app-danger, #ef4444)" : isUnread ? "var(--app-accent, #3b82f6)" : "transparent";
          return /* @__PURE__ */ jsxs4(
            "div",
            {
              onClick: () => handleMailRowClick(record),
              style: {
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
                padding: "0.875rem 1.25rem",
                cursor: "pointer",
                borderBottom: "1px solid var(--app-border, #1f2937)",
                transition: "background 0.1s",
                fontWeight: isUnread ? 600 : 400
              },
              onMouseEnter: (e) => {
                e.currentTarget.style.background = "var(--app-surface-2, #1f2937)";
              },
              onMouseLeave: (e) => {
                e.currentTarget.style.background = "transparent";
              },
              children: [
                /* @__PURE__ */ jsx4("div", { style: {
                  width: "0.5rem",
                  height: "0.5rem",
                  borderRadius: "50%",
                  background: dotColor,
                  flexShrink: 0,
                  marginTop: "0.375rem"
                } }),
                record.photoDataURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  /* @__PURE__ */ jsx4("img", { src: String(record.photoDataURL), alt: "", style: { width: "2rem", height: "2rem", borderRadius: "50%", objectFit: "cover", flexShrink: 0 } })
                ) : /* @__PURE__ */ jsx4("div", { style: {
                  width: "2rem",
                  height: "2rem",
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: "var(--app-surface-2, #1f2937)",
                  border: "1px solid var(--app-border-2, #374151)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.625rem",
                  fontWeight: 700,
                  color: "var(--app-text-2, #d1d5db)"
                }, children: title.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase() }),
                /* @__PURE__ */ jsxs4("div", { style: { flex: 1, minWidth: 0 }, children: [
                  /* @__PURE__ */ jsxs4("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }, children: [
                    /* @__PURE__ */ jsx4("span", { style: {
                      fontSize: "0.8125rem",
                      color: isUnread ? "var(--app-text, #f9fafb)" : "var(--app-text-2, #d1d5db)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }, children: title }),
                    /* @__PURE__ */ jsx4("span", { style: { fontSize: "0.625rem", color: "var(--app-text-4, #6b7280)", flexShrink: 0 }, children: dateStr })
                  ] }),
                  preview && /* @__PURE__ */ jsx4("p", { style: {
                    margin: "0.125rem 0 0",
                    fontSize: "0.75rem",
                    color: "var(--app-text-4, #6b7280)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontWeight: 400
                  }, children: preview }),
                  statusVal && /* @__PURE__ */ jsx4("span", { style: {
                    display: "inline-block",
                    marginTop: "0.25rem",
                    fontSize: "0.5625rem",
                    fontWeight: 700,
                    padding: "0.0625rem 0.375rem",
                    borderRadius: "9999px",
                    border: `1px solid ${dotColor}`,
                    color: dotColor,
                    background: dotColor === "transparent" ? "var(--app-surface-2, #1f2937)" : void 0
                  }, children: statusVal.charAt(0).toUpperCase() + statusVal.slice(1) })
                ] }),
                /* @__PURE__ */ jsx4("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "var(--app-text-5, #4b5563)", strokeWidth: 2, style: { flexShrink: 0, marginTop: "0.25rem" }, children: /* @__PURE__ */ jsx4("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M8.25 4.5l7.5 7.5-7.5 7.5" }) })
              ]
            },
            record.id
          );
        }) })
      ) : (
        /* ── Table mode ───────────────────────────────────────────────── */
        /* @__PURE__ */ jsxs4("div", { className: "cl-table-wrap", children: [
          /* @__PURE__ */ jsx4("div", { className: "cl-table-scroll", ref: tableScrollRef, onScroll: syncHThumb, children: /* @__PURE__ */ jsxs4("table", { className: "cl-table", role: "grid", children: [
            /* @__PURE__ */ jsx4("thead", { className: "cl-thead", children: /* @__PURE__ */ jsxs4("tr", { children: [
              expandable && onRowClick && /* @__PURE__ */ jsx4("th", { className: "cl-th narrow", style: { width: "2rem" } }),
              visibleColDefs.map((col) => {
                const sortIdx = sorts.findIndex((s) => s.field === col.key);
                const isSorted = sortIdx >= 0;
                const sortEntry = isSorted ? sorts[sortIdx] : null;
                const isDragging = dragCol === col.key;
                const isDragOver = dragOverCol === col.key && dragCol !== col.key;
                const spec = filters[col.key];
                const isFiltered = spec ? spec.kind === "enum" || spec.kind === "enum-exclude" ? spec.values.length > 0 : spec.kind === "text" || spec.kind === "text-startswith" ? !!spec.q : spec.kind === "empty" || spec.kind === "not-empty" ? true : !!(spec.min || spec.max) : false;
                return /* @__PURE__ */ jsx4(
                  "th",
                  {
                    "aria-sort": isSorted ? sortEntry.dir === "asc" ? "ascending" : "descending" : "none",
                    className: [
                      "cl-th",
                      col.meta ? "meta" : "",
                      isDragging ? "dragging" : "",
                      isDragOver ? "drag-over" : ""
                    ].filter(Boolean).join(" "),
                    onDragOver: (e) => {
                      e.preventDefault();
                      if (dragCol && dragCol !== col.key) setDragOverCol(col.key);
                    },
                    onDrop: () => {
                      if (dragCol && dragCol !== col.key) reorderCol(dragCol, col.key);
                      setDragOverCol(null);
                    },
                    children: /* @__PURE__ */ jsxs4("div", { className: "cl-th-inner", children: [
                      /* @__PURE__ */ jsx4(
                        "span",
                        {
                          className: "cl-drag-grip",
                          draggable: true,
                          onDragStart: (e) => {
                            e.stopPropagation();
                            setDragCol(col.key);
                          },
                          onDragEnd: () => {
                            setDragCol(null);
                            setDragOverCol(null);
                          },
                          title: "Drag to reorder",
                          children: /* @__PURE__ */ jsxs4("svg", { width: "12", height: "12", fill: "currentColor", viewBox: "0 0 16 16", children: [
                            /* @__PURE__ */ jsx4("circle", { cx: "5", cy: "4", r: "1.5" }),
                            /* @__PURE__ */ jsx4("circle", { cx: "11", cy: "4", r: "1.5" }),
                            /* @__PURE__ */ jsx4("circle", { cx: "5", cy: "8", r: "1.5" }),
                            /* @__PURE__ */ jsx4("circle", { cx: "11", cy: "8", r: "1.5" }),
                            /* @__PURE__ */ jsx4("circle", { cx: "5", cy: "12", r: "1.5" }),
                            /* @__PURE__ */ jsx4("circle", { cx: "11", cy: "12", r: "1.5" })
                          ] })
                        }
                      ),
                      col.sortable ? /* @__PURE__ */ jsxs4("button", { className: "cl-sort-btn" + (isSorted ? " sorted" : ""), onClick: (e) => handleSort(col.key, e.shiftKey), children: [
                        col.label,
                        /* @__PURE__ */ jsx4("span", { className: "cl-sort-arrow" + (isSorted ? "" : " unsorted"), children: isSorted ? /* @__PURE__ */ jsxs4(Fragment, { children: [
                          sorts.length > 1 && /* @__PURE__ */ jsx4("span", { style: { fontSize: "0.5rem", color: "var(--cl-text-4)", marginRight: "0.125rem" }, children: sortIdx + 1 }),
                          sortEntry.dir === "asc" ? "\u2191" : "\u2193"
                        ] }) : "\u2195" })
                      ] }) : /* @__PURE__ */ jsx4("span", { children: col.label }),
                      isFiltered && /* @__PURE__ */ jsx4("span", { className: "cl-filter-count", children: "\\u25CF" })
                    ] })
                  },
                  col.key
                );
              }),
              showActionsCol && /* @__PURE__ */ jsx4("th", { className: "cl-th-actions", children: "Actions" })
            ] }) }),
            /* @__PURE__ */ jsx4("tbody", { children: groupedRows.map((group, groupIdx) => {
              const showSectionHeader = resolvedGroupBy && group.label;
              return /* @__PURE__ */ jsxs4(React2.Fragment, { children: [
                showSectionHeader && /* @__PURE__ */ jsx4("tr", { className: `cl-tr-section ${group.key}-section`, children: /* @__PURE__ */ jsx4("td", { colSpan: totalColSpan, children: /* @__PURE__ */ jsxs4("div", { className: "cl-section-label", children: [
                  /* @__PURE__ */ jsx4(
                    "span",
                    {
                      className: `cl-section-dot${group.pulse ? " pulse" : ""}`,
                      style: { background: group.color }
                    }
                  ),
                  /* @__PURE__ */ jsx4("span", { className: "cl-section-title", style: { color: group.color }, children: group.label }),
                  /* @__PURE__ */ jsxs4("span", { className: "cl-section-count", children: [
                    group.rows.length,
                    hasMore ? "+" : ""
                  ] })
                ] }) }) }),
                group.rows.map((client) => /* @__PURE__ */ jsxs4("tr", { className: "cl-tr", children: [
                  expandable && onRowClick && /* @__PURE__ */ jsx4("td", { className: "cl-td narrow", style: { width: "2rem", cursor: "pointer" }, children: /* @__PURE__ */ jsx4(
                    "button",
                    {
                      type: "button",
                      title: "View details",
                      onClick: () => onRowClick(client),
                      className: "cl-expand-btn",
                      style: { display: "flex", alignItems: "center", opacity: 0.5, background: "none", border: "none", padding: 0, cursor: "pointer" },
                      onMouseEnter: (e) => e.currentTarget.style.opacity = "1",
                      onMouseLeave: (e) => e.currentTarget.style.opacity = "0.5",
                      children: /* @__PURE__ */ jsx4(ChevronRightIcon, { style: { width: 12, height: 12 } })
                    }
                  ) }),
                  visibleColDefs.map((col) => renderCell(col, client)),
                  showActionsCol && /* @__PURE__ */ jsx4("td", { className: "cl-td-actions", children: /* @__PURE__ */ jsxs4("div", { style: { display: "flex", alignItems: "center", gap: "0.375rem" }, children: [
                    onEditRecord && isPrivileged && /* @__PURE__ */ jsx4(
                      "button",
                      {
                        className: "cl-delete-btn",
                        style: { color: "var(--cl-accent)" },
                        title: "Edit subcollections",
                        "aria-label": "Edit record details",
                        onClick: () => onEditRecord(client),
                        children: /* @__PURE__ */ jsx4(PencilSquareIcon, { style: { width: 14, height: 14 } })
                      }
                    ),
                    onDeleteRecord && canDelete("_record") && !client?.protected && /* @__PURE__ */ jsx4(
                      "button",
                      {
                        className: "cl-delete-btn",
                        title: "Delete record",
                        "aria-label": "Delete record",
                        onClick: () => requestDeleteRecord(client),
                        children: /* @__PURE__ */ jsx4(TrashIconBtn, {})
                      }
                    )
                  ] }) })
                ] }, client.id))
              ] }, group.key);
            }) })
          ] }) }),
          hThumb.show && /* @__PURE__ */ jsxs4("div", { className: "cl-hscroll-bar", children: [
            /* @__PURE__ */ jsx4("button", { className: "cl-scroll-left-btn", onClick: scrollToLeft, title: "Scroll to start", children: "\u2039" }),
            /* @__PURE__ */ jsx4("div", { className: "cl-hscroll-track", ref: hScrollTrackRef, onMouseDown: onTrackClick, children: /* @__PURE__ */ jsx4(
              "div",
              {
                className: "cl-hscroll-thumb",
                style: { left: hThumb.left, width: hThumb.width },
                onMouseDown: onThumbMouseDown,
                onClick: (e) => e.stopPropagation()
              }
            ) })
          ] })
        ] })
      ) : /* @__PURE__ */ jsxs4("div", { className: "cl-empty", children: [
        /* @__PURE__ */ jsx4("div", { className: "cl-empty-icon", children: /* @__PURE__ */ jsx4(MagnifyingGlassIcon, { style: { width: 28, height: 28, color: "var(--cl-text-4)" } }) }),
        /* @__PURE__ */ jsx4("p", { className: "cl-empty-title", children: "No records found" }),
        /* @__PURE__ */ jsx4("p", { className: "cl-empty-sub", children: "Try adjusting your search or filters." })
      ] }),
      !schemaStyle?.hideFooter && /* @__PURE__ */ jsxs4("div", { className: "cl-pagination", children: [
        /* @__PURE__ */ jsxs4("div", { style: { display: "flex", alignItems: "center", gap: "0.375rem", marginRight: "auto" }, children: [
          /* @__PURE__ */ jsx4("span", { style: { fontSize: "0.6875rem", color: "var(--cl-text-4)" }, children: "Rows" }),
          /* @__PURE__ */ jsxs4(
            "select",
            {
              value: pageSize,
              onChange: (e) => {
                const v = Number(e.target.value);
                setPageSize(v);
                setPage(0);
              },
              style: {
                background: "var(--cl-surface-2)",
                border: "1px solid var(--cl-border-2)",
                borderRadius: "0.375rem",
                padding: "0.1875rem 0.375rem",
                fontSize: "0.6875rem",
                color: "var(--cl-text)",
                outline: "none",
                cursor: "pointer"
              },
              children: [
                [10, 20, 30, 50, 100].map((n) => /* @__PURE__ */ jsx4("option", { value: n, children: n }, n)),
                /* @__PURE__ */ jsx4("option", { value: 0, children: "All" })
              ]
            }
          )
        ] }),
        totalPages > 1 && /* @__PURE__ */ jsxs4(Fragment, { children: [
          /* @__PURE__ */ jsxs4(
            "button",
            {
              className: "cl-page-btn",
              onClick: () => setPage((p) => p - 1),
              disabled: page === 0,
              children: [
                /* @__PURE__ */ jsx4("svg", { width: "12", height: "12", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ jsx4("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 19l-7-7 7-7" }) }),
                "Prev"
              ]
            }
          ),
          /* @__PURE__ */ jsxs4("span", { className: "cl-page-info", children: [
            "Page ",
            page + 1,
            " of ",
            totalPages
          ] }),
          /* @__PURE__ */ jsxs4(
            "button",
            {
              className: "cl-page-btn",
              onClick: () => setPage((p) => p + 1),
              disabled: page >= totalPages - 1,
              children: [
                "Next",
                /* @__PURE__ */ jsx4("svg", { width: "12", height: "12", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ jsx4("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 5l7 7-7 7" }) })
              ]
            }
          )
        ] })
      ] })
    ] }),
    typeof document !== "undefined" && showPermissions && createPortal(renderPermissionsEditor(), document.body),
    typeof document !== "undefined" && showSchemaEditor && createPortal(renderSchemaEditor(), document.body),
    mailDetailRecord && typeof document !== "undefined" && createPortal(
      /* @__PURE__ */ jsx4("div", { className: "cl-sheet-overlay", onClick: () => setMailDetailRecord(null), children: /* @__PURE__ */ jsxs4("div", { className: "cl-sheet", onClick: (e) => e.stopPropagation(), children: [
        /* @__PURE__ */ jsxs4("div", { className: "cl-sheet-header", children: [
          /* @__PURE__ */ jsxs4("div", { children: [
            /* @__PURE__ */ jsx4("div", { className: "cl-sheet-title", children: mailDetailRecord.displayLabel ?? String(mailDetailRecord.fullName ?? mailDetailRecord.name ?? mailDetailRecord.subject ?? mailDetailRecord.id) }),
            mailDetailRecord.email && /* @__PURE__ */ jsx4("div", { className: "cl-sheet-sub", children: String(mailDetailRecord.email) })
          ] }),
          /* @__PURE__ */ jsx4("button", { className: "cl-sheet-close", onClick: () => setMailDetailRecord(null), children: /* @__PURE__ */ jsx4(XMarkIcon, { style: { width: 16, height: 16 } }) })
        ] }),
        /* @__PURE__ */ jsx4("div", { className: "cl-sheet-body", children: visibleColDefs.filter((col) => {
          const v = mailDetailRecord[col.key];
          return v != null && String(v) !== "";
        }).map((col) => /* @__PURE__ */ jsxs4("div", { style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          padding: "0.5rem 0",
          borderBottom: "1px solid var(--cl-border)"
        }, children: [
          /* @__PURE__ */ jsx4("span", { style: { fontSize: "0.75rem", color: "var(--cl-text-4)", fontWeight: 600, flexShrink: 0 }, children: col.label }),
          /* @__PURE__ */ jsx4("span", { style: { fontSize: "0.8125rem", color: "var(--cl-text)", textAlign: "right", marginLeft: "1rem", wordBreak: "break-word" }, children: col.render ? col.render(mailDetailRecord[col.key], mailDetailRecord, { uid: uid3 ?? "", userName, isPrivileged: isAdmin, canEdit: () => false, canDelete: () => false, startEdit: () => {
          } }) : formatFieldValue(mailDetailRecord[col.key]) })
        ] }, col.key)) }),
        /* @__PURE__ */ jsx4("div", { className: "cl-sheet-footer", children: /* @__PURE__ */ jsx4("button", { onClick: () => setMailDetailRecord(null), style: {
          padding: "0.5rem 1.5rem",
          borderRadius: "0.5rem",
          background: "var(--cl-surface-2)",
          border: "1px solid var(--cl-border-2)",
          color: "var(--cl-text-3)",
          fontSize: "0.75rem",
          fontWeight: 600,
          cursor: "pointer"
        }, children: "Close" }) })
      ] }) }),
      document.body
    ),
    confirmDialog && typeof document !== "undefined" && createPortal(
      /* @__PURE__ */ jsx4("div", { className: "cl-confirm-overlay", onClick: () => {
        if (!confirmLoading) setConfirmDialog(null);
      }, children: /* @__PURE__ */ jsxs4("div", { className: "cl-confirm-card", onClick: (e) => e.stopPropagation(), children: [
        /* @__PURE__ */ jsx4("div", { className: "cl-confirm-title", children: confirmDialog.title }),
        /* @__PURE__ */ jsx4("div", { className: "cl-confirm-message", children: confirmDialog.message }),
        /* @__PURE__ */ jsxs4("div", { className: "cl-confirm-actions", children: [
          /* @__PURE__ */ jsx4(
            "button",
            {
              className: "cl-confirm-cancel",
              onClick: () => setConfirmDialog(null),
              disabled: confirmLoading,
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsx4(
            "button",
            {
              className: "cl-confirm-danger",
              disabled: confirmLoading,
              onClick: async () => {
                setConfirmLoading(true);
                try {
                  await confirmDialog.onConfirm();
                  setConfirmDialog(null);
                } catch (err) {
                  console.error("[OdsList] Confirm action failed:", err);
                } finally {
                  setConfirmLoading(false);
                }
              },
              children: confirmLoading ? /* @__PURE__ */ jsx4(Spinner, {}) : "Delete"
            }
          )
        ] })
      ] }) }),
      document.body
    ),
    noteDialog && typeof document !== "undefined" && createPortal(
      /* @__PURE__ */ jsx4("div", { className: "cl-confirm-overlay", onClick: () => {
        if (!noteSaving) setNoteDialog(null);
      }, children: /* @__PURE__ */ jsxs4("div", { className: "cl-confirm-card", onClick: (e) => e.stopPropagation(), style: { maxWidth: "32rem" }, children: [
        /* @__PURE__ */ jsx4("div", { className: "cl-confirm-title", children: noteDialog.label }),
        noteDialog.editable ? /* @__PURE__ */ jsx4(
          "textarea",
          {
            value: noteDraft,
            onChange: (e) => setNoteDraft(e.target.value),
            rows: 6,
            style: {
              width: "100%",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.375rem",
              background: "var(--app-surface-2)",
              border: "1px solid var(--app-border-2)",
              color: "var(--app-text)",
              fontSize: "0.8125rem",
              lineHeight: 1.6,
              resize: "vertical",
              outline: "none",
              fontFamily: "inherit",
              marginBottom: "1rem"
            },
            autoFocus: true
          }
        ) : /* @__PURE__ */ jsx4("div", { style: {
          whiteSpace: "pre-wrap",
          fontSize: "0.8125rem",
          color: "var(--app-text-2)",
          lineHeight: 1.6,
          marginBottom: "1rem",
          maxHeight: "20rem",
          overflowY: "auto"
        }, children: noteDialog.value || /* @__PURE__ */ jsx4("span", { style: { color: "var(--app-text-5)", fontStyle: "italic" }, children: "Empty" }) }),
        /* @__PURE__ */ jsxs4("div", { className: "cl-confirm-actions", children: [
          /* @__PURE__ */ jsx4(
            "button",
            {
              className: "cl-confirm-cancel",
              onClick: () => setNoteDialog(null),
              disabled: noteSaving,
              children: noteDialog.editable ? "Cancel" : "Close"
            }
          ),
          noteDialog.editable && /* @__PURE__ */ jsx4(
            "button",
            {
              style: {
                background: "var(--app-accent)",
                border: "none",
                color: "white",
                padding: "0.375rem 0.875rem",
                borderRadius: "0.375rem",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                opacity: noteSaving ? 0.5 : 1
              },
              disabled: noteSaving,
              onClick: async () => {
                if (!onSave || noteDraft === noteDialog.value) {
                  setNoteDialog(null);
                  return;
                }
                setNoteSaving(true);
                try {
                  await onSave(noteDialog.id, noteDialog.field, noteDraft, userName);
                  setClients((prev) => prev.map(
                    (c) => c.id === noteDialog.id ? { ...c, [noteDialog.field]: noteDraft } : c
                  ));
                  setNoteDialog(null);
                } catch (err) {
                  console.error("[OdsList] Note save failed:", err);
                } finally {
                  setNoteSaving(false);
                }
              },
              children: noteSaving ? /* @__PURE__ */ jsx4(Spinner, {}) : "Save"
            }
          )
        ] })
      ] }) }),
      document.body
    )
  ] });
}

// ChatApp.tsx
import { useEffect as useEffect2, useState as useState3, useRef as useRef2, useCallback as useCallback2, useMemo as useMemo3 } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  getDocs,
  where,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  Timestamp
} from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { Fragment as Fragment2, jsx as jsx5, jsxs as jsxs5 } from "react/jsx-runtime";
function dmId(a, b) {
  return "dm_" + [a, b].sort().join("__");
}
function fmtTime(ts) {
  if (!ts) return "";
  return new Date(ts.seconds * 1e3).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}
function fmtConvTime(ts) {
  if (!ts) return "";
  const d = new Date(ts.seconds * 1e3);
  const now = /* @__PURE__ */ new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const yest = new Date(now);
  yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function dayLabel(ts) {
  if (!ts) return "";
  const d = new Date(ts.seconds * 1e3);
  const today = /* @__PURE__ */ new Date();
  const yest = new Date(today);
  yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}
var AVATAR_COLORS = [
  "bg-blue-600",
  "bg-purple-600",
  "bg-green-600",
  "bg-orange-500",
  "bg-pink-600",
  "bg-teal-600",
  "bg-indigo-600",
  "bg-rose-600"
];
function avatarBg(uid3) {
  let h = 0;
  for (let i = 0; i < uid3.length; i++) h = h * 31 + uid3.charCodeAt(i) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function initials(name) {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase();
}
var LEVEL_TITLES = {
  1: "Account Representative",
  2: "Junior Closer",
  3: "Senior Closer",
  4: "Elite Closer",
  5: "Master Closer",
  6: "Team Lead",
  7: "Team Captain",
  8: "Squad Leader",
  9: "Commander",
  10: "Developer"
};
var LEVEL_BADGE = {
  1: { bg: "bg-gray-600", text: "text-white" },
  2: { bg: "bg-emerald-600", text: "text-white" },
  3: { bg: "bg-blue-600", text: "text-white" },
  4: { bg: "bg-violet-600", text: "text-white" },
  5: { bg: "bg-orange-500", text: "text-white" },
  6: { bg: "bg-amber-500", text: "text-app-text" },
  7: { bg: "bg-red-600", text: "text-white" },
  8: { bg: "bg-cyan-500", text: "text-app-text" },
  9: { bg: "bg-yellow-400", text: "text-app-text" },
  10: { bg: "bg-red-500", text: "text-white" }
};
var LEVEL_SHORT = {
  1: "CSR",
  2: "JUNIOR",
  3: "SENIOR",
  4: "ELITE",
  5: "MASTER",
  6: "LEAD",
  7: "CAPTAIN",
  8: "SQUAD",
  9: "COMPANY",
  10: "DEV"
};
function Avatar({ photoURL, name, uid: uid3, size = "md", status, level }) {
  const dim = size === "sm" ? "w-8 h-8" : size === "lg" ? "w-11 h-11" : "w-9 h-9";
  const fsize = size === "sm" ? "text-xs" : size === "lg" ? "text-sm" : "text-xs";
  const hasLevel = level != null;
  const badge = hasLevel ? LEVEL_BADGE[level] : null;
  return /* @__PURE__ */ jsxs5("div", { className: `relative shrink-0 inline-flex${hasLevel ? " mb-2" : ""}`, children: [
    photoURL ? /* @__PURE__ */ jsx5("img", { src: photoURL, alt: name, className: `${dim} rounded-full object-cover` }) : /* @__PURE__ */ jsx5("div", { className: `${dim} ${fsize} rounded-full flex items-center justify-center font-bold text-white select-none ${avatarBg(uid3)}`, children: initials(name) }),
    badge && /* @__PURE__ */ jsx5("div", { className: `absolute -bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-px rounded text-[8px] font-bold tracking-widest uppercase whitespace-nowrap border border-app-surface ${badge.bg} ${badge.text}`, children: LEVEL_SHORT[level] }),
    hasLevel && (level ?? 0) > 0 && /* @__PURE__ */ jsx5("div", { className: "absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] rounded-full bg-app-surface-2 border border-app-border-2 flex items-center justify-center text-[9px] font-bold text-app-text leading-none px-0.5", children: level }),
    status !== void 0 && /* @__PURE__ */ jsx5("span", { className: `absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-app-surface ${status === "active" ? "bg-app-success" : status === "idle" ? "bg-app-warning" : "bg-app-danger"}` })
  ] });
}
function renderWithMentions(text, myDisplayName) {
  const parts = text.split(/(@\S+(?:\s\S+)?)/g);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      const isSelf = part.slice(1).trim().toLowerCase() === myDisplayName.toLowerCase() || myDisplayName.toLowerCase().startsWith(part.slice(1).trim().toLowerCase());
      return /* @__PURE__ */ jsx5("span", { className: `inline font-semibold rounded px-0.5 ${isSelf ? "bg-yellow-400/20 text-yellow-300" : "text-blue-400"}`, children: part }, i);
    }
    return /* @__PURE__ */ jsx5("span", { children: part }, i);
  });
}
var ROLE_GROUP_ORDER = ["owner", "admin", "manager", "rep"];
var DEFAULT_CHAT_PERMS = {
  sendMessages: { lead: true, admin: true, mgr: true, rep: true },
  startDMs: { lead: true, admin: true, mgr: true, rep: true },
  view7DayHistory: { lead: true, admin: true, mgr: true, rep: true },
  viewFullHistory: { lead: true, admin: false, mgr: false, rep: false },
  createChannels: { lead: true, admin: false, mgr: false, rep: false },
  manageMembers: { lead: true, admin: false, mgr: false, rep: false },
  deleteChannels: { lead: true, admin: false, mgr: false, rep: false },
  chatSettings: { lead: true, admin: false, mgr: false, rep: false }
};
var PERM_LABELS = [
  { key: "sendMessages", label: "Send messages" },
  { key: "startDMs", label: "Start DMs" },
  { key: "view7DayHistory", label: "View 7-day history" },
  { key: "viewFullHistory", label: "View full history" },
  { key: "createChannels", label: "Create channels" },
  { key: "manageMembers", label: "Manage members" },
  { key: "deleteChannels", label: "Delete channels" },
  { key: "chatSettings", label: "Chat settings" }
];
function ChatApp({ db: db2, storage, currentUser, isAdminLevel }) {
  const myUid = currentUser.uid;
  const me = currentUser;
  function roleLabel(role, level) {
    if (level != null && LEVEL_TITLES[level]) return LEVEL_TITLES[level];
    if (role === "developer") return "Developer";
    if (role === "owner") return "Owner";
    if (isAdminLevel(role)) return "Admin";
    if (role === "manager") return "Manager";
    return "Rep";
  }
  function teamLabel(u) {
    if (u.teamNumber) return `Team ${u.teamNumber}`;
    return roleLabel(u.role, u.level);
  }
  const [allUsers, setAllUsers] = useState3([]);
  const [convs, setConvs] = useState3([]);
  const [generalMeta, setGeneralMeta] = useState3({});
  const [activeChatId, setActiveChatId] = useState3("general");
  const [messages, setMessages] = useState3([]);
  const [draft, setDraft] = useState3("");
  const [imageFile, setImageFile] = useState3(null);
  const [imagePreview, setImagePreview] = useState3("");
  const [sending, setSending] = useState3(false);
  const [searchText, setSearchText] = useState3("");
  const [loading, setLoading] = useState3(true);
  const [presence, setPresence] = useState3({});
  const [lightboxUrl, setLightboxUrl] = useState3("");
  const [showCreateGroup, setShowCreateGroup] = useState3(false);
  const [newGroupName, setNewGroupName] = useState3("");
  const [newGroupMembers, setNewGroupMembers] = useState3([]);
  const [creatingGroup, setCreatingGroup] = useState3(false);
  const [showManageMembers, setShowManageMembers] = useState3(false);
  const [deleteConfirm, setDeleteConfirm] = useState3(null);
  const [showDeleted, setShowDeleted] = useState3(false);
  const [showChatSettings, setShowChatSettings] = useState3(false);
  const [showRemovedChats, setShowRemovedChats] = useState3(true);
  const chatSettingsBtnRef = useRef2(null);
  const chatSettingsPanelRef = useRef2(null);
  const [settingsFlyoutPos, setSettingsFlyoutPos] = useState3({ left: 0, top: 0 });
  const [showSearch, setShowSearch] = useState3(false);
  const [showPermissions, setShowPermissions] = useState3(false);
  const permissionsRef = useRef2(null);
  const [collapsedGroups, setCollapsedGroups] = useState3(/* @__PURE__ */ new Set());
  const [chatPerms, setChatPerms] = useState3(DEFAULT_CHAT_PERMS);
  const [archiveConfig, setArchiveConfig] = useState3(null);
  const [showArchived, setShowArchived] = useState3(false);
  const [archiveSaving, setArchiveSaving] = useState3(false);
  const [archiveDraftStart, setArchiveDraftStart] = useState3("");
  const [archiveDraftDuration, setArchiveDraftDuration] = useState3("weekly");
  const [pinnedIds, setPinnedIds] = useState3([]);
  const [groupOrder, setGroupOrder] = useState3([]);
  const [dragOverGroupId, setDragOverGroupId] = useState3(null);
  const dragGroupRef = useRef2(null);
  const [mentionQuery, setMentionQuery] = useState3("");
  const [mentionOpen, setMentionOpen] = useState3(false);
  const [mentionIndex, setMentionIndex] = useState3(0);
  const [mentionStart, setMentionStart] = useState3(-1);
  const mentionListRef = useRef2(null);
  const bottomRef = useRef2(null);
  const scrollRef = useRef2(null);
  const textareaRef = useRef2(null);
  const fileInputRef = useRef2(null);
  const isAtBottomRef = useRef2(true);
  const isOwnerRef = useRef2(currentUser.role === "owner" || currentUser.role === "developer");
  const justChangedRef = useRef2(true);
  const isOwner = currentUser.role === "owner" || currentUser.role === "developer";
  const isDeveloper = currentUser.role === "developer";
  useEffect2(() => {
    getDocs(collection(db2, "users")).then((snap) => {
      const users = [];
      snap.forEach((d) => users.push({ uid: d.id, ...d.data() }));
      setAllUsers(users.filter((u) => u.active !== false));
    }).catch(() => {
    }).finally(() => setLoading(false));
  }, [db2]);
  useEffect2(() => {
    const unsub = onSnapshot(doc(db2, "chats", "general"), (snap) => {
      if (snap.exists()) setGeneralMeta(snap.data());
    }, () => {
    });
    return () => unsub();
  }, [db2]);
  const isDev = me.role === "developer" || me.role === "owner";
  useEffect2(() => {
    const q = isDev ? query(collection(db2, "chats")) : query(collection(db2, "chats"), where("participants", "array-contains", myUid));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setConvs(list.sort((a, b) => (b.lastMessageAt?.seconds ?? 0) - (a.lastMessageAt?.seconds ?? 0)));
    }, () => {
    });
    return () => unsub();
  }, [db2, myUid, isDev]);
  useEffect2(() => {
    const STALE_MS = 3 * 60 * 1e3;
    const unsub = onSnapshot(collection(db2, "presence"), (snap) => {
      const now = Date.now();
      const map = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        const lastSeen = data.lastSeen?.toMillis?.() ?? 0;
        const stale = now - lastSeen > STALE_MS;
        if (stale) {
          map[d.id] = "offline";
          return;
        }
        if (data.status === "active" || data.status === "idle") map[d.id] = data.status;
        else if (data.online === true) map[d.id] = "active";
        else map[d.id] = "offline";
      });
      setPresence(map);
    }, () => {
    });
    return () => unsub();
  }, [db2]);
  useEffect2(() => {
    if (!activeChatId) return;
    setMessages([]);
    isAtBottomRef.current = true;
    justChangedRef.current = true;
    const SEVEN_DAYS_AGO = Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3));
    const q = isOwnerRef.current ? query(collection(db2, "chats", activeChatId, "messages"), orderBy("createdAt", "asc"), limit(500)) : query(collection(db2, "chats", activeChatId, "messages"), where("createdAt", ">=", SEVEN_DAYS_AGO), orderBy("createdAt", "asc"), limit(300));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, () => {
    });
    return () => unsub();
  }, [db2, activeChatId]);
  useEffect2(() => {
    if (messages.length === 0) return;
    const shouldScroll = justChangedRef.current || isAtBottomRef.current;
    if (!shouldScroll) return;
    if (justChangedRef.current) justChangedRef.current = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      });
    });
  }, [messages]);
  const handleScroll = useCallback2(() => {
    const el = scrollRef.current;
    if (!el) return;
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);
  useEffect2(() => {
    try {
      const savedGroup = localStorage.getItem(`groupOrder_${myUid}`);
      if (savedGroup) setGroupOrder(JSON.parse(savedGroup));
      const savedShowRemoved = localStorage.getItem(`chatSettings_showRemovedChats_${myUid}`);
      if (savedShowRemoved !== null) setShowRemovedChats(savedShowRemoved === "true");
      const savedPinned = localStorage.getItem(`pinnedChats_${myUid}`);
      if (savedPinned) setPinnedIds(JSON.parse(savedPinned));
    } catch {
    }
  }, [myUid]);
  const togglePin = (chatId) => {
    setPinnedIds((prev) => {
      const next = prev.includes(chatId) ? prev.filter((id) => id !== chatId) : [...prev, chatId];
      try {
        localStorage.setItem(`pinnedChats_${myUid}`, JSON.stringify(next));
      } catch {
      }
      return next;
    });
  };
  useEffect2(() => {
    const unsub = onSnapshot(doc(db2, "settings", "chatConfig"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const cfg = { startDate: data.archiveStartDate ?? "", duration: data.archiveDuration ?? "weekly" };
        setArchiveConfig(cfg);
        setArchiveDraftStart(cfg.startDate);
        setArchiveDraftDuration(cfg.duration);
        if (data.permissions) {
          setChatPerms((prev) => ({ ...prev, ...data.permissions }));
        }
      }
    }, () => {
    });
    return () => unsub();
  }, [db2]);
  useEffect2(() => {
    if (!showChatSettings) return;
    if (chatSettingsBtnRef.current) {
      const r = chatSettingsBtnRef.current.getBoundingClientRect();
      setSettingsFlyoutPos({ left: r.right + 4, top: r.top });
    }
    const handle = (e) => {
      const t = e.target;
      const inBtn = chatSettingsBtnRef.current?.contains(t);
      const inPanel = chatSettingsPanelRef.current?.contains(t);
      if (!inBtn && !inPanel) setShowChatSettings(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [showChatSettings]);
  useEffect2(() => {
    if (!showPermissions) return;
    const handle = (e) => {
      if (permissionsRef.current && !permissionsRef.current.contains(e.target))
        setShowPermissions(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [showPermissions]);
  useEffect2(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [draft]);
  const sendMessage = async () => {
    const text = draft.trim();
    if (!text && !imageFile || sending) return;
    setSending(true);
    setDraft("");
    const localFile = imageFile;
    const localPreview = imagePreview;
    setImageFile(null);
    if (localPreview.startsWith("blob:")) URL.revokeObjectURL(localPreview);
    setImagePreview("");
    isAtBottomRef.current = true;
    try {
      let imageUrl = "";
      if (localFile) {
        const path = `chat-images/${activeChatId}/${myUid}/${Date.now()}_${localFile.name}`;
        const snap = await uploadBytes(storageRef(storage, path), localFile, { contentType: localFile.type });
        imageUrl = await getDownloadURL(snap.ref);
      }
      await addDoc(collection(db2, "chats", activeChatId, "messages"), {
        text,
        ...imageUrl ? { imageUrl } : {},
        uid: myUid,
        senderId: myUid,
        displayName: `${me.firstName} ${me.lastName}`,
        photoURL: me.photoURL ?? "",
        role: me.role,
        createdAt: serverTimestamp()
      });
      await setDoc(doc(db2, "chats", activeChatId), {
        lastMessage: imageUrl ? "\u{1F4F7} Photo" : text.slice(0, 100),
        lastMessageAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error("Send failed:", err);
      setDraft(text);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };
  const openDm = async (other) => {
    const chatId = dmId(myUid, other.uid);
    setSearchText("");
    const chatRef = doc(db2, "chats", chatId);
    let docExists = false;
    try {
      const snap = await getDoc(chatRef);
      docExists = snap.exists();
    } catch {
    }
    if (!docExists) {
      await setDoc(chatRef, {
        type: "dm",
        participants: [myUid, other.uid].sort(),
        lastMessage: "",
        lastMessageAt: null,
        createdAt: serverTimestamp()
      });
    }
    setActiveChatId(chatId);
  };
  const deleteConversation = async (chatId) => {
    try {
      await updateDoc(doc(db2, "chats", chatId), { deletedBy: arrayUnion(myUid) });
      setConvs((prev) => prev.map((c) => c.id === chatId ? { ...c, deletedBy: [...c.deletedBy ?? [], myUid] } : c));
      if (activeChatId === chatId) setActiveChatId("general");
    } catch (err) {
      console.error("Delete conversation failed:", err);
    }
    setDeleteConfirm(null);
  };
  const restoreConversation = async (chatId) => {
    if (!showRemovedChats) return;
    try {
      await updateDoc(doc(db2, "chats", chatId), { deletedBy: arrayRemove(myUid) });
      setConvs((prev) => prev.map((c) => c.id === chatId ? { ...c, deletedBy: (c.deletedBy ?? []).filter((u) => u !== myUid) } : c));
    } catch (err) {
      console.error("Restore conversation failed:", err);
    }
  };
  const createGroupChannel = async () => {
    if (!newGroupName.trim() || creatingGroup) return;
    setCreatingGroup(true);
    try {
      const slug = newGroupName.trim().toLowerCase().replace(/\s+/g, "-");
      const participants = Array.from(/* @__PURE__ */ new Set([myUid, ...newGroupMembers]));
      const ref3 = await addDoc(collection(db2, "chats"), {
        type: "group",
        name: slug,
        participants,
        createdBy: myUid,
        lastMessage: "",
        lastMessageAt: null,
        createdAt: serverTimestamp()
      });
      setShowCreateGroup(false);
      setNewGroupName("");
      setNewGroupMembers([]);
      setActiveChatId(ref3.id);
    } catch (err) {
      console.error("Failed to create channel:", err);
    } finally {
      setCreatingGroup(false);
    }
  };
  const addMember = async (uid3) => {
    await updateDoc(doc(db2, "chats", activeChatId), { participants: arrayUnion(uid3) });
  };
  const removeMember = async (uid3) => {
    await updateDoc(doc(db2, "chats", activeChatId), { participants: arrayRemove(uid3) });
  };
  const deleteChannel = async () => {
    if (!confirm(`Delete #${activeGroupConv?.name ?? activeChatId}? This cannot be undone.`)) return;
    await deleteDoc(doc(db2, "chats", activeChatId));
    setShowManageMembers(false);
    setActiveChatId("general");
  };
  function toggleShowRemovedChats() {
    if (!isOwner) return;
    const next = !showRemovedChats;
    setShowRemovedChats(next);
    if (!next) setShowDeleted(false);
    try {
      localStorage.setItem(`chatSettings_showRemovedChats_${myUid}`, String(next));
    } catch {
    }
  }
  const saveArchiveConfig = async () => {
    if (archiveSaving) return;
    setArchiveSaving(true);
    try {
      await setDoc(doc(db2, "settings", "chatConfig"), {
        archiveStartDate: archiveDraftStart,
        archiveDuration: archiveDraftDuration
      }, { merge: true });
    } catch (err) {
      console.error("Save archive config failed:", err);
    } finally {
      setArchiveSaving(false);
    }
  };
  const togglePerm = async (key, role) => {
    if (!isOwner) return;
    const next = { ...chatPerms, [key]: { ...chatPerms[key], [role]: !chatPerms[key][role] } };
    setChatPerms(next);
    try {
      await setDoc(doc(db2, "settings", "chatConfig"), { permissions: next }, { merge: true });
    } catch (err) {
      console.error("Failed to save permissions", err);
      setChatPerms(chatPerms);
    }
  };
  const archiveNow = async () => {
    if (!confirm("Archive all messages before today? They will be hidden from view until 'Show archived' is enabled.")) return;
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    setArchiveDraftStart(today);
    try {
      await setDoc(doc(db2, "settings", "chatConfig"), {
        archiveStartDate: today,
        archiveDuration: archiveDraftDuration
      }, { merge: true });
    } catch (err) {
      console.error("Archive now failed:", err);
    }
  };
  const mentionUsers = mentionOpen ? allUsers.filter((u) => {
    const name = `${u.firstName} ${u.lastName}`.toLowerCase();
    return name.startsWith(mentionQuery.toLowerCase()) || u.firstName.toLowerCase().startsWith(mentionQuery.toLowerCase());
  }).slice(0, 6) : [];
  const insertMention = useCallback2((user) => {
    const ta = textareaRef.current;
    if (!ta || mentionStart < 0) return;
    const before = draft.slice(0, mentionStart);
    const after = draft.slice(ta.selectionStart);
    const insert = `@${user.firstName} ${user.lastName} `;
    setDraft(before + insert + after);
    setMentionOpen(false);
    setMentionQuery("");
    setMentionStart(-1);
    setTimeout(() => {
      ta.focus();
      const pos = before.length + insert.length;
      ta.setSelectionRange(pos, pos);
    }, 0);
  }, [draft, mentionStart]);
  const handleDraftChange = (e) => {
    const val = e.target.value;
    const caret = e.target.selectionStart ?? val.length;
    setDraft(val);
    const textBefore = val.slice(0, caret);
    const atIdx = textBefore.lastIndexOf("@");
    if (atIdx !== -1) {
      const fragment = textBefore.slice(atIdx + 1);
      if (!fragment.includes(" ") && (atIdx === 0 || /\s/.test(textBefore[atIdx - 1]))) {
        setMentionStart(atIdx);
        setMentionQuery(fragment);
        setMentionOpen(true);
        setMentionIndex(0);
        return;
      }
    }
    setMentionOpen(false);
    setMentionQuery("");
    setMentionStart(-1);
  };
  const handleKeyDown = (e) => {
    if (mentionOpen && mentionUsers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((i) => (i + 1) % mentionUsers.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((i) => (i - 1 + mentionUsers.length) % mentionUsers.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(mentionUsers[mentionIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionOpen(false);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  const groupConvs = convs.filter((c) => c.type === "group" && !c.deletedBy?.includes(myUid));
  const dmConvs = convs.filter((c) => c.type === "dm" && !c.deletedBy?.includes(myUid));
  const deletedConvs = convs.filter((c) => c.deletedBy?.includes(myUid));
  const sortedGroupConvs = useMemo3(() => {
    if (groupOrder.length === 0) return groupConvs;
    return [...groupConvs].sort((a, b) => {
      const ai = groupOrder.indexOf(a.id);
      const bi = groupOrder.indexOf(b.id);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [groupConvs, groupOrder]);
  const searchResults = searchText.trim() ? allUsers.filter((u) => u.uid !== myUid && `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchText.toLowerCase())) : [];
  const dmByUid = useMemo3(() => {
    const map = /* @__PURE__ */ new Map();
    for (const c of dmConvs) {
      const otherUid = c.participants.find((p) => p !== myUid);
      if (otherUid) map.set(otherUid, c);
    }
    return map;
  }, [dmConvs, myUid]);
  const usersByGroup = useMemo3(() => {
    const groups = { owner: [], admin: [], manager: [], rep: [] };
    for (const u of allUsers) {
      if (u.uid === myUid) continue;
      let g;
      if (u.role === "owner" || u.role === "developer") g = "owner";
      else if (isAdminLevel(u.role)) g = "admin";
      else if (u.role === "manager") g = "manager";
      else g = "rep";
      groups[g].push(u);
    }
    for (const g of ROLE_GROUP_ORDER) {
      groups[g].sort((a, b) => `${a.firstName}${a.lastName}`.localeCompare(`${b.firstName}${b.lastName}`));
    }
    return groups;
  }, [allUsers, myUid, isAdminLevel]);
  const activeGroupConv = groupConvs.find((c) => c.id === activeChatId);
  const activeDmConv = dmConvs.find((c) => c.id === activeChatId);
  const activeDmOtherUid = activeDmConv?.participants.find((p) => p !== myUid) ?? "";
  const activeDmOther = allUsers.find((u) => u.uid === activeDmOtherUid);
  const activeIsChannel = activeChatId === "general" || !!activeGroupConv;
  const activeParticipants = activeGroupConv?.participants ?? [];
  const activeName = activeChatId === "general" ? "general" : activeGroupConv?.name ?? (activeDmOther ? `${activeDmOther.firstName} ${activeDmOther.lastName}` : "Chat");
  const archiveCutoffMs = archiveConfig?.startDate && !showArchived ? (/* @__PURE__ */ new Date(archiveConfig.startDate + "T00:00:00")).getTime() : 0;
  const visibleMessages = archiveCutoffMs > 0 ? messages.filter((m) => !m.createdAt || m.createdAt.seconds * 1e3 >= archiveCutoffMs) : messages;
  const rows = [];
  let lastDay = "";
  let lastSender = "";
  for (const msg of visibleMessages) {
    const day = dayLabel(msg.createdAt);
    if (day !== lastDay) {
      rows.push({ type: "date", label: day });
      lastDay = day;
      lastSender = "";
    }
    rows.push({ type: "msg", msg, showHeader: msg.uid !== lastSender });
    lastSender = msg.uid;
  }
  const nameSorter = (a, b) => `${a.firstName}${a.lastName}`.localeCompare(`${b.firstName}${b.lastName}`);
  const activeUsers = allUsers.filter((u) => presence[u.uid] === "active").sort(nameSorter);
  const idleUsers = allUsers.filter((u) => presence[u.uid] === "idle").sort(nameSorter);
  const offlineUsers = allUsers.filter((u) => !presence[u.uid] || presence[u.uid] === "offline").sort(nameSorter);
  if (loading) {
    return /* @__PURE__ */ jsx5("div", { className: "flex items-center justify-center h-full bg-app-bg", children: /* @__PURE__ */ jsxs5("svg", { className: "w-6 h-6 animate-spin text-blue-500", fill: "none", viewBox: "0 0 24 24", children: [
      /* @__PURE__ */ jsx5("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
      /* @__PURE__ */ jsx5("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8v8H4z" })
    ] }) });
  }
  return /* @__PURE__ */ jsxs5(Fragment2, { children: [
    /* @__PURE__ */ jsxs5("div", { className: "flex h-full overflow-hidden bg-app-bg", children: [
      /* @__PURE__ */ jsxs5("div", { className: "w-60 shrink-0 bg-app-surface border-r border-app-border flex flex-col", children: [
        /* @__PURE__ */ jsxs5("div", { className: "px-2 pt-3 pb-2 border-b border-app-border shrink-0", children: [
          /* @__PURE__ */ jsxs5("div", { className: "flex items-center gap-0.5", children: [
            /* @__PURE__ */ jsx5(
              "button",
              {
                type: "button",
                onClick: () => {
                  setShowSearch((v) => !v);
                  if (showSearch) setSearchText("");
                },
                title: "Search",
                className: `p-1.5 rounded-lg transition-colors ${showSearch ? "text-app-text bg-app-surface-2" : "text-app-text-4 hover:text-app-text hover:bg-app-surface-2"}`,
                children: /* @__PURE__ */ jsx5("svg", { className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx5("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) })
              }
            ),
            /* @__PURE__ */ jsx5("div", { className: "flex-1" }),
            /* @__PURE__ */ jsxs5("div", { className: "relative", ref: permissionsRef, children: [
              /* @__PURE__ */ jsx5(
                "button",
                {
                  type: "button",
                  onClick: () => setShowPermissions((v) => !v),
                  title: "Permissions",
                  className: `p-1.5 rounded-lg transition-colors ${showPermissions ? "text-app-text bg-app-surface-2" : "text-app-text-4 hover:text-app-text hover:bg-app-surface-2"}`,
                  children: /* @__PURE__ */ jsx5("svg", { className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.8, children: /* @__PURE__ */ jsx5("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" }) })
                }
              ),
              showPermissions && /* @__PURE__ */ jsxs5("div", { className: "absolute top-full left-0 mt-2 w-80 bg-app-surface border border-app-border-2 rounded-lg shadow-xl z-50", children: [
                /* @__PURE__ */ jsxs5("div", { className: "px-4 py-2.5 border-b border-app-border flex items-center justify-between", children: [
                  /* @__PURE__ */ jsx5("p", { className: "text-[10px] font-semibold uppercase tracking-wider text-app-text-4", children: "Chat Permissions" }),
                  isOwner && /* @__PURE__ */ jsx5("p", { className: "text-[9px] text-app-text-5", children: "Click to toggle" })
                ] }),
                /* @__PURE__ */ jsxs5("div", { className: "px-4 py-3", children: [
                  /* @__PURE__ */ jsxs5("div", { className: "grid grid-cols-6 gap-1 pb-2 border-b border-app-border mb-1", children: [
                    /* @__PURE__ */ jsx5("div", { className: "col-span-2" }),
                    ["CSR", "TC/TL", "Admin", "Owner"].map((r) => /* @__PURE__ */ jsx5("p", { className: "text-[8px] font-bold uppercase tracking-wide text-app-text-4 text-center leading-tight", children: r }, r))
                  ] }),
                  PERM_LABELS.map(({ key, label }) => {
                    const row = chatPerms[key];
                    const roles = [
                      { role: "rep", value: row.rep },
                      { role: "mgr", value: row.mgr },
                      { role: "admin", value: row.admin },
                      { role: "lead", value: row.lead }
                    ];
                    return /* @__PURE__ */ jsxs5("div", { className: "grid grid-cols-6 gap-1 items-center py-1", children: [
                      /* @__PURE__ */ jsx5("p", { className: "col-span-2 text-[10px] text-app-text-3 leading-tight", children: label }),
                      roles.map(({ role, value }) => {
                        const canEdit = isDeveloper || isOwner && role !== "lead" && key !== "chatSettings";
                        return /* @__PURE__ */ jsx5("div", { className: "flex items-center justify-center", children: canEdit ? (
                          // Clickable checkbox for owner
                          /* @__PURE__ */ jsx5(
                            "button",
                            {
                              type: "button",
                              onClick: () => togglePerm(key, role),
                              className: `w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${value ? "bg-blue-600 border-blue-500 hover:bg-blue-500" : "bg-app-surface-2 border-app-border-2 hover:border-blue-400"}`,
                              children: value && /* @__PURE__ */ jsx5("svg", { className: "w-2.5 h-2.5 text-white", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 3, children: /* @__PURE__ */ jsx5("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M4.5 12.75l6 6 9-13.5" }) })
                            }
                          )
                        ) : (
                          // Read-only ✓ / ✗ for non-owners and locked cells
                          value ? /* @__PURE__ */ jsx5("svg", { className: "w-3.5 h-3.5 text-green-500", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ jsx5("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M4.5 12.75l6 6 9-13.5" }) }) : /* @__PURE__ */ jsx5("svg", { className: "w-3.5 h-3.5 text-app-text-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ jsx5("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) })
                        ) }, role);
                      })
                    ] }, key);
                  }),
                  /* @__PURE__ */ jsx5("p", { className: "text-[9px] text-app-text-2 mt-3", children: "Owner & Dev always have full access." })
                ] })
              ] })
            ] }),
            isOwner && /* @__PURE__ */ jsx5("div", { ref: chatSettingsBtnRef, children: /* @__PURE__ */ jsx5(
              "button",
              {
                type: "button",
                onClick: () => setShowChatSettings((v) => !v),
                title: "Chat settings",
                className: `p-1.5 rounded-lg transition-colors ${showChatSettings ? "text-app-text bg-app-surface-2" : "text-app-text-4 hover:text-app-text hover:bg-app-surface-2"}`,
                children: /* @__PURE__ */ jsxs5("svg", { className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.8, children: [
                  /* @__PURE__ */ jsx5("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" }),
                  /* @__PURE__ */ jsx5("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" })
                ] })
              }
            ) })
          ] }),
          /* @__PURE__ */ jsx5(
            "div",
            {
              style: {
                maxHeight: showSearch ? "2.5rem" : "0",
                opacity: showSearch ? 1 : 0,
                marginTop: showSearch ? "8px" : "0",
                overflow: "hidden",
                transition: "max-height 0.2s ease, opacity 0.18s ease, margin-top 0.2s ease"
              },
              children: /* @__PURE__ */ jsxs5("div", { className: "relative", children: [
                /* @__PURE__ */ jsx5("svg", { className: "absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-app-text-4 pointer-events-none", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx5("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) }),
                /* @__PURE__ */ jsx5(
                  "input",
                  {
                    type: "text",
                    placeholder: "Find or start a DM\u2026",
                    value: searchText,
                    onChange: (e) => setSearchText(e.target.value),
                    autoFocus: showSearch,
                    className: "w-full pl-8 pr-7 py-1.5 bg-app-surface-2 border border-app-border-2 rounded-md text-app-text text-xs placeholder-app-text-4 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  }
                ),
                searchText && /* @__PURE__ */ jsx5(
                  "button",
                  {
                    type: "button",
                    onClick: () => setSearchText(""),
                    className: "absolute right-2 top-1/2 -translate-y-1/2 text-app-text-4 hover:text-app-text",
                    children: /* @__PURE__ */ jsx5("svg", { className: "w-3 h-3", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx5("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) })
                  }
                )
              ] })
            }
          )
        ] }),
        /* @__PURE__ */ jsx5("div", { className: "flex-1 overflow-y-auto py-2 space-y-1", children: searchText.trim() ? /* @__PURE__ */ jsxs5(Fragment2, { children: [
          /* @__PURE__ */ jsx5("p", { className: "px-3 py-1 text-app-text-4 text-[10px] font-semibold uppercase tracking-wider", children: "People" }),
          searchResults.length === 0 ? /* @__PURE__ */ jsx5("p", { className: "px-3 py-4 text-center text-app-text-5 text-xs", children: "No users found." }) : searchResults.map((u) => /* @__PURE__ */ jsxs5(
            "button",
            {
              type: "button",
              onClick: () => openDm(u),
              className: "w-full flex items-center gap-2.5 px-3 py-2 hover:bg-app-surface-2/60 transition text-left",
              children: [
                /* @__PURE__ */ jsx5(Avatar, { photoURL: u.photoURL, name: `${u.firstName} ${u.lastName}`, uid: u.uid, size: "sm", status: presence[u.uid], level: u.level, teamNumber: u.teamNumber }),
                /* @__PURE__ */ jsxs5("div", { className: "min-w-0", children: [
                  /* @__PURE__ */ jsxs5("p", { className: "text-app-text text-xs font-medium truncate", children: [
                    u.firstName,
                    " ",
                    u.lastName
                  ] }),
                  /* @__PURE__ */ jsx5("p", { className: "text-app-text-4 text-[10px]", children: roleLabel(u.role, u.level) })
                ] })
              ]
            },
            u.uid
          ))
        ] }) : /* @__PURE__ */ jsxs5(Fragment2, { children: [
          pinnedIds.length > 0 && (() => {
            const pinnedItems = pinnedIds.map((id) => {
              if (id === "general") return { id, label: "general", isChannel: true, lastMessageAt: generalMeta.lastMessageAt ?? null, conv: null };
              const g = groupConvs.find((c) => c.id === id);
              if (g) return { id, label: g.name ?? id, isChannel: true, lastMessageAt: g.lastMessageAt ?? null, conv: g };
              const dmConv = dmConvs.find((c) => c.id === id);
              if (dmConv) {
                const otherUid = dmConv.participants.find((p) => p !== myUid) ?? "";
                const other = allUsers.find((u) => u.uid === otherUid);
                return { id, label: other ? `${other.firstName} ${other.lastName}` : "DM", isChannel: false, lastMessageAt: dmConv.lastMessageAt ?? null, conv: dmConv };
              }
              return null;
            }).filter(Boolean);
            if (pinnedItems.length === 0) return null;
            return /* @__PURE__ */ jsxs5("div", { children: [
              /* @__PURE__ */ jsx5("p", { className: "px-3 py-1 text-app-text-4 text-[10px] font-semibold uppercase tracking-wider", children: "Pinned" }),
              pinnedItems.map((item) => /* @__PURE__ */ jsxs5("div", { className: "group/conv relative", children: [
                /* @__PURE__ */ jsxs5(
                  "button",
                  {
                    type: "button",
                    onClick: () => setActiveChatId(item.id),
                    className: `w-full flex items-center gap-2 px-3 py-1.5 pr-14 transition text-left rounded-md ${activeChatId === item.id ? "bg-app-surface-2 text-app-text" : "text-app-text-3 hover:bg-app-surface-2/60 hover:text-app-text"}`,
                    children: [
                      item.isChannel ? /* @__PURE__ */ jsx5("span", { className: "text-sm font-medium shrink-0", children: "#" }) : (() => {
                        const c = item.conv;
                        const otherUid = c.participants.find((p) => p !== myUid) ?? "";
                        const u = allUsers.find((x) => x.uid === otherUid);
                        return /* @__PURE__ */ jsx5(Avatar, { photoURL: u?.photoURL ?? "", name: item.label, uid: otherUid, size: "sm", status: presence[otherUid] ?? "offline" });
                      })(),
                      /* @__PURE__ */ jsx5("span", { className: "text-sm truncate flex-1", children: item.label }),
                      item.lastMessageAt && /* @__PURE__ */ jsx5("span", { className: "text-[10px] text-app-text-5 shrink-0", children: fmtConvTime(item.lastMessageAt) })
                    ]
                  }
                ),
                /* @__PURE__ */ jsx5(
                  "button",
                  {
                    type: "button",
                    onClick: (e) => {
                      e.stopPropagation();
                      togglePin(item.id);
                    },
                    title: "Unpin",
                    className: "absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/conv:opacity-100 p-0.5 text-yellow-500 hover:text-app-text-3 transition rounded",
                    children: /* @__PURE__ */ jsx5("svg", { className: "w-3 h-3", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx5("path", { d: "M16 12V4h1V2H7v2h1v8l-2 2v2h5v6h2v-6h5v-2l-2-2z" }) })
                  }
                )
              ] }, item.id))
            ] });
          })(),
          /* @__PURE__ */ jsxs5("div", { children: [
            /* @__PURE__ */ jsxs5("div", { className: "flex items-center justify-between px-3 py-1", children: [
              /* @__PURE__ */ jsx5("span", { className: "text-app-text-4 text-[10px] font-semibold uppercase tracking-wider", children: "Channels" }),
              isOwner && /* @__PURE__ */ jsx5(
                "button",
                {
                  type: "button",
                  onClick: () => setShowCreateGroup(true),
                  title: "Create channel",
                  className: "text-app-text-4 hover:text-app-text transition",
                  children: /* @__PURE__ */ jsx5("svg", { className: "w-3.5 h-3.5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx5("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 4.5v15m7.5-7.5h-15" }) })
                }
              )
            ] }),
            !pinnedIds.includes("general") && /* @__PURE__ */ jsxs5("div", { className: "group/conv relative", children: [
              /* @__PURE__ */ jsxs5(
                "button",
                {
                  type: "button",
                  onClick: () => setActiveChatId("general"),
                  className: `w-full flex items-center gap-2 px-3 py-1.5 pr-14 transition text-left rounded-md ${activeChatId === "general" ? "bg-app-surface-2 text-app-text" : "text-app-text-3 hover:bg-app-surface-2/60 hover:text-app-text"}`,
                  children: [
                    /* @__PURE__ */ jsx5("span", { className: "text-sm font-medium", children: "#" }),
                    /* @__PURE__ */ jsx5("span", { className: "text-sm truncate", children: "general" }),
                    generalMeta.lastMessageAt && /* @__PURE__ */ jsx5("span", { className: "ml-auto text-[10px] text-app-text-5 shrink-0", children: fmtConvTime(generalMeta.lastMessageAt) })
                  ]
                }
              ),
              /* @__PURE__ */ jsx5(
                "button",
                {
                  type: "button",
                  onClick: (e) => {
                    e.stopPropagation();
                    togglePin("general");
                  },
                  title: "Pin",
                  className: "absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/conv:opacity-100 p-0.5 text-app-text-5 hover:text-yellow-400 transition rounded",
                  children: /* @__PURE__ */ jsx5("svg", { className: "w-3 h-3", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx5("path", { d: "M16 12V4h1V2H7v2h1v8l-2 2v2h5v6h2v-6h5v-2l-2-2z" }) })
                }
              )
            ] }),
            sortedGroupConvs.filter((g) => g.lastMessageAt || g.lastMessage).filter((g) => !pinnedIds.includes(g.id)).map((g) => {
              const isDragOver = dragOverGroupId === g.id;
              return /* @__PURE__ */ jsxs5(
                "div",
                {
                  className: `group/conv relative transition-all ${isDragOver ? "border-t-2 border-yellow-500" : "border-t-2 border-transparent"}`,
                  draggable: isOwner,
                  onDragStart: isOwner ? () => {
                    dragGroupRef.current = g.id;
                  } : void 0,
                  onDragOver: isOwner ? (e) => {
                    e.preventDefault();
                    setDragOverGroupId(g.id);
                  } : void 0,
                  onDragLeave: isOwner ? () => setDragOverGroupId(null) : void 0,
                  onDrop: isOwner ? () => {
                    const fromId = dragGroupRef.current;
                    dragGroupRef.current = null;
                    setDragOverGroupId(null);
                    if (!fromId || fromId === g.id) return;
                    setGroupOrder((prev) => {
                      const base = prev.length > 0 ? [...prev] : sortedGroupConvs.map((x) => x.id);
                      groupConvs.forEach((x) => {
                        if (!base.includes(x.id)) base.push(x.id);
                      });
                      const fi = base.indexOf(fromId);
                      const ti = base.indexOf(g.id);
                      if (fi === -1 || ti === -1) return prev;
                      const next = [...base];
                      next.splice(fi, 1);
                      next.splice(ti, 0, fromId);
                      localStorage.setItem(`groupOrder_${myUid}`, JSON.stringify(next));
                      return next;
                    });
                  } : void 0,
                  children: [
                    /* @__PURE__ */ jsxs5(
                      "button",
                      {
                        type: "button",
                        onClick: () => setActiveChatId(g.id),
                        className: `w-full flex items-center gap-2 px-3 py-1.5 transition text-left rounded-md ${isOwner ? "pr-14 cursor-grab active:cursor-grabbing" : "pr-14"} ${activeChatId === g.id ? "bg-app-surface-2 text-app-text" : "text-app-text-3 hover:bg-app-surface-2/60 hover:text-app-text"}`,
                        children: [
                          /* @__PURE__ */ jsx5("span", { className: "text-sm font-medium", children: "#" }),
                          /* @__PURE__ */ jsx5("span", { className: "text-sm truncate", children: g.name ?? g.id }),
                          g.lastMessageAt && /* @__PURE__ */ jsx5("span", { className: "ml-auto text-[10px] text-app-text-5 shrink-0", children: fmtConvTime(g.lastMessageAt) })
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxs5("div", { className: "absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/conv:opacity-100 flex items-center gap-0.5", children: [
                      /* @__PURE__ */ jsx5(
                        "button",
                        {
                          type: "button",
                          onClick: (e) => {
                            e.stopPropagation();
                            togglePin(g.id);
                          },
                          title: "Pin",
                          className: "p-0.5 text-app-text-5 hover:text-yellow-400 transition rounded",
                          children: /* @__PURE__ */ jsx5("svg", { className: "w-3 h-3", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx5("path", { d: "M16 12V4h1V2H7v2h1v8l-2 2v2h5v6h2v-6h5v-2l-2-2z" }) })
                        }
                      ),
                      isOwner && /* @__PURE__ */ jsx5(
                        "button",
                        {
                          type: "button",
                          onClick: (e) => {
                            e.stopPropagation();
                            setDeleteConfirm(g);
                          },
                          title: "Hide channel",
                          className: "p-0.5 text-app-text-5 hover:text-red-400 transition rounded",
                          children: /* @__PURE__ */ jsx5("svg", { className: "w-3 h-3", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ jsx5("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) })
                        }
                      )
                    ] })
                  ]
                },
                g.id
              );
            })
          ] }),
          dmConvs.filter((c) => c.lastMessageAt || c.lastMessage).filter((c) => !pinnedIds.includes(c.id)).length > 0 && /* @__PURE__ */ jsxs5("div", { className: "pt-2", children: [
            /* @__PURE__ */ jsx5("p", { className: "px-3 py-1 text-app-text-4 text-[10px] font-semibold uppercase tracking-wider", children: "Direct Messages" }),
            dmConvs.filter((c) => c.lastMessageAt || c.lastMessage).filter((c) => !pinnedIds.includes(c.id)).map((conv) => {
              const otherUid = conv.participants.find((p) => p !== myUid) ?? "";
              const other = allUsers.find((u) => u.uid === otherUid);
              if (!other) return null;
              const isActive = conv.id === activeChatId;
              return /* @__PURE__ */ jsxs5("div", { className: "group/conv relative", children: [
                /* @__PURE__ */ jsxs5(
                  "button",
                  {
                    type: "button",
                    onClick: () => setActiveChatId(conv.id),
                    className: `w-full flex items-center gap-2.5 px-3 py-1.5 pr-14 transition text-left rounded-md ${isActive ? "bg-app-surface-2 text-app-text" : "text-app-text-3 hover:bg-app-surface-2/60 hover:text-app-text"}`,
                    children: [
                      /* @__PURE__ */ jsx5(Avatar, { photoURL: other.photoURL, name: `${other.firstName} ${other.lastName}`, uid: other.uid, size: "sm", status: presence[other.uid] ?? "offline" }),
                      /* @__PURE__ */ jsxs5("span", { className: "text-sm truncate flex-1", children: [
                        other.firstName,
                        " ",
                        other.lastName
                      ] }),
                      conv.lastMessageAt && /* @__PURE__ */ jsx5("span", { className: "text-[10px] text-app-text-5 shrink-0", children: fmtConvTime(conv.lastMessageAt) })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs5("div", { className: "absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/conv:opacity-100 flex items-center gap-0.5", children: [
                  /* @__PURE__ */ jsx5(
                    "button",
                    {
                      type: "button",
                      onClick: (e) => {
                        e.stopPropagation();
                        togglePin(conv.id);
                      },
                      title: "Pin",
                      className: "p-0.5 text-app-text-5 hover:text-yellow-400 transition rounded",
                      children: /* @__PURE__ */ jsx5("svg", { className: "w-3 h-3", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx5("path", { d: "M16 12V4h1V2H7v2h1v8l-2 2v2h5v6h2v-6h5v-2l-2-2z" }) })
                    }
                  ),
                  /* @__PURE__ */ jsx5(
                    "button",
                    {
                      type: "button",
                      onClick: (e) => {
                        e.stopPropagation();
                        setDeleteConfirm(conv);
                      },
                      title: "Hide conversation",
                      className: "p-0.5 text-app-text-5 hover:text-red-400 transition rounded",
                      children: /* @__PURE__ */ jsx5("svg", { className: "w-3 h-3", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ jsx5("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) })
                    }
                  )
                ] })
              ] }, conv.id);
            })
          ] })
        ] }) }),
        isOwner && showRemovedChats && deletedConvs.length > 0 && /* @__PURE__ */ jsxs5("div", { className: "border-t border-app-border", children: [
          /* @__PURE__ */ jsxs5(
            "button",
            {
              type: "button",
              onClick: () => setShowDeleted((v) => !v),
              className: "w-full flex items-center gap-1.5 px-3 py-2 text-app-text-5 hover:text-app-text-3 transition text-left",
              children: [
                /* @__PURE__ */ jsx5("svg", { className: `w-3 h-3 shrink-0 transition-transform ${showDeleted ? "rotate-90" : ""}`, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ jsx5("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M8.25 4.5l7.5 7.5-7.5 7.5" }) }),
                /* @__PURE__ */ jsxs5("span", { className: "text-[10px] font-semibold uppercase tracking-wider", children: [
                  "Hidden (",
                  deletedConvs.length,
                  ")"
                ] })
              ]
            }
          ),
          showDeleted && /* @__PURE__ */ jsx5("div", { className: "pb-1", children: deletedConvs.map((c) => {
            const isGroup = c.type === "group";
            const otherUid = !isGroup ? c.participants.find((p) => p !== myUid) ?? "" : "";
            const other = otherUid ? allUsers.find((u) => u.uid === otherUid) : null;
            const name = isGroup ? c.name ?? c.id : other ? `${other.firstName} ${other.lastName}` : "Unknown";
            return /* @__PURE__ */ jsxs5("div", { className: "flex items-center gap-2 px-3 py-1.5", children: [
              isGroup ? /* @__PURE__ */ jsx5("span", { className: "text-app-text-2 text-sm font-medium shrink-0", children: "#" }) : /* @__PURE__ */ jsx5(Avatar, { photoURL: other?.photoURL ?? "", name, uid: otherUid, size: "sm" }),
              /* @__PURE__ */ jsx5("span", { className: "text-app-text-5 text-xs truncate flex-1", children: name }),
              /* @__PURE__ */ jsx5(
                "button",
                {
                  type: "button",
                  onClick: () => restoreConversation(c.id),
                  className: "shrink-0 px-2 py-0.5 text-[10px] font-medium text-app-text-4 hover:text-green-400 border border-app-border-2 hover:border-green-700 rounded-full transition",
                  children: "Restore"
                }
              )
            ] }, c.id);
          }) })
        ] }),
        /* @__PURE__ */ jsxs5("div", { className: "px-3 pt-2.5 pb-5 border-t border-app-border flex items-center gap-2", children: [
          /* @__PURE__ */ jsx5(Avatar, { photoURL: me.photoURL, name: `${me.firstName} ${me.lastName}`, uid: myUid, size: "sm", status: "active", level: me.level, teamNumber: me.teamNumber }),
          /* @__PURE__ */ jsxs5("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxs5("p", { className: "text-app-text text-xs font-medium truncate", children: [
              me.firstName,
              " ",
              me.lastName
            ] }),
            /* @__PURE__ */ jsx5("p", { className: "text-app-text-4 text-[10px]", children: teamLabel(me) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs5("div", { className: "flex-1 flex flex-col overflow-hidden min-w-0", children: [
        /* @__PURE__ */ jsxs5("div", { className: "flex items-center justify-between px-4 py-3 border-b border-app-border bg-app-surface shrink-0", children: [
          /* @__PURE__ */ jsxs5("div", { className: "flex items-center gap-2.5 min-w-0", children: [
            activeIsChannel ? /* @__PURE__ */ jsx5("span", { className: "text-app-text-2 text-xl font-bold leading-none", children: "#" }) : /* @__PURE__ */ jsx5(
              Avatar,
              {
                photoURL: activeDmOther?.photoURL ?? "",
                name: activeDmOther ? `${activeDmOther.firstName} ${activeDmOther.lastName}` : "",
                uid: activeDmOtherUid,
                size: "md",
                status: presence[activeDmOtherUid] ?? "offline",
                level: activeDmOther?.level,
                teamNumber: activeDmOther?.teamNumber
              }
            ),
            /* @__PURE__ */ jsxs5("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsx5("p", { className: "text-app-text font-semibold text-sm truncate", children: activeName }),
              /* @__PURE__ */ jsx5("p", { className: "text-app-text-4 text-xs", children: activeChatId === "general" ? `Team channel \xB7 ${allUsers.length} members` : activeGroupConv ? `${activeParticipants.length} member${activeParticipants.length !== 1 ? "s" : ""}` : activeDmOther ? `${presence[activeDmOtherUid] === "active" ? "\u25CF Active" : presence[activeDmOtherUid] === "idle" ? "\u25D0 Idle" : "\u25CB Offline"} \xB7 ${roleLabel(activeDmOther.role, activeDmOther.level)}` : "" })
            ] })
          ] }),
          isOwner && activeGroupConv && /* @__PURE__ */ jsx5(
            "button",
            {
              type: "button",
              onClick: () => setShowManageMembers(true),
              title: "Manage members",
              className: "p-1.5 text-app-text-3 hover:text-app-text hover:bg-app-surface-2 rounded-lg transition shrink-0",
              children: /* @__PURE__ */ jsx5("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, children: /* @__PURE__ */ jsx5("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" }) })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs5("div", { ref: scrollRef, onScroll: handleScroll, className: "flex-1 overflow-y-auto px-5 py-4", children: [
          archiveConfig?.startDate && messages.length > 0 && /* @__PURE__ */ jsxs5("div", { className: "flex items-center justify-center gap-1.5 py-2 mb-2", children: [
            /* @__PURE__ */ jsx5("svg", { className: "w-3.5 h-3.5 text-app-text-5 shrink-0", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx5("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" }) }),
            showArchived ? /* @__PURE__ */ jsxs5(Fragment2, { children: [
              /* @__PURE__ */ jsx5("span", { className: "text-amber-600 text-xs", children: "Showing archived messages" }),
              isOwner && /* @__PURE__ */ jsx5("button", { type: "button", onClick: () => setShowArchived(false), className: "text-blue-500 text-xs hover:underline", children: "Hide" })
            ] }) : /* @__PURE__ */ jsxs5(Fragment2, { children: [
              /* @__PURE__ */ jsxs5("span", { className: "text-app-text-5 text-xs", children: [
                "Messages before ",
                archiveConfig.startDate,
                " are archived"
              ] }),
              isOwner && /* @__PURE__ */ jsx5("button", { type: "button", onClick: () => setShowArchived(true), className: "text-blue-500 text-xs hover:underline", children: "Show" })
            ] })
          ] }),
          !archiveConfig?.startDate && !isOwner && messages.length > 0 && /* @__PURE__ */ jsxs5("div", { className: "flex items-center justify-center gap-1.5 py-2 mb-2", children: [
            /* @__PURE__ */ jsx5("svg", { className: "w-3.5 h-3.5 text-app-text-5 shrink-0", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx5("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" }) }),
            /* @__PURE__ */ jsx5("span", { className: "text-app-text-5 text-xs", children: "Messages older than 7 days are archived" })
          ] }),
          visibleMessages.length === 0 && /* @__PURE__ */ jsxs5("div", { className: "flex flex-col items-center justify-center h-full gap-3 text-center", children: [
            /* @__PURE__ */ jsx5("div", { className: "w-14 h-14 rounded-full bg-app-surface-2 border border-app-border-2 flex items-center justify-center", children: activeIsChannel ? /* @__PURE__ */ jsx5("span", { className: "text-app-text-4 text-2xl font-bold", children: "#" }) : /* @__PURE__ */ jsx5("svg", { className: "w-7 h-7 text-app-text-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, children: /* @__PURE__ */ jsx5("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" }) }) }),
            /* @__PURE__ */ jsxs5("div", { children: [
              /* @__PURE__ */ jsx5("p", { className: "text-app-text-2 text-sm font-semibold", children: activeIsChannel ? `Welcome to #${activeName}!` : `Your conversation with ${activeName}` }),
              /* @__PURE__ */ jsx5("p", { className: "text-app-text-5 text-xs mt-1", children: activeIsChannel ? "This is the very beginning of this channel." : "Send a message to start the conversation." })
            ] })
          ] }),
          /* @__PURE__ */ jsxs5("div", { className: "space-y-0.5", children: [
            rows.map((row, i) => {
              if (row.type === "date") {
                return /* @__PURE__ */ jsxs5("div", { className: "flex items-center gap-3 py-4", children: [
                  /* @__PURE__ */ jsx5("div", { className: "flex-1 h-px bg-app-surface-2" }),
                  /* @__PURE__ */ jsx5("span", { className: "text-app-text-5 text-xs font-medium px-2 shrink-0", children: row.label }),
                  /* @__PURE__ */ jsx5("div", { className: "flex-1 h-px bg-app-surface-2" })
                ] }, `d-${i}`);
              }
              const { msg, showHeader } = row;
              const isMine = msg.uid === myUid;
              return /* @__PURE__ */ jsxs5("div", { className: `flex items-end gap-2.5 ${isMine ? "flex-row-reverse" : "flex-row"} ${showHeader ? "mt-4" : "mt-0.5"}`, children: [
                /* @__PURE__ */ jsx5("div", { className: "w-8 shrink-0", children: !isMine && showHeader && /* @__PURE__ */ jsx5(Avatar, { photoURL: msg.photoURL, name: msg.displayName, uid: msg.uid, size: "sm" }) }),
                /* @__PURE__ */ jsxs5("div", { className: `flex flex-col max-w-[65%] ${isMine ? "items-end" : "items-start"}`, children: [
                  showHeader && !isMine && /* @__PURE__ */ jsx5("p", { className: "text-app-text-3 text-xs font-medium mb-1 px-1", children: msg.displayName }),
                  msg.imageUrl && /* @__PURE__ */ jsx5(
                    "button",
                    {
                      type: "button",
                      onClick: () => setLightboxUrl(msg.imageUrl),
                      className: `mb-1 block overflow-hidden rounded-2xl ${isMine ? "rounded-br-sm" : "rounded-bl-sm"} hover:opacity-90 transition-opacity focus:outline-none`,
                      children: /* @__PURE__ */ jsx5("img", { src: msg.imageUrl, alt: "Shared image", className: "max-w-45 max-h-45 object-cover block" })
                    }
                  ),
                  msg.text && /* @__PURE__ */ jsx5("div", { className: `px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap wrap-break-word ${isMine ? "bg-blue-600 text-white rounded-br-sm" : "bg-app-surface-2 text-app-text rounded-bl-sm"}`, children: renderWithMentions(msg.text, `${me.firstName} ${me.lastName}`) }),
                  /* @__PURE__ */ jsx5("span", { className: "text-app-text-5 text-[11px] mt-1 px-1", children: fmtTime(msg.createdAt) })
                ] })
              ] }, msg.id);
            }),
            /* @__PURE__ */ jsx5("div", { ref: bottomRef, className: "h-1" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs5("div", { className: "px-4 pb-4 pt-2 border-t border-app-border bg-app-surface shrink-0", children: [
          mentionOpen && mentionUsers.length > 0 && /* @__PURE__ */ jsx5("div", { ref: mentionListRef, className: "mb-2 bg-app-surface-2 border border-app-border-2 rounded-xl overflow-hidden shadow-2xl", children: mentionUsers.map((u, idx) => /* @__PURE__ */ jsxs5(
            "button",
            {
              type: "button",
              onMouseDown: (e) => {
                e.preventDefault();
                insertMention(u);
              },
              className: `w-full flex items-center gap-2.5 px-3 py-2 text-left transition ${idx === mentionIndex ? "bg-blue-600/20" : "hover:bg-app-surface-2/60"}`,
              children: [
                /* @__PURE__ */ jsx5(Avatar, { photoURL: u.photoURL, name: `${u.firstName} ${u.lastName}`, uid: u.uid, size: "sm", status: presence[u.uid], level: u.level, teamNumber: u.teamNumber }),
                /* @__PURE__ */ jsxs5("div", { className: "min-w-0", children: [
                  /* @__PURE__ */ jsxs5("p", { className: "text-app-text text-sm font-medium truncate", children: [
                    u.firstName,
                    " ",
                    u.lastName
                  ] }),
                  /* @__PURE__ */ jsx5("p", { className: "text-app-text-4 text-[10px]", children: roleLabel(u.role, u.level) })
                ] })
              ]
            },
            u.uid
          )) }),
          imagePreview && /* @__PURE__ */ jsxs5("div", { className: "relative inline-block mb-2 ml-10", children: [
            /* @__PURE__ */ jsx5("img", { src: imagePreview, alt: "Preview", className: "h-20 w-20 object-cover rounded-xl border border-app-border-2" }),
            /* @__PURE__ */ jsx5(
              "button",
              {
                type: "button",
                onClick: () => {
                  if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
                  setImageFile(null);
                  setImagePreview("");
                },
                className: "absolute -top-2 -right-2 w-5 h-5 bg-app-surface-2 hover:bg-app-surface-2 rounded-full flex items-center justify-center text-app-text transition",
                children: /* @__PURE__ */ jsx5("svg", { className: "w-3 h-3", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 3, children: /* @__PURE__ */ jsx5("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs5("div", { className: "flex items-end gap-2", children: [
            /* @__PURE__ */ jsx5(
              "button",
              {
                type: "button",
                onClick: () => fileInputRef.current?.click(),
                className: "mb-0.5 p-2 text-app-text-4 hover:text-app-text hover:bg-app-surface-2 rounded-xl transition shrink-0",
                title: "Attach image",
                children: /* @__PURE__ */ jsx5("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, children: /* @__PURE__ */ jsx5("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" }) })
              }
            ),
            /* @__PURE__ */ jsx5(
              "input",
              {
                ref: fileInputRef,
                type: "file",
                accept: "image/*",
                className: "hidden",
                onChange: (e) => {
                  const f = e.target.files?.[0];
                  if (!f || !f.type.startsWith("image/")) return;
                  if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
                  setImageFile(f);
                  setImagePreview(URL.createObjectURL(f));
                  e.target.value = "";
                }
              }
            ),
            /* @__PURE__ */ jsx5(
              "textarea",
              {
                ref: textareaRef,
                value: draft,
                onChange: handleDraftChange,
                onKeyDown: handleKeyDown,
                placeholder: activeIsChannel ? `Message #${activeName}\u2026` : `Message ${activeName}\u2026`,
                rows: 1,
                className: "flex-1 px-4 py-2.5 bg-app-surface-2 border border-app-border-2 rounded-2xl text-app-text text-sm placeholder-app-text-4 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden leading-relaxed",
                style: { minHeight: "42px", maxHeight: "120px" }
              }
            ),
            /* @__PURE__ */ jsx5(
              "button",
              {
                type: "button",
                onClick: sendMessage,
                disabled: !draft.trim() && !imageFile || sending,
                className: "mb-0.5 w-9 h-9 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-500 disabled:bg-app-surface-2 disabled:text-app-text-5 text-white transition shrink-0",
                children: sending ? /* @__PURE__ */ jsxs5("svg", { className: "w-4 h-4 animate-spin", fill: "none", viewBox: "0 0 24 24", children: [
                  /* @__PURE__ */ jsx5("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
                  /* @__PURE__ */ jsx5("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8v8H4z" })
                ] }) : /* @__PURE__ */ jsx5("svg", { className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx5("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" }) })
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs5("div", { className: "w-56 shrink-0 bg-app-surface border-l border-app-border flex flex-col overflow-hidden", children: [
        /* @__PURE__ */ jsx5("div", { className: "pl-3 pr-3 py-3 border-b border-app-border", children: /* @__PURE__ */ jsxs5("p", { className: "text-app-text-3 text-[10px] font-semibold uppercase tracking-wider", children: [
          "Members \u2014 ",
          allUsers.length
        ] }) }),
        /* @__PURE__ */ jsxs5("div", { className: "flex-1 overflow-y-auto py-2", children: [
          activeUsers.length > 0 && /* @__PURE__ */ jsxs5(Fragment2, { children: [
            /* @__PURE__ */ jsxs5("p", { className: "pl-3 pr-3 pb-1 pt-1 text-app-text-4 text-[10px] font-semibold uppercase tracking-wider", children: [
              "Active \u2014 ",
              activeUsers.length
            ] }),
            activeUsers.map((u) => /* @__PURE__ */ jsxs5(
              "button",
              {
                type: "button",
                onClick: () => {
                  if (u.uid !== myUid) openDm(u);
                },
                className: `w-full flex items-start gap-2 pl-3 pr-3 pt-2 pb-3 text-left transition ${u.uid !== myUid ? "hover:bg-app-surface-2/60 cursor-pointer" : "cursor-default"}`,
                children: [
                  /* @__PURE__ */ jsx5(Avatar, { photoURL: u.photoURL, name: `${u.firstName} ${u.lastName}`, uid: u.uid, size: "sm", status: "active", level: u.level, teamNumber: u.teamNumber }),
                  /* @__PURE__ */ jsxs5("div", { className: "min-w-0 pt-0.5", children: [
                    /* @__PURE__ */ jsxs5("p", { className: "text-app-text text-xs font-medium truncate", children: [
                      u.firstName,
                      " ",
                      u.lastName
                    ] }),
                    /* @__PURE__ */ jsx5("p", { className: "text-app-text-4 text-[10px]", children: teamLabel(u) })
                  ] })
                ]
              },
              u.uid
            ))
          ] }),
          idleUsers.length > 0 && /* @__PURE__ */ jsxs5(Fragment2, { children: [
            /* @__PURE__ */ jsxs5("p", { className: "pl-3 pr-3 pb-1 pt-3 text-app-text-4 text-[10px] font-semibold uppercase tracking-wider", children: [
              "Idle \u2014 ",
              idleUsers.length
            ] }),
            idleUsers.map((u) => /* @__PURE__ */ jsxs5(
              "button",
              {
                type: "button",
                onClick: () => {
                  if (u.uid !== myUid) openDm(u);
                },
                className: `w-full flex items-start gap-2 pl-3 pr-3 pt-2 pb-3 text-left transition ${u.uid !== myUid ? "hover:bg-app-surface-2/60 cursor-pointer" : "cursor-default"}`,
                children: [
                  /* @__PURE__ */ jsx5(Avatar, { photoURL: u.photoURL, name: `${u.firstName} ${u.lastName}`, uid: u.uid, size: "sm", status: "idle", level: u.level, teamNumber: u.teamNumber }),
                  /* @__PURE__ */ jsxs5("div", { className: "min-w-0 pt-0.5", children: [
                    /* @__PURE__ */ jsxs5("p", { className: "text-app-text-3 text-xs font-medium truncate", children: [
                      u.firstName,
                      " ",
                      u.lastName
                    ] }),
                    /* @__PURE__ */ jsx5("p", { className: "text-app-text-4 text-[10px]", children: teamLabel(u) })
                  ] })
                ]
              },
              u.uid
            ))
          ] }),
          offlineUsers.length > 0 && /* @__PURE__ */ jsxs5(Fragment2, { children: [
            /* @__PURE__ */ jsxs5("p", { className: "pl-3 pr-3 pb-1 pt-3 text-app-text-4 text-[10px] font-semibold uppercase tracking-wider", children: [
              "Offline \u2014 ",
              offlineUsers.length
            ] }),
            offlineUsers.map((u) => /* @__PURE__ */ jsxs5(
              "button",
              {
                type: "button",
                onClick: () => {
                  if (u.uid !== myUid) openDm(u);
                },
                className: `w-full flex items-start gap-2 pl-3 pr-3 pt-2 pb-3 text-left transition ${u.uid !== myUid ? "hover:bg-app-surface-2/60 cursor-pointer" : "cursor-default"}`,
                children: [
                  /* @__PURE__ */ jsx5(Avatar, { photoURL: u.photoURL, name: `${u.firstName} ${u.lastName}`, uid: u.uid, size: "sm", status: "offline", level: u.level, teamNumber: u.teamNumber }),
                  /* @__PURE__ */ jsxs5("div", { className: "min-w-0 pt-0.5", children: [
                    /* @__PURE__ */ jsxs5("p", { className: "text-app-text-4 text-xs font-medium truncate", children: [
                      u.firstName,
                      " ",
                      u.lastName
                    ] }),
                    /* @__PURE__ */ jsx5("p", { className: "text-app-text-4 text-[10px]", children: teamLabel(u) })
                  ] })
                ]
              },
              u.uid
            ))
          ] })
        ] })
      ] })
    ] }),
    isOwner && showChatSettings && /* @__PURE__ */ jsxs5(
      "div",
      {
        ref: chatSettingsPanelRef,
        style: { position: "fixed", left: settingsFlyoutPos.left, top: settingsFlyoutPos.top, zIndex: 9999 },
        className: "w-80 bg-app-surface border border-app-border-2 rounded-lg shadow-2xl overflow-y-auto max-h-[80vh]",
        children: [
          /* @__PURE__ */ jsx5("div", { className: "px-4 py-2.5 border-b border-app-border", children: /* @__PURE__ */ jsx5("p", { className: "text-[10px] font-semibold uppercase tracking-wider text-app-text-4", children: "Chat Settings" }) }),
          /* @__PURE__ */ jsxs5("div", { className: "px-4 py-4 space-y-4", children: [
            /* @__PURE__ */ jsxs5("div", { className: "flex items-start justify-between gap-3", children: [
              /* @__PURE__ */ jsxs5("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsx5("p", { className: "text-xs text-app-text font-medium leading-snug", children: "Show removed chats" }),
                /* @__PURE__ */ jsx5("p", { className: "text-[10px] text-app-text-4 leading-snug mt-0.5", children: showRemovedChats ? "Hidden chats are visible and can be restored." : "Hidden chats are not shown." })
              ] }),
              /* @__PURE__ */ jsx5(
                "button",
                {
                  type: "button",
                  onClick: toggleShowRemovedChats,
                  className: `shrink-0 w-8 rounded-full transition-colors relative mt-0.5 ${showRemovedChats ? "bg-blue-600" : "bg-app-surface-2"}`,
                  style: { minWidth: "2rem", height: "1.125rem" },
                  children: /* @__PURE__ */ jsx5("span", { className: `absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${showRemovedChats ? "translate-x-4" : "translate-x-0.5"}` })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs5("div", { className: "flex items-start justify-between gap-3 border-t border-app-border pt-4", children: [
              /* @__PURE__ */ jsxs5("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsx5("p", { className: "text-xs text-app-text font-medium leading-snug", children: "Show archived messages" }),
                /* @__PURE__ */ jsx5("p", { className: "text-[10px] text-app-text-4 leading-snug mt-0.5", children: showArchived ? "Archived messages are visible." : "Messages before the archive cutoff are hidden." })
              ] }),
              /* @__PURE__ */ jsx5(
                "button",
                {
                  type: "button",
                  onClick: () => setShowArchived((v) => !v),
                  className: `shrink-0 w-8 rounded-full transition-colors relative mt-0.5 ${showArchived ? "bg-blue-600" : "bg-app-surface-2"}`,
                  style: { minWidth: "2rem", height: "1.125rem" },
                  children: /* @__PURE__ */ jsx5("span", { className: `absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${showArchived ? "translate-x-4" : "translate-x-0.5"}` })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs5("div", { className: "border-t border-app-border pt-4 space-y-3", children: [
              /* @__PURE__ */ jsx5("p", { className: "text-[10px] font-semibold uppercase tracking-wider text-app-text-4", children: "Message Archive" }),
              /* @__PURE__ */ jsxs5("div", { children: [
                /* @__PURE__ */ jsx5("p", { className: "text-[10px] text-app-text-3 mb-1", children: "Archive cutoff date" }),
                /* @__PURE__ */ jsx5(
                  "input",
                  {
                    type: "date",
                    value: archiveDraftStart,
                    onChange: (e) => setArchiveDraftStart(e.target.value),
                    className: "w-full px-2 py-1 text-xs bg-app-surface-2 border border-app-border-2 rounded text-app-text focus:outline-none focus:ring-1 focus:ring-blue-500"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs5("div", { children: [
                /* @__PURE__ */ jsx5("p", { className: "text-[10px] text-app-text-3 mb-1", children: "Reset schedule" }),
                /* @__PURE__ */ jsxs5(
                  "select",
                  {
                    value: archiveDraftDuration,
                    onChange: (e) => setArchiveDraftDuration(e.target.value),
                    className: "w-full px-2 py-1 text-xs bg-app-surface-2 border border-app-border-2 rounded text-app-text focus:outline-none focus:ring-1 focus:ring-blue-500",
                    children: [
                      /* @__PURE__ */ jsx5("option", { value: "weekly", children: "Weekly (every Monday)" }),
                      /* @__PURE__ */ jsx5("option", { value: "monthly", children: "Monthly" }),
                      /* @__PURE__ */ jsx5("option", { value: "custom", children: "Custom" })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs5("div", { className: "flex gap-2 pt-1", children: [
                /* @__PURE__ */ jsx5(
                  "button",
                  {
                    type: "button",
                    onClick: archiveNow,
                    className: "flex-1 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-600/30 rounded transition",
                    children: "Archive Now"
                  }
                ),
                /* @__PURE__ */ jsx5(
                  "button",
                  {
                    type: "button",
                    onClick: saveArchiveConfig,
                    disabled: archiveSaving,
                    className: "flex-1 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/30 rounded disabled:opacity-50 transition",
                    children: archiveSaving ? "Saving\u2026" : "Save"
                  }
                )
              ] })
            ] })
          ] })
        ]
      }
    ),
    deleteConfirm && (() => {
      const isGroup = deleteConfirm.type === "group";
      const otherUid = !isGroup ? deleteConfirm.participants.find((p) => p !== myUid) ?? "" : "";
      const other = otherUid ? allUsers.find((u) => u.uid === otherUid) : null;
      const name = isGroup ? deleteConfirm.name ?? deleteConfirm.id : other ? `${other.firstName} ${other.lastName}` : "Unknown";
      return /* @__PURE__ */ jsxs5("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", children: [
        /* @__PURE__ */ jsx5("div", { className: "absolute inset-0 bg-black/70", onClick: () => setDeleteConfirm(null) }),
        /* @__PURE__ */ jsxs5("div", { className: "relative bg-app-surface border border-app-border-2 rounded-xl shadow-2xl w-full max-w-sm p-6", children: [
          /* @__PURE__ */ jsxs5("div", { className: "flex items-center gap-3 mb-3", children: [
            /* @__PURE__ */ jsx5("div", { className: "w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx5("svg", { className: "w-5 h-5 text-red-400", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx5("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" }) }) }),
            /* @__PURE__ */ jsxs5("div", { children: [
              /* @__PURE__ */ jsx5("p", { className: "text-app-text font-semibold text-sm", children: "Hide this conversation?" }),
              /* @__PURE__ */ jsxs5("p", { className: "text-app-text-4 text-xs mt-0.5", children: [
                isGroup ? "#" : "",
                name
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx5("p", { className: "text-app-text-3 text-sm mb-5", children: "This conversation will be hidden from your sidebar. No messages are deleted \u2014 you can restore it from the Hidden section." }),
          /* @__PURE__ */ jsxs5("div", { className: "flex items-center justify-end gap-3", children: [
            /* @__PURE__ */ jsx5("button", { type: "button", onClick: () => setDeleteConfirm(null), className: "px-4 py-2 text-sm text-app-text-3 hover:text-app-text transition", children: "Cancel" }),
            /* @__PURE__ */ jsx5(
              "button",
              {
                type: "button",
                onClick: () => deleteConversation(deleteConfirm.id),
                className: "px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg transition",
                children: "Hide conversation"
              }
            )
          ] })
        ] })
      ] });
    })(),
    lightboxUrl && /* @__PURE__ */ jsxs5(
      "div",
      {
        className: "fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4",
        onClick: () => setLightboxUrl(""),
        onKeyDown: (e) => e.key === "Escape" && setLightboxUrl(""),
        tabIndex: -1,
        children: [
          /* @__PURE__ */ jsx5(
            "button",
            {
              type: "button",
              onClick: () => setLightboxUrl(""),
              className: "absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-app-surface-2/80 text-app-text hover:bg-app-surface-2 transition",
              children: /* @__PURE__ */ jsx5("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx5("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) })
            }
          ),
          /* @__PURE__ */ jsx5("img", { src: lightboxUrl, alt: "Full size", className: "max-w-full max-h-full object-contain rounded-xl shadow-2xl", onClick: (e) => e.stopPropagation() }),
          /* @__PURE__ */ jsxs5(
            "a",
            {
              href: lightboxUrl,
              target: "_blank",
              rel: "noopener noreferrer",
              onClick: (e) => e.stopPropagation(),
              className: "absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-app-surface-2/80 text-app-text-2 hover:text-app-text text-xs rounded-lg transition",
              children: [
                /* @__PURE__ */ jsx5("svg", { className: "w-3.5 h-3.5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx5("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" }) }),
                "Open original"
              ]
            }
          )
        ]
      }
    ),
    showCreateGroup && /* @__PURE__ */ jsx5(
      "div",
      {
        className: "fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4",
        onClick: (e) => {
          if (e.target === e.currentTarget) {
            setShowCreateGroup(false);
            setNewGroupName("");
            setNewGroupMembers([]);
          }
        },
        children: /* @__PURE__ */ jsxs5("div", { className: "bg-app-surface border border-app-border-2 rounded-2xl w-full max-w-md p-6 shadow-2xl", children: [
          /* @__PURE__ */ jsx5("h3", { className: "text-app-text font-bold text-lg mb-1", children: "Create Channel" }),
          /* @__PURE__ */ jsx5("p", { className: "text-app-text-4 text-sm mb-5", children: "Channels are where your team communicates." }),
          /* @__PURE__ */ jsx5("label", { className: "block text-app-text-3 text-xs font-semibold uppercase tracking-wider mb-1.5", children: "Channel Name" }),
          /* @__PURE__ */ jsxs5("div", { className: "flex items-center gap-2 bg-app-surface-2 border border-app-border-2 rounded-xl px-3 py-2 mb-5 focus-within:ring-2 focus-within:ring-blue-500", children: [
            /* @__PURE__ */ jsx5("span", { className: "text-app-text-3 text-sm", children: "#" }),
            /* @__PURE__ */ jsx5(
              "input",
              {
                type: "text",
                value: newGroupName,
                onChange: (e) => setNewGroupName(e.target.value.toLowerCase().replace(/[^a-z0-9-\s]/g, "")),
                placeholder: "new-channel",
                autoFocus: true,
                className: "flex-1 bg-transparent text-app-text text-sm placeholder-app-text-5 focus:outline-none",
                onKeyDown: (e) => e.key === "Enter" && createGroupChannel()
              }
            )
          ] }),
          /* @__PURE__ */ jsx5("label", { className: "block text-app-text-3 text-xs font-semibold uppercase tracking-wider mb-1.5", children: "Add Members" }),
          /* @__PURE__ */ jsx5("div", { className: "max-h-48 overflow-y-auto border border-app-border-2 rounded-xl bg-app-surface-2/50 mb-5", children: allUsers.filter((u) => u.uid !== myUid).map((u) => {
            const checked = newGroupMembers.includes(u.uid);
            return /* @__PURE__ */ jsxs5(
              "button",
              {
                type: "button",
                onClick: () => setNewGroupMembers((prev) => checked ? prev.filter((id) => id !== u.uid) : [...prev, u.uid]),
                className: "w-full flex items-center gap-3 px-3 py-2.5 hover:bg-app-surface-2/50 transition text-left border-b border-app-border-2/50 last:border-0",
                children: [
                  /* @__PURE__ */ jsx5("div", { className: `w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition ${checked ? "bg-blue-600 border-blue-600" : "border-app-border-2"}`, children: checked && /* @__PURE__ */ jsx5("svg", { className: "w-2.5 h-2.5 text-white", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 3, children: /* @__PURE__ */ jsx5("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M4.5 12.75l6 6 9-13.5" }) }) }),
                  /* @__PURE__ */ jsx5(Avatar, { photoURL: u.photoURL, name: `${u.firstName} ${u.lastName}`, uid: u.uid, size: "sm", level: u.level, teamNumber: u.teamNumber }),
                  /* @__PURE__ */ jsxs5("div", { className: "min-w-0", children: [
                    /* @__PURE__ */ jsxs5("p", { className: "text-app-text text-sm font-medium truncate", children: [
                      u.firstName,
                      " ",
                      u.lastName
                    ] }),
                    /* @__PURE__ */ jsx5("p", { className: "text-app-text-4 text-xs", children: roleLabel(u.role, u.level) })
                  ] })
                ]
              },
              u.uid
            );
          }) }),
          /* @__PURE__ */ jsxs5("div", { className: "flex gap-3 justify-end", children: [
            /* @__PURE__ */ jsx5(
              "button",
              {
                type: "button",
                onClick: () => {
                  setShowCreateGroup(false);
                  setNewGroupName("");
                  setNewGroupMembers([]);
                },
                className: "px-4 py-2 text-app-text-3 hover:text-app-text text-sm transition",
                children: "Cancel"
              }
            ),
            /* @__PURE__ */ jsx5(
              "button",
              {
                type: "button",
                onClick: createGroupChannel,
                disabled: !newGroupName.trim() || creatingGroup,
                className: "px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-app-surface-2 disabled:text-app-text-4 text-white text-sm font-semibold rounded-xl transition",
                children: creatingGroup ? "Creating\u2026" : "Create Channel"
              }
            )
          ] })
        ] })
      }
    ),
    showManageMembers && activeGroupConv && /* @__PURE__ */ jsx5(
      "div",
      {
        className: "fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4",
        onClick: (e) => {
          if (e.target === e.currentTarget) setShowManageMembers(false);
        },
        children: /* @__PURE__ */ jsxs5("div", { className: "bg-app-surface border border-app-border-2 rounded-2xl w-full max-w-md p-6 shadow-2xl", children: [
          /* @__PURE__ */ jsxs5("div", { className: "flex items-center justify-between mb-5", children: [
            /* @__PURE__ */ jsxs5("h3", { className: "text-app-text font-bold text-lg", children: [
              "#",
              activeGroupConv.name ?? activeChatId
            ] }),
            /* @__PURE__ */ jsx5("button", { type: "button", onClick: () => setShowManageMembers(false), className: "text-app-text-4 hover:text-app-text transition", children: /* @__PURE__ */ jsx5("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx5("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) }) })
          ] }),
          /* @__PURE__ */ jsxs5("p", { className: "text-app-text-3 text-xs font-semibold uppercase tracking-wider mb-2", children: [
            "Members (",
            activeParticipants.length,
            ")"
          ] }),
          /* @__PURE__ */ jsx5("div", { className: "max-h-44 overflow-y-auto border border-app-border-2 rounded-xl bg-app-surface-2/50 mb-4", children: activeParticipants.map((uid3) => {
            const u = allUsers.find((x) => x.uid === uid3);
            const name = u ? `${u.firstName} ${u.lastName}` : uid3;
            return /* @__PURE__ */ jsxs5("div", { className: "flex items-center gap-3 px-3 py-2.5 border-b border-app-border-2/50 last:border-0", children: [
              /* @__PURE__ */ jsx5(Avatar, { photoURL: u?.photoURL ?? "", name, uid: uid3, size: "sm", status: presence[uid3], level: u?.level, teamNumber: u?.teamNumber }),
              /* @__PURE__ */ jsxs5("div", { className: "min-w-0 flex-1", children: [
                /* @__PURE__ */ jsx5("p", { className: "text-app-text text-sm font-medium truncate", children: name }),
                u && /* @__PURE__ */ jsx5("p", { className: "text-app-text-4 text-xs", children: roleLabel(u.role, u.level) })
              ] }),
              uid3 !== myUid && /* @__PURE__ */ jsx5(
                "button",
                {
                  type: "button",
                  onClick: () => removeMember(uid3),
                  className: "text-app-text-5 hover:text-red-400 transition text-xs shrink-0 px-2 py-1 rounded hover:bg-red-950/30",
                  children: "Remove"
                }
              )
            ] }, uid3);
          }) }),
          /* @__PURE__ */ jsx5("p", { className: "text-app-text-3 text-xs font-semibold uppercase tracking-wider mb-2", children: "Add Members" }),
          /* @__PURE__ */ jsx5("div", { className: "max-h-36 overflow-y-auto border border-app-border-2 rounded-xl bg-app-surface-2/50 mb-5", children: allUsers.filter((u) => !activeParticipants.includes(u.uid)).length === 0 ? /* @__PURE__ */ jsx5("p", { className: "px-3 py-4 text-center text-app-text-5 text-xs", children: "All members are already in this channel." }) : allUsers.filter((u) => !activeParticipants.includes(u.uid)).map((u) => /* @__PURE__ */ jsxs5(
            "button",
            {
              type: "button",
              onClick: () => addMember(u.uid),
              className: "w-full flex items-center gap-3 px-3 py-2.5 hover:bg-app-surface-2/50 transition text-left border-b border-app-border-2/50 last:border-0",
              children: [
                /* @__PURE__ */ jsx5(Avatar, { photoURL: u.photoURL, name: `${u.firstName} ${u.lastName}`, uid: u.uid, size: "sm", level: u.level, teamNumber: u.teamNumber }),
                /* @__PURE__ */ jsxs5("div", { className: "min-w-0 flex-1", children: [
                  /* @__PURE__ */ jsxs5("p", { className: "text-app-text text-sm font-medium truncate", children: [
                    u.firstName,
                    " ",
                    u.lastName
                  ] }),
                  /* @__PURE__ */ jsx5("p", { className: "text-app-text-4 text-xs", children: roleLabel(u.role, u.level) })
                ] }),
                /* @__PURE__ */ jsx5("svg", { className: "w-4 h-4 text-app-text-4 shrink-0", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx5("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 4.5v15m7.5-7.5h-15" }) })
              ]
            },
            u.uid
          )) }),
          /* @__PURE__ */ jsx5(
            "button",
            {
              type: "button",
              onClick: deleteChannel,
              className: "w-full py-2 text-red-500 hover:text-red-400 hover:bg-red-950/40 border border-red-900/50 rounded-xl text-sm font-medium transition",
              children: "Delete Channel"
            }
          )
        ] })
      }
    )
  ] });
}

// LeaderboardApp.tsx
import { useEffect as useEffect3, useRef as useRef3, useState as useState4 } from "react";
import {
  collection as collection2,
  doc as doc2,
  getDoc as getDoc2,
  getDocs as getDocs2,
  onSnapshot as onSnapshot2,
  setDoc as setDoc2
} from "firebase/firestore";
import { jsx as jsx6, jsxs as jsxs6 } from "react/jsx-runtime";
var DEFAULT_VISIBILITY = {
  champion: true,
  teamStandings: true,
  individualRankings: true,
  leadership: true,
  minimumWarning: true
};
var VISIBILITY_LABELS = [
  { key: "champion", label: "Last Week's Champion", desc: "Defending champion hero banner" },
  { key: "teamStandings", label: "Team Standings", desc: "Team ALP grid with captain cards" },
  { key: "individualRankings", label: "Individual Rankings", desc: "CSR tier rep cards" },
  { key: "leadership", label: "Leadership", desc: "Owner / Dev team roster" },
  { key: "minimumWarning", label: "Minimum Warning", desc: "10-app minimum footer notice" }
];
function getWeekStart(date) {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
function formatDate(dateStr) {
  if (!dateStr) return "-";
  return (/* @__PURE__ */ new Date(dateStr + "T12:00:00")).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}
function fmtALP(v) {
  return "$" + (v || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
}
function buildRepStats(cls, userMap, isAdminLevel) {
  const map = {};
  for (const c of cls) {
    if (String(c.agentId ?? "").startsWith("pending:")) continue;
    const key = c.agentId || c.agentName || "unknown";
    if (!map[key]) {
      const u = c.agentId ? userMap[c.agentId] : void 0;
      const name = u ? `${u.firstName} ${u.lastName}`.trim() : c.agentName || "Unknown";
      map[key] = {
        uid: c.agentId || key,
        agentName: name,
        teamNumber: c.agentTeamNumber || 0,
        policies: 0,
        totalALP: 0,
        photoURL: u?.photoURL ?? "",
        email: u?.email ?? "",
        phone: u?.phone ?? "",
        tier: u?.role === "manager" || isAdminLevel(u?.role ?? "") ? "TC" : "CSR",
        level: u?.level
      };
    }
    map[key].policies++;
    map[key].totalALP += c.annualPremium || 0;
  }
  return Object.values(map).sort((a, b) => b.totalALP - a.totalALP);
}
var PALETTE = [
  { from: "from-blue-900/30", border: "border-blue-500/25", text: "text-blue-400" },
  { from: "from-purple-900/30", border: "border-purple-500/25", text: "text-purple-400" },
  { from: "from-emerald-900/30", border: "border-emerald-500/25", text: "text-emerald-400" },
  { from: "from-orange-900/30", border: "border-orange-500/25", text: "text-orange-400" },
  { from: "from-red-900/30", border: "border-red-500/25", text: "text-red-400" },
  { from: "from-yellow-900/30", border: "border-yellow-500/25", text: "text-yellow-400" },
  { from: "from-pink-900/30", border: "border-pink-500/25", text: "text-pink-400" },
  { from: "from-teal-900/30", border: "border-teal-500/25", text: "text-teal-400" },
  { from: "from-cyan-900/30", border: "border-cyan-500/25", text: "text-cyan-400" },
  { from: "from-indigo-900/30", border: "border-indigo-500/25", text: "text-indigo-400" }
];
function teamColor(n) {
  return PALETTE[((n - 1) % PALETTE.length + PALETTE.length) % PALETTE.length];
}
var DEFAULT_TEAM_COLORS_LB = {
  1: "#3b82f6",
  2: "#a855f7",
  3: "#22c55e",
  4: "#f97316",
  5: "#ef4444",
  6: "#eab308",
  7: "#ec4899",
  8: "#14b8a6",
  9: "#06b6d4",
  10: "#6366f1"
};
function getTeamHex(n, overrides) {
  return overrides?.[n] ?? DEFAULT_TEAM_COLORS_LB[(n - 1) % 10 + 1] ?? "#6b7280";
}
var LEVEL_STYLES = {
  1: { bg: "bg-app-surface-2/60", text: "text-app-text-3", border: "border-app-border-2" },
  2: { bg: "bg-blue-900/50", text: "text-blue-300", border: "border-blue-700" },
  3: { bg: "bg-teal-900/50", text: "text-teal-300", border: "border-teal-700" },
  4: { bg: "bg-amber-900/50", text: "text-amber-300", border: "border-amber-700" },
  5: { bg: "bg-orange-900/50", text: "text-orange-300", border: "border-orange-700" },
  6: { bg: "bg-purple-900/50", text: "text-purple-300", border: "border-purple-700" },
  7: { bg: "bg-yellow-900/50", text: "text-yellow-300", border: "border-yellow-600" },
  8: { bg: "bg-rose-900/50", text: "text-rose-300", border: "border-rose-700" },
  9: { bg: "bg-amber-800/60", text: "text-amber-200", border: "border-amber-500" },
  10: { bg: "bg-red-900/60", text: "text-red-300", border: "border-red-600" }
};
function LevelBadge({ level, careerLevels }) {
  const def = careerLevels.find((l) => l.level === level);
  const style = LEVEL_STYLES[level] ?? LEVEL_STYLES[1];
  if (!def) return null;
  return /* @__PURE__ */ jsxs6("span", { className: `inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-bold leading-none ${style.bg} ${style.text} ${style.border}`, children: [
    /* @__PURE__ */ jsxs6("span", { className: "opacity-70", children: [
      "Lvl ",
      level
    ] }),
    /* @__PURE__ */ jsx6("span", { children: def.tag })
  ] });
}
function AvatarCircle({
  photoURL,
  name,
  sizeClass,
  ringClass,
  badgeNumber,
  bottomBadgeContent
}) {
  const initials2 = name.split(" ").map((p) => p[0] ?? "").join("").toUpperCase().slice(0, 2) || "?";
  const colors = ["bg-red-700", "bg-blue-700", "bg-violet-700", "bg-emerald-700", "bg-orange-700", "bg-fuchsia-700", "bg-teal-700", "bg-sky-700"];
  const bg = colors[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length];
  const ring = ringClass ?? "ring-2 ring-app-border-2";
  return /* @__PURE__ */ jsxs6("div", { className: "relative inline-flex shrink-0", children: [
    photoURL ? /* @__PURE__ */ jsx6("img", { src: photoURL, alt: name, className: `${sizeClass} ${ring} rounded-full object-cover shrink-0` }) : /* @__PURE__ */ jsx6("div", { className: `${sizeClass} ${ring} ${bg} rounded-full flex items-center justify-center font-bold text-white shrink-0 select-none`, children: initials2 }),
    badgeNumber !== void 0 && badgeNumber !== null && /* @__PURE__ */ jsx6(
      "div",
      {
        className: "absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center",
        style: { minWidth: "1.25em", height: "1.25em", padding: "0.1em", fontSize: "0.75em", lineHeight: "1" },
        children: badgeNumber
      }
    ),
    bottomBadgeContent && /* @__PURE__ */ jsx6("div", { className: "absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/4 bg-app-surface-2 border border-app-border-2 text-app-text-2 text-xs rounded-md px-1.5 py-0.5 whitespace-nowrap", children: bottomBadgeContent })
  ] });
}
function SectionLabel({ icon, label, sub, accentClass }) {
  return /* @__PURE__ */ jsxs6("div", { className: "flex items-center gap-2 mb-4", children: [
    icon && /* @__PURE__ */ jsx6("span", { className: `${accentClass} text-base leading-none`, children: icon }),
    /* @__PURE__ */ jsx6("h2", { className: `text-xs font-black uppercase tracking-[0.18em] ${accentClass}`, children: label }),
    sub && /* @__PURE__ */ jsx6("span", { className: "text-app-text-5 text-xs", children: sub }),
    /* @__PURE__ */ jsx6("div", { className: "flex-1 h-px bg-app-surface-2" })
  ] });
}
function RepCard({
  rep,
  rank,
  teamNames,
  careerLevels,
  teamColors
}) {
  const col = teamColor(rep.teamNumber || 1);
  const teamHex = getTeamHex(rep.teamNumber || 1, teamColors);
  const isFirst = rank === 0;
  return /* @__PURE__ */ jsxs6("div", { className: `relative rounded-xl p-4 border transition-colors ${isFirst ? "bg-yellow-950/20 border-yellow-500/25 hover:border-yellow-500/40" : "bg-app-surface border-app-border hover:border-app-border-2"}`, children: [
    isFirst && /* @__PURE__ */ jsx6("div", { className: "absolute inset-0 rounded-xl bg-linear-to-br from-yellow-500/5 to-transparent pointer-events-none" }),
    /* @__PURE__ */ jsxs6("div", { className: "relative flex items-start gap-3", children: [
      /* @__PURE__ */ jsx6(
        AvatarCircle,
        {
          photoURL: rep.photoURL,
          name: rep.agentName,
          sizeClass: "w-10 h-10 text-sm",
          badgeNumber: rank + 1,
          bottomBadgeContent: rep.teamNumber > 0 ? `Team ${rep.teamNumber}` : void 0
        }
      ),
      /* @__PURE__ */ jsxs6("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsxs6("div", { className: "flex items-center gap-1.5 flex-wrap", children: [
          /* @__PURE__ */ jsx6("p", { className: "text-app-text font-bold text-sm leading-tight truncate", children: rep.agentName }),
          rep.level && /* @__PURE__ */ jsx6(LevelBadge, { level: rep.level, careerLevels })
        ] }),
        /* @__PURE__ */ jsxs6("p", { className: "text-xs mt-0.5", children: [
          rep.teamNumber > 0 && /* @__PURE__ */ jsxs6("span", { className: "font-semibold", style: { color: teamHex }, children: [
            teamNames[String(rep.teamNumber)] || `T${rep.teamNumber}`,
            " \xB7 "
          ] }),
          /* @__PURE__ */ jsxs6("span", { className: "text-app-text-4", children: [
            rep.policies,
            " app",
            rep.policies !== 1 ? "s" : ""
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs6("div", { className: "relative mt-3 pt-3 border-t border-app-border/60", children: [
      /* @__PURE__ */ jsx6("p", { className: "text-app-text font-black text-xl leading-none", children: fmtALP(rep.totalALP) }),
      /* @__PURE__ */ jsx6("p", { className: "text-app-text-5 text-xs mt-0.5", children: "Total ALP" })
    ] })
  ] });
}
function TierBlock({
  tierCode,
  tierLabel,
  tierSub,
  badgeClass,
  reps,
  teamNames,
  careerLevels,
  teamColors
}) {
  return /* @__PURE__ */ jsxs6("div", { children: [
    /* @__PURE__ */ jsxs6("div", { className: "flex items-center gap-3 mb-3", children: [
      /* @__PURE__ */ jsx6("span", { className: `text-xs font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded border ${badgeClass}`, children: tierCode }),
      /* @__PURE__ */ jsx6("span", { className: "text-app-text font-bold text-sm", children: tierLabel }),
      /* @__PURE__ */ jsx6("span", { className: "text-app-text-5 text-xs", children: tierSub }),
      /* @__PURE__ */ jsx6("div", { className: "flex-1" }),
      /* @__PURE__ */ jsxs6("span", { className: "text-app-text-5 text-xs", children: [
        reps.length,
        " rep",
        reps.length !== 1 ? "s" : ""
      ] })
    ] }),
    /* @__PURE__ */ jsx6("div", { className: "h-px bg-app-surface-2 mb-4" }),
    /* @__PURE__ */ jsx6("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3", children: reps.map((rep, idx) => /* @__PURE__ */ jsx6(RepCard, { rep, rank: idx, teamNames, careerLevels, teamColors }, rep.uid)) })
  ] });
}
function LeadershipCard({ title, accentClass, members }) {
  const totalALP = members.reduce((s, m) => s + m.alp, 0);
  const totalPolicies = members.reduce((s, m) => s + m.policies, 0);
  return /* @__PURE__ */ jsxs6("div", { className: "bg-app-surface border border-app-border rounded-xl overflow-hidden", children: [
    /* @__PURE__ */ jsxs6("div", { className: "px-4 py-3 border-b border-app-border flex items-center justify-between", children: [
      /* @__PURE__ */ jsx6("span", { className: `text-xs font-black uppercase tracking-widest ${accentClass}`, children: title }),
      /* @__PURE__ */ jsxs6("span", { className: "text-app-text-5 text-xs", children: [
        members.length,
        " member",
        members.length !== 1 ? "s" : ""
      ] })
    ] }),
    /* @__PURE__ */ jsx6("div", { className: "divide-y divide-app-border/50", children: members.map((m) => /* @__PURE__ */ jsxs6("div", { className: "flex items-center gap-3 px-4 py-3", children: [
      /* @__PURE__ */ jsx6(AvatarCircle, { photoURL: m.photoURL, name: m.name, sizeClass: "w-8 h-8 text-xs" }),
      /* @__PURE__ */ jsxs6("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsx6("p", { className: "text-app-text text-sm font-medium truncate", children: m.name }),
        m.alp > 0 && /* @__PURE__ */ jsxs6("p", { className: "text-app-text-4 text-xs", children: [
          fmtALP(m.alp),
          " \xB7 ",
          m.policies,
          " app",
          m.policies !== 1 ? "s" : ""
        ] })
      ] })
    ] }, m.uid)) }),
    totalALP > 0 && /* @__PURE__ */ jsxs6("div", { className: "px-4 py-3 border-t border-app-border flex items-center justify-between", children: [
      /* @__PURE__ */ jsx6("span", { className: "text-app-text-4 text-xs", children: "Combined" }),
      /* @__PURE__ */ jsxs6("span", { className: "text-app-text text-sm font-bold", children: [
        fmtALP(totalALP),
        " \xB7 ",
        totalPolicies,
        " apps"
      ] })
    ] })
  ] });
}
function LeaderboardApp({ db: db2, isOwner, isAdminLevel, careerLevels, teamColors }) {
  const [clients, setClients] = useState4([]);
  const [userMap, setUserMap] = useState4({});
  const [loading, setLoading] = useState4(true);
  const [selectedWeek, setSelectedWeek] = useState4("");
  const [availableWeeks, setAvailableWeeks] = useState4([]);
  const [phase, setPhase] = useState4("live");
  const [teamNames, setTeamNames] = useState4({});
  const [visibility, setVisibility] = useState4(DEFAULT_VISIBILITY);
  const [visDraft, setVisDraft] = useState4(DEFAULT_VISIBILITY);
  const [showSettings, setShowSettings] = useState4(false);
  const [saving, setSaving] = useState4(false);
  const settingsRef = useRef3(null);
  useEffect3(() => {
    getDocs2(collection2(db2, "users")).then((snap) => {
      const um = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        um[d.id] = { uid: d.id, ...data };
      });
      setUserMap(um);
    }).catch(console.error);
    getDoc2(doc2(db2, "settings", "teamConfig")).then((snap) => {
      if (snap.exists()) {
        setPhase(snap.data().phase ?? "live");
        setTeamNames(snap.data().teamNames ?? {});
      }
    }).catch(() => {
    });
  }, [db2]);
  useEffect3(() => {
    const unsub = onSnapshot2(collection2(db2, "clients"), (snap) => {
      const all = snap.docs.map((d) => ({ ...d.data() })).filter((c) => phase !== "testing" || c.createdBy !== "csv-import");
      setClients(all);
      const cur = getWeekStart(/* @__PURE__ */ new Date());
      const weeks = Array.from(
        /* @__PURE__ */ new Set([cur, ...all.map((c) => c.weekStart).filter(Boolean)])
      ).sort((a, b) => b > a ? 1 : -1);
      setAvailableWeeks(weeks);
      setSelectedWeek((prev) => prev || cur);
      setLoading(false);
    }, (e) => {
      console.error(e);
      setLoading(false);
    });
    return () => unsub();
  }, [db2, phase]);
  useEffect3(() => {
    const unsub = onSnapshot2(doc2(db2, "settings", "leaderboardConfig"), (snap) => {
      if (snap.exists()) {
        const cfg = { ...DEFAULT_VISIBILITY, ...snap.data() };
        setVisibility(cfg);
        setVisDraft(cfg);
      }
    }, () => {
    });
    return () => unsub();
  }, [db2]);
  useEffect3(() => {
    if (!showSettings) return;
    const handle = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target))
        setShowSettings(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [showSettings]);
  const saveVisibility = async () => {
    setSaving(true);
    try {
      await setDoc2(doc2(db2, "settings", "leaderboardConfig"), visDraft, { merge: true });
      setShowSettings(false);
    } catch (e) {
      console.error("Failed to save leaderboard config", e);
    } finally {
      setSaving(false);
    }
  };
  const prevWeekStr = (() => {
    if (!selectedWeek) return "";
    const d = /* @__PURE__ */ new Date(selectedWeek + "T12:00:00");
    d.setDate(d.getDate() - 7);
    return getWeekStart(d);
  })();
  const weekClients = clients.filter((c) => c.weekStart === selectedWeek);
  const prevClients = clients.filter((c) => c.weekStart === prevWeekStr);
  const repStats = buildRepStats(weekClients, userMap, isAdminLevel);
  const prevRepStats = buildRepStats(prevClients, userMap, isAdminLevel);
  const lastWeekStar = prevRepStats[0] ?? null;
  const teamMap = {};
  for (const rep of repStats) {
    if (!rep.teamNumber) continue;
    const tn = rep.teamNumber;
    if (!teamMap[tn]) {
      const captainEntry = Object.entries(userMap).find(
        ([, u]) => u.teamNumber === tn && (u.role === "manager" || isAdminLevel(u.role))
      );
      const cap = captainEntry?.[1];
      teamMap[tn] = {
        teamNumber: tn,
        totalALP: 0,
        policies: 0,
        captainName: cap ? `${cap.firstName} ${cap.lastName}`.trim() : `Team ${tn} Captain`,
        captainPhotoURL: cap?.photoURL ?? "",
        captainEmail: cap?.email ?? "",
        captainPhone: cap?.phone ?? "",
        repCount: 0
      };
    }
    teamMap[tn].totalALP += rep.totalALP;
    teamMap[tn].policies += rep.policies;
    teamMap[tn].repCount++;
  }
  const teams = Object.values(teamMap).sort((a, b) => b.totalALP - a.totalALP);
  const csrReps = repStats.filter((r) => r.tier === "CSR");
  function buildLeaderMembers(role) {
    return Object.entries(userMap).filter(([, u]) => u.role === role).map(([uid3, u]) => {
      const stat = repStats.find((r) => r.uid === uid3);
      return { uid: uid3, name: `${u.firstName} ${u.lastName}`.trim(), photoURL: u.photoURL, alp: stat?.totalALP ?? 0, policies: stat?.policies ?? 0 };
    }).sort((a, b) => b.alp - a.alp || a.name.localeCompare(b.name));
  }
  const devMembers = buildLeaderMembers("developer");
  const ownerMembers = buildLeaderMembers("owner");
  if (loading) {
    return /* @__PURE__ */ jsx6("div", { className: "min-h-full bg-app-bg overflow-y-auto flex items-center justify-center", children: /* @__PURE__ */ jsxs6("svg", { className: "w-8 h-8 animate-spin text-red-500", fill: "none", viewBox: "0 0 24 24", children: [
      /* @__PURE__ */ jsx6("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
      /* @__PURE__ */ jsx6("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8v8H4z" })
    ] }) });
  }
  return /* @__PURE__ */ jsxs6("div", { className: "bg-app-bg min-h-full overflow-y-auto", children: [
    /* @__PURE__ */ jsx6("div", { className: "bg-app-surface/70 border-b border-app-border", children: /* @__PURE__ */ jsxs6("div", { className: "max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs6("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx6("div", { className: "w-1 h-9 rounded-full bg-red-500" }),
        /* @__PURE__ */ jsxs6("div", { children: [
          /* @__PURE__ */ jsx6("h1", { className: "text-3xl font-black text-app-text tracking-tight uppercase leading-none", children: "Leaderboard" }),
          /* @__PURE__ */ jsxs6("p", { className: "text-app-text-4 text-xs mt-1 font-medium tracking-wide", children: [
            "WEEK OF ",
            selectedWeek ? formatDate(selectedWeek).toUpperCase() : "\u2014"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs6("div", { className: "flex items-center gap-3", children: [
        availableWeeks.length > 0 && /* @__PURE__ */ jsx6(
          "select",
          {
            value: selectedWeek,
            onChange: (e) => setSelectedWeek(e.target.value),
            className: "px-3 py-2 bg-app-surface-2 border border-app-border-2 rounded-lg text-app-text text-sm focus:outline-none focus:ring-2 focus:ring-red-500",
            children: availableWeeks.map((w) => /* @__PURE__ */ jsxs6("option", { value: w, children: [
              "Week of ",
              formatDate(w)
            ] }, w))
          }
        ),
        isOwner && /* @__PURE__ */ jsxs6("div", { className: "relative", ref: settingsRef, children: [
          /* @__PURE__ */ jsx6(
            "button",
            {
              type: "button",
              onClick: () => setShowSettings((v) => !v),
              title: "Leaderboard settings",
              className: `p-2 rounded-lg transition-colors ${showSettings ? "text-app-text bg-app-surface-2" : "text-app-text-4 hover:text-app-text hover:bg-app-surface-2"}`,
              children: /* @__PURE__ */ jsxs6("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.8, children: [
                /* @__PURE__ */ jsx6("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" }),
                /* @__PURE__ */ jsx6("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" })
              ] })
            }
          ),
          showSettings && /* @__PURE__ */ jsxs6("div", { className: "absolute top-full right-0 mt-2 w-80 bg-app-surface border border-app-border-2 rounded-xl shadow-2xl z-50 overflow-hidden", children: [
            /* @__PURE__ */ jsxs6("div", { className: "px-4 py-3 border-b border-app-border flex items-center justify-between", children: [
              /* @__PURE__ */ jsx6("p", { className: "text-xs font-black uppercase tracking-widest text-app-text-2", children: "Section Visibility" }),
              /* @__PURE__ */ jsx6("p", { className: "text-[10px] text-app-text-5", children: "Changes save for all users" })
            ] }),
            /* @__PURE__ */ jsx6("div", { className: "p-3 space-y-1", children: VISIBILITY_LABELS.map(({ key, label, desc }) => /* @__PURE__ */ jsxs6("div", { className: "flex items-start justify-between gap-3 px-1 py-2 rounded-lg hover:bg-app-surface-2/50 transition-colors", children: [
              /* @__PURE__ */ jsxs6("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsx6("p", { className: "text-xs text-app-text font-semibold leading-snug", children: label }),
                /* @__PURE__ */ jsx6("p", { className: "text-[10px] text-app-text-5 leading-snug mt-0.5", children: desc })
              ] }),
              /* @__PURE__ */ jsx6(
                "button",
                {
                  type: "button",
                  onClick: () => setVisDraft((prev) => ({ ...prev, [key]: !prev[key] })),
                  className: `shrink-0 rounded-full transition-colors relative mt-0.5 ${visDraft[key] ? "bg-red-600" : "bg-app-surface-2"}`,
                  style: { minWidth: "2rem", height: "1.125rem" },
                  children: /* @__PURE__ */ jsx6("span", { className: `absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${visDraft[key] ? "translate-x-4" : "translate-x-0.5"}` })
                }
              )
            ] }, key)) }),
            /* @__PURE__ */ jsxs6("div", { className: "px-3 pb-3 flex gap-2", children: [
              /* @__PURE__ */ jsx6(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    setVisDraft(visibility);
                    setShowSettings(false);
                  },
                  className: "flex-1 py-2 text-xs text-app-text-3 hover:text-app-text border border-app-border-2 rounded-lg transition-colors",
                  children: "Cancel"
                }
              ),
              /* @__PURE__ */ jsx6(
                "button",
                {
                  type: "button",
                  onClick: saveVisibility,
                  disabled: saving,
                  className: "flex-1 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-lg transition-colors",
                  children: saving ? "Saving\u2026" : "Save"
                }
              )
            ] })
          ] })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs6("div", { className: "max-w-7xl mx-auto px-6 py-8 space-y-10", children: [
      visibility.champion && lastWeekStar && prevClients.length > 0 && /* @__PURE__ */ jsxs6("section", { children: [
        /* @__PURE__ */ jsx6(SectionLabel, { icon: "\u2605", label: "Last Week's Champion", sub: formatDate(prevWeekStr), accentClass: "text-yellow-500" }),
        /* @__PURE__ */ jsxs6("div", { className: "relative rounded-2xl overflow-hidden border border-yellow-500/30 bg-linear-to-r from-yellow-950/50 via-amber-950/30 to-app-surface/50", children: [
          /* @__PURE__ */ jsx6("div", { className: "absolute top-0 left-0 w-80 h-80 bg-yellow-500/5 rounded-full -translate-x-40 -translate-y-40 pointer-events-none" }),
          /* @__PURE__ */ jsx6("div", { className: "absolute bottom-0 right-0 w-56 h-56 bg-amber-500/5 rounded-full translate-x-20 translate-y-20 pointer-events-none" }),
          /* @__PURE__ */ jsxs6("div", { className: "relative flex items-center gap-6 px-8 py-7 flex-wrap", children: [
            /* @__PURE__ */ jsxs6("div", { className: "relative shrink-0", children: [
              /* @__PURE__ */ jsx6("div", { className: "absolute -top-4 left-1/2 -translate-x-1/2 text-yellow-400 text-2xl leading-none select-none", children: "\u265B" }),
              /* @__PURE__ */ jsx6(
                AvatarCircle,
                {
                  photoURL: lastWeekStar.photoURL,
                  name: lastWeekStar.agentName,
                  sizeClass: "w-24 h-24 text-2xl",
                  ringClass: "ring-4 ring-yellow-500/50",
                  badgeNumber: 1,
                  bottomBadgeContent: lastWeekStar.teamNumber > 0 ? `Team ${lastWeekStar.teamNumber}` : void 0
                }
              )
            ] }),
            /* @__PURE__ */ jsxs6("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsx6("p", { className: "text-yellow-500/70 text-xs font-black uppercase tracking-[0.2em] mb-1", children: "Defending Champion" }),
              /* @__PURE__ */ jsx6("h2", { className: "text-4xl font-black text-app-text leading-none truncate", children: lastWeekStar.agentName }),
              lastWeekStar.teamNumber > 0 && /* @__PURE__ */ jsxs6("p", { className: "text-app-text-3 text-sm mt-2", children: [
                /* @__PURE__ */ jsx6("span", { className: "font-semibold", style: { color: getTeamHex(lastWeekStar.teamNumber, teamColors) }, children: teamNames[String(lastWeekStar.teamNumber)] || `Team ${lastWeekStar.teamNumber}` }),
                " \xB7 ",
                /* @__PURE__ */ jsx6("span", { children: lastWeekStar.tier === "TC" ? "Team Captain" : "CSR" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs6("div", { className: "text-right shrink-0", children: [
              /* @__PURE__ */ jsx6("p", { className: "text-yellow-400 text-5xl font-black leading-none", children: fmtALP(lastWeekStar.totalALP) }),
              /* @__PURE__ */ jsxs6("p", { className: "text-app-text-3 text-sm mt-2", children: [
                lastWeekStar.policies,
                " ",
                lastWeekStar.policies === 1 ? "policy" : "policies"
              ] })
            ] })
          ] })
        ] })
      ] }),
      visibility.teamStandings && teams.length > 0 && /* @__PURE__ */ jsxs6("section", { children: [
        /* @__PURE__ */ jsx6(SectionLabel, { label: "Team Standings", sub: `${teams.length} active team${teams.length !== 1 ? "s" : ""}`, accentClass: "text-app-text-2" }),
        /* @__PURE__ */ jsx6("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4", children: teams.map((team, idx) => {
          const col = teamColor(team.teamNumber);
          return /* @__PURE__ */ jsxs6("div", { className: `relative bg-linear-to-b ${col.from} to-app-surface/60 border ${col.border} rounded-xl overflow-hidden`, children: [
            idx < 3 && /* @__PURE__ */ jsx6("div", { className: `absolute top-2 right-2 z-20 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${idx === 0 ? "bg-yellow-500 text-black" : idx === 1 ? "bg-gray-300 text-black" : "bg-orange-700 text-white"}`, children: idx + 1 }),
            /* @__PURE__ */ jsxs6("div", { className: "relative group border-b border-app-border/50", children: [
              /* @__PURE__ */ jsxs6("div", { className: "flex items-center gap-3 px-4 py-3", children: [
                /* @__PURE__ */ jsx6(AvatarCircle, { photoURL: team.captainPhotoURL, name: team.captainName, sizeClass: "w-10 h-10 text-sm" }),
                /* @__PURE__ */ jsxs6("div", { className: "min-w-0", children: [
                  /* @__PURE__ */ jsx6("p", { className: "text-app-text font-bold text-sm leading-tight truncate", children: team.captainName }),
                  /* @__PURE__ */ jsx6("p", { className: "text-xs font-semibold", style: { color: getTeamHex(team.teamNumber, teamColors) }, children: "Team Captain \xB7 TC" })
                ] })
              ] }),
              (team.captainEmail || team.captainPhone) && /* @__PURE__ */ jsxs6("div", { className: "absolute inset-0 bg-app-bg/95 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10", children: [
                team.captainEmail && /* @__PURE__ */ jsxs6("a", { href: `mailto:${team.captainEmail}`, className: "flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-xs font-bold transition-colors", children: [
                  /* @__PURE__ */ jsx6("svg", { className: "w-3.5 h-3.5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ jsx6("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" }) }),
                  "Email"
                ] }),
                team.captainPhone && /* @__PURE__ */ jsxs6("a", { href: `tel:${team.captainPhone}`, className: "flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded-lg text-white text-xs font-bold transition-colors", children: [
                  /* @__PURE__ */ jsx6("svg", { className: "w-3.5 h-3.5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ jsx6("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 8V5z" }) }),
                  "Call"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs6("div", { className: "px-4 py-4", children: [
              /* @__PURE__ */ jsx6("p", { className: "text-xs font-bold uppercase tracking-widest mb-1", style: { color: getTeamHex(team.teamNumber, teamColors) }, children: teamNames[String(team.teamNumber)] || `Team ${team.teamNumber}` }),
              /* @__PURE__ */ jsx6("p", { className: "text-app-text text-2xl font-black", children: fmtALP(team.totalALP) }),
              /* @__PURE__ */ jsxs6("div", { className: "flex items-center justify-between mt-2 text-xs text-app-text-4", children: [
                /* @__PURE__ */ jsxs6("span", { children: [
                  team.policies,
                  " apps"
                ] }),
                /* @__PURE__ */ jsxs6("span", { children: [
                  team.repCount,
                  " rep",
                  team.repCount !== 1 ? "s" : ""
                ] })
              ] })
            ] })
          ] }, team.teamNumber);
        }) })
      ] }),
      visibility.individualRankings && /* @__PURE__ */ jsxs6("section", { className: "space-y-8", children: [
        /* @__PURE__ */ jsx6(SectionLabel, { label: "Individual Rankings", accentClass: "text-app-text-2" }),
        csrReps.length > 0 && /* @__PURE__ */ jsx6(
          TierBlock,
          {
            tierCode: "CSR",
            tierLabel: "Customer Service Reps",
            tierSub: "Performance Advance \xB7 $650/wk",
            badgeClass: "text-sky-400 border-sky-500/30 bg-sky-950/30",
            reps: csrReps,
            teamNames,
            careerLevels,
            teamColors
          }
        ),
        repStats.length === 0 && /* @__PURE__ */ jsx6("p", { className: "text-center text-app-text-5 py-12 text-sm", children: "No data for this week." })
      ] }),
      visibility.leadership && (devMembers.length > 0 || ownerMembers.length > 0) && /* @__PURE__ */ jsxs6("section", { children: [
        /* @__PURE__ */ jsx6(SectionLabel, { label: "Leadership", accentClass: "text-app-text-3" }),
        /* @__PURE__ */ jsxs6("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
          devMembers.length > 0 && /* @__PURE__ */ jsx6(LeadershipCard, { title: "Dev Team", accentClass: "text-red-400", members: devMembers }),
          ownerMembers.length > 0 && /* @__PURE__ */ jsx6(LeadershipCard, { title: "Owner Team", accentClass: "text-amber-400", members: ownerMembers })
        ] })
      ] }),
      visibility.minimumWarning && /* @__PURE__ */ jsx6("div", { className: "text-center border-t border-app-border pt-6 pb-2", children: /* @__PURE__ */ jsx6("p", { className: "text-red-500/60 font-black text-xs uppercase tracking-[0.25em]", children: "\u26A0 10 App Minimum Required for All Contractors" }) })
    ] })
  ] });
}

// OdsPanel.tsx
import React3, { useState as useState6, useCallback as useCallback4, useEffect as useEffect5 } from "react";
import { getApp } from "firebase/app";
import {
  getFirestore as getFirestore2,
  collection as collection4,
  addDoc as addDoc3,
  serverTimestamp as serverTimestamp3,
  doc as doc4,
  getDoc as getDoc4,
  setDoc as setDoc4
} from "firebase/firestore";
import { getStorage, ref, uploadBytes as uploadBytes2, getDownloadURL as getDownloadURL2 } from "firebase/storage";

// hooks/useClientList.ts
import { useEffect as useEffect4, useState as useState5, useCallback as useCallback3, useRef as useRef4 } from "react";
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection as collection3,
  doc as doc3,
  query as query2,
  orderBy as orderBy2,
  limit as limit2,
  onSnapshot as onSnapshot3,
  addDoc as addDoc2,
  updateDoc as updateDoc2,
  deleteDoc as deleteDoc2,
  setDoc as setDoc3,
  getDoc as getDoc3,
  arrayUnion as arrayUnion2,
  serverTimestamp as serverTimestamp2
} from "firebase/firestore";

// firebase.config.ts
var firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? ""
};

// hooks/useClientList.ts
var app;
var db;
function getDB() {
  if (!db) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
  }
  return db;
}
var PAGE_SIZE = 30;
function useClientList(collectionId) {
  const firestore = getDB();
  const [clients, setClients] = useState5([]);
  const [views, setViews] = useState5([]);
  const [permissions, setPermissions] = useState5(DEFAULT_PERMISSIONS);
  const [listTitle, setListTitle] = useState5(collectionId);
  const [loading, setLoading] = useState5(true);
  const [hasMore, setHasMore] = useState5(false);
  const [pageLimit, setPageLimit] = useState5(PAGE_SIZE);
  const loadingMore = useRef4(false);
  useEffect4(() => {
    const q = query2(
      collection3(firestore, collectionId),
      orderBy2("date", "desc"),
      limit2(pageLimit + 1)
    );
    const unsub = onSnapshot3(q, (snap) => {
      const allDocs = snap.docs.filter((d) => !d.id.startsWith("_"));
      setHasMore(allDocs.length > pageLimit);
      const records = allDocs.slice(0, pageLimit).map((d) => ({ id: d.id, ...d.data() }));
      setClients(records);
      setLoading(false);
      loadingMore.current = false;
    }, (err) => {
      console.error(`[useClientList] clients onSnapshot error (${collectionId}):`, err);
      setLoading(false);
      loadingMore.current = false;
    });
    return () => unsub();
  }, [collectionId, firestore, pageLimit]);
  useEffect4(() => {
    const viewsRef = collection3(firestore, collectionId, "_config", "views");
    const unsub = onSnapshot3(viewsRef, (snap) => {
      const saved = snap.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      setViews(saved);
    }, (err) => {
      console.error(`[useClientList] views onSnapshot error (${collectionId}):`, err);
    });
    return () => unsub();
  }, [collectionId, firestore]);
  useEffect4(() => {
    const permRef = doc3(firestore, collectionId, "_config");
    getDoc3(permRef).then((snap) => {
      if (snap.exists()) {
        setPermissions(snap.data());
      }
    }).catch((err) => {
      console.error(`[useClientList] permissions load error (${collectionId}):`, err);
    });
  }, [collectionId, firestore]);
  const onSave = useCallback3(async (id, field, value, updaterName, fromValue) => {
    const docRef = doc3(firestore, collectionId, id);
    const changeEntry = {
      at: { seconds: Math.floor(Date.now() / 1e3) },
      by: updaterName,
      field,
      from: String(fromValue ?? ""),
      to: String(value)
    };
    await updateDoc2(docRef, {
      [field]: value,
      updatedAt: serverTimestamp2(),
      updatedByName: updaterName,
      changeLog: arrayUnion2(changeEntry)
    });
  }, [collectionId, firestore]);
  const onSaveView = useCallback3(async (view) => {
    const viewsRef = collection3(firestore, collectionId, "_config", "views");
    const docRef = await addDoc2(viewsRef, { ...view, createdAt: serverTimestamp2() });
    return docRef.id;
  }, [collectionId, firestore]);
  const onDeleteView = useCallback3(async (id) => {
    const viewRef = doc3(firestore, collectionId, "_config", "views", id);
    await deleteDoc2(viewRef);
  }, [collectionId, firestore]);
  const onRenameList = useCallback3(async (name) => {
    const metaRef = doc3(firestore, collectionId, "_meta");
    await setDoc3(metaRef, { title: name }, { merge: true });
    setListTitle(name);
  }, [collectionId, firestore]);
  const onSavePermissions = useCallback3(async (matrix) => {
    const permRef = doc3(firestore, collectionId, "_config");
    await setDoc3(permRef, matrix, { merge: true });
    setPermissions(matrix);
  }, [collectionId, firestore]);
  const onLoadMore = useCallback3(async () => {
    if (loadingMore.current || !hasMore) return;
    loadingMore.current = true;
    setPageLimit((prev) => prev + PAGE_SIZE);
  }, [hasMore]);
  return {
    data: clients,
    views,
    permissions,
    loading,
    hasMore,
    listTitle,
    onSave,
    onSaveView,
    onDeleteView,
    onSavePermissions,
    onRenameList,
    onLoadMore
  };
}

// OdsPanel.tsx
import { jsx as jsx7, jsxs as jsxs7 } from "react/jsx-runtime";
var S = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.65)",
    zIndex: 1e3,
    display: "flex",
    alignItems: "stretch",
    justifyContent: "flex-end"
  },
  drawer: {
    width: "440px",
    maxWidth: "100vw",
    background: "var(--app-surface)",
    borderLeft: "1px solid var(--app-border)",
    display: "flex",
    flexDirection: "column",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
    overflowY: "hidden"
  },
  drawerHeader: {
    padding: "20px 24px",
    borderBottom: "1px solid var(--app-border)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
    flexShrink: 0
  },
  drawerBody: { flex: 1, overflowY: "auto", padding: "20px 24px" },
  drawerFooter: {
    padding: "14px 24px",
    borderTop: "1px solid var(--app-border)",
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end",
    flexShrink: 0
  },
  label: {
    display: "block",
    fontSize: "11px",
    fontWeight: 600,
    color: "var(--app-text-3)",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    marginBottom: "6px"
  },
  input: {
    width: "100%",
    padding: "9px 12px",
    background: "var(--app-surface-2)",
    border: "1px solid var(--app-border-2)",
    borderRadius: "8px",
    color: "var(--app-text)",
    fontSize: "13px",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box"
  },
  currencyWrap: { position: "relative" },
  currencyPrefix: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "var(--app-text-3)",
    fontSize: "13px",
    pointerEvents: "none"
  },
  fieldGroup: { marginBottom: "16px" },
  btnPrimary: {
    padding: "9px 20px",
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit"
  },
  btnGhost: {
    padding: "9px 20px",
    background: "transparent",
    color: "var(--app-text-3)",
    border: "1px solid var(--app-border-2)",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit"
  },
  addBtn: {
    padding: "7px 16px",
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap"
  },
  toolbar: {
    background: "var(--app-bg)",
    borderBottom: "1px solid var(--app-border)",
    padding: "8px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexShrink: 0
  },
  errorBox: {
    background: "#2d1515",
    border: "1px solid #7f1d1d",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "12px",
    color: "#fca5a5",
    marginBottom: "14px"
  },
  fileBtn: {
    display: "inline-block",
    padding: "8px 14px",
    background: "var(--app-surface-2)",
    border: "1px dashed var(--app-border-2)",
    borderRadius: "8px",
    color: "var(--app-text-2)",
    fontSize: "12px",
    cursor: "pointer",
    fontFamily: "inherit"
  },
  fileName: { fontSize: "11px", color: "var(--app-text-4)", marginTop: "4px" }
};
function getDB2() {
  return getFirestore2(getApp());
}
function getStore() {
  return getStorage(getApp());
}
async function seedPermissionsIfAbsent(collectionId) {
  const db2 = getDB2();
  const permRef = doc4(db2, "permissions", collectionId);
  const snap = await getDoc4(permRef);
  if (!snap.exists()) {
    const matrix = {
      rep: { ...DEFAULT_PERMISSIONS.rep },
      manager: { ...DEFAULT_PERMISSIONS.manager },
      admin: { ...DEFAULT_PERMISSIONS.admin }
    };
    await setDoc4(permRef, matrix);
  }
}
function AddDrawer({ fields, title, onClose, onSubmit }) {
  const initial = Object.fromEntries(
    fields.map((f) => [f.key, f.defaultValue ?? (f.type === "checkbox" ? "false" : "")])
  );
  const [values, setValues] = useState6(initial);
  const [files, setFiles] = useState6({});
  const [saving, setSaving] = useState6(false);
  const [error, setError] = useState6("");
  const set = (key, val) => setValues((v) => ({ ...v, [key]: val }));
  const setFile = (key, file) => setFiles((f) => ({ ...f, [key]: file }));
  async function handleSubmit(e) {
    e.preventDefault();
    const missing = fields.filter((f) => f.required && f.type !== "file" && !values[f.key]?.trim());
    const missingFiles = fields.filter((f) => f.required && f.type === "file" && !files[f.key]);
    if (missing.length || missingFiles.length) {
      setError(`Required: ${[...missing, ...missingFiles].map((f) => f.label).join(", ")}`);
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
  function renderField(field) {
    const val = values[field.key];
    switch (field.type) {
      case "select":
        return /* @__PURE__ */ jsxs7(
          "select",
          {
            value: val,
            onChange: (e) => set(field.key, e.target.value),
            style: { ...S.input, cursor: "pointer" },
            children: [
              /* @__PURE__ */ jsx7("option", { value: "", children: "Select\u2026" }),
              field.options?.map((o) => /* @__PURE__ */ jsx7("option", { value: o, children: o }, o))
            ]
          }
        );
      case "checkbox":
        return /* @__PURE__ */ jsxs7("label", { style: { display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }, children: [
          /* @__PURE__ */ jsx7(
            "input",
            {
              type: "checkbox",
              checked: val === "true",
              onChange: (e) => set(field.key, e.target.checked ? "true" : "false"),
              style: { width: "16px", height: "16px", accentColor: "#3b82f6" }
            }
          ),
          /* @__PURE__ */ jsx7("span", { style: { fontSize: "13px", color: "var(--app-text-2)" }, children: "Yes" })
        ] });
      case "currency":
        return /* @__PURE__ */ jsxs7("div", { style: S.currencyWrap, children: [
          /* @__PURE__ */ jsx7("span", { style: S.currencyPrefix, children: "$" }),
          /* @__PURE__ */ jsx7(
            "input",
            {
              type: "number",
              min: "0",
              step: "0.01",
              value: val,
              onChange: (e) => set(field.key, e.target.value),
              placeholder: field.placeholder ?? "0.00",
              style: { ...S.input, paddingLeft: "24px" }
            }
          )
        ] });
      case "number":
        return /* @__PURE__ */ jsx7(
          "input",
          {
            type: "number",
            value: val,
            onChange: (e) => set(field.key, e.target.value),
            placeholder: field.placeholder,
            style: S.input
          }
        );
      case "textarea":
        return /* @__PURE__ */ jsx7(
          "textarea",
          {
            value: val,
            onChange: (e) => set(field.key, e.target.value),
            placeholder: field.placeholder,
            rows: 3,
            style: { ...S.input, resize: "vertical" }
          }
        );
      case "file":
        return /* @__PURE__ */ jsxs7("div", { children: [
          /* @__PURE__ */ jsxs7("label", { style: S.fileBtn, children: [
            files[field.key] ? "Change file" : "Choose file",
            /* @__PURE__ */ jsx7(
              "input",
              {
                type: "file",
                style: { display: "none" },
                onChange: (e) => {
                  if (e.target.files?.[0]) setFile(field.key, e.target.files[0]);
                }
              }
            )
          ] }),
          files[field.key] && /* @__PURE__ */ jsx7("div", { style: S.fileName, children: files[field.key].name })
        ] });
      default:
        return /* @__PURE__ */ jsx7(
          "input",
          {
            type: field.type,
            value: val,
            onChange: (e) => set(field.key, e.target.value),
            placeholder: field.placeholder,
            style: S.input
          }
        );
    }
  }
  return /* @__PURE__ */ jsx7("div", { style: S.overlay, onClick: (e) => e.target === e.currentTarget && onClose(), children: /* @__PURE__ */ jsxs7("div", { style: S.drawer, children: [
    /* @__PURE__ */ jsxs7("div", { style: S.drawerHeader, children: [
      /* @__PURE__ */ jsxs7("div", { children: [
        /* @__PURE__ */ jsxs7("div", { style: { fontSize: "15px", fontWeight: 700, color: "var(--app-text)" }, children: [
          "Add ",
          title
        ] }),
        /* @__PURE__ */ jsx7("div", { style: { fontSize: "11px", color: "var(--app-text-4)", marginTop: "3px" }, children: "Appears in the list immediately after saving" })
      ] }),
      /* @__PURE__ */ jsx7(
        "button",
        {
          onClick: onClose,
          style: { background: "none", border: "none", color: "var(--app-text-4)", cursor: "pointer", fontSize: "20px", lineHeight: 1, padding: "0 4px" },
          children: "\xD7"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs7("form", { onSubmit: handleSubmit, style: { display: "contents" }, children: [
      /* @__PURE__ */ jsxs7("div", { style: S.drawerBody, children: [
        error && /* @__PURE__ */ jsx7("div", { style: S.errorBox, children: error }),
        fields.map((f) => /* @__PURE__ */ jsxs7("div", { style: S.fieldGroup, children: [
          /* @__PURE__ */ jsxs7("label", { style: S.label, children: [
            f.label,
            f.required && /* @__PURE__ */ jsx7("span", { style: { color: "#ef4444", marginLeft: "3px" }, children: "*" })
          ] }),
          renderField(f)
        ] }, f.key))
      ] }),
      /* @__PURE__ */ jsxs7("div", { style: S.drawerFooter, children: [
        /* @__PURE__ */ jsx7("button", { type: "button", onClick: onClose, style: S.btnGhost, children: "Cancel" }),
        /* @__PURE__ */ jsx7("button", { type: "submit", style: { ...S.btnPrimary, opacity: saving ? 0.65 : 1 }, disabled: saving, children: saving ? "Saving\u2026" : `Add ${title}` })
      ] })
    ] })
  ] }) });
}
function OdsPanel({
  collectionId,
  title,
  subtitle,
  uid: uid3,
  userName,
  isAdmin = false,
  currentRole = "admin",
  fields,
  columns: columnsProp,
  defaultVisibleCols,
  transformRecord
}) {
  const [drawerOpen, setDrawerOpen] = useState6(false);
  const listProps = useClientList(collectionId);
  const columns = React3.useMemo(() => {
    if (columnsProp) return columnsProp;
    return fields.map((f) => ({
      key: f.key,
      label: f.label,
      sortable: true,
      editable: f.type !== "file" && f.type !== "checkbox",
      filterType: f.type === "number" || f.type === "currency" ? "number" : f.type === "date" ? "date" : f.type === "select" ? "enum" : "text",
      enumValues: f.options
    }));
  }, [columnsProp, fields]);
  useEffect5(() => {
    seedPermissionsIfAbsent(collectionId).catch(console.error);
  }, [collectionId]);
  const handleAdd = useCallback4(async (values, files) => {
    const db2 = getDB2();
    const storage = getStore();
    const fileUrls = {};
    for (const [key, file] of Object.entries(files)) {
      const fieldDef = fields.find((f) => f.key === key);
      const basePath = fieldDef?.storagePath ?? collectionId;
      const storageRef2 = ref(storage, `${basePath}/${Date.now()}-${file.name}`);
      await uploadBytes2(storageRef2, file);
      fileUrls[key] = await getDownloadURL2(storageRef2);
    }
    const coerced = { ...values };
    for (const f of fields) {
      if ((f.type === "number" || f.type === "currency") && values[f.key]) {
        coerced[f.key] = parseFloat(values[f.key]) || 0;
      }
    }
    const base = transformRecord ? transformRecord(values, fileUrls) : { ...coerced, ...fileUrls };
    await addDoc3(collection4(db2, collectionId), {
      ...base,
      date: base.date ?? (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      createdAt: serverTimestamp3(),
      createdBy: uid3,
      createdByName: userName
    });
  }, [collectionId, fields, uid3, userName, transformRecord]);
  return /* @__PURE__ */ jsxs7("div", { style: { display: "flex", flexDirection: "column", height: "100%", background: "var(--app-bg)" }, children: [
    /* @__PURE__ */ jsxs7("div", { style: S.toolbar, children: [
      /* @__PURE__ */ jsx7("div", { style: { display: "flex", alignItems: "center", gap: "10px" }, children: subtitle && /* @__PURE__ */ jsx7("span", { style: { fontSize: "11px", color: "var(--app-text-5)", letterSpacing: "0.04em" }, children: subtitle }) }),
      /* @__PURE__ */ jsxs7("button", { style: S.addBtn, onClick: () => setDrawerOpen(true), children: [
        "+ Add ",
        title
      ] })
    ] }),
    /* @__PURE__ */ jsx7("div", { style: { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }, children: /* @__PURE__ */ jsx7(
      OdsList,
      {
        ...listProps,
        columns,
        defaultVisibleCols,
        uid: uid3,
        userName,
        isAdmin,
        currentRole
      }
    ) }),
    drawerOpen && /* @__PURE__ */ jsx7(
      AddDrawer,
      {
        fields,
        collectionId,
        title,
        onClose: () => setDrawerOpen(false),
        onSubmit: handleAdd
      }
    )
  ] });
}

// ReceiptScanner.tsx
import {
  useState as useState7,
  useCallback as useCallback5,
  useRef as useRef5
} from "react";
import { Fragment as Fragment3, jsx as jsx8, jsxs as jsxs8 } from "react/jsx-runtime";
var CATEGORIES = [
  "AI & API Services",
  "Software & Subscriptions",
  "Cloud & Infrastructure",
  "Hardware & Equipment",
  "Contractors & Freelancers",
  "Marketing & Advertising",
  "Travel & Lodging",
  "Meals & Entertainment",
  "Education & Training",
  "Legal & Professional",
  "Office & Supplies",
  "Utilities & Internet",
  "Other"
];
var PAYMENT_METHODS = [
  "Credit Card",
  "Debit Card",
  "Cash",
  "Check",
  "Apple Pay",
  "Google Pay",
  "Other"
];
function uid() {
  return Math.random().toString(36).slice(2, 10);
}
function blankForm() {
  return {
    merchant: "",
    date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    subtotal: 0,
    tax: 0,
    tip: 0,
    total: 0,
    category: "Other",
    paymentMethod: "Credit Card",
    currency: "USD",
    notes: "",
    items: []
  };
}
function GeminiStar({ size = 12, color = "#a78bfa" }) {
  return /* @__PURE__ */ jsx8("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", children: /* @__PURE__ */ jsx8(
    "path",
    {
      d: "M12 2L13.5 9.5L21 12L13.5 14.5L12 22L10.5 14.5L3 12L10.5 9.5L12 2Z",
      fill: color
    }
  ) });
}
function FieldLabel({ children }) {
  return /* @__PURE__ */ jsx8("span", { className: "text-[11px] text-app-text-4 font-medium uppercase tracking-wider", children });
}
function ReceiptScanner({
  receipts,
  processReceipt,
  onSave,
  onDelete,
  className = ""
}) {
  const [stage, setStage] = useState7("idle");
  const [dragOver, setDragOver] = useState7(false);
  const [error, setError] = useState7(null);
  const [form, setForm] = useState7(blankForm());
  const [preview, setPreview] = useState7(null);
  const fileRef = useRef5(null);
  function setField(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }
  function recalcTotal(partial = {}) {
    setForm((f) => {
      const m = { ...f, ...partial };
      return { ...m, total: +(m.subtotal + m.tax + m.tip).toFixed(2) };
    });
  }
  const handleFile = useCallback5(
    async (file) => {
      setError(null);
      const allowed = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "application/pdf"
      ];
      if (!allowed.includes(file.type)) {
        setError("Please upload a JPG, PNG, WebP, or PDF file.");
        return;
      }
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result);
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
      setStage("processing");
      try {
        const parsed = await processReceipt(file);
        setForm({
          ...blankForm(),
          ...parsed,
          items: (parsed.items ?? []).map((item) => ({
            id: uid(),
            description: item.description ?? "",
            qty: item.qty ?? 1,
            unitPrice: item.unitPrice ?? 0,
            total: item.total ?? 0
          }))
        });
        setStage("review");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to process receipt.");
        setStage("idle");
      }
    },
    [processReceipt]
  );
  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }
  function onInputChange(e) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }
  function addItem() {
    setForm((f) => ({
      ...f,
      items: [
        ...f.items,
        { id: uid(), description: "", qty: 1, unitPrice: 0, total: 0 }
      ]
    }));
  }
  function updateItem(id, key, val) {
    setForm((f) => ({
      ...f,
      items: f.items.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [key]: val };
        if (key === "qty" || key === "unitPrice") {
          updated.total = +(updated.qty * updated.unitPrice).toFixed(2);
        }
        return updated;
      })
    }));
  }
  function removeItem(id) {
    setForm((f) => ({ ...f, items: f.items.filter((i) => i.id !== id) }));
  }
  async function handleSave() {
    setStage("saving");
    try {
      await onSave(form);
      setForm(blankForm());
      setPreview(null);
      setError(null);
      setStage("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save receipt.");
      setStage("review");
    }
  }
  function handleCancel() {
    setForm(blankForm());
    setPreview(null);
    setError(null);
    setStage("idle");
  }
  return /* @__PURE__ */ jsxs8("div", { className: `space-y-6 ${className}`, children: [
    (stage === "idle" || stage === "processing") && /* @__PURE__ */ jsxs8(
      "div",
      {
        onDragOver: (e) => {
          e.preventDefault();
          setDragOver(true);
        },
        onDragLeave: () => setDragOver(false),
        onDrop,
        onClick: () => stage === "idle" && fileRef.current?.click(),
        className: [
          "relative border-2 border-dashed rounded-2xl transition-all select-none",
          stage === "processing" ? "border-violet-700 bg-violet-950/20 cursor-default" : dragOver ? "border-violet-500 bg-violet-950/30 cursor-copy" : "border-app-border-2 bg-app-surface/50 hover:border-app-border-2 hover:bg-app-surface cursor-pointer"
        ].join(" "),
        children: [
          /* @__PURE__ */ jsx8(
            "input",
            {
              ref: fileRef,
              type: "file",
              accept: "image/jpeg,image/png,image/webp,image/gif,application/pdf",
              className: "hidden",
              onChange: onInputChange
            }
          ),
          /* @__PURE__ */ jsx8("div", { className: "flex flex-col items-center justify-center py-14 px-6 text-center", children: stage === "processing" ? /* @__PURE__ */ jsxs8(Fragment3, { children: [
            /* @__PURE__ */ jsxs8("div", { className: "relative w-14 h-14 mb-5", children: [
              /* @__PURE__ */ jsx8("div", { className: "absolute inset-0 rounded-full border-4 border-violet-900" }),
              /* @__PURE__ */ jsx8("div", { className: "absolute inset-0 rounded-full border-4 border-t-violet-400 animate-spin" }),
              /* @__PURE__ */ jsx8("div", { className: "absolute inset-0 flex items-center justify-center", children: /* @__PURE__ */ jsx8(GeminiStar, { size: 20 }) })
            ] }),
            /* @__PURE__ */ jsx8("p", { className: "text-app-text font-medium text-sm", children: "Gemini is reading your receipt\u2026" }),
            /* @__PURE__ */ jsx8("p", { className: "text-app-text-4 text-xs mt-1", children: "This usually takes a few seconds" })
          ] }) : /* @__PURE__ */ jsxs8(Fragment3, { children: [
            /* @__PURE__ */ jsx8("div", { className: "w-12 h-12 rounded-2xl bg-app-surface-2 border border-app-border-2 flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx8(
              "svg",
              {
                className: "w-6 h-6 text-app-text-3",
                fill: "none",
                viewBox: "0 0 24 24",
                stroke: "currentColor",
                strokeWidth: 1.5,
                children: /* @__PURE__ */ jsx8(
                  "path",
                  {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    d: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  }
                )
              }
            ) }),
            /* @__PURE__ */ jsx8("p", { className: "text-app-text font-medium text-sm mb-1", children: "Drop a receipt here or click to upload" }),
            /* @__PURE__ */ jsx8("p", { className: "text-app-text-4 text-xs mb-4", children: "JPG, PNG, WebP, or PDF \u2014 Gemini extracts the details" }),
            /* @__PURE__ */ jsxs8("div", { className: "inline-flex items-center gap-1.5 text-xs text-violet-400 font-medium", children: [
              /* @__PURE__ */ jsx8(GeminiStar, { size: 11 }),
              "Powered by Gemini"
            ] })
          ] }) })
        ]
      }
    ),
    error && /* @__PURE__ */ jsxs8("div", { className: "flex items-start gap-3 bg-red-950/30 border border-red-800/60 rounded-xl px-4 py-3", children: [
      /* @__PURE__ */ jsx8(
        "svg",
        {
          className: "w-4 h-4 text-red-400 shrink-0 mt-0.5",
          fill: "none",
          viewBox: "0 0 24 24",
          stroke: "currentColor",
          strokeWidth: 2,
          children: /* @__PURE__ */ jsx8(
            "path",
            {
              strokeLinecap: "round",
              strokeLinejoin: "round",
              d: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"
            }
          )
        }
      ),
      /* @__PURE__ */ jsx8("p", { className: "text-red-400 text-xs leading-relaxed", children: error })
    ] }),
    (stage === "review" || stage === "saving") && /* @__PURE__ */ jsxs8("div", { className: "bg-app-surface border border-app-border rounded-2xl overflow-hidden", children: [
      /* @__PURE__ */ jsxs8("div", { className: "flex items-center justify-between px-5 py-4 border-b border-app-border", children: [
        /* @__PURE__ */ jsxs8("div", { className: "flex items-center gap-2.5", children: [
          /* @__PURE__ */ jsx8("div", { className: "w-7 h-7 rounded-lg bg-violet-900/50 border border-violet-800/60 flex items-center justify-center", children: /* @__PURE__ */ jsx8(GeminiStar, { size: 13 }) }),
          /* @__PURE__ */ jsx8("span", { className: "text-app-text font-semibold text-sm", children: "Review & confirm" }),
          /* @__PURE__ */ jsx8("span", { className: "text-xs text-app-text-4 hidden sm:block", children: "Edit anything Gemini got wrong" })
        ] }),
        preview && /* @__PURE__ */ jsx8(
          "img",
          {
            src: preview,
            alt: "Receipt preview",
            className: "h-10 w-8 object-cover rounded-md border border-app-border-2 opacity-70 hover:opacity-100 transition-opacity"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs8("div", { className: "p-5 space-y-5", children: [
        /* @__PURE__ */ jsxs8("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs8("label", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsx8(FieldLabel, { children: "Merchant" }),
            /* @__PURE__ */ jsx8(
              "input",
              {
                type: "text",
                value: form.merchant,
                onChange: (e) => setField("merchant", e.target.value),
                placeholder: "Store or vendor name",
                className: "bg-app-surface-2 border border-app-border-2 rounded-lg px-3 py-2 text-app-text text-sm placeholder:text-app-text-5 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600/30 transition"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs8("label", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsx8(FieldLabel, { children: "Date" }),
            /* @__PURE__ */ jsx8(
              "input",
              {
                type: "date",
                value: form.date,
                onChange: (e) => setField("date", e.target.value),
                className: "bg-app-surface-2 border border-app-border-2 rounded-lg px-3 py-2 text-app-text text-sm focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600/30 transition [color-scheme:dark]"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs8("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs8("label", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsx8(FieldLabel, { children: "Category" }),
            /* @__PURE__ */ jsx8(
              "select",
              {
                value: form.category,
                onChange: (e) => setField("category", e.target.value),
                className: "bg-app-surface-2 border border-app-border-2 rounded-lg px-3 py-2 text-app-text text-sm focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600/30 transition",
                children: CATEGORIES.map((c) => /* @__PURE__ */ jsx8("option", { value: c, children: c }, c))
              }
            )
          ] }),
          /* @__PURE__ */ jsxs8("label", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsx8(FieldLabel, { children: "Payment method" }),
            /* @__PURE__ */ jsx8(
              "select",
              {
                value: form.paymentMethod,
                onChange: (e) => setField("paymentMethod", e.target.value),
                className: "bg-app-surface-2 border border-app-border-2 rounded-lg px-3 py-2 text-app-text text-sm focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600/30 transition",
                children: PAYMENT_METHODS.map((p) => /* @__PURE__ */ jsx8("option", { value: p, children: p }, p))
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs8("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-4", children: [
          ["subtotal", "tax", "tip"].map((k) => /* @__PURE__ */ jsxs8("label", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsx8(FieldLabel, { children: k }),
            /* @__PURE__ */ jsxs8("div", { className: "relative", children: [
              /* @__PURE__ */ jsx8("span", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-app-text-4 text-sm pointer-events-none", children: "$" }),
              /* @__PURE__ */ jsx8(
                "input",
                {
                  type: "number",
                  min: "0",
                  step: "0.01",
                  value: form[k] || "",
                  onChange: (e) => recalcTotal({ [k]: parseFloat(e.target.value) || 0 }),
                  className: "w-full bg-app-surface-2 border border-app-border-2 rounded-lg pl-6 pr-3 py-2 text-app-text text-sm focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600/30 transition"
                }
              )
            ] })
          ] }, k)),
          /* @__PURE__ */ jsxs8("label", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsx8(FieldLabel, { children: "Total" }),
            /* @__PURE__ */ jsxs8("div", { className: "relative", children: [
              /* @__PURE__ */ jsx8("span", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-app-text-4 text-sm pointer-events-none", children: "$" }),
              /* @__PURE__ */ jsx8(
                "input",
                {
                  type: "number",
                  min: "0",
                  step: "0.01",
                  value: form.total || "",
                  onChange: (e) => setField("total", parseFloat(e.target.value) || 0),
                  className: "w-full bg-app-surface-2 border border-app-border-2 rounded-lg pl-6 pr-3 py-2 text-app-text font-semibold text-sm focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600/30 transition"
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs8("div", { children: [
          /* @__PURE__ */ jsxs8("div", { className: "flex items-center justify-between mb-2", children: [
            /* @__PURE__ */ jsx8(FieldLabel, { children: "Line items" }),
            /* @__PURE__ */ jsxs8(
              "button",
              {
                type: "button",
                onClick: addItem,
                className: "text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors flex items-center gap-1",
                children: [
                  /* @__PURE__ */ jsx8(
                    "svg",
                    {
                      className: "w-3 h-3",
                      fill: "none",
                      viewBox: "0 0 24 24",
                      stroke: "currentColor",
                      strokeWidth: 2.5,
                      children: /* @__PURE__ */ jsx8(
                        "path",
                        {
                          strokeLinecap: "round",
                          strokeLinejoin: "round",
                          d: "M12 4.5v15m7.5-7.5h-15"
                        }
                      )
                    }
                  ),
                  "Add item"
                ]
              }
            )
          ] }),
          form.items.length > 0 ? /* @__PURE__ */ jsx8("div", { className: "rounded-xl border border-app-border overflow-hidden", children: /* @__PURE__ */ jsxs8("table", { className: "w-full text-xs", children: [
            /* @__PURE__ */ jsx8("thead", { children: /* @__PURE__ */ jsxs8("tr", { className: "border-b border-app-border", children: [
              /* @__PURE__ */ jsx8("th", { className: "text-left text-app-text-4 font-medium px-3 py-2 w-full", children: "Description" }),
              /* @__PURE__ */ jsx8("th", { className: "text-right text-app-text-4 font-medium px-3 py-2 whitespace-nowrap", children: "Qty" }),
              /* @__PURE__ */ jsx8("th", { className: "text-right text-app-text-4 font-medium px-3 py-2 whitespace-nowrap", children: "Unit $" }),
              /* @__PURE__ */ jsx8("th", { className: "text-right text-app-text-4 font-medium px-3 py-2 whitespace-nowrap", children: "Total" }),
              /* @__PURE__ */ jsx8("th", { className: "px-2 py-2 w-6" })
            ] }) }),
            /* @__PURE__ */ jsx8("tbody", { children: form.items.map((item, i) => /* @__PURE__ */ jsxs8(
              "tr",
              {
                className: i < form.items.length - 1 ? "border-b border-app-border/60" : "",
                children: [
                  /* @__PURE__ */ jsx8("td", { className: "px-2 py-1.5", children: /* @__PURE__ */ jsx8(
                    "input",
                    {
                      type: "text",
                      value: item.description,
                      onChange: (e) => updateItem(item.id, "description", e.target.value),
                      placeholder: "Item description",
                      className: "w-full bg-transparent text-app-text placeholder:text-app-text-5 focus:outline-none focus:bg-app-surface-2 rounded px-1 py-0.5 transition-colors"
                    }
                  ) }),
                  /* @__PURE__ */ jsx8("td", { className: "px-2 py-1.5", children: /* @__PURE__ */ jsx8(
                    "input",
                    {
                      type: "number",
                      min: "0",
                      step: "1",
                      value: item.qty,
                      onChange: (e) => updateItem(
                        item.id,
                        "qty",
                        parseFloat(e.target.value) || 0
                      ),
                      className: "w-14 text-right bg-transparent text-app-text focus:outline-none focus:bg-app-surface-2 rounded px-1 py-0.5 transition-colors"
                    }
                  ) }),
                  /* @__PURE__ */ jsx8("td", { className: "px-2 py-1.5", children: /* @__PURE__ */ jsx8(
                    "input",
                    {
                      type: "number",
                      min: "0",
                      step: "0.01",
                      value: item.unitPrice,
                      onChange: (e) => updateItem(
                        item.id,
                        "unitPrice",
                        parseFloat(e.target.value) || 0
                      ),
                      className: "w-20 text-right bg-transparent text-app-text focus:outline-none focus:bg-app-surface-2 rounded px-1 py-0.5 transition-colors"
                    }
                  ) }),
                  /* @__PURE__ */ jsxs8("td", { className: "px-3 py-1.5 text-right text-app-text-2 tabular-nums", children: [
                    "$",
                    item.total.toFixed(2)
                  ] }),
                  /* @__PURE__ */ jsx8("td", { className: "px-2 py-1.5", children: /* @__PURE__ */ jsx8(
                    "button",
                    {
                      type: "button",
                      onClick: () => removeItem(item.id),
                      className: "text-app-text-5 hover:text-red-400 transition-colors",
                      children: /* @__PURE__ */ jsx8(
                        "svg",
                        {
                          className: "w-3.5 h-3.5",
                          fill: "none",
                          viewBox: "0 0 24 24",
                          stroke: "currentColor",
                          strokeWidth: 2,
                          children: /* @__PURE__ */ jsx8(
                            "path",
                            {
                              strokeLinecap: "round",
                              strokeLinejoin: "round",
                              d: "M6 18L18 6M6 6l12 12"
                            }
                          )
                        }
                      )
                    }
                  ) })
                ]
              },
              item.id
            )) })
          ] }) }) : /* @__PURE__ */ jsx8("p", { className: "text-app-text-5 text-xs italic py-2", children: "No line items detected \u2014 add them manually if needed." })
        ] }),
        /* @__PURE__ */ jsxs8("label", { className: "flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsx8(FieldLabel, { children: "Notes" }),
          /* @__PURE__ */ jsx8(
            "textarea",
            {
              value: form.notes,
              onChange: (e) => setField("notes", e.target.value),
              placeholder: "Any additional notes\u2026",
              rows: 2,
              className: "bg-app-surface-2 border border-app-border-2 rounded-lg px-3 py-2 text-app-text text-sm placeholder:text-app-text-5 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600/30 transition resize-none"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs8("div", { className: "flex items-center justify-between px-5 py-4 border-t border-app-border bg-app-bg/30", children: [
        /* @__PURE__ */ jsx8(
          "button",
          {
            type: "button",
            onClick: handleCancel,
            disabled: stage === "saving",
            className: "text-sm text-app-text-4 hover:text-app-text-2 transition-colors disabled:opacity-40",
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsxs8(
          "button",
          {
            type: "button",
            onClick: handleSave,
            disabled: stage === "saving",
            className: "inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors",
            children: [
              stage === "saving" && /* @__PURE__ */ jsxs8("svg", { className: "w-4 h-4 animate-spin", fill: "none", viewBox: "0 0 24 24", children: [
                /* @__PURE__ */ jsx8(
                  "circle",
                  {
                    className: "opacity-25",
                    cx: "12",
                    cy: "12",
                    r: "10",
                    stroke: "currentColor",
                    strokeWidth: "4"
                  }
                ),
                /* @__PURE__ */ jsx8(
                  "path",
                  {
                    className: "opacity-75",
                    fill: "currentColor",
                    d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  }
                )
              ] }),
              "Save receipt"
            ]
          }
        )
      ] })
    ] })
  ] });
}

// ReceiptList.tsx
import { useState as useState8, useMemo as useMemo4, useRef as useRef6, useEffect as useEffect6 } from "react";
import { Fragment as Fragment4, jsx as jsx9, jsxs as jsxs9 } from "react/jsx-runtime";
var CATEGORY_OPTIONS = [
  "AI & API Services",
  "Software & Subscriptions",
  "Cloud & Infrastructure",
  "Hardware & Equipment",
  "Contractors & Freelancers",
  "Marketing & Advertising",
  "Travel & Lodging",
  "Meals & Entertainment",
  "Education & Training",
  "Legal & Professional",
  "Office & Supplies",
  "Utilities & Internet",
  "Other"
];
var PAYMENT_OPTIONS = [
  "Credit Card",
  "Debit Card",
  "Cash",
  "Check",
  "Apple Pay",
  "Google Pay",
  "Other"
];
var COLUMNS = [
  { key: "date", label: "Date", sortable: true, filterType: "date" },
  { key: "merchant", label: "Merchant", sortable: true, filterType: "text" },
  { key: "category", label: "Category", sortable: true, filterType: "enum" },
  { key: "total", label: "Total", sortable: true, filterType: "number" },
  { key: "subtotal", label: "Subtotal", sortable: true, filterType: "number" },
  { key: "tax", label: "Tax", sortable: false, filterType: "number" },
  { key: "tip", label: "Tip", sortable: false, filterType: "number" },
  { key: "paymentMethod", label: "Payment", sortable: true, filterType: "enum" },
  { key: "currency", label: "Currency", sortable: false, filterType: "enum" },
  { key: "items", label: "Items", noFilter: true },
  { key: "notes", label: "Notes", filterType: "text" },
  { key: "createdAt", label: "Added", sortable: true, filterType: "date" }
];
var DEFAULT_VISIBLE = [
  "date",
  "merchant",
  "category",
  "total",
  "subtotal",
  "tax",
  "paymentMethod",
  "items",
  "notes"
];
var EDITABLE_COLS = /* @__PURE__ */ new Set([
  "date",
  "merchant",
  "category",
  "total",
  "subtotal",
  "tax",
  "tip",
  "paymentMethod",
  "currency",
  "notes"
]);
var PAGE_SIZE2 = 50;
function fmtDate2(s) {
  if (!s) return "\u2014";
  const [y, m, d] = s.split("-");
  if (!y || !m || !d) return s;
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function fmtMoney(v) {
  if (v === void 0 || v === null) return "\u2014";
  if (v === 0) return "$0.00";
  return "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtCreatedAt(iso) {
  if (!iso) return "\u2014";
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}
function getOperators2(ft) {
  switch (ft) {
    case "enum":
      return ["is"];
    case "text":
      return ["contains", "is"];
    case "number":
      return [">", "\u2265", "<", "\u2264", "between"];
    case "date":
      return ["is", "before", "after", "between"];
    default:
      return ["contains"];
  }
}
function filterRowsToSpecs2(rows) {
  const result = {};
  for (const row of rows) {
    if (!row.field || !row.value) continue;
    const col = COLUMNS.find((c) => c.key === row.field);
    const ft = col?.filterType ?? "text";
    if (ft === "enum") {
      const prev = result[row.field];
      const vals = prev?.kind === "enum" ? prev.values : [];
      if (!vals.includes(row.value)) result[row.field] = { kind: "enum", values: [...vals, row.value] };
    } else if (ft === "text") {
      result[row.field] = row.operator === "is" ? { kind: "enum", values: [row.value] } : { kind: "text", q: row.value };
    } else {
      switch (row.operator) {
        case "is":
        case "=":
          result[row.field] = { kind: "range", min: row.value, max: row.value };
          break;
        case ">":
          result[row.field] = { kind: "range", min: row.value };
          break;
        case "\u2265":
        case "after":
          result[row.field] = { kind: "range", min: row.value };
          break;
        case "<":
          result[row.field] = { kind: "range", max: row.value };
          break;
        case "\u2264":
        case "before":
          result[row.field] = { kind: "range", max: row.value };
          break;
        case "between":
          result[row.field] = { kind: "range", min: row.value, max: row.value2 || void 0 };
          break;
      }
    }
  }
  return result;
}
function applyFilters(receipts, specs, search) {
  const q = search.toLowerCase();
  return receipts.filter((r) => {
    if (q) {
      const hay = [r.merchant, r.category, r.paymentMethod, r.notes, r.date].filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    for (const [field, spec] of Object.entries(specs)) {
      const raw = r[field];
      const val = raw === void 0 || raw === null ? "" : String(raw);
      if (spec.kind === "enum") {
        if (!spec.values.includes(val)) return false;
      } else if (spec.kind === "text") {
        if (!val.toLowerCase().includes(spec.q.toLowerCase())) return false;
      } else if (spec.kind === "range") {
        const num = parseFloat(val);
        if (spec.min !== void 0 && num < parseFloat(spec.min)) return false;
        if (spec.max !== void 0 && num > parseFloat(spec.max)) return false;
      }
    }
    return true;
  });
}
function getEnumValues(receipts, field) {
  const set = /* @__PURE__ */ new Set();
  receipts.forEach((r) => {
    const v = r[field];
    if (v !== void 0 && v !== null && v !== "") set.add(String(v));
  });
  return Array.from(set).sort();
}
function doExportCSV(receipts, visibleKeys) {
  const cols = COLUMNS.filter((c) => visibleKeys.includes(c.key));
  const header = cols.map((c) => c.label).join(",");
  const rows = receipts.map(
    (r) => cols.map((c) => {
      let v = r[c.key];
      if (c.key === "items") v = Array.isArray(r.items) ? r.items.length : 0;
      if (c.key === "createdAt") v = fmtCreatedAt(r.createdAt);
      const s = v === void 0 || v === null ? "" : String(v);
      return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(",")
  );
  const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "receipts.csv";
  a.click();
}
function PencilIcon() {
  return /* @__PURE__ */ jsx9("svg", { className: "cl-pencil", width: "11", height: "11", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx9("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" }) });
}
function CellInput2({ type, initialValue, options, onSave, onCancel }) {
  const [val, setVal] = useState8(initialValue);
  if (type === "select" && options) {
    return /* @__PURE__ */ jsx9(
      "select",
      {
        autoFocus: true,
        className: "cl-cell-select",
        value: val,
        onChange: (e) => setVal(e.target.value),
        onBlur: () => onSave(val),
        onKeyDown: (e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            onCancel();
          }
          if (e.key === "Enter") {
            e.stopPropagation();
            onSave(val);
          }
        },
        children: options.map((o) => /* @__PURE__ */ jsx9("option", { value: o, children: o }, o))
      }
    );
  }
  return /* @__PURE__ */ jsxs9("div", { className: "cl-cell-edit-wrap", children: [
    /* @__PURE__ */ jsx9(
      "input",
      {
        autoFocus: true,
        className: "cl-cell-input",
        type: type === "number" ? "number" : type === "date" ? "date" : "text",
        value: val,
        onChange: (e) => setVal(e.target.value),
        onKeyDown: (e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            onCancel();
          }
          if (e.key === "Enter") {
            e.stopPropagation();
            onSave(val);
          }
        }
      }
    ),
    /* @__PURE__ */ jsxs9("div", { className: "cl-cell-actions", children: [
      /* @__PURE__ */ jsx9("button", { className: "cl-cell-cancel-btn", onMouseDown: (e) => e.preventDefault(), onClick: onCancel, title: "Cancel (Esc)", children: /* @__PURE__ */ jsx9("svg", { width: "9", height: "9", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 3.5, children: /* @__PURE__ */ jsx9("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) }) }),
      /* @__PURE__ */ jsx9("button", { className: "cl-cell-confirm-btn", onMouseDown: (e) => e.preventDefault(), onClick: () => onSave(val), title: "Save (Enter)", children: /* @__PURE__ */ jsx9("svg", { width: "9", height: "9", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 3.5, children: /* @__PURE__ */ jsx9("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 13l4 4L19 7" }) }) })
    ] })
  ] });
}
function ReceiptList({
  receipts,
  loading,
  onSave,
  onDelete,
  listTitle = "Receipts"
}) {
  const [colOrder, setColOrder] = useState8(COLUMNS.map((c) => c.key));
  const [colVisible, setColVisible] = useState8(DEFAULT_VISIBLE);
  const [showColPicker, setShowColPicker] = useState8(false);
  const [showExport, setShowExport] = useState8(false);
  const colPickerRef = useRef6(null);
  const exportRef = useRef6(null);
  const [sortField, setSortField] = useState8("date");
  const [sortDir, setSortDir] = useState8("desc");
  const [searchText, setSearchText] = useState8("");
  const [filterRows, setFilterRows] = useState8([]);
  const [showFilterBuilder, setShowFilterBuilder] = useState8(false);
  const uidRef = useRef6(0);
  function newId() {
    return String(++uidRef.current);
  }
  const [editingCell, setEditingCell] = useState8(null);
  const [dragCol, setDragCol] = useState8(null);
  const [dragOverCol, setDragOverCol] = useState8(null);
  const [page, setPage] = useState8(0);
  const tableScrollRef = useRef6(null);
  const hScrollTrackRef = useRef6(null);
  const [hThumb, setHThumb] = useState8({ show: false, left: 0, width: 0 });
  const thumbDragging = useRef6(false);
  const thumbStartX = useRef6(0);
  const thumbStartLeft = useRef6(0);
  useEffect6(() => {
    function handle(e) {
      if (colPickerRef.current && !colPickerRef.current.contains(e.target)) setShowColPicker(false);
      if (exportRef.current && !exportRef.current.contains(e.target)) setShowExport(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);
  function syncHThumb() {
    const el = tableScrollRef.current;
    if (!el) return;
    const trackW = el.clientWidth;
    const scrollW = el.scrollWidth;
    if (scrollW <= trackW) {
      setHThumb({ show: false, left: 0, width: 0 });
      return;
    }
    const thumbW = Math.max(40, trackW / scrollW * trackW);
    const maxLeft = trackW - thumbW;
    const left = el.scrollLeft / (scrollW - trackW) * maxLeft;
    setHThumb({ show: true, left, width: thumbW });
  }
  useEffect6(() => {
    syncHThumb();
  }, [colOrder, colVisible, receipts]);
  function onThumbMouseDown(e) {
    thumbDragging.current = true;
    thumbStartX.current = e.clientX;
    thumbStartLeft.current = hThumb.left;
    const onMove = (ev) => {
      if (!thumbDragging.current || !tableScrollRef.current || !hScrollTrackRef.current) return;
      const el = tableScrollRef.current;
      const trackW = el.clientWidth;
      const scrollW = el.scrollWidth;
      const thumbW = hThumb.width;
      const maxLeft = trackW - thumbW;
      const newLeft = Math.max(0, Math.min(maxLeft, thumbStartLeft.current + ev.clientX - thumbStartX.current));
      el.scrollLeft = newLeft / maxLeft * (scrollW - trackW);
    };
    const onUp = () => {
      thumbDragging.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp, { once: true });
  }
  function onTrackClick(e) {
    const track = hScrollTrackRef.current;
    const el = tableScrollRef.current;
    if (!track || !el) return;
    const rect = track.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    el.scrollLeft = ratio * (el.scrollWidth - el.clientWidth);
  }
  function scrollToLeft() {
    if (tableScrollRef.current) tableScrollRef.current.scrollLeft = 0;
  }
  const filterSpecs = useMemo4(() => filterRowsToSpecs2(filterRows), [filterRows]);
  const filteredReceipts = useMemo4(() => {
    let rows = applyFilters(receipts, filterSpecs, searchText);
    if (sortField) {
      rows = [...rows].sort((a, b) => {
        const av = a[sortField] ?? "";
        const bv = b[sortField] ?? "";
        const an = parseFloat(String(av));
        const bn = parseFloat(String(bv));
        let cmp = !isNaN(an) && !isNaN(bn) ? an - bn : String(av).localeCompare(String(bv));
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return rows;
  }, [receipts, filterSpecs, searchText, sortField, sortDir]);
  const totalPages = Math.ceil(filteredReceipts.length / PAGE_SIZE2);
  const pageReceipts = filteredReceipts.slice(page * PAGE_SIZE2, (page + 1) * PAGE_SIZE2);
  const visibleColDefs = useMemo4(
    () => colOrder.map((k) => COLUMNS.find((c) => c.key === k)).filter((c) => c && (colVisible === null || colVisible.includes(c.key))),
    [colOrder, colVisible]
  );
  const totals = useMemo4(() => ({
    total: filteredReceipts.reduce((s, r) => s + (r.total ?? 0), 0),
    subtotal: filteredReceipts.reduce((s, r) => s + (r.subtotal ?? 0), 0),
    tax: filteredReceipts.reduce((s, r) => s + (r.tax ?? 0), 0),
    tip: filteredReceipts.reduce((s, r) => s + (r.tip ?? 0), 0)
  }), [filteredReceipts]);
  const activeFilterCount = useMemo4(
    () => Object.values(filterSpecs).filter(
      (v) => v.kind === "enum" ? v.values.length > 0 : v.kind === "text" ? !!v.q : !!(v.min || v.max)
    ).length,
    [filterSpecs]
  );
  const pickableCols = COLUMNS.filter((c) => !c.noFilter || c.key !== "items");
  function handleSort(key) {
    if (sortField === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else {
      setSortField(key);
      setSortDir("asc");
    }
    setPage(0);
  }
  function addFilterRow() {
    const first = COLUMNS.find((c) => !c.noFilter);
    if (!first) return;
    setFilterRows((prev) => [...prev, {
      id: newId(),
      field: first.key,
      operator: getOperators2(first.filterType)[0],
      value: "",
      value2: ""
    }]);
  }
  function updateFilterRow(id, patch) {
    setFilterRows((prev) => prev.map((r) => r.id === id ? { ...r, ...patch } : r));
  }
  function removeFilterRow(id) {
    setFilterRows((prev) => prev.filter((r) => r.id !== id));
  }
  function reorderCol(from, to) {
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
  function togglePickerCol(key) {
    setColVisible((prev) => {
      const current = prev ?? COLUMNS.map((c) => c.key);
      return current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
    });
  }
  async function commitCell(id, field, raw) {
    setEditingCell(null);
    if (!onSave) return;
    const numFields = /* @__PURE__ */ new Set(["total", "subtotal", "tax", "tip"]);
    await onSave(id, field, numFields.has(field) ? parseFloat(raw) || 0 : raw);
  }
  function renderCell(col, r) {
    const isEditing = editingCell?.id === r.id && editingCell?.field === col.key;
    const canEdit = !!onSave && EDITABLE_COLS.has(col.key);
    if (isEditing) {
      let type = "text";
      let opts;
      if (col.key === "category") {
        type = "select";
        opts = CATEGORY_OPTIONS;
      } else if (col.key === "paymentMethod") {
        type = "select";
        opts = PAYMENT_OPTIONS;
      } else if (col.key === "currency") {
        type = "select";
        opts = ["USD", "EUR", "GBP", "CAD", "AUD"];
      } else if (col.filterType === "number") type = "number";
      else if (col.filterType === "date") type = "date";
      const raw = r[col.key];
      const initial = raw === void 0 || raw === null ? "" : String(raw);
      return /* @__PURE__ */ jsx9("td", { className: "cl-td", children: /* @__PURE__ */ jsx9(
        CellInput2,
        {
          type,
          initialValue: initial,
          options: opts,
          onSave: (v) => commitCell(r.id, col.key, v),
          onCancel: () => setEditingCell(null)
        }
      ) }, col.key);
    }
    let content = "\u2014";
    switch (col.key) {
      case "date":
        content = fmtDate2(r.date);
        break;
      case "merchant":
        content = r.merchant || "\u2014";
        break;
      case "category":
        content = r.category || "\u2014";
        break;
      case "total":
        content = /* @__PURE__ */ jsx9("span", { style: { fontWeight: 600 }, children: fmtMoney(r.total) });
        break;
      case "subtotal":
        content = fmtMoney(r.subtotal);
        break;
      case "tax":
        content = fmtMoney(r.tax);
        break;
      case "tip":
        content = r.tip ? fmtMoney(r.tip) : "\u2014";
        break;
      case "paymentMethod":
        content = r.paymentMethod || "\u2014";
        break;
      case "currency":
        content = r.currency || "USD";
        break;
      case "items":
        content = r.items?.length ? `${r.items.length} item${r.items.length !== 1 ? "s" : ""}` : "\u2014";
        break;
      case "notes":
        content = r.notes || "\u2014";
        break;
      case "createdAt":
        content = fmtCreatedAt(r.createdAt);
        break;
      default:
        content = String(r[col.key] ?? "\u2014");
    }
    return /* @__PURE__ */ jsx9("td", { className: "cl-td", children: /* @__PURE__ */ jsxs9(
      "div",
      {
        className: "cl-cell-inner" + (canEdit ? " cl-cell-editable" : ""),
        onClick: () => canEdit && setEditingCell({ id: r.id, field: col.key }),
        children: [
          /* @__PURE__ */ jsx9("span", { className: "cl-cell-value", children: content }),
          canEdit && /* @__PURE__ */ jsx9(PencilIcon, {})
        ]
      }
    ) }, col.key);
  }
  function renderFilterBuilder() {
    if (!showFilterBuilder) return null;
    return /* @__PURE__ */ jsxs9("div", { className: "cl-filter-builder", children: [
      filterRows.length === 0 && /* @__PURE__ */ jsx9("div", { className: "cl-fb-empty", children: 'No filters \u2014 click "Add filter" to start.' }),
      filterRows.map((row) => {
        const col = COLUMNS.find((c) => c.key === row.field);
        const ft = col?.filterType ?? "text";
        const ops = getOperators2(ft);
        const enumVals = ft === "enum" ? getEnumValues(receipts, row.field) : [];
        return /* @__PURE__ */ jsxs9("div", { className: "cl-fb-row", children: [
          /* @__PURE__ */ jsx9("span", { className: "cl-fb-where", children: "Where" }),
          /* @__PURE__ */ jsxs9(
            "select",
            {
              className: "cl-fb-select",
              value: row.field,
              onChange: (e) => {
                const nc = COLUMNS.find((c) => c.key === e.target.value);
                updateFilterRow(row.id, { field: e.target.value, operator: getOperators2(nc?.filterType)[0], value: "", value2: "" });
              },
              children: [
                /* @__PURE__ */ jsx9("option", { value: "", children: "Select field\u2026" }),
                COLUMNS.filter((c) => !c.noFilter).map((c) => /* @__PURE__ */ jsx9("option", { value: c.key, children: c.label }, c.key))
              ]
            }
          ),
          /* @__PURE__ */ jsx9(
            "select",
            {
              className: "cl-fb-select cl-fb-select-op",
              value: row.operator,
              onChange: (e) => updateFilterRow(row.id, { operator: e.target.value, value: "", value2: "" }),
              children: ops.map((o) => /* @__PURE__ */ jsx9("option", { value: o, children: o }, o))
            }
          ),
          ft === "enum" ? /* @__PURE__ */ jsxs9(
            "select",
            {
              className: "cl-fb-select cl-fb-select-val",
              value: row.value,
              onChange: (e) => updateFilterRow(row.id, { value: e.target.value }),
              children: [
                /* @__PURE__ */ jsx9("option", { value: "", children: "Select\u2026" }),
                enumVals.map((v) => /* @__PURE__ */ jsx9("option", { value: v, children: v }, v))
              ]
            }
          ) : row.operator === "between" ? /* @__PURE__ */ jsxs9(Fragment4, { children: [
            /* @__PURE__ */ jsx9(
              "input",
              {
                className: "cl-fb-input",
                type: ft === "date" ? "date" : "number",
                placeholder: "From",
                value: row.value,
                onChange: (e) => updateFilterRow(row.id, { value: e.target.value })
              }
            ),
            /* @__PURE__ */ jsx9("span", { className: "cl-fb-and", children: "and" }),
            /* @__PURE__ */ jsx9(
              "input",
              {
                className: "cl-fb-input",
                type: ft === "date" ? "date" : "number",
                placeholder: "To",
                value: row.value2,
                onChange: (e) => updateFilterRow(row.id, { value2: e.target.value })
              }
            )
          ] }) : /* @__PURE__ */ jsx9(
            "input",
            {
              className: "cl-fb-input cl-fb-input-wide",
              type: ft === "date" ? "date" : ft === "number" ? "number" : "text",
              placeholder: "Value\u2026",
              value: row.value,
              onChange: (e) => updateFilterRow(row.id, { value: e.target.value })
            }
          ),
          /* @__PURE__ */ jsx9("button", { className: "cl-fb-remove", onClick: () => removeFilterRow(row.id), title: "Remove filter", children: /* @__PURE__ */ jsx9("svg", { width: "12", height: "12", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ jsx9("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) }) })
        ] }, row.id);
      }),
      /* @__PURE__ */ jsxs9("div", { className: "cl-fb-footer", children: [
        /* @__PURE__ */ jsxs9("button", { className: "cl-fb-add", onClick: addFilterRow, children: [
          /* @__PURE__ */ jsx9("svg", { width: "12", height: "12", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx9("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 4.5v15m7.5-7.5h-15" }) }),
          "Add filter"
        ] }),
        filterRows.length > 0 && /* @__PURE__ */ jsx9("button", { className: "cl-fb-clear", onClick: () => setFilterRows([]), children: "Clear all" })
      ] })
    ] });
  }
  if (loading) {
    return /* @__PURE__ */ jsx9("div", { className: "cl-root cl-loading", children: /* @__PURE__ */ jsx9("div", { className: "cl-loading-spinner" }) });
  }
  return /* @__PURE__ */ jsxs9("div", { className: "cl-root", children: [
    /* @__PURE__ */ jsx9("div", { className: "cl-header", children: /* @__PURE__ */ jsx9("div", { className: "cl-header-row", children: /* @__PURE__ */ jsxs9("div", { className: "cl-header-left", children: [
      /* @__PURE__ */ jsx9("div", { className: "cl-header-accent" }),
      /* @__PURE__ */ jsxs9("div", { children: [
        /* @__PURE__ */ jsx9("h1", { className: "cl-title", children: listTitle }),
        /* @__PURE__ */ jsxs9("p", { className: "cl-subtitle", children: [
          filteredReceipts.length !== receipts.length ? `${filteredReceipts.length.toLocaleString()} of ${receipts.length.toLocaleString()} receipts` : `${receipts.length.toLocaleString()} receipt${receipts.length !== 1 ? "s" : ""}`,
          filteredReceipts.length > 0 && /* @__PURE__ */ jsxs9(Fragment4, { children: [
            " \xB7 ",
            fmtMoney(totals.total),
            " total"
          ] })
        ] })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsxs9("div", { className: "cl-toolbar-row", children: [
      /* @__PURE__ */ jsx9("div", { className: "cl-toolbar", children: /* @__PURE__ */ jsx9("div", { className: "cl-toolbar-seg", style: { fontSize: 12, color: "var(--cl-text-4)", padding: "0 8px" }, children: receipts.length === 0 ? "No receipts yet" : `${receipts.length} receipt${receipts.length !== 1 ? "s" : ""}` }) }),
      /* @__PURE__ */ jsxs9("div", { className: "cl-action-bar", children: [
        /* @__PURE__ */ jsxs9("div", { className: "cl-action-wrap", ref: colPickerRef, children: [
          /* @__PURE__ */ jsx9(
            "button",
            {
              className: "cl-action-btn" + (showColPicker ? " active" : ""),
              onClick: () => setShowColPicker((p) => !p),
              title: "Show / hide columns",
              children: /* @__PURE__ */ jsx9("svg", { width: "15", height: "15", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx9("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 4H5a1 1 0 00-1 1v14a1 1 0 001 1h4M9 4v16M9 4h6M9 20h6m0-16h4a1 1 0 011 1v14a1 1 0 01-1 1h-4M15 4v16" }) })
            }
          ),
          showColPicker && /* @__PURE__ */ jsxs9("div", { className: "cl-export-menu cl-col-picker-menu", children: [
            /* @__PURE__ */ jsxs9("div", { className: "cl-export-menu-header", style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
              /* @__PURE__ */ jsxs9("div", { children: [
                /* @__PURE__ */ jsx9("div", { className: "cl-export-menu-title", children: "Show / Hide Columns" }),
                /* @__PURE__ */ jsxs9("div", { className: "cl-export-menu-sub", children: [
                  colVisible === null ? pickableCols.length : colVisible.length,
                  " of ",
                  pickableCols.length,
                  " shown"
                ] })
              ] }),
              /* @__PURE__ */ jsx9("button", { className: "cl-col-picker-reset", onClick: () => setColVisible(null), children: "Reset" })
            ] }),
            /* @__PURE__ */ jsx9("div", { className: "cl-col-picker-body", children: pickableCols.map((col) => {
              const checked = colVisible === null || colVisible.includes(col.key);
              return /* @__PURE__ */ jsxs9("label", { className: "cl-col-picker-row", children: [
                /* @__PURE__ */ jsx9("input", { type: "checkbox", checked, onChange: () => togglePickerCol(col.key) }),
                /* @__PURE__ */ jsx9("span", { children: col.label })
              ] }, col.key);
            }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs9("div", { className: "cl-action-wrap", ref: exportRef, children: [
          /* @__PURE__ */ jsx9(
            "button",
            {
              className: "cl-action-btn" + (showExport ? " active" : ""),
              onClick: () => setShowExport((p) => !p),
              disabled: filteredReceipts.length === 0,
              title: "Export to CSV",
              children: /* @__PURE__ */ jsx9("svg", { width: "15", height: "15", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx9("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" }) })
            }
          ),
          showExport && /* @__PURE__ */ jsxs9("div", { className: "cl-export-menu", children: [
            /* @__PURE__ */ jsxs9("div", { className: "cl-export-menu-header", children: [
              /* @__PURE__ */ jsx9("div", { className: "cl-export-menu-title", children: "Export to CSV" }),
              /* @__PURE__ */ jsx9("div", { className: "cl-export-menu-sub", children: "Exports all currently filtered records" })
            ] }),
            /* @__PURE__ */ jsx9("div", { className: "cl-export-menu-body", children: /* @__PURE__ */ jsx9("button", { className: "cl-export-dl-btn", onClick: () => {
              doExportCSV(filteredReceipts, colVisible ?? COLUMNS.map((c) => c.key));
              setShowExport(false);
            }, children: "Download" }) })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs9("div", { className: "cl-search-area", children: [
      /* @__PURE__ */ jsxs9("div", { className: "cl-search-row", children: [
        /* @__PURE__ */ jsxs9("div", { className: "cl-search-wrap", children: [
          /* @__PURE__ */ jsx9("svg", { className: "cl-search-icon", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx9("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) }),
          /* @__PURE__ */ jsx9(
            "input",
            {
              className: "cl-search-input",
              type: "text",
              placeholder: "Search by merchant, category, notes\u2026",
              value: searchText,
              onChange: (e) => {
                setSearchText(e.target.value);
                setPage(0);
              }
            }
          ),
          searchText && /* @__PURE__ */ jsx9("button", { className: "cl-search-clear", onClick: () => setSearchText(""), children: /* @__PURE__ */ jsx9("svg", { width: "14", height: "14", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx9("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) }) })
        ] }),
        /* @__PURE__ */ jsxs9(
          "button",
          {
            className: "cl-filter-toggle" + (showFilterBuilder || activeFilterCount > 0 ? " active" : ""),
            onClick: () => {
              setShowFilterBuilder((p) => !p);
              if (!showFilterBuilder && filterRows.length === 0) addFilterRow();
            },
            children: [
              /* @__PURE__ */ jsx9("svg", { width: "14", height: "14", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx9("path", { fillRule: "evenodd", d: "M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L13 10.414V17a1 1 0 01-1.447.894l-4-2A1 1 0 017 15v-4.586L3.293 6.707A1 1 0 013 6V3z", clipRule: "evenodd" }) }),
              "Filter",
              activeFilterCount > 0 && /* @__PURE__ */ jsx9("span", { className: "cl-filter-toggle-count", children: activeFilterCount })
            ]
          }
        )
      ] }),
      renderFilterBuilder()
    ] }),
    showFilterBuilder && activeFilterCount > 0 && /* @__PURE__ */ jsxs9("div", { className: "cl-active-filters", children: [
      /* @__PURE__ */ jsx9("span", { className: "cl-active-filters-label", children: "Column filters:" }),
      Object.entries(filterSpecs).map(([col, spec]) => {
        const colDef = COLUMNS.find((c) => c.key === col);
        const name = colDef?.label || col;
        let chip = "";
        if (spec.kind === "enum" && spec.values.length) chip = spec.values.length > 1 ? `${name}: ${spec.values.length} selected` : `${name}: ${spec.values[0]}`;
        if (spec.kind === "text" && spec.q) chip = `${name}: ~${spec.q}`;
        if (spec.kind === "range" && (spec.min || spec.max)) chip = `${name}: ${spec.min ?? ""}\u2013${spec.max ?? ""}`;
        if (!chip) return null;
        return /* @__PURE__ */ jsxs9("span", { className: "cl-filter-chip", children: [
          chip,
          /* @__PURE__ */ jsx9("button", { className: "cl-filter-chip-remove", onClick: () => setFilterRows((prev) => prev.filter((r) => r.field !== col)), children: "\xD7" })
        ] }, col);
      }),
      /* @__PURE__ */ jsx9("button", { className: "cl-filter-clear-all", onClick: () => setFilterRows([]), children: "Clear all" })
    ] }),
    /* @__PURE__ */ jsxs9("div", { className: "cl-table-area", children: [
      filteredReceipts.length > 0 ? /* @__PURE__ */ jsxs9("div", { className: "cl-table-wrap", children: [
        /* @__PURE__ */ jsx9("div", { className: "cl-table-scroll", ref: tableScrollRef, onScroll: syncHThumb, children: /* @__PURE__ */ jsxs9("table", { className: "cl-table", children: [
          /* @__PURE__ */ jsx9("thead", { className: "cl-thead", children: /* @__PURE__ */ jsxs9("tr", { children: [
            visibleColDefs.map((col) => {
              const isSorted = sortField === col.key;
              const isDragging = dragCol === col.key;
              const isDragOver = dragOverCol === col.key && dragCol !== col.key;
              return /* @__PURE__ */ jsx9(
                "th",
                {
                  className: ["cl-th", isDragging ? "dragging" : "", isDragOver ? "drag-over" : ""].filter(Boolean).join(" "),
                  onDragOver: (e) => {
                    e.preventDefault();
                    if (dragCol && dragCol !== col.key) setDragOverCol(col.key);
                  },
                  onDrop: () => {
                    if (dragCol && dragCol !== col.key) reorderCol(dragCol, col.key);
                    setDragOverCol(null);
                  },
                  children: /* @__PURE__ */ jsxs9("div", { className: "cl-th-inner", children: [
                    /* @__PURE__ */ jsx9(
                      "span",
                      {
                        className: "cl-drag-grip",
                        draggable: true,
                        onDragStart: (e) => {
                          e.stopPropagation();
                          setDragCol(col.key);
                        },
                        onDragEnd: () => {
                          setDragCol(null);
                          setDragOverCol(null);
                        },
                        title: "Drag to reorder",
                        children: /* @__PURE__ */ jsxs9("svg", { width: "12", height: "12", fill: "currentColor", viewBox: "0 0 16 16", children: [
                          /* @__PURE__ */ jsx9("circle", { cx: "5", cy: "4", r: "1.5" }),
                          /* @__PURE__ */ jsx9("circle", { cx: "11", cy: "4", r: "1.5" }),
                          /* @__PURE__ */ jsx9("circle", { cx: "5", cy: "8", r: "1.5" }),
                          /* @__PURE__ */ jsx9("circle", { cx: "11", cy: "8", r: "1.5" }),
                          /* @__PURE__ */ jsx9("circle", { cx: "5", cy: "12", r: "1.5" }),
                          /* @__PURE__ */ jsx9("circle", { cx: "11", cy: "12", r: "1.5" })
                        ] })
                      }
                    ),
                    col.sortable ? /* @__PURE__ */ jsxs9("button", { className: "cl-sort-btn" + (isSorted ? " sorted" : ""), onClick: () => handleSort(col.key), children: [
                      col.label,
                      /* @__PURE__ */ jsx9("span", { className: "cl-sort-arrow" + (isSorted ? "" : " unsorted"), children: isSorted ? sortDir === "asc" ? "\u2191" : "\u2193" : "\u2195" })
                    ] }) : /* @__PURE__ */ jsx9("span", { children: col.label })
                  ] })
                },
                col.key
              );
            }),
            onDelete && /* @__PURE__ */ jsx9("th", { className: "cl-th-actions", children: "Delete" })
          ] }) }),
          /* @__PURE__ */ jsxs9("tbody", { children: [
            pageReceipts.map((r) => /* @__PURE__ */ jsxs9("tr", { className: "cl-tr", children: [
              visibleColDefs.map((col) => renderCell(col, r)),
              onDelete && /* @__PURE__ */ jsx9("td", { className: "cl-td-actions", children: /* @__PURE__ */ jsx9("button", { className: "cl-btn-unclaim", onClick: () => onDelete(r.id), title: "Delete", children: /* @__PURE__ */ jsx9("svg", { width: "12", height: "12", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx9("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) }) }) })
            ] }, r.id)),
            /* @__PURE__ */ jsxs9("tr", { className: "cl-tr", style: { borderTop: "1px solid var(--cl-border-2)", background: "var(--cl-surface)" }, children: [
              visibleColDefs.map((col) => /* @__PURE__ */ jsx9("td", { className: "cl-td", style: { color: "var(--cl-text-3)", fontWeight: 600 }, children: col.key === "merchant" ? /* @__PURE__ */ jsxs9("span", { style: { color: "var(--cl-text-4)", fontWeight: 400 }, children: [
                filteredReceipts.length,
                " receipt",
                filteredReceipts.length !== 1 ? "s" : ""
              ] }) : col.key === "total" ? fmtMoney(totals.total) : col.key === "subtotal" ? fmtMoney(totals.subtotal) : col.key === "tax" ? fmtMoney(totals.tax) : col.key === "tip" ? totals.tip ? fmtMoney(totals.tip) : "" : "" }, col.key)),
              onDelete && /* @__PURE__ */ jsx9("td", { className: "cl-td-actions" })
            ] })
          ] })
        ] }) }),
        hThumb.show && /* @__PURE__ */ jsxs9("div", { className: "cl-hscroll-bar", children: [
          /* @__PURE__ */ jsx9("button", { className: "cl-scroll-left-btn", onClick: scrollToLeft, title: "Scroll to start", children: "\u2039" }),
          /* @__PURE__ */ jsx9("div", { className: "cl-hscroll-track", ref: hScrollTrackRef, onMouseDown: onTrackClick, children: /* @__PURE__ */ jsx9(
            "div",
            {
              className: "cl-hscroll-thumb",
              style: { left: hThumb.left, width: hThumb.width },
              onMouseDown: onThumbMouseDown,
              onClick: (e) => e.stopPropagation()
            }
          ) })
        ] })
      ] }) : /* @__PURE__ */ jsxs9("div", { className: "cl-empty", children: [
        /* @__PURE__ */ jsx9("div", { className: "cl-empty-icon", children: /* @__PURE__ */ jsx9("svg", { width: "28", height: "28", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, style: { color: "var(--cl-text-4)" }, children: /* @__PURE__ */ jsx9("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z" }) }) }),
        /* @__PURE__ */ jsx9("p", { className: "cl-empty-title", children: receipts.length === 0 ? "No receipts yet" : "No receipts match the filters" }),
        /* @__PURE__ */ jsx9("p", { className: "cl-empty-sub", children: receipts.length === 0 ? "Upload a receipt above to get started." : "Try adjusting your search or filters." })
      ] }),
      totalPages > 1 && /* @__PURE__ */ jsxs9("div", { className: "cl-pagination", children: [
        /* @__PURE__ */ jsxs9("button", { className: "cl-page-btn", onClick: () => setPage((p) => p - 1), disabled: page === 0, children: [
          /* @__PURE__ */ jsx9("svg", { width: "12", height: "12", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ jsx9("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 19l-7-7 7-7" }) }),
          "Prev"
        ] }),
        /* @__PURE__ */ jsxs9("span", { className: "cl-page-info", children: [
          "Page ",
          page + 1,
          " of ",
          totalPages
        ] }),
        /* @__PURE__ */ jsxs9("button", { className: "cl-page-btn", onClick: () => setPage((p) => p + 1), disabled: page >= totalPages - 1, children: [
          "Next",
          /* @__PURE__ */ jsx9("svg", { width: "12", height: "12", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ jsx9("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 5l7 7-7 7" }) })
        ] })
      ] })
    ] })
  ] });
}

// hooks/useClientListMock.ts
import { useState as useState9, useCallback as useCallback7 } from "react";
function useClientListMock(_collectionId, options = {}) {
  const {
    initialClients = [],
    initialViews = [],
    initialTitle,
    initialPermissions = DEFAULT_PERMISSIONS,
    loading: initialLoading = false,
    hasMore: initialHasMore = false
  } = options;
  const [clients, setClients] = useState9(initialClients);
  const [views, setViews] = useState9(initialViews);
  const [listTitle, setListTitle] = useState9(initialTitle ?? _collectionId);
  const [permissions, setPermissions] = useState9(initialPermissions);
  const [loading] = useState9(initialLoading);
  const [hasMore] = useState9(initialHasMore);
  const onSave = useCallback7(async (id, field, value, updaterName, fromValue) => {
    const changeEntry = {
      at: { seconds: Math.floor(Date.now() / 1e3) },
      by: updaterName,
      field,
      from: String(fromValue ?? ""),
      to: String(value)
    };
    setClients(
      (prev) => prev.map(
        (c) => c.id === id ? {
          ...c,
          [field]: value,
          updatedByName: updaterName,
          updatedAt: changeEntry.at,
          changeLog: [...c.changeLog ?? [], changeEntry]
        } : c
      )
    );
  }, []);
  const onSaveView = useCallback7(async (view) => {
    const id = `mock-view-${Date.now()}`;
    setViews((prev) => [...prev, { id, ...view }]);
    return id;
  }, []);
  const onDeleteView = useCallback7(async (id) => {
    setViews((prev) => prev.filter((v) => v.id !== id));
  }, []);
  const onRenameList = useCallback7(async (name) => {
    setListTitle(name);
  }, []);
  const onSavePermissions = useCallback7(async (matrix) => {
    setPermissions(matrix);
  }, []);
  const onLoadMore = useCallback7(async () => {
  }, []);
  return {
    data: clients,
    views,
    permissions,
    loading,
    hasMore,
    listTitle,
    onSave,
    onSaveView,
    onDeleteView,
    onSavePermissions,
    onRenameList,
    onLoadMore
  };
}

// hooks/useReceiptListMock.ts
import { useState as useState10, useCallback as useCallback8 } from "react";
function uid2() {
  return Math.random().toString(36).slice(2, 10);
}
function useReceiptListMock(options = {}) {
  const [receipts, setReceipts] = useState10(
    options.initialReceipts ?? []
  );
  const onSave = useCallback8(
    async (record) => {
      const full = {
        ...record,
        id: uid2(),
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      setReceipts((prev) => [full, ...prev]);
    },
    []
  );
  const onDelete = useCallback8(async (id) => {
    setReceipts((prev) => prev.filter((r) => r.id !== id));
  }, []);
  return { receipts, onSave, onDelete };
}

// hooks/useReceiptList.ts
import { useEffect as useEffect7, useState as useState11, useCallback as useCallback9 } from "react";
import { getApps as getApps2, initializeApp as initializeApp2 } from "firebase/app";
import {
  getFirestore as getFirestore3,
  collection as collection5,
  doc as doc5,
  query as query3,
  where as where2,
  orderBy as orderBy3,
  onSnapshot as onSnapshot4,
  addDoc as addDoc4,
  deleteDoc as deleteDoc3,
  serverTimestamp as serverTimestamp4
} from "firebase/firestore";
import {
  getStorage as getStorage2,
  ref as ref2,
  deleteObject
} from "firebase/storage";
var _app;
var _db;
var _storage;
function getDB3() {
  if (!_db) {
    _app = getApps2().length === 0 ? initializeApp2(firebaseConfig) : getApps2()[0];
    _db = getFirestore3(_app);
  }
  return _db;
}
function getStorageInstance() {
  if (!_storage) {
    _app = getApps2().length === 0 ? initializeApp2(firebaseConfig) : getApps2()[0];
    _storage = getStorage2(_app);
  }
  return _storage;
}
var RECEIPTS_COLLECTION = "receipts";
function useReceiptList(uid3) {
  const firestore = getDB3();
  const [receipts, setReceipts] = useState11([]);
  const [loading, setLoading] = useState11(true);
  useEffect7(() => {
    if (!uid3) {
      setReceipts([]);
      setLoading(false);
      return;
    }
    const q = query3(
      collection5(firestore, RECEIPTS_COLLECTION),
      where2("uid", "==", uid3),
      orderBy3("createdAt", "desc")
    );
    const unsub = onSnapshot4(
      q,
      (snap) => {
        const records = snap.docs.map((d) => {
          const data = d.data();
          return {
            ...data,
            id: d.id,
            createdAt: typeof data.createdAt?.toDate === "function" ? data.createdAt.toDate().toISOString() : String(data.createdAt ?? "")
          };
        });
        setReceipts(records);
        setLoading(false);
      },
      (err) => {
        console.error("[useReceiptList] onSnapshot error:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [uid3, firestore]);
  const onSave = useCallback9(
    async (record) => {
      await addDoc4(collection5(firestore, RECEIPTS_COLLECTION), {
        ...record,
        uid: uid3,
        createdAt: serverTimestamp4()
      });
    },
    [uid3, firestore]
  );
  const onDelete = useCallback9(
    async (id) => {
      const receipt = receipts.find((r) => r.id === id);
      await deleteDoc3(doc5(firestore, RECEIPTS_COLLECTION, id));
      if (receipt?.filePath) {
        try {
          const storageRef2 = ref2(getStorageInstance(), receipt.filePath);
          await deleteObject(storageRef2);
        } catch (err) {
          console.warn("[useReceiptList] Storage delete failed:", err);
        }
      }
    },
    [firestore, receipts]
  );
  return { receipts, loading, onSave, onDelete };
}
export {
  ChatApp,
  DEFAULT_PERMISSIONS,
  LeaderboardApp,
  OdsCard,
  OdsList,
  OdsPanel,
  OdsStatCard,
  ReceiptList,
  ReceiptScanner,
  SimpleDataTable,
  buildDefaultPermissions,
  useClientList,
  useClientListMock,
  useReceiptList,
  useReceiptListMock
};
//# sourceMappingURL=index.js.map