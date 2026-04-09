import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { readFileSync } from "fs";

// ── Service account ──────────────────────────────────────────────────────────
// TODO: Replace with path to your Outpost Digital Solutions Firebase admin service account JSON.
const sa = JSON.parse(
  readFileSync("/Users/christianbearden/Downloads/outpostdigitalsolutions-firebase-adminsdk.json", "utf8")
);
const app = initializeApp({ credential: cert(sa) });
const db = getFirestore(app);

// ── Helpers (same as seedClients) ────────────────────────────────────────────

function normalizePhone(raw) {
  if (!raw) return { phone: "", phoneSpecialCase: false };
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return { phone: "+1" + digits, phoneSpecialCase: false };
  if (digits.length === 11 && digits[0] === "1") return { phone: "+" + digits, phoneSpecialCase: false };
  return { phone: raw.trim(), phoneSpecialCase: true };
}

function normalizeDate(raw) {
  if (!raw) return "";
  const m = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return "";
  const month = m[1].padStart(2, "0");
  const day   = m[2].padStart(2, "0");
  let year    = m[3];
  if (year.length === 2) year = parseInt(year) > 50 ? "19" + year : "20" + year;
  return `${year}-${month}-${day}`;
}

function getWeekStart(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00Z");
  if (isNaN(d.getTime())) return "";
  const day  = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

// ── Spreadsheet records (from screenshot) ────────────────────────────────────

const RECORDS = [
  { rep: "Christina", contractorId: "3002", clientName: "Catrena Jones", phone: "(469) 254-1873", email: "catrena.jones0709@yahoo.com", startDate: "4/4/2026", state: "TX", carrier: "Americo", appNumber: "AM03179900", annualPremium: 720.00 },
  { rep: "Brianna", contractorId: "1006", clientName: "Rhonda Noel", phone: "(386)334-9406", email: "happyhou46@gmail.com", startDate: "4/22/2026", state: "FL", carrier: "Ethos", appNumber: "PTSN008071763", annualPremium: 2136.00 },
  { rep: "Jenn", contractorId: "3005", clientName: "Jacklena Whitlow", phone: "405-639-4411", email: "", startDate: "4/4/2026", state: "OK", carrier: "Americo", appNumber: "AM03180323", annualPremium: 1109.04 },
  { rep: "B*", contractorId: "1003", clientName: "Willie Dudley", phone: "248-722-1447", email: "nazarene1280@gmail.com", startDate: "4/3/2026", state: "MI", carrier: "Ethos", appNumber: "PTSN008072082", annualPremium: 1176.00 },
  { rep: "Jenn", contractorId: "3005", clientName: "Chris Whitlow", phone: "405-639-4411", email: "", startDate: "4/4/2026", state: "OK", carrier: "Americo", appNumber: "AM03180373", annualPremium: 1280.52 },
  { rep: "B*", contractorId: "1003", clientName: "Phyllis Ariss", phone: "505-353-1157", email: "", startDate: "4/12/2026", state: "NM", carrier: "Americo", appNumber: "AM03179810", annualPremium: 672.00 },
  { rep: "Christina", contractorId: "3002", clientName: "Marvell Ghoston", phone: "(443) 325-6008", email: "mghost10@gmail.com", startDate: "4/15/2026", state: "MD", carrier: "Americo", appNumber: "AM03180425", annualPremium: 960.00 },
  { rep: "Reagan", contractorId: "2001", clientName: "Tyenesha Fields", phone: "6239203772", email: "Info@jfhcharity.org", startDate: "4/15/2026", state: "AZ", carrier: "Trans", appNumber: "FEXB439049", annualPremium: 1106.88 },
  { rep: "Angel", contractorId: "3007", clientName: "Aaron robinson", phone: "(951) 392-0199", email: "redrobinson85@gmail.com", startDate: "4/10/2026", state: "AZ", carrier: "Ethos", appNumber: "PTSN008072619", annualPremium: 1572.00 },
  { rep: "Aryanna", contractorId: "3004", clientName: "Johnnie Terry", phone: "(757-407-5860)", email: "", startDate: "4/15/2026", state: "VA", carrier: "Instabrain", appNumber: "0101807515", annualPremium: 1335.84 },
  { rep: "B*", contractorId: "1003", clientName: "Tracye Stephenson", phone: "910-920-5960", email: "trey.sl984@yahoo.com", startDate: "4/4/2026", state: "FL", carrier: "Americo", appNumber: "AM03180599", annualPremium: 1312.68 },
  { rep: "B*", contractorId: "1003", clientName: "Henry Mcfadden", phone: "443-822-1415", email: "", startDate: "4/3/2026", state: "MD", carrier: "Instabrain", appNumber: "0101807544", annualPremium: 666.84 },
  { rep: "Jenn", contractorId: "3005", clientName: "Victoria Gonzales", phone: "307-274-5715", email: "victoriaelena123@yahoo.com", startDate: "4/21/2026", state: "WY", carrier: "Americo", appNumber: "AM03180844", annualPremium: 600.00 },
  { rep: "Jenn", contractorId: "3005", clientName: "Michelle Hogan", phone: "602-865-9707", email: "mthogan2010@yahoo.com", startDate: "4/5/2026", state: "AZ", carrier: "Ethos", appNumber: "PTSN008073563", annualPremium: 648.00 },
  { rep: "B*", contractorId: "1003", clientName: "Marilyn Walker", phone: "484-929-7283", email: "marilynwalker0318@outlook.com", startDate: "4/5/2026", state: "PA", carrier: "Instabrain", appNumber: "0101807622", annualPremium: 1009.44 },
  { rep: "Clay", contractorId: "1002", clientName: "Bruce Posey", phone: "(229) 291-0301", email: "bruceposeyjr@yahoo.com", startDate: "4/3/2026", state: "GA", carrier: "Americo", appNumber: "AM03181053", annualPremium: 837.36 },
  { rep: "Frank", contractorId: "1004", clientName: "Jeffery Banks", phone: "(931) 841-4695", email: "DREAMONTILLYOURDREAMCOMESTRUE@GMAIL.COM", startDate: "4/4/2026", state: "KY", carrier: "Ethos", appNumber: "PTSN008074067", annualPremium: 3084.00 },
  { rep: "Clay", contractorId: "1002", clientName: "Twana Taft", phone: "(203) 804-5580", email: "tafttwana19@yahoo.com", startDate: "4/17/2026", state: "CT", carrier: "Ethos", appNumber: "PTSN008072290", annualPremium: 1344.00 },
  { rep: "Susie", contractorId: "3003", clientName: "Herbert Dunmeyer", phone: "(843) 518-9049", email: "HEADIO2015@GMAIL.COM", startDate: "4/15/2026", state: "SC", carrier: "Instabrain", appNumber: "0101807636", annualPremium: 1368.60 },
  { rep: "Austin", contractorId: "1005", clientName: "Dennis Slininger", phone: "(509) 430-3918", email: "slinde1621@yahoo.com", startDate: "4/15/2026", state: "WA", carrier: "Ethos", appNumber: "PTSN008074284", annualPremium: 1236.00 },
  { rep: "Bradley", contractorId: "2004", clientName: "Evonne Cameron", phone: "(623) 341-2871", email: "evonnecameron2007@gmail.com", startDate: "4/15/2026", state: "AZ", carrier: "Ethos", appNumber: "0101807649", annualPremium: 974.64 },
  { rep: "Angel", contractorId: "3007", clientName: "Woodrow Sadler Jr.", phone: "(931) 257-2632", email: "woodrowsadler88@gmail.com", startDate: "4/4/2026", state: "IN", carrier: "Instabrain", appNumber: "0101807650", annualPremium: 678.48 },
  { rep: "De'Jonae", contractorId: "2003", clientName: "Hayden Pluviose", phone: "904-258-6551", email: "pluvioselouken@gmail.com", startDate: "4/3/2026", state: "FL", carrier: "Trans", appNumber: "IULA031867", annualPremium: 457.92 },
  { rep: "Jack M", contractorId: "2002", clientName: "Ula Jones 3rd", phone: "(470) 687-8271", email: "UDJONES3RD@GMAIL.COM", startDate: "4/16/2026", state: "GA", carrier: "Instabrain", appNumber: "0101807684", annualPremium: 1007.64 },
  { rep: "Susie", contractorId: "3003", clientName: "Cynthia Ellis", phone: "(707) 712-0225", email: "ellisluvpurple@yahoo.com", startDate: "4/4/2026", state: "CA", carrier: "Americo", appNumber: "AM03181360", annualPremium: 1560.00 },
  { rep: "Christina", contractorId: "3002", clientName: "Rudolph Robinson", phone: "(804) 803-4330", email: "Robinsonrudolph3@gmail.com", startDate: "4/22/2026", state: "VA", carrier: "Instabrain", appNumber: "0101807699", annualPremium: 928.56 },
  { rep: "Brianna", contractorId: "1006", clientName: "Debra Scott", phone: "(503)919-5027", email: "debra.sctt@yahoo.com", startDate: "4/10/2026", state: "AZ", carrier: "Ethos", appNumber: "PTSN008074451", annualPremium: 1176.00 },
  { rep: "Austin", contractorId: "1005", clientName: "Dorothy Yonko", phone: "(702) 986-4389", email: "dorothyyonko98@gmail.com", startDate: "4/20/2026", state: "NV", carrier: "Instabrain", appNumber: "0101807698", annualPremium: 1469.16 },
  { rep: "Bradley", contractorId: "2004", clientName: "Ashlynn Lee", phone: "(801) 497-1098", email: "ashlynnhlee@gmail.com", startDate: "4/26/2026", state: "OH", carrier: "Ethos", appNumber: "PTSN008075394", annualPremium: 612.00 },
  { rep: "Brianna", contractorId: "1006", clientName: "Andrew Ruffin", phone: "(202)793-9806", email: "andrew.ruffin.55@gmail.com", startDate: "4/15/2026", state: "NC", carrier: "Ethos", appNumber: "PTSN008075498", annualPremium: 1632.00 },
  { rep: "De'Jonae", contractorId: "2003", clientName: "Loukennie Pluviose", phone: "904-258-6551", email: "pluvioselouken@gmail.com", startDate: "4/3/2026", state: "FL", carrier: "Trans", appNumber: "IULA031858", annualPremium: 442.92 },
  { rep: "B*", contractorId: "1003", clientName: "Kimyania Owen", phone: "216-554-4614", email: "kimyaniaowens77@gmail.com", startDate: "4/10/2026", state: "OH", carrier: "Instabrain", appNumber: "0101807714", annualPremium: 639.48 },
];

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Fetch all existing clients
  const clientsSnap = await db.collection("clients").get();
  const existingAppNumbers = new Set();
  clientsSnap.forEach(doc => {
    const d = doc.data();
    if (d.appNumber) existingAppNumbers.add(d.appNumber.trim());
  });
  console.log(`Found ${clientsSnap.size} existing clients in Firestore`);

  // 2. Check which records are missing
  const missing = RECORDS.filter(r => !existingAppNumbers.has(r.appNumber));
  const existing = RECORDS.filter(r => existingAppNumbers.has(r.appNumber));

  console.log(`\n✅ Already in Firestore (${existing.length}):`);
  existing.forEach(r => console.log(`  - ${r.clientName} (${r.appNumber}) — rep: ${r.rep}`));

  console.log(`\n❌ MISSING from Firestore (${missing.length}):`);
  missing.forEach(r => console.log(`  - ${r.clientName} (${r.appNumber}) — rep: ${r.rep} (contractor ${r.contractorId})`));

  if (missing.length === 0) {
    console.log("\nAll records are present. Nothing to add.");
    process.exit(0);
  }

  // 3. Look up agents by contractorId
  const usersSnap = await db.collection("users").get();
  const byContractorId = {};
  usersSnap.forEach(doc => {
    const u = doc.data();
    if (u.contractorId) byContractorId[String(u.contractorId)] = { uid: doc.id, ...u };
  });
  console.log(`\nLoaded ${usersSnap.size} users for agent lookup`);

  // 4. Add missing records
  const dryRun = process.argv.includes("--dry-run");
  if (dryRun) console.log("\n🏃 DRY RUN — not writing to Firestore\n");
  else console.log("\n📝 Adding missing records...\n");

  let added = 0;
  for (const r of missing) {
    const agent = byContractorId[r.contractorId];
    const agentId = agent?.uid ?? `pending:${r.contractorId}`;
    const agentName = agent
      ? `${agent.firstName || ""} ${agent.lastName || ""}`.trim()
      : r.rep;
    const agentTeamNumber = agent?.teamNumber ?? 1;

    const dateStr = normalizeDate("4/3/2026"); // all records are dated 4/3/2026
    const startDate = normalizeDate(r.startDate);
    const weekStart = getWeekStart(dateStr);
    const { phone, phoneSpecialCase } = normalizePhone(r.phone);

    const clientDoc = {
      agentId,
      agentName,
      contractorId: r.contractorId,
      agentTeamNumber,
      date: dateStr,
      clientName: r.clientName,
      phone,
      ...(phoneSpecialCase ? { phoneSpecialCase: true } : {}),
      email: (r.email || "").toLowerCase() === "n/a" ? "" : r.email,
      startDate,
      state: r.state.toUpperCase(),
      carrier: r.carrier,
      appNumber: r.appNumber,
      annualPremium: r.annualPremium,
      portal: "",
      portalName: "",
      agentStatus: "Pending",
      adminStatus: "Pending Client Payment",
      splitPercent: 0,
      clientPaidDate: "",
      compDate: "",
      notes: "",
      weekStart,
      createdAt: Timestamp.now(),
      createdBy: "script",
      createdByName: "Migration Script",
    };

    if (dryRun) {
      console.log(`  [DRY] Would add: ${r.clientName} (${r.appNumber}) → agent: ${agentName} (${agentId})`);
    } else {
      const ref = await db.collection("clients").add(clientDoc);
      console.log(`  ✅ Added: ${r.clientName} (${r.appNumber}) → ${ref.id} — agent: ${agentName}`);
    }
    added++;
  }

  console.log(`\n${dryRun ? "Would add" : "Added"} ${added} records`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
