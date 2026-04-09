import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

// TODO: Replace with path to your Outpost Digital Solutions Firebase admin service account JSON.
const sa = JSON.parse(
  readFileSync("/Users/christianbearden/Downloads/outpostdigitalsolutions-firebase-adminsdk.json", "utf8")
);
const app = initializeApp({ credential: cert(sa) });
const db = getFirestore(app);

async function main() {
  // 1. Load all users
  const usersSnap = await db.collection("users").get();
  const usersByUid = {};
  const usersByContractorId = {};
  const usersByName = {};

  usersSnap.docs.forEach(d => {
    const u = d.data();
    const uid = d.id;
    usersByUid[uid] = { uid, ...u };
    if (u.contractorId) usersByContractorId[String(u.contractorId)] = { uid, ...u };
    const name = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim().toLowerCase();
    if (name) usersByName[name] = { uid, ...u };
  });

  console.log(`Loaded ${usersSnap.size} users\n`);

  // 2. Load all clients
  const clientsSnap = await db.collection("clients").get();
  const allClients = clientsSnap.docs
    .filter(d => !d.id.startsWith("_"))
    .map(d => ({ id: d.id, ...d.data() }));

  console.log(`Loaded ${allClients.length} client records\n`);

  // 3. Categorize
  const matched = [];
  const pendingUnlinked = [];
  const orphanedToAdmin = [];
  const orphanedUnknown = [];
  const correctlyLinked = [];

  for (const c of allClients) {
    const agentId = c.agentId ?? "";

    // Pending placeholder — never got linked
    if (agentId.startsWith("pending:")) {
      const cid = agentId.replace("pending:", "");
      const possibleUser = usersByContractorId[cid];
      pendingUnlinked.push({
        clientId: c.id,
        clientName: c.clientName,
        date: c.date,
        carrier: c.carrier,
        annualPremium: c.annualPremium,
        currentAgentId: agentId,
        contractorIdOnRecord: c.contractorId,
        suggestedMatch: possibleUser ? `${possibleUser.firstName} ${possibleUser.lastName} (${possibleUser.uid})` : "NO MATCH",
      });
      continue;
    }

    // Check if agentId maps to an actual user
    const linkedUser = usersByUid[agentId];
    if (!linkedUser) {
      orphanedUnknown.push({
        clientId: c.id,
        clientName: c.clientName,
        date: c.date,
        agentName: c.agentName,
        currentAgentId: agentId,
        contractorIdOnRecord: c.contractorId,
      });
      continue;
    }

    // Agent exists — check if it's an admin (possible mis-mapping from CSV import)
    const isAdminAgent = ["admin", "owner", "developer"].includes(linkedUser.role);
    if (isAdminAgent && c.createdBy === "csv-import") {
      // CSV import fell back to admin UID — try to find the real agent
      const byContractor = usersByContractorId[c.contractorId];
      const byName = c.agentName ? usersByName[c.agentName.toLowerCase()] : null;
      const suggestion = byContractor ?? byName;
      orphanedToAdmin.push({
        clientId: c.id,
        clientName: c.clientName,
        date: c.date,
        carrier: c.carrier,
        annualPremium: c.annualPremium,
        agentNameOnRecord: c.agentName,
        contractorIdOnRecord: c.contractorId,
        currentAgentId: agentId,
        currentAgentName: `${linkedUser.firstName} ${linkedUser.lastName}`,
        suggestedMatch: suggestion ? `${suggestion.firstName} ${suggestion.lastName} (UID: ${suggestion.uid}, CID: ${suggestion.contractorId})` : "NO MATCH",
        suggestedUid: suggestion?.uid ?? null,
      });
      continue;
    }

    // Check if contractorId on the client matches the linked user's contractorId
    if (c.contractorId && linkedUser.contractorId && c.contractorId !== linkedUser.contractorId) {
      const correctUser = usersByContractorId[c.contractorId];
      matched.push({
        clientId: c.id,
        clientName: c.clientName,
        date: c.date,
        issue: "contractorId mismatch",
        currentAgentId: agentId,
        currentAgentName: `${linkedUser.firstName} ${linkedUser.lastName} (CID: ${linkedUser.contractorId})`,
        contractorIdOnRecord: c.contractorId,
        suggestedMatch: correctUser ? `${correctUser.firstName} ${correctUser.lastName} (UID: ${correctUser.uid}, CID: ${correctUser.contractorId})` : "NO MATCH",
        suggestedUid: correctUser?.uid ?? null,
      });
      continue;
    }

    correctlyLinked.push(c.id);
  }

  // 4. Report
  console.log("=" .repeat(80));
  console.log("AUDIT REPORT");
  console.log("=" .repeat(80));
  console.log(`\nCorrectly linked: ${correctlyLinked.length}`);

  if (pendingUnlinked.length > 0) {
    console.log(`\n${"─".repeat(80)}`);
    console.log(`PENDING/UNLINKED (agentId starts with "pending:") — ${pendingUnlinked.length} records`);
    console.log(`${"─".repeat(80)}`);
    pendingUnlinked.forEach(r => {
      console.log(`  ${r.clientName} | ${r.date} | ${r.carrier} | $${r.annualPremium}`);
      console.log(`    Current: ${r.currentAgentId}`);
      console.log(`    ContractorID on record: ${r.contractorIdOnRecord}`);
      console.log(`    Suggested: ${r.suggestedMatch}`);
      console.log();
    });
  }

  if (orphanedToAdmin.length > 0) {
    console.log(`\n${"─".repeat(80)}`);
    console.log(`MAPPED TO ADMIN (CSV import fell back to admin UID) — ${orphanedToAdmin.length} records`);
    console.log(`${"─".repeat(80)}`);
    orphanedToAdmin.forEach(r => {
      console.log(`  ${r.clientName} | ${r.date} | ${r.carrier} | $${r.annualPremium}`);
      console.log(`    Agent name on record: ${r.agentNameOnRecord}`);
      console.log(`    ContractorID on record: ${r.contractorIdOnRecord}`);
      console.log(`    Currently mapped to: ${r.currentAgentName} (${r.currentAgentId})`);
      console.log(`    Suggested fix: ${r.suggestedMatch}`);
      console.log();
    });
  }

  if (matched.length > 0) {
    console.log(`\n${"─".repeat(80)}`);
    console.log(`CONTRACTOR ID MISMATCH (linked to user but CID doesn't match) — ${matched.length} records`);
    console.log(`${"─".repeat(80)}`);
    matched.forEach(r => {
      console.log(`  ${r.clientName} | ${r.date}`);
      console.log(`    Issue: ${r.issue}`);
      console.log(`    Currently: ${r.currentAgentName}`);
      console.log(`    ContractorID on record: ${r.contractorIdOnRecord}`);
      console.log(`    Suggested: ${r.suggestedMatch}`);
      console.log();
    });
  }

  if (orphanedUnknown.length > 0) {
    console.log(`\n${"─".repeat(80)}`);
    console.log(`ORPHANED (agentId doesn't match any user) — ${orphanedUnknown.length} records`);
    console.log(`${"─".repeat(80)}`);
    orphanedUnknown.forEach(r => {
      console.log(`  ${r.clientName} | ${r.date} | agentName: ${r.agentName}`);
      console.log(`    agentId: ${r.currentAgentId}`);
      console.log(`    ContractorID: ${r.contractorIdOnRecord}`);
      console.log();
    });
  }

  // Summary
  console.log(`\n${"=".repeat(80)}`);
  console.log("SUMMARY");
  console.log(`${"=".repeat(80)}`);
  console.log(`Total records:        ${allClients.length}`);
  console.log(`Correctly linked:     ${correctlyLinked.length}`);
  console.log(`Pending/unlinked:     ${pendingUnlinked.length}`);
  console.log(`Mapped to admin:      ${orphanedToAdmin.length}`);
  console.log(`ContractorID mismatch:${matched.length}`);
  console.log(`Orphaned (no user):   ${orphanedUnknown.length}`);
  console.log(`\nTotal needing fix:    ${pendingUnlinked.length + orphanedToAdmin.length + matched.length + orphanedUnknown.length}`);

  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
