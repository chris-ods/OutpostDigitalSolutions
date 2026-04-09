"use client";

import { useEffect, useState, useRef } from "react";
import { collection, getDocs, writeBatch, doc, serverTimestamp, query, where } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { UserProfile, UserWithId, Client } from "../../../../lib/types";
import { useUserClaim } from "../../../../lib/hooks/useUserClaim";
import { getWeekStart } from "../../../../lib/weekUtils";
import { useRouter } from "next/navigation";
import { Spinner } from "../../../../lib/components/Spinner";

// ─── Types ────────────────────────────────────────────────────────────────────

type MatchStatus = "matched" | "unprovisioned" | "former" | "skip";

interface ParsedRow {
  // raw from CSV
  repName: string;
  repContractorId: string;
  date: string;
  clientName: string;
  phone: string;
  email: string;
  startDate: string;
  state: string;
  carrier: string;
  appNumber: string;
  annualPremium: number;
  portalName: string;  // manager name from CSV
  teamName: string;
  agentStatus: string;
  adminStatus: string;
  splitPercent: number;
  clientPaidDateRaw: string;
  compDateRaw: string;
  notes: string;
  payroll: boolean;
  firedCSR: string;
  // resolution
  rowIndex: number;
  status: MatchStatus;
  matchedUser?: UserWithId;
  matchedPortal?: UserWithId;
}

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; }
    else if (ch === "," && !inQ) { result.push(cur.trim()); cur = ""; }
    else { cur += ch; }
  }
  result.push(cur.trim());
  return result;
}

function parseDate(raw: string): string {
  if (!raw) return "";
  // M/D/YYYY or M/D/YY
  const mdy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (mdy) {
    const [, m, d, yRaw] = mdy;
    const y = yRaw.length === 2
      ? (parseInt(yRaw, 10) <= 50 ? "20" : "19") + yRaw
      : yRaw;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const iso = raw.match(/^\d{4}-\d{2}-\d{2}$/);
  if (iso) return raw;
  return "";
}

function toNum(v: string): number {
  if (!v) return 0;
  return parseFloat(v.replace(/[$,]/g, "")) || 0;
}

function normalizeCarrier(raw: string): Client["carrier"] {
  const map: Record<string, Client["carrier"]> = {
    americo: "Americo", amam: "AMAM", aetna: "Aetna", cica: "CICA",
    chubb: "Chubb", corebridge: "Corebridge", ethos: "Ethos", moo: "MOO",
    trans: "Trans", transamerica: "Trans", instabrain: "Instabrain",
  };
  const key = raw.toLowerCase().trim();
  return map[key] ?? "Other";
}

function normalizeAgentStatus(raw: string): Client["agentStatus"] {
  const statuses: Client["agentStatus"][] = ["Approved", "Declined", "Sent UW", "Pending", "Cancelled"];
  const found = statuses.find(s => s.toLowerCase() === raw.toLowerCase().trim());
  return found ?? "Pending";
}

function normalizeAdminStatus(raw: string): Client["adminStatus"] {
  const statuses: Client["adminStatus"][] = [
    "Client Paid|Comp Paid", "Client Paid|Waiting on Comp", "Comp Paid|Client Not Paid",
    "Pending Client Payment", "UW or Requirements", "Decline - Rewrite", "Lapsed", "CXL",
  ];
  const found = statuses.find(s => s.toLowerCase() === raw.toLowerCase().trim());
  return found ?? "Pending Client Payment";
}

function nameLookupKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// ─── Main parser ──────────────────────────────────────────────────────────────

function parseClientCSV(text: string): Omit<ParsedRow, "status" | "matchedUser" | "matchedPortal">[] {
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return [];

  // Find header row
  let headerIdx = 0;
  let colMap: Record<string, number> = {};
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const cells = parseCSVLine(lines[i]);
    const lower = cells.map(c => c.toLowerCase());
    if (lower.some(c => c.includes("client") || c.includes("carrier") || c.includes("premium"))) {
      headerIdx = i;
      cells.forEach((c, idx) => { colMap[c.toLowerCase().trim()] = idx; });
      break;
    }
  }

  // Flexible column resolution
  function col(...candidates: string[]): number {
    for (const c of candidates) {
      if (colMap[c] !== undefined) return colMap[c];
      // partial match
      const found = Object.entries(colMap).find(([k]) => k.includes(c));
      if (found) return found[1];
    }
    return -1;
  }

  const idxRepName     = col("name", "rep name", "agent name", "rep");
  const idxRepId       = col("id", "contractor id", "rep id", "agent id", "employee id");
  const idxDate        = col("date");
  const idxClientName  = col("client name", "client", "customer name", "customer");
  const idxPhone       = col("phone", "phone number");
  const idxEmail       = col("email");
  const idxStartDate   = col("start date", "startdate", "effective date");
  const idxState       = col("state");
  const idxCarrier     = col("carrier");
  const idxAppNum      = col("app number", "app #", "appnumber", "application");
  const idxPremium     = col("annual premium", "premium", "annualpremium");
  const idxPortal      = col("portal", "manager", "team name", "team");
  const idxAgentStatus = col("agent status", "agentstatus");
  const idxAdminStatus = col("admin status", "adminstatus");
  const idxSplit          = col("split", "split %", "split percent");
  const idxClientPaidDate = col("client paid date", "clientpaiddate", "client paid");
  const idxCompDate       = col("comp date", "compdate", "comp paid date");
  const idxNotes          = col("notes", "note", "comments");
  const idxPayroll        = col("payroll");
  const idxFiredCSR       = col("fired csr", "csr", "fired");

  const rows: Omit<ParsedRow, "status" | "matchedUser" | "matchedPortal">[] = [];
  let rowIndex = 0;

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cells = parseCSVLine(lines[i]);
    const get = (idx: number) => (idx >= 0 ? cells[idx] ?? "" : "");

    const clientName = get(idxClientName);
    if (!clientName) continue; // skip empty rows

    const date = parseDate(get(idxDate));
    if (!date) continue; // skip rows without a date

    rows.push({
      rowIndex: rowIndex++,
      repName:        get(idxRepName),
      repContractorId: get(idxRepId),
      date,
      clientName,
      phone:          get(idxPhone),
      email:          get(idxEmail),
      startDate:      parseDate(get(idxStartDate)),
      state:          get(idxState).toUpperCase(),
      carrier:        get(idxCarrier),
      appNumber:      get(idxAppNum),
      annualPremium:  toNum(get(idxPremium)),
      portalName:     get(idxPortal),
      teamName:       "", // derived from matched user
      agentStatus:    get(idxAgentStatus),
      adminStatus:    get(idxAdminStatus),
      splitPercent:   (() => {
        const raw = get(idxSplit).trim().toLowerCase();
        if (raw === "true") return 50;
        if (raw === "false" || raw === "") return 0;
        return toNum(raw);
      })(),
      clientPaidDateRaw: parseDate(get(idxClientPaidDate)),
      compDateRaw:       parseDate(get(idxCompDate)),
      notes:          get(idxNotes),
      payroll:        get(idxPayroll).trim().toLowerCase() === "true",
      firedCSR:       get(idxRepId).trim().endsWith("999") ? "Fired" : get(idxFiredCSR).trim(),
    });
  }

  return rows;
}

// ─── Match rows to users ──────────────────────────────────────────────────────

function resolveRows(
  rawRows: Omit<ParsedRow, "status" | "matchedUser" | "matchedPortal">[],
  users: UserWithId[],
): ParsedRow[] {
  const byContractorId = new Map<string, UserWithId>();
  const byName = new Map<string, UserWithId>();
  for (const u of users) {
    if (u.contractorId) byContractorId.set(u.contractorId.trim(), u);
    byName.set(nameLookupKey(`${u.firstName} ${u.lastName}`), u);
    byName.set(nameLookupKey(u.firstName), u); // first name fallback
  }

  // TC lookup: given a team number, find the active manager for that team.
  // Uses a direct search so Firestore string/number type differences don't matter.
  function findTC(teamNum: number): UserWithId | undefined {
    return users.find(
      u => u.role === "manager" && u.active !== false && Number(u.teamNumber) === teamNum
    );
  }

  return rawRows.map(r => {
    // Match rep
    let matchedUser: UserWithId | undefined =
      byContractorId.get(r.repContractorId.trim()) ??
      byName.get(nameLookupKey(r.repName));

    // For fired contractors (X999), the leading digit of the contractor ID is the
    // team number — assign the portal to that team's TC regardless of the Portal column.
    // Scales automatically as teams are added.
    // For active reps, match portal by name unless it's Cyruss (COO, no commission).
    let matchedPortal: UserWithId | undefined;
    const cid = r.repContractorId.trim();
    if (cid.endsWith("999")) {
      const teamNum = parseInt(cid.charAt(0), 10);
      if (!isNaN(teamNum) && teamNum > 0) matchedPortal = findTC(teamNum);
    } else if (r.portalName && r.portalName.trim().toLowerCase() !== "cyruss") {
      // "Cyruss" = COO, does not collect commission — treat as no split; any other name = TC split
      matchedPortal =
        byName.get(nameLookupKey(r.portalName)) ??
        users.find(u => u.firstName.toLowerCase() === r.portalName.toLowerCase().trim());
    }

    const status: MatchStatus = matchedUser
      ? (matchedUser.active !== false ? "matched" : "former")
      : "unprovisioned";

    return { ...r, status, matchedUser, matchedPortal };
  });
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: MatchStatus }) {
  const styles: Record<MatchStatus, string> = {
    matched:       "bg-green-500/10 text-green-400 border-green-500/25",
    unprovisioned: "bg-yellow-500/10 text-yellow-400 border-yellow-500/25",
    former:        "bg-orange-500/10 text-orange-400 border-orange-500/25",
    skip:          "bg-app-surface-2/50 text-app-text-4 border-app-border-2",
  };
  const labels: Record<MatchStatus, string> = {
    matched: "Matched", unprovisioned: "Unprovisioned", former: "Former/Inactive", skip: "Skip",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ImportClientsPage() {
  const router = useRouter();
  const claim = useUserClaim();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithId[]>([]);

  const [existingAppNums, setExistingAppNums] = useState<Set<string>>(new Set());
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const [importing, setImporting] = useState(false);
  const [importLog, setImportLog] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);

  const [repairingTeams, setRepairingTeams] = useState(false);
  const [repairLog, setRepairLog] = useState<string[]>([]);

  // Load users + app numbers once auth resolves
  useEffect(() => {
    if (claim.loading || !claim.uid) return;
    (async () => {
      const [usersSnap, clientSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "clients")),
      ]);
      const all: UserWithId[] = [];
      usersSnap.forEach(d => all.push({ ...(d.data() as UserProfile), uid: d.id }));
      setUsers(all);
      const nums = new Set<string>();
      clientSnap.forEach(d => { const n = d.data().appNumber; if (n) nums.add(String(n)); });
      setExistingAppNums(nums);
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claim.loading, claim.uid]);

  async function handleRepairTeams() {
    setRepairingTeams(true);
    setRepairLog([]);
    try {
      const snap = await getDocs(collection(db, "clients"));
      const toFix = snap.docs.filter(d => {
        const data = d.data();
        return (data.agentTeamNumber === 0 || data.agentTeamNumber == null) && data.contractorId;
      });
      if (toFix.length === 0) {
        setRepairLog(["No clients need repair — all have a valid team number."]);
        setRepairingTeams(false);
        return;
      }
      const BATCH_SIZE = 499;
      let fixed = 0;
      for (let i = 0; i < toFix.length; i += BATCH_SIZE) {
        const chunk = toFix.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(db);
        for (const d of chunk) {
          const contractorId: string = d.data().contractorId ?? "";
          const firstDigit = parseInt(contractorId.trim().charAt(0), 10);
          const teamNumber = !isNaN(firstDigit) && firstDigit > 0 ? firstDigit : 0;
          if (teamNumber > 0) {
            batch.update(d.ref, { agentTeamNumber: teamNumber });
            fixed++;
          }
        }
        await batch.commit();
        setRepairLog(l => [...l, `Batch ${Math.ceil((i + 1) / BATCH_SIZE)}: processed ${chunk.length} docs`]);
      }
      setRepairLog(l => [...l, `Done — ${fixed} clients updated with corrected team numbers.`]);
    } catch (e) {
      setRepairLog(l => [...l, `Error: ${String(e)}`]);
    } finally {
      setRepairingTeams(false);
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const raw = parseClientCSV(text);
      const resolved = resolveRows(raw, users);
      setRows(resolved);
      setStep("preview");
    };
    reader.readAsText(file);
  }

  function toggleStatus(rowIndex: number) {
    setRows(prev => prev.map(r => {
      if (r.rowIndex !== rowIndex) return r;
      // cycle: matched/unprovisioned/former → skip → back
      const next: MatchStatus = r.status === "skip"
        ? (r.matchedUser ? (r.matchedUser.active !== false ? "matched" : "former") : "unprovisioned")
        : "skip";
      return { ...r, status: next };
    }));
  }

  const counts = rows.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {} as Record<MatchStatus, number>);

  async function handleImport() {
    // Deduplicate within this CSV too (keep first occurrence of each appNumber)
    const seenInBatch = new Set<string>();
    const toImport = rows.filter(r => {
      if (r.status === "skip") return false;
      const num = r.appNumber?.trim();
      if (num && existingAppNums.has(num)) return false; // already in DB
      if (num && seenInBatch.has(num)) return false;     // duplicate within CSV
      if (num) seenInBatch.add(num);
      return true;
    });
    if (toImport.length === 0) return;

    setImporting(true);
    setImportLog([]);
    setErrorMsg("");

    try {
      const BATCH_SIZE = 499;
      let imported = 0;

      for (let i = 0; i < toImport.length; i += BATCH_SIZE) {
        const chunk = toImport.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(db);

        for (const r of chunk) {
          const isFiredContractor = r.repContractorId.trim().endsWith("999");

          // Fired-contractor (X999): TC wrote the application — assign directly to TC.
          // Active rep: use matched user if provisioned, otherwise pending placeholder.
          let agentId: string;
          let agentName: string;
          let contractorId: string;
          let agentTeamNumber: number;
          let portalUid: string;
          let portalName: string;

          if (isFiredContractor && r.matchedPortal) {
            // TC is the agent of record
            agentId          = r.matchedPortal.uid;
            agentName        = `${r.matchedPortal.firstName} ${r.matchedPortal.lastName}`;
            contractorId     = r.matchedPortal.contractorId ?? "";
            agentTeamNumber  = Number(r.matchedPortal.teamNumber) || 0;
            portalUid        = "";
            portalName       = "";
          } else {
            agentId          = r.matchedUser?.uid ?? `pending:${r.repContractorId || nameLookupKey(r.repName)}`;
            agentName        = r.matchedUser
              ? `${r.matchedUser.firstName} ${r.matchedUser.lastName}`
              : r.repName;
            contractorId     = r.matchedUser?.contractorId ?? r.repContractorId;
            const firstDigit = parseInt((r.repContractorId ?? "").trim().charAt(0), 10);
            agentTeamNumber  = r.matchedUser?.teamNumber ?? (!isNaN(firstDigit) && firstDigit > 0 ? firstDigit : 0);
            portalUid        = r.matchedPortal?.uid ?? "";
            portalName       = r.matchedPortal
              ? `${r.matchedPortal.firstName} ${r.matchedPortal.lastName}`
              : r.portalName;
          }

          const weekStart = r.date ? getWeekStart(new Date(r.date + "T12:00:00")) : "";

          const ref = doc(collection(db, "clients"));
          batch.set(ref, {
            agentId,
            agentName,
            contractorId,
            agentTeamNumber,
            date: r.date,
            clientName: r.clientName,
            phone: r.phone,
            email: r.email,
            startDate: r.startDate,
            state: r.state,
            carrier: normalizeCarrier(r.carrier),
            appNumber: r.appNumber,
            annualPremium: r.annualPremium,
            portal: portalUid,
            portalName,
            agentStatus: normalizeAgentStatus(r.agentStatus),
            adminStatus: normalizeAdminStatus(r.adminStatus),
            splitPercent: r.splitPercent,
            payroll: r.payroll,
            clientPaidDate: r.clientPaidDateRaw,
            compDate: r.compDateRaw,
            notes: r.notes,
            firedCSR: r.firedCSR,
            weekStart,
            createdAt: serverTimestamp(),
            createdBy: "csv-import",
            createdByName: "CSV Import",
          });
        }

        await batch.commit();
        imported += chunk.length;
        setImportLog(l => [...l, `Batch ${Math.ceil((i + 1) / BATCH_SIZE)}: wrote ${chunk.length} clients (${imported} total)`]);
      }

      setImportLog(l => [...l, `Done — ${imported} clients imported.`]);
      setStep("done");
    } catch (e) {
      setErrorMsg(String(e));
    } finally {
      setImporting(false);
    }
  }

  // ─── Auth guard ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  if (!claim.isAdmin) {
    return (
      <div className="p-8">
        <p className="text-app-text-3">Admin access required.</p>
      </div>
    );
  }

  // ─── Upload step ──────────────────────────────────────────────────────────

  if (step === "upload") {
    return (
      <div className="p-8 max-w-2xl overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Import Clients</h1>
          <p className="text-app-text-3 text-sm mt-1">
            Upload your team sales tracker CSV. Reps without accounts will be marked as
            <span className="text-yellow-400"> Unprovisioned</span> and can be linked later.
          </p>
        </div>

        <div className="bg-app-surface border border-app-border rounded-xl p-6 mb-4">
          <p className="text-app-text-3 text-sm mb-4">Expected CSV columns (order flexible, headers required):</p>
          <div className="grid grid-cols-2 gap-1 text-xs text-app-text-4 font-mono mb-6">
            {["Name", "Date", "ID", "Client Name", "Phone", "Email", "Start Date",
              "State", "Carrier", "App Number", "Annual Premium", "Portal",
              "Agent Status", "Admin Status"].map(c => (
              <span key={c} className="bg-app-surface-2 rounded px-2 py-1">{c}</span>
            ))}
          </div>

          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-3 border-2 border-dashed border-app-border-2 hover:border-app-accent rounded-lg text-app-text-3 hover:text-app-accent transition text-sm font-medium"
          >
            Click to select CSV file
          </button>
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
        </div>

        <p className="text-xs text-app-text-5">
          {users.length} users loaded for matching &middot; Admin only
        </p>

        {/* ── Repair Teams utility ─────────────────────────────────── */}
        <div className="mt-6 bg-app-surface border border-app-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-app-text-2 mb-1">Repair Team Numbers</h2>
          <p className="text-xs text-app-text-4 mb-4">
            Scans all clients with team&nbsp;=&nbsp;0 and derives the correct team from the first digit of their contractor&nbsp;ID.
          </p>
          <button
            onClick={handleRepairTeams}
            disabled={repairingTeams}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition"
          >
            {repairingTeams ? "Repairing…" : "Repair Teams"}
          </button>
          {repairLog.length > 0 && (
            <div className="mt-3 bg-app-surface-2 rounded-lg p-3 font-mono text-xs space-y-1">
              {repairLog.map((line, i) => (
                <p key={i} className={line.startsWith("Done") ? "text-green-400" : line.startsWith("Error") ? "text-red-400" : "text-app-text-3"}>
                  {line}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Done step ────────────────────────────────────────────────────────────

  if (step === "done") {
    return (
      <div className="p-8 max-w-xl overflow-y-auto">
        <h1 className="text-2xl font-bold text-white mb-4">Import Complete</h1>
        <div className="bg-app-surface border border-app-border rounded-xl p-5 font-mono text-xs space-y-1 mb-6">
          {importLog.map((l, i) => (
            <p key={i} className={l.startsWith("Done") ? "text-green-400" : "text-app-text-3"}>{l}</p>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/portal/clients")}
            className="px-4 py-2 bg-app-accent hover:bg-app-accent-hover text-white text-sm font-semibold rounded-lg transition"
          >
            View Clients
          </button>
          <button
            onClick={() => { setStep("upload"); setRows([]); setFileName(""); }}
            className="px-4 py-2 bg-app-surface-2 hover:bg-app-surface-2 text-app-text-2 text-sm font-semibold rounded-lg transition"
          >
            Import Another
          </button>
        </div>
      </div>
    );
  }

  // ─── Preview step ─────────────────────────────────────────────────────────

  // Build set of duplicate appNumbers (already in DB or repeated in this CSV)
  const seenInCSV = new Set<string>();
  const duplicateAppNums = new Set<string>();
  for (const r of rows) {
    const num = r.appNumber?.trim();
    if (!num) continue;
    if (existingAppNums.has(num)) duplicateAppNums.add(num);
    else if (seenInCSV.has(num)) duplicateAppNums.add(num);
    else seenInCSV.add(num);
  }
  const duplicateRows = rows.filter(r => r.appNumber && duplicateAppNums.has(r.appNumber.trim()));

  const toImport = rows.filter(r => r.status !== "skip" && !duplicateAppNums.has(r.appNumber?.trim()));
  const unprovisioned = rows.filter(r => r.status === "unprovisioned");
  const former = rows.filter(r => r.status === "former");

  return (
    <div className="p-8 overflow-y-auto">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Preview Import</h1>
          <p className="text-app-text-3 text-sm mt-1">{fileName} &middot; {rows.length} rows parsed</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => { setStep("upload"); setRows([]); setFileName(""); }}
            className="px-3 py-2 text-sm text-app-text-3 hover:text-app-text border border-app-border-2 hover:border-app-border-2 rounded-lg transition"
          >
            Back
          </button>
          <button
            onClick={handleImport}
            disabled={importing || toImport.length === 0}
            className="px-4 py-2 bg-app-accent hover:bg-app-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition"
          >
            {importing ? "Importing…" : `Import ${toImport.length} Clients`}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: "Matched", count: counts.matched ?? 0, color: "text-green-400" },
          { label: "Unprovisioned", count: counts.unprovisioned ?? 0, color: "text-yellow-400" },
          { label: "Former/Inactive", count: counts.former ?? 0, color: "text-orange-400" },
          { label: "Skipped", count: counts.skip ?? 0, color: "text-app-text-4" },
          { label: "Duplicates", count: duplicateRows.length, color: "text-red-400" },
        ].map(item => (
          <div key={item.label} className="bg-app-surface border border-app-border rounded-xl p-4">
            <p className={`text-2xl font-bold ${item.color}`}>{item.count}</p>
            <p className="text-app-text-4 text-xs mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Notices */}
      {unprovisioned.length > 0 && (
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 mb-4 text-sm">
          <p className="text-yellow-400 font-semibold mb-1">{unprovisioned.length} unprovisioned rep{unprovisioned.length !== 1 ? "s" : ""}</p>
          <p className="text-app-text-3 text-xs">
            These clients will import with a placeholder agent ID using the rep&apos;s contractor ID.
            Once they create their account Monday, you can run a re-link from the Users page.
          </p>
          <p className="text-app-text-4 text-xs mt-2 font-mono">
            Reps: {[...new Set(unprovisioned.map(r => r.repName || r.repContractorId))].join(", ")}
          </p>
        </div>
      )}

      {former.length > 0 && (
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 mb-4 text-sm">
          <p className="text-orange-400 font-semibold mb-1">{former.length} former/inactive rep{former.length !== 1 ? "s" : ""}</p>
          <p className="text-app-text-3 text-xs">
            These reps have accounts but are marked inactive. Clients will still import under their name.
            Click <strong className="text-white">Skip</strong> on any row to exclude it.
          </p>
        </div>
      )}

      {duplicateRows.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-4 text-sm">
          <p className="text-red-400 font-semibold mb-1">{duplicateRows.length} duplicate app number{duplicateRows.length !== 1 ? "s" : ""} — will be skipped</p>
          <p className="text-app-text-3 text-xs">
            These rows have app numbers that already exist in the database or appear more than once in this file. They will not be imported.
          </p>
          <p className="text-app-text-4 text-xs mt-2 font-mono">
            {[...new Set(duplicateRows.map(r => r.appNumber))].join(", ")}
          </p>
        </div>
      )}

      {importLog.length > 0 && (
        <div className="bg-app-surface border border-app-border rounded-xl p-4 font-mono text-xs space-y-1 mb-4">
          {importLog.map((l, i) => <p key={i} className="text-app-text-3">{l}</p>)}
          {errorMsg && <p className="text-red-400">{errorMsg}</p>}
        </div>
      )}

      {/* Table */}
      <div className="bg-app-surface border border-app-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-app-border">
                <th className="text-left px-4 py-3 text-app-text-3 font-medium text-xs whitespace-nowrap">Status</th>
                <th className="text-left px-4 py-3 text-app-text-3 font-medium text-xs whitespace-nowrap">Rep</th>
                <th className="text-left px-4 py-3 text-app-text-3 font-medium text-xs whitespace-nowrap">Client Name</th>
                <th className="text-left px-4 py-3 text-app-text-3 font-medium text-xs whitespace-nowrap">Date</th>
                <th className="text-left px-4 py-3 text-app-text-3 font-medium text-xs whitespace-nowrap">Carrier</th>
                <th className="text-left px-4 py-3 text-app-text-3 font-medium text-xs whitespace-nowrap">Premium</th>
                <th className="text-left px-4 py-3 text-app-text-3 font-medium text-xs whitespace-nowrap">Portal</th>
                <th className="text-right px-4 py-3 text-app-text-3 font-medium text-xs whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const isDup = !!(r.appNumber && duplicateAppNums.has(r.appNumber.trim()));
                return (
                  <tr
                    key={r.rowIndex}
                    className={`border-b border-app-border/50 last:border-0 ${r.status === "skip" || isDup ? "opacity-40" : ""}`}
                  >
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={r.status} />
                        {isDup && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border bg-red-500/10 text-red-400 border-red-500/25">
                            Duplicate
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-app-text text-xs">
                      <span>{r.matchedUser ? `${r.matchedUser.firstName} ${r.matchedUser.lastName}` : r.repName}</span>
                      {r.repContractorId && (
                        <span className="text-app-text-5 ml-1 font-mono">#{r.repContractorId}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-app-text text-xs">{r.clientName}</td>
                    <td className="px-4 py-2.5 text-app-text-3 text-xs whitespace-nowrap">{r.date}</td>
                    <td className="px-4 py-2.5 text-app-text-3 text-xs">{r.carrier}</td>
                    <td className="px-4 py-2.5 text-app-text-3 text-xs whitespace-nowrap">
                      {r.annualPremium > 0 ? `$${r.annualPremium.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-app-text-3 text-xs">
                      {r.matchedPortal
                        ? `${r.matchedPortal.firstName} ${r.matchedPortal.lastName}`
                        : (r.portalName || "—")}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {isDup ? (
                        <span className="text-red-500 text-xs">Skipped</span>
                      ) : (
                        <button
                          onClick={() => toggleStatus(r.rowIndex)}
                          className={`text-xs transition ${
                            r.status === "skip"
                              ? "text-app-text-4 hover:text-green-400"
                              : "text-app-text-4 hover:text-red-400"
                          }`}
                        >
                          {r.status === "skip" ? "Restore" : "Skip"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
