"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "../../hooks/useAuth";
import { Nav } from "../../components/Nav";
import { ReceiptScanner } from "ods-ui-library";
import type { ReceiptRecord } from "ods-ui-library";

// ─── Mock receipts ─────────────────────────────────────────────────────────────

const SAMPLE_RECEIPTS: ReceiptRecord[] = [
  {
    id: "r1",
    merchant: "OpenAI",
    date: "2026-03-28",
    subtotal: 42.00,
    tax: 0,
    tip: 0,
    total: 42.00,
    category: "AI & API Services",
    paymentMethod: "Credit Card",
    currency: "USD",
    notes: "GPT-4o API usage — March 2026",
    createdAt: "2026-03-28T18:45:00Z",
    items: [
      { id: "i1", description: "GPT-4o input tokens (21M)", qty: 1, unitPrice: 31.50, total: 31.50 },
      { id: "i2", description: "GPT-4o output tokens (3.5M)", qty: 1, unitPrice: 10.50, total: 10.50 },
    ],
  },
  {
    id: "r2",
    merchant: "Google Cloud",
    date: "2026-03-15",
    subtotal: 184.72,
    tax: 0,
    tip: 0,
    total: 184.72,
    category: "Cloud & Infrastructure",
    paymentMethod: "Credit Card",
    currency: "USD",
    notes: "Firebase App Hosting + Firestore reads/writes — March",
    createdAt: "2026-03-15T09:10:00Z",
    items: [
      { id: "i3", description: "App Hosting compute", qty: 1, unitPrice: 112.40, total: 112.40 },
      { id: "i4", description: "Firestore reads (4.2M)", qty: 1, unitPrice: 42.00, total: 42.00 },
      { id: "i5", description: "Cloud Storage egress", qty: 1, unitPrice: 30.32, total: 30.32 },
    ],
  },
  {
    id: "r3",
    merchant: "GitHub",
    date: "2026-03-01",
    subtotal: 21.00,
    tax: 0,
    tip: 0,
    total: 21.00,
    category: "Software & Subscriptions",
    paymentMethod: "Credit Card",
    currency: "USD",
    notes: "GitHub Team plan — 3 seats",
    createdAt: "2026-03-01T14:22:00Z",
    items: [
      { id: "i6", description: "GitHub Team seat", qty: 3, unitPrice: 7.00, total: 21.00 },
    ],
  },
  {
    id: "r4",
    merchant: "Upwork",
    date: "2026-03-20",
    subtotal: 650.00,
    tax: 0,
    tip: 0,
    total: 650.00,
    category: "Contractors & Freelancers",
    paymentMethod: "Credit Card",
    currency: "USD",
    notes: "UI design contract — mobile onboarding screens",
    createdAt: "2026-03-20T08:05:00Z",
    items: [
      { id: "i7", description: "UI/UX design — 13hrs @ $50", qty: 13, unitPrice: 50.00, total: 650.00 },
    ],
  },
  {
    id: "r5",
    merchant: "The Capital Grille",
    date: "2026-03-22",
    subtotal: 186.00,
    tax: 15.81,
    tip: 37.20,
    total: 239.01,
    category: "Meals & Entertainment",
    paymentMethod: "Credit Card",
    currency: "USD",
    notes: "Client dinner — Q1 review",
    createdAt: "2026-03-22T20:00:00Z",
    items: [
      { id: "i11", description: "Dry-aged NY strip 14oz", qty: 2, unitPrice: 58.00, total: 116.00 },
      { id: "i12", description: "Caesar salad", qty: 2, unitPrice: 18.00, total: 36.00 },
      { id: "i13", description: "Bottle of red wine", qty: 1, unitPrice: 34.00, total: 34.00 },
    ],
  },
  {
    id: "r6",
    merchant: "Delta Air Lines",
    date: "2026-03-18",
    subtotal: 398.00,
    tax: 34.20,
    tip: 0,
    total: 432.20,
    category: "Travel & Lodging",
    paymentMethod: "Credit Card",
    currency: "USD",
    notes: "Austin → San Francisco — tech conference",
    createdAt: "2026-03-18T11:30:00Z",
    items: [
      { id: "i14", description: "Round trip AUS→SFO", qty: 1, unitPrice: 398.00, total: 398.00 },
    ],
  },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

async function callScanReceipt(file: File): Promise<Partial<ReceiptRecord>> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch("/api/scan-receipt", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { error?: string }).error ?? `Server error ${res.status}`
    );
  }

  return res.json();
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ReceiptsDemo() {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<ReceiptRecord[]>(SAMPLE_RECEIPTS);
  const [isDirty, setIsDirty] = useState(false);

  const processReceipt = useCallback(callScanReceipt, []);

  const onSave = useCallback(async (record: Omit<ReceiptRecord, "id" | "createdAt">) => {
    const full: ReceiptRecord = {
      ...record,
      id: uid(),
      createdAt: new Date().toISOString(),
    };
    setReceipts((prev) => [full, ...prev]);
    setIsDirty(true);
  }, []);

  const onDelete = useCallback(async (id: string) => {
    setReceipts((prev) => prev.filter((r) => r.id !== id));
    setIsDirty(true);
  }, []);

  function handleReset() {
    setReceipts(SAMPLE_RECEIPTS);
    setIsDirty(false);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Header — auth-aware */}
      {user ? (
        <header className="sticky top-0 z-40 bg-gray-950/90 backdrop-blur-xl border-b border-gray-800/60">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link
              href="/portal"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to Portal
            </Link>
            <div className="flex items-center gap-3">
              {isDirty && (
                <button
                  onClick={handleReset}
                  className="text-xs text-gray-500 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Reset demo
                </button>
              )}
              <Link
                href="/portal"
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Portal
              </Link>
            </div>
          </div>
        </header>
      ) : (
        <Nav />
      )}

      {/* Demo notice */}
      <div className="max-w-4xl mx-auto px-6 pt-10">
        <div className="flex items-start gap-3 bg-violet-950/30 border border-violet-800/40 rounded-xl px-4 py-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0">
            <path d="M12 2L13.5 9.5L21 12L13.5 14.5L12 22L10.5 14.5L3 12L10.5 9.5L12 2Z" fill="#a78bfa"/>
          </svg>
          <p className="text-violet-300 text-xs leading-relaxed">
            <span className="font-semibold">Live demo</span> — the list below is pre-filled with sample receipts.
            Upload a real receipt and Gemini will extract the details automatically.
            All state resets on refresh.
          </p>
          {isDirty && (
            <button
              onClick={handleReset}
              className="ml-auto shrink-0 text-xs text-violet-400 hover:text-violet-300 font-medium whitespace-nowrap transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Hero */}
      <section className="pt-10 pb-6 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-900/30 border border-violet-700/40 text-violet-300 text-xs font-medium mb-4">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L13.5 9.5L21 12L13.5 14.5L12 22L10.5 14.5L3 12L10.5 9.5L12 2Z" fill="#a78bfa"/>
                </svg>
                Powered by Gemini 2.0 Flash
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
                Receipt Scanner
              </h1>
              <p className="text-gray-400 text-sm max-w-xl leading-relaxed">
                Drop any receipt — photo, screenshot, or PDF — and Gemini fills in the
                merchant, date, total, and every line item. Review, edit, and save.
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 bg-gray-900 border border-gray-800 rounded-2xl px-5 py-3 shrink-0">
              <div className="text-center">
                <p className="text-white font-bold text-lg tabular-nums">{receipts.length}</p>
                <p className="text-gray-500 text-xs">Receipts</p>
              </div>
              <div className="w-px h-8 bg-gray-800" />
              <div className="text-center">
                <p className="text-white font-bold text-lg tabular-nums">
                  ${receipts.reduce((s, r) => s + r.total, 0).toFixed(2)}
                </p>
                <p className="text-gray-500 text-xs">Total spent</p>
              </div>
              <div className="w-px h-8 bg-gray-800" />
              <div className="text-center">
                <p className="text-white font-bold text-lg tabular-nums">
                  {new Set(receipts.map((r) => r.category)).size}
                </p>
                <p className="text-gray-500 text-xs">Categories</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { n: "1", icon: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5", label: "Upload", desc: "Drop a photo or PDF" },
              { n: "2", icon: null, label: "AI reads it", desc: "Gemini extracts all fields", gemini: true },
              { n: "3", icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z", label: "Review & edit", desc: "Correct anything" },
              { n: "4", icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z", label: "Saved", desc: "Categorized and totaled" },
            ].map(({ n, icon, label, desc, gemini }) => (
              <div key={n} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-violet-900/50 border border-violet-800 flex items-center justify-center text-violet-400 text-xs font-bold shrink-0">
                  {n}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {gemini ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L13.5 9.5L21 12L13.5 14.5L12 22L10.5 14.5L3 12L10.5 9.5L12 2Z" fill="#a78bfa"/>
                      </svg>
                    ) : icon ? (
                      <svg className="w-3 h-3 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                      </svg>
                    ) : null}
                    <p className="text-white text-xs font-semibold">{label}</p>
                  </div>
                  <p className="text-gray-500 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scanner */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <ReceiptScanner
            receipts={receipts}
            processReceipt={processReceipt}
            onSave={onSave}
            onDelete={onDelete}
          />
        </div>
      </section>

    </div>
  );
}
