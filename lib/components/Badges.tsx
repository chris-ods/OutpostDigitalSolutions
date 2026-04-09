"use client";

import { useTeamColor } from "../teamColorContext";

// ── Role badge ────────────────────────────────────────────────────────────────

const ROLE_CLASSES: Record<string, string> = {
  developer: "bg-red-500/10 text-red-400 border-red-500/20",
  owner:     "bg-amber-500/10 text-amber-400 border-amber-500/20",
  admin:     "bg-blue-500/10 text-blue-400 border-blue-500/20",
  manager:   "bg-purple-500/10 text-purple-400 border-purple-500/20",
  rep:       "bg-app-surface-2/60 text-app-text-2 border-app-border-2",
};

const ROLE_LABELS: Record<string, string> = {
  developer: "Developer",
  owner:     "Owner",
  admin:     "Admin",
  manager:   "Manager",
  rep:       "Rep",
};

/** Colored pill showing the user's role. Unknown roles fall back to "Rep" styling. */
export function RoleBadge({ role, size = "sm" }: { role: string; size?: "xs" | "sm" }) {
  const cls = ROLE_CLASSES[role] ?? ROLE_CLASSES.rep;
  const textSize = size === "xs" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2.5 py-1";
  return (
    <span className={`inline-flex items-center rounded-full border font-semibold ${textSize} ${cls}`}>
      {ROLE_LABELS[role] ?? "Rep"}
    </span>
  );
}

// ── Team badge ────────────────────────────────────────────────────────────────

/** Colored pill showing the team number. Renders "—" for n=0. */
export function TeamBadge({ n }: { n: number }) {
  const { style } = useTeamColor(n);
  if (!n) return <span className="text-app-text-5 text-xs">—</span>;
  return (
    <span style={style} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border">
      Team {n}
    </span>
  );
}
