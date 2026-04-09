"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";

type Phase = "testing" | "merging" | "live";

export interface Team {
  id: string;
  name: string;
  type: "leadership" | "team";
  order: number;
  color: string;
  teamNumber?: number;
  roles?: string[];
}

interface TeamConfig {
  teams: Team[];
  teamCount: number;
  teamNames: Record<string, string>;
  phase: Phase;
  chatEnabled: boolean;
  loading: boolean;
}

/**
 * Reads teams collection + settings/appConfig once on mount.
 * Returns teams array, teamCount, teamNames, phase, and chatEnabled.
 */
export function useTeamConfig(): TeamConfig {
  const [teams, setTeams] = useState<Team[]>([]);
  const [phase, setPhase] = useState<Phase>("live");
  const [chatEnabled, setChatEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDocs(collection(db, "teams")),
      getDoc(doc(db, "settings", "appConfig")),
    ]).then(([teamsSnap, configSnap]) => {
      const t: Team[] = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Team));
      t.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
      setTeams(t);
      if (configSnap.exists()) {
        const d = configSnap.data();
        setPhase((d.phase as Phase) ?? "live");
        setChatEnabled(d.chatEnabled === true);
      }
    }).catch((err) => { console.error("[useTeamConfig] Failed to load teams:", err); }).finally(() => setLoading(false));
  }, []);

  const teamCount = teams.filter(t => t.type === "team").length;
  const teamNames: Record<string, string> = {};
  teams.filter(t => t.type === "team" && t.teamNumber).forEach(t => {
    teamNames[String(t.teamNumber)] = t.name;
  });

  return { teams, teamCount, teamNames, phase, chatEnabled, loading };
}
