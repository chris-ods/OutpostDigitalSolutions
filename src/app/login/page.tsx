"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { useRouter } from "next/navigation";

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const input = username.toLowerCase().trim();
      let email: string;

      if (isEmail(input)) {
        email = input;
      } else {
        const usernameDoc = await getDoc(doc(db, "usernames", input));
        if (!usernameDoc.exists()) {
          setError("Invalid username or password.");
          setLoading(false);
          return;
        }
        email = (usernameDoc.data() as { email: string }).email;
      }

      await signInWithEmailAndPassword(auth, email, password);
      router.push("/portal");
    } catch {
      setError("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-4">
            <rect width="56" height="56" rx="16" fill="#0a1628"/>
            <line x1="0" y1="28" x2="56" y2="28" stroke="#1e3a5f" strokeWidth="0.4" opacity="0.7"/>
            <line x1="28" y1="0" x2="28" y2="56" stroke="#1e3a5f" strokeWidth="0.4" opacity="0.7"/>
            <ellipse cx="29" cy="27" rx="24" ry="20" stroke="#1e3a8a" strokeWidth="0.5" fill="none"/>
            <ellipse cx="29" cy="27" rx="21" ry="17.5" stroke="#1e40af" strokeWidth="0.5" fill="none"/>
            <ellipse cx="29" cy="27" rx="18" ry="15" stroke="#1d4ed8" strokeWidth="0.5" fill="none"/>
            <ellipse cx="29" cy="27" rx="15.5" ry="12.5" stroke="#2563eb" strokeWidth="0.6" fill="none"/>
            <ellipse cx="29" cy="27" rx="13" ry="10.5" stroke="#3b82f6" strokeWidth="0.6" fill="none"/>
            <ellipse cx="29" cy="27" rx="10.5" ry="8" stroke="#60a5fa" strokeWidth="0.7" fill="none"/>
            <ellipse cx="29" cy="27" rx="8" ry="6" stroke="#7cb4fb" strokeWidth="0.7" fill="none"/>
            <ellipse cx="29" cy="27" rx="5.5" ry="4" stroke="#93c5fd" strokeWidth="0.8" fill="none"/>
            <ellipse cx="29" cy="27" rx="3" ry="2.2" stroke="#bfdbfe" strokeWidth="0.9" fill="none"/>
            <path d="M29 23 L31.2 27 L26.8 27 Z" fill="#93c5fd" opacity="0.9"/>
            <circle cx="29" cy="22" r="1" fill="#dbeafe"/>
          </svg>
          <h1 className="text-2xl font-bold text-white tracking-tight">Outpost Digital Solutions</h1>
          <p className="text-gray-400 text-sm mt-1">Sign in to your portal</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1.5">
                Username or Email
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username or email"
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-red-950 border border-red-800 rounded-lg">
                <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          Contact your administrator for account access.
        </p>
      </div>
    </div>
  );
}
