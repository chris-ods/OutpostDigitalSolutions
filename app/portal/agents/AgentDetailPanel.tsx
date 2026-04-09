"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { OdsRecord } from "ods-ui-library";
import { fmtDate } from "../../../lib/formatters";
import { Spinner } from "../../../lib/components/Spinner";

// ── Types ─────────────────────────────────────────────────────────────────────

export type SectionView = "credentials" | "writingNumbers" | "stateLicenses" | "secrets";

export interface SubCollectionData {
  credentials: Array<{ id: string; platform: string; link?: string; username: string; password: string; notes?: string }>;
  writingNumbers: Array<{ id: string; carrier: string; individualNumber: string; agencyNumber?: string; notes?: string }>;
  stateLicenses: Array<{ id: string; state: string; stateCode: string; individualLicense: string; individualExpiry: string; agencyLicense?: string; agencyExpiry?: string }>;
  secrets: { dob?: string; ssn?: string; npnPersonal?: string; npnBusiness?: string; ein?: string; address?: string; notes?: string } | null;
}

export const SECTION_LABELS: Record<SectionView, string> = {
  credentials: "Credentials",
  writingNumbers: "Writing #s",
  stateLicenses: "State Licenses",
  secrets: "Secrets",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export function licenseStatus(dateStr: string | undefined): "expired" | "warning" | "ok" | "none" {
  if (!dateStr) return "none";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "none";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const in30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  if (d < today) return "expired";
  if (d <= in30) return "warning";
  return "ok";
}

const fmtExpiry = fmtDate;

// ── Self-loading detail panel ────────────────────────────────────────────────

export default function AgentDetailPanel({ record, isOwnerOrDev }: { record: OdsRecord; isOwnerOrDev: boolean }) {
  const uid = String(record.id);
  const [data, setData] = useState<SubCollectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPw, setShowPw] = useState<Set<string>>(new Set());
  const togglePw = (id: string) => setShowPw(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // Load subcollection data on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [credSnap, wnSnap, slSnap] = await Promise.all([
          getDocs(collection(db, "users", uid, "credentials")),
          getDocs(collection(db, "users", uid, "writingNumbers")),
          getDocs(collection(db, "users", uid, "stateLicenses")),
        ]);
        // Load secrets via encrypted API (masked by default)
        let secrets: SubCollectionData["secrets"] = null;
        try {
          const res = await fetch(`/api/admin/secrets?uid=${uid}&type=identity&callerUid=${uid}`);
          const json = await res.json();
          if (json.data) secrets = json.data as SubCollectionData["secrets"];
        } catch { /* secrets unavailable */ }
        if (cancelled) return;
        setData({
          credentials: credSnap.docs.map(d => ({ id: d.id, ...d.data() } as SubCollectionData["credentials"][number])),
          writingNumbers: wnSnap.docs.map(d => ({ id: d.id, ...d.data() } as SubCollectionData["writingNumbers"][number])),
          stateLicenses: slSnap.docs.map(d => ({ id: d.id, ...d.data() } as SubCollectionData["stateLicenses"][number])),
          secrets,
        });
      } catch (err) {
        console.error("Failed to load agent subcollections:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [uid]);

  if (loading) return <div style={{ padding: "2rem", display: "flex", justifyContent: "center" }}><Spinner className="w-5 h-5" /></div>;
  if (!data) return null;

  const sectionTitleStyle: React.CSSProperties = { fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--app-text-3)", marginBottom: "0.5rem" };
  const tableStyle: React.CSSProperties = { width: "100%", fontSize: "0.75rem", borderCollapse: "collapse" };
  const thStyle: React.CSSProperties = { textAlign: "left", padding: "0.375rem 0.75rem", fontWeight: 600, fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--app-text-4)", borderBottom: "1px solid var(--app-border)" };
  const tdStyle: React.CSSProperties = { padding: "0.375rem 0.75rem", color: "var(--app-text-2)", borderBottom: "1px solid var(--app-border)" };
  const monoTd: React.CSSProperties = { ...tdStyle, fontFamily: "monospace", fontSize: "0.6875rem" };
  const emptyStyle: React.CSSProperties = { color: "var(--app-text-5)", fontSize: "0.75rem", padding: "0.5rem 0" };
  const sectionStyle: React.CSSProperties = { marginBottom: "1.25rem" };

  const EyeToggle = ({ id, revealed }: { id: string; revealed: boolean }) => (
    <button type="button" onClick={() => togglePw(id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--app-text-5)", padding: 0, marginLeft: "0.375rem", verticalAlign: "middle" }}>
      <svg style={{ width: "0.75rem", height: "0.75rem" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        {revealed
          ? <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/>
          : <><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></>
        }
      </svg>
    </button>
  );

  return (
    <div style={{ padding: "1.25rem 1.5rem", background: "var(--app-surface)", borderTop: "1px solid var(--app-border)" }}>
      {/* Credentials */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Credentials</div>
        {data.credentials.length === 0 ? <div style={emptyStyle}>No credentials on file.</div> : (
          <table style={tableStyle}><thead><tr><th style={thStyle}>Platform</th><th style={thStyle}>Username</th><th style={thStyle}>Password</th><th style={thStyle}>Link</th><th style={thStyle}>Notes</th></tr></thead>
            <tbody>{data.credentials.map(c => (
              <tr key={c.id}><td style={tdStyle}>{c.platform || "—"}</td><td style={tdStyle}>{c.username || "—"}</td>
                <td style={monoTd}>{c.password ? <span>{showPw.has(c.id) ? c.password : "••••••••"}<EyeToggle id={c.id} revealed={showPw.has(c.id)} /></span> : "—"}</td>
                <td style={tdStyle}>{c.link ? <a href={c.link} target="_blank" rel="noopener noreferrer" style={{ color: "var(--app-accent)", textDecoration: "none" }}>Open &#x2197;</a> : "—"}</td>
                <td style={tdStyle}>{c.notes || "—"}</td></tr>
            ))}</tbody></table>
        )}
      </div>

      {/* Writing Numbers */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Writing Numbers</div>
        {data.writingNumbers.length === 0 ? <div style={emptyStyle}>No writing numbers on file.</div> : (
          <table style={tableStyle}><thead><tr><th style={thStyle}>Carrier</th><th style={thStyle}>Individual #</th><th style={thStyle}>Agency #</th><th style={thStyle}>Notes</th></tr></thead>
            <tbody>{data.writingNumbers.map(w => (
              <tr key={w.id}><td style={tdStyle}>{w.carrier || "—"}</td><td style={monoTd}>{w.individualNumber || "—"}</td><td style={monoTd}>{w.agencyNumber || "—"}</td><td style={tdStyle}>{w.notes || "—"}</td></tr>
            ))}</tbody></table>
        )}
      </div>

      {/* State Licenses */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>State Licenses</div>
        {data.stateLicenses.length === 0 ? <div style={emptyStyle}>No state licenses on file.</div> : (
          <table style={tableStyle}><thead><tr><th style={thStyle}>State</th><th style={thStyle}>License #</th><th style={thStyle}>Expiry</th><th style={thStyle}>Status</th><th style={thStyle}>Agency License</th><th style={thStyle}>Agency Expiry</th></tr></thead>
            <tbody>{data.stateLicenses.map(l => {
              const st = licenseStatus(l.individualExpiry);
              return (
                <tr key={l.id}><td style={tdStyle}>{l.state || l.stateCode || "—"}</td><td style={monoTd}>{l.individualLicense || "—"}</td>
                  <td style={{ ...tdStyle, color: st === "expired" ? "#f87171" : st === "warning" ? "#fbbf24" : "var(--app-text-3)", whiteSpace: "nowrap" }}>{fmtExpiry(l.individualExpiry)}</td>
                  <td style={{ ...tdStyle, color: st === "expired" ? "#f87171" : st === "warning" ? "#fbbf24" : st === "ok" ? "#34d399" : "var(--app-text-5)", fontWeight: 500 }}>{st === "expired" ? "Expired" : st === "warning" ? "Expiring" : st === "ok" ? "Active" : "—"}</td>
                  <td style={monoTd}>{l.agencyLicense || "—"}</td>
                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{fmtExpiry(l.agencyExpiry)}</td></tr>
              );
            })}</tbody></table>
        )}
      </div>

      {/* Secrets — owner/dev only, masked by default */}
      {isOwnerOrDev && data.secrets && (
        <div style={sectionStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ ...sectionTitleStyle, color: "#fbbf24", marginBottom: 0 }}>Identity / Secrets</div>
            {!showPw.has("_revealed") && (
              <button
                style={{ background: "none", border: "1px solid var(--app-border-2)", borderRadius: "0.375rem", padding: "0.25rem 0.625rem", fontSize: "0.625rem", fontWeight: 600, color: "var(--app-warning)", cursor: "pointer" }}
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/admin/secrets?uid=${uid}&type=identity&reveal=true&callerUid=${uid}`);
                    const json = await res.json();
                    if (json.data) {
                      setData(prev => prev ? { ...prev, secrets: json.data } : prev);
                      setShowPw(prev => new Set([...prev, "_revealed"]));
                    }
                  } catch { /* ignore */ }
                }}
              >Reveal All</button>
            )}
            {showPw.has("_revealed") && (
              <span style={{ fontSize: "0.5625rem", color: "var(--app-warning)", fontWeight: 600 }}>REVEALED — access logged</span>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.375rem 1.5rem", fontSize: "0.75rem", marginTop: "0.5rem" }}>
            {data.secrets.dob && <div><span style={{ color: "var(--app-text-4)", fontWeight: 600, fontSize: "0.625rem", textTransform: "uppercase" }}>DOB</span><br/><span style={{ color: "var(--app-text-2)" }}>{data.secrets.dob}</span></div>}
            {data.secrets.ssn && <div><span style={{ color: "var(--app-text-4)", fontWeight: 600, fontSize: "0.625rem", textTransform: "uppercase" }}>SSN</span><br/><span style={{ fontFamily: "monospace", color: "var(--app-text-2)" }}>{data.secrets.ssn}</span></div>}
            {data.secrets.npnPersonal && <div><span style={{ color: "var(--app-text-4)", fontWeight: 600, fontSize: "0.625rem", textTransform: "uppercase" }}>NPN Personal</span><br/><span style={{ fontFamily: "monospace", color: "var(--app-text-2)" }}>{data.secrets.npnPersonal}</span></div>}
            {data.secrets.npnBusiness && <div><span style={{ color: "var(--app-text-4)", fontWeight: 600, fontSize: "0.625rem", textTransform: "uppercase" }}>NPN Business</span><br/><span style={{ fontFamily: "monospace", color: "var(--app-text-2)" }}>{data.secrets.npnBusiness}</span></div>}
            {data.secrets.ein && <div><span style={{ color: "var(--app-text-4)", fontWeight: 600, fontSize: "0.625rem", textTransform: "uppercase" }}>EIN</span><br/><span style={{ fontFamily: "monospace", color: "var(--app-text-2)" }}>{data.secrets.ein}</span></div>}
            {data.secrets.address && <div style={{ gridColumn: "1 / -1" }}><span style={{ color: "var(--app-text-4)", fontWeight: 600, fontSize: "0.625rem", textTransform: "uppercase" }}>Address</span><br/><span style={{ color: "var(--app-text-2)" }}>{data.secrets.address}</span></div>}
            {data.secrets.notes && <div style={{ gridColumn: "1 / -1" }}><span style={{ color: "var(--app-text-4)", fontWeight: 600, fontSize: "0.625rem", textTransform: "uppercase" }}>Notes</span><br/><span style={{ color: "var(--app-text-2)" }}>{data.secrets.notes}</span></div>}
          </div>
        </div>
      )}
    </div>
  );
}
