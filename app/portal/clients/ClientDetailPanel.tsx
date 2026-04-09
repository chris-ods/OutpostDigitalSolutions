"use client";

import React, { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useUserClaim } from "../../../lib/hooks/useUserClaim";
import { getWeekStart } from "../../../lib/weekUtils";
import type { OdsRecord, ChangeRecord } from "ods-ui-library";

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(s?: string | null) {
  if (!s) return "—";
  const d = new Date(s + "T12:00:00");
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtTs(ts?: { seconds: number } | null) {
  if (!ts) return "—";
  return new Date(ts.seconds * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function fmtPhone(s?: string) {
  if (!s) return "—";
  const d = s.replace(/\D/g, "");
  if (d.length === 11 && d[0] === "1") return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return s;
}

function fmtDollars(n?: number) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-app-text-5">{label}</span>
      <span className="text-[13px] text-app-text">{value || "—"}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-app-text-4">{title}</span>
        <div className="flex-1 h-px bg-app-border" />
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        {children}
      </div>
    </div>
  );
}

// ── Status badges ──────────────────────────────────────────────────────────────

function agentStatusColor(s?: string) {
  switch (s) {
    case "Approved":  return "text-emerald-400";
    case "Declined":  return "text-red-400";
    case "Cancelled": return "text-red-500";
    case "Sent UW":   return "text-amber-400";
    case "Pending":   return "text-app-accent";
    default:          return "text-app-text-3";
  }
}

function adminStatusColor(s?: string) {
  if (!s) return "text-app-text-3";
  if (s.startsWith("Client Paid|Comp Paid")) return "text-emerald-400";
  if (s.includes("Decline") || s === "Lapsed" || s === "CXL") return "text-red-400";
  if (s.includes("Waiting") || s.includes("UW") || s.includes("Pending")) return "text-amber-400";
  return "text-app-text-3";
}

// ── Payroll Adjustment ────────────────────────────────────────────────────────

function PayrollAdjustmentSection({ client }: { client: OdsRecord }) {
  const claim = useUserClaim();
  const isAdmin = claim.isAdmin;
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  if (!isAdmin) return null;

  const agentUid = String(client.agentId ?? "");
  const clientName = String(client.clientName ?? client.displayLabel ?? "Unknown");
  const appNum = String(client.appNumber ?? "");

  async function submitAdjustment() {
    const val = parseFloat(amount);
    if (isNaN(val) || val === 0 || !agentUid || agentUid.startsWith("pending:")) return;
    setSaving(true);
    setResult(null);
    try {
      const weekStart = getWeekStart(new Date());
      const entryRef = doc(db, "payroll", weekStart, "entries", agentUid);
      const entrySnap = await getDoc(entryRef);
      const existing = entrySnap.exists() ? entrySnap.data() : {};
      const prevAdj = Number(existing.adjustment ?? 0);
      const prevNotes = String(existing.adjustmentNotes ?? "");
      const adjNote = `${val > 0 ? "+" : ""}${val.toFixed(2)} — ${clientName}${appNum ? ` (${appNum})` : ""}${notes ? `: ${notes}` : ""}`;

      await setDoc(entryRef, {
        ...existing,
        adjustment: prevAdj + val,
        adjustmentNotes: prevNotes ? `${prevNotes}; ${adjNote}` : adjNote,
      }, { merge: true });

      setResult({ ok: true, msg: `${val > 0 ? "+" : ""}$${Math.abs(val).toFixed(2)} applied to ${clientName}'s payroll` });
      setAmount("");
      setNotes("");
    } catch (err) {
      setResult({ ok: false, msg: err instanceof Error ? err.message : "Failed to save" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section title="Payroll Adjustment">
      <div className="col-span-2 flex flex-col gap-3">
        <p className="text-app-text-4 text-[11px]">Add or subtract from this agent&apos;s payroll for the current week.</p>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-app-text-5 mb-1 block">Amount ($)</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="-50.00 or 25.00"
              className="w-full px-3 py-1.5 bg-app-surface-2 border border-app-border-2 rounded-lg text-app-text text-sm focus:outline-none focus:ring-1 focus:ring-app-accent"
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-app-text-5 mb-1 block">Note (reason)</label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Reimbursement, clawback, bonus..."
            className="w-full px-3 py-1.5 bg-app-surface-2 border border-app-border-2 rounded-lg text-app-text text-sm focus:outline-none focus:ring-1 focus:ring-app-accent"
          />
        </div>
        <button
          type="button"
          onClick={submitAdjustment}
          disabled={saving || !amount || parseFloat(amount) === 0}
          className="self-start px-4 py-1.5 bg-app-accent hover:bg-app-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition"
        >
          {saving ? "Saving..." : "Apply Adjustment"}
        </button>
        {result && (
          <p className={`text-xs font-medium ${result.ok ? "text-app-success" : "text-app-danger"}`}>
            {result.msg}
          </p>
        )}
      </div>
    </Section>
  );
}

// ── Panel ──────────────────────────────────────────────────────────────────────

interface ClientDetailPanelProps {
  client: OdsRecord | null;
  onClose: () => void;
}

export function ClientDetailPanel({ client, onClose }: ClientDetailPanelProps) {
  // Close on Escape
  useEffect(() => {
    if (!client) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [client, onClose]);

  if (!client) return null;

  const changeLog: ChangeRecord[] = (client.changeLog ?? []).slice().reverse();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col bg-app-bg border-l border-app-border shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 py-5 border-b border-app-border shrink-0">
          <div>
            <h2 className="text-[17px] font-bold text-app-text leading-snug">{client.clientName || "—"}</h2>
            {client.agentName && (
              <p className="text-[11px] text-app-text-4 mt-1">Agent: {client.agentName}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-app-text-5 hover:text-app-text transition mt-0.5 shrink-0"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-8">

          <Section title="Contact">
            <Field label="Phone"  value={fmtPhone(client.phone)} />
            <Field label="Email"  value={client.email} />
            <Field label="State"  value={client.state} />
          </Section>

          <Section title="Policy">
            <Field label="Carrier"        value={client.carrier} />
            <Field label="App #"          value={client.appNumber} />
            <Field label="Annual Premium" value={fmtDollars(client.annualPremium)} />
            <Field label="Split %"        value={client.splitPercent != null ? `${client.splitPercent}%` : undefined} />
            <Field label="Portal"         value={client.portalName} />
          </Section>

          <Section title="Status">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-app-text-5">Agent Status</span>
              <span className={`text-[13px] font-medium ${agentStatusColor(client.agentStatus)}`}>
                {client.agentStatus || "—"}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-app-text-5">Admin Status</span>
              <span className={`text-[13px] font-medium ${adminStatusColor(client.adminStatus)}`}>
                {client.adminStatus || "—"}
              </span>
            </div>
            {client.notes && (
              <div className="col-span-2 flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-app-text-5">Notes</span>
                <p className="text-[13px] text-app-text-2 leading-relaxed">{client.notes}</p>
              </div>
            )}
          </Section>

          <PayrollAdjustmentSection client={client} />

          <Section title="Dates">
            <Field label="Date Submitted" value={fmtDate(client.date)} />
            <Field label="Start Date"     value={fmtDate(client.startDate)} />
            <Field label="Client Paid"    value={fmtDate(client.clientPaidDate)} />
            <Field label="Comp Date"      value={fmtDate(client.compDate)} />
          </Section>

          <Section title="Record">
            <Field label="Created"    value={fmtTs(client.createdAt)} />
            <Field label="Created By" value={client.createdByName} />
            <Field label="Updated"    value={fmtTs(client.updatedAt)} />
            <Field label="Updated By" value={client.updatedByName} />
          </Section>

          {/* Change log */}
          {changeLog.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-app-text-4">Audit Trail</span>
                <div className="flex-1 h-px bg-app-border" />
                <span className="text-[10px] text-app-text-5">{changeLog.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {changeLog.map((entry, i) => (
                  <div key={i} className="flex flex-col gap-0.5 bg-app-surface rounded-lg px-3 py-2.5 border border-app-border">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-app-text-2">{entry.field}</span>
                      <span className="text-[10px] text-app-text-5">{fmtTs(entry.at)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="text-app-text-4 line-through">{entry.from || "—"}</span>
                      <svg className="w-3 h-3 text-app-text-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                      <span className="text-app-text-2">{entry.to || "—"}</span>
                    </div>
                    <span className="text-[10px] text-app-text-5">by {entry.by}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
