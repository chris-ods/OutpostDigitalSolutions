import { jsPDF } from "jspdf";

interface PayrollPDFRow {
  name: string;
  contractorId: string;
  teamNumber: number;
  role: string;
  base: number;
  appBonus: number;
  appCount: number;
  hours: number;
  volumeBonus: number;
  producerBonus: number;
  adjustment: number;
  adjustmentNotes: string;
  total: number;
}

interface PayrollPDFOptions {
  periodStart: string;
  periodEnd: string;
  payday: string;
  rows: PayrollPDFRow[];
  totalPayroll: number;
  lockedBy: string;
  lockedAt: Date;
  paidAt: Date;
  logoDataUrl?: string;
}

const $ = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function fmtDateTime(d: Date): string {
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function fmtPeriod(start: string, end: string): string {
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

export function generatePayrollPDF(opts: PayrollPDFOptions): Blob {
  const pdf = new jsPDF({ unit: "pt", format: "letter", orientation: "landscape" });
  const w = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = w - margin * 2;

  // ── Colors ──
  const DARK = [15, 23, 42] as const;      // slate-900
  const MED = [71, 85, 105] as const;       // slate-500
  const LIGHT = [148, 163, 184] as const;   // slate-400
  const ACCENT = [59, 130, 246] as const;   // blue-500
  const GREEN = [22, 163, 74] as const;     // green-600
  const BORDER = [226, 232, 240] as const;  // slate-200
  const ZEBRA = [248, 250, 252] as const;   // slate-50
  const WHITE = [255, 255, 255] as const;

  // ── Header bar ──
  pdf.setFillColor(...DARK);
  pdf.rect(0, 0, w, 70, "F");

  if (opts.logoDataUrl) {
    try { pdf.addImage(opts.logoDataUrl, "PNG", margin, 8, 54, 54); } catch { /* skip */ }
  }

  const titleX = opts.logoDataUrl ? margin + 64 : margin;
  pdf.setTextColor(...WHITE);
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text("Outpost Digital Solutions", titleX, 30);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(180, 190, 210);
  pdf.text("Payroll Register", titleX, 44);
  pdf.setFontSize(8);
  pdf.text(`Period: ${fmtPeriod(opts.periodStart, opts.periodEnd)}  |  Payday: ${fmtDate(new Date(opts.payday + "T12:00:00"))}`, titleX, 58);

  // ── Summary strip ──
  let y = 88;
  pdf.setFillColor(241, 245, 249); // slate-100
  pdf.roundedRect(margin, y, contentWidth, 36, 3, 3, "F");

  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...MED);

  const summaryItems: [string, string][] = [
    ["TOTAL PAYROLL", $(opts.totalPayroll)],
    ["EMPLOYEES", String(opts.rows.length)],
    ["VALIDATED BY", opts.lockedBy],
    ["LOCKED", fmtDateTime(opts.lockedAt)],
    ["PAID", fmtDateTime(opts.paidAt)],
  ];

  const colW = contentWidth / summaryItems.length;
  summaryItems.forEach(([label, value], i) => {
    const cx = margin + colW * i + colW / 2;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...LIGHT);
    pdf.text(label, cx, y + 14, { align: "center" });
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...DARK);
    pdf.text(value, cx, y + 27, { align: "center" });
  });

  y += 48;

  // ── Table ──
  const cols = [
    { label: "Name",           key: "name",          w: 130, align: "left"  as const },
    { label: "ID",             key: "contractorId",   w: 55,  align: "left"  as const },
    { label: "Team",           key: "teamNumber",     w: 40,  align: "center" as const },
    { label: "Role",           key: "role",           w: 50,  align: "left"  as const },
    { label: "Hours",          key: "hours",          w: 45,  align: "right" as const },
    { label: "Base",           key: "base",           w: 65,  align: "right" as const },
    { label: "Apps",           key: "appCount",       w: 38,  align: "center" as const },
    { label: "App Bonus",      key: "appBonus",       w: 65,  align: "right" as const },
    { label: "Vol. Bonus",     key: "volumeBonus",    w: 65,  align: "right" as const },
    { label: "Prod. Bonus",    key: "producerBonus",  w: 65,  align: "right" as const },
    { label: "Adj.",           key: "adjustment",     w: 55,  align: "right" as const },
    { label: "Total",          key: "total",          w: 70,  align: "right" as const },
  ];

  // Distribute remaining width proportionally
  const totalColW = cols.reduce((s, c) => s + c.w, 0);
  const scale = contentWidth / totalColW;
  cols.forEach(c => { c.w = Math.floor(c.w * scale); });

  const ROW_H = 16;
  const HEADER_H = 20;

  function drawTableHeader(startY: number): number {
    // Header background
    pdf.setFillColor(...ACCENT);
    pdf.rect(margin, startY, contentWidth, HEADER_H, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(...WHITE);

    let x = margin;
    cols.forEach(col => {
      const textX = col.align === "right" ? x + col.w - 6
                  : col.align === "center" ? x + col.w / 2
                  : x + 6;
      pdf.text(col.label, textX, startY + 13, { align: col.align });
      x += col.w;
    });

    return startY + HEADER_H;
  }

  function drawRow(row: PayrollPDFRow, startY: number, isZebra: boolean): number {
    if (isZebra) {
      pdf.setFillColor(...ZEBRA);
      pdf.rect(margin, startY, contentWidth, ROW_H, "F");
    }

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(...DARK);

    let x = margin;
    cols.forEach(col => {
      let val: string;
      switch (col.key) {
        case "name":          val = row.name; break;
        case "contractorId":  val = row.contractorId || "—"; break;
        case "teamNumber":    val = row.teamNumber ? String(row.teamNumber) : "—"; break;
        case "role":          val = row.role; break;
        case "hours":         val = String(row.hours); break;
        case "base":          val = $(row.base); break;
        case "appCount":      val = String(row.appCount); break;
        case "appBonus":      val = $(row.appBonus); break;
        case "volumeBonus":   val = $(row.volumeBonus); break;
        case "producerBonus": val = $(row.producerBonus); break;
        case "adjustment":    val = row.adjustment !== 0 ? $(row.adjustment) : "—"; break;
        case "total":         val = $(row.total); break;
        default:              val = "";
      }

      // Bold the total column
      if (col.key === "total") {
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...DARK);
      }

      const textX = col.align === "right" ? x + col.w - 6
                  : col.align === "center" ? x + col.w / 2
                  : x + 6;

      // Truncate long names
      if (col.key === "name" && val.length > 22) val = val.slice(0, 21) + "…";

      pdf.text(val, textX, startY + 11, { align: col.align });

      // Reset font after total
      if (col.key === "total") {
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...DARK);
      }

      x += col.w;
    });

    return startY + ROW_H;
  }

  // Group rows by team
  const teamGroups = new Map<string, PayrollPDFRow[]>();
  for (const row of opts.rows) {
    const section = row.role === "Staff" ? "STAFF"
                  : row.role === "Developer" ? "DEVELOPERS"
                  : row.teamNumber ? `TEAM ${row.teamNumber}` : "OTHER";
    if (!teamGroups.has(section)) teamGroups.set(section, []);
    teamGroups.get(section)!.push(row);
  }

  // Sort team keys: TEAM 1, TEAM 2, ..., STAFF, DEVELOPERS, OTHER
  const sortedKeys = [...teamGroups.keys()].sort((a, b) => {
    const order = (k: string) => {
      if (k.startsWith("TEAM")) return parseInt(k.replace("TEAM ", ""), 10);
      if (k === "STAFF") return 900;
      if (k === "DEVELOPERS") return 950;
      return 999;
    };
    return order(a) - order(b);
  });

  // Draw table
  y = drawTableHeader(y);

  for (const section of sortedKeys) {
    const sectionRows = teamGroups.get(section)!;

    // Check if we need a new page for section header + at least 2 rows
    if (y + ROW_H * 3 > pageH - 50) {
      pdf.addPage();
      y = margin;
      y = drawTableHeader(y);
    }

    // Section header
    pdf.setFillColor(241, 245, 249);
    pdf.rect(margin, y, contentWidth, ROW_H, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(...ACCENT);
    pdf.text(section, margin + 6, y + 11);

    const sectionTotal = sectionRows.reduce((s, r) => s + r.total, 0);
    pdf.setTextColor(...MED);
    pdf.text(`Subtotal: ${$(sectionTotal)}`, margin + contentWidth - 6, y + 11, { align: "right" });
    y += ROW_H;

    // Rows
    sectionRows.forEach((row, i) => {
      if (y + ROW_H > pageH - 50) {
        pdf.addPage();
        y = margin;
        y = drawTableHeader(y);
      }
      y = drawRow(row, y, i % 2 === 0);
    });

    // Thin separator after each section
    pdf.setDrawColor(...BORDER);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, margin + contentWidth, y);
  }

  // ── Grand total row ──
  if (y + 24 > pageH - 50) {
    pdf.addPage();
    y = margin;
  }

  y += 4;
  pdf.setFillColor(...DARK);
  pdf.roundedRect(margin, y, contentWidth, 22, 3, 3, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...WHITE);
  pdf.text("GRAND TOTAL", margin + 10, y + 14);
  pdf.text($(opts.totalPayroll), margin + contentWidth - 10, y + 14, { align: "right" });
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "normal");
  pdf.text(`${opts.rows.length} employees`, margin + 110, y + 14);

  y += 34;

  // ── Adjustment notes section (if any adjustments exist) ──
  const adjustedRows = opts.rows.filter(r => r.adjustment !== 0 && r.adjustmentNotes);
  if (adjustedRows.length > 0) {
    if (y + 20 + adjustedRows.length * 12 > pageH - 50) {
      pdf.addPage();
      y = margin;
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...DARK);
    pdf.text("Adjustment Notes", margin, y + 10);
    y += 18;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...MED);

    adjustedRows.forEach(r => {
      if (y + 12 > pageH - 50) { pdf.addPage(); y = margin; }
      pdf.text(`${r.name}: ${$(r.adjustment)} — ${r.adjustmentNotes}`, margin + 6, y);
      y += 12;
    });
  }

  // ── Certification block ──
  if (y + 60 > pageH - 50) {
    pdf.addPage();
    y = margin;
  }

  y += 10;
  pdf.setDrawColor(...BORDER);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(margin, y, contentWidth, 48, 3, 3, "S");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...DARK);
  pdf.text("Certification", margin + 10, y + 14);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.setTextColor(...MED);
  pdf.text(
    `This payroll register was validated by ${opts.lockedBy} on ${fmtDateTime(opts.lockedAt)} and marked as paid on ${fmtDateTime(opts.paidAt)}.`,
    margin + 10, y + 28,
  );
  pdf.text(
    "This document is generated for internal accounting and audit purposes. Outpost Digital Solutions LLC — All Rights Reserved.",
    margin + 10, y + 40,
  );

  // ── Footer on every page ──
  const pages = pdf.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(6.5);
    pdf.setTextColor(...LIGHT);
    pdf.text(
      `Outpost Digital Solutions LLC — Payroll Register — ${fmtPeriod(opts.periodStart, opts.periodEnd)} — Page ${i} of ${pages}`,
      w / 2, pageH - 20, { align: "center" },
    );
    pdf.setDrawColor(...BORDER);
    pdf.setLineWidth(0.5);
    pdf.line(margin, pageH - 30, w - margin, pageH - 30);
  }

  return pdf.output("blob") as unknown as Blob;
}
