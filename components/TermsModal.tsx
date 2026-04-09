"use client";

import { useState } from "react";
import { doc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { signOut } from "firebase/auth";
import { auth, db, storage } from "../lib/firebase";
import { Spinner } from "../lib/components/Spinner";
import { jsPDF } from "jspdf";

interface TermsModalProps {
  uid: string;
  userName: string;
  userEmail: string;
  termsHtml: string;
  termsVersion: number;
  onAccepted: () => void;
  onDismiss?: () => void;
}

// ── PDF certificate generator ────────────────────────────────────────────────

async function generateCertificatePDF({
  name, email, ssn, termsVersion, termsHtml,
}: {
  name: string; email: string; ssn: string;
  termsVersion: number; termsHtml: string;
}): Promise<Blob> {
  const pdf = new jsPDF({ unit: "pt", format: "letter" });
  const w = pdf.internal.pageSize.getWidth();
  const margin = 60;
  const contentWidth = w - margin * 2;
  const now = new Date();
  const timestamp = now.toLocaleString("en-US", {
    month: "long", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", second: "2-digit", timeZoneName: "short",
  });

  // ── Header ──
  pdf.setFillColor(15, 23, 42); // slate-900
  pdf.rect(0, 0, w, 80, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(22);
  pdf.setFont("helvetica", "bold");
  pdf.text("Certificate of Acceptance", margin, 50);

  // ── Title bar ──
  let y = 110;
  pdf.setTextColor(30, 41, 59);
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.text("Terms & Conditions Agreement", margin, y);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Version ${termsVersion}`, margin, y + 16);

  // ── Signer details ──
  y += 46;
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y, w - margin, y);
  y += 20;

  const labelX = margin;
  const valueX = margin + 120;
  pdf.setFontSize(10);

  const details: [string, string][] = [
    ["Full Name", name],
    ["Email", email],
    ["SSN", ssn],
    ["Date & Time", timestamp],
    ["IP Address", "(recorded server-side)"],
  ];

  for (const [label, value] of details) {
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(71, 85, 105);
    pdf.text(label, labelX, y);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(15, 23, 42);
    pdf.text(value, valueX, y);
    y += 18;
  }

  // ── Divider ──
  y += 10;
  pdf.setDrawColor(226, 232, 240);
  pdf.line(margin, y, w - margin, y);
  y += 20;

  // ── Terms content (plain text from HTML) ──
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(30, 41, 59);
  pdf.text("Terms & Conditions", margin, y);
  y += 18;

  // Strip HTML tags for PDF text
  const plainText = termsHtml
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li>/gi, "  - ")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(71, 85, 105);

  const lines = pdf.splitTextToSize(plainText, contentWidth);
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (const line of lines) {
    if (y > pageHeight - 80) {
      pdf.addPage();
      y = margin;
    }
    pdf.text(line, margin, y);
    y += 12;
  }

  // ── Signature block ──
  if (y > pageHeight - 140) {
    pdf.addPage();
    y = margin;
  }
  y += 20;
  pdf.setDrawColor(226, 232, 240);
  pdf.line(margin, y, w - margin, y);
  y += 30;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(30, 41, 59);
  pdf.text("Electronic Signature", margin, y);
  y += 20;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(71, 85, 105);
  pdf.text(
    `By clicking "Accept & Continue", ${name} (${email}) electronically signed and agreed`,
    margin, y,
  );
  y += 14;
  pdf.text(`to the Terms & Conditions (Version ${termsVersion}) on ${timestamp}.`, margin, y);
  y += 30;

  // Signature line
  pdf.setDrawColor(15, 23, 42);
  pdf.setLineWidth(1);
  pdf.line(margin, y, margin + 200, y);
  y += 14;
  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139);
  pdf.text(name, margin, y);
  y += 12;
  pdf.text(timestamp, margin, y);

  // ── Footer ──
  const pages = pdf.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text(
      `Outpost Digital Solutions — Terms Acceptance Certificate — Page ${i} of ${pages}`,
      w / 2, pageHeight - 30, { align: "center" },
    );
  }

  return pdf.output("blob");
}

// ── Component ────────────────────────────────────────────────────────────────

export default function TermsModal({ uid, userName, userEmail, termsHtml, termsVersion, onAccepted, onDismiss }: TermsModalProps) {
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleAccept() {
    if (!accepted) return;
    setSaving(true);
    try {
      // 1. Fetch SSN via API (secrets are encrypted at rest)
      let ssn = "";
      try {
        const res = await fetch(`/api/admin/secrets?uid=${uid}&type=identity&reveal=true&callerUid=${uid}`);
        if (res.ok) {
          const json = await res.json();
          ssn = (json.data?.ssn as string) ?? "";
        }
      } catch {
        // proceed without SSN if fetch fails
      }

      const now = new Date();
      const timestamp = now.toISOString();

      // 2. Generate PDF certificate
      const pdfBlob = await generateCertificatePDF({
        name: userName,
        email: userEmail,
        ssn: ssn || "Not on file",
        termsVersion,
        termsHtml,
      });

      // 3. Upload to Firebase Storage
      const storagePath = `terms-certificates/${uid}/terms-v${termsVersion}-${now.getTime()}.pdf`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, pdfBlob, { contentType: "application/pdf" });
      const downloadURL = await getDownloadURL(storageRef);

      // 4. Save acceptance record to Firestore
      await setDoc(doc(db, "termsAcceptances", `${uid}_v${termsVersion}`), {
        uid,
        name: userName,
        email: userEmail,
        termsVersion,
        acceptedAt: serverTimestamp(),
        timestamp,
        storagePath,
        certificateUrl: downloadURL,
      });

      // 5. Update user profile
      await updateDoc(doc(db, "users", uid), {
        acceptedTermsVersion: termsVersion,
        acceptedTermsAt: serverTimestamp(),
      });

      onAccepted();
    } catch {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-app-surface border border-app-border-2 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col mx-4">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-app-border shrink-0">
          <h2 className="text-lg font-bold text-app-text">Terms & Conditions</h2>
          <p className="text-app-text-4 text-xs mt-1">Please review and accept the updated terms to continue.</p>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div
            className="prose prose-invert prose-sm max-w-none
              prose-headings:text-app-text prose-p:text-app-text-2
              prose-strong:text-app-text prose-li:text-app-text-2
              prose-a:text-app-accent prose-ul:list-disc prose-ol:list-decimal"
            dangerouslySetInnerHTML={{ __html: termsHtml }}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-app-border shrink-0 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-app-border-2 bg-app-surface-2 text-app-accent focus:ring-app-accent focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-app-text-2 text-sm">
              I have read and agree to the Terms & Conditions.
            </span>
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { if (onDismiss) onDismiss(); }}
              disabled={saving}
              className="flex-1 py-2.5 bg-app-surface-2 hover:bg-app-surface-2 border border-app-border-2 text-app-text-3 hover:text-app-text font-semibold text-sm rounded-lg transition"
            >
              Remind Me Later
            </button>
            <button
              type="button"
              onClick={handleAccept}
              disabled={!accepted || saving}
              className="flex-1 py-2.5 bg-app-accent hover:bg-app-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg transition flex items-center justify-center gap-2"
            >
              {saving ? <><Spinner className="w-4 h-4" /> Generating certificate...</> : "Accept & Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
