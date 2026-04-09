/** Format a dollar amount with no decimal places: $1,234 */
export function fmtDollars(v: number): string {
  return "$" + (v || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

/** Format an ISO date string (YYYY-MM-DD) for display: Jan 15, 2025. Returns "—" for empty/invalid. */
export function fmtDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso + "T12:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Format a 10-digit phone string for display: (555) 123-4567 */
export function fmtPhone(digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
}
