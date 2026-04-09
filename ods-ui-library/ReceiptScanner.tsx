"use client";

import React, {
  useState,
  useCallback,
  useRef,
  DragEvent,
  ChangeEvent,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReceiptItem {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export type ReceiptCategory =
  | "AI & API Services"
  | "Software & Subscriptions"
  | "Cloud & Infrastructure"
  | "Hardware & Equipment"
  | "Contractors & Freelancers"
  | "Marketing & Advertising"
  | "Travel & Lodging"
  | "Meals & Entertainment"
  | "Education & Training"
  | "Legal & Professional"
  | "Office & Supplies"
  | "Utilities & Internet"
  | "Other";

export interface ReceiptRecord {
  id: string;
  merchant: string;
  date: string; // YYYY-MM-DD
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  category: ReceiptCategory;
  paymentMethod: string;
  currency: string;
  notes: string;
  items: ReceiptItem[];
  createdAt: string; // ISO timestamp
  /** Firebase Storage download URL for the original file (optional). */
  fileUrl?: string;
  /** Firebase Storage path — used for deletion (optional). */
  filePath?: string;
}

export interface ReceiptScannerProps {
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

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: ReceiptCategory[] = [
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
  "Other",
];

const PAYMENT_METHODS = [
  "Credit Card",
  "Debit Card",
  "Cash",
  "Check",
  "Apple Pay",
  "Google Pay",
  "Other",
];

const CATEGORY_COLORS: Record<string, string> = {
  "AI & API Services":        "bg-violet-900/40 text-violet-400 border-violet-800",
  "Software & Subscriptions": "bg-blue-900/40 text-blue-400 border-blue-800",
  "Cloud & Infrastructure":   "bg-cyan-900/40 text-cyan-400 border-cyan-800",
  "Hardware & Equipment":     "bg-slate-800/60 text-slate-300 border-slate-700",
  "Contractors & Freelancers":"bg-amber-900/40 text-amber-400 border-amber-800",
  "Marketing & Advertising":  "bg-pink-900/40 text-pink-400 border-pink-800",
  "Travel & Lodging":         "bg-sky-900/40 text-sky-400 border-sky-800",
  "Meals & Entertainment":    "bg-orange-900/40 text-orange-400 border-orange-800",
  "Education & Training":     "bg-green-900/40 text-green-400 border-green-800",
  "Legal & Professional":     "bg-rose-900/40 text-rose-400 border-rose-800",
  "Office & Supplies":        "bg-teal-900/40 text-teal-400 border-teal-800",
  "Utilities & Internet":     "bg-yellow-900/40 text-yellow-400 border-yellow-800",
  Other:                      "bg-app-surface-2 text-app-text-3 border-app-border-2",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function blankForm(): Omit<ReceiptRecord, "id" | "createdAt"> {
  return {
    merchant: "",
    date: new Date().toISOString().slice(0, 10),
    subtotal: 0,
    tax: 0,
    tip: 0,
    total: 0,
    category: "Other",
    paymentMethod: "Credit Card",
    currency: "USD",
    notes: "",
    items: [],
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GeminiStar({ size = 12, color = "#a78bfa" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2L13.5 9.5L21 12L13.5 14.5L12 22L10.5 14.5L3 12L10.5 9.5L12 2Z"
        fill={color}
      />
    </svg>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] text-app-text-4 font-medium uppercase tracking-wider">
      {children}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

type Stage = "idle" | "processing" | "review" | "saving";

export default function ReceiptScanner({
  receipts,
  processReceipt,
  onSave,
  onDelete,
  className = "",
}: ReceiptScannerProps) {
  const [stage, setStage] = useState<Stage>("idle");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<ReceiptRecord, "id" | "createdAt">>(blankForm());
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Field helpers ──────────────────────────────────────────────────────────

  function setField<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function recalcTotal(partial: Partial<typeof form> = {}) {
    setForm((f) => {
      const m = { ...f, ...partial };
      return { ...m, total: +(m.subtotal + m.tax + m.tip).toFixed(2) };
    });
  }

  // ── File handling ──────────────────────────────────────────────────────────

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      const allowed = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "application/pdf",
      ];
      if (!allowed.includes(file.type)) {
        setError("Please upload a JPG, PNG, WebP, or PDF file.");
        return;
      }

      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
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
            total: item.total ?? 0,
          })),
        });
        setStage("review");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to process receipt.");
        setStage("idle");
      }
    },
    [processReceipt]
  );

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  // ── Line items ─────────────────────────────────────────────────────────────

  function addItem() {
    setForm((f) => ({
      ...f,
      items: [
        ...f.items,
        { id: uid(), description: "", qty: 1, unitPrice: 0, total: 0 },
      ],
    }));
  }

  function updateItem(
    id: string,
    key: keyof ReceiptItem,
    val: string | number
  ) {
    setForm((f) => ({
      ...f,
      items: f.items.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [key]: val };
        if (key === "qty" || key === "unitPrice") {
          updated.total = +(updated.qty * updated.unitPrice).toFixed(2);
        }
        return updated;
      }),
    }));
  }

  function removeItem(id: string) {
    setForm((f) => ({ ...f, items: f.items.filter((i) => i.id !== id) }));
  }

  // ── Save / cancel ──────────────────────────────────────────────────────────

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

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className={`space-y-6 ${className}`}>

      {/* ── Upload / processing zone ── */}
      {(stage === "idle" || stage === "processing") && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => stage === "idle" && fileRef.current?.click()}
          className={[
            "relative border-2 border-dashed rounded-2xl transition-all select-none",
            stage === "processing"
              ? "border-violet-700 bg-violet-950/20 cursor-default"
              : dragOver
              ? "border-violet-500 bg-violet-950/30 cursor-copy"
              : "border-app-border-2 bg-app-surface/50 hover:border-app-border-2 hover:bg-app-surface cursor-pointer",
          ].join(" ")}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
            className="hidden"
            onChange={onInputChange}
          />

          <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
            {stage === "processing" ? (
              <>
                <div className="relative w-14 h-14 mb-5">
                  <div className="absolute inset-0 rounded-full border-4 border-violet-900" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-violet-400 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <GeminiStar size={20} />
                  </div>
                </div>
                <p className="text-app-text font-medium text-sm">
                  Gemini is reading your receipt…
                </p>
                <p className="text-app-text-4 text-xs mt-1">
                  This usually takes a few seconds
                </p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-app-surface-2 border border-app-border-2 flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-app-text-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                    />
                  </svg>
                </div>
                <p className="text-app-text font-medium text-sm mb-1">
                  Drop a receipt here or click to upload
                </p>
                <p className="text-app-text-4 text-xs mb-4">
                  JPG, PNG, WebP, or PDF — Gemini extracts the details
                </p>
                <div className="inline-flex items-center gap-1.5 text-xs text-violet-400 font-medium">
                  <GeminiStar size={11} />
                  Powered by Gemini
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-start gap-3 bg-red-950/30 border border-red-800/60 rounded-xl px-4 py-3">
          <svg
            className="w-4 h-4 text-red-400 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"
            />
          </svg>
          <p className="text-red-400 text-xs leading-relaxed">{error}</p>
        </div>
      )}

      {/* ── Review / save form ── */}
      {(stage === "review" || stage === "saving") && (
        <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-app-border">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-violet-900/50 border border-violet-800/60 flex items-center justify-center">
                <GeminiStar size={13} />
              </div>
              <span className="text-app-text font-semibold text-sm">
                Review &amp; confirm
              </span>
              <span className="text-xs text-app-text-4 hidden sm:block">
                Edit anything Gemini got wrong
              </span>
            </div>
            {preview && (
              <img
                src={preview}
                alt="Receipt preview"
                className="h-10 w-8 object-cover rounded-md border border-app-border-2 opacity-70 hover:opacity-100 transition-opacity"
              />
            )}
          </div>

          <div className="p-5 space-y-5">
            {/* Merchant + Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <FieldLabel>Merchant</FieldLabel>
                <input
                  type="text"
                  value={form.merchant}
                  onChange={(e) => setField("merchant", e.target.value)}
                  placeholder="Store or vendor name"
                  className="bg-app-surface-2 border border-app-border-2 rounded-lg px-3 py-2 text-app-text text-sm placeholder:text-app-text-5 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600/30 transition"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <FieldLabel>Date</FieldLabel>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setField("date", e.target.value)}
                  className="bg-app-surface-2 border border-app-border-2 rounded-lg px-3 py-2 text-app-text text-sm focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600/30 transition [color-scheme:dark]"
                />
              </label>
            </div>

            {/* Category + Payment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <FieldLabel>Category</FieldLabel>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setField("category", e.target.value as ReceiptCategory)
                  }
                  className="bg-app-surface-2 border border-app-border-2 rounded-lg px-3 py-2 text-app-text text-sm focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600/30 transition"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <FieldLabel>Payment method</FieldLabel>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setField("paymentMethod", e.target.value)}
                  className="bg-app-surface-2 border border-app-border-2 rounded-lg px-3 py-2 text-app-text text-sm focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600/30 transition"
                >
                  {PAYMENT_METHODS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Subtotal + Tax + Tip + Total */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {(["subtotal", "tax", "tip"] as const).map((k) => (
                <label key={k} className="flex flex-col gap-1.5">
                  <FieldLabel>{k}</FieldLabel>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-4 text-sm pointer-events-none">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form[k] || ""}
                      onChange={(e) =>
                        recalcTotal({ [k]: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-app-surface-2 border border-app-border-2 rounded-lg pl-6 pr-3 py-2 text-app-text text-sm focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600/30 transition"
                    />
                  </div>
                </label>
              ))}
              <label className="flex flex-col gap-1.5">
                <FieldLabel>Total</FieldLabel>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-4 text-sm pointer-events-none">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.total || ""}
                    onChange={(e) =>
                      setField("total", parseFloat(e.target.value) || 0)
                    }
                    className="w-full bg-app-surface-2 border border-app-border-2 rounded-lg pl-6 pr-3 py-2 text-app-text font-semibold text-sm focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600/30 transition"
                  />
                </div>
              </label>
            </div>

            {/* Line items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <FieldLabel>Line items</FieldLabel>
                <button
                  type="button"
                  onClick={addItem}
                  className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors flex items-center gap-1"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  Add item
                </button>
              </div>

              {form.items.length > 0 ? (
                <div className="rounded-xl border border-app-border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-app-border">
                        <th className="text-left text-app-text-4 font-medium px-3 py-2 w-full">
                          Description
                        </th>
                        <th className="text-right text-app-text-4 font-medium px-3 py-2 whitespace-nowrap">
                          Qty
                        </th>
                        <th className="text-right text-app-text-4 font-medium px-3 py-2 whitespace-nowrap">
                          Unit $
                        </th>
                        <th className="text-right text-app-text-4 font-medium px-3 py-2 whitespace-nowrap">
                          Total
                        </th>
                        <th className="px-2 py-2 w-6" />
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((item, i) => (
                        <tr
                          key={item.id}
                          className={
                            i < form.items.length - 1
                              ? "border-b border-app-border/60"
                              : ""
                          }
                        >
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) =>
                                updateItem(item.id, "description", e.target.value)
                              }
                              placeholder="Item description"
                              className="w-full bg-transparent text-app-text placeholder:text-app-text-5 focus:outline-none focus:bg-app-surface-2 rounded px-1 py-0.5 transition-colors"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={item.qty}
                              onChange={(e) =>
                                updateItem(
                                  item.id,
                                  "qty",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-14 text-right bg-transparent text-app-text focus:outline-none focus:bg-app-surface-2 rounded px-1 py-0.5 transition-colors"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) =>
                                updateItem(
                                  item.id,
                                  "unitPrice",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-20 text-right bg-transparent text-app-text focus:outline-none focus:bg-app-surface-2 rounded px-1 py-0.5 transition-colors"
                            />
                          </td>
                          <td className="px-3 py-1.5 text-right text-app-text-2 tabular-nums">
                            ${item.total.toFixed(2)}
                          </td>
                          <td className="px-2 py-1.5">
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="text-app-text-5 hover:text-red-400 transition-colors"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-app-text-5 text-xs italic py-2">
                  No line items detected — add them manually if needed.
                </p>
              )}
            </div>

            {/* Notes */}
            <label className="flex flex-col gap-1.5">
              <FieldLabel>Notes</FieldLabel>
              <textarea
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder="Any additional notes…"
                rows={2}
                className="bg-app-surface-2 border border-app-border-2 rounded-lg px-3 py-2 text-app-text text-sm placeholder:text-app-text-5 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600/30 transition resize-none"
              />
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-app-border bg-app-bg/30">
            <button
              type="button"
              onClick={handleCancel}
              disabled={stage === "saving"}
              className="text-sm text-app-text-4 hover:text-app-text-2 transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={stage === "saving"}
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
            >
              {stage === "saving" && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              )}
              Save receipt
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
