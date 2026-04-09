"use client";

import { useState } from "react";
import { doc, writeBatch, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { ImportedPayrollRow } from "../../../../lib/types";
import { useUserClaim } from "../../../../lib/hooks/useUserClaim";
import { Spinner } from "../../../../lib/components/Spinner";

// ─── CSV parser ───────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === "," && !inQuotes) { result.push(current); current = ""; }
    else { current += ch; }
  }
  result.push(current);
  return result;
}

function toNum(val: string | undefined): number {
  if (!val) return 0;
  const v = val.trim();
  if (!v || /^(n\/a|false|true)$/i.test(v)) return 0;
  return parseFloat(v.replace(/[$,]/g, "")) || 0;
}
function toBool(val: string | undefined): boolean {
  return (val ?? "").trim().toUpperCase() === "TRUE";
}
function makeDocId(contractorId: string, name: string): string {
  if (contractorId && !/^w2/i.test(contractorId)) return contractorId;
  return name.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").slice(0, 30);
}

function parsePayrollCSV(text: string): ImportedPayrollRow[] {
  const lines = text.split("\n").map(parseCSVLine);
  const rows: ImportedPayrollRow[] = [];
  let currentSection = "";
  let colMap: Record<string, number> = {};
  let isNewFormat = false;

  for (const cells of lines) {
    const idColIdx = cells.findIndex(c => /^contrac?tor\s*id$/i.test(c.trim()));
    if (idColIdx >= 0) {
      currentSection = cells[0].trim() || currentSection;
      isNewFormat = true;
      colMap = {};
      cells.forEach((c, i) => { colMap[c.trim().toLowerCase()] = i; });
      continue;
    }

    if (!isNewFormat) {
      const hdr = cells[1]?.trim() ?? "";
      if (/^(MANAGER|TEAM\s*\d+|ADMIN)$/i.test(hdr)) {
        currentSection = /manager/i.test(hdr) ? "STAFF" : hdr;
        colMap = { name: 1, base: 2, "app bonus": 3, "app count": 4, total: 5, hours: 6, "two week pay": 10 };
        continue;
      }
    }

    if (!currentSection) continue;

    if (isNewFormat) {
      const idIdx = colMap["contactor id"] ?? colMap["contractor id"];
      if (idIdx === undefined) continue;
      const contractorId = cells[idIdx]?.trim() ?? "";
      if (!contractorId) continue;
      const name = cells[0]?.trim() ?? "";
      if (!name && !contractorId) continue;

      const totalIdx = colMap["total"] ?? -1;
      const rawTotal = totalIdx >= 0 ? cells[totalIdx]?.trim() : undefined;
      if (!name && (!rawTotal || rawTotal === "$0.00" || rawTotal === "0")) continue;

      const get = (key: string) => cells[colMap[key.toLowerCase()] ?? -1] ?? "";
      const teamMatch = currentSection.match(/team\s*(\d+)/i);

      rows.push({
        name:          name || `ID:${contractorId}`,
        contractorId,
        section:       currentSection,
        teamNumber:    teamMatch ? parseInt(teamMatch[1]) : 0,
        base:          toNum(get("base")),
        appBonus:      toNum(get("app bonus")),
        appCount:      Math.round(toNum(get("app count"))),
        hours:         toNum(get("hours")),
        volumeBonus:   toNum(get("volume bonus")),
        producerBonus: toNum(get("producer bonus")),
        total:         toNum(get("total")),
        paid:          toBool(get("payroll")),
        twoWeekPay:    toNum(get("two week pay")),
        notes:         get("notes").trim(),
      });
    } else {
      const name = cells[1]?.trim() ?? "";
      if (!name || name === "0") continue;
      if (/^(MANAGER|TEAM|ADMIN|W2)/i.test(name)) continue;
      const total = toNum(cells[5]);
      if (!name || total === 0) continue;
      const teamMatch = currentSection.match(/team\s*(\d+)/i);
      rows.push({
        name,
        contractorId:  "",
        section:       currentSection,
        teamNumber:    teamMatch ? parseInt(teamMatch[1]) : 0,
        base:          toNum(cells[2]),
        appBonus:      toNum(cells[3]),
        appCount:      Math.round(toNum(cells[4])),
        hours:         toNum(cells[6]),
        volumeBonus:   0,
        producerBonus: 0,
        total,
        paid:          false,
        twoWeekPay:    toNum(cells[10]),
        notes:         cells[7]?.trim() ?? "",
      });
    }
  }
  return rows;
}

// ─── Historical CSV data (all 7 weeks) ───────────────────────────────────────

const WEEKS: { weekStart: string; csv: string }[] = [
  {
    weekStart: "2026-02-09",
    csv: `fa,,,,,,,,,,,
,,,,,,,,,,,
,,,,,,,,,,,
TYPE,TOTAL,PAYOUT,,,Notes:,,,,,,
Under 5 Years,"53,739.96","26,869.98",,Team 1 Submit:,,,,,,,
,MANAGER,Base,Bonus,Apps,Total,Hours,Extra,,,Total 2 week pay,Paid
,Cyruss Wright,2200,N/A,N/A,"2,200.00",N/A,,,,,
,TEAM 1,0,0,,0.00,,,,,,
,Abigail Will,642,700,24,"1,341.88",39.5,,,,,
,Brittany Esquivel,520,600,22,"1,120.00",32,,,,,
,ADMIN,,,,,,,,,,
,Abbigail Gerami ,625,,,625.00,25,,,,,
,TEAM 2,BASE,Bonus,Apps,Total,Hours,Extra,,,Total 2 week pay,Paid
,Reagan Driscoll,280,100,2,380.00,16,,,,,
,Jonathan Vineyard,641,250,5,891.06,39.45,,,,,
,Jemeshia Mills,609,250,5,858.89,37.47,,,,,
,Marcus Drake Jasso,379,150,3,528.63,23.3,,,,,
,Olivia Graham,390,200,4,590.00,24,,,,,
,Sofya Tartisio,639,250,5,888.63,39.3,,,,,
,Caleb Cullipher,650,650,9,"1,300.00",40,,,,,
,Michael Eqwuagu,538,550,8,"1,087.88",33.1,,,,,
,Zachary Casey,379,550,8,928.63,23.3,,,,,`,
  },
  {
    weekStart: "2026-02-16",
    csv: `fa,,,,,,,,,,,,,
,MANAGER,Base,Bonus,Apps,Total,Hours,Extra,,,Total 2 week pay,Paid,,
,Cyruss Wright,2200,N/A,N/A,"2,200.00",N/A,,,,"$4,400.00",ADP,,
,TEAM 1,0,0,,0.00,,,,,,,,
,Abigail Will,488,400,16,887.50,30,,,,"$2,629.38",ADP,,
,Brittany Esquivel,520,800,26,"1,520.00",32,$200.00,,,"$2,240.00",ADP,,
,ADMIN,,,,,,,,,,,,
,Abbigail Gerami ,700,,,,28,$100.00,,,"$1,425.00",ADP,,
,TEAM 2,BASE,Bonus,Apps,Total,Hours,Extra,,,Total 2 week pay,Paid,,
,Reagan Driscoll,700,150,3,950.00,40,$100.00,,,"$1,330.00",ADP,,
,Jonathan Vineyard,650,550,8,"1,200.00",40,,,,"$2,091.00",ADP,,
,Marcus Drake Jasso,589,200,4,789.39,36.27,,,,"$1,000.00",Broke contract,,
,Caleb Cullipher,700,750,10,"2,250.00",40,$800.00,,,"$3,550.00",ADP,,
,Michael Eqwuagu,634,1050,12,"1,883.75",39,$200.00,,,"$2,971.63",ADP,,
,Destiny McWilliams,624,200,4,824.00,38.4,,,,$824.00,ADP,,
,Bradley Cook,642,350,6,992.36,39.53,,,,$992.36,ADP,,
,Karmen Olivares,650,750,10,"1,400.00",40,,,,"$1,400.00",ADP,,`,
  },
  {
    weekStart: "2026-02-23",
    csv: `STAFF,Contactor ID,Base,App Bonus,App Count,Hours,Volume Bonus,Total,Producer Bonus,Payroll,Notes,Two Week Pay
Cyruss Wright,1000,N/A,$0.00,,40,"$2,550.00","$2,550.00",,FALSE,,
Abbigail Gerami ,2000,$550.00,$0.00,,22,,$550.00,,FALSE,,
Kylie Coleman,W2 REQUIRED,$300.00,$0.00,,40,,$300.00,,FALSE,,
Team 2,Contactor ID,Base,App Bonus,App Count,Hours,Volume Bonus,Total,Producer Bonus,Payroll,Notes,Two Week Pay
Reagan Driscoll,2001,$510.13,$250.00,5,29.15,$291.50,"$1,051.63",,FALSE,,
Melissa Okane,2002,$641.88,"$1,050.00",12,39.5,,"$1,691.88",,FALSE,,
Frank Gonzalez,2004,$511.88,$350.00,6,31.5,,$861.88,,FALSE,,
Karmin Olivares,2005,$642.69,$900.00,11,39.55,,"$1,542.69",,FALSE,,
Bradley Cook,2006,$642.69,"$1,050.00",12,39.55,,"$1,692.69",,FALSE,,
Team 3,Contactor ID,Base,App Bonus,App Count,Hours,Volume Bonus,Total,Producer Bonus,Payroll,Notes,Two Week Pay
Caleb Cullipher,3001,$700.00,$750.00,10,40,$400.00,"$1,850.00",,FALSE,,
Jonathan Vineyard,3002,$479.38,$350.00,6,29.5,,$829.38,,FALSE,,
Michael Eqwuagu,3004,$568.75,"$1,050.00",12,35,,"$1,618.75",,FALSE,,`,
  },
  {
    weekStart: "2026-03-02",
    csv: `STAFF,Contactor ID,Base,App Bonus,App Count,Hours,Volume Bonus,Total,Producer Bonus,Payroll,Two Week Pay,Notes,
Cyruss Wright,1000,N/A,$0.00,,40,"$3,100.00","$3,100.00",,TRUE,"$5,650.00",,
Abbigail Gerami ,2000,"$1,000.00",$0.00,,40,,"$1,029.00",$29.00,TRUE,"$1,579.00",,
Kylie Coleman,W2 REQUIRED,$300.00,$0.00,,40,,$300.00,,FALSE,$600.00,,
Team 2,Contactor ID,Base,App Bonus,App Count,Hours,Volume Bonus,Total,Producer Bonus,Payroll,Two Week Pay,Notes,
Reagan Driscoll,2001,$647.50,$750.00,10,37.00,$740.00,"$2,137.50",,TRUE,"$3,089.13",$100.00,
Melissa Okane,2002,$642.53,$450.00,7,39.54,,"$1,092.53",,TRUE,"$2,784.41",,140.00
De'Jonae Hall,2003,$641.88,"$2,250.00",20,39.5,,"$3,091.88",$200.00,TRUE,"$2,991.88",,
Frank Gonzalez,2004,$626.44,$450.00,7,38.55,,"$1,076.44",,TRUE,"$1,878.32",$60.00,
Karmin Olivares,2005,$650.00,$550.00,8,40,,"$1,200.00",,TRUE,"$2,582.69",Carrier Over,
Bradley Cook,2006,$650.00,"$1,050.00",12,40,,"$1,700.00",,TRUE,"$3,192.69",$50.00,
Team 3,Contactor ID,Base,App Bonus,App Count,Hours,Volume Bonus,Total,Producer Bonus,Payroll,Two Week Pay,Notes,
Caleb Cullipher,3001,$700.00,"$1,500.00",15,40,$800.00,"$3,000.00",,TRUE,"$4,650.00",$200.00,
Jonathan Vineyard,3002,$276.25,$650.00,9,17,,$926.25,,TRUE,"$1,655.63",Adjusted $1300,
Michael Eqwuagu,3003,$427.38,$250.00,5,26.3,,$677.38,,TRUE,"$2,196.13",$100.00,
Joseph Sepulbeda,3005,$640.74,$350.00,6,39.43,,$990.74,,TRUE,$970.74,,
Jennifer McGaffeny,3006,$650.00,"$1,500.00",15,40,,"$2,150.00",,TRUE,"$2,050.00",-$50.00,`,
  },
  {
    weekStart: "2026-03-09",
    csv: `STAFF,Contactor ID,Base,App Bonus,App Count,Hours,Volume Bonus,Producer Bonus,Total,Payroll,Two Week Pay,Notes
Cyruss Wright,1000,N/A,$0.00,,40,"$2,850.00",,"$2,850.00",FALSE,,
Abbigail Gerami ,2000,"$1,000.00",$0.00,,40,,,"$1,000.00",FALSE,,
Kylie Coleman,W2 REQUIRED,$300.00,$0.00,,40,,,$300.00,FALSE,,
Team 1,Contactor ID,Base,App Bonus,App Count,Hours,Volume Bonus,Producer Bonus,Total,Payroll,Two Week Pay,Notes
Michael Eqwuagu,1001,$630.00,"$1,050.00",12,36,$720.00,,"$2,400.00",FALSE,,
Brittany Esquivel,1002,$650.00,"$1,950.00",18,40,,$200.00,"$2,800.00",FALSE,,
Abigail Will,1003,$514.64,$900.00,11,32,,,"$1,414.64",FALSE,,
Frank Gonzalez,1005,$606.94,$650.00,9,37.35,,,"$1,256.94",FALSE,,
Team 2,Contactor ID,Base,App Bonus,App Count,Hours,Volume Bonus,Producer Bonus,Total,Payroll,Two Week Pay,Notes
Reagan Driscoll,2001,$700.00,$550.00,8,40,"$1,000.00",,"$2,250.00",FALSE,,
Melissa Okane,2002,$647.08,"$1,200.00",13,39.82,,,"$1,847.08",FALSE,,
De'Jonae Hall,2003,$650.00,"$2,100.00",19,40,,,"$2,750.00",FALSE,,
Bradley Cook,2004,$519.19,$250.00,5,31.95,,,$769.19,FALSE,,
Karmin Olivares,2005,$650.00,$900.00,11,40,,,"$1,550.00",FALSE,,
Team 3,Contactor ID,Base,App Bonus,App Count,Hours,Volume Bonus,Producer Bonus,Total,Payroll,Two Week Pay,Notes
Caleb Cullipher,3001,$700.00,$900.00,11,40,$800.00,,"$2,400.00",FALSE,,
Christina Schroeder,3002,$650.00,$900.00,11,40,,,"$1,550.00",FALSE,,
Susana Pizarro,3003,$650.00,$750.00,10,40,,,"$1,400.00",FALSE,,
Jospeh Sepubeda,3004,$459.06,$150.00,3,28.25,,,$609.06,FALSE,,FIRED
Jennifer McGaffeny,3005,$650.00,"$1,050.00",12,40,,,"$1,700.00",FALSE,,`,
  },
  {
    weekStart: "2026-03-16",
    csv: `STAFF,Contactor ID,Base,App Bonus,App Count,Hours,Volume Bonus,Producer Bonus,Total,Payroll,Two Week Pay,Notes
Cyruss Wright,1000,N/A,$0.00,,40,"$2,850.00",,"$2,850.00",TRUE,"$5,700.00",
Abbigail Gerami ,2000,"$1,000.00",$0.00,,40,,$260.13,"$1,260.13",TRUE,"$2,260.13",
Kylie Coleman,W2 REQUIRED,$300.00,$0.00,,40,,,$300.00,TRUE,$600.00,
Team 1,Contactor ID,Base,App Bonus,App Count,Hours,Volume Bonus,Producer Bonus,Total,Payroll,Two Week Pay,Notes
Michael Eqwuagu,1001,,$200.00,4,40,"$1,594.44",$140.00,"$1,934.44",TRUE,"$4,334.44",
Brittany Esquivel,1002,$650.00,"$1,500.00",15,40,,,"$2,150.00",TRUE,"$4,950.00",
Abigail Will,1003,$579.64,$900.00,11,36,,,"$1,479.64",TRUE,"$2,894.28",
Austin Shurley,1004,$627.74,$650.00,9,38.63,,,"$1,277.74",TRUE,"$1,277.74",
Frank Gonzalez,1005,$565.99,$900.00,11,34.83,,,"$1,465.99",TRUE,"$2,722.93",
Team 2,Contactor ID,Base,App Bonus,App Count,Hours,Volume Bonus,Producer Bonus,Total,Payroll,Two Week Pay,Notes
Reagan Driscoll,2001,,$450.00,7,40,"$1,393.16",$140.00,"$1,983.16",TRUE,"$4,233.16",
Melissa Okane,2002,$0.00,$0.00,,,,,$0.00,TRUE,"$1,847.08",
De'Jonae Hall,2003,$460.36,$750.00,10,28.33,,,"$1,210.36",TRUE,"$3,960.36",
Bradley Cook,2004,$572.98,$650.00,9,35.26,,,"$1,222.98",TRUE,"$1,992.17",
Karmin Olivares,2005,$0.00,$50.00,1,,,,$50.00,TRUE,"$1,600.00",
Team 3,Contactor ID,Base,App Bonus,App Count,Hours,Volume Bonus,Producer Bonus,Total,Payroll,Two Week Pay,Notes
Caleb Cullipher,3001,,$50.00,1,40,"$2,104.44",$140.00,"$2,294.44",TRUE,"$4,694.44",
Christina Schroeder,3002,$650.00,"$1,350.00",14,40,,,"$2,000.00",TRUE,"$3,550.00",
Susana Pizarro,3003,$544.05,"$1,200.00",13,33.48,,,"$1,744.05",TRUE,"$3,144.05",
Jospeh Sepubeda,3004,$0.00,$0.00,,,,,$0.00,FALSE,$609.06,FIRED
Jennifer McGaffeny,3005,$650.00,"$1,350.00",14,40,,,"$2,000.00",TRUE,"$3,700.00",
Team 4,Contactor ID,Base,App Bonus,App Count,Hours,Volume Bonus,Producer Bonus,Total,Payroll,Two Week Pay,Notes
Aryanna Crawford ,4001,$653.80,"$1,950.00",18,37.36,,,"$2,603.80",TRUE,"$2,603.80",`,
  },
  {
    weekStart: "2026-03-23",
    csv: `STAFF,Contactor ID,Base,App Bonus,App Count,Hours,Volume Bonus,Producer Bonus,Total,Payroll,Two Week Pay,Notes
Cyruss Wright,1000,N/A,$0.00,,,$0.00,,$0.00,FALSE,,
Abbigail Gerami ,2000,$0.00,$0.00,,,,,$0.00,FALSE,,
Kylie Coleman,W2 REQUIRED,$0.00,$0.00,,,,,$0.00,FALSE,,
Team 1,Contactor ID,Base,App Bonus,App Count,Hours,Volume Bonus,Producer Bonus,Total,Payroll,Two Week Pay,Notes
Michael Eqwuagu,1001,,$0.00,,,,,$0.00,FALSE,,
Brittany Esquivel,1002,$0.00,$0.00,,,,,$0.00,FALSE,,
Abigail Will,1003,$32.50,$0.00,,2,,,$32.50,FALSE,,Add 2 hours due to cyruss error
Austin Shurley,1004,$0.00,$0.00,,,,,$0.00,FALSE,,
Frank Gonzalez,1005,$0.00,$0.00,,,,,$0.00,FALSE,,
Team 2,Contactor ID,Base,App Bonus,App Count,Hours,Volume Bonus,Producer Bonus,Total,Payroll,Two Week Pay,Notes
Reagan Driscoll,2001,,$0.00,,40,"$1,750.00",,"$1,750.00",FALSE,,
Melissa Okane,2002,$0.00,$0.00,,,,,$0.00,FALSE,,
De'Jonae Hall,2003,$0.00,$0.00,,,,,$0.00,FALSE,,
Bradley Cook,2004,$0.00,$0.00,,,,,$0.00,FALSE,,
Karmin Olivares,2005,$0.00,$0.00,,,,,$0.00,FALSE,,
Team 3,Contactor ID,Base,App Bonus,App Count,Hours,Volume Bonus,Producer Bonus,Total,Payroll,Two Week Pay,Notes
Caleb Cullipher,3001,,$0.00,,,$0.00,,$0.00,FALSE,,
Christina Schroeder,3002,$0.00,$0.00,,,,,$0.00,FALSE,,
Susana Pizarro,3003,$0.00,$0.00,,,,,$0.00,FALSE,,
Aryanna Crawford ,3004,$0.00,$0.00,,,,,$0.00,FALSE,,
Jennifer McGaffeny,3005,$0.00,$0.00,,,,,$0.00,FALSE,,`,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtWeek(s: string): string {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SeedPayrollPage() {
  const claim = useUserClaim();
  const [status,   setStatus]   = useState<"idle" | "seeding" | "done" | "error">("idle");
  const [log,      setLog]      = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSeed() {
    setStatus("seeding");
    setLog([]);
    setErrorMsg("");

    try {
      for (const { weekStart, csv } of WEEKS) {
        const rows = parsePayrollCSV(csv);
        setLog(l => [...l, `${fmtWeek(weekStart)}: parsed ${rows.length} rows…`]);

        const batch = writeBatch(db);
        for (const row of rows) {
          const id  = makeDocId(row.contractorId, row.name);
          const ref = doc(db, "payroll", weekStart, "imported", id);
          batch.set(ref, { ...row, importedAt: serverTimestamp() });
        }
        await batch.commit();
        setLog(l => [...l, `${fmtWeek(weekStart)}: ✓ wrote ${rows.length} rows`]);
      }
      setStatus("done");
      setLog(l => [...l, "All weeks seeded successfully."]);
    } catch (e) {
      setErrorMsg(String(e));
      setStatus("error");
    }
  }

  if (claim.loading) {
    return (
      <div className="min-h-full bg-app-bg overflow-y-auto flex items-center justify-center">
        <Spinner className="w-7 h-7" />
      </div>
    );
  }

  if (!claim.isAdmin) {
    return (
      <div className="min-h-full bg-app-bg overflow-y-auto flex items-center justify-center">
        <p className="text-app-text-4 text-sm">Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="bg-app-bg min-h-full p-8 overflow-y-auto max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-app-text mb-2">Seed Historical Payroll</h1>
      <p className="text-app-text-3 text-sm mb-6">
        Writes all 7 weeks of historical payroll data (Feb 9 – Mar 23 2026) into Firestore.
        Safe to run multiple times — existing rows are overwritten.
      </p>

      <div className="bg-app-surface border border-app-border rounded-xl p-6 mb-6">
        <ul className="space-y-1 mb-6">
          {WEEKS.map(w => (
            <li key={w.weekStart} className="flex items-center gap-2 text-sm text-app-text-3">
              <span className="w-2 h-2 rounded-full bg-app-surface-2 flex-shrink-0" />
              {fmtWeek(w.weekStart)}
            </li>
          ))}
        </ul>

        <button
          onClick={handleSeed}
          disabled={status === "seeding" || status === "done"}
          className="w-full py-2.5 bg-app-accent hover:bg-app-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition"
        >
          {status === "seeding" ? "Seeding…" : status === "done" ? "Done" : "Seed All Weeks → Firestore"}
        </button>
      </div>

      {log.length > 0 && (
        <div className="bg-app-surface border border-app-border rounded-xl p-4 font-mono text-xs space-y-1">
          {log.map((line, i) => (
            <p key={i} className={line.includes("✓") ? "text-green-400" : "text-app-text-3"}>{line}</p>
          ))}
          {errorMsg && <p className="text-red-400 mt-2">{errorMsg}</p>}
        </div>
      )}

      {status === "done" && (
        <p className="text-center text-xs text-app-text-5 mt-4">
          Navigate to{" "}
          <a href="/portal/payroll" className="text-app-accent underline">/portal/payroll</a>
          {" "}and select any past week to view the historical data.
        </p>
      )}
    </div>
  );
}
