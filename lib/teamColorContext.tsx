"use client";

import { createContext, useContext, useEffect, useState, type CSSProperties } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { DEFAULT_TEAM_COLORS, getTeamHex, hexToBadgeStyle } from "./teamColors";

// ── Context ───────────────────────────────────────────────────────────────────

const TeamColorsContext = createContext<Record<number, string>>(DEFAULT_TEAM_COLORS);

// ── Provider ──────────────────────────────────────────────────────────────────

/**
 * Reads team colors from the teams collection once on mount.
 * Renders children immediately with the default palette; silently upgrades
 * when the Firestore read completes.
 */
export function TeamColorProvider({ children }: { children: React.ReactNode }) {
  const [colors, setColors] = useState<Record<number, string>>(DEFAULT_TEAM_COLORS);

  useEffect(() => {
    getDocs(collection(db, "teams"))
      .then(snap => {
        const parsed: Record<number, string> = {};
        snap.docs.forEach(d => {
          const data = d.data();
          if (data.teamNumber && data.color) {
            parsed[data.teamNumber as number] = data.color as string;
          }
        });
        if (Object.keys(parsed).length > 0) setColors(parsed);
      })
      .catch(() => { /* stay on defaults */ });
  }, []);

  return (
    <TeamColorsContext.Provider value={colors}>
      {children}
    </TeamColorsContext.Provider>
  );
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** Returns the full teamColors map — keyed by team number, value is hex string. */
export function useTeamColors(): Record<number, string> {
  return useContext(TeamColorsContext);
}

/** Returns the hex color and ready-to-use badge inline style for a given team number. */
export function useTeamColor(n: number): { hex: string; style: CSSProperties } {
  const colors = useContext(TeamColorsContext);
  const hex = getTeamHex(n, colors);
  return { hex, style: hexToBadgeStyle(hex) };
}
