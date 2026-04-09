import { jsPDF } from "jspdf";
import type { Agreement } from "./agreements";

// Generate a document fingerprint — SHA-256 if available, fallback to simple hash
async function docHash(content: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
  } catch {
    // Fallback: simple string hash
    let h = 0;
    for (let i = 0; i < content.length; i++) {
      h = ((h << 5) - h + content.charCodeAt(i)) | 0;
    }
    return Math.abs(h).toString(16).padStart(16, "0");
  }
}

export async function generateOnboardingPDF({
  name, email, ssn, address, agreements, timestamp, logoDataUrl, signatureDataUrl,
}: {
  name: string;
  email: string;
  ssn: string;
  address: string;
  agreements: Agreement[];
  timestamp: Date;
  logoDataUrl?: string;
  signatureDataUrl?: string;
}): Promise<Blob> {
  const pdf = new jsPDF({ unit: "pt", format: "letter" });
  const w = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 60;
  const contentWidth = w - margin * 2;

  const ts = timestamp.toLocaleString("en-US", {
    month: "long", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", second: "2-digit", timeZoneName: "short",
  });

  const maskedSSN = ssn.length >= 4 ? `XXX-XX-${ssn.slice(-4)}` : "XXX-XX-XXXX";

  // Document hash for tamper evidence
  const hashInput = `${name}|${email}|${ssn}|${address}|${timestamp.toISOString()}|${agreements.map(a => a.id).join(",")}`;
  const fingerprint = await docHash(hashInput);

  // ── Header with logo ──
  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, w, 90, "F");

  if (logoDataUrl) {
    try {
      pdf.addImage(logoDataUrl, "PNG", margin, 12, 66, 66);
    } catch { /* logo load failed — skip */ }
  }

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  const titleX = logoDataUrl ? margin + 78 : margin;
  pdf.text("Outpost Digital Solutions", titleX, 42);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(180, 190, 210);
  pdf.text("Onboarding Agreement Packet", titleX, 58);
  pdf.setFontSize(8);
  pdf.text(`Document ID: ${fingerprint.toUpperCase()}`, titleX, 72);

  // ── Signer details ──
  let y = 118;
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(margin, y - 10, contentWidth, 88, 4, 4, "F");
  pdf.setTextColor(30, 41, 59);
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.text("Signer Information", margin + 14, y + 6);
  y += 22;

  const details: [string, string][] = [
    ["Full Name", name],
    ["Email", email],
    ["SSN", maskedSSN],
    ["Address", address],
    ["Signed", ts],
  ];

  for (const [label, value] of details) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(label.toUpperCase(), margin + 14, y);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(15, 23, 42);
    pdf.text(value, margin + 90, y);
    y += 13;
  }

  y += 16;

  // ── Agreements ──
  for (const agreement of agreements) {
    if (y > pageH - 100) { pdf.addPage(); y = margin; }

    // Agreement title bar
    pdf.setFillColor(241, 245, 249);
    pdf.roundedRect(margin, y - 6, contentWidth, 22, 3, 3, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(15, 23, 42);
    pdf.text(agreement.title, margin + 8, y + 9);
    y += 26;

    // Agreement body
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(71, 85, 105);

    const lines = pdf.splitTextToSize(agreement.body, contentWidth - 16);
    for (const line of lines) {
      if (y > pageH - 60) { pdf.addPage(); y = margin; }
      pdf.text(line, margin + 8, y);
      y += 11;
    }

    // Checkmark line
    y += 4;
    pdf.setFontSize(8);
    pdf.setTextColor(22, 163, 74); // green
    pdf.text("✓ Agreed and acknowledged by signer", margin + 8, y);
    y += 20;
  }

  // ── Electronic Signature Block ──
  if (y > pageH - 200) { pdf.addPage(); y = margin; }

  // Signature box
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(203, 213, 225);
  pdf.setLineWidth(1);
  pdf.roundedRect(margin, y, contentWidth, 150, 6, 6, "FD");

  y += 20;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(15, 23, 42);
  pdf.text("Electronic Signature", margin + 16, y);
  y += 18;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.setTextColor(71, 85, 105);
  const sigText = `By clicking "Sign & Complete Onboarding", the signer electronically signed and agreed to all documents contained in this onboarding packet. This constitutes a legally binding electronic signature under the ESIGN Act (15 U.S.C. §7001).`;
  const sigLines = pdf.splitTextToSize(sigText, contentWidth - 32);
  for (const line of sigLines) {
    pdf.text(line, margin + 16, y);
    y += 11;
  }

  y += 6;

  // Signature image or fallback cursive text
  if (signatureDataUrl) {
    try {
      pdf.addImage(signatureDataUrl, "PNG", margin + 16, y - 4, 220, 50);
      y += 52;
    } catch {
      // fallback to text
      pdf.setFont("helvetica", "bolditalic");
      pdf.setFontSize(22);
      pdf.setTextColor(15, 23, 42);
      pdf.text(name, margin + 16, y + 20);
      y += 30;
    }
  } else {
    pdf.setFont("helvetica", "bolditalic");
    pdf.setFontSize(22);
    pdf.setTextColor(15, 23, 42);
    pdf.text(name, margin + 16, y + 20);
    y += 30;
  }

  // Signature line
  pdf.setDrawColor(15, 23, 42);
  pdf.setLineWidth(0.75);
  pdf.line(margin + 16, y, margin + 250, y);
  y += 12;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`${name} · ${email}`, margin + 16, y);
  y += 10;
  pdf.text(`Signed: ${ts}`, margin + 16, y);
  y += 10;
  pdf.text(`Document Fingerprint: ${fingerprint.toUpperCase()}`, margin + 16, y);

  // ── Footer on every page ──
  const pages = pdf.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(7);
    pdf.setTextColor(148, 163, 184);
    pdf.text(
      `Outpost Digital Solutions LLC — Onboarding Packet — ${fingerprint.toUpperCase()} — Page ${i} of ${pages}`,
      w / 2, pageH - 24, { align: "center" },
    );
    // Bottom border
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.5);
    pdf.line(margin, pageH - 36, w - margin, pageH - 36);
  }

  return pdf.output("blob");
}
