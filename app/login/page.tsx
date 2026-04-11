"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import { BrandLogo } from "../../lib/components/BrandLogo";

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [troubleMode, setTroubleMode] = useState(false);
  const [troubleEmail, setTroubleEmail] = useState("");
  const [troubleSent, setTroubleSent] = useState(false);
  const [troubleLoading, setTroubleLoading] = useState(false);
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
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      console.error("Firebase auth error:", code, err);
      if (code === "auth/user-not-found") {
        setError("No account found with that email.");
      } else if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setError("Incorrect password.");
      } else if (code === "auth/user-disabled") {
        setError("This account has been disabled. Contact an admin.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many failed attempts. Try again later.");
      } else if (code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else {
        setError("Unable to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetLoading(true);
    try {
      const input = username.toLowerCase().trim();
      let email: string;
      if (isEmail(input)) {
        email = input;
      } else {
        const usernameDoc = await getDoc(doc(db, "usernames", input));
        if (!usernameDoc.exists()) {
          setError("No account found with that username or email.");
          setResetLoading(false);
          return;
        }
        email = (usernameDoc.data() as { email: string }).email;
      }
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch {
      setError("Could not send reset email. Check the address and try again.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <BrandLogo width={280} height={280} priority />
          </div>
          <p className="text-app-text-3 text-sm mt-2">
            {resetMode ? "Reset your password" : "Sign in to your portal"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-app-surface border border-app-border rounded-2xl p-8 shadow-xl">
          {resetMode ? (
            /* ── Reset password form ── */
            resetSent ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-green-500/15 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <p className="text-app-text font-semibold">Check your email</p>
                <p className="text-app-text-3 text-sm">A password reset link has been sent. Check your inbox and spam folder.</p>
                <button
                  type="button"
                  onClick={() => { setResetMode(false); setResetSent(false); setError(null); }}
                  className="text-app-accent hover:opacity-80 text-sm transition"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-5">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-app-text-2 mb-1.5">
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
                    className="w-full px-4 py-2.5 bg-app-surface-2 border border-app-border-2 rounded-lg text-app-text placeholder-app-text-4 focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent transition"
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
                  disabled={resetLoading}
                  className="w-full py-2.5 px-4 bg-app-accent hover:bg-app-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-app-accent focus:ring-offset-2 focus:ring-offset-app-surface"
                >
                  {resetLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Sending...
                    </span>
                  ) : "Send Reset Link"}
                </button>

                <button
                  type="button"
                  onClick={() => { setResetMode(false); setError(null); }}
                  className="w-full text-center text-app-text-4 hover:text-app-text-2 text-sm transition"
                >
                  Back to sign in
                </button>

                {/* Having trouble? */}
                <div className="border-t border-app-border pt-4 mt-1">
                  {troubleSent ? (
                    <p className="text-green-400 text-sm text-center">Request sent — an admin will reset your password shortly.</p>
                  ) : troubleMode ? (
                    <div className="space-y-3">
                      <p className="text-app-text-3 text-xs text-center">Enter your email and an admin will manually reset your password.</p>
                      <input
                        type="email"
                        value={troubleEmail}
                        onChange={(e) => setTroubleEmail(e.target.value)}
                        placeholder="Your email address"
                        className="w-full px-4 py-2.5 bg-app-surface-2 border border-app-border-2 rounded-lg text-app-text placeholder-app-text-4 focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent transition text-sm"
                      />
                      <button
                        type="button"
                        disabled={troubleLoading || !troubleEmail.trim()}
                        onClick={async () => {
                          setTroubleLoading(true);
                          try {
                            await addDoc(collection(db, "passwordResetRequests"), {
                              email: troubleEmail.trim().toLowerCase(),
                              createdAt: serverTimestamp(),
                              status: "pending",
                            });
                            setTroubleSent(true);
                          } catch {
                            setError("Could not submit request. Please try again.");
                          } finally {
                            setTroubleLoading(false);
                          }
                        }}
                        className="w-full py-2 px-4 bg-app-surface-2 hover:bg-app-surface-2 disabled:opacity-50 disabled:cursor-not-allowed border border-app-border-2 text-app-text-2 font-medium rounded-lg transition text-sm"
                      >
                        {troubleLoading ? "Sending..." : "Submit Request"}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setTroubleMode(true)}
                      className="w-full text-center text-app-text-5 hover:text-app-text-3 text-xs transition"
                    >
                      Having trouble? Request an admin reset
                    </button>
                  )}
                </div>
              </form>
            )
          ) : (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-app-text-2 mb-1.5">
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
                className="w-full px-4 py-2.5 bg-app-surface-2 border border-app-border-2 rounded-lg text-app-text placeholder-app-text-4 focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent transition"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-app-text-2 mb-1.5">
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
                className="w-full px-4 py-2.5 bg-app-surface-2 border border-app-border-2 rounded-lg text-app-text placeholder-app-text-4 focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent transition"
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
              className="w-full py-2.5 px-4 bg-app-accent hover:bg-app-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-app-accent focus:ring-offset-2 focus:ring-offset-app-surface"
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

            <div className="text-center">
              <button
                type="button"
                onClick={() => { setResetMode(true); setError(null); }}
                className="text-app-text-4 hover:text-app-text-2 text-sm transition"
              >
                Forgot password?
              </button>
            </div>
          </form>
          )} {/* end resetMode conditional */}
        </div>

      </div>
    </div>
  );
}
