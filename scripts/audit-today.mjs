// Fetches all client records with date = 2026-03-30 and prints a comparison table.
// Run: node scripts/audit-today.mjs

import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey:            "AIzaSyDzOehZykTrdgDpHDq6v9m7Qm7GQf5IuSg",
  authDomain:        "outpostdigitalsolutions.firebaseapp.com",
  projectId:         "outpostdigitalsolutions",
  storageBucket:     "outpostdigitalsolutions.firebasestorage.app",
  messagingSenderId: "3015430856",
  appId:             "1:3015430856:web:4d1d26b6e0d43f0d530bfd",
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ── Data from screenshot (3/30/2026 records) ──────────────────────────────────
// Fields: agentFirstName, contractorId, clientName, phone, startDate, state, carrier, appNumber, annualPremium, portal, agentStatus
const SHEET_ROWS = [
  { row: 1555, agent: "B",         id: "1003", clientName: "Gregory Jones",       phone: "443-278-3910",  startDate: "4/1/2026",  state: "MD", carrier: "Instabrain", appNumber: "0101804851", annualPremium: 2024.52, portal: "Michael",  agentStatus: "Approved" },
  { row: 1556, agent: "Frank",     id: "3002", clientName: "Adam Hadden",          phone: "(270) 350-0965",startDate: "4/1/2026",  state: "KY", carrier: "Ethos",      appNumber: "PTSN008007060",annualPremium: 756.00, portal: "Caleb",    agentStatus: "Approved" },
  { row: 1557, agent: "Frank",     id: "3002", clientName: "Glenda Smith",         phone: "(434) 241-9275",startDate: "4/15/2026", state: "VA", carrier: "Instabrain", appNumber: "0101804860", annualPremium: 635.28, portal: "Michael",  agentStatus: "Approved" },
  { row: 1558, agent: "Brianna",   id: "1006", clientName: "Joe Rackley Jr",       phone: "(210) 542-4438",startDate: "4/5/2026",  state: "TX", carrier: "Americo",    appNumber: "AM03165112", annualPremium: 1859.04,portal: "Michael",  agentStatus: "Approved" },
  { row: 1559, agent: "Bradley",   id: "2004", clientName: "Kimberlee Smith",      phone: "205-467-4969",  startDate: "4/15/2026", state: "AL", carrier: "Instabrain", appNumber: "0101804879", annualPremium: 772.44, portal: "Caleb",    agentStatus: "Approved" },
  { row: 1560, agent: "Jack M",    id: "2002", clientName: "Tony Sexton",          phone: "859) 771-1902", startDate: "4/1/2026",  state: "KY", carrier: "Ethos",      appNumber: "SBPLLETS76@GMAIL.COM",annualPremium: 1272.00,portal: "Reagan",agentStatus: "Approved" },
  { row: 1561, agent: "Jack M",    id: "2002", clientName: "Charmaine Bullay",     phone: "(580) 243-8530",startDate: "4/3/2026",  state: "OK", carrier: "Instabrain", appNumber: "0101804913", annualPremium: 712.12, portal: "Reagan",  agentStatus: "Approved" },
  { row: 1562, agent: "Christina", id: "3002", clientName: "George Clark",         phone: "(309) 350-0045",startDate: "4/8/2026",  state: "IL", carrier: "Americo",    appNumber: "AM03165316", annualPremium: 1200.00,portal: "Caleb",    agentStatus: "Approved" },
  { row: 1563, agent: "B*",        id: "1003", clientName: "Lamont Green",         phone: "210-267-7565",  startDate: "4/22/2026", state: "TX", carrier: "Instabrain", appNumber: "AM03165444", annualPremium: 1300.92,portal: "Michael",  agentStatus: "Approved" },
  { row: 1564, agent: "Aryanna",   id: "3004", clientName: "Betty Peche",          phone: "(276) 692-4863",startDate: "4/15/2026", state: "NC", carrier: "Instabrain", appNumber: "AM03135009", annualPremium: 786.48, portal: "Caleb",    agentStatus: "Approved" },
  { row: 1565, agent: "Jenn",      id: "3005", clientName: "Rose Alvarado",        phone: "509-643-8613",  startDate: "4/4/2026",  state: "WA", carrier: "Trans",      appNumber: "FEXB428678", annualPremium: 412.68, portal: "Caleb",    agentStatus: "Approved" },
  { row: 1566, agent: "Bradley",   id: "2004", clientName: "Verner Taylor",        phone: "816-288-7930",  startDate: "4/18/2026", state: "MO", carrier: "Instabrain", appNumber: "0101804935", annualPremium: 728.64, portal: "Reagan",  agentStatus: "Approved" },
  { row: 1567, agent: "Christina", id: "3002", clientName: "Sheila Thorn",         phone: "(832) 755-0340",startDate: "4/10/2026", state: "TX", carrier: "Instabrain", appNumber: "0101804972", annualPremium: 877.06, portal: "Caleb",    agentStatus: "Approved" },
  { row: 1568, agent: "De'Jonae",  id: "2003", clientName: "Rosetta Reynolds",     phone: "816-568-2294",  startDate: "4/3/2026",  state: "MO", carrier: "Instabrain", appNumber: "0101804956", annualPremium: 609.00, portal: "Reagan",  agentStatus: "Approved" },
  { row: 1569, agent: "Bradley",   id: "2004", clientName: "Vishal Kotru",         phone: "714-883-7025",  startDate: "4/28/2026", state: "CA", carrier: "Trans",      appNumber: "FEXB428786", annualPremium: 685.08, portal: "Reagan",  agentStatus: "Approved" },
  { row: 1570, agent: "Bradley",   id: "2004", clientName: "Vishal Kotru",         phone: "714-883-7025",  startDate: "4/18/2026", state: "CA", carrier: "Instabrain", appNumber: "0101804988", annualPremium: 368.52, portal: "Reagan",  agentStatus: "Approved" },
  { row: 1571, agent: "Jack M",    id: "2002", clientName: "Frankie Purnell",      phone: "(708)466-3228", startDate: "4/21/2026", state: "WI", carrier: "Ethos",      appNumber: "PTSN008008875",annualPremium: 1140.00,portal: "Reagan",agentStatus: "Approved" },
  { row: 1572, agent: "jesus",     id: "2005", clientName: "Eric Cloud",           phone: "347-909-0256",  startDate: "4/1/2026",  state: "CT", carrier: "Trans",      appNumber: "FEXB428924", annualPremium: 628.44, portal: "Reagan",  agentStatus: "Approved" },
  { row: 1573, agent: "jesus",     id: "2005", clientName: "Eric Cloud",           phone: "347-909-0256",  startDate: "4/1/2026",  state: "CT", carrier: "Instabrain", appNumber: "0101805020", annualPremium: 619.44, portal: "Reagan",  agentStatus: "Approved" },
  { row: 1574, agent: "B*",        id: "1003", clientName: "Carol Huggins",        phone: "610-745-4224",  startDate: "4/18/2026", state: "PA", carrier: "Instabrain", appNumber: "0101805062", annualPremium: 2876.40,portal: "Michael",  agentStatus: "Approved" },
  { row: 1575, agent: "Brianna",   id: "1006", clientName: "Calvin Jones",         phone: "(443)770-4749", startDate: "4/2/2026",  state: "OK", carrier: "Americo",    appNumber: "AM3166207",  annualPremium: 1572.00,portal: "Caleb",    agentStatus: "Approved" },
  { row: 1576, agent: "Christina", id: "3002", clientName: "Charles Odom",         phone: "(918) 530-1068",startDate: "4/3/2026",  state: "OK", carrier: "Instabrain", appNumber: "0101805095", annualPremium: 2008.44,portal: "Michael",  agentStatus: "Approved" },
  { row: 1577, agent: "jesus",     id: "2005", clientName: "Stacy Cruz",           phone: "(646) 203-5851",startDate: "4/25/2026", state: "NC", carrier: "Ethos",      appNumber: "PTSN008010637",annualPremium: 1068.00,portal: "Reagan",agentStatus: "Approved" },
  { row: 1578, agent: "Aryanna",   id: "3004", clientName: "Lisa Edge",            phone: "(910-568-2447", startDate: "4/1/2026",  state: "NC", carrier: "Instabrain", appNumber: "0101805107", annualPremium: 1212.00,portal: "Caleb",    agentStatus: "Approved" },
  { row: 1579, agent: "Aryanna",   id: "3004", clientName: "Raymound Edge",        phone: "(910)-568-2447",startDate: "4/1/2026",  state: "NC", carrier: "Ethos",      appNumber: "PTSN008010500",annualPremium: 1220.04,portal: "Caleb",  agentStatus: "Approved" },
  { row: 1580, agent: "Denise",    id: "3006", clientName: "Denise Robertson",     phone: "(314) 688-1510",startDate: "4/1/2026",  state: "MO", carrier: "Americo",    appNumber: "AM03166471", annualPremium: 888.00, portal: "Caleb",    agentStatus: "Approved" },
  { row: 1581, agent: "Denise",    id: "3006", clientName: "Ronald Robertson",     phone: "(314) 688-1510",startDate: "4/1/2026",  state: "MO", carrier: "Instabrain", appNumber: "0101805140", annualPremium: 640.92, portal: "Caleb",    agentStatus: "Approved" },
  { row: 1582, agent: "Denise",    id: "3006", clientName: "Linda Webb",           phone: "(307) 630-4222",startDate: "4/15/2026", state: "WY", carrier: "Ethos",      appNumber: "PTSN0080011122",annualPremium: 1656.00,portal: "Caleb",  agentStatus: "Approved" },
  { row: 1583, agent: "Jenn",      id: "3005", clientName: "Beatrice Braamkolk",   phone: "623-399-5917",  startDate: "4/6/2026",  state: "CA", carrier: "Instabrain", appNumber: "0101805167", annualPremium: 848.04, portal: "Caleb",    agentStatus: "Approved" },
  { row: 1584, agent: "Jack M",    id: "2002", clientName: "Rajanee Long-Simon",   phone: "(951)263-8475", startDate: "4/15/2026", state: "CA", carrier: "Americo",    appNumber: "AM03166815", annualPremium: 717.12, portal: "Reagan",  agentStatus: "Approved" },
  { row: 1585, agent: "B*",        id: "1003", clientName: "Richard Betz",         phone: "903 348-0242",  startDate: "4/3/2026",  state: "TX", carrier: "Americo",    appNumber: "AM03166921", annualPremium: 804.00, portal: "Michael",  agentStatus: "Approved" },
  { row: 1586, agent: "Clay",      id: "1002", clientName: "John Chestang",        phone: "(228) 217-0085",startDate: "4/1/2026",  state: "MS", carrier: "Instabrain", appNumber: "0101805156", annualPremium: 908.64, portal: "Michael",  agentStatus: "Approved" },
  { row: 1587, agent: "Jenn",      id: "3005", clientName: "Brandon Ozanic",       phone: "217-836-4407",  startDate: "4/3/2026",  state: "IL", carrier: "Instabrain", appNumber: "0101805213", annualPremium: 613.32, portal: "Caleb",    agentStatus: "Approved" },
  { row: 1588, agent: "Susie",     id: "3003", clientName: "Jasmine Tennant Damon",phone: "(808) 583-0630",startDate: "4/2/2026",  state: "HI", carrier: "Ethos",      appNumber: "PTSN008012507",annualPremium: 2544.00,portal: "Caleb",  agentStatus: "Approved" },
  { row: 1589, agent: "Austin",    id: "1005", clientName: "Mark Bassett",         phone: "(931) 636-5577",startDate: "4/3/2026",  state: "TN", carrier: "Americo",    appNumber: "AM03167160", annualPremium: 1999.56,portal: "Reagan",  agentStatus: "Approved" },
  { row: 1590, agent: "De'Jonae",  id: "2003", clientName: "Xia Ciezki",           phone: "262-289-7863",  startDate: "4/15/2026", state: "WI", carrier: "Instabrain", appNumber: "0101805267", annualPremium: 571.20, portal: "Reagan",  agentStatus: "Approved" },
  { row: 1591, agent: "B*",        id: "1003", clientName: "Denita Stewart",       phone: "225-623-2267",  startDate: "4/3/2026",  state: "LA", carrier: "Instabrain", appNumber: "0101805294", annualPremium: 665.04, portal: "Michael",  agentStatus: "Approved" },
  { row: 1592, agent: "Jenn",      id: "3005", clientName: "Tony Williams",        phone: "404-512-5028",  startDate: "3/31/2026", state: "GA", carrier: "Instabrain", appNumber: "0101805292", annualPremium: 733.92, portal: "Caleb",    agentStatus: "Approved" },
  { row: 1593, agent: "Austin",    id: "1005", clientName: "Kenith France",        phone: "(479) 438-3944",startDate: "4/3/2026",  state: "AR", carrier: "Americo",    appNumber: "AM03167785", annualPremium: 1200.00,portal: "Michael",  agentStatus: "Approved" },
];

// ── Query Firestore ───────────────────────────────────────────────────────────
const clientsRef = collection(db, "clients");
const q = query(clientsRef, where("date", "==", "2026-03-30"));
const snap = await getDocs(q);
const DB_ROWS = snap.docs.map(d => ({ id: d.id, ...d.data() }));

console.log(`\n📋  FIRESTORE: ${DB_ROWS.length} records for 2026-03-30`);
console.log(`📊  SHEET:     ${SHEET_ROWS.length} rows for 3/30/2026\n`);

// ── Helper: normalize app number for comparison ───────────────────────────────
const norm = (s) => String(s ?? "").trim().replace(/\s+/g, "").toUpperCase();
const normAmt = (v) => Math.round(parseFloat(v ?? 0) * 100);

// ── 1. Records in SHEET but not in DB (by app number) ────────────────────────
const dbAppNums = new Set(DB_ROWS.map(r => norm(r.appNumber)));
const sheetNotInDb = SHEET_ROWS.filter(r => !dbAppNums.has(norm(r.appNumber)));
if (sheetNotInDb.length) {
  console.log("❌  IN SHEET BUT NOT IN DATABASE:");
  sheetNotInDb.forEach(r => console.log(`   Row ${r.row}  ${r.appNumber.padEnd(22)}  ${r.clientName}  (${r.agent} / ${r.id})`));
  console.log();
}

// ── 2. Records in DB but not in SHEET ────────────────────────────────────────
const sheetAppNums = new Set(SHEET_ROWS.map(r => norm(r.appNumber)));
const dbNotInSheet = DB_ROWS.filter(r => !sheetAppNums.has(norm(r.appNumber)));
if (dbNotInSheet.length) {
  console.log("⚠️   IN DATABASE BUT NOT IN SHEET:");
  dbNotInSheet.forEach(r => console.log(`   ${r.appNumber?.padEnd(22)}  ${r.clientName}  agent: ${r.agentName}  $${r.annualPremium}`));
  console.log();
}

// ── 3. Field-level discrepancies for matched records ─────────────────────────
const discrepancies = [];
for (const sheet of SHEET_ROWS) {
  const db_rec = DB_ROWS.find(r => norm(r.appNumber) === norm(sheet.appNumber));
  if (!db_rec) continue;
  const diffs = [];
  if (normAmt(db_rec.annualPremium) !== normAmt(sheet.annualPremium))
    diffs.push(`annualPremium: DB=$${db_rec.annualPremium}  SHEET=$${sheet.annualPremium}`);
  if (norm(db_rec.carrier) !== norm(sheet.carrier))
    diffs.push(`carrier: DB=${db_rec.carrier}  SHEET=${sheet.carrier}`);
  if (norm(db_rec.state) !== norm(sheet.state))
    diffs.push(`state: DB=${db_rec.state}  SHEET=${sheet.state}`);
  if (norm(db_rec.agentStatus) !== norm(sheet.agentStatus))
    diffs.push(`agentStatus: DB=${db_rec.agentStatus}  SHEET=${sheet.agentStatus}`);
  if (diffs.length)
    discrepancies.push({ row: sheet.row, appNumber: sheet.appNumber, clientName: sheet.clientName, diffs });
}
if (discrepancies.length) {
  console.log("🔀  FIELD MISMATCHES (matched by app #):");
  discrepancies.forEach(d => {
    console.log(`   Row ${d.row}  ${d.appNumber.padEnd(22)}  ${d.clientName}`);
    d.diffs.forEach(diff => console.log(`      → ${diff}`));
  });
  console.log();
}

// ── 4. Summary ────────────────────────────────────────────────────────────────
const sheetTotal  = SHEET_ROWS.reduce((s, r) => s + r.annualPremium, 0);
const dbTotal     = DB_ROWS.reduce((s, r) => s + (parseFloat(r.annualPremium) || 0), 0);
const sheetApps   = SHEET_ROWS.length;
const dbApps      = DB_ROWS.length;

console.log("─────────────────────────────────────────");
console.log(`   SHEET  → ${sheetApps} apps  /  $${sheetTotal.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})} ALP`);
console.log(`   DB     → ${dbApps} apps  /  $${dbTotal.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})} ALP`);
console.log(`   DELTA  → ${dbApps - sheetApps} apps  /  $${(dbTotal - sheetTotal).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})} ALP`);
console.log("─────────────────────────────────────────\n");

if (!sheetNotInDb.length && !dbNotInSheet.length && !discrepancies.length)
  console.log("✅  No discrepancies found — sheet and database match perfectly.\n");

process.exit(0);
