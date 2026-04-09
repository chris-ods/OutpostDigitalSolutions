import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { createReadStream } from "fs";
import { resolve } from "path";
import { createInterface } from "readline";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const [,, email, password, csvPath] = process.argv;
if (!email || !password || !csvPath) {
  console.error(
    "Usage: node --env-file=.env.local scripts/seedClients.mjs <admin-email> <admin-password> <csv-path>"
  );
  process.exit(1);
}

// ── CSV parser (handles quoted fields with embedded commas/newlines) ──────────

function parseCSVLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

// ── Date helpers ─────────────────────────────────────────────────────────────

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
  const day  = d.getUTCDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

// ── Phone normalizer ──────────────────────────────────────────────────────────

function normalizePhone(raw) {
  if (!raw) return { phone: "", phoneSpecialCase: false };
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return { phone: "+1" + digits, phoneSpecialCase: false };
  if (digits.length === 11 && digits[0] === "1") return { phone: "+" + digits, phoneSpecialCase: false };
  return { phone: raw.trim(), phoneSpecialCase: true };
}

// ── Field normalizers ─────────────────────────────────────────────────────────

const CARRIER_MAP = {
  "americo":        "Americo",
  "am am":          "AMAM",
  "amam":           "AMAM",
  "aetna":          "Aetna",
  "cica":           "CICA",
  "chubb":          "Chubb",
  "corebridge":     "Corebridge",
  "ethos":          "Ethos",
  "moo":            "MOO",
  "mutual of omaha":"MOO",
  "trans":          "Trans",
  "transamerica":   "Trans",
  "instabrain":     "Instabrain",
};

function normalizeCarrier(raw) {
  return CARRIER_MAP[(raw || "").trim().toLowerCase()] ?? "Other";
}

function normalizeAgentStatus(raw) {
  const s = (raw || "").trim().toLowerCase();
  if (!s) return "Pending";
  if (s.includes("approv"))                          return "Approved";
  if (s.includes("commis"))                          return "Approved";
  if (s.includes("free-look") || s.includes("free look")) return "Approved";
  if (s.includes("declin"))                          return "Declined";
  if (s.includes("sent uw"))                         return "Sent UW";
  if (s.includes("requirement") || s.includes("uw")) return "Sent UW";
  if (s.includes("cancel") || s === "cxl")           return "Cancelled";
  if (s.includes("pend"))                            return "Pending";
  return "Pending";
}

function normalizeAdminStatus(rawAdmin, rawAgent) {
  const a = (rawAdmin || "").trim().toLowerCase();
  if (a) {
    if (a.includes("client paid") && (a.includes("comp paid") || a.includes("comp")))
      return a.includes("waiting") ? "Client Paid|Waiting on Comp" : "Client Paid|Comp Paid";
    if (a.includes("comp paid") && a.includes("client not paid")) return "Comp Paid|Client Not Paid";
    if (a.includes("pending client"))                             return "Pending Client Payment";
    if (a.includes("uw") || a.includes("requirement"))           return "UW or Requirements";
    if (a.includes("decline") && a.includes("rewrite"))          return "Decline - Rewrite";
    if (a.includes("lapse"))                                      return "Lapsed";
    if (a === "cxl" || a.includes("cancel"))                     return "CXL";
  }
  // Infer from agent status
  const ag = (rawAgent || "").trim().toLowerCase();
  if (ag.includes("commis") || ag.includes("free-look") || ag.includes("free look"))
    return "Client Paid|Comp Paid";
  if (ag.includes("declin"))                                     return "Decline - Rewrite";
  if (ag.includes("sent uw") || ag.includes("requirement"))     return "UW or Requirements";
  if (ag.includes("cancel") || ag === "cxl")                    return "CXL";
  return "Pending Client Payment";
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

console.log("Signing in...");
const cred     = await signInWithEmailAndPassword(auth, email, password);
const adminUid  = cred.user.uid;
const adminName = cred.user.displayName || email;
console.log(`Signed in as ${email} (${adminUid})`);

// Build lookup maps from users collection
console.log("Fetching users...");
const usersSnap = await getDocs(collection(db, "users"));
const byContractorId = {};
const byFirstName    = {};
usersSnap.forEach(d => {
  const u = d.data();
  if (u.contractorId) byContractorId[String(u.contractorId)] = { uid: d.id, ...u };
  const fn = (u.firstName || "").toLowerCase();
  if (fn) byFirstName[fn] = { uid: d.id, ...u };
});
console.log(`Loaded ${usersSnap.size} users`);

// Read CSV lines
const lines = [];
const rl = createInterface({ input: createReadStream(resolve(csvPath)) });
for await (const line of rl) lines.push(line);

const SKIP_AGENT_VALUES = new Set(["arty", "validation error", "name", "agent name", ""]);

let imported = 0;
let skipped  = 0;

// CSV columns:
// 0  Name (agent)
// 1  Date
// 2  ID (contractorId)
// 3  Client Name
// 4  Phone
// 5  Email
// 6  Start Date
// 7  State
// 8  Carrier
// 9  App Number
// 10 Annual Premium
// 11 Portal (freeform notes — NOT a UID)
// 12 Team Name
// 13 Agent Status
// 14 Admin Status
// 15 Payroll
// 16 Split %
// 17 Client Paid Date
// 18 Comp Date
// 19 Notes

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) { skipped++; continue; }

  const cols = parseCSVLine(line);

  const agentRaw       = (cols[0]  || "").trim();
  const contractorIdRaw = (cols[2] || "").trim();
  const clientName     = (cols[3]  || "").trim();

  // Skip header-like, empty, or non-data rows
  if (!clientName) { skipped++; continue; }
  if (SKIP_AGENT_VALUES.has(agentRaw.toLowerCase())) { skipped++; continue; }
  if (/^\d+$/.test(agentRaw)) { skipped++; continue; } // bare numbers

  // Resolve agent from Firestore users
  let agentUser = byContractorId[contractorIdRaw];
  if (!agentUser && agentRaw) {
    const firstName = agentRaw.split(/\s+/)[0].toLowerCase();
    agentUser = byFirstName[firstName];
  }

  const agentId        = agentUser?.uid ?? adminUid;
  const agentName      = agentUser
    ? `${agentUser.firstName || ""} ${agentUser.lastName || ""}`.trim()
    : agentRaw;
  const teamFromCSV    = parseInt((cols[12] || "").replace(/\D/g, "")) || 1;
  const agentTeamNumber = agentUser?.teamNumber ?? teamFromCSV;

  const dateStr        = normalizeDate(cols[1]);
  const startDate      = normalizeDate(cols[6]);
  const clientPaidDate = normalizeDate(cols[17]);
  const compDate       = normalizeDate(cols[18]);
  const weekStart      = getWeekStart(dateStr);

  const { phone, phoneSpecialCase } = normalizePhone(cols[4]);

  const portalNotes   = (cols[11] || "").trim();
  const csvNotes      = (cols[19] || "").trim();
  const notes         = [portalNotes, csvNotes].filter(Boolean).join(" | ");

  const splitPercent  = parseFloat((cols[16] || "").replace(/[^0-9.]/g, "")) || 0;
  const annualPremium = parseFloat((cols[10] || "").replace(/[$,]/g, ""))     || 0;

  const agentStatusRaw = cols[13] || "";
  const adminStatusRaw = cols[14] || "";

  const clientDoc = {
    agentId,
    agentName,
    contractorId:    contractorIdRaw,
    agentTeamNumber,
    date:            dateStr,
    clientName,
    phone,
    ...(phoneSpecialCase ? { phoneSpecialCase: true } : {}),
    email:           (cols[5]  || "").trim(),
    startDate,
    state:           (cols[7]  || "").trim().toUpperCase(),
    carrier:         normalizeCarrier(cols[8]),
    appNumber:       (cols[9]  || "").trim(),
    annualPremium,
    portal:          "",
    portalName:      "",
    agentStatus:     normalizeAgentStatus(agentStatusRaw),
    adminStatus:     normalizeAdminStatus(adminStatusRaw, agentStatusRaw),
    splitPercent,
    clientPaidDate,
    compDate,
    notes,
    weekStart,
    createdAt:       Timestamp.now(),
    createdBy:       adminUid,
    createdByName:   adminName,
  };

  try {
    await addDoc(collection(db, "clients"), clientDoc);
    imported++;
    if (imported % 25 === 0) console.log(`  ...${imported} records imported`);
  } catch (err) {
    console.error(`  ✗ Row ${i + 1} (${agentRaw} / ${clientName}): ${err.message}`);
    skipped++;
  }
}

console.log(`\n✅ Done: ${imported} imported, ${skipped} skipped`);
process.exit(0);
