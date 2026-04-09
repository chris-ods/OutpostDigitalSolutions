// Quick check: does a user doc exist in Firestore for a given UID?
// Usage: node scripts/check-user.mjs <uid>
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const uid = process.argv[2];
if (!uid) { console.error("Usage: node scripts/check-user.mjs <uid>"); process.exit(1); }

const app = initializeApp({
  credential: cert(JSON.parse(
    (await import("fs")).readFileSync(
      new URL("../../Downloads/atx-financial-firebase-adminsdk-fbsvc-bb8d46aff7.json", import.meta.url),
      "utf8"
    )
  )),
});

const db = getFirestore(app);
const snap = await db.collection("users").doc(uid).get();

if (snap.exists) {
  console.log("✅ Document found at users/" + uid);
  console.log(JSON.stringify(snap.data(), null, 2));
} else {
  console.log("❌ No document at users/" + uid);
  // Check if any user doc has this UID in a field
  const allUsers = await db.collection("users").get();
  console.log(`\nTotal user docs: ${allUsers.size}`);
  console.log("Doc IDs:");
  allUsers.forEach(d => console.log(`  ${d.id}  ${d.data().firstName ?? ""} ${d.data().lastName ?? ""} (${d.data().email ?? ""})`));
}

process.exit(0);
