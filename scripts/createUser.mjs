import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBZ_9m4TFHAjFoACVuN9u_y1lhVcdBvXmA",
  authDomain: "ffl-forefront.firebaseapp.com",
  projectId: "ffl-forefront",
  storageBucket: "ffl-forefront.firebasestorage.app",
  messagingSenderId: "655933961961",
  appId: "1:655933961961:web:13ae343d35db7c84226278",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

try {
  const cred = await signInWithEmailAndPassword(auth, "calvinwright94@gmail.com", "rltw123");
  await setDoc(doc(db, "users", cred.user.uid), {
    name: "Calvin Wright",
    email: "calvinwright94@gmail.com",
    role: "admin",
    agentCode: "0000",
    createdAt: serverTimestamp(),
  });
  console.log(`✅ Calvin Wright set as admin — uid: ${cred.user.uid}`);
} catch (err) {
  console.error("❌ Error:", err.message);
}

process.exit(0);
