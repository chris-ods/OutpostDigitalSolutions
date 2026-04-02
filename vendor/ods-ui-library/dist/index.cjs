"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// index.ts
var index_exports = {};
__export(index_exports, {
  ClientList: () => ClientList,
  DEFAULT_PERMISSIONS: () => DEFAULT_PERMISSIONS,
  OdsPanel: () => OdsPanel,
  ReceiptList: () => ReceiptList,
  ReceiptScanner: () => ReceiptScanner,
  useClientList: () => useClientList,
  useClientListMock: () => useClientListMock,
  useReceiptList: () => useReceiptList,
  useReceiptListMock: () => useReceiptListMock
});
module.exports = __toCommonJS(index_exports);

// UserClaimDisplay.tsx
var import_jsx_runtime = require("react/jsx-runtime");

// ClientList.tsx
var import_react = __toESM(require("react"), 1);

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
var import_jsx_runtime2 = require("react/jsx-runtime");
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
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "cl-spinner", "aria-label": "Loading" });
}
function PencilIcon() {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { className: "cl-pencil", width: "11", height: "11", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" }) });
}
function CellInput({
  type,
  initialValue,
  options,
  onSave,
  onCancel
}) {
  const [val, setVal] = (0, import_react.useState)(initialValue);
  if (type === "select" && options) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
        children: options.map((o) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: o, children: o }, o))
      }
    );
  }
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-cell-edit-wrap", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-cell-actions", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "cl-cell-cancel-btn", onMouseDown: (e) => e.preventDefault(), onClick: onCancel, title: "Cancel (Esc)", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { width: "9", height: "9", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 3.5, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "cl-cell-confirm-btn", onMouseDown: (e) => e.preventDefault(), onClick: () => onSave(val), title: "Save (Enter)", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { width: "9", height: "9", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 3.5, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 13l4 4L19 7" }) }) })
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
  const [viewYear, setViewYear] = (0, import_react.useState)(today.getFullYear());
  const [viewMonth, setViewMonth] = (0, import_react.useState)(today.getMonth());
  const weekSet = (0, import_react.useMemo)(() => new Set(availableWeeks), [availableWeeks]);
  const gridDays = (0, import_react.useMemo)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-wcal", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-wcal-nav", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "cl-wcal-nav-btn", onClick: () => {
        if (viewMonth === 0) {
          setViewYear((y) => y - 1);
          setViewMonth(11);
        } else setViewMonth((m) => m - 1);
      }, children: "\u2039" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "cl-wcal-month", children: [
        MONTHS[viewMonth],
        " ",
        viewYear
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "cl-wcal-nav-btn", onClick: () => {
        if (viewMonth === 11) {
          setViewYear((y) => y + 1);
          setViewMonth(0);
        } else setViewMonth((m) => m + 1);
      }, children: "\u203A" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-wcal-grid", children: [
      ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "cl-wcal-hdr", children: d }, d)),
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
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
  uid: uid3,
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
  const [clients, setClients] = (0, import_react.useState)(clientsProp);
  (0, import_react.useEffect)(() => {
    setClients(clientsProp);
  }, [clientsProp]);
  const [sortField, setSortField] = (0, import_react.useState)(DEFAULT_VIEW.sortField ?? initialSortField);
  const [sortDir, setSortDir] = (0, import_react.useState)(DEFAULT_VIEW.sortDir ?? initialSortDir);
  const [filterRows, setFilterRows] = (0, import_react.useState)(() => DEFAULT_VIEW.filterRows ?? []);
  const [showFilterBuilder, setShowFilterBuilder] = (0, import_react.useState)(false);
  const filters = (0, import_react.useMemo)(() => filterRowsToSpecs(filterRows), [filterRows]);
  const [searchText, setSearchText] = (0, import_react.useState)("");
  const [showHistorical, setShowHistorical] = (0, import_react.useState)(false);
  const [colOrder, setColOrder] = (0, import_react.useState)(() => DEFAULT_VIEW.colOrder ?? DEFAULT_COL_ORDER);
  const [colVisible, setColVisible] = (0, import_react.useState)(() => DEFAULT_VIEW.visibleCols ?? null);
  const [dragCol, setDragCol] = (0, import_react.useState)(null);
  const [dragOverCol, setDragOverCol] = (0, import_react.useState)(null);
  const [activeViewId, setActiveViewId] = (0, import_react.useState)("default");
  const [showSaveView, setShowSaveView] = (0, import_react.useState)(false);
  const [newViewName, setNewViewName] = (0, import_react.useState)("");
  const [savingView, setSavingView] = (0, import_react.useState)(false);
  const allViews = (0, import_react.useMemo)(() => [DEFAULT_VIEW, ...viewsProp], [viewsProp]);
  const [localTitle, setLocalTitle] = (0, import_react.useState)(listTitle);
  const [isRenaming, setIsRenaming] = (0, import_react.useState)(false);
  const [renameValue, setRenameValue] = (0, import_react.useState)(listTitle);
  (0, import_react.useEffect)(() => {
    setLocalTitle(listTitle);
    setRenameValue(listTitle);
  }, [listTitle]);
  const [editCell, setEditCell] = (0, import_react.useState)(null);
  const [saving, setSaving] = (0, import_react.useState)({});
  const [infoPopover, setInfoPopover] = (0, import_react.useState)(null);
  const infoPopoverRef = (0, import_react.useRef)(null);
  const tableScrollRef = (0, import_react.useRef)(null);
  const hScrollTrackRef = (0, import_react.useRef)(null);
  const hDragData = (0, import_react.useRef)({ startX: 0, startScrollLeft: 0 });
  const [hThumb, setHThumb] = (0, import_react.useState)({ left: 0, width: 0, show: false });
  const PAGE_SIZE3 = 50;
  const [page, setPage] = (0, import_react.useState)(0);
  const [busy, setBusy] = (0, import_react.useState)(/* @__PURE__ */ new Set());
  const [loadingMore, setLoadingMore] = (0, import_react.useState)(false);
  const [showExport, setShowExport] = (0, import_react.useState)(false);
  const exportRef = (0, import_react.useRef)(null);
  const [showColPicker, setShowColPicker] = (0, import_react.useState)(false);
  const colPickerRef = (0, import_react.useRef)(null);
  const [dayFilter, setDayFilter] = (0, import_react.useState)(null);
  const [carrierFilter, setCarrierFilter] = (0, import_react.useState)(null);
  const [showWeekPicker, setShowWeekPicker] = (0, import_react.useState)(false);
  const weekPickerRef = (0, import_react.useRef)(null);
  const uniqueCarriers = (0, import_react.useMemo)(
    () => [...new Set(clients.map((c) => c.carrier).filter(Boolean))].sort(),
    [clients]
  );
  const availableWeeks = (0, import_react.useMemo)(() => {
    const getMonday = (dateStr) => {
      const d = /* @__PURE__ */ new Date(dateStr + "T12:00:00");
      const off = (d.getDay() + 6) % 7;
      d.setDate(d.getDate() - off);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    const weeks = [...new Set(clients.map((c) => c.date ? getMonday(c.date) : null).filter(Boolean))];
    return weeks.sort((a, b) => b.localeCompare(a)).slice(0, 7);
  }, [clients]);
  const weekDays = (0, import_react.useMemo)(() => {
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
  const [showPermissions, setShowPermissions] = (0, import_react.useState)(false);
  const [draftPermissions, setDraftPermissions] = (0, import_react.useState)(
    () => permissions ?? DEFAULT_PERMISSIONS
  );
  const [savingPerms, setSavingPerms] = (0, import_react.useState)(false);
  const [resolvedPermissions, setResolvedPermissions] = (0, import_react.useState)(
    () => permissions ?? DEFAULT_PERMISSIONS
  );
  (0, import_react.useEffect)(() => {
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
  const visibleColDefs = (0, import_react.useMemo)(() => {
    const merged = [...colOrder, ...DEFAULT_COL_ORDER.filter((k) => !colOrder.includes(k))];
    return merged.map((key) => COLUMNS.find((c) => c.key === key)).filter((c) => !!c).filter((c) => !c.adminOnly || showSubmittedBy).filter((c) => phase !== "live" || c.key !== "claimed").filter((c) => canView(c.key)).filter((c) => colVisible === null || colVisible.includes(c.key));
  }, [colOrder, colVisible, showSubmittedBy, phase, currentRole, resolvedPermissions]);
  const distinctValues = (0, import_react.useMemo)(() => {
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
  (0, import_react.useEffect)(() => {
    if (!showExport) return;
    const h = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) setShowExport(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showExport]);
  (0, import_react.useEffect)(() => {
    if (!showColPicker) return;
    const h = (e) => {
      if (colPickerRef.current && !colPickerRef.current.contains(e.target)) setShowColPicker(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showColPicker]);
  (0, import_react.useEffect)(() => {
    if (!showWeekPicker) return;
    const h = (e) => {
      if (weekPickerRef.current && !weekPickerRef.current.contains(e.target)) setShowWeekPicker(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showWeekPicker]);
  const pickableCols = (0, import_react.useMemo)(
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
  (0, import_react.useEffect)(() => {
    if (!infoPopover) return;
    const h = (e) => {
      if (infoPopoverRef.current && !infoPopoverRef.current.contains(e.target)) {
        setInfoPopover(null);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [infoPopover]);
  const displayedClients = (0, import_react.useMemo)(() => {
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
  (0, import_react.useEffect)(() => {
    setPage(0);
  }, [searchText, filterRows, sortField, sortDir, showHistorical, dayFilter, carrierFilter]);
  const totalPages = Math.max(1, Math.ceil(displayedClients.length / PAGE_SIZE3));
  const pagedClients = displayedClients.slice(page * PAGE_SIZE3, (page + 1) * PAGE_SIZE3);
  const pendingRows = pagedClients.filter(isPending);
  const claimedRows = pagedClients.filter((c) => !isPending(c));
  const totalColSpan = visibleColDefs.length + (showActions ? 1 : 0);
  const historicalCount = (0, import_react.useMemo)(
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
  const syncHThumb = (0, import_react.useCallback)(() => {
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
  (0, import_react.useEffect)(() => {
    const el = tableScrollRef.current;
    if (!el) return;
    syncHThumb();
    const ro = new ResizeObserver(syncHThumb);
    ro.observe(el);
    return () => ro.disconnect();
  }, [syncHThumb, displayedClients.length]);
  const onThumbMouseDown = (0, import_react.useCallback)((e) => {
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
  const onTrackClick = (0, import_react.useCallback)((e) => {
    const track = hScrollTrackRef.current;
    const el = tableScrollRef.current;
    if (!track || !el) return;
    const rect = track.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    el.scrollLeft = ratio * (el.scrollWidth - el.clientWidth);
  }, []);
  const scrollToLeft = (0, import_react.useCallback)(() => {
    if (tableScrollRef.current) tableScrollRef.current.scrollLeft = 0;
  }, []);
  const handleLoadMore = (0, import_react.useCallback)(async () => {
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
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: "cl-td narrow", children: isPending(client) ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "cl-badge unclaimed", title: "Unclaimed", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { width: "8", height: "8", viewBox: "0 0 8 8", fill: "currentColor", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "4", cy: "4", r: "4" }) }) }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { width: "14", height: "14", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, style: { color: "var(--cl-green)" }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) }) }, col.key);
      case "date":
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: "cl-td", children: isEditing ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(CellInput, { type: "date", initialValue: client.date ?? "", onSave: confirmEdit, onCancel: cancelEdit }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-cell-edit", onClick: () => startE(client.date ?? ""), children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: fmtDate(client.date) }),
          isSaving ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Spinner, {}) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PencilIcon, {})
        ] }) }, col.key);
      case "clientName":
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: "cl-td text-primary", children: isEditing ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(CellInput, { type: "text", initialValue: client.clientName, onSave: confirmEdit, onCancel: cancelEdit }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-cell-edit", onClick: () => startE(client.clientName), children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: client.clientName || "\u2014" }),
          isSaving ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Spinner, {}) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PencilIcon, {})
        ] }) }, col.key);
      case "phone":
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: "cl-td mono", children: isEditing ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(CellInput, { type: "text", initialValue: client.phone ?? "", onSave: confirmEdit, onCancel: cancelEdit }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-cell-edit", onClick: () => startE(client.phone ?? ""), children: [
          client.phoneSpecialCase ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: client.phone || "\u2014" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "cl-badge special", children: "Special" })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: fmtPhone(client.phone) }),
          isSaving ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Spinner, {}) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PencilIcon, {})
        ] }) }, col.key);
      case "email":
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: "cl-td", children: isEditing ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(CellInput, { type: "text", initialValue: client.email ?? "", onSave: confirmEdit, onCancel: cancelEdit }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-cell-edit", onClick: () => startE(client.email ?? ""), children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: client.email || "\u2014" }),
          isSaving ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Spinner, {}) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PencilIcon, {})
        ] }) }, col.key);
      case "agentName":
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: "cl-td", children: client.agentId === uid3 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { color: "var(--cl-text-4)", fontStyle: "italic" }, children: "You" }) : client.agentName || /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "cl-no-agent", children: "no agent" }) }, col.key);
      case "contractorId":
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: "cl-td mono", children: isEditing ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(CellInput, { type: "text", initialValue: String(client.contractorId ?? ""), onSave: confirmEdit, onCancel: cancelEdit }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-cell-edit", onClick: () => startE(String(client.contractorId ?? "")), children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { color: "var(--cl-text-3)" }, children: String(client.contractorId || "\u2014") }),
          isSaving ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Spinner, {}) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PencilIcon, {})
        ] }) }, col.key);
      case "agentTeamNumber":
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: "cl-td", children: isEditing ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(CellInput, { type: "number", initialValue: String(client.agentTeamNumber ?? ""), onSave: confirmEdit, onCancel: cancelEdit }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-cell-edit", onClick: () => startE(String(client.agentTeamNumber ?? "")), children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: client.agentTeamNumber ? `Team ${client.agentTeamNumber}` : "\u2014" }),
          isSaving ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Spinner, {}) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PencilIcon, {})
        ] }) }, col.key);
      case "carrier":
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: "cl-td", children: canEdit("carrier") ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "cl-inline-select-wrap", children: isSaving ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Spinner, {}) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("select", { className: "cl-cell-select-plain", value: client.carrier ?? "", onChange: (e) => handleSelectChange(client, "carrier", e.target.value), children: CARRIERS.map((o) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: o, children: o }, o)) }) }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: client.carrier || "\u2014" }) }, col.key);
      case "appNumber":
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: "cl-td", children: isEditing ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(CellInput, { type: "text", initialValue: client.appNumber ?? "", onSave: confirmEdit, onCancel: cancelEdit }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-cell-edit", onClick: () => startE(client.appNumber ?? ""), children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: client.appNumber || "\u2014" }),
          isSaving ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Spinner, {}) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PencilIcon, {})
        ] }) }, col.key);
      case "annualPremium":
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: "cl-td", children: isEditing ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(CellInput, { type: "number", initialValue: String(client.annualPremium ?? ""), onSave: confirmEdit, onCancel: cancelEdit }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-cell-edit", onClick: () => startE(String(client.annualPremium ?? "")), children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "cl-premium", children: client.annualPremium ? fmtCurrency(client.annualPremium) : "\u2014" }),
          isSaving ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Spinner, {}) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PencilIcon, {})
        ] }) }, col.key);
      case "state":
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: "cl-td", children: isEditing ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(CellInput, { type: "text", initialValue: client.state ?? "", onSave: confirmEdit, onCancel: cancelEdit }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-cell-edit", onClick: () => startE(client.state ?? ""), children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: client.state || "\u2014" }),
          isSaving ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Spinner, {}) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PencilIcon, {})
        ] }) }, col.key);
      case "startDate":
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: "cl-td", children: isEditing ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(CellInput, { type: "date", initialValue: client.startDate ?? "", onSave: confirmEdit, onCancel: cancelEdit }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-cell-edit", onClick: () => startE(client.startDate ?? ""), children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: fmtDate(client.startDate) }),
          isSaving ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Spinner, {}) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PencilIcon, {})
        ] }) }, col.key);
      case "clientPaidDate":
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: "cl-td", children: isEditing ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(CellInput, { type: "date", initialValue: client.clientPaidDate ?? "", onSave: confirmEdit, onCancel: cancelEdit }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-cell-edit", onClick: () => startE(client.clientPaidDate ?? ""), children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: fmtDate(client.clientPaidDate) }),
          isSaving ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Spinner, {}) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PencilIcon, {})
        ] }) }, col.key);
      case "compDate":
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: "cl-td", children: isEditing ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(CellInput, { type: "date", initialValue: client.compDate ?? "", onSave: confirmEdit, onCancel: cancelEdit }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-cell-edit", onClick: () => startE(client.compDate ?? ""), children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: fmtDate(client.compDate) }),
          isSaving ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Spinner, {}) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PencilIcon, {})
        ] }) }, col.key);
      case "agentStatus":
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: "cl-td", children: canEdit("agentStatus") ? isSaving ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Spinner, {}) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "select",
          {
            className: `cl-badge cl-badge-select ${AGENT_STATUS_CLASS[client.agentStatus ?? ""] ?? ""}`,
            value: client.agentStatus ?? "",
            onChange: (e) => handleSelectChange(client, "agentStatus", e.target.value),
            children: AGENT_STATUSES.map((o) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: o, children: o }, o))
          }
        ) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: `cl-badge ${AGENT_STATUS_CLASS[client.agentStatus ?? ""] ?? ""}`, children: client.agentStatus || "\u2014" }) }, col.key);
      case "adminStatus":
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: "cl-td", children: canEdit("adminStatus") ? isSaving ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Spinner, {}) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "select",
          {
            className: "cl-cell-select-plain",
            value: client.adminStatus ?? "",
            onChange: (e) => handleSelectChange(client, "adminStatus", e.target.value),
            children: ADMIN_STATUSES.map((o) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: o, children: o }, o))
          }
        ) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: client.adminStatus || "\u2014" }) }, col.key);
      case "notes":
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: "cl-td", style: { maxWidth: 160 }, children: isEditing ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(CellInput, { type: "text", initialValue: client.notes ?? "", onSave: confirmEdit, onCancel: cancelEdit }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-cell-edit", onClick: () => startE(client.notes ?? ""), children: [
          client.notes ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "cl-note-text", title: client.notes, children: client.notes }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "cl-note-add", children: "+ add" }),
          isSaving ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Spinner, {}) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PencilIcon, {})
        ] }) }, col.key);
      case "createdAt": {
        const isOpen = infoPopover?.clientId === client.id && infoPopover.col === "createdAt";
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: "cl-td meta", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-meta-cell", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: fmtTimestamp(client.createdAt) }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              className: "cl-info-btn",
              title: "Created details",
              onClick: () => setInfoPopover(isOpen ? null : { clientId: client.id, col: "createdAt" }),
              children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.5, children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "12", cy: "12", r: "10" }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("line", { x1: "12", y1: "8", x2: "12", y2: "8", strokeLinecap: "round", strokeWidth: 3 }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("line", { x1: "12", y1: "12", x2: "12", y2: "16", strokeLinecap: "round" })
              ] })
            }
          ),
          isOpen && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-info-popover", ref: infoPopoverRef, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-info-popover-row", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "cl-info-label", children: "Created" }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: fmtTimestamp(client.createdAt) || "\u2014" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-info-popover-row", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "cl-info-label", children: "By" }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: client.createdByName || "\u2014" })
            ] })
          ] })
        ] }) }, col.key);
      }
      case "createdByName":
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: "cl-td meta", children: client.createdByName || "\u2014" }, col.key);
      case "updatedAt": {
        const isOpen = infoPopover?.clientId === client.id && infoPopover.col === "updatedAt";
        const log = (client.changeLog ?? []).slice().sort((a, b) => b.at.seconds - a.at.seconds);
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: "cl-td meta", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-meta-cell", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: fmtTimestamp(client.updatedAt) }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              className: "cl-info-btn",
              title: "Change history",
              onClick: () => setInfoPopover(isOpen ? null : { clientId: client.id, col: "updatedAt" }),
              children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.5, children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "12", cy: "12", r: "10" }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("line", { x1: "12", y1: "8", x2: "12", y2: "8", strokeLinecap: "round", strokeWidth: 3 }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("line", { x1: "12", y1: "12", x2: "12", y2: "16", strokeLinecap: "round" })
              ] })
            }
          ),
          isOpen && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-info-popover cl-info-popover--log", ref: infoPopoverRef, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-info-popover-row", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "cl-info-label", children: "Last updated" }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: fmtTimestamp(client.updatedAt) || "\u2014" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-info-popover-row", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "cl-info-label", children: "By" }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: client.updatedByName || "\u2014" })
            ] }),
            log.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "cl-info-divider" }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "cl-info-log-header", children: "Change history" }),
              log.map((entry, i) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-info-log-entry", children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-info-log-meta", children: [
                  fmtTimestamp(entry.at),
                  " \xB7 ",
                  entry.by
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-info-log-change", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "cl-info-field", children: entry.field }),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "cl-info-from", children: entry.from || "\u2014" }),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { width: "10", height: "10", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 12h14M13 6l6 6-6 6" }) }),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "cl-info-to", children: entry.to || "\u2014" })
                ] })
              ] }, i))
            ] }),
            log.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "cl-info-log-empty", children: "No changes recorded yet." })
          ] })
        ] }) }, col.key);
      }
      case "updatedByName":
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: "cl-td meta", children: client.updatedByName || "\u2014" }, col.key);
      default:
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: "cl-td", children: String(client[col.key] ?? "\u2014") }, col.key);
    }
  }
  function renderPermissionsEditor() {
    if (!showPermissions) return null;
    const configurableRoles = ["rep", "manager", "admin"];
    const editableColKeys = new Set(EDITABLE_COLS);
    const permCols = COLUMNS.filter((c) => c.key !== "claimed");
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-perm", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-perm-header", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "cl-perm-title", children: "Column Permissions" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "cl-perm-subtitle", children: "Owner & Dev always have full access" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
          onSavePermissions && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "cl-perm-save", onClick: savePermissions, disabled: savingPerms, children: savingPerms ? "Saving\u2026" : "Save Changes" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "cl-perm-close", onClick: () => setShowPermissions(false), title: "Close", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { width: "14", height: "14", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) }) })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "cl-perm-scroll", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("table", { className: "cl-perm-table", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("thead", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { className: "cl-perm-th cl-perm-col-label" }),
            configurableRoles.map((role) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { className: "cl-perm-th cl-perm-role-group", colSpan: 2, children: role.charAt(0).toUpperCase() + role.slice(1) }, role))
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { className: "cl-perm-th cl-perm-col-label", children: "Column" }),
            configurableRoles.map((role) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { className: "cl-perm-th cl-perm-sub", children: "View" }, role + "-view"),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { className: "cl-perm-th cl-perm-sub", children: "Edit" }, role + "-edit")
            ] }))
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("tbody", { children: [
          [
            { key: "export", label: "Export" },
            { key: "rename", label: "Rename list" }
          ].map(({ key, label }) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("tr", { className: "cl-perm-tr cl-perm-tr-action", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("td", { className: "cl-perm-td cl-perm-col-name", children: [
              label,
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "cl-perm-tag", children: "action" })
            ] }),
            configurableRoles.map((role) => {
              const allowed = draftPermissions[role][key]?.view ?? false;
              return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_react.default.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: "cl-perm-td cl-perm-cell", colSpan: 2, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
            return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("tr", { className: "cl-perm-tr", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("td", { className: "cl-perm-td cl-perm-col-name", children: [
                col.label || col.key,
                col.adminOnly && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "cl-perm-tag", children: "admin+" }),
                col.meta && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "cl-perm-tag", children: "meta" })
              ] }),
              configurableRoles.map((role) => {
                const perm = draftPermissions[role][col.key] ?? { view: true, edit: true };
                return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: "cl-perm-td cl-perm-cell", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                    "input",
                    {
                      type: "checkbox",
                      className: "cl-perm-check",
                      checked: perm.view,
                      onChange: () => toggleDraftPerm(role, col.key, "view")
                    }
                  ) }, role + "-view"),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: "cl-perm-td cl-perm-cell", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-fb", children: [
      filterRows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "cl-fb-empty", children: "No filters applied. Add one below." }) : filterRows.map((row) => {
        const col = COLUMNS.find((c) => c.key === row.field);
        const ft = col?.filterType ?? "text";
        const ops = getOperators(ft);
        const enumVals = row.field ? distinctValues[row.field] ?? [] : [];
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-fb-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "cl-fb-where", children: "Where" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
            "select",
            {
              className: "cl-fb-select",
              value: row.field,
              onChange: (e) => updateFilterRow(row.id, { field: e.target.value }),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "", children: "Select field\u2026" }),
                filterableColumns.map((c) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: c.key, children: c.label }, c.key))
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "select",
            {
              className: "cl-fb-select cl-fb-select-op",
              value: row.operator,
              onChange: (e) => updateFilterRow(row.id, { operator: e.target.value }),
              children: ops.map((op) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: op, children: op }, op))
            }
          ),
          ft === "enum" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
            "select",
            {
              className: "cl-fb-select cl-fb-select-val",
              value: row.value,
              onChange: (e) => updateFilterRow(row.id, { value: e.target.value }),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "", children: "Select\u2026" }),
                enumVals.map((v) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: v, children: v }, v))
              ]
            }
          ) : row.operator === "between" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "input",
              {
                className: "cl-fb-input",
                type: ft === "date" ? "date" : "number",
                placeholder: "From",
                value: row.value,
                onChange: (e) => updateFilterRow(row.id, { value: e.target.value })
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "cl-fb-and", children: "and" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "input",
              {
                className: "cl-fb-input",
                type: ft === "date" ? "date" : "number",
                placeholder: "To",
                value: row.value2,
                onChange: (e) => updateFilterRow(row.id, { value2: e.target.value })
              }
            )
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "input",
            {
              className: "cl-fb-input cl-fb-input-wide",
              type: ft === "date" ? "date" : ft === "number" ? "number" : "text",
              placeholder: "Value\u2026",
              value: row.value,
              onChange: (e) => updateFilterRow(row.id, { value: e.target.value })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "cl-fb-remove", onClick: () => removeFilterRow(row.id), title: "Remove filter", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { width: "12", height: "12", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) }) })
        ] }, row.id);
      }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-fb-footer", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { className: "cl-fb-add", onClick: addFilterRow, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { width: "12", height: "12", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 4.5v15m7.5-7.5h-15" }) }),
          "Add filter"
        ] }),
        filterRows.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "cl-fb-clear", onClick: () => setFilterRows([]), children: "Clear all" })
      ] })
    ] });
  }
  if (loading) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "cl-root cl-loading", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "cl-loading-spinner" }) });
  }
  const activeFilterCount = Object.values(filters).filter(
    (v) => v.kind === "enum" ? v.values.length > 0 : v.kind === "text" ? !!v.q : !!(v.min || v.max)
  ).length;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-root", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "cl-header", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "cl-header-row", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-header-left", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "cl-header-accent" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
        isRenaming ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
        ) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "cl-subtitle", children: displayedClients.length > PAGE_SIZE3 ? `${(page * PAGE_SIZE3 + 1).toLocaleString()}\u2013${Math.min((page + 1) * PAGE_SIZE3, displayedClients.length).toLocaleString()} of ${displayedClients.length.toLocaleString()} records` : `${displayedClients.length.toLocaleString()} record${displayedClients.length !== 1 ? "s" : ""}` })
      ] })
    ] }) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-toolbar-row", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-toolbar", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "cl-toolbar-seg", children: allViews.map((view) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-toolbar-view-item", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              className: "cl-seg-btn" + (activeViewId === view.id ? " active" : ""),
              onClick: () => applyView(view),
              children: view.name
            }
          ),
          !view.builtIn && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              className: "cl-seg-delete",
              title: "Delete view",
              onClick: () => handleDeleteView(view.id),
              children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { width: "8", height: "8", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 3, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) })
            }
          )
        ] }, view.id)) }),
        showSaveView ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-toolbar-save-wrap", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "cl-toolbar-save-confirm", onClick: handleSaveView, disabled: savingView || !newViewName.trim(), children: savingView ? "\u2026" : "Save" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "cl-toolbar-save-cancel", onClick: () => {
            setShowSaveView(false);
            setNewViewName("");
          }, children: "Cancel" })
        ] }) : onSaveView && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { className: "cl-seg-add", onClick: () => setShowSaveView(true), children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { width: "10", height: "10", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 4.5v15m7.5-7.5h-15" }) }),
          "Save view"
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-action-bar", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-action-wrap", ref: colPickerRef, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              className: "cl-action-btn" + (showColPicker ? " active" : ""),
              onClick: () => setShowColPicker((p) => !p),
              title: "Show / hide columns",
              children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { width: "15", height: "15", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 4H5a1 1 0 00-1 1v14a1 1 0 001 1h4M9 4v16M9 4h6M9 20h6m0-16h4a1 1 0 011 1v14a1 1 0 01-1 1h-4M15 4v16" }) })
            }
          ),
          showColPicker && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-export-menu cl-col-picker-menu", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-export-menu-header", style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "cl-export-menu-title", children: "Show / Hide Columns" }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-export-menu-sub", children: [
                  colVisible === null ? pickableCols.length : colVisible.length,
                  " of ",
                  pickableCols.length,
                  " shown"
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "cl-col-picker-reset", onClick: () => setColVisible(null), children: "Reset" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "cl-col-picker-body", children: pickableCols.map((col) => {
              const checked = colVisible === null || colVisible.includes(col.key);
              return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "cl-col-picker-row", children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { type: "checkbox", checked, onChange: () => togglePickerCol(col.key) }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: col.label })
              ] }, col.key);
            }) })
          ] })
        ] }),
        (isPrivileged || canView("export")) && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-action-wrap", ref: exportRef, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              className: "cl-action-btn" + (showExport ? " active" : ""),
              onClick: () => setShowExport((p) => !p),
              disabled: displayedClients.length === 0,
              title: "Export to CSV",
              children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { width: "15", height: "15", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" }) })
            }
          ),
          showExport && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-export-menu", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-export-menu-header", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "cl-export-menu-title", children: "Export to CSV" }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "cl-export-menu-sub", children: "Exports all currently filtered records" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "cl-export-menu-body", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "cl-export-dl-btn", onClick: exportCSV, children: "Download" }) })
          ] })
        ] }),
        isPrivileged && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "button",
          {
            className: "cl-action-btn" + (showPermissions ? " active" : ""),
            onClick: openPermissionsEditor,
            title: "Manage column permissions",
            children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("svg", { width: "15", height: "15", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" })
            ] })
          }
        )
      ] })
    ] }),
    renderPermissionsEditor(),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-search-area", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-search-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-search-wrap", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { className: "cl-search-icon", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "input",
            {
              className: "cl-search-input",
              type: "text",
              placeholder: "Search by name, phone, app #, carrier, state, notes\u2026",
              value: searchText,
              onChange: (e) => setSearchText(e.target.value)
            }
          ),
          searchText && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "cl-search-clear", onClick: () => setSearchText(""), children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { width: "14", height: "14", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
          "button",
          {
            className: "cl-filter-toggle" + (showFilterBuilder || activeFilterCount > 0 ? " active" : ""),
            onClick: () => setShowFilterBuilder((p) => !p),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { width: "14", height: "14", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { fillRule: "evenodd", d: "M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L13 10.414V17a1 1 0 01-1.447.894l-4-2A1 1 0 017 15v-4.586L3.293 6.707A1 1 0 013 6V3z", clipRule: "evenodd" }) }),
              "Filter",
              activeFilterCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "cl-filter-toggle-count", children: activeFilterCount })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-day-seg", children: [
        ["M", "T", "W", "T", "F", "S", "S"].map((label, i) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "button",
          {
            className: "cl-day-btn" + (dayFilter === weekDays[i] ? " active" : ""),
            onClick: () => setDayFilter(dayFilter === weekDays[i] ? null : weekDays[i]),
            title: weekDays[i],
            children: label
          },
          weekDays[i]
        )),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "cl-day-sep" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { ref: weekPickerRef, style: { position: "relative" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
            "button",
            {
              className: "cl-day-btn cl-day-week-btn cl-day-week-pick" + (dayFilter === "week" || (dayFilter?.startsWith("week:") ?? false) ? " active" : ""),
              onClick: () => setShowWeekPicker((p) => !p),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: dayFilter?.startsWith("week:") ? (() => {
                  const [, mo, da] = dayFilter.slice(5).split("-");
                  return `${mo}/${da}`;
                })() : "Week" }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { width: "9", height: "9", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 3, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-7 7-7-7" }) })
              ]
            }
          ),
          showWeekPicker && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "cl-week-dropdown", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "button",
          {
            className: "cl-day-btn cl-day-week-btn" + (dayFilter === null ? " active" : ""),
            onClick: () => setDayFilter(null),
            children: "All"
          }
        ),
        uniqueCarriers.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "cl-day-sep" }),
        uniqueCarriers.map((carrier) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
    showFilterBuilder && activeFilterCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-active-filters", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "cl-active-filters-label", children: "Column filters:" }),
      Object.entries(filters).map(([col, spec]) => {
        const colDef = COLUMNS.find((c) => c.key === col);
        const name = colDef?.label || col;
        let chip = "";
        if (spec.kind === "enum" && spec.values.length) chip = spec.values.length > 1 ? `${name}: ${spec.values.length} selected` : `${name}: ${spec.values[0]}`;
        if (spec.kind === "text" && spec.q) chip = `${name}: ~${spec.q}`;
        if (spec.kind === "range" && (spec.min || spec.max)) chip = `${name}: ${spec.min ?? ""}\u2013${spec.max ?? ""}`;
        if (!chip) return null;
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "cl-filter-chip", children: [
          chip,
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "cl-filter-chip-remove", onClick: () => setFilterRows((prev) => prev.filter((r) => r.field !== col)), children: "\xD7" })
        ] }, col);
      }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "cl-filter-clear-all", onClick: () => setFilterRows([]), children: "Clear all" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-table-area", children: [
      displayedClients.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-table-wrap", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "cl-table-scroll", ref: tableScrollRef, onScroll: syncHThumb, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("table", { className: "cl-table", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("thead", { className: "cl-thead", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("tr", { children: [
            visibleColDefs.map((col) => {
              const isSorted = sortField === col.key;
              const isDragging = dragCol === col.key;
              const isDragOver = dragOverCol === col.key && dragCol !== col.key;
              const spec = filters[col.key];
              const isFiltered = spec ? spec.kind === "enum" ? spec.values.length > 0 : spec.kind === "text" ? !!spec.q : !!(spec.min || spec.max) : false;
              return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
                  children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-th-inner", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
                        children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("svg", { width: "12", height: "12", fill: "currentColor", viewBox: "0 0 16 16", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "5", cy: "4", r: "1.5" }),
                          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "11", cy: "4", r: "1.5" }),
                          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "5", cy: "8", r: "1.5" }),
                          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "11", cy: "8", r: "1.5" }),
                          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "5", cy: "12", r: "1.5" }),
                          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "11", cy: "12", r: "1.5" })
                        ] })
                      }
                    ),
                    col.sortable ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { className: "cl-sort-btn" + (isSorted ? " sorted" : ""), onClick: () => handleSort(col.key), children: [
                      col.label,
                      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "cl-sort-arrow" + (isSorted ? "" : " unsorted"), children: isSorted ? sortDir === "asc" ? "\u2191" : "\u2193" : "\u2195" })
                    ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: col.label }),
                    isFiltered && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "cl-filter-count", children: "\u25CF" })
                  ] })
                },
                col.key
              );
            }),
            showActions && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { className: "cl-th-actions", children: "Actions" })
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("tbody", { children: [
            pendingRows.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("tr", { className: "cl-tr-section pending-section", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { colSpan: totalColSpan, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-section-label", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "cl-section-dot pulse", style: { background: "var(--cl-amber)" } }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "cl-section-title", style: { color: "var(--cl-amber)" }, children: "Unclaimed" }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "cl-section-count", children: [
                pendingRows.length,
                " waiting"
              ] })
            ] }) }) }),
            pendingRows.map((client) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("tr", { className: "cl-tr pending", children: [
              visibleColDefs.map((col) => renderCell(col, client)),
              showActions && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: "cl-td-actions", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { className: "cl-btn-claim", onClick: () => handleClaim(client), disabled: busy.has(client.id), children: [
                busy.has(client.id) ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Spinner, {}) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { width: "12", height: "12", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) }),
                busy.has(client.id) ? "\u2026" : "Claim"
              ] }) })
            ] }, client.id)),
            claimedRows.length > 0 && pendingRows.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("tr", { className: "cl-tr-section claimed-section", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { colSpan: totalColSpan, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-section-label", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "cl-section-dot", style: { background: "var(--cl-green)" } }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "cl-section-title", style: { color: "var(--cl-green)" }, children: "Claimed" }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "cl-section-count", children: [
                claimedRows.length,
                hasMore ? "+" : ""
              ] })
            ] }) }) }),
            claimedRows.map((client) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("tr", { className: "cl-tr", children: [
              visibleColDefs.map((col) => renderCell(col, client)),
              showActions && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: "cl-td-actions", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { className: "cl-btn-unclaim", onClick: () => handleUnclaim(client), disabled: busy.has(client.id), children: [
                busy.has(client.id) ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Spinner, {}) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { width: "12", height: "12", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) }),
                busy.has(client.id) ? "\u2026" : "Unclaim"
              ] }) })
            ] }, client.id))
          ] })
        ] }) }),
        hThumb.show && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-hscroll-bar", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "cl-scroll-left-btn", onClick: scrollToLeft, title: "Scroll to start", children: "\u2039" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "cl-hscroll-track", ref: hScrollTrackRef, onMouseDown: onTrackClick, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "div",
            {
              className: "cl-hscroll-thumb",
              style: { left: hThumb.left, width: hThumb.width },
              onMouseDown: onThumbMouseDown,
              onClick: (e) => e.stopPropagation()
            }
          ) })
        ] })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-empty", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "cl-empty-icon", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { width: "28", height: "28", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, style: { color: "var(--cl-text-4)" }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) }) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "cl-empty-title", children: "No records found" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "cl-empty-sub", children: "Try adjusting your search or filters." })
      ] }),
      totalPages > 1 && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "cl-pagination", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
          "button",
          {
            className: "cl-page-btn",
            onClick: () => setPage((p) => p - 1),
            disabled: page === 0,
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { width: "12", height: "12", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 19l-7-7 7-7" }) }),
              "Prev"
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "cl-page-info", children: [
          "Page ",
          page + 1,
          " of ",
          totalPages
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
          "button",
          {
            className: "cl-page-btn",
            onClick: () => setPage((p) => p + 1),
            disabled: page >= totalPages - 1,
            children: [
              "Next",
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { width: "12", height: "12", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 5l7 7-7 7" }) })
            ]
          }
        )
      ] })
    ] })
  ] });
}

// OdsPanel.tsx
var import_react3 = require("react");
var import_app2 = require("firebase/app");
var import_firestore2 = require("firebase/firestore");
var import_storage = require("firebase/storage");

// hooks/useClientList.ts
var import_react2 = require("react");
var import_app = require("firebase/app");
var import_firestore = require("firebase/firestore");

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
function getDB() {
  return (0, import_firestore.getFirestore)((0, import_app.getApp)());
}
var PAGE_SIZE = 30;
function useClientList(collectionId) {
  const firestore = getDB();
  const [clients, setClients] = (0, import_react2.useState)([]);
  const [views, setViews] = (0, import_react2.useState)([]);
  const [permissions, setPermissions] = (0, import_react2.useState)(DEFAULT_PERMISSIONS);
  const [listTitle, setListTitle] = (0, import_react2.useState)(collectionId);
  const [loading, setLoading] = (0, import_react2.useState)(true);
  const [hasMore, setHasMore] = (0, import_react2.useState)(false);
  const [pageLimit, setPageLimit] = (0, import_react2.useState)(PAGE_SIZE);
  const loadingMore = (0, import_react2.useRef)(false);
  (0, import_react2.useEffect)(() => {
    const q = (0, import_firestore.query)(
      (0, import_firestore.collection)(firestore, collectionId),
      (0, import_firestore.orderBy)("date", "desc"),
      (0, import_firestore.limit)(pageLimit + 1)
    );
    const unsub = (0, import_firestore.onSnapshot)(q, (snap) => {
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
  (0, import_react2.useEffect)(() => {
    const viewsRef = (0, import_firestore.collection)(firestore, collectionId, "_meta", "_views");
    const unsub = (0, import_firestore.onSnapshot)(viewsRef, (snap) => {
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
  (0, import_react2.useEffect)(() => {
    const permRef = (0, import_firestore.doc)(firestore, PERMISSIONS_COLLECTION, collectionId);
    const unsub = (0, import_firestore.onSnapshot)(permRef, (snap) => {
      if (snap.exists()) setPermissions(snap.data());
    }, () => {
    });
    return () => unsub();
  }, [collectionId, firestore]);
  const onSave = (0, import_react2.useCallback)(async (id, field, value, updaterName, fromValue) => {
    const docRef = (0, import_firestore.doc)(firestore, collectionId, id);
    const changeEntry = {
      at: { seconds: Math.floor(Date.now() / 1e3) },
      by: updaterName,
      field,
      from: String(fromValue ?? ""),
      to: String(value)
    };
    await (0, import_firestore.updateDoc)(docRef, {
      [field]: value,
      updatedAt: (0, import_firestore.serverTimestamp)(),
      updatedByName: updaterName,
      changeLog: (0, import_firestore.arrayUnion)(changeEntry)
    });
  }, [collectionId, firestore]);
  const onSaveView = (0, import_react2.useCallback)(async (view) => {
    const viewsRef = (0, import_firestore.collection)(firestore, collectionId, "_meta", "_views");
    const docRef = await (0, import_firestore.addDoc)(viewsRef, { ...view, createdAt: (0, import_firestore.serverTimestamp)() });
    return docRef.id;
  }, [collectionId, firestore]);
  const onDeleteView = (0, import_react2.useCallback)(async (id) => {
    const viewRef = (0, import_firestore.doc)(firestore, collectionId, "_meta", "_views", id);
    await (0, import_firestore.deleteDoc)(viewRef);
  }, [collectionId, firestore]);
  const onRenameList = (0, import_react2.useCallback)(async (name) => {
    const metaRef = (0, import_firestore.doc)(firestore, collectionId, "_meta");
    await (0, import_firestore.setDoc)(metaRef, { title: name }, { merge: true });
    setListTitle(name);
  }, [collectionId, firestore]);
  const onSavePermissions = (0, import_react2.useCallback)(async (matrix) => {
    const permRef = (0, import_firestore.doc)(firestore, PERMISSIONS_COLLECTION, collectionId);
    await (0, import_firestore.setDoc)(permRef, matrix);
    setPermissions(matrix);
  }, [collectionId, firestore]);
  const onLoadMore = (0, import_react2.useCallback)(async () => {
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

// OdsPanel.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
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
    background: "#111827",
    borderLeft: "1px solid #1f2937",
    display: "flex",
    flexDirection: "column",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
    overflowY: "hidden"
  },
  drawerHeader: {
    padding: "20px 24px",
    borderBottom: "1px solid #1f2937",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
    flexShrink: 0
  },
  drawerBody: { flex: 1, overflowY: "auto", padding: "20px 24px" },
  drawerFooter: {
    padding: "14px 24px",
    borderTop: "1px solid #1f2937",
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end",
    flexShrink: 0
  },
  label: {
    display: "block",
    fontSize: "11px",
    fontWeight: 600,
    color: "#9ca3af",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    marginBottom: "6px"
  },
  input: {
    width: "100%",
    padding: "9px 12px",
    background: "#1f2937",
    border: "1px solid #374151",
    borderRadius: "8px",
    color: "#f9fafb",
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
    color: "#9ca3af",
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
    color: "#9ca3af",
    border: "1px solid #374151",
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
    background: "#0a0f1a",
    borderBottom: "1px solid #1e293b",
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
    background: "#1f2937",
    border: "1px dashed #4b5563",
    borderRadius: "8px",
    color: "#d1d5db",
    fontSize: "12px",
    cursor: "pointer",
    fontFamily: "inherit"
  },
  fileName: { fontSize: "11px", color: "#6b7280", marginTop: "4px" }
};
function getDB2() {
  return (0, import_firestore2.getFirestore)((0, import_app2.getApp)());
}
function getStore() {
  return (0, import_storage.getStorage)((0, import_app2.getApp)());
}
async function seedPermissionsIfAbsent(collectionId) {
  const db = getDB2();
  const permRef = (0, import_firestore2.doc)(db, "permissions", collectionId);
  const snap = await (0, import_firestore2.getDoc)(permRef);
  if (!snap.exists()) {
    const matrix = {
      rep: { ...DEFAULT_PERMISSIONS.rep },
      manager: { ...DEFAULT_PERMISSIONS.manager },
      admin: { ...DEFAULT_PERMISSIONS.admin }
    };
    await (0, import_firestore2.setDoc)(permRef, matrix);
  }
}
function AddDrawer({ fields, title, onClose, onSubmit }) {
  const initial = Object.fromEntries(
    fields.map((f) => [f.key, f.defaultValue ?? (f.type === "checkbox" ? "false" : "")])
  );
  const [values, setValues] = (0, import_react3.useState)(initial);
  const [files, setFiles] = (0, import_react3.useState)({});
  const [saving, setSaving] = (0, import_react3.useState)(false);
  const [error, setError] = (0, import_react3.useState)("");
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
        return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
          "select",
          {
            value: val,
            onChange: (e) => set(field.key, e.target.value),
            style: { ...S.input, cursor: "pointer" },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: "", children: "Select\u2026" }),
              field.options?.map((o) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: o, children: o }, o))
            ]
          }
        );
      case "checkbox":
        return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { style: { display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            "input",
            {
              type: "checkbox",
              checked: val === "true",
              onChange: (e) => set(field.key, e.target.checked ? "true" : "false"),
              style: { width: "16px", height: "16px", accentColor: "#3b82f6" }
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { fontSize: "13px", color: "#d1d5db" }, children: "Yes" })
        ] });
      case "currency":
        return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: S.currencyWrap, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: S.currencyPrefix, children: "$" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
        return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
        return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
        return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { style: S.fileBtn, children: [
            files[field.key] ? "Change file" : "Choose file",
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
          files[field.key] && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: S.fileName, children: files[field.key].name })
        ] });
      default:
        return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: S.overlay, onClick: (e) => e.target === e.currentTarget && onClose(), children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: S.drawer, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: S.drawerHeader, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { fontSize: "15px", fontWeight: 700, color: "#f9fafb" }, children: [
          "Add ",
          title
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { fontSize: "11px", color: "#6b7280", marginTop: "3px" }, children: "Appears in the list immediately after saving" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "button",
        {
          onClick: onClose,
          style: { background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: "20px", lineHeight: 1, padding: "0 4px" },
          children: "\xD7"
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("form", { onSubmit: handleSubmit, style: { display: "contents" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: S.drawerBody, children: [
        error && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: S.errorBox, children: error }),
        fields.map((f) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: S.fieldGroup, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { style: S.label, children: [
            f.label,
            f.required && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { color: "#ef4444", marginLeft: "3px" }, children: "*" })
          ] }),
          renderField(f)
        ] }, f.key))
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: S.drawerFooter, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", onClick: onClose, style: S.btnGhost, children: "Cancel" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "submit", style: { ...S.btnPrimary, opacity: saving ? 0.65 : 1 }, disabled: saving, children: saving ? "Saving\u2026" : `Add ${title}` })
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
  transformRecord
}) {
  const [drawerOpen, setDrawerOpen] = (0, import_react3.useState)(false);
  const listProps = useClientList(collectionId);
  (0, import_react3.useEffect)(() => {
    seedPermissionsIfAbsent(collectionId).catch(console.error);
  }, [collectionId]);
  const handleAdd = (0, import_react3.useCallback)(async (values, files) => {
    const db = getDB2();
    const storage = getStore();
    const fileUrls = {};
    for (const [key, file] of Object.entries(files)) {
      const fieldDef = fields.find((f) => f.key === key);
      const basePath = fieldDef?.storagePath ?? collectionId;
      const storageRef = (0, import_storage.ref)(storage, `${basePath}/${Date.now()}-${file.name}`);
      await (0, import_storage.uploadBytes)(storageRef, file);
      fileUrls[key] = await (0, import_storage.getDownloadURL)(storageRef);
    }
    const coerced = { ...values };
    for (const f of fields) {
      if ((f.type === "number" || f.type === "currency") && values[f.key]) {
        coerced[f.key] = parseFloat(values[f.key]) || 0;
      }
    }
    const base = transformRecord ? transformRecord(values, fileUrls) : { ...coerced, ...fileUrls };
    await (0, import_firestore2.addDoc)((0, import_firestore2.collection)(db, collectionId), {
      ...base,
      date: base.date ?? (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      createdAt: (0, import_firestore2.serverTimestamp)(),
      createdBy: uid3,
      createdByName: userName
    });
  }, [collectionId, fields, uid3, userName, transformRecord]);
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", flexDirection: "column", height: "100%", background: "#030712" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: S.toolbar, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { display: "flex", alignItems: "center", gap: "10px" }, children: subtitle && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { fontSize: "11px", color: "#4b5563", letterSpacing: "0.04em" }, children: subtitle }) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { style: S.addBtn, onClick: () => setDrawerOpen(true), children: [
        "+ Add ",
        title
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      ClientList,
      {
        ...listProps,
        uid: uid3,
        userName,
        isAdmin,
        currentRole
      }
    ) }),
    drawerOpen && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
var import_react4 = require("react");
var import_jsx_runtime4 = require("react/jsx-runtime");
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
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
    "path",
    {
      d: "M12 2L13.5 9.5L21 12L13.5 14.5L12 22L10.5 14.5L3 12L10.5 9.5L12 2Z",
      fill: color
    }
  ) });
}
function FieldLabel({ children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "text-[11px] text-gray-500 font-medium uppercase tracking-wider", children });
}
function ReceiptScanner({
  receipts,
  processReceipt,
  onSave,
  onDelete,
  className = ""
}) {
  const [stage, setStage] = (0, import_react4.useState)("idle");
  const [dragOver, setDragOver] = (0, import_react4.useState)(false);
  const [error, setError] = (0, import_react4.useState)(null);
  const [form, setForm] = (0, import_react4.useState)(blankForm());
  const [preview, setPreview] = (0, import_react4.useState)(null);
  const fileRef = (0, import_react4.useRef)(null);
  function setField(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }
  function recalcTotal(partial = {}) {
    setForm((f) => {
      const m = { ...f, ...partial };
      return { ...m, total: +(m.subtotal + m.tax + m.tip).toFixed(2) };
    });
  }
  const handleFile = (0, import_react4.useCallback)(
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
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: `space-y-6 ${className}`, children: [
    (stage === "idle" || stage === "processing") && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
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
          stage === "processing" ? "border-violet-700 bg-violet-950/20 cursor-default" : dragOver ? "border-violet-500 bg-violet-950/30 cursor-copy" : "border-gray-700 bg-gray-900/50 hover:border-gray-600 hover:bg-gray-900 cursor-pointer"
        ].join(" "),
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            "input",
            {
              ref: fileRef,
              type: "file",
              accept: "image/jpeg,image/png,image/webp,image/gif,application/pdf",
              className: "hidden",
              onChange: onInputChange
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "flex flex-col items-center justify-center py-14 px-6 text-center", children: stage === "processing" ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "relative w-14 h-14 mb-5", children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "absolute inset-0 rounded-full border-4 border-violet-900" }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "absolute inset-0 rounded-full border-4 border-t-violet-400 animate-spin" }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "absolute inset-0 flex items-center justify-center", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(GeminiStar, { size: 20 }) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "text-white font-medium text-sm", children: "Gemini is reading your receipt\u2026" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "text-gray-500 text-xs mt-1", children: "This usually takes a few seconds" })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "w-12 h-12 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center mb-4", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
              "svg",
              {
                className: "w-6 h-6 text-gray-400",
                fill: "none",
                viewBox: "0 0 24 24",
                stroke: "currentColor",
                strokeWidth: 1.5,
                children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                  "path",
                  {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    d: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  }
                )
              }
            ) }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "text-white font-medium text-sm mb-1", children: "Drop a receipt here or click to upload" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "text-gray-500 text-xs mb-4", children: "JPG, PNG, WebP, or PDF \u2014 Gemini extracts the details" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "inline-flex items-center gap-1.5 text-xs text-violet-400 font-medium", children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(GeminiStar, { size: 11 }),
              "Powered by Gemini"
            ] })
          ] }) })
        ]
      }
    ),
    error && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex items-start gap-3 bg-red-950/30 border border-red-800/60 rounded-xl px-4 py-3", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        "svg",
        {
          className: "w-4 h-4 text-red-400 shrink-0 mt-0.5",
          fill: "none",
          viewBox: "0 0 24 24",
          stroke: "currentColor",
          strokeWidth: 2,
          children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            "path",
            {
              strokeLinecap: "round",
              strokeLinejoin: "round",
              d: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"
            }
          )
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "text-red-400 text-xs leading-relaxed", children: error })
    ] }),
    (stage === "review" || stage === "saving") && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex items-center justify-between px-5 py-4 border-b border-gray-800", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex items-center gap-2.5", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "w-7 h-7 rounded-lg bg-violet-900/50 border border-violet-800/60 flex items-center justify-center", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(GeminiStar, { size: 13 }) }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "text-white font-semibold text-sm", children: "Review & confirm" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "text-xs text-gray-500 hidden sm:block", children: "Edit anything Gemini got wrong" })
        ] }),
        preview && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "img",
          {
            src: preview,
            alt: "Receipt preview",
            className: "h-10 w-8 object-cover rounded-md border border-gray-700 opacity-70 hover:opacity-100 transition-opacity"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "p-5 space-y-5", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("label", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(FieldLabel, { children: "Merchant" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
              "input",
              {
                type: "text",
                value: form.merchant,
                onChange: (e) => setField("merchant", e.target.value),
                placeholder: "Store or vendor name",
                className: "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600/30 transition"
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("label", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(FieldLabel, { children: "Date" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
              "input",
              {
                type: "date",
                value: form.date,
                onChange: (e) => setField("date", e.target.value),
                className: "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600/30 transition [color-scheme:dark]"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("label", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(FieldLabel, { children: "Category" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
              "select",
              {
                value: form.category,
                onChange: (e) => setField("category", e.target.value),
                className: "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600/30 transition",
                children: CATEGORIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: c, children: c }, c))
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("label", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(FieldLabel, { children: "Payment method" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
              "select",
              {
                value: form.paymentMethod,
                onChange: (e) => setField("paymentMethod", e.target.value),
                className: "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600/30 transition",
                children: PAYMENT_METHODS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: p, children: p }, p))
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-4", children: [
          ["subtotal", "tax", "tip"].map((k) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("label", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(FieldLabel, { children: k }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "relative", children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none", children: "$" }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                "input",
                {
                  type: "number",
                  min: "0",
                  step: "0.01",
                  value: form[k] || "",
                  onChange: (e) => recalcTotal({ [k]: parseFloat(e.target.value) || 0 }),
                  className: "w-full bg-gray-800 border border-gray-700 rounded-lg pl-6 pr-3 py-2 text-white text-sm focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600/30 transition"
                }
              )
            ] })
          ] }, k)),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("label", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(FieldLabel, { children: "Total" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "relative", children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none", children: "$" }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                "input",
                {
                  type: "number",
                  min: "0",
                  step: "0.01",
                  value: form.total || "",
                  onChange: (e) => setField("total", parseFloat(e.target.value) || 0),
                  className: "w-full bg-gray-800 border border-gray-700 rounded-lg pl-6 pr-3 py-2 text-white font-semibold text-sm focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600/30 transition"
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex items-center justify-between mb-2", children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(FieldLabel, { children: "Line items" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
              "button",
              {
                type: "button",
                onClick: addItem,
                className: "text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors flex items-center gap-1",
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                    "svg",
                    {
                      className: "w-3 h-3",
                      fill: "none",
                      viewBox: "0 0 24 24",
                      stroke: "currentColor",
                      strokeWidth: 2.5,
                      children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
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
          form.items.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "rounded-xl border border-gray-800 overflow-hidden", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("table", { className: "w-full text-xs", children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("tr", { className: "border-b border-gray-800", children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("th", { className: "text-left text-gray-500 font-medium px-3 py-2 w-full", children: "Description" }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("th", { className: "text-right text-gray-500 font-medium px-3 py-2 whitespace-nowrap", children: "Qty" }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("th", { className: "text-right text-gray-500 font-medium px-3 py-2 whitespace-nowrap", children: "Unit $" }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("th", { className: "text-right text-gray-500 font-medium px-3 py-2 whitespace-nowrap", children: "Total" }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("th", { className: "px-2 py-2 w-6" })
            ] }) }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("tbody", { children: form.items.map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
              "tr",
              {
                className: i < form.items.length - 1 ? "border-b border-gray-800/60" : "",
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("td", { className: "px-2 py-1.5", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                    "input",
                    {
                      type: "text",
                      value: item.description,
                      onChange: (e) => updateItem(item.id, "description", e.target.value),
                      placeholder: "Item description",
                      className: "w-full bg-transparent text-white placeholder:text-gray-600 focus:outline-none focus:bg-gray-800 rounded px-1 py-0.5 transition-colors"
                    }
                  ) }),
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("td", { className: "px-2 py-1.5", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
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
                      className: "w-14 text-right bg-transparent text-white focus:outline-none focus:bg-gray-800 rounded px-1 py-0.5 transition-colors"
                    }
                  ) }),
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("td", { className: "px-2 py-1.5", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
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
                      className: "w-20 text-right bg-transparent text-white focus:outline-none focus:bg-gray-800 rounded px-1 py-0.5 transition-colors"
                    }
                  ) }),
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("td", { className: "px-3 py-1.5 text-right text-gray-300 tabular-nums", children: [
                    "$",
                    item.total.toFixed(2)
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("td", { className: "px-2 py-1.5", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                    "button",
                    {
                      type: "button",
                      onClick: () => removeItem(item.id),
                      className: "text-gray-600 hover:text-red-400 transition-colors",
                      children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                        "svg",
                        {
                          className: "w-3.5 h-3.5",
                          fill: "none",
                          viewBox: "0 0 24 24",
                          stroke: "currentColor",
                          strokeWidth: 2,
                          children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
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
          ] }) }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "text-gray-600 text-xs italic py-2", children: "No line items detected \u2014 add them manually if needed." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("label", { className: "flex flex-col gap-1.5", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(FieldLabel, { children: "Notes" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            "textarea",
            {
              value: form.notes,
              onChange: (e) => setField("notes", e.target.value),
              placeholder: "Any additional notes\u2026",
              rows: 2,
              className: "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600/30 transition resize-none"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex items-center justify-between px-5 py-4 border-t border-gray-800 bg-gray-950/30", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "button",
          {
            type: "button",
            onClick: handleCancel,
            disabled: stage === "saving",
            className: "text-sm text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-40",
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
          "button",
          {
            type: "button",
            onClick: handleSave,
            disabled: stage === "saving",
            className: "inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors",
            children: [
              stage === "saving" && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("svg", { className: "w-4 h-4 animate-spin", fill: "none", viewBox: "0 0 24 24", children: [
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
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
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
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
var import_react5 = require("react");
var import_jsx_runtime5 = require("react/jsx-runtime");
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
var COLUMNS2 = [
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
var EDITABLE_COLS2 = /* @__PURE__ */ new Set([
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
    const col = COLUMNS2.find((c) => c.key === row.field);
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
  const cols = COLUMNS2.filter((c) => visibleKeys.includes(c.key));
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
function PencilIcon2() {
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("svg", { className: "cl-pencil", width: "11", height: "11", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" }) });
}
function CellInput2({ type, initialValue, options, onSave, onCancel }) {
  const [val, setVal] = (0, import_react5.useState)(initialValue);
  if (type === "select" && options) {
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
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
        children: options.map((o) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: o, children: o }, o))
      }
    );
  }
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "cl-cell-edit-wrap", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
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
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "cl-cell-actions", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { className: "cl-cell-cancel-btn", onMouseDown: (e) => e.preventDefault(), onClick: onCancel, title: "Cancel (Esc)", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("svg", { width: "9", height: "9", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 3.5, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { className: "cl-cell-confirm-btn", onMouseDown: (e) => e.preventDefault(), onClick: () => onSave(val), title: "Save (Enter)", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("svg", { width: "9", height: "9", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 3.5, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 13l4 4L19 7" }) }) })
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
  const [colOrder, setColOrder] = (0, import_react5.useState)(COLUMNS2.map((c) => c.key));
  const [colVisible, setColVisible] = (0, import_react5.useState)(DEFAULT_VISIBLE);
  const [showColPicker, setShowColPicker] = (0, import_react5.useState)(false);
  const [showExport, setShowExport] = (0, import_react5.useState)(false);
  const colPickerRef = (0, import_react5.useRef)(null);
  const exportRef = (0, import_react5.useRef)(null);
  const [sortField, setSortField] = (0, import_react5.useState)("date");
  const [sortDir, setSortDir] = (0, import_react5.useState)("desc");
  const [searchText, setSearchText] = (0, import_react5.useState)("");
  const [filterRows, setFilterRows] = (0, import_react5.useState)([]);
  const [showFilterBuilder, setShowFilterBuilder] = (0, import_react5.useState)(false);
  const uidRef = (0, import_react5.useRef)(0);
  function newId() {
    return String(++uidRef.current);
  }
  const [editingCell, setEditingCell] = (0, import_react5.useState)(null);
  const [dragCol, setDragCol] = (0, import_react5.useState)(null);
  const [dragOverCol, setDragOverCol] = (0, import_react5.useState)(null);
  const [page, setPage] = (0, import_react5.useState)(0);
  const tableScrollRef = (0, import_react5.useRef)(null);
  const hScrollTrackRef = (0, import_react5.useRef)(null);
  const [hThumb, setHThumb] = (0, import_react5.useState)({ show: false, left: 0, width: 0 });
  const thumbDragging = (0, import_react5.useRef)(false);
  const thumbStartX = (0, import_react5.useRef)(0);
  const thumbStartLeft = (0, import_react5.useRef)(0);
  (0, import_react5.useEffect)(() => {
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
  (0, import_react5.useEffect)(() => {
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
  const filterSpecs = (0, import_react5.useMemo)(() => filterRowsToSpecs2(filterRows), [filterRows]);
  const filteredReceipts = (0, import_react5.useMemo)(() => {
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
  const visibleColDefs = (0, import_react5.useMemo)(
    () => colOrder.map((k) => COLUMNS2.find((c) => c.key === k)).filter((c) => c && (colVisible === null || colVisible.includes(c.key))),
    [colOrder, colVisible]
  );
  const totals = (0, import_react5.useMemo)(() => ({
    total: filteredReceipts.reduce((s, r) => s + (r.total ?? 0), 0),
    subtotal: filteredReceipts.reduce((s, r) => s + (r.subtotal ?? 0), 0),
    tax: filteredReceipts.reduce((s, r) => s + (r.tax ?? 0), 0),
    tip: filteredReceipts.reduce((s, r) => s + (r.tip ?? 0), 0)
  }), [filteredReceipts]);
  const activeFilterCount = (0, import_react5.useMemo)(
    () => Object.values(filterSpecs).filter(
      (v) => v.kind === "enum" ? v.values.length > 0 : v.kind === "text" ? !!v.q : !!(v.min || v.max)
    ).length,
    [filterSpecs]
  );
  const pickableCols = COLUMNS2.filter((c) => !c.noFilter || c.key !== "items");
  function handleSort(key) {
    if (sortField === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else {
      setSortField(key);
      setSortDir("asc");
    }
    setPage(0);
  }
  function addFilterRow() {
    const first = COLUMNS2.find((c) => !c.noFilter);
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
      const current = prev ?? COLUMNS2.map((c) => c.key);
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
    const canEdit = !!onSave && EDITABLE_COLS2.has(col.key);
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
      return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("td", { className: "cl-td", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
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
        content = /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: { fontWeight: 600 }, children: fmtMoney(r.total) });
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
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("td", { className: "cl-td", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
      "div",
      {
        className: "cl-cell-inner" + (canEdit ? " cl-cell-editable" : ""),
        onClick: () => canEdit && setEditingCell({ id: r.id, field: col.key }),
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "cl-cell-value", children: content }),
          canEdit && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(PencilIcon2, {})
        ]
      }
    ) }, col.key);
  }
  function renderFilterBuilder() {
    if (!showFilterBuilder) return null;
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "cl-filter-builder", children: [
      filterRows.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "cl-fb-empty", children: 'No filters \u2014 click "Add filter" to start.' }),
      filterRows.map((row) => {
        const col = COLUMNS2.find((c) => c.key === row.field);
        const ft = col?.filterType ?? "text";
        const ops = getOperators2(ft);
        const enumVals = ft === "enum" ? getEnumValues(receipts, row.field) : [];
        return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "cl-fb-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "cl-fb-where", children: "Where" }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
            "select",
            {
              className: "cl-fb-select",
              value: row.field,
              onChange: (e) => {
                const nc = COLUMNS2.find((c) => c.key === e.target.value);
                updateFilterRow(row.id, { field: e.target.value, operator: getOperators2(nc?.filterType)[0], value: "", value2: "" });
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: "", children: "Select field\u2026" }),
                COLUMNS2.filter((c) => !c.noFilter).map((c) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: c.key, children: c.label }, c.key))
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
            "select",
            {
              className: "cl-fb-select cl-fb-select-op",
              value: row.operator,
              onChange: (e) => updateFilterRow(row.id, { operator: e.target.value, value: "", value2: "" }),
              children: ops.map((o) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: o, children: o }, o))
            }
          ),
          ft === "enum" ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
            "select",
            {
              className: "cl-fb-select cl-fb-select-val",
              value: row.value,
              onChange: (e) => updateFilterRow(row.id, { value: e.target.value }),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: "", children: "Select\u2026" }),
                enumVals.map((v) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: v, children: v }, v))
              ]
            }
          ) : row.operator === "between" ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
              "input",
              {
                className: "cl-fb-input",
                type: ft === "date" ? "date" : "number",
                placeholder: "From",
                value: row.value,
                onChange: (e) => updateFilterRow(row.id, { value: e.target.value })
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "cl-fb-and", children: "and" }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
              "input",
              {
                className: "cl-fb-input",
                type: ft === "date" ? "date" : "number",
                placeholder: "To",
                value: row.value2,
                onChange: (e) => updateFilterRow(row.id, { value2: e.target.value })
              }
            )
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
            "input",
            {
              className: "cl-fb-input cl-fb-input-wide",
              type: ft === "date" ? "date" : ft === "number" ? "number" : "text",
              placeholder: "Value\u2026",
              value: row.value,
              onChange: (e) => updateFilterRow(row.id, { value: e.target.value })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { className: "cl-fb-remove", onClick: () => removeFilterRow(row.id), title: "Remove filter", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("svg", { width: "12", height: "12", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) }) })
        ] }, row.id);
      }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "cl-fb-footer", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("button", { className: "cl-fb-add", onClick: addFilterRow, children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("svg", { width: "12", height: "12", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 4.5v15m7.5-7.5h-15" }) }),
          "Add filter"
        ] }),
        filterRows.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { className: "cl-fb-clear", onClick: () => setFilterRows([]), children: "Clear all" })
      ] })
    ] });
  }
  if (loading) {
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "cl-root cl-loading", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "cl-loading-spinner" }) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "cl-root", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "cl-header", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "cl-header-row", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "cl-header-left", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "cl-header-accent" }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h1", { className: "cl-title", children: listTitle }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { className: "cl-subtitle", children: [
          filteredReceipts.length !== receipts.length ? `${filteredReceipts.length.toLocaleString()} of ${receipts.length.toLocaleString()} receipts` : `${receipts.length.toLocaleString()} receipt${receipts.length !== 1 ? "s" : ""}`,
          filteredReceipts.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
            " \xB7 ",
            fmtMoney(totals.total),
            " total"
          ] })
        ] })
      ] })
    ] }) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "cl-toolbar-row", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "cl-toolbar", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "cl-toolbar-seg", style: { fontSize: 12, color: "var(--cl-text-4)", padding: "0 8px" }, children: receipts.length === 0 ? "No receipts yet" : `${receipts.length} receipt${receipts.length !== 1 ? "s" : ""}` }) }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "cl-action-bar", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "cl-action-wrap", ref: colPickerRef, children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
            "button",
            {
              className: "cl-action-btn" + (showColPicker ? " active" : ""),
              onClick: () => setShowColPicker((p) => !p),
              title: "Show / hide columns",
              children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("svg", { width: "15", height: "15", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 4H5a1 1 0 00-1 1v14a1 1 0 001 1h4M9 4v16M9 4h6M9 20h6m0-16h4a1 1 0 011 1v14a1 1 0 01-1 1h-4M15 4v16" }) })
            }
          ),
          showColPicker && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "cl-export-menu cl-col-picker-menu", children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "cl-export-menu-header", style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "cl-export-menu-title", children: "Show / Hide Columns" }),
                /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "cl-export-menu-sub", children: [
                  colVisible === null ? pickableCols.length : colVisible.length,
                  " of ",
                  pickableCols.length,
                  " shown"
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { className: "cl-col-picker-reset", onClick: () => setColVisible(null), children: "Reset" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "cl-col-picker-body", children: pickableCols.map((col) => {
              const checked = colVisible === null || colVisible.includes(col.key);
              return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "cl-col-picker-row", children: [
                /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("input", { type: "checkbox", checked, onChange: () => togglePickerCol(col.key) }),
                /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: col.label })
              ] }, col.key);
            }) })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "cl-action-wrap", ref: exportRef, children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
            "button",
            {
              className: "cl-action-btn" + (showExport ? " active" : ""),
              onClick: () => setShowExport((p) => !p),
              disabled: filteredReceipts.length === 0,
              title: "Export to CSV",
              children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("svg", { width: "15", height: "15", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" }) })
            }
          ),
          showExport && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "cl-export-menu", children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "cl-export-menu-header", children: [
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "cl-export-menu-title", children: "Export to CSV" }),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "cl-export-menu-sub", children: "Exports all currently filtered records" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "cl-export-menu-body", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { className: "cl-export-dl-btn", onClick: () => {
              doExportCSV(filteredReceipts, colVisible ?? COLUMNS2.map((c) => c.key));
              setShowExport(false);
            }, children: "Download" }) })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "cl-search-area", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "cl-search-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "cl-search-wrap", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("svg", { className: "cl-search-icon", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
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
          searchText && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { className: "cl-search-clear", onClick: () => setSearchText(""), children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("svg", { width: "14", height: "14", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
          "button",
          {
            className: "cl-filter-toggle" + (showFilterBuilder || activeFilterCount > 0 ? " active" : ""),
            onClick: () => {
              setShowFilterBuilder((p) => !p);
              if (!showFilterBuilder && filterRows.length === 0) addFilterRow();
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("svg", { width: "14", height: "14", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { fillRule: "evenodd", d: "M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L13 10.414V17a1 1 0 01-1.447.894l-4-2A1 1 0 017 15v-4.586L3.293 6.707A1 1 0 013 6V3z", clipRule: "evenodd" }) }),
              "Filter",
              activeFilterCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "cl-filter-toggle-count", children: activeFilterCount })
            ]
          }
        )
      ] }),
      renderFilterBuilder()
    ] }),
    showFilterBuilder && activeFilterCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "cl-active-filters", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "cl-active-filters-label", children: "Column filters:" }),
      Object.entries(filterSpecs).map(([col, spec]) => {
        const colDef = COLUMNS2.find((c) => c.key === col);
        const name = colDef?.label || col;
        let chip = "";
        if (spec.kind === "enum" && spec.values.length) chip = spec.values.length > 1 ? `${name}: ${spec.values.length} selected` : `${name}: ${spec.values[0]}`;
        if (spec.kind === "text" && spec.q) chip = `${name}: ~${spec.q}`;
        if (spec.kind === "range" && (spec.min || spec.max)) chip = `${name}: ${spec.min ?? ""}\u2013${spec.max ?? ""}`;
        if (!chip) return null;
        return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: "cl-filter-chip", children: [
          chip,
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { className: "cl-filter-chip-remove", onClick: () => setFilterRows((prev) => prev.filter((r) => r.field !== col)), children: "\xD7" })
        ] }, col);
      }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { className: "cl-filter-clear-all", onClick: () => setFilterRows([]), children: "Clear all" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "cl-table-area", children: [
      filteredReceipts.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "cl-table-wrap", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "cl-table-scroll", ref: tableScrollRef, onScroll: syncHThumb, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("table", { className: "cl-table", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("thead", { className: "cl-thead", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("tr", { children: [
            visibleColDefs.map((col) => {
              const isSorted = sortField === col.key;
              const isDragging = dragCol === col.key;
              const isDragOver = dragOverCol === col.key && dragCol !== col.key;
              return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
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
                  children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "cl-th-inner", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
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
                        children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("svg", { width: "12", height: "12", fill: "currentColor", viewBox: "0 0 16 16", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("circle", { cx: "5", cy: "4", r: "1.5" }),
                          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("circle", { cx: "11", cy: "4", r: "1.5" }),
                          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("circle", { cx: "5", cy: "8", r: "1.5" }),
                          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("circle", { cx: "11", cy: "8", r: "1.5" }),
                          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("circle", { cx: "5", cy: "12", r: "1.5" }),
                          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("circle", { cx: "11", cy: "12", r: "1.5" })
                        ] })
                      }
                    ),
                    col.sortable ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("button", { className: "cl-sort-btn" + (isSorted ? " sorted" : ""), onClick: () => handleSort(col.key), children: [
                      col.label,
                      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "cl-sort-arrow" + (isSorted ? "" : " unsorted"), children: isSorted ? sortDir === "asc" ? "\u2191" : "\u2193" : "\u2195" })
                    ] }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: col.label })
                  ] })
                },
                col.key
              );
            }),
            onDelete && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("th", { className: "cl-th-actions", children: "Delete" })
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("tbody", { children: [
            pageReceipts.map((r) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("tr", { className: "cl-tr", children: [
              visibleColDefs.map((col) => renderCell(col, r)),
              onDelete && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("td", { className: "cl-td-actions", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { className: "cl-btn-unclaim", onClick: () => onDelete(r.id), title: "Delete", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("svg", { width: "12", height: "12", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) }) }) })
            ] }, r.id)),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("tr", { className: "cl-tr", style: { borderTop: "1px solid var(--cl-border-2)", background: "var(--cl-surface)" }, children: [
              visibleColDefs.map((col) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("td", { className: "cl-td", style: { color: "var(--cl-text-3)", fontWeight: 600 }, children: col.key === "merchant" ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { style: { color: "var(--cl-text-4)", fontWeight: 400 }, children: [
                filteredReceipts.length,
                " receipt",
                filteredReceipts.length !== 1 ? "s" : ""
              ] }) : col.key === "total" ? fmtMoney(totals.total) : col.key === "subtotal" ? fmtMoney(totals.subtotal) : col.key === "tax" ? fmtMoney(totals.tax) : col.key === "tip" ? totals.tip ? fmtMoney(totals.tip) : "" : "" }, col.key)),
              onDelete && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("td", { className: "cl-td-actions" })
            ] })
          ] })
        ] }) }),
        hThumb.show && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "cl-hscroll-bar", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { className: "cl-scroll-left-btn", onClick: scrollToLeft, title: "Scroll to start", children: "\u2039" }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "cl-hscroll-track", ref: hScrollTrackRef, onMouseDown: onTrackClick, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
            "div",
            {
              className: "cl-hscroll-thumb",
              style: { left: hThumb.left, width: hThumb.width },
              onMouseDown: onThumbMouseDown,
              onClick: (e) => e.stopPropagation()
            }
          ) })
        ] })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "cl-empty", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "cl-empty-icon", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("svg", { width: "28", height: "28", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, style: { color: "var(--cl-text-4)" }, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z" }) }) }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "cl-empty-title", children: receipts.length === 0 ? "No receipts yet" : "No receipts match the filters" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "cl-empty-sub", children: receipts.length === 0 ? "Upload a receipt above to get started." : "Try adjusting your search or filters." })
      ] }),
      totalPages > 1 && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "cl-pagination", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("button", { className: "cl-page-btn", onClick: () => setPage((p) => p - 1), disabled: page === 0, children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("svg", { width: "12", height: "12", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 19l-7-7 7-7" }) }),
          "Prev"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: "cl-page-info", children: [
          "Page ",
          page + 1,
          " of ",
          totalPages
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("button", { className: "cl-page-btn", onClick: () => setPage((p) => p + 1), disabled: page >= totalPages - 1, children: [
          "Next",
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("svg", { width: "12", height: "12", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 5l7 7-7 7" }) })
        ] })
      ] })
    ] })
  ] });
}

// hooks/useClientListMock.ts
var import_react6 = require("react");
function useClientListMock(_collectionId, options = {}) {
  const {
    initialClients = [],
    initialViews = [],
    initialTitle,
    initialPermissions = DEFAULT_PERMISSIONS,
    loading: initialLoading = false,
    hasMore: initialHasMore = false
  } = options;
  const [clients, setClients] = (0, import_react6.useState)(initialClients);
  const [views, setViews] = (0, import_react6.useState)(initialViews);
  const [listTitle, setListTitle] = (0, import_react6.useState)(initialTitle ?? _collectionId);
  const [permissions, setPermissions] = (0, import_react6.useState)(initialPermissions);
  const [loading] = (0, import_react6.useState)(initialLoading);
  const [hasMore] = (0, import_react6.useState)(initialHasMore);
  const onSave = (0, import_react6.useCallback)(async (id, field, value, updaterName, fromValue) => {
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
  const onSaveView = (0, import_react6.useCallback)(async (view) => {
    const id = `mock-view-${Date.now()}`;
    setViews((prev) => [...prev, { id, ...view }]);
    return id;
  }, []);
  const onDeleteView = (0, import_react6.useCallback)(async (id) => {
    setViews((prev) => prev.filter((v) => v.id !== id));
  }, []);
  const onRenameList = (0, import_react6.useCallback)(async (name) => {
    setListTitle(name);
  }, []);
  const onSavePermissions = (0, import_react6.useCallback)(async (matrix) => {
    setPermissions(matrix);
  }, []);
  const onLoadMore = (0, import_react6.useCallback)(async () => {
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

// hooks/useReceiptListMock.ts
var import_react7 = require("react");
function uid2() {
  return Math.random().toString(36).slice(2, 10);
}
function useReceiptListMock(options = {}) {
  const [receipts, setReceipts] = (0, import_react7.useState)(
    options.initialReceipts ?? []
  );
  const onSave = (0, import_react7.useCallback)(
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
  const onDelete = (0, import_react7.useCallback)(async (id) => {
    setReceipts((prev) => prev.filter((r) => r.id !== id));
  }, []);
  return { receipts, onSave, onDelete };
}

// hooks/useReceiptList.ts
var import_react8 = require("react");
var import_app3 = require("firebase/app");
var import_firestore3 = require("firebase/firestore");
var import_storage2 = require("firebase/storage");
var _app;
var _db;
var _storage;
function getDB3() {
  if (!_db) {
    _app = (0, import_app3.getApps)().length === 0 ? (0, import_app3.initializeApp)(firebaseConfig) : (0, import_app3.getApps)()[0];
    _db = (0, import_firestore3.getFirestore)(_app);
  }
  return _db;
}
function getStorageInstance() {
  if (!_storage) {
    _app = (0, import_app3.getApps)().length === 0 ? (0, import_app3.initializeApp)(firebaseConfig) : (0, import_app3.getApps)()[0];
    _storage = (0, import_storage2.getStorage)(_app);
  }
  return _storage;
}
var RECEIPTS_COLLECTION = "receipts";
function useReceiptList(uid3) {
  const firestore = getDB3();
  const [receipts, setReceipts] = (0, import_react8.useState)([]);
  const [loading, setLoading] = (0, import_react8.useState)(true);
  (0, import_react8.useEffect)(() => {
    if (!uid3) {
      setReceipts([]);
      setLoading(false);
      return;
    }
    const q = (0, import_firestore3.query)(
      (0, import_firestore3.collection)(firestore, RECEIPTS_COLLECTION),
      (0, import_firestore3.where)("uid", "==", uid3),
      (0, import_firestore3.orderBy)("createdAt", "desc")
    );
    const unsub = (0, import_firestore3.onSnapshot)(
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
  const onSave = (0, import_react8.useCallback)(
    async (record) => {
      await (0, import_firestore3.addDoc)((0, import_firestore3.collection)(firestore, RECEIPTS_COLLECTION), {
        ...record,
        uid: uid3,
        createdAt: (0, import_firestore3.serverTimestamp)()
      });
    },
    [uid3, firestore]
  );
  const onDelete = (0, import_react8.useCallback)(
    async (id) => {
      const receipt = receipts.find((r) => r.id === id);
      await (0, import_firestore3.deleteDoc)((0, import_firestore3.doc)(firestore, RECEIPTS_COLLECTION, id));
      if (receipt?.filePath) {
        try {
          const storageRef = (0, import_storage2.ref)(getStorageInstance(), receipt.filePath);
          await (0, import_storage2.deleteObject)(storageRef);
        } catch (err) {
          console.warn("[useReceiptList] Storage delete failed:", err);
        }
      }
    },
    [firestore, receipts]
  );
  return { receipts, loading, onSave, onDelete };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ClientList,
  DEFAULT_PERMISSIONS,
  OdsPanel,
  ReceiptList,
  ReceiptScanner,
  useClientList,
  useClientListMock,
  useReceiptList,
  useReceiptListMock
});
//# sourceMappingURL=index.cjs.map