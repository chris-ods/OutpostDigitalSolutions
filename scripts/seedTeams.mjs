import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBZ_9m4TFHAjFoACVuN9u_y1lhVcdBvXmA",
  authDomain: "ffl-forefront.firebaseapp.com",
  projectId: "ffl-forefront",
  storageBucket: "ffl-forefront.firebasestorage.app",
  messagingSenderId: "655933961961",
  appId: "1:655933961961:web:13ae343d35db7c84226278",
};

const [,, email, password] = process.argv;
if (!email || !password) {
  console.error("Usage: node scripts/seedTeams.mjs <admin-email> <admin-password>");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

try {
  await signInWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, "settings", "teamConfig"), { teamCount: 4 });
  console.log("✅ teamCount set to 4 in settings/teamConfig");
} catch (err) {
  console.error("❌ Error:", err.message);
}

process.exit(0);
