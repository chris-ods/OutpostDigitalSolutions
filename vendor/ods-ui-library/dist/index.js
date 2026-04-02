// UserClaimDisplay.tsx
import { jsx, jsxs } from "react/jsx-runtime";

// ClientList.tsx
import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback
} from "react";

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
styleInject('.cl-root {\n  --cl-bg: #030712;\n  --cl-surface: #111827;\n  --cl-surface-2: #1f2937;\n  --cl-border: #1f2937;\n  --cl-border-2: #374151;\n  --cl-text: #f9fafb;\n  --cl-text-2: #d1d5db;\n  --cl-text-3: #9ca3af;\n  --cl-text-4: #6b7280;\n  --cl-text-5: #4b5563;\n  --cl-accent: #3b82f6;\n  --cl-accent-dark: #1d4ed8;\n  --cl-indigo: #6366f1;\n  --cl-green: #22c55e;\n  --cl-amber: #f59e0b;\n  --cl-red: #ef4444;\n  --cl-purple: #a855f7;\n  --cl-yellow: #facc15;\n  font-family:\n    ui-sans-serif,\n    system-ui,\n    -apple-system,\n    sans-serif;\n  font-size: 13px;\n  background: var(--cl-bg);\n  color: var(--cl-text);\n  flex: 1;\n  min-height: 0;\n  display: flex;\n  flex-direction: column;\n  overflow: hidden;\n}\n.cl-header {\n  background: color-mix(in srgb, var(--cl-surface) 70%, transparent);\n  border-bottom: 1px solid var(--cl-border);\n  padding: 20px 24px;\n}\n.cl-header-row {\n  display: flex;\n  align-items: flex-start;\n  justify-content: space-between;\n  gap: 16px;\n  flex-wrap: wrap;\n}\n.cl-header-left {\n  display: flex;\n  align-items: center;\n  gap: 16px;\n}\n.cl-header-accent {\n  width: 4px;\n  height: 36px;\n  border-radius: 9999px;\n  background: var(--cl-accent);\n}\n.cl-title {\n  font-size: 22px;\n  font-weight: 700;\n  line-height: 1;\n  color: var(--cl-text);\n}\n.cl-subtitle {\n  font-size: 11px;\n  color: var(--cl-text-4);\n  margin-top: 6px;\n}\n.cl-header-right {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n}\n.cl-search-area {\n  padding: 20px 24px 12px;\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n}\n.cl-search-wrap {\n  position: relative;\n}\n.cl-search-icon {\n  position: absolute;\n  left: 14px;\n  top: 50%;\n  transform: translateY(-50%);\n  width: 16px;\n  height: 16px;\n  color: var(--cl-text-4);\n  pointer-events: none;\n}\n.cl-search-input {\n  width: 100%;\n  padding: 10px 36px 10px 40px;\n  background: var(--cl-surface);\n  border: 1px solid var(--cl-border-2);\n  border-radius: 10px;\n  color: var(--cl-text);\n  font-size: 13px;\n  outline: none;\n  transition: border-color 0.15s, box-shadow 0.15s;\n  box-sizing: border-box;\n}\n.cl-search-input:focus {\n  border-color: var(--cl-accent);\n  box-shadow: 0 0 0 2px color-mix(in srgb, var(--cl-accent) 25%, transparent);\n}\n.cl-search-input::placeholder {\n  color: var(--cl-text-4);\n}\n.cl-search-clear {\n  position: absolute;\n  right: 12px;\n  top: 50%;\n  transform: translateY(-50%);\n  background: none;\n  border: none;\n  color: var(--cl-text-4);\n  cursor: pointer;\n  padding: 2px;\n}\n.cl-search-clear:hover {\n  color: var(--cl-text);\n}\n.cl-pills {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  flex-wrap: wrap;\n}\n.cl-pill-divider {\n  width: 1px;\n  height: 16px;\n  background: var(--cl-border-2);\n  margin: 0 4px;\n}\n.cl-pill {\n  padding: 4px 12px;\n  border-radius: 9999px;\n  font-size: 11px;\n  font-weight: 500;\n  border: 1px solid var(--cl-border-2);\n  background: var(--cl-surface-2);\n  color: var(--cl-text-3);\n  cursor: pointer;\n  transition: all 0.15s;\n  white-space: nowrap;\n}\n.cl-pill:hover {\n  color: var(--cl-text);\n  border-color: var(--cl-text-4);\n}\n.cl-pill.active {\n  background: var(--cl-accent);\n  border-color: color-mix(in srgb, var(--cl-accent) 80%, white);\n  color: white;\n}\n.cl-clear-btn {\n  margin-left: auto;\n  font-size: 11px;\n  color: var(--cl-text-4);\n  background: none;\n  border: none;\n  cursor: pointer;\n  display: flex;\n  align-items: center;\n  gap: 4px;\n}\n.cl-clear-btn:hover {\n  color: var(--cl-text);\n}\n.cl-toolbar-row {\n  display: flex;\n  align-items: center;\n  border-bottom: 1px solid var(--cl-border);\n  background: color-mix(in srgb, var(--cl-surface) 60%, transparent);\n  position: relative;\n  z-index: 200;\n}\n.cl-toolbar {\n  flex: 1;\n  min-width: 0;\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  padding: 7px 24px;\n  overflow-x: auto;\n  overflow-y: visible;\n}\n.cl-action-bar {\n  display: flex;\n  align-items: center;\n  gap: 1px;\n  flex-shrink: 0;\n  padding: 0 12px;\n}\n.cl-action-wrap {\n  position: relative;\n}\n.cl-action-btn {\n  background: none;\n  border: none;\n  border-radius: 6px;\n  color: var(--cl-text-4);\n  cursor: pointer;\n  padding: 5px 6px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  transition: background 0.15s, color 0.15s;\n}\n.cl-action-btn:hover:not(:disabled) {\n  background: var(--cl-surface-2);\n  color: var(--cl-text-2);\n}\n.cl-action-btn.active {\n  color: var(--cl-accent);\n  background: color-mix(in srgb, var(--cl-accent) 12%, transparent);\n}\n.cl-action-btn:disabled {\n  opacity: 0.35;\n  cursor: not-allowed;\n}\n.cl-action-wrap .cl-export-menu {\n  right: 0;\n  top: calc(100% + 4px);\n}\n.cl-day-seg {\n  display: flex;\n  align-items: center;\n  background: var(--cl-surface-2);\n  border: 1px solid var(--cl-border-2);\n  border-radius: 6px;\n  padding: 2px;\n  gap: 1px;\n  flex-shrink: 0;\n}\n.cl-day-btn {\n  background: none;\n  border: none;\n  border-radius: 4px;\n  color: var(--cl-text-4);\n  font-size: 10px;\n  font-weight: 600;\n  cursor: pointer;\n  padding: 3px 6px;\n  line-height: 1;\n  transition: background 0.1s, color 0.1s;\n  white-space: nowrap;\n}\n.cl-day-btn:hover {\n  background: var(--cl-border-2);\n  color: var(--cl-text-2);\n}\n.cl-day-btn.active {\n  background: var(--cl-accent);\n  color: #fff;\n}\n.cl-day-week-btn {\n  font-size: 10px;\n  padding: 3px 8px;\n}\n.cl-day-sep {\n  width: 1px;\n  height: 14px;\n  background: var(--cl-border-2);\n  margin: 0 2px;\n  flex-shrink: 0;\n}\n.cl-toolbar-seg {\n  display: flex;\n  align-items: center;\n  background: var(--cl-surface-2);\n  border: 1px solid var(--cl-border-2);\n  border-radius: 8px;\n  padding: 2px;\n  gap: 1px;\n  flex-shrink: 0;\n}\n.cl-toolbar-view-item {\n  display: flex;\n  align-items: center;\n}\n.cl-seg-btn {\n  padding: 3px 10px;\n  border-radius: 6px;\n  font-size: 11px;\n  font-weight: 500;\n  border: none;\n  background: none;\n  color: var(--cl-text-4);\n  cursor: pointer;\n  white-space: nowrap;\n  transition: background 0.1s, color 0.1s;\n}\n.cl-seg-btn:hover {\n  background: var(--cl-border-2);\n  color: var(--cl-text-2);\n}\n.cl-seg-btn.active {\n  background: var(--cl-surface);\n  color: var(--cl-text);\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);\n}\n.cl-seg-delete {\n  display: flex;\n  align-items: center;\n  padding: 2px 4px 2px 0;\n  background: none;\n  border: none;\n  color: var(--cl-text-5);\n  cursor: pointer;\n  opacity: 0;\n  transition: opacity 0.15s, color 0.15s;\n}\n.cl-toolbar-view-item:hover .cl-seg-delete {\n  opacity: 1;\n}\n.cl-seg-delete:hover {\n  color: var(--cl-red);\n}\n.cl-seg-add {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n  padding: 3px 10px;\n  border-radius: 6px;\n  font-size: 11px;\n  font-weight: 500;\n  border: 1px dashed var(--cl-border-2);\n  background: none;\n  color: var(--cl-text-4);\n  cursor: pointer;\n  white-space: nowrap;\n  transition: color 0.1s, border-color 0.1s;\n  flex-shrink: 0;\n}\n.cl-seg-add:hover {\n  color: var(--cl-text-2);\n  border-color: var(--cl-text-4);\n}\n.cl-toolbar-save-wrap {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  flex-shrink: 0;\n}\n.cl-toolbar-save-input {\n  padding: 3px 8px;\n  background: var(--cl-surface-2);\n  border: 1px solid var(--cl-border-2);\n  border-radius: 6px;\n  color: var(--cl-text);\n  font-size: 11px;\n  outline: none;\n  width: 120px;\n}\n.cl-toolbar-save-input:focus {\n  border-color: var(--cl-indigo);\n}\n.cl-toolbar-save-input::placeholder {\n  color: var(--cl-text-4);\n}\n.cl-toolbar-save-confirm {\n  padding: 3px 8px;\n  background: var(--cl-indigo);\n  border: none;\n  border-radius: 6px;\n  color: white;\n  font-size: 11px;\n  font-weight: 500;\n  cursor: pointer;\n}\n.cl-toolbar-save-confirm:hover:not(:disabled) {\n  background: color-mix(in srgb, var(--cl-indigo) 80%, white);\n}\n.cl-toolbar-save-confirm:disabled {\n  opacity: 0.5;\n  cursor: default;\n}\n.cl-toolbar-save-cancel {\n  padding: 3px 8px;\n  background: none;\n  border: none;\n  color: var(--cl-text-4);\n  font-size: 11px;\n  cursor: pointer;\n}\n.cl-toolbar-save-cancel:hover {\n  color: var(--cl-text);\n}\n.cl-title-editable {\n  cursor: pointer;\n}\n.cl-title-editable:hover {\n  color: var(--cl-accent);\n}\n.cl-rename-input {\n  font-size: 22px;\n  font-weight: 700;\n  line-height: 1;\n  background: none;\n  border: none;\n  border-bottom: 2px solid var(--cl-accent);\n  color: var(--cl-text);\n  outline: none;\n  width: 260px;\n  padding: 0 2px;\n}\n.cl-table-area {\n  flex: 1;\n  min-height: 0;\n  display: flex;\n  flex-direction: column;\n  padding: 0 24px 24px;\n}\n.cl-table-wrap {\n  flex: 1;\n  min-height: 0;\n  display: flex;\n  flex-direction: column;\n  background: var(--cl-surface);\n  border: 1px solid var(--cl-border);\n  border-radius: 12px;\n}\n.cl-table-scroll {\n  flex: 1;\n  min-height: 0;\n  overflow-x: auto;\n  overflow-y: auto;\n  border-radius: 12px 12px 0 0;\n}\n.cl-table-scroll::-webkit-scrollbar {\n  display: none;\n}\n.cl-hscroll-bar {\n  display: flex;\n  align-items: center;\n  flex-shrink: 0;\n}\n.cl-scroll-left-btn {\n  flex-shrink: 0;\n  width: 28px;\n  height: 12px;\n  background: var(--cl-surface-2);\n  border: none;\n  border-radius: 0 0 0 12px;\n  color: var(--cl-text-3);\n  cursor: pointer;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-size: 16px;\n  padding: 0;\n  line-height: 1;\n}\n.cl-scroll-left-btn:hover {\n  background: var(--cl-border-2);\n  color: var(--cl-text);\n}\n.cl-hscroll-track {\n  flex: 1;\n  height: 12px;\n  background: var(--cl-surface-2);\n  border-radius: 0 0 12px 0;\n  position: relative;\n  cursor: pointer;\n  user-select: none;\n}\n.cl-hscroll-thumb {\n  position: absolute;\n  top: 2px;\n  height: 8px;\n  background: var(--cl-border-2);\n  border-radius: 4px;\n  cursor: grab;\n  transition: background 0.15s;\n}\n.cl-hscroll-thumb:hover {\n  background: var(--cl-text-4);\n}\n.cl-hscroll-thumb:active {\n  cursor: grabbing;\n  background: var(--cl-text-4);\n}\n.cl-table {\n  min-width: 100%;\n  width: max-content;\n  font-size: 11px;\n  white-space: nowrap;\n  border-collapse: collapse;\n}\n.cl-thead {\n  position: sticky;\n  top: 0;\n  z-index: 10;\n  background: var(--cl-surface);\n  border-bottom: 1px solid var(--cl-border);\n}\n.cl-th {\n  padding: 10px 12px;\n  text-align: left;\n  font-size: 11px;\n  color: var(--cl-text-3);\n  font-weight: 500;\n  white-space: nowrap;\n  transition: border-left 0.1s;\n}\n.cl-th.meta {\n  color: var(--cl-text-5);\n}\n.cl-th.drag-over {\n  border-left: 2px solid var(--cl-accent);\n  padding-left: 10px;\n}\n.cl-th.dragging {\n  opacity: 0.4;\n}\n.cl-th-inner {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n}\n.cl-th-inner:hover .cl-drag-grip {\n  opacity: 1;\n}\n.cl-drag-grip {\n  cursor: grab;\n  color: var(--cl-text-5);\n  opacity: 0;\n  transition: opacity 0.15s;\n  flex-shrink: 0;\n  display: flex;\n  align-items: center;\n}\n.cl-drag-grip:active {\n  cursor: grabbing;\n}\n.cl-drag-grip:hover {\n  color: var(--cl-text-3);\n}\n.cl-sort-btn {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n  background: none;\n  border: none;\n  color: inherit;\n  font-size: inherit;\n  font-weight: inherit;\n  cursor: pointer;\n  padding: 0;\n}\n.cl-sort-btn:hover {\n  color: var(--cl-text);\n}\n.cl-sort-btn.sorted {\n  color: var(--cl-text);\n}\n.cl-sort-arrow {\n  font-size: 9px;\n  color: var(--cl-accent);\n}\n.cl-sort-arrow.unsorted {\n  color: var(--cl-text-5);\n}\n.cl-filter-btn {\n  padding: 2px;\n  border-radius: 4px;\n  background: none;\n  border: none;\n  cursor: pointer;\n  transition: color 0.15s;\n  opacity: 0;\n  display: flex;\n}\n.cl-th-inner:hover .cl-filter-btn {\n  opacity: 1;\n}\n.cl-filter-btn.filtered {\n  color: var(--cl-accent);\n  opacity: 1 !important;\n}\n.cl-filter-btn:not(.filtered) {\n  color: var(--cl-text-5);\n}\n.cl-filter-btn:not(.filtered):hover {\n  color: var(--cl-text-3);\n}\n.cl-filter-count {\n  font-size: 9px;\n  background: var(--cl-accent);\n  color: white;\n  border-radius: 9999px;\n  width: 14px;\n  height: 14px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-weight: 700;\n  line-height: 1;\n  flex-shrink: 0;\n}\n.cl-th-actions {\n  position: sticky;\n  right: 0;\n  background: var(--cl-surface);\n  border-left: 1px solid color-mix(in srgb, var(--cl-border) 60%, transparent);\n  padding: 10px 12px;\n  color: var(--cl-text-3);\n  font-weight: 500;\n  font-size: 11px;\n}\n.cl-tr {\n  border-bottom: 1px solid color-mix(in srgb, var(--cl-border) 50%, transparent);\n  transition: background 0.1s;\n}\n.cl-tr:last-child {\n  border-bottom: 0;\n}\n.cl-tr:hover {\n  background: color-mix(in srgb, var(--cl-surface-2) 20%, transparent);\n}\n.cl-tr.pending {\n  background: color-mix(in srgb, #451a03 5%, transparent);\n}\n.cl-tr-section {\n  border-bottom: 1px solid;\n}\n.cl-tr-section.pending-section {\n  background: color-mix(in srgb, #451a03 20%, transparent);\n  border-color: color-mix(in srgb, #78350f 30%, transparent);\n}\n.cl-tr-section.claimed-section {\n  background: color-mix(in srgb, #052e16 20%, transparent);\n  border-color: color-mix(in srgb, #14532d 30%, transparent);\n}\n.cl-tr-section td {\n  padding: 6px 12px;\n}\n.cl-section-label {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n}\n.cl-section-dot {\n  width: 8px;\n  height: 8px;\n  border-radius: 9999px;\n  flex-shrink: 0;\n}\n.cl-section-dot.pulse {\n  animation: pulse 1.5s infinite;\n}\n.cl-section-title {\n  font-size: 9px;\n  font-weight: 700;\n  text-transform: uppercase;\n  letter-spacing: 0.15em;\n}\n.cl-section-count {\n  font-size: 9px;\n  color: var(--cl-text-5);\n}\n@keyframes pulse {\n  0%, 100% {\n    opacity: 1;\n  }\n  50% {\n    opacity: 0.4;\n  }\n}\n.cl-td {\n  padding: 8px 12px;\n  font-size: 11px;\n  color: var(--cl-text-2);\n}\n.cl-td.text-primary {\n  color: var(--cl-text);\n  font-weight: 500;\n}\n.cl-td.mono {\n  font-family: ui-monospace, monospace;\n}\n.cl-td.meta {\n  color: var(--cl-text-5);\n}\n.cl-td.narrow {\n  width: 24px;\n}\n.cl-td-actions {\n  position: sticky;\n  right: 0;\n  background: #030712;\n  border-left: 1px solid color-mix(in srgb, var(--cl-border) 60%, transparent);\n  padding: 8px 12px;\n}\n.cl-cell-edit {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n  cursor: pointer;\n}\n.cl-cell-edit:hover .cl-pencil {\n  opacity: 1;\n}\n.cl-pencil {\n  opacity: 0;\n  transition: opacity 0.15s;\n  flex-shrink: 0;\n  color: var(--cl-text-5);\n}\n.cl-cell-edit-wrap {\n  display: flex;\n  flex-direction: column;\n  gap: 5px;\n}\n.cl-cell-input {\n  background: var(--cl-surface-2);\n  border: 1px solid var(--cl-accent);\n  border-radius: 5px;\n  color: var(--cl-text);\n  font-size: 12px;\n  padding: 5px 8px;\n  outline: none;\n  min-width: 150px;\n  width: 100%;\n  box-sizing: border-box;\n  box-shadow: 0 0 0 2px color-mix(in srgb, var(--cl-accent) 20%, transparent);\n}\n.cl-cell-actions {\n  display: flex;\n  gap: 5px;\n}\n.cl-cell-cancel-btn,\n.cl-cell-confirm-btn {\n  width: 18px;\n  height: 18px;\n  border-radius: 50%;\n  border: none;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  cursor: pointer;\n  flex-shrink: 0;\n  transition: opacity 0.1s;\n}\n.cl-cell-cancel-btn {\n  background: var(--cl-red);\n  color: white;\n}\n.cl-cell-confirm-btn {\n  background: var(--cl-green);\n  color: white;\n}\n.cl-cell-cancel-btn:hover,\n.cl-cell-confirm-btn:hover {\n  opacity: 0.85;\n}\n.cl-cell-select {\n  background: var(--cl-surface-2);\n  border: 1px solid var(--cl-accent);\n  border-radius: 4px;\n  color: var(--cl-text);\n  font-size: 11px;\n  padding: 2px 4px;\n  outline: none;\n  width: 100%;\n}\n.cl-inline-select-wrap {\n  display: inline-flex;\n  align-items: center;\n}\n.cl-cell-select-plain {\n  background: transparent;\n  border: none;\n  color: var(--cl-text-2);\n  font: inherit;\n  font-size: 11px;\n  cursor: pointer;\n  outline: none;\n  -webkit-appearance: auto;\n  appearance: auto;\n  padding: 0;\n  max-width: 120px;\n}\n.cl-cell-select-plain:hover {\n  color: var(--cl-text);\n}\n.cl-badge-select {\n  font: inherit;\n  cursor: pointer;\n  outline: none;\n  border: none;\n  -webkit-appearance: auto;\n  appearance: auto;\n}\n.cl-badge {\n  display: inline-flex;\n  align-items: center;\n  padding: 2px 6px;\n  border-radius: 4px;\n  border: 1px solid;\n  font-size: 9px;\n  font-weight: 500;\n}\n.cl-badge.approved {\n  background: color-mix(in srgb, #14532d 40%, transparent);\n  color: #4ade80;\n  border-color: color-mix(in srgb, #15803d 50%, transparent);\n}\n.cl-badge.declined {\n  background: color-mix(in srgb, #450a0a 40%, transparent);\n  color: #f87171;\n  border-color: color-mix(in srgb, #b91c1c 50%, transparent);\n}\n.cl-badge.sent-uw {\n  background: color-mix(in srgb, #1e3a5f 40%, transparent);\n  color: #60a5fa;\n  border-color: color-mix(in srgb, #1d4ed8 50%, transparent);\n}\n.cl-badge.pending {\n  background: color-mix(in srgb, #422006 40%, transparent);\n  color: #fbbf24;\n  border-color: color-mix(in srgb, #b45309 50%, transparent);\n}\n.cl-badge.cancelled {\n  background: var(--cl-surface-2);\n  color: var(--cl-text-4);\n  border-color: var(--cl-border-2);\n}\n.cl-badge.split {\n  background: color-mix(in srgb, #3b0764 50%, transparent);\n  color: #c4b5fd;\n  border-color: color-mix(in srgb, #7e22ce 50%, transparent);\n}\n.cl-badge.alp {\n  background: color-mix(in srgb, #422006 50%, transparent);\n  color: #fcd34d;\n  border-color: color-mix(in srgb, #b45309 50%, transparent);\n}\n.cl-badge.special {\n  background: color-mix(in srgb, #422006 50%, transparent);\n  color: #fcd34d;\n  border-color: color-mix(in srgb, #b45309 50%, transparent);\n}\n.cl-badge.unclaimed {\n  color: var(--cl-amber);\n}\n.cl-badge.claimed {\n  color: var(--cl-green);\n}\n.cl-note-text {\n  color: var(--cl-yellow);\n  max-width: 140px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  display: block;\n}\n.cl-note-add {\n  color: var(--cl-text-5);\n  font-style: italic;\n}\n.cl-no-agent {\n  color: var(--cl-text-5);\n  font-style: italic;\n}\n.cl-dup-warn {\n  color: #f87171;\n  font-weight: 600;\n}\n.cl-premium {\n  font-weight: 600;\n}\n.cl-spinner {\n  width: 12px;\n  height: 12px;\n  border: 2px solid var(--cl-border-2);\n  border-top-color: var(--cl-accent);\n  border-radius: 50%;\n  animation: cl-spin 0.7s linear infinite;\n  flex-shrink: 0;\n}\n@keyframes cl-spin {\n  to {\n    transform: rotate(360deg);\n  }\n}\n.cl-btn-claim {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n  padding: 4px 8px;\n  background: #15803d;\n  border: none;\n  border-radius: 4px;\n  color: white;\n  font-size: 9px;\n  font-weight: 700;\n  cursor: pointer;\n  transition: background 0.15s;\n  white-space: nowrap;\n}\n.cl-btn-claim:hover:not(:disabled) {\n  background: #16a34a;\n}\n.cl-btn-claim:disabled {\n  background: var(--cl-surface-2);\n  cursor: not-allowed;\n}\n.cl-btn-unclaim {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n  padding: 4px 8px;\n  background: var(--cl-surface-2);\n  border: 1px solid var(--cl-border-2);\n  border-radius: 4px;\n  color: var(--cl-text-3);\n  font-size: 9px;\n  cursor: pointer;\n  transition: all 0.15s;\n  white-space: nowrap;\n}\n.cl-btn-unclaim:hover:not(:disabled) {\n  background: color-mix(in srgb, #450a0a 50%, transparent);\n  border-color: color-mix(in srgb, #b91c1c 60%, transparent);\n  color: #fca5a5;\n}\n.cl-btn-unclaim:disabled {\n  cursor: not-allowed;\n}\n.cl-export-wrap {\n  position: relative;\n}\n.cl-export-btn {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  padding: 8px 16px;\n  background: var(--cl-surface-2);\n  border: 1px solid var(--cl-border-2);\n  border-radius: 8px;\n  color: var(--cl-text-2);\n  font-size: 13px;\n  font-weight: 500;\n  cursor: pointer;\n  transition: background 0.15s;\n}\n.cl-export-btn:hover:not(:disabled) {\n  background: var(--cl-border-2);\n}\n.cl-export-btn:disabled {\n  opacity: 0.4;\n  cursor: not-allowed;\n}\n.cl-export-menu {\n  position: absolute;\n  right: 0;\n  top: calc(100% + 6px);\n  z-index: 50;\n  background: var(--cl-surface);\n  border: 1px solid var(--cl-border-2);\n  border-radius: 12px;\n  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);\n  width: 240px;\n  overflow: hidden;\n}\n.cl-export-menu-header {\n  padding: 12px 16px;\n  border-bottom: 1px solid var(--cl-border);\n}\n.cl-export-menu-title {\n  font-size: 12px;\n  font-weight: 600;\n  color: var(--cl-text-2);\n}\n.cl-export-menu-sub {\n  font-size: 11px;\n  color: var(--cl-text-4);\n  margin-top: 2px;\n}\n.cl-export-menu-body {\n  padding: 12px 16px;\n}\n.cl-export-dl-btn {\n  width: 100%;\n  padding: 8px;\n  background: var(--cl-accent);\n  border: none;\n  border-radius: 8px;\n  color: white;\n  font-size: 13px;\n  font-weight: 600;\n  cursor: pointer;\n  transition: background 0.15s;\n}\n.cl-export-dl-btn:hover {\n  background: var(--cl-accent-dark);\n}\n.cl-day-week-pick {\n  display: inline-flex;\n  align-items: center;\n  gap: 3px;\n}\n.cl-week-dropdown {\n  position: absolute;\n  left: 0;\n  top: calc(100% + 4px);\n  z-index: 200;\n  background: var(--cl-surface);\n  border: 1px solid var(--cl-border-2);\n  border-radius: 12px;\n  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);\n  width: 232px;\n  overflow: hidden;\n}\n.cl-wcal {\n  padding: 10px 10px 0;\n}\n.cl-wcal-nav {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  margin-bottom: 8px;\n}\n.cl-wcal-month {\n  font-size: 11px;\n  font-weight: 600;\n  color: var(--cl-text-2);\n}\n.cl-wcal-nav-btn {\n  background: none;\n  border: none;\n  cursor: pointer;\n  color: var(--cl-text-4);\n  font-size: 14px;\n  line-height: 1;\n  padding: 2px 6px;\n  border-radius: 4px;\n  transition: background 0.1s, color 0.1s;\n}\n.cl-wcal-nav-btn:hover {\n  background: var(--cl-border-2);\n  color: var(--cl-text-1);\n}\n.cl-wcal-grid {\n  display: grid;\n  grid-template-columns: repeat(7, 1fr);\n  gap: 1px;\n  margin-bottom: 8px;\n}\n.cl-wcal-hdr {\n  font-size: 9px;\n  font-weight: 600;\n  color: var(--cl-text-5);\n  text-align: center;\n  padding-bottom: 3px;\n  text-transform: uppercase;\n}\n.cl-wcal-day {\n  background: none;\n  border: none;\n  cursor: pointer;\n  font-size: 10px;\n  color: var(--cl-text-4);\n  padding: 4px 2px;\n  border-radius: 4px;\n  text-align: center;\n  line-height: 1;\n  transition: background 0.1s, color 0.1s;\n  position: relative;\n}\n.cl-wcal-day:hover {\n  background: var(--cl-border-2);\n  color: var(--cl-text-1);\n}\n.cl-wcal-day.out {\n  color: var(--cl-text-6, #444);\n}\n.cl-wcal-day.today {\n  font-weight: 700;\n  color: var(--cl-accent);\n}\n.cl-wcal-day.has-data::after {\n  content: "";\n  position: absolute;\n  bottom: 2px;\n  left: 50%;\n  transform: translateX(-50%);\n  width: 3px;\n  height: 3px;\n  border-radius: 50%;\n  background: var(--cl-accent);\n  opacity: 0.5;\n}\n.cl-wcal-day.sel {\n  background: var(--cl-accent);\n  color: #fff;\n}\n.cl-wcal-day.sel.today {\n  background: var(--cl-accent);\n}\n.cl-export-btn.active {\n  background: var(--cl-border-2);\n}\n.cl-col-picker-menu {\n  width: 220px;\n}\n.cl-col-picker-body {\n  padding: 8px;\n  max-height: 320px;\n  overflow-y: auto;\n}\n.cl-col-picker-row {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  padding: 6px 8px;\n  border-radius: 6px;\n  cursor: pointer;\n  font-size: 13px;\n  color: var(--cl-text-2);\n  user-select: none;\n}\n.cl-col-picker-row:hover {\n  background: var(--cl-surface-2);\n}\n.cl-col-picker-row input[type=checkbox] {\n  accent-color: var(--cl-accent);\n  width: 14px;\n  height: 14px;\n  flex-shrink: 0;\n  cursor: pointer;\n}\n.cl-col-picker-reset {\n  background: none;\n  border: 1px solid var(--cl-border-2);\n  border-radius: 6px;\n  color: var(--cl-text-3);\n  font-size: 11px;\n  font-weight: 500;\n  padding: 3px 8px;\n  cursor: pointer;\n}\n.cl-col-picker-reset:hover {\n  background: var(--cl-surface-2);\n  color: var(--cl-text-2);\n}\n.cl-active-filters {\n  padding: 0 24px 16px;\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  flex-wrap: wrap;\n}\n.cl-active-filters-label {\n  font-size: 11px;\n  color: var(--cl-text-4);\n}\n.cl-filter-chip {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n  padding: 2px 8px;\n  background: color-mix(in srgb, #1e3a5f 80%, transparent);\n  border: 1px solid color-mix(in srgb, #1d4ed8 50%, transparent);\n  border-radius: 9999px;\n  font-size: 11px;\n  color: #93c5fd;\n  white-space: nowrap;\n}\n.cl-filter-chip-remove {\n  background: none;\n  border: none;\n  color: inherit;\n  cursor: pointer;\n  padding: 0;\n  line-height: 1;\n  margin-left: 2px;\n}\n.cl-filter-chip-remove:hover {\n  color: white;\n}\n.cl-filter-clear-all {\n  font-size: 11px;\n  color: var(--cl-text-4);\n  background: none;\n  border: none;\n  cursor: pointer;\n}\n.cl-filter-clear-all:hover {\n  color: var(--cl-red);\n}\n.cl-perm-btn {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  padding: 7px 12px;\n  background: var(--cl-surface-2);\n  border: 1px solid var(--cl-border-2);\n  border-radius: 8px;\n  color: var(--cl-text-3);\n  font-size: 12px;\n  font-weight: 500;\n  cursor: pointer;\n  transition: all 0.15s;\n  white-space: nowrap;\n}\n.cl-perm-btn:hover {\n  color: var(--cl-text);\n  border-color: var(--cl-text-4);\n}\n.cl-perm-btn.active {\n  background: color-mix(in srgb, var(--cl-indigo) 15%, transparent);\n  border-color: color-mix(in srgb, var(--cl-indigo) 60%, transparent);\n  color: var(--cl-indigo);\n}\n.cl-perm {\n  margin: 0 0 0 0;\n  border-bottom: 1px solid var(--cl-border);\n  background: var(--cl-surface);\n}\n.cl-perm-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 12px 24px;\n  border-bottom: 1px solid var(--cl-border);\n  background: color-mix(in srgb, var(--cl-surface-2) 50%, transparent);\n}\n.cl-perm-title {\n  font-size: 13px;\n  font-weight: 600;\n  color: var(--cl-text);\n  margin-right: 8px;\n}\n.cl-perm-subtitle {\n  font-size: 11px;\n  color: var(--cl-text-4);\n}\n.cl-perm-save {\n  padding: 6px 14px;\n  background: var(--cl-indigo);\n  border: none;\n  border-radius: 6px;\n  color: white;\n  font-size: 12px;\n  font-weight: 600;\n  cursor: pointer;\n  transition: background 0.15s;\n}\n.cl-perm-save:hover:not(:disabled) {\n  background: color-mix(in srgb, var(--cl-indigo) 80%, white);\n}\n.cl-perm-save:disabled {\n  opacity: 0.5;\n  cursor: default;\n}\n.cl-perm-close {\n  padding: 4px;\n  background: none;\n  border: none;\n  color: var(--cl-text-4);\n  cursor: pointer;\n  border-radius: 4px;\n  display: flex;\n  align-items: center;\n  transition: color 0.15s;\n}\n.cl-perm-close:hover {\n  color: var(--cl-text);\n}\n.cl-perm-scroll {\n  overflow-x: auto;\n  max-height: 420px;\n  overflow-y: auto;\n}\n.cl-perm-table {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 12px;\n}\n.cl-perm-th {\n  padding: 8px 12px;\n  text-align: center;\n  font-size: 11px;\n  font-weight: 600;\n  color: var(--cl-text-3);\n  background: var(--cl-surface);\n  border-bottom: 1px solid var(--cl-border);\n  position: sticky;\n  top: 0;\n  z-index: 2;\n}\n.cl-perm-th.cl-perm-col-label {\n  text-align: left;\n  min-width: 140px;\n}\n.cl-perm-th.cl-perm-role-group {\n  border-left: 1px solid var(--cl-border-2);\n  color: var(--cl-text-2);\n  font-size: 12px;\n}\n.cl-perm-th.cl-perm-sub {\n  font-weight: 400;\n  color: var(--cl-text-4);\n  font-size: 10px;\n}\n.cl-perm-th.cl-perm-sub:nth-child(odd) {\n  border-left: 1px solid var(--cl-border-2);\n}\n.cl-perm-tr {\n  border-bottom: 1px solid color-mix(in srgb, var(--cl-border) 40%, transparent);\n}\n.cl-perm-tr:hover {\n  background: color-mix(in srgb, var(--cl-surface-2) 30%, transparent);\n}\n.cl-perm-td {\n  padding: 7px 12px;\n}\n.cl-perm-td.cl-perm-col-name {\n  font-size: 12px;\n  color: var(--cl-text-2);\n  display: flex;\n  align-items: center;\n  gap: 6px;\n}\n.cl-perm-td.cl-perm-cell {\n  text-align: center;\n  border-left: 1px solid color-mix(in srgb, var(--cl-border) 40%, transparent);\n}\n.cl-perm-td.cl-perm-cell:nth-child(odd) {\n  border-left: 1px solid var(--cl-border-2);\n}\n.cl-perm-check {\n  width: 15px;\n  height: 15px;\n  accent-color: var(--cl-indigo);\n  cursor: pointer;\n  border-radius: 3px;\n}\n.cl-perm-check:disabled {\n  opacity: 0.25;\n  cursor: default;\n}\n.cl-perm-tag {\n  font-size: 9px;\n  font-weight: 600;\n  text-transform: uppercase;\n  padding: 1px 5px;\n  border-radius: 4px;\n  letter-spacing: 0.05em;\n  background: color-mix(in srgb, var(--cl-surface-2) 80%, transparent);\n  border: 1px solid var(--cl-border-2);\n  color: var(--cl-text-5);\n}\n.cl-search-row {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n}\n.cl-search-row .cl-search-wrap {\n  flex: 1;\n}\n.cl-filter-toggle {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  flex-shrink: 0;\n  padding: 9px 14px;\n  background: var(--cl-surface-2);\n  border: 1px solid var(--cl-border-2);\n  border-radius: 10px;\n  color: var(--cl-text-3);\n  font-size: 13px;\n  font-weight: 500;\n  cursor: pointer;\n  transition: all 0.15s;\n  white-space: nowrap;\n}\n.cl-filter-toggle:hover {\n  color: var(--cl-text);\n  border-color: var(--cl-text-4);\n}\n.cl-filter-toggle.active {\n  background: color-mix(in srgb, var(--cl-accent) 15%, transparent);\n  border-color: color-mix(in srgb, var(--cl-accent) 60%, transparent);\n  color: var(--cl-accent);\n}\n.cl-filter-toggle-count {\n  background: var(--cl-accent);\n  color: white;\n  border-radius: 9999px;\n  padding: 0 5px;\n  font-size: 10px;\n  font-weight: 700;\n  line-height: 16px;\n}\n.cl-fb {\n  margin-top: 8px;\n  background: var(--cl-surface);\n  border: 1px solid var(--cl-border-2);\n  border-radius: 10px;\n  overflow: hidden;\n}\n.cl-fb-empty {\n  padding: 12px 20px;\n  font-size: 12px;\n  color: var(--cl-text-4);\n  margin: 0;\n}\n.cl-fb-row {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  padding: 8px 20px;\n  border-bottom: 1px solid color-mix(in srgb, var(--cl-border) 60%, transparent);\n}\n.cl-fb-row:last-of-type {\n  border-bottom: none;\n}\n.cl-fb-where {\n  font-size: 11px;\n  font-weight: 600;\n  color: var(--cl-text-4);\n  text-transform: uppercase;\n  letter-spacing: 0.08em;\n  flex-shrink: 0;\n  width: 36px;\n  margin-right: 8px;\n}\n.cl-fb-select {\n  padding: 4px 6px;\n  background: var(--cl-surface-2);\n  border: 1px solid var(--cl-border-2);\n  border-radius: 6px;\n  color: var(--cl-text);\n  font-size: 10px;\n  outline: none;\n  cursor: pointer;\n  transition: border-color 0.15s;\n}\n.cl-fb-select:focus {\n  border-color: var(--cl-accent);\n}\n.cl-fb-select-op {\n  min-width: 72px;\n}\n.cl-fb-select-val {\n  flex: 1;\n}\n.cl-fb-input {\n  padding: 4px 6px;\n  background: var(--cl-surface-2);\n  border: 1px solid var(--cl-border-2);\n  border-radius: 6px;\n  color: var(--cl-text);\n  font-size: 10px;\n  outline: none;\n  transition: border-color 0.15s;\n  min-width: 64px;\n}\n.cl-fb-input:focus {\n  border-color: var(--cl-accent);\n}\n.cl-fb-input::placeholder {\n  color: var(--cl-text-4);\n}\n.cl-fb-input-wide {\n  flex: 1;\n}\n.cl-fb-and {\n  font-size: 11px;\n  color: var(--cl-text-4);\n  flex-shrink: 0;\n}\n.cl-fb-remove {\n  flex-shrink: 0;\n  background: none;\n  border: none;\n  color: var(--cl-text-5);\n  cursor: pointer;\n  padding: 4px;\n  border-radius: 4px;\n  display: flex;\n  align-items: center;\n  transition: color 0.15s;\n}\n.cl-fb-remove:hover {\n  color: var(--cl-red);\n}\n.cl-fb-footer {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  padding: 8px 20px;\n  border-top: 1px solid color-mix(in srgb, var(--cl-border) 60%, transparent);\n  background: color-mix(in srgb, var(--cl-surface-2) 40%, transparent);\n}\n.cl-fb-add {\n  display: flex;\n  align-items: center;\n  gap: 5px;\n  background: none;\n  border: none;\n  color: var(--cl-accent);\n  font-size: 12px;\n  font-weight: 500;\n  cursor: pointer;\n  padding: 0;\n}\n.cl-fb-add:hover {\n  color: color-mix(in srgb, var(--cl-accent) 80%, white);\n}\n.cl-fb-clear {\n  background: none;\n  border: none;\n  color: var(--cl-text-4);\n  font-size: 12px;\n  cursor: pointer;\n  margin-left: auto;\n  padding: 0;\n}\n.cl-fb-clear:hover {\n  color: var(--cl-red);\n}\n.cl-empty {\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  text-align: center;\n  padding: 40px 0;\n}\n.cl-empty-icon {\n  width: 56px;\n  height: 56px;\n  border-radius: 9999px;\n  background: var(--cl-surface-2);\n  border: 1px solid var(--cl-border-2);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  margin: 0 auto 16px;\n}\n.cl-empty-title {\n  font-size: 18px;\n  font-weight: 600;\n  color: var(--cl-text);\n  margin-bottom: 4px;\n}\n.cl-empty-sub {\n  font-size: 13px;\n  color: var(--cl-text-4);\n}\n.cl-load-more {\n  display: flex;\n  justify-content: center;\n  padding-top: 16px;\n}\n.cl-load-more-btn {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  padding: 10px 24px;\n  background: var(--cl-surface-2);\n  border: 1px solid var(--cl-border-2);\n  border-radius: 12px;\n  color: var(--cl-text-2);\n  font-size: 13px;\n  font-weight: 500;\n  cursor: pointer;\n  transition: all 0.15s;\n}\n.cl-load-more-btn:hover:not(:disabled) {\n  background: var(--cl-border-2);\n  border-color: var(--cl-text-4);\n}\n.cl-load-more-btn:disabled {\n  opacity: 0.6;\n  cursor: not-allowed;\n}\n.cl-all-loaded {\n  text-align: center;\n  color: var(--cl-text-5);\n  font-size: 11px;\n  margin-top: 16px;\n}\n.cl-pagination {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  gap: 12px;\n  padding: 10px 0 12px;\n  flex-shrink: 0;\n}\n.cl-page-btn {\n  display: flex;\n  align-items: center;\n  gap: 5px;\n  padding: 6px 14px;\n  background: var(--cl-surface-2);\n  border: 1px solid var(--cl-border-2);\n  border-radius: 8px;\n  color: var(--cl-text-2);\n  font-size: 12px;\n  font-weight: 500;\n  cursor: pointer;\n  transition: all 0.15s;\n}\n.cl-page-btn:hover:not(:disabled) {\n  background: var(--cl-border-2);\n  border-color: var(--cl-text-4);\n  color: var(--cl-text);\n}\n.cl-page-btn:disabled {\n  opacity: 0.4;\n  cursor: not-allowed;\n}\n.cl-page-info {\n  font-size: 12px;\n  color: var(--cl-text-4);\n  min-width: 90px;\n  text-align: center;\n}\n.cl-meta-cell {\n  display: flex;\n  align-items: center;\n  gap: 5px;\n  position: relative;\n}\n.cl-info-btn {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 16px;\n  height: 16px;\n  border-radius: 50%;\n  background: none;\n  border: none;\n  padding: 0;\n  color: var(--cl-text-4);\n  cursor: pointer;\n  flex-shrink: 0;\n  opacity: 0;\n  transition: opacity 0.15s, color 0.15s;\n}\n.cl-meta-cell:hover .cl-info-btn,\n.cl-info-btn:focus-visible {\n  opacity: 1;\n}\n.cl-info-btn:hover {\n  color: var(--cl-accent);\n}\n.cl-info-popover {\n  position: absolute;\n  top: calc(100% + 6px);\n  left: 0;\n  z-index: 200;\n  min-width: 220px;\n  background: var(--cl-surface-2);\n  border: 1px solid var(--cl-border-2);\n  border-radius: 10px;\n  padding: 10px 12px;\n  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);\n  font-size: 11px;\n  white-space: nowrap;\n}\n.cl-info-popover--log {\n  min-width: 280px;\n  max-height: 320px;\n  overflow-y: auto;\n  white-space: normal;\n}\n.cl-info-popover-row {\n  display: flex;\n  align-items: baseline;\n  gap: 8px;\n  padding: 2px 0;\n  color: var(--cl-text-2);\n}\n.cl-info-label {\n  font-weight: 600;\n  color: var(--cl-text-3);\n  min-width: 60px;\n  flex-shrink: 0;\n}\n.cl-info-divider {\n  border: none;\n  border-top: 1px solid var(--cl-border-2);\n  margin: 8px 0 6px;\n}\n.cl-info-log-header {\n  font-size: 10px;\n  font-weight: 700;\n  letter-spacing: 0.06em;\n  text-transform: uppercase;\n  color: var(--cl-text-4);\n  margin-bottom: 6px;\n}\n.cl-info-log-entry {\n  padding: 5px 0;\n  border-bottom: 1px solid var(--cl-border);\n}\n.cl-info-log-entry:last-child {\n  border-bottom: none;\n}\n.cl-info-log-meta {\n  font-size: 10px;\n  color: var(--cl-text-4);\n  margin-bottom: 3px;\n}\n.cl-info-log-change {\n  display: flex;\n  align-items: center;\n  gap: 5px;\n  font-size: 11px;\n  flex-wrap: wrap;\n}\n.cl-info-field {\n  font-weight: 600;\n  color: var(--cl-text-3);\n  margin-right: 2px;\n}\n.cl-info-from {\n  color: var(--cl-red);\n  text-decoration: line-through;\n  opacity: 0.8;\n  max-width: 100px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n.cl-info-to {\n  color: var(--cl-green);\n  max-width: 100px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n.cl-info-log-empty {\n  font-size: 11px;\n  color: var(--cl-text-4);\n  font-style: italic;\n  padding: 4px 0;\n}\n.cl-loading {\n  flex: 1;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n.cl-loading-spinner {\n  width: 32px;\n  height: 32px;\n  border: 3px solid var(--cl-border-2);\n  border-top-color: var(--cl-accent);\n  border-radius: 50%;\n  animation: cl-spin 0.7s linear infinite;\n}\n');

// ClientList.tsx
import { Fragment, jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var CARRIERS = [
  "Americo",
  "AMAM",
  "Aetna",
  "CICA",
  "Chubb",
  "Corebridge",
  "Ethos",
  "MOO",
  "Trans",
  "Instabrain",
  "Other"
];
var AGENT_STATUSES = ["Sent UW", "Approved", "Declined", "Cancelled", "Pending"];
var ADMIN_STATUSES = [
  "Pending Client Payment",
  "Client Paid|Comp Paid",
  "Client Paid|Waiting on Comp",
  "Comp Paid|Client Not Paid",
  "UW or Requirements",
  "Decline - Rewrite",
  "Lapsed",
  "CXL"
];
var COLUMNS = [
  { key: "claimed", label: "", noFilter: true },
  { key: "date", label: "Date", sortable: true, filterType: "date" },
  { key: "clientName", label: "Client Name", sortable: true, filterType: "text" },
  { key: "phone", label: "Phone", filterType: "text" },
  { key: "email", label: "Email", filterType: "text" },
  { key: "agentName", label: "Agent", sortable: true, filterType: "text", adminOnly: true },
  { key: "contractorId", label: "Contractor ID", sortable: true, filterType: "text", adminOnly: true },
  { key: "agentTeamNumber", label: "Team", sortable: true, filterType: "enum", adminOnly: true },
  { key: "carrier", label: "Carrier", sortable: true, filterType: "enum" },
  { key: "appNumber", label: "App #", filterType: "text" },
  { key: "annualPremium", label: "Annual Premium", sortable: true, filterType: "number" },
  { key: "splitPercent", label: "Split %", sortable: true, filterType: "number" },
  { key: "state", label: "State", sortable: true, filterType: "enum" },
  { key: "startDate", label: "Start Date", sortable: true, filterType: "date" },
  { key: "agentStatus", label: "Agent Status", sortable: true, filterType: "enum" },
  { key: "adminStatus", label: "Admin Status", sortable: true, filterType: "enum" },
  { key: "notes", label: "Notes", filterType: "text" },
  { key: "clientPaidDate", label: "Client Paid", sortable: true, filterType: "date" },
  { key: "compDate", label: "Comp Date", sortable: true, filterType: "date" },
  { key: "createdAt", label: "Created", sortable: true, filterType: "date", meta: true },
  { key: "createdByName", label: "Created By", sortable: true, filterType: "enum", meta: true },
  { key: "updatedAt", label: "Updated", sortable: true, filterType: "date", meta: true },
  { key: "updatedByName", label: "Updated By", sortable: true, filterType: "enum", meta: true }
];
var DEFAULT_COL_ORDER = COLUMNS.map((c) => c.key);
var DEFAULT_VISIBLE_COLS = [
  "agentName",
  "date",
  "clientName",
  "phone",
  "email",
  "startDate",
  "state",
  "carrier",
  "appNumber",
  "annualPremium",
  "agentStatus",
  "adminStatus",
  "clientPaidDate",
  "compDate"
];
var DEFAULT_VIEW = {
  id: "default",
  name: "Default",
  colOrder: DEFAULT_VISIBLE_COLS,
  visibleCols: DEFAULT_VISIBLE_COLS,
  sortField: "date",
  sortDir: "desc",
  filterRows: [],
  builtIn: true
};
var EDITABLE_COLS = /* @__PURE__ */ new Set([
  "date",
  "clientName",
  "phone",
  "email",
  "carrier",
  "appNumber",
  "annualPremium",
  "splitPercent",
  "state",
  "startDate",
  "agentStatus",
  "adminStatus",
  "notes",
  "clientPaidDate",
  "compDate"
]);
var DEFAULT_PERMISSIONS = (() => {
  const make = (viewFn, editFn) => Object.fromEntries(COLUMNS.map((c) => [c.key, { view: viewFn(c), edit: editFn(c) }]));
  return {
    rep: {
      ...make(
        (c) => !c.adminOnly && !c.meta,
        // Reps can edit contact/status fields only — not dates, adminStatus, or any admin/meta cols
        (c) => !c.adminOnly && !c.meta && EDITABLE_COLS.has(c.key) && c.key !== "adminStatus" && c.key !== "date" && c.key !== "startDate"
      ),
      export: { view: false, edit: false },
      rename: { view: false, edit: false }
    },
    manager: {
      ...make((_c) => true, (c) => EDITABLE_COLS.has(c.key)),
      export: { view: false, edit: false },
      rename: { view: false, edit: false }
    },
    admin: {
      ...make((_c) => true, (c) => EDITABLE_COLS.has(c.key)),
      export: { view: false, edit: false },
      rename: { view: false, edit: false }
    }
  };
})();
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
function fmtCurrency(v) {
  return "$" + (v || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
}
function isPending(c) {
  return String(c.agentId ?? "").startsWith("pending:");
}
var AGENT_STATUS_CLASS = {
  Approved: "approved",
  Declined: "declined",
  "Sent UW": "sent-uw",
  Pending: "pending",
  Cancelled: "cancelled"
};
function getOperators(filterType) {
  switch (filterType) {
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
function filterRowsToSpecs(rows) {
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
function Spinner() {
  return /* @__PURE__ */ jsx2("span", { className: "cl-spinner", "aria-label": "Loading" });
}
function PencilIcon() {
  return /* @__PURE__ */ jsx2("svg", { className: "cl-pencil", width: "11", height: "11", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx2("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" }) });
}
function CellInput({
  type,
  initialValue,
  options,
  onSave,
  onCancel
}) {
  const [val, setVal] = useState(initialValue);
  if (type === "select" && options) {
    return /* @__PURE__ */ jsx2(
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
        children: options.map((o) => /* @__PURE__ */ jsx2("option", { value: o, children: o }, o))
      }
    );
  }
  return /* @__PURE__ */ jsxs2("div", { className: "cl-cell-edit-wrap", children: [
    /* @__PURE__ */ jsx2(
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
    /* @__PURE__ */ jsxs2("div", { className: "cl-cell-actions", children: [
      /* @__PURE__ */ jsx2("button", { className: "cl-cell-cancel-btn", onMouseDown: (e) => e.preventDefault(), onClick: onCancel, title: "Cancel (Esc)", children: /* @__PURE__ */ jsx2("svg", { width: "9", height: "9", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 3.5, children: /* @__PURE__ */ jsx2("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) }) }),
      /* @__PURE__ */ jsx2("button", { className: "cl-cell-confirm-btn", onMouseDown: (e) => e.preventDefault(), onClick: () => onSave(val), title: "Save (Enter)", children: /* @__PURE__ */ jsx2("svg", { width: "9", height: "9", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 3.5, children: /* @__PURE__ */ jsx2("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 13l4 4L19 7" }) }) })
    ] })
  ] });
}
var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function WeekCalendar({
  availableWeeks,
  dayFilter,
  onSelect
}) {
  const today = /* @__PURE__ */ new Date();
  today.setHours(12, 0, 0, 0);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const weekSet = useMemo(() => new Set(availableWeeks), [availableWeeks]);
  const gridDays = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1, 12);
    const off = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(1 - off);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [viewYear, viewMonth]);
  function getMon(d) {
    const copy = new Date(d);
    const off = (copy.getDay() + 6) % 7;
    copy.setDate(copy.getDate() - off);
    return `${copy.getFullYear()}-${String(copy.getMonth() + 1).padStart(2, "0")}-${String(copy.getDate()).padStart(2, "0")}`;
  }
  function fmt(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  const todayStr = fmt(today);
  const selWeekStart = dayFilter?.startsWith("week:") ? dayFilter.slice(5) : null;
  return /* @__PURE__ */ jsxs2("div", { className: "cl-wcal", children: [
    /* @__PURE__ */ jsxs2("div", { className: "cl-wcal-nav", children: [
      /* @__PURE__ */ jsx2("button", { className: "cl-wcal-nav-btn", onClick: () => {
        if (viewMonth === 0) {
          setViewYear((y) => y - 1);
          setViewMonth(11);
        } else setViewMonth((m) => m - 1);
      }, children: "\u2039" }),
      /* @__PURE__ */ jsxs2("span", { className: "cl-wcal-month", children: [
        MONTHS[viewMonth],
        " ",
        viewYear
      ] }),
      /* @__PURE__ */ jsx2("button", { className: "cl-wcal-nav-btn", onClick: () => {
        if (viewMonth === 11) {
          setViewYear((y) => y + 1);
          setViewMonth(0);
        } else setViewMonth((m) => m + 1);
      }, children: "\u203A" })
    ] }),
    /* @__PURE__ */ jsxs2("div", { className: "cl-wcal-grid", children: [
      ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => /* @__PURE__ */ jsx2("div", { className: "cl-wcal-hdr", children: d }, d)),
      gridDays.map((d, i) => {
        const ds = fmt(d);
        const monStr = getMon(d);
        const inMonth = d.getMonth() === viewMonth;
        const isToday = ds === todayStr;
        const hasData = weekSet.has(monStr);
        const val = `week:${monStr}`;
        const inSelWk = selWeekStart ? ds >= selWeekStart && ds <= (() => {
          const e = /* @__PURE__ */ new Date(selWeekStart + "T12:00:00");
          e.setDate(e.getDate() + 6);
          return fmt(e);
        })() : dayFilter === "week" && ds >= getMon(today) && ds <= (() => {
          const e = /* @__PURE__ */ new Date(getMon(today) + "T12:00:00");
          e.setDate(e.getDate() + 6);
          return fmt(e);
        })();
        return /* @__PURE__ */ jsx2(
          "button",
          {
            className: "cl-wcal-day" + (inSelWk ? " sel" : "") + (isToday ? " today" : "") + (!inMonth ? " out" : "") + (hasData ? " has-data" : ""),
            onClick: () => onSelect(monStr === getMon(today) ? "week" : val),
            children: d.getDate()
          },
          i
        );
      })
    ] })
  ] });
}
function ClientList({
  clients: clientsProp,
  uid,
  userName = "",
  isAdmin = false,
  isManager = false,
  showActions = false,
  loading = false,
  hasMore = false,
  onLoadMore,
  onSave,
  onClaim,
  onUnclaim,
  phase = "live",
  historicalCutoff = "2026-01-01",
  currentRole = "owner",
  permissions,
  onSavePermissions,
  listTitle = "Clients",
  onRenameList,
  views: viewsProp = [],
  onSaveView,
  onDeleteView,
  initialSortField = null,
  initialSortDir = "desc"
}) {
  const [clients, setClients] = useState(clientsProp);
  useEffect(() => {
    setClients(clientsProp);
  }, [clientsProp]);
  const [sortField, setSortField] = useState(DEFAULT_VIEW.sortField ?? initialSortField);
  const [sortDir, setSortDir] = useState(DEFAULT_VIEW.sortDir ?? initialSortDir);
  const [filterRows, setFilterRows] = useState(() => DEFAULT_VIEW.filterRows ?? []);
  const [showFilterBuilder, setShowFilterBuilder] = useState(false);
  const filters = useMemo(() => filterRowsToSpecs(filterRows), [filterRows]);
  const [searchText, setSearchText] = useState("");
  const [showHistorical, setShowHistorical] = useState(false);
  const [colOrder, setColOrder] = useState(() => DEFAULT_VIEW.colOrder ?? DEFAULT_COL_ORDER);
  const [colVisible, setColVisible] = useState(() => DEFAULT_VIEW.visibleCols ?? null);
  const [dragCol, setDragCol] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [activeViewId, setActiveViewId] = useState("default");
  const [showSaveView, setShowSaveView] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const [savingView, setSavingView] = useState(false);
  const allViews = useMemo(() => [DEFAULT_VIEW, ...viewsProp], [viewsProp]);
  const [localTitle, setLocalTitle] = useState(listTitle);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(listTitle);
  useEffect(() => {
    setLocalTitle(listTitle);
    setRenameValue(listTitle);
  }, [listTitle]);
  const [editCell, setEditCell] = useState(null);
  const [saving, setSaving] = useState({});
  const [infoPopover, setInfoPopover] = useState(null);
  const infoPopoverRef = useRef(null);
  const tableScrollRef = useRef(null);
  const hScrollTrackRef = useRef(null);
  const hDragData = useRef({ startX: 0, startScrollLeft: 0 });
  const [hThumb, setHThumb] = useState({ left: 0, width: 0, show: false });
  const PAGE_SIZE2 = 50;
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(/* @__PURE__ */ new Set());
  const [loadingMore, setLoadingMore] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const exportRef = useRef(null);
  const [showColPicker, setShowColPicker] = useState(false);
  const colPickerRef = useRef(null);
  const [dayFilter, setDayFilter] = useState(null);
  const [carrierFilter, setCarrierFilter] = useState(null);
  const [showWeekPicker, setShowWeekPicker] = useState(false);
  const weekPickerRef = useRef(null);
  const uniqueCarriers = useMemo(
    () => [...new Set(clients.map((c) => c.carrier).filter(Boolean))].sort(),
    [clients]
  );
  const availableWeeks = useMemo(() => {
    const getMonday = (dateStr) => {
      const d = /* @__PURE__ */ new Date(dateStr + "T12:00:00");
      const off = (d.getDay() + 6) % 7;
      d.setDate(d.getDate() - off);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    const weeks = [...new Set(clients.map((c) => c.date ? getMonday(c.date) : null).filter(Boolean))];
    return weeks.sort((a, b) => b.localeCompare(a)).slice(0, 7);
  }, [clients]);
  const weekDays = useMemo(() => {
    const d = /* @__PURE__ */ new Date();
    const off = (d.getDay() + 6) % 7;
    const mon = new Date(d);
    mon.setDate(d.getDate() - off);
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(mon);
      day.setDate(mon.getDate() + i);
      return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    });
  }, []);
  const [showPermissions, setShowPermissions] = useState(false);
  const [draftPermissions, setDraftPermissions] = useState(
    () => permissions ?? DEFAULT_PERMISSIONS
  );
  const [savingPerms, setSavingPerms] = useState(false);
  const [resolvedPermissions, setResolvedPermissions] = useState(
    () => permissions ?? DEFAULT_PERMISSIONS
  );
  useEffect(() => {
    const base = permissions ?? DEFAULT_PERMISSIONS;
    const merged = { rep: {}, manager: {}, admin: {} };
    ["rep", "manager", "admin"].forEach((role) => {
      merged[role] = { ...DEFAULT_PERMISSIONS[role], ...base[role] };
    });
    setResolvedPermissions(merged);
  }, [permissions]);
  const isPrivileged = currentRole === "owner" || currentRole === "dev" || currentRole === "admin";
  function canView(colKey) {
    if (isPrivileged) return true;
    const role = currentRole;
    return resolvedPermissions[role]?.[colKey]?.view ?? DEFAULT_PERMISSIONS[role]?.[colKey]?.view ?? false;
  }
  function canEdit(colKey) {
    if (isPrivileged) return true;
    const role = currentRole;
    return resolvedPermissions[role]?.[colKey]?.edit ?? DEFAULT_PERMISSIONS[role]?.[colKey]?.edit ?? false;
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
      if (!next[role][colKey]) next[role][colKey] = { view: true, edit: true };
      next[role][colKey][type] = !next[role][colKey][type];
      if (type === "view" && !next[role][colKey].view) next[role][colKey].edit = false;
      if (type === "edit" && next[role][colKey].edit) next[role][colKey].view = true;
      return next;
    });
  }
  const showSubmittedBy = isAdmin || isManager;
  const visibleColDefs = useMemo(() => {
    const merged = [...colOrder, ...DEFAULT_COL_ORDER.filter((k) => !colOrder.includes(k))];
    return merged.map((key) => COLUMNS.find((c) => c.key === key)).filter((c) => !!c).filter((c) => !c.adminOnly || showSubmittedBy).filter((c) => phase !== "live" || c.key !== "claimed").filter((c) => canView(c.key)).filter((c) => colVisible === null || colVisible.includes(c.key));
  }, [colOrder, colVisible, showSubmittedBy, phase, currentRole, resolvedPermissions]);
  const distinctValues = useMemo(() => {
    const map = {
      agentStatus: AGENT_STATUSES,
      carrier: CARRIERS,
      adminStatus: ADMIN_STATUSES,
      claimed: ["Claimed", "Unclaimed"]
    };
    ["state", "agentTeamNumber", "agentName", "createdByName", "updatedByName"].forEach((col) => {
      const vals = /* @__PURE__ */ new Set();
      clients.forEach((c) => {
        const v = String(c[col] ?? "");
        if (v) vals.add(v);
      });
      map[col] = Array.from(vals).sort((a, b) => {
        const na = Number(a), nb = Number(b);
        return !isNaN(na) && !isNaN(nb) ? na - nb : a.localeCompare(b);
      });
    });
    return map;
  }, [clients]);
  useEffect(() => {
    if (!showExport) return;
    const h = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) setShowExport(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showExport]);
  useEffect(() => {
    if (!showColPicker) return;
    const h = (e) => {
      if (colPickerRef.current && !colPickerRef.current.contains(e.target)) setShowColPicker(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showColPicker]);
  useEffect(() => {
    if (!showWeekPicker) return;
    const h = (e) => {
      if (weekPickerRef.current && !weekPickerRef.current.contains(e.target)) setShowWeekPicker(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showWeekPicker]);
  const pickableCols = useMemo(
    () => COLUMNS.filter((c) => c.key !== "claimed" && (!c.adminOnly || showSubmittedBy) && canView(c.key)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showSubmittedBy, currentRole, resolvedPermissions]
  );
  function togglePickerCol(key) {
    const allKeys = pickableCols.map((c) => c.key);
    const current = colVisible ?? allKeys;
    const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
    if (next.length === 0) return;
    setColVisible(next.length === allKeys.length ? null : next);
  }
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
  const displayedClients = useMemo(() => {
    let result = [...clients];
    if (!showHistorical) {
      result = result.filter((c) => c.historical !== true && (!c.date || c.date >= historicalCutoff));
    }
    const q = searchText.trim().toLowerCase();
    if (q) {
      result = result.filter((c) => [
        c.clientName,
        c.agentName,
        c.phone,
        c.email,
        c.appNumber,
        c.carrier,
        c.state,
        c.notes,
        c.annualPremium != null ? String(c.annualPremium) : "",
        c.adminStatus ?? "",
        c.contractorId ?? ""
      ].join(" ").toLowerCase().includes(q));
    }
    for (const [field, spec] of Object.entries(filters)) {
      if (spec.kind === "enum") {
        if (!spec.values.length) continue;
        if (field === "claimed") {
          const wantC = spec.values.includes("Claimed"), wantU = spec.values.includes("Unclaimed");
          if (wantC !== wantU) result = result.filter((c) => wantU ? isPending(c) : !isPending(c));
          continue;
        }
        result = result.filter((c) => spec.values.includes(String(c[field] ?? "")));
      } else if (spec.kind === "text") {
        if (!spec.q) continue;
        const sq = spec.q.toLowerCase();
        result = result.filter((c) => String(c[field] ?? "").toLowerCase().includes(sq));
      } else if (spec.kind === "range") {
        const { min, max } = spec;
        const DATE_FIELDS = /* @__PURE__ */ new Set(["date", "startDate", "clientPaidDate", "compDate", "createdAt", "updatedAt"]);
        const isDate = DATE_FIELDS.has(field);
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
    if (dayFilter) {
      if (dayFilter === "week") {
        result = result.filter((c) => c.date && c.date >= weekDays[0] && c.date <= weekDays[6]);
      } else if (dayFilter.startsWith("week:")) {
        const weekStart = dayFilter.slice(5);
        const d = /* @__PURE__ */ new Date(weekStart + "T12:00:00");
        d.setDate(d.getDate() + 6);
        const weekEnd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        result = result.filter((c) => c.date && c.date >= weekStart && c.date <= weekEnd);
      } else {
        result = result.filter((c) => c.date === dayFilter);
      }
    }
    if (carrierFilter) {
      result = result.filter((c) => c.carrier === carrierFilter);
    }
    if (sortField) {
      result.sort((a, b) => {
        const av = a[sortField] ?? "", bv = b[sortField] ?? "";
        if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
        if (av && bv && typeof av === "object" && "seconds" in av && typeof bv === "object" && "seconds" in bv)
          return sortDir === "asc" ? av.seconds - bv.seconds : bv.seconds - av.seconds;
        return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
    }
    return result;
  }, [clients, showHistorical, historicalCutoff, searchText, filters, sortField, sortDir, dayFilter, carrierFilter, weekDays]);
  useEffect(() => {
    setPage(0);
  }, [searchText, filterRows, sortField, sortDir, showHistorical, dayFilter, carrierFilter]);
  const totalPages = Math.max(1, Math.ceil(displayedClients.length / PAGE_SIZE2));
  const pagedClients = displayedClients.slice(page * PAGE_SIZE2, (page + 1) * PAGE_SIZE2);
  const pendingRows = pagedClients.filter(isPending);
  const claimedRows = pagedClients.filter((c) => !isPending(c));
  const totalColSpan = visibleColDefs.length + (showActions ? 1 : 0);
  const historicalCount = useMemo(
    () => clients.filter((c) => c.historical === true || c.date && c.date < historicalCutoff).length,
    [clients, historicalCutoff]
  );
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
    setSortField(view.sortField ?? null);
    setSortDir(view.sortDir ?? "desc");
    setFilterRows(view.filterRows ?? []);
    setActiveViewId(view.id);
    setShowFilterBuilder(false);
  }
  async function handleSaveView() {
    if (!newViewName.trim() || !onSaveView || savingView) return;
    setSavingView(true);
    try {
      const id = await onSaveView({
        name: newViewName.trim(),
        colOrder: [...colOrder],
        visibleCols: colVisible ?? void 0,
        sortField,
        sortDir,
        filterRows: [...filterRows]
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
    if (activeViewId === id) applyView(DEFAULT_VIEW);
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
        const col = COLUMNS.find((c) => c.key === patch.field);
        const ops = getOperators(col?.filterType);
        next.operator = ops[0];
        next.value = "";
        next.value2 = "";
      }
      return next;
    }));
  }
  function handleSort(field) {
    if (sortField === field) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else {
      setSortField(field);
      setSortDir("asc");
    }
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
    const saveVal = field === "annualPremium" || field === "agentTeamNumber" || field === "splitPercent" ? parseFloat(newValue) || 0 : newValue;
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
  async function handleSelectChange(client, field, newValue) {
    const orig = String(client[field] ?? "");
    if (newValue === orig) return;
    const changeEntry = {
      at: { seconds: Math.floor(Date.now() / 1e3) },
      by: userName,
      field,
      from: orig,
      to: newValue
    };
    setClients((prev) => prev.map((c) => {
      if (c.id !== client.id) return c;
      return { ...c, [field]: newValue, updatedByName: userName, updatedAt: changeEntry.at, changeLog: [...c.changeLog ?? [], changeEntry] };
    }));
    setSaving((prev) => ({ ...prev, [client.id]: field }));
    try {
      await onSave?.(client.id, field, newValue, userName, orig);
    } catch {
      setClients(clientsProp);
    } finally {
      setSaving((prev) => {
        const n = { ...prev };
        delete n[client.id];
        return n;
      });
    }
  }
  async function handleClaim(client) {
    if (!onClaim) return;
    setBusy((prev) => new Set(prev).add(client.id));
    try {
      await onClaim(client);
    } finally {
      setBusy((prev) => {
        const n = new Set(prev);
        n.delete(client.id);
        return n;
      });
    }
  }
  async function handleUnclaim(client) {
    if (!onUnclaim) return;
    setBusy((prev) => new Set(prev).add(client.id));
    try {
      await onUnclaim(client);
    } finally {
      setBusy((prev) => {
        const n = new Set(prev);
        n.delete(client.id);
        return n;
      });
    }
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
  const handleLoadMore = useCallback(async () => {
    if (!onLoadMore || loadingMore) return;
    setLoadingMore(true);
    try {
      await onLoadMore();
    } finally {
      setLoadingMore(false);
    }
  }, [onLoadMore, loadingMore]);
  function exportCSV() {
    const rows = [...pendingRows, ...claimedRows];
    if (!rows.length) return;
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const headers = [
      "Claimed",
      "Date",
      "Client Name",
      "Phone",
      "Email",
      "State",
      "Agent",
      "Team",
      "Carrier",
      "App #",
      "Annual Premium",
      "Split %",
      "Start Date",
      "Agent Status",
      "Admin Status",
      "Notes",
      "Client Paid",
      "Comp Date",
      "Created",
      "Created By",
      "Updated",
      "Updated By"
    ];
    const csvRows = rows.map((c) => [
      isPending(c) ? "Unclaimed" : "Claimed",
      c.date ?? "",
      c.clientName,
      fmtPhone(c.phone),
      c.email ?? "",
      c.state ?? "",
      c.agentName ?? "",
      c.agentTeamNumber != null ? String(c.agentTeamNumber) : "",
      c.carrier ?? "",
      c.appNumber ?? "",
      String(c.annualPremium ?? 0),
      c.splitPercent ? String(c.splitPercent) : "",
      c.startDate ?? "",
      c.agentStatus ?? "",
      c.adminStatus ?? "",
      c.notes ?? "",
      c.clientPaidDate ?? "",
      c.compDate ?? "",
      fmtTimestamp(c.createdAt),
      c.createdByName ?? "",
      fmtTimestamp(c.updatedAt),
      c.updatedByName ?? ""
    ].map(esc).join(","));
    const csv = [headers.map(esc).join(","), ...csvRows].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `clients-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv` });
    a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  }
  function renderCell(col, client) {
    const isEditing = editCell?.id === client.id && editCell?.field === col.key;
    const isSaving = saving[client.id] === col.key;
    const startE = (val) => startEdit(client.id, col.key, val);
    switch (col.key) {
      case "claimed":
        return /* @__PURE__ */ jsx2("td", { className: "cl-td narrow", children: isPending(client) ? /* @__PURE__ */ jsx2("span", { className: "cl-badge unclaimed", title: "Unclaimed", children: /* @__PURE__ */ jsx2("svg", { width: "8", height: "8", viewBox: "0 0 8 8", fill: "currentColor", children: /* @__PURE__ */ jsx2("circle", { cx: "4", cy: "4", r: "4" }) }) }) : /* @__PURE__ */ jsx2("svg", { width: "14", height: "14", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, style: { color: "var(--cl-green)" }, children: /* @__PURE__ */ jsx2("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) }) }, col.key);
      case "date":
        return /* @__PURE__ */ jsx2("td", { className: "cl-td", children: isEditing ? /* @__PURE__ */ jsx2(CellInput, { type: "date", initialValue: client.date ?? "", onSave: confirmEdit, onCancel: cancelEdit }) : /* @__PURE__ */ jsxs2("div", { className: "cl-cell-edit", onClick: () => startE(client.date ?? ""), children: [
          /* @__PURE__ */ jsx2("span", { children: fmtDate(client.date) }),
          isSaving ? /* @__PURE__ */ jsx2(Spinner, {}) : /* @__PURE__ */ jsx2(PencilIcon, {})
        ] }) }, col.key);
      case "clientName":
        return /* @__PURE__ */ jsx2("td", { className: "cl-td text-primary", children: isEditing ? /* @__PURE__ */ jsx2(CellInput, { type: "text", initialValue: client.clientName, onSave: confirmEdit, onCancel: cancelEdit }) : /* @__PURE__ */ jsxs2("div", { className: "cl-cell-edit", onClick: () => startE(client.clientName), children: [
          /* @__PURE__ */ jsx2("span", { children: client.clientName || "\u2014" }),
          isSaving ? /* @__PURE__ */ jsx2(Spinner, {}) : /* @__PURE__ */ jsx2(PencilIcon, {})
        ] }) }, col.key);
      case "phone":
        return /* @__PURE__ */ jsx2("td", { className: "cl-td mono", children: isEditing ? /* @__PURE__ */ jsx2(CellInput, { type: "text", initialValue: client.phone ?? "", onSave: confirmEdit, onCancel: cancelEdit }) : /* @__PURE__ */ jsxs2("div", { className: "cl-cell-edit", onClick: () => startE(client.phone ?? ""), children: [
          client.phoneSpecialCase ? /* @__PURE__ */ jsxs2("span", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
            /* @__PURE__ */ jsx2("span", { children: client.phone || "\u2014" }),
            /* @__PURE__ */ jsx2("span", { className: "cl-badge special", children: "Special" })
          ] }) : /* @__PURE__ */ jsx2("span", { children: fmtPhone(client.phone) }),
          isSaving ? /* @__PURE__ */ jsx2(Spinner, {}) : /* @__PURE__ */ jsx2(PencilIcon, {})
        ] }) }, col.key);
      case "email":
        return /* @__PURE__ */ jsx2("td", { className: "cl-td", children: isEditing ? /* @__PURE__ */ jsx2(CellInput, { type: "text", initialValue: client.email ?? "", onSave: confirmEdit, onCancel: cancelEdit }) : /* @__PURE__ */ jsxs2("div", { className: "cl-cell-edit", onClick: () => startE(client.email ?? ""), children: [
          /* @__PURE__ */ jsx2("span", { children: client.email || "\u2014" }),
          isSaving ? /* @__PURE__ */ jsx2(Spinner, {}) : /* @__PURE__ */ jsx2(PencilIcon, {})
        ] }) }, col.key);
      case "agentName":
        return /* @__PURE__ */ jsx2("td", { className: "cl-td", children: client.agentId === uid ? /* @__PURE__ */ jsx2("span", { style: { color: "var(--cl-text-4)", fontStyle: "italic" }, children: "You" }) : client.agentName || /* @__PURE__ */ jsx2("span", { className: "cl-no-agent", children: "no agent" }) }, col.key);
      case "contractorId":
        return /* @__PURE__ */ jsx2("td", { className: "cl-td mono", children: isEditing ? /* @__PURE__ */ jsx2(CellInput, { type: "text", initialValue: String(client.contractorId ?? ""), onSave: confirmEdit, onCancel: cancelEdit }) : /* @__PURE__ */ jsxs2("div", { className: "cl-cell-edit", onClick: () => startE(String(client.contractorId ?? "")), children: [
          /* @__PURE__ */ jsx2("span", { style: { color: "var(--cl-text-3)" }, children: String(client.contractorId || "\u2014") }),
          isSaving ? /* @__PURE__ */ jsx2(Spinner, {}) : /* @__PURE__ */ jsx2(PencilIcon, {})
        ] }) }, col.key);
      case "agentTeamNumber":
        return /* @__PURE__ */ jsx2("td", { className: "cl-td", children: isEditing ? /* @__PURE__ */ jsx2(CellInput, { type: "number", initialValue: String(client.agentTeamNumber ?? ""), onSave: confirmEdit, onCancel: cancelEdit }) : /* @__PURE__ */ jsxs2("div", { className: "cl-cell-edit", onClick: () => startE(String(client.agentTeamNumber ?? "")), children: [
          /* @__PURE__ */ jsx2("span", { children: client.agentTeamNumber ? `Team ${client.agentTeamNumber}` : "\u2014" }),
          isSaving ? /* @__PURE__ */ jsx2(Spinner, {}) : /* @__PURE__ */ jsx2(PencilIcon, {})
        ] }) }, col.key);
      case "carrier":
        return /* @__PURE__ */ jsx2("td", { className: "cl-td", children: canEdit("carrier") ? /* @__PURE__ */ jsx2("div", { className: "cl-inline-select-wrap", children: isSaving ? /* @__PURE__ */ jsx2(Spinner, {}) : /* @__PURE__ */ jsx2("select", { className: "cl-cell-select-plain", value: client.carrier ?? "", onChange: (e) => handleSelectChange(client, "carrier", e.target.value), children: CARRIERS.map((o) => /* @__PURE__ */ jsx2("option", { value: o, children: o }, o)) }) }) : /* @__PURE__ */ jsx2("span", { children: client.carrier || "\u2014" }) }, col.key);
      case "appNumber":
        return /* @__PURE__ */ jsx2("td", { className: "cl-td", children: isEditing ? /* @__PURE__ */ jsx2(CellInput, { type: "text", initialValue: client.appNumber ?? "", onSave: confirmEdit, onCancel: cancelEdit }) : /* @__PURE__ */ jsxs2("div", { className: "cl-cell-edit", onClick: () => startE(client.appNumber ?? ""), children: [
          /* @__PURE__ */ jsx2("span", { children: client.appNumber || "\u2014" }),
          isSaving ? /* @__PURE__ */ jsx2(Spinner, {}) : /* @__PURE__ */ jsx2(PencilIcon, {})
        ] }) }, col.key);
      case "annualPremium":
        return /* @__PURE__ */ jsx2("td", { className: "cl-td", children: isEditing ? /* @__PURE__ */ jsx2(CellInput, { type: "number", initialValue: String(client.annualPremium ?? ""), onSave: confirmEdit, onCancel: cancelEdit }) : /* @__PURE__ */ jsxs2("div", { className: "cl-cell-edit", onClick: () => startE(String(client.annualPremium ?? "")), children: [
          /* @__PURE__ */ jsx2("span", { className: "cl-premium", children: client.annualPremium ? fmtCurrency(client.annualPremium) : "\u2014" }),
          !!client.splitPercent && /* @__PURE__ */ jsx2("span", { className: "cl-badge split", title: `Split ${client.splitPercent}%`, children: "Split" }),
          (client.annualPremium ?? 0) > 0 && (client.annualPremium ?? 0) < 600 && /* @__PURE__ */ jsx2("span", { className: "cl-badge alp", title: "< $600 ALP \u2014 team gets 50% credit", children: "\xBD ALP" }),
          isSaving ? /* @__PURE__ */ jsx2(Spinner, {}) : /* @__PURE__ */ jsx2(PencilIcon, {})
        ] }) }, col.key);
      case "splitPercent":
        return /* @__PURE__ */ jsx2("td", { className: "cl-td", children: isEditing ? /* @__PURE__ */ jsx2(CellInput, { type: "number", initialValue: String(client.splitPercent ?? "0"), onSave: confirmEdit, onCancel: cancelEdit }) : /* @__PURE__ */ jsxs2("div", { className: "cl-cell-edit", onClick: () => startE(String(client.splitPercent ?? "0")), children: [
          /* @__PURE__ */ jsx2("span", { children: client.splitPercent ? `${client.splitPercent}%` : "\u2014" }),
          isSaving ? /* @__PURE__ */ jsx2(Spinner, {}) : /* @__PURE__ */ jsx2(PencilIcon, {})
        ] }) }, col.key);
      case "state":
        return /* @__PURE__ */ jsx2("td", { className: "cl-td", children: isEditing ? /* @__PURE__ */ jsx2(CellInput, { type: "text", initialValue: client.state ?? "", onSave: confirmEdit, onCancel: cancelEdit }) : /* @__PURE__ */ jsxs2("div", { className: "cl-cell-edit", onClick: () => startE(client.state ?? ""), children: [
          /* @__PURE__ */ jsx2("span", { children: client.state || "\u2014" }),
          isSaving ? /* @__PURE__ */ jsx2(Spinner, {}) : /* @__PURE__ */ jsx2(PencilIcon, {})
        ] }) }, col.key);
      case "startDate":
        return /* @__PURE__ */ jsx2("td", { className: "cl-td", children: isEditing ? /* @__PURE__ */ jsx2(CellInput, { type: "date", initialValue: client.startDate ?? "", onSave: confirmEdit, onCancel: cancelEdit }) : /* @__PURE__ */ jsxs2("div", { className: "cl-cell-edit", onClick: () => startE(client.startDate ?? ""), children: [
          /* @__PURE__ */ jsx2("span", { children: fmtDate(client.startDate) }),
          isSaving ? /* @__PURE__ */ jsx2(Spinner, {}) : /* @__PURE__ */ jsx2(PencilIcon, {})
        ] }) }, col.key);
      case "clientPaidDate":
        return /* @__PURE__ */ jsx2("td", { className: "cl-td", children: isEditing ? /* @__PURE__ */ jsx2(CellInput, { type: "date", initialValue: client.clientPaidDate ?? "", onSave: confirmEdit, onCancel: cancelEdit }) : /* @__PURE__ */ jsxs2("div", { className: "cl-cell-edit", onClick: () => startE(client.clientPaidDate ?? ""), children: [
          /* @__PURE__ */ jsx2("span", { children: fmtDate(client.clientPaidDate) }),
          isSaving ? /* @__PURE__ */ jsx2(Spinner, {}) : /* @__PURE__ */ jsx2(PencilIcon, {})
        ] }) }, col.key);
      case "compDate":
        return /* @__PURE__ */ jsx2("td", { className: "cl-td", children: isEditing ? /* @__PURE__ */ jsx2(CellInput, { type: "date", initialValue: client.compDate ?? "", onSave: confirmEdit, onCancel: cancelEdit }) : /* @__PURE__ */ jsxs2("div", { className: "cl-cell-edit", onClick: () => startE(client.compDate ?? ""), children: [
          /* @__PURE__ */ jsx2("span", { children: fmtDate(client.compDate) }),
          isSaving ? /* @__PURE__ */ jsx2(Spinner, {}) : /* @__PURE__ */ jsx2(PencilIcon, {})
        ] }) }, col.key);
      case "agentStatus":
        return /* @__PURE__ */ jsx2("td", { className: "cl-td", children: canEdit("agentStatus") ? isSaving ? /* @__PURE__ */ jsx2(Spinner, {}) : /* @__PURE__ */ jsx2(
          "select",
          {
            className: `cl-badge cl-badge-select ${AGENT_STATUS_CLASS[client.agentStatus ?? ""] ?? ""}`,
            value: client.agentStatus ?? "",
            onChange: (e) => handleSelectChange(client, "agentStatus", e.target.value),
            children: AGENT_STATUSES.map((o) => /* @__PURE__ */ jsx2("option", { value: o, children: o }, o))
          }
        ) : /* @__PURE__ */ jsx2("span", { className: `cl-badge ${AGENT_STATUS_CLASS[client.agentStatus ?? ""] ?? ""}`, children: client.agentStatus || "\u2014" }) }, col.key);
      case "adminStatus":
        return /* @__PURE__ */ jsx2("td", { className: "cl-td", children: canEdit("adminStatus") ? isSaving ? /* @__PURE__ */ jsx2(Spinner, {}) : /* @__PURE__ */ jsx2(
          "select",
          {
            className: "cl-cell-select-plain",
            value: client.adminStatus ?? "",
            onChange: (e) => handleSelectChange(client, "adminStatus", e.target.value),
            children: ADMIN_STATUSES.map((o) => /* @__PURE__ */ jsx2("option", { value: o, children: o }, o))
          }
        ) : /* @__PURE__ */ jsx2("span", { children: client.adminStatus || "\u2014" }) }, col.key);
      case "notes":
        return /* @__PURE__ */ jsx2("td", { className: "cl-td", style: { maxWidth: 160 }, children: isEditing ? /* @__PURE__ */ jsx2(CellInput, { type: "text", initialValue: client.notes ?? "", onSave: confirmEdit, onCancel: cancelEdit }) : /* @__PURE__ */ jsxs2("div", { className: "cl-cell-edit", onClick: () => startE(client.notes ?? ""), children: [
          client.notes ? /* @__PURE__ */ jsx2("span", { className: "cl-note-text", title: client.notes, children: client.notes }) : /* @__PURE__ */ jsx2("span", { className: "cl-note-add", children: "+ add" }),
          isSaving ? /* @__PURE__ */ jsx2(Spinner, {}) : /* @__PURE__ */ jsx2(PencilIcon, {})
        ] }) }, col.key);
      case "createdAt": {
        const isOpen = infoPopover?.clientId === client.id && infoPopover.col === "createdAt";
        return /* @__PURE__ */ jsx2("td", { className: "cl-td meta", children: /* @__PURE__ */ jsxs2("div", { className: "cl-meta-cell", children: [
          /* @__PURE__ */ jsx2("span", { children: fmtTimestamp(client.createdAt) }),
          /* @__PURE__ */ jsx2(
            "button",
            {
              className: "cl-info-btn",
              title: "Created details",
              onClick: () => setInfoPopover(isOpen ? null : { clientId: client.id, col: "createdAt" }),
              children: /* @__PURE__ */ jsxs2("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.5, children: [
                /* @__PURE__ */ jsx2("circle", { cx: "12", cy: "12", r: "10" }),
                /* @__PURE__ */ jsx2("line", { x1: "12", y1: "8", x2: "12", y2: "8", strokeLinecap: "round", strokeWidth: 3 }),
                /* @__PURE__ */ jsx2("line", { x1: "12", y1: "12", x2: "12", y2: "16", strokeLinecap: "round" })
              ] })
            }
          ),
          isOpen && /* @__PURE__ */ jsxs2("div", { className: "cl-info-popover", ref: infoPopoverRef, children: [
            /* @__PURE__ */ jsxs2("div", { className: "cl-info-popover-row", children: [
              /* @__PURE__ */ jsx2("span", { className: "cl-info-label", children: "Created" }),
              /* @__PURE__ */ jsx2("span", { children: fmtTimestamp(client.createdAt) || "\u2014" })
            ] }),
            /* @__PURE__ */ jsxs2("div", { className: "cl-info-popover-row", children: [
              /* @__PURE__ */ jsx2("span", { className: "cl-info-label", children: "By" }),
              /* @__PURE__ */ jsx2("span", { children: client.createdByName || "\u2014" })
            ] })
          ] })
        ] }) }, col.key);
      }
      case "createdByName":
        return /* @__PURE__ */ jsx2("td", { className: "cl-td meta", children: client.createdByName || "\u2014" }, col.key);
      case "updatedAt": {
        const isOpen = infoPopover?.clientId === client.id && infoPopover.col === "updatedAt";
        const log = (client.changeLog ?? []).slice().sort((a, b) => b.at.seconds - a.at.seconds);
        return /* @__PURE__ */ jsx2("td", { className: "cl-td meta", children: /* @__PURE__ */ jsxs2("div", { className: "cl-meta-cell", children: [
          /* @__PURE__ */ jsx2("span", { children: fmtTimestamp(client.updatedAt) }),
          /* @__PURE__ */ jsx2(
            "button",
            {
              className: "cl-info-btn",
              title: "Change history",
              onClick: () => setInfoPopover(isOpen ? null : { clientId: client.id, col: "updatedAt" }),
              children: /* @__PURE__ */ jsxs2("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.5, children: [
                /* @__PURE__ */ jsx2("circle", { cx: "12", cy: "12", r: "10" }),
                /* @__PURE__ */ jsx2("line", { x1: "12", y1: "8", x2: "12", y2: "8", strokeLinecap: "round", strokeWidth: 3 }),
                /* @__PURE__ */ jsx2("line", { x1: "12", y1: "12", x2: "12", y2: "16", strokeLinecap: "round" })
              ] })
            }
          ),
          isOpen && /* @__PURE__ */ jsxs2("div", { className: "cl-info-popover cl-info-popover--log", ref: infoPopoverRef, children: [
            /* @__PURE__ */ jsxs2("div", { className: "cl-info-popover-row", children: [
              /* @__PURE__ */ jsx2("span", { className: "cl-info-label", children: "Last updated" }),
              /* @__PURE__ */ jsx2("span", { children: fmtTimestamp(client.updatedAt) || "\u2014" })
            ] }),
            /* @__PURE__ */ jsxs2("div", { className: "cl-info-popover-row", children: [
              /* @__PURE__ */ jsx2("span", { className: "cl-info-label", children: "By" }),
              /* @__PURE__ */ jsx2("span", { children: client.updatedByName || "\u2014" })
            ] }),
            log.length > 0 && /* @__PURE__ */ jsxs2(Fragment, { children: [
              /* @__PURE__ */ jsx2("div", { className: "cl-info-divider" }),
              /* @__PURE__ */ jsx2("div", { className: "cl-info-log-header", children: "Change history" }),
              log.map((entry, i) => /* @__PURE__ */ jsxs2("div", { className: "cl-info-log-entry", children: [
                /* @__PURE__ */ jsxs2("div", { className: "cl-info-log-meta", children: [
                  fmtTimestamp(entry.at),
                  " \xB7 ",
                  entry.by
                ] }),
                /* @__PURE__ */ jsxs2("div", { className: "cl-info-log-change", children: [
                  /* @__PURE__ */ jsx2("span", { className: "cl-info-field", children: entry.field }),
                  /* @__PURE__ */ jsx2("span", { className: "cl-info-from", children: entry.from || "\u2014" }),
                  /* @__PURE__ */ jsx2("svg", { width: "10", height: "10", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ jsx2("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 12h14M13 6l6 6-6 6" }) }),
                  /* @__PURE__ */ jsx2("span", { className: "cl-info-to", children: entry.to || "\u2014" })
                ] })
              ] }, i))
            ] }),
            log.length === 0 && /* @__PURE__ */ jsx2("div", { className: "cl-info-log-empty", children: "No changes recorded yet." })
          ] })
        ] }) }, col.key);
      }
      case "updatedByName":
        return /* @__PURE__ */ jsx2("td", { className: "cl-td meta", children: client.updatedByName || "\u2014" }, col.key);
      default:
        return /* @__PURE__ */ jsx2("td", { className: "cl-td", children: String(client[col.key] ?? "\u2014") }, col.key);
    }
  }
  function renderPermissionsEditor() {
    if (!showPermissions) return null;
    const configurableRoles = ["rep", "manager", "admin"];
    const editableColKeys = new Set(EDITABLE_COLS);
    const permCols = COLUMNS.filter((c) => c.key !== "claimed");
    return /* @__PURE__ */ jsxs2("div", { className: "cl-perm", children: [
      /* @__PURE__ */ jsxs2("div", { className: "cl-perm-header", children: [
        /* @__PURE__ */ jsxs2("div", { children: [
          /* @__PURE__ */ jsx2("span", { className: "cl-perm-title", children: "Column Permissions" }),
          /* @__PURE__ */ jsx2("span", { className: "cl-perm-subtitle", children: "Owner & Dev always have full access" })
        ] }),
        /* @__PURE__ */ jsxs2("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
          onSavePermissions && /* @__PURE__ */ jsx2("button", { className: "cl-perm-save", onClick: savePermissions, disabled: savingPerms, children: savingPerms ? "Saving\u2026" : "Save Changes" }),
          /* @__PURE__ */ jsx2("button", { className: "cl-perm-close", onClick: () => setShowPermissions(false), title: "Close", children: /* @__PURE__ */ jsx2("svg", { width: "14", height: "14", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ jsx2("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) }) })
        ] })
      ] }),
      /* @__PURE__ */ jsx2("div", { className: "cl-perm-scroll", children: /* @__PURE__ */ jsxs2("table", { className: "cl-perm-table", children: [
        /* @__PURE__ */ jsxs2("thead", { children: [
          /* @__PURE__ */ jsxs2("tr", { children: [
            /* @__PURE__ */ jsx2("th", { className: "cl-perm-th cl-perm-col-label" }),
            configurableRoles.map((role) => /* @__PURE__ */ jsx2("th", { className: "cl-perm-th cl-perm-role-group", colSpan: 2, children: role.charAt(0).toUpperCase() + role.slice(1) }, role))
          ] }),
          /* @__PURE__ */ jsxs2("tr", { children: [
            /* @__PURE__ */ jsx2("th", { className: "cl-perm-th cl-perm-col-label", children: "Column" }),
            configurableRoles.map((role) => /* @__PURE__ */ jsxs2(Fragment, { children: [
              /* @__PURE__ */ jsx2("th", { className: "cl-perm-th cl-perm-sub", children: "View" }, role + "-view"),
              /* @__PURE__ */ jsx2("th", { className: "cl-perm-th cl-perm-sub", children: "Edit" }, role + "-edit")
            ] }))
          ] })
        ] }),
        /* @__PURE__ */ jsxs2("tbody", { children: [
          [
            { key: "export", label: "Export" },
            { key: "rename", label: "Rename list" }
          ].map(({ key, label }) => /* @__PURE__ */ jsxs2("tr", { className: "cl-perm-tr cl-perm-tr-action", children: [
            /* @__PURE__ */ jsxs2("td", { className: "cl-perm-td cl-perm-col-name", children: [
              label,
              /* @__PURE__ */ jsx2("span", { className: "cl-perm-tag", children: "action" })
            ] }),
            configurableRoles.map((role) => {
              const allowed = draftPermissions[role][key]?.view ?? false;
              return /* @__PURE__ */ jsx2(React.Fragment, { children: /* @__PURE__ */ jsx2("td", { className: "cl-perm-td cl-perm-cell", colSpan: 2, children: /* @__PURE__ */ jsx2(
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
            const isEditableCol = editableColKeys.has(col.key);
            return /* @__PURE__ */ jsxs2("tr", { className: "cl-perm-tr", children: [
              /* @__PURE__ */ jsxs2("td", { className: "cl-perm-td cl-perm-col-name", children: [
                col.label || col.key,
                col.adminOnly && /* @__PURE__ */ jsx2("span", { className: "cl-perm-tag", children: "admin+" }),
                col.meta && /* @__PURE__ */ jsx2("span", { className: "cl-perm-tag", children: "meta" })
              ] }),
              configurableRoles.map((role) => {
                const perm = draftPermissions[role][col.key] ?? { view: true, edit: true };
                return /* @__PURE__ */ jsxs2(Fragment, { children: [
                  /* @__PURE__ */ jsx2("td", { className: "cl-perm-td cl-perm-cell", children: /* @__PURE__ */ jsx2(
                    "input",
                    {
                      type: "checkbox",
                      className: "cl-perm-check",
                      checked: perm.view,
                      onChange: () => toggleDraftPerm(role, col.key, "view")
                    }
                  ) }, role + "-view"),
                  /* @__PURE__ */ jsx2("td", { className: "cl-perm-td cl-perm-cell", children: /* @__PURE__ */ jsx2(
                    "input",
                    {
                      type: "checkbox",
                      className: "cl-perm-check",
                      checked: perm.edit,
                      disabled: !isEditableCol || !perm.view,
                      onChange: () => toggleDraftPerm(role, col.key, "edit")
                    }
                  ) }, role + "-edit")
                ] });
              })
            ] }, col.key);
          })
        ] })
      ] }) })
    ] });
  }
  function renderFilterBuilder() {
    if (!showFilterBuilder) return null;
    const filterableColumns = COLUMNS.filter(
      (c) => c.filterType && !c.noFilter && (!c.adminOnly || showSubmittedBy)
    );
    return /* @__PURE__ */ jsxs2("div", { className: "cl-fb", children: [
      filterRows.length === 0 ? /* @__PURE__ */ jsx2("p", { className: "cl-fb-empty", children: "No filters applied. Add one below." }) : filterRows.map((row) => {
        const col = COLUMNS.find((c) => c.key === row.field);
        const ft = col?.filterType ?? "text";
        const ops = getOperators(ft);
        const enumVals = row.field ? distinctValues[row.field] ?? [] : [];
        return /* @__PURE__ */ jsxs2("div", { className: "cl-fb-row", children: [
          /* @__PURE__ */ jsx2("span", { className: "cl-fb-where", children: "Where" }),
          /* @__PURE__ */ jsxs2(
            "select",
            {
              className: "cl-fb-select",
              value: row.field,
              onChange: (e) => updateFilterRow(row.id, { field: e.target.value }),
              children: [
                /* @__PURE__ */ jsx2("option", { value: "", children: "Select field\u2026" }),
                filterableColumns.map((c) => /* @__PURE__ */ jsx2("option", { value: c.key, children: c.label }, c.key))
              ]
            }
          ),
          /* @__PURE__ */ jsx2(
            "select",
            {
              className: "cl-fb-select cl-fb-select-op",
              value: row.operator,
              onChange: (e) => updateFilterRow(row.id, { operator: e.target.value }),
              children: ops.map((op) => /* @__PURE__ */ jsx2("option", { value: op, children: op }, op))
            }
          ),
          ft === "enum" ? /* @__PURE__ */ jsxs2(
            "select",
            {
              className: "cl-fb-select cl-fb-select-val",
              value: row.value,
              onChange: (e) => updateFilterRow(row.id, { value: e.target.value }),
              children: [
                /* @__PURE__ */ jsx2("option", { value: "", children: "Select\u2026" }),
                enumVals.map((v) => /* @__PURE__ */ jsx2("option", { value: v, children: v }, v))
              ]
            }
          ) : row.operator === "between" ? /* @__PURE__ */ jsxs2(Fragment, { children: [
            /* @__PURE__ */ jsx2(
              "input",
              {
                className: "cl-fb-input",
                type: ft === "date" ? "date" : "number",
                placeholder: "From",
                value: row.value,
                onChange: (e) => updateFilterRow(row.id, { value: e.target.value })
              }
            ),
            /* @__PURE__ */ jsx2("span", { className: "cl-fb-and", children: "and" }),
            /* @__PURE__ */ jsx2(
              "input",
              {
                className: "cl-fb-input",
                type: ft === "date" ? "date" : "number",
                placeholder: "To",
                value: row.value2,
                onChange: (e) => updateFilterRow(row.id, { value2: e.target.value })
              }
            )
          ] }) : /* @__PURE__ */ jsx2(
            "input",
            {
              className: "cl-fb-input cl-fb-input-wide",
              type: ft === "date" ? "date" : ft === "number" ? "number" : "text",
              placeholder: "Value\u2026",
              value: row.value,
              onChange: (e) => updateFilterRow(row.id, { value: e.target.value })
            }
          ),
          /* @__PURE__ */ jsx2("button", { className: "cl-fb-remove", onClick: () => removeFilterRow(row.id), title: "Remove filter", children: /* @__PURE__ */ jsx2("svg", { width: "12", height: "12", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ jsx2("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) }) })
        ] }, row.id);
      }),
      /* @__PURE__ */ jsxs2("div", { className: "cl-fb-footer", children: [
        /* @__PURE__ */ jsxs2("button", { className: "cl-fb-add", onClick: addFilterRow, children: [
          /* @__PURE__ */ jsx2("svg", { width: "12", height: "12", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx2("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 4.5v15m7.5-7.5h-15" }) }),
          "Add filter"
        ] }),
        filterRows.length > 0 && /* @__PURE__ */ jsx2("button", { className: "cl-fb-clear", onClick: () => setFilterRows([]), children: "Clear all" })
      ] })
    ] });
  }
  if (loading) {
    return /* @__PURE__ */ jsx2("div", { className: "cl-root cl-loading", children: /* @__PURE__ */ jsx2("div", { className: "cl-loading-spinner" }) });
  }
  const activeFilterCount = Object.values(filters).filter(
    (v) => v.kind === "enum" ? v.values.length > 0 : v.kind === "text" ? !!v.q : !!(v.min || v.max)
  ).length;
  return /* @__PURE__ */ jsxs2("div", { className: "cl-root", children: [
    /* @__PURE__ */ jsx2("div", { className: "cl-header", children: /* @__PURE__ */ jsx2("div", { className: "cl-header-row", children: /* @__PURE__ */ jsxs2("div", { className: "cl-header-left", children: [
      /* @__PURE__ */ jsx2("div", { className: "cl-header-accent" }),
      /* @__PURE__ */ jsxs2("div", { children: [
        isRenaming ? /* @__PURE__ */ jsx2(
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
        ) : /* @__PURE__ */ jsx2(
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
            children: localTitle
          }
        ),
        /* @__PURE__ */ jsx2("p", { className: "cl-subtitle", children: displayedClients.length > PAGE_SIZE2 ? `${(page * PAGE_SIZE2 + 1).toLocaleString()}\u2013${Math.min((page + 1) * PAGE_SIZE2, displayedClients.length).toLocaleString()} of ${displayedClients.length.toLocaleString()} records` : `${displayedClients.length.toLocaleString()} record${displayedClients.length !== 1 ? "s" : ""}` })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsxs2("div", { className: "cl-toolbar-row", children: [
      /* @__PURE__ */ jsxs2("div", { className: "cl-toolbar", children: [
        /* @__PURE__ */ jsx2("div", { className: "cl-toolbar-seg", children: allViews.map((view) => /* @__PURE__ */ jsxs2("div", { className: "cl-toolbar-view-item", children: [
          /* @__PURE__ */ jsx2(
            "button",
            {
              className: "cl-seg-btn" + (activeViewId === view.id ? " active" : ""),
              onClick: () => applyView(view),
              children: view.name
            }
          ),
          !view.builtIn && /* @__PURE__ */ jsx2(
            "button",
            {
              className: "cl-seg-delete",
              title: "Delete view",
              onClick: () => handleDeleteView(view.id),
              children: /* @__PURE__ */ jsx2("svg", { width: "8", height: "8", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 3, children: /* @__PURE__ */ jsx2("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) })
            }
          )
        ] }, view.id)) }),
        showSaveView ? /* @__PURE__ */ jsxs2("div", { className: "cl-toolbar-save-wrap", children: [
          /* @__PURE__ */ jsx2(
            "input",
            {
              autoFocus: true,
              className: "cl-toolbar-save-input",
              type: "text",
              placeholder: "View name\u2026",
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
          /* @__PURE__ */ jsx2("button", { className: "cl-toolbar-save-confirm", onClick: handleSaveView, disabled: savingView || !newViewName.trim(), children: savingView ? "\u2026" : "Save" }),
          /* @__PURE__ */ jsx2("button", { className: "cl-toolbar-save-cancel", onClick: () => {
            setShowSaveView(false);
            setNewViewName("");
          }, children: "Cancel" })
        ] }) : onSaveView && /* @__PURE__ */ jsxs2("button", { className: "cl-seg-add", onClick: () => setShowSaveView(true), children: [
          /* @__PURE__ */ jsx2("svg", { width: "10", height: "10", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ jsx2("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 4.5v15m7.5-7.5h-15" }) }),
          "Save view"
        ] })
      ] }),
      /* @__PURE__ */ jsxs2("div", { className: "cl-action-bar", children: [
        /* @__PURE__ */ jsxs2("div", { className: "cl-action-wrap", ref: colPickerRef, children: [
          /* @__PURE__ */ jsx2(
            "button",
            {
              className: "cl-action-btn" + (showColPicker ? " active" : ""),
              onClick: () => setShowColPicker((p) => !p),
              title: "Show / hide columns",
              children: /* @__PURE__ */ jsx2("svg", { width: "15", height: "15", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx2("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 4H5a1 1 0 00-1 1v14a1 1 0 001 1h4M9 4v16M9 4h6M9 20h6m0-16h4a1 1 0 011 1v14a1 1 0 01-1 1h-4M15 4v16" }) })
            }
          ),
          showColPicker && /* @__PURE__ */ jsxs2("div", { className: "cl-export-menu cl-col-picker-menu", children: [
            /* @__PURE__ */ jsxs2("div", { className: "cl-export-menu-header", style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
              /* @__PURE__ */ jsxs2("div", { children: [
                /* @__PURE__ */ jsx2("div", { className: "cl-export-menu-title", children: "Show / Hide Columns" }),
                /* @__PURE__ */ jsxs2("div", { className: "cl-export-menu-sub", children: [
                  colVisible === null ? pickableCols.length : colVisible.length,
                  " of ",
                  pickableCols.length,
                  " shown"
                ] })
              ] }),
              /* @__PURE__ */ jsx2("button", { className: "cl-col-picker-reset", onClick: () => setColVisible(null), children: "Reset" })
            ] }),
            /* @__PURE__ */ jsx2("div", { className: "cl-col-picker-body", children: pickableCols.map((col) => {
              const checked = colVisible === null || colVisible.includes(col.key);
              return /* @__PURE__ */ jsxs2("label", { className: "cl-col-picker-row", children: [
                /* @__PURE__ */ jsx2("input", { type: "checkbox", checked, onChange: () => togglePickerCol(col.key) }),
                /* @__PURE__ */ jsx2("span", { children: col.label })
              ] }, col.key);
            }) })
          ] })
        ] }),
        (isPrivileged || canView("export")) && /* @__PURE__ */ jsxs2("div", { className: "cl-action-wrap", ref: exportRef, children: [
          /* @__PURE__ */ jsx2(
            "button",
            {
              className: "cl-action-btn" + (showExport ? " active" : ""),
              onClick: () => setShowExport((p) => !p),
              disabled: displayedClients.length === 0,
              title: "Export to CSV",
              children: /* @__PURE__ */ jsx2("svg", { width: "15", height: "15", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx2("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" }) })
            }
          ),
          showExport && /* @__PURE__ */ jsxs2("div", { className: "cl-export-menu", children: [
            /* @__PURE__ */ jsxs2("div", { className: "cl-export-menu-header", children: [
              /* @__PURE__ */ jsx2("div", { className: "cl-export-menu-title", children: "Export to CSV" }),
              /* @__PURE__ */ jsx2("div", { className: "cl-export-menu-sub", children: "Exports all currently filtered records" })
            ] }),
            /* @__PURE__ */ jsx2("div", { className: "cl-export-menu-body", children: /* @__PURE__ */ jsx2("button", { className: "cl-export-dl-btn", onClick: exportCSV, children: "Download" }) })
          ] })
        ] }),
        isPrivileged && /* @__PURE__ */ jsx2(
          "button",
          {
            className: "cl-action-btn" + (showPermissions ? " active" : ""),
            onClick: openPermissionsEditor,
            title: "Manage column permissions",
            children: /* @__PURE__ */ jsxs2("svg", { width: "15", height: "15", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: [
              /* @__PURE__ */ jsx2("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" }),
              /* @__PURE__ */ jsx2("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" })
            ] })
          }
        )
      ] })
    ] }),
    renderPermissionsEditor(),
    /* @__PURE__ */ jsxs2("div", { className: "cl-search-area", children: [
      /* @__PURE__ */ jsxs2("div", { className: "cl-search-row", children: [
        /* @__PURE__ */ jsxs2("div", { className: "cl-search-wrap", children: [
          /* @__PURE__ */ jsx2("svg", { className: "cl-search-icon", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx2("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) }),
          /* @__PURE__ */ jsx2(
            "input",
            {
              className: "cl-search-input",
              type: "text",
              placeholder: "Search by name, phone, app #, carrier, state, notes\u2026",
              value: searchText,
              onChange: (e) => setSearchText(e.target.value)
            }
          ),
          searchText && /* @__PURE__ */ jsx2("button", { className: "cl-search-clear", onClick: () => setSearchText(""), children: /* @__PURE__ */ jsx2("svg", { width: "14", height: "14", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx2("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) }) })
        ] }),
        /* @__PURE__ */ jsxs2(
          "button",
          {
            className: "cl-filter-toggle" + (showFilterBuilder || activeFilterCount > 0 ? " active" : ""),
            onClick: () => setShowFilterBuilder((p) => !p),
            children: [
              /* @__PURE__ */ jsx2("svg", { width: "14", height: "14", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx2("path", { fillRule: "evenodd", d: "M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L13 10.414V17a1 1 0 01-1.447.894l-4-2A1 1 0 017 15v-4.586L3.293 6.707A1 1 0 013 6V3z", clipRule: "evenodd" }) }),
              "Filter",
              activeFilterCount > 0 && /* @__PURE__ */ jsx2("span", { className: "cl-filter-toggle-count", children: activeFilterCount })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs2("div", { className: "cl-day-seg", children: [
        ["M", "T", "W", "T", "F", "S", "S"].map((label, i) => /* @__PURE__ */ jsx2(
          "button",
          {
            className: "cl-day-btn" + (dayFilter === weekDays[i] ? " active" : ""),
            onClick: () => setDayFilter(dayFilter === weekDays[i] ? null : weekDays[i]),
            title: weekDays[i],
            children: label
          },
          weekDays[i]
        )),
        /* @__PURE__ */ jsx2("div", { className: "cl-day-sep" }),
        /* @__PURE__ */ jsxs2("div", { ref: weekPickerRef, style: { position: "relative" }, children: [
          /* @__PURE__ */ jsxs2(
            "button",
            {
              className: "cl-day-btn cl-day-week-btn cl-day-week-pick" + (dayFilter === "week" || (dayFilter?.startsWith("week:") ?? false) ? " active" : ""),
              onClick: () => setShowWeekPicker((p) => !p),
              children: [
                /* @__PURE__ */ jsx2("span", { children: dayFilter?.startsWith("week:") ? (() => {
                  const [, mo, da] = dayFilter.slice(5).split("-");
                  return `${mo}/${da}`;
                })() : "Week" }),
                /* @__PURE__ */ jsx2("svg", { width: "9", height: "9", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 3, children: /* @__PURE__ */ jsx2("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-7 7-7-7" }) })
              ]
            }
          ),
          showWeekPicker && /* @__PURE__ */ jsx2("div", { className: "cl-week-dropdown", children: /* @__PURE__ */ jsx2(
            WeekCalendar,
            {
              availableWeeks,
              dayFilter,
              onSelect: (val) => {
                setDayFilter(val);
                setShowWeekPicker(false);
              }
            }
          ) })
        ] }),
        /* @__PURE__ */ jsx2(
          "button",
          {
            className: "cl-day-btn cl-day-week-btn" + (dayFilter === null ? " active" : ""),
            onClick: () => setDayFilter(null),
            children: "All"
          }
        ),
        uniqueCarriers.length > 0 && /* @__PURE__ */ jsx2("div", { className: "cl-day-sep" }),
        uniqueCarriers.map((carrier) => /* @__PURE__ */ jsx2(
          "button",
          {
            className: "cl-day-btn" + (carrierFilter === carrier ? " active" : ""),
            title: carrier,
            onClick: () => setCarrierFilter(carrierFilter === carrier ? null : carrier),
            children: carrier.slice(0, 4).toUpperCase()
          },
          carrier
        ))
      ] }),
      renderFilterBuilder()
    ] }),
    showFilterBuilder && activeFilterCount > 0 && /* @__PURE__ */ jsxs2("div", { className: "cl-active-filters", children: [
      /* @__PURE__ */ jsx2("span", { className: "cl-active-filters-label", children: "Column filters:" }),
      Object.entries(filters).map(([col, spec]) => {
        const colDef = COLUMNS.find((c) => c.key === col);
        const name = colDef?.label || col;
        let chip = "";
        if (spec.kind === "enum" && spec.values.length) chip = spec.values.length > 1 ? `${name}: ${spec.values.length} selected` : `${name}: ${spec.values[0]}`;
        if (spec.kind === "text" && spec.q) chip = `${name}: ~${spec.q}`;
        if (spec.kind === "range" && (spec.min || spec.max)) chip = `${name}: ${spec.min ?? ""}\u2013${spec.max ?? ""}`;
        if (!chip) return null;
        return /* @__PURE__ */ jsxs2("span", { className: "cl-filter-chip", children: [
          chip,
          /* @__PURE__ */ jsx2("button", { className: "cl-filter-chip-remove", onClick: () => setFilterRows((prev) => prev.filter((r) => r.field !== col)), children: "\xD7" })
        ] }, col);
      }),
      /* @__PURE__ */ jsx2("button", { className: "cl-filter-clear-all", onClick: () => setFilterRows([]), children: "Clear all" })
    ] }),
    /* @__PURE__ */ jsxs2("div", { className: "cl-table-area", children: [
      displayedClients.length > 0 ? /* @__PURE__ */ jsxs2("div", { className: "cl-table-wrap", children: [
        /* @__PURE__ */ jsx2("div", { className: "cl-table-scroll", ref: tableScrollRef, onScroll: syncHThumb, children: /* @__PURE__ */ jsxs2("table", { className: "cl-table", children: [
          /* @__PURE__ */ jsx2("thead", { className: "cl-thead", children: /* @__PURE__ */ jsxs2("tr", { children: [
            visibleColDefs.map((col) => {
              const isSorted = sortField === col.key;
              const isDragging = dragCol === col.key;
              const isDragOver = dragOverCol === col.key && dragCol !== col.key;
              const spec = filters[col.key];
              const isFiltered = spec ? spec.kind === "enum" ? spec.values.length > 0 : spec.kind === "text" ? !!spec.q : !!(spec.min || spec.max) : false;
              return /* @__PURE__ */ jsx2(
                "th",
                {
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
                  children: /* @__PURE__ */ jsxs2("div", { className: "cl-th-inner", children: [
                    /* @__PURE__ */ jsx2(
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
                        children: /* @__PURE__ */ jsxs2("svg", { width: "12", height: "12", fill: "currentColor", viewBox: "0 0 16 16", children: [
                          /* @__PURE__ */ jsx2("circle", { cx: "5", cy: "4", r: "1.5" }),
                          /* @__PURE__ */ jsx2("circle", { cx: "11", cy: "4", r: "1.5" }),
                          /* @__PURE__ */ jsx2("circle", { cx: "5", cy: "8", r: "1.5" }),
                          /* @__PURE__ */ jsx2("circle", { cx: "11", cy: "8", r: "1.5" }),
                          /* @__PURE__ */ jsx2("circle", { cx: "5", cy: "12", r: "1.5" }),
                          /* @__PURE__ */ jsx2("circle", { cx: "11", cy: "12", r: "1.5" })
                        ] })
                      }
                    ),
                    col.sortable ? /* @__PURE__ */ jsxs2("button", { className: "cl-sort-btn" + (isSorted ? " sorted" : ""), onClick: () => handleSort(col.key), children: [
                      col.label,
                      /* @__PURE__ */ jsx2("span", { className: "cl-sort-arrow" + (isSorted ? "" : " unsorted"), children: isSorted ? sortDir === "asc" ? "\u2191" : "\u2193" : "\u2195" })
                    ] }) : /* @__PURE__ */ jsx2("span", { children: col.label }),
                    isFiltered && /* @__PURE__ */ jsx2("span", { className: "cl-filter-count", children: "\u25CF" })
                  ] })
                },
                col.key
              );
            }),
            showActions && /* @__PURE__ */ jsx2("th", { className: "cl-th-actions", children: "Actions" })
          ] }) }),
          /* @__PURE__ */ jsxs2("tbody", { children: [
            pendingRows.length > 0 && /* @__PURE__ */ jsx2("tr", { className: "cl-tr-section pending-section", children: /* @__PURE__ */ jsx2("td", { colSpan: totalColSpan, children: /* @__PURE__ */ jsxs2("div", { className: "cl-section-label", children: [
              /* @__PURE__ */ jsx2("span", { className: "cl-section-dot pulse", style: { background: "var(--cl-amber)" } }),
              /* @__PURE__ */ jsx2("span", { className: "cl-section-title", style: { color: "var(--cl-amber)" }, children: "Unclaimed" }),
              /* @__PURE__ */ jsxs2("span", { className: "cl-section-count", children: [
                pendingRows.length,
                " waiting"
              ] })
            ] }) }) }),
            pendingRows.map((client) => /* @__PURE__ */ jsxs2("tr", { className: "cl-tr pending", children: [
              visibleColDefs.map((col) => renderCell(col, client)),
              showActions && /* @__PURE__ */ jsx2("td", { className: "cl-td-actions", children: /* @__PURE__ */ jsxs2("button", { className: "cl-btn-claim", onClick: () => handleClaim(client), disabled: busy.has(client.id), children: [
                busy.has(client.id) ? /* @__PURE__ */ jsx2(Spinner, {}) : /* @__PURE__ */ jsx2("svg", { width: "12", height: "12", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ jsx2("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) }),
                busy.has(client.id) ? "\u2026" : "Claim"
              ] }) })
            ] }, client.id)),
            claimedRows.length > 0 && pendingRows.length > 0 && /* @__PURE__ */ jsx2("tr", { className: "cl-tr-section claimed-section", children: /* @__PURE__ */ jsx2("td", { colSpan: totalColSpan, children: /* @__PURE__ */ jsxs2("div", { className: "cl-section-label", children: [
              /* @__PURE__ */ jsx2("span", { className: "cl-section-dot", style: { background: "var(--cl-green)" } }),
              /* @__PURE__ */ jsx2("span", { className: "cl-section-title", style: { color: "var(--cl-green)" }, children: "Claimed" }),
              /* @__PURE__ */ jsxs2("span", { className: "cl-section-count", children: [
                claimedRows.length,
                hasMore ? "+" : ""
              ] })
            ] }) }) }),
            claimedRows.map((client) => /* @__PURE__ */ jsxs2("tr", { className: "cl-tr", children: [
              visibleColDefs.map((col) => renderCell(col, client)),
              showActions && /* @__PURE__ */ jsx2("td", { className: "cl-td-actions", children: /* @__PURE__ */ jsxs2("button", { className: "cl-btn-unclaim", onClick: () => handleUnclaim(client), disabled: busy.has(client.id), children: [
                busy.has(client.id) ? /* @__PURE__ */ jsx2(Spinner, {}) : /* @__PURE__ */ jsx2("svg", { width: "12", height: "12", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx2("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) }),
                busy.has(client.id) ? "\u2026" : "Unclaim"
              ] }) })
            ] }, client.id))
          ] })
        ] }) }),
        hThumb.show && /* @__PURE__ */ jsxs2("div", { className: "cl-hscroll-bar", children: [
          /* @__PURE__ */ jsx2("button", { className: "cl-scroll-left-btn", onClick: scrollToLeft, title: "Scroll to start", children: "\u2039" }),
          /* @__PURE__ */ jsx2("div", { className: "cl-hscroll-track", ref: hScrollTrackRef, onMouseDown: onTrackClick, children: /* @__PURE__ */ jsx2(
            "div",
            {
              className: "cl-hscroll-thumb",
              style: { left: hThumb.left, width: hThumb.width },
              onMouseDown: onThumbMouseDown,
              onClick: (e) => e.stopPropagation()
            }
          ) })
        ] })
      ] }) : /* @__PURE__ */ jsxs2("div", { className: "cl-empty", children: [
        /* @__PURE__ */ jsx2("div", { className: "cl-empty-icon", children: /* @__PURE__ */ jsx2("svg", { width: "28", height: "28", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, style: { color: "var(--cl-text-4)" }, children: /* @__PURE__ */ jsx2("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) }) }),
        /* @__PURE__ */ jsx2("p", { className: "cl-empty-title", children: "No records found" }),
        /* @__PURE__ */ jsx2("p", { className: "cl-empty-sub", children: "Try adjusting your search or filters." })
      ] }),
      totalPages > 1 && /* @__PURE__ */ jsxs2("div", { className: "cl-pagination", children: [
        /* @__PURE__ */ jsxs2(
          "button",
          {
            className: "cl-page-btn",
            onClick: () => setPage((p) => p - 1),
            disabled: page === 0,
            children: [
              /* @__PURE__ */ jsx2("svg", { width: "12", height: "12", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ jsx2("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 19l-7-7 7-7" }) }),
              "Prev"
            ]
          }
        ),
        /* @__PURE__ */ jsxs2("span", { className: "cl-page-info", children: [
          "Page ",
          page + 1,
          " of ",
          totalPages
        ] }),
        /* @__PURE__ */ jsxs2(
          "button",
          {
            className: "cl-page-btn",
            onClick: () => setPage((p) => p + 1),
            disabled: page >= totalPages - 1,
            children: [
              "Next",
              /* @__PURE__ */ jsx2("svg", { width: "12", height: "12", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ jsx2("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 5l7 7-7 7" }) })
            ]
          }
        )
      ] })
    ] })
  ] });
}

// hooks/useClientList.ts
import { useEffect as useEffect2, useState as useState2, useCallback as useCallback2, useRef as useRef2 } from "react";
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
  arrayUnion,
  serverTimestamp
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
var PERMISSIONS_COLLECTION = "permissions";

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
  const [clients, setClients] = useState2([]);
  const [views, setViews] = useState2([]);
  const [permissions, setPermissions] = useState2(DEFAULT_PERMISSIONS);
  const [listTitle, setListTitle] = useState2(collectionId);
  const [loading, setLoading] = useState2(true);
  const [hasMore, setHasMore] = useState2(false);
  const [pageLimit, setPageLimit] = useState2(PAGE_SIZE);
  const loadingMore = useRef2(false);
  useEffect2(() => {
    const q = query(
      collection(firestore, collectionId),
      orderBy("date", "desc"),
      limit(pageLimit + 1)
    );
    const unsub = onSnapshot(q, (snap) => {
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
  useEffect2(() => {
    const viewsRef = collection(firestore, collectionId, "_views");
    const unsub = onSnapshot(viewsRef, (snap) => {
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
  useEffect2(() => {
    const permRef = doc(firestore, PERMISSIONS_COLLECTION, collectionId);
    getDoc(permRef).then((snap) => {
      if (snap.exists()) {
        setPermissions(snap.data());
      }
    }).catch((err) => {
      console.error(`[useClientList] permissions load error (${collectionId}):`, err);
    });
  }, [collectionId, firestore]);
  const onSave = useCallback2(async (id, field, value, updaterName, fromValue) => {
    const docRef = doc(firestore, collectionId, id);
    const changeEntry = {
      at: { seconds: Math.floor(Date.now() / 1e3) },
      by: updaterName,
      field,
      from: String(fromValue ?? ""),
      to: String(value)
    };
    await updateDoc(docRef, {
      [field]: value,
      updatedAt: serverTimestamp(),
      updatedByName: updaterName,
      changeLog: arrayUnion(changeEntry)
    });
  }, [collectionId, firestore]);
  const onSaveView = useCallback2(async (view) => {
    const viewsRef = collection(firestore, collectionId, "_views");
    const docRef = await addDoc(viewsRef, { ...view, createdAt: serverTimestamp() });
    return docRef.id;
  }, [collectionId, firestore]);
  const onDeleteView = useCallback2(async (id) => {
    const viewRef = doc(firestore, collectionId, "_views", id);
    await deleteDoc(viewRef);
  }, [collectionId, firestore]);
  const onRenameList = useCallback2(async (name) => {
    const metaRef = doc(firestore, collectionId, "_meta");
    await setDoc(metaRef, { title: name }, { merge: true });
    setListTitle(name);
  }, [collectionId, firestore]);
  const onSavePermissions = useCallback2(async (matrix) => {
    const permRef = doc(firestore, PERMISSIONS_COLLECTION, collectionId);
    await setDoc(permRef, matrix);
    setPermissions(matrix);
  }, [collectionId, firestore]);
  const onLoadMore = useCallback2(async () => {
    if (loadingMore.current || !hasMore) return;
    loadingMore.current = true;
    setPageLimit((prev) => prev + PAGE_SIZE);
  }, [hasMore]);
  return {
    clients,
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

// hooks/useClientListMock.ts
import { useState as useState3, useCallback as useCallback3 } from "react";
function useClientListMock(_collectionId, options = {}) {
  const {
    initialClients = [],
    initialViews = [],
    initialTitle,
    initialPermissions = DEFAULT_PERMISSIONS,
    loading: initialLoading = false,
    hasMore: initialHasMore = false
  } = options;
  const [clients, setClients] = useState3(initialClients);
  const [views, setViews] = useState3(initialViews);
  const [listTitle, setListTitle] = useState3(initialTitle ?? _collectionId);
  const [permissions, setPermissions] = useState3(initialPermissions);
  const [loading] = useState3(initialLoading);
  const [hasMore] = useState3(initialHasMore);
  const onSave = useCallback3(async (id, field, value, updaterName, fromValue) => {
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
  const onSaveView = useCallback3(async (view) => {
    const id = `mock-view-${Date.now()}`;
    setViews((prev) => [...prev, { id, ...view }]);
    return id;
  }, []);
  const onDeleteView = useCallback3(async (id) => {
    setViews((prev) => prev.filter((v) => v.id !== id));
  }, []);
  const onRenameList = useCallback3(async (name) => {
    setListTitle(name);
  }, []);
  const onSavePermissions = useCallback3(async (matrix) => {
    setPermissions(matrix);
  }, []);
  const onLoadMore = useCallback3(async () => {
  }, []);
  return {
    clients,
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
export {
  ClientList,
  DEFAULT_PERMISSIONS,
  useClientList,
  useClientListMock
};
//# sourceMappingURL=index.js.map