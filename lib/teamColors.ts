import type { CSSProperties } from "react";

/** Default 10-color palette — matches the previous hardcoded Tailwind map exactly. */
export const DEFAULT_TEAM_COLORS: Record<number, string> = {
  1:  "#3b82f6", // blue-500
  2:  "#a855f7", // purple-500
  3:  "#22c55e", // green-500
  4:  "#f97316", // orange-500
  5:  "#ef4444", // red-500
  6:  "#eab308", // yellow-500
  7:  "#ec4899", // pink-500
  8:  "#14b8a6", // teal-500
  9:  "#06b6d4", // cyan-500
  10: "#6366f1", // indigo-500
};

/**
 * Returns the hex color for a given team number.
 * Checks `overrides` first (Firestore-stored custom colors), then falls back
 * to the default 10-color cyclic palette.
 */
export function getTeamHex(n: number, overrides?: Record<number, string>): string {
  if (overrides) {
    const custom = overrides[n];
    if (custom) return custom;
  }
  return DEFAULT_TEAM_COLORS[((n - 1) % 10) + 1];
}

/**
 * Converts a hex color string into inline CSS for a badge/chip.
 * Uses 15% opacity background and 25% opacity border so it blends with dark UI.
 */
export function hexToBadgeStyle(hex: string): CSSProperties {
  return {
    backgroundColor: hex + "26", // 15% opacity
    color:           hex,
    borderColor:     hex + "40", // 25% opacity
    border:          "1px solid",
  };
}
