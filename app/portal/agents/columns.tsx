"use client";

import type { OdsColDef, OdsRecord } from "ods-ui-library";
import { UserWithId } from "../../../lib/types";
import { hexToBadgeStyle } from "../../../lib/teamColors";
import type { Team } from "../../../lib/hooks/useTeamConfig";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AgentRow extends UserWithId {
  licenseAlertCount?: number;
  hasExpiredLicense?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function roleBadge(role: string) {
  switch (role) {
    case "developer": return "bg-purple-500/20 text-purple-300 border-purple-500/40";
    case "owner":     return "bg-amber-500/20  text-amber-300  border-amber-500/40";
    case "admin":     return "bg-app-accent/20  text-app-accent  border-app-accent/40";
    case "manager":   return "bg-teal-500/20   text-teal-300   border-teal-500/40";
    default:          return "bg-app-surface-2 text-app-text-3 border-app-border-2";
  }
}

export function roleLabel(role: string) {
  switch (role) {
    case "developer": return "Dev";
    case "owner":     return "Owner";
    case "admin":     return "Admin";
    case "manager":   return "TC/TL";
    default:          return "CSR";
  }
}

/** Find the team for a record — checks teamNumber first, then role for leadership teams */
function findTeam(record: OdsRecord, teams: Team[]): Team | undefined {
  const tn = Number(record.teamNumber ?? 0);
  if (tn > 0) return teams.find(t => t.teamNumber === tn);
  // Leadership — match by role
  const role = String(record.role ?? "");
  return teams.find(t => t.type === "leadership" && t.roles?.includes(role));
}

// ── Column definitions — all keys match Firestore user document fields ───────

export function buildAgentColumns(
  teams: Team[],
  teamEnumValues?: string[],
  teamEnumLabels?: Record<string, string>,
): OdsColDef[] {
  return [
    {
      key: "photoURL", label: "Photo", filterType: "text",
      render: (val, record) => {
        const url = String(val ?? "");
        const first = String(record.firstName ?? "").charAt(0).toUpperCase();
        const last = String(record.lastName ?? "").charAt(0).toUpperCase();
        const initials = (first + last) || "?";
        if (url) {
          return <img src={url} alt={initials} style={{ width: "1.75rem", height: "1.75rem", borderRadius: "9999px", objectFit: "cover" }} />;
        }
        // Generate a deterministic color from the name
        const name = `${record.firstName ?? ""}${record.lastName ?? ""}`;
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        const colors = ["#3b82f6", "#22c55e", "#a855f7", "#f59e0b", "#ef4444", "#6366f1", "#ec4899", "#14b8a6"];
        const bg = colors[Math.abs(hash) % colors.length];
        return (
          <div style={{
            width: "1.75rem", height: "1.75rem", borderRadius: "9999px",
            background: bg, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.5625rem", fontWeight: 700, color: "white", flexShrink: 0,
          }}>
            {initials}
          </div>
        );
      },
    },
    {
      key: "firstName", label: "First Name", sortable: true, editable: true, filterType: "text",
      render: (val) => <span className="text-app-text font-medium whitespace-nowrap">{String(val ?? "") || "—"}</span>,
    },
    {
      key: "lastName", label: "Last Name", sortable: true, editable: true, filterType: "text",
      render: (val) => <span className="text-app-text font-medium whitespace-nowrap">{String(val ?? "") || "—"}</span>,
    },
    {
      key: "email", label: "Email", sortable: true, editable: true, filterType: "text",
      render: (val) => <span className="text-app-text-3 text-[0.75rem]">{String(val ?? "") || "—"}</span>,
    },
    {
      key: "phone", label: "Phone", editable: true, filterType: "text",
      render: (val) => {
        const str = String(val ?? "");
        const d = str.replace(/\D/g, "");
        const fmt =
          d.length === 11 && d[0] === "1" ? `(${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}` :
          d.length === 10                  ? `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`  :
          str;
        return <span className="text-app-text-3 text-[0.75rem] whitespace-nowrap">{fmt || "—"}</span>;
      },
    },
    {
      key: "role", label: "Role", sortable: true, editable: true, filterType: "enum",
      enumValues: ["developer", "owner", "admin", "manager", "rep"],
      render: (val) => {
        const str = String(val ?? "");
        return (
          <span className={`text-[0.625rem] px-1.5 py-0.5 rounded border font-semibold ${roleBadge(str)}`}>
            {roleLabel(str)}
          </span>
        );
      },
    },
    {
      key: "teamNumber", label: "Team", sortable: true, editable: true, filterType: "enum",
      enumValues: teamEnumValues ?? [],
      enumLabels: teamEnumLabels,
      render: (val, record) => {
        const team = findTeam(record, teams);
        if (!team) return <span className="text-app-text-5">—</span>;
        const style = hexToBadgeStyle(team.color);
        return <span style={style} className="text-[0.625rem] px-1.5 py-0.5 rounded border font-medium whitespace-nowrap">{team.name}</span>;
      },
    },
    {
      key: "contractorId", label: "Contractor ID", sortable: true, editable: true, filterType: "text",
      render: (val) => {
        const str = String(val ?? "");
        return str
          ? <span className="text-[0.75rem] font-mono text-app-text-3">#{str}</span>
          : <span className="text-app-text-5">—</span>;
      },
    },
    {
      key: "active", label: "Active", sortable: true, editable: true, filterType: "enum",
      enumValues: ["true", "false"],
      render: (val) => {
        const active = val === true || val === "true";
        return active
          ? <span className="text-[0.6875rem] font-medium text-emerald-400">Active</span>
          : <span className="text-[0.6875rem] font-medium text-red-400">Inactive</span>;
      },
    },
  ];
}
