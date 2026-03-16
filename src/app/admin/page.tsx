"use client";

import withAuth from "../../components/withAuth";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

function AdminPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Admin Dashboard</h1>
      <p>Welcome, you are logged in!</p>
      <button onClick={handleLogout} style={{ padding: '0.5rem', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>
        Logout
      </button>
    </div>
  );
}

export default withAuth(AdminPage);
