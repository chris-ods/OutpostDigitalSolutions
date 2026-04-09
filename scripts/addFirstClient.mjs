/**
 * One-off script: add Paul Lassen (Tyler's client) to Firestore.
 * Usage:
 *   node --env-file=.env.local scripts/addFirstClient.mjs <admin-email> <admin-password>
 */

import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs, addDoc, Timestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const [,, email, password] = process.argv;
if (!email || !password) {
  console.error("Usage: node --env-file=.env.local scripts/addFirstClient.mjs <admin-email> <admin-password>");
  process.exit(1);
}

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

console.log("Signing in...");
const cred      = await signInWithEmailAndPassword(auth, email, password);
const adminUid  = cred.user.uid;
const adminName = cred.user.displayName || email;
console.log(`Signed in as ${email}`);

// Look up Tyler by contractor ID "2999", and find team 2's TC for portal
console.log("Looking up agent and team captain...");
const usersSnap = await getDocs(collection(db, "users"));
let agentId         = `pending:2999`;
let agentName       = "Tyler";
let agentTeamNumber = 2; // derived from first digit of contractor ID 2999
let portalUid       = "";
let portalName      = "";

usersSnap.forEach(d => {
  const u = d.data();
  if (String(u.contractorId).trim() === "2999") {
    agentId         = d.id;
    agentName       = `${u.firstName || ""} ${u.lastName || ""}`.trim();
    agentTeamNumber = u.teamNumber ?? 2;
    console.log(`Found agent: ${agentName} (uid: ${d.id})`);
  }
  // Team 2's active manager becomes the portal for this fired contractor
  if (u.role === "manager" && u.teamNumber === 2 && u.active !== false) {
    portalUid  = d.id;
    portalName = `${u.firstName || ""} ${u.lastName || ""}`.trim();
    console.log(`Found team 2 TC: ${portalName} (uid: ${d.id})`);
  }
});

// Fired contractor (2999) — TC is agent of record
const finalAgentId      = portalUid || agentId;   // prefer TC uid if found
const finalAgentName    = portalUid ? portalName : agentName;
const finalContractorId = portalUid
  ? (usersSnap.docs.find(d => d.id === portalUid)?.data().contractorId ?? "2001")
  : "2999";
const finalTeamNumber   = 2; // leading digit of 2999

const clientDoc = {
  agentId:         finalAgentId,
  agentName:       finalAgentName,
  contractorId:    finalContractorId,
  agentTeamNumber: finalTeamNumber,
  date:            "2026-01-01",
  clientName:      "Paul Lassen",
  phone:           "+18168749320",
  email:           "pmlassen@gmail.com",
  startDate:       "2026-01-03",
  state:           "KS",
  carrier:         "Corebridge",
  appNumber:       "7260000087",
  annualPremium:   639.48,
  portal:          "",
  portalName:      "",
  agentStatus:     "Approved",
  adminStatus:     "Client Paid|Comp Paid",
  splitPercent:    0,
  payroll:         false,
  clientPaidDate:  "2026-01-03",
  compDate:        "2026-01-14",
  notes:           "",
  firedCSR:        "Fired",
  weekStart:       "2025-12-29",
  createdAt:       Timestamp.now(),
  createdBy:       adminUid,
  createdByName:   adminName,
};

console.log("Writing client...");
const ref = await addDoc(collection(db, "clients"), clientDoc);
console.log(`✅ Done — Paul Lassen added (doc id: ${ref.id})`);
process.exit(0);
