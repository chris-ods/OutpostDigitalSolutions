"use client";

import { useEffect, useState, useRef } from "react";
import { doc, getDoc, setDoc, collection, query, where, updateDoc, getDocs, writeBatch, deleteField, serverTimestamp } from "firebase/firestore";
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../../lib/firebase";
import { useRouter } from "next/navigation";
import { UserProfile, isAdminLevel, CAREER_LEVELS, avatarColor } from "../../../lib/types";
import { useUserClaim } from "../../../lib/hooks/useUserClaim";
import CropModal from "../../../components/CropModal";
import { DEFAULT_TEAM_COLORS } from "../../../lib/teamColors";
import { Spinner } from "../../../lib/components/Spinner";
import RichTextEditor from "../../../components/RichTextEditor";
import { useTheme } from "../../../lib/themeContext";
import type { Theme, TextSize } from "../../../lib/themeContext";
import SignaturePad from "../onboarding/steps/SignaturePad";

const SETTINGS_DOC = doc(db, "settings", "teamConfig");

interface UserRow {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "developer" | "owner" | "admin" | "manager" | "rep";
  subRole?: string;
  teamNumber: number;
  contractorId: string;
  active: boolean;
  photoURL?: string;
  level?: number;
}

const TEAM_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  1:  { bg: "bg-blue-500/15",   text: "text-blue-400",   border: "border-blue-500/25" },
  2:  { bg: "bg-purple-500/15", text: "text-purple-400", border: "border-purple-500/25" },
  3:  { bg: "bg-green-500/15",  text: "text-green-400",  border: "border-green-500/25" },
  4:  { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/25" },
  5:  { bg: "bg-red-500/15",    text: "text-red-400",    border: "border-red-500/25" },
  6:  { bg: "bg-yellow-500/15", text: "text-yellow-400", border: "border-yellow-500/25" },
  7:  { bg: "bg-pink-500/15",   text: "text-pink-400",   border: "border-pink-500/25" },
  8:  { bg: "bg-teal-500/15",   text: "text-teal-400",   border: "border-teal-500/25" },
  9:  { bg: "bg-cyan-500/15",   text: "text-cyan-400",   border: "border-cyan-500/25" },
  10: { bg: "bg-indigo-500/15", text: "text-indigo-400", border: "border-indigo-500/25" },
};

export function teamColor(n: number) {
  return TEAM_COLORS[((n - 1) % 10) + 1];
}

// CAREER_LEVELS imported from lib/types

export default function SettingsPage() {
  const router = useRouter();
  const claim = useUserClaim();
  const adminUid = claim.uid;
  const isAdmin = claim.isAdmin;
  const isDeveloperUser = claim.isDeveloper;
  const currentProfile = claim.profile;
  const { theme, setTheme, textSize, setTextSize, fontFamily, setFontFamily, accentColor, setAccentColor, resolvedTheme } = useTheme();
  const [signatureOnFile, setSignatureOnFile] = useState<string | null>(null);
  const [signatureSaving, setSignatureSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teamCount, setTeamCount] = useState(0);

  // Phase / environment
  const [phase, setPhase] = useState<"testing" | "merging" | "live">("live");
  const [teamNames, setTeamNames] = useState<Record<string, string>>({});
  const [editingTeamName, setEditingTeamName] = useState<number | null>(null);
  const [teamNameDraft, setTeamNameDraft] = useState("");
  const [managerTeamUsers, setManagerTeamUsers] = useState<UserRow[]>([]);
  const [promotingUid, setPromotingUid] = useState<string | null>(null);
  const [promotionMsg, setPromotionMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  // Chat feature toggle
  const [chatEnabled, setChatEnabled] = useState(false);
  const [chatEnableSaving, setChatEnableSaving] = useState(false);

  // Team color manager
  const [colorsDraft,   setColorsDraft]   = useState<Record<number, string>>({});
  const [colorsSaving,  setColorsSaving]  = useState(false);
  const [colorsError,   setColorsError]   = useState("");

  // Terms & Conditions (owner only)
  const [termsHtml, setTermsHtml] = useState("");
  const [termsVersion, setTermsVersion] = useState(0);
  const [termsSaving, setTermsSaving] = useState(false);
  const [termsSaved, setTermsSaved] = useState(false);

  // Reset-claims state (admin only)
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetRunning, setResetRunning] = useState(false);
  const [resetResult, setResetResult] = useState<{ updated: number; skipped: number } | null>(null);
  const [resetError, setResetError] = useState("");

  // Profile photo state (all users)
  const [profilePhotoURL, setProfilePhotoURL] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoProgress, setPhotoProgress] = useState(0);
  const [photoError, setPhotoError] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);

  // Sync photo URL from claim when it resolves
  useEffect(() => {
    if (!claim.loading) setProfilePhotoURL(claim.photoURL);
  }, [claim.loading, claim.photoURL]);

  // Load settings once auth resolves
  useEffect(() => {
    if (!adminUid || claim.loading) return;
    (async () => {
      try {
        const settingsSnap = await getDoc(SETTINGS_DOC);
        if (settingsSnap.exists()) {
          setTeamNames((settingsSnap.data().teamNames as Record<string, string>) ?? {});
          if (isAdmin) {
            setTeamCount(settingsSnap.data().teamCount as number);
            setPhase((settingsSnap.data().phase as "testing" | "merging" | "live") ?? "live");
            setChatEnabled(settingsSnap.data().chatEnabled === true);
            const rawColors = settingsSnap.data().teamColors as Record<string, string> | undefined;
            if (rawColors) {
              const parsed: Record<number, string> = {};
              for (const [k, v] of Object.entries(rawColors)) {
                const n = Number(k);
                if (!isNaN(n) && v) parsed[n] = v;
              }
              setColorsDraft(parsed);
            }
          }
        } else if (isAdmin) {
          await setDoc(SETTINGS_DOC, { teamCount: 4, phase: "live" });
          setTeamCount(4);
        }
      } catch { /* ignore */ }
      // Load signature on file
      if (adminUid) {
        try {
          const sigSnap = await getDoc(doc(db, "users", adminUid, "settings", "signature"));
          if (sigSnap.exists()) setSignatureOnFile(sigSnap.data().dataUrl ?? null);
        } catch { /* ignore */ }
      }
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminUid, claim.loading]);

  // Load Terms & Conditions
  useEffect(() => {
    if (!adminUid) return;
    getDoc(doc(db, "settings", "terms")).then((snap) => {
      if (snap.exists()) {
        setTermsHtml((snap.data().html as string) ?? "");
        setTermsVersion((snap.data().version as number) ?? 0);
      }
    }).catch(() => {});
  }, [adminUid]);

  // Load manager's team members for promotion feature
  useEffect(() => {
    if (!adminUid || currentProfile?.role !== "manager" || !currentProfile.teamNumber) return;
    getDocs(query(collection(db, "users"), where("teamNumber", "==", currentProfile.teamNumber)))
      .then((snap) => {
        const rows: UserRow[] = snap.docs
          .filter(d => d.id !== adminUid)
          .map(d => {
            const tm = d.data() as UserProfile & { subRole?: string };
            return {
              uid: d.id,
              firstName: tm.firstName ?? "",
              lastName:  tm.lastName ?? "",
              email:     tm.email ?? "",
              role:      tm.role ?? "rep",
              subRole:   tm.subRole,
              teamNumber: Number(tm.teamNumber) || 0,
              contractorId: tm.contractorId ?? "",
              active: tm.active !== false,
              photoURL: tm.photoURL,
              level: tm.level,
            };
          })
          .sort((a, b) => a.lastName.localeCompare(b.lastName));
        setManagerTeamUsers(rows);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminUid, currentProfile]);

  const saveTeamName = async (teamNum: number, name: string) => {
    const trimmed = name.trim();
    const updated = { ...teamNames, [String(teamNum)]: trimmed };
    if (!trimmed) delete updated[String(teamNum)];
    setTeamNames(updated);
    setEditingTeamName(null);
    try { await setDoc(SETTINGS_DOC, { teamNames: updated }, { merge: true }); } catch { /* ignore */ }
  };

  async function promoteToTL(targetUid: string) {
    const target = managerTeamUsers.find(u => u.uid === targetUid);
    if (!target) return;
    const name = `${target.firstName} ${target.lastName}`.trim();
    setPromotingUid(targetUid);
    setPromotionMsg(null);
    try {
      const licSnap = await getDocs(
        query(collection(db, "documents"),
          where("uploadedBy", "==", targetUid),
          where("category", "==", "License")
        )
      );
      if (licSnap.empty) {
        setPromotionMsg({ type: "error", text: `${name} has no insurance license on file. They must upload their license in the Document Library first.` });
        setPromotingUid(null);
        return;
      }
      await updateDoc(doc(db, "users", targetUid), { subRole: "TL" });
      setManagerTeamUsers(prev => prev.map(u => u.uid === targetUid ? { ...u, subRole: "TL" } : u));
      setPromotionMsg({ type: "success", text: `${name} has been promoted to Team Lead.` });
    } catch {
      setPromotionMsg({ type: "error", text: "Promotion failed. Please try again." });
    }
    setPromotingUid(null);
  }

  const saveTeamManager = async () => {
    setColorsSaving(true);
    setColorsError("");
    try {
      const teamColorsStr: Record<string, string> = {};
      for (const [k, v] of Object.entries(colorsDraft)) teamColorsStr[String(k)] = v;
      await setDoc(SETTINGS_DOC, { teamCount, teamColors: teamColorsStr }, { merge: true });
    } catch {
      setColorsError("Failed to save. Please try again.");
    } finally {
      setColorsSaving(false);
    }
  };

  const savePhase = async (newPhase: "testing" | "merging" | "live") => {
    setPhase(newPhase);
    try { await setDoc(SETTINGS_DOC, { phase: newPhase }, { merge: true }); } catch { /* ignore */ }
  };

  const toggleChat = async () => {
    const next = !chatEnabled;
    setChatEnabled(next);
    setChatEnableSaving(true);
    try { await setDoc(SETTINGS_DOC, { chatEnabled: next }, { merge: true }); } catch { /* ignore */ }
    finally { setChatEnableSaving(false); }
  };

  const resetAllClaims = async () => {
    setResetRunning(true);
    setResetError("");
    setResetResult(null);
    try {
      const snap = await getDocs(collection(db, "clients"));
      const claimed = snap.docs.filter(
        (d) => !String(d.data().agentId ?? "").startsWith("pending:")
      );

      let updated = 0;
      const BATCH_SIZE = 400;
      for (let i = 0; i < claimed.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        for (const d of claimed.slice(i, i + BATCH_SIZE)) {
          const data = d.data();
          const cid = data.contractorId ?? "";
          batch.update(doc(db, "clients", d.id), {
            agentId:    `pending:${cid}`,
            agentEmail: deleteField(),
            agentPhone: deleteField(),
          });
          updated++;
        }
        await batch.commit();
      }

      setResetResult({ updated, skipped: snap.docs.length - updated });
      setResetConfirm(false);
    } catch (err) {
      console.error(err);
      setResetError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setResetRunning(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    e.target.value = "";
    setPhotoError("");
    setCropFile(file);
  };

  const handleProfileCropApply = (blob: Blob) => {
    setCropFile(null);
    setPhotoError("");
    setPhotoUploading(true);
    setPhotoProgress(0);

    const path = storageRef(storage, `profile-photos/${adminUid}/avatar`);
    const task = uploadBytesResumable(path, blob, { contentType: "image/jpeg" });

    task.on(
      "state_changed",
      (snap) => setPhotoProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      (err) => {
        console.error(err);
        setPhotoError("Upload failed. Please try again.");
        setPhotoUploading(false);
      },
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          await updateDoc(doc(db, "users", adminUid), { photoURL: url });
          setProfilePhotoURL(url);
        } catch (err) {
          console.error(err);
          setPhotoError("Upload succeeded but failed to save. Please try again.");
        } finally {
          setPhotoUploading(false);
        }
      }
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  const profileInitials = currentProfile
    ? `${currentProfile.firstName[0] ?? ""}${currentProfile.lastName[0] ?? ""}`.toUpperCase()
    : "?";
  const profileFullName = currentProfile ? `${currentProfile.firstName} ${currentProfile.lastName}` : "";
  const settingsCareerEntry = currentProfile?.level != null
    ? CAREER_LEVELS.find((l) => l.level === currentProfile.level) ?? null
    : null;
  const settingsProfileTitle = currentProfile?.companyRole || settingsCareerEntry?.title
    || (currentProfile?.role ? currentProfile.role.charAt(0).toUpperCase() + currentProfile.role.slice(1) : "—");

  return (
    <div className="p-10 pb-16 max-w-2xl overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-app-text-3 text-sm mt-1">
          {isAdmin ? "Manage portal configuration." : "Manage your profile and account preferences."}
        </p>
      </div>

      {/* ── My Profile (all users) ── */}
      <div className="bg-app-surface border border-app-border rounded-xl p-6 mb-6">
        <h2 className="text-base font-semibold text-app-text mb-5">My Profile</h2>
        <div className="flex items-center gap-5">
          {/* Photo picker with badge */}
          <div className="relative shrink-0" style={{ width: 80, height: 80 }}>
            <button
              type="button"
              onClick={() => !photoUploading && photoInputRef.current?.click()}
              className="relative w-20 h-20 rounded-full group focus:outline-none focus-visible:ring-2 focus-visible:ring-app-accent"
              disabled={photoUploading}
            >
              {profilePhotoURL ? (
                <img
                  src={profilePhotoURL}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover ring-2 ring-app-border-2"
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-full ring-2 ring-app-border-2 flex items-center justify-center text-white text-2xl font-bold select-none"
                  style={{ backgroundColor: avatarColor(profileFullName) }}
                >
                  {profileInitials}
                </div>
              )}

              {/* Upload progress overlay */}
              {photoUploading && (
                <div className="absolute inset-0 rounded-full bg-app-surface/85 flex flex-col items-center justify-center gap-1">
                  <Spinner className="w-5 h-5 text-app-accent" />
                  <span className="text-white text-xs font-bold">{photoProgress}%</span>
                </div>
              )}

              {/* Hover overlay */}
              {!photoUploading && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                </div>
              )}
            </button>

            {/* Career/role badge centered below avatar */}
            {settingsCareerEntry && (
              <div
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase whitespace-nowrap border border-amber-500/40 text-amber-300"
                style={{ background: "rgba(10,12,18,0.95)" }}
              >
                {settingsCareerEntry.tag}
              </div>
            )}

            {/* Level badge top-right */}
            {(currentProfile?.level ?? 0) > 0 && (
              <div className="absolute -top-1 -right-1 min-w-[1.4rem] h-[1.4rem] rounded-full bg-app-surface-2 border border-app-border-2 flex items-center justify-center text-[10px] font-bold text-white leading-none px-0.5">
                {currentProfile!.level}
              </div>
            )}
          </div>

          {/* Name / title card + upload action */}
          <div className="flex-1 min-w-0">
            <div className="bg-app-surface-2/80 border border-app-border-2/60 rounded-xl px-4 py-3 mb-3 shadow-sm">
              <p className="text-app-text font-semibold truncate leading-tight">
                {profileFullName || "\u2014"}
              </p>
              <p className="text-app-text-3 text-sm truncate leading-tight mt-0.5">
                {settingsProfileTitle}
              </p>
            </div>
            <button
              type="button"
              onClick={() => !photoUploading && photoInputRef.current?.click()}
              disabled={photoUploading}
              className="text-app-accent hover:opacity-80 disabled:text-app-text-5 text-xs transition-colors"
            >
              {photoUploading
                ? `Uploading… ${photoProgress}%`
                : profilePhotoURL
                ? "Change photo"
                : "Upload photo"}
            </button>
            {photoError && <p className="text-red-400 text-xs mt-1">{photoError}</p>}
          </div>

          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>
      </div>

      {/* ── Appearance (all users) ── */}
      <div className="bg-app-surface border border-app-border rounded-xl p-6 mb-6">
        <h2 className="text-base font-semibold text-app-text mb-1">Appearance</h2>
        <p className="text-app-text-4 text-xs mb-5">Customize your portal theme and text size.</p>

        {/* Theme picker */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-app-text-3 mb-2">Theme</label>
          <div className="inline-flex rounded-lg border border-app-border-2 overflow-hidden">
            {([
              { value: "light" as Theme, label: "Light", icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              )},
              { value: "dark" as Theme, label: "Dark", icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )},
              { value: "system" as Theme, label: "System", icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
                </svg>
              )},
            ] as const).map(({ value, label, icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition ${
                  theme === value
                    ? "bg-app-accent text-white"
                    : "bg-app-surface-2 border-app-border-2 text-app-text-3 hover:text-app-text"
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Text size picker */}
        <div>
          <label className="block text-xs font-medium text-app-text-3 mb-2">Text Size</label>
          <div className="inline-flex rounded-lg border border-app-border-2 overflow-hidden">
            {([
              { value: "sm" as TextSize, label: "Small", sizeClass: "text-xs" },
              { value: "base" as TextSize, label: "Default", sizeClass: "text-sm" },
              { value: "lg" as TextSize, label: "Large", sizeClass: "text-base" },
              { value: "xl" as TextSize, label: "Extra Large", sizeClass: "text-lg" },
            ] as const).map(({ value, label, sizeClass }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTextSize(value)}
                className={`flex items-center gap-1.5 px-4 py-2 font-medium transition ${
                  textSize === value
                    ? "bg-app-accent text-white"
                    : "bg-app-surface-2 border-app-border-2 text-app-text-3 hover:text-app-text"
                }`}
              >
                <span className={sizeClass}>Aa</span>
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Font family picker */}
        <div>
          <label className="block text-xs font-medium text-app-text-3 mb-2">Font</label>
          <div className="inline-flex rounded-lg border border-app-border-2 overflow-hidden">
            {([
              { value: "geist" as const, label: "Geist Sans", sample: "var(--font-geist-sans, sans-serif)" },
              { value: "inter" as const, label: "Inter", sample: "'Inter', sans-serif" },
              { value: "system" as const, label: "System", sample: "ui-sans-serif, system-ui" },
              { value: "mono" as const, label: "Mono", sample: "var(--font-geist-mono, monospace)" },
            ]).map(({ value, label, sample }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFontFamily(value)}
                className={`flex flex-col items-center gap-0.5 px-4 py-2 font-medium transition ${
                  fontFamily === value
                    ? "bg-app-accent text-white"
                    : "bg-app-surface-2 border-app-border-2 text-app-text-3 hover:text-app-text"
                }`}
              >
                <span className="text-sm" style={{ fontFamily: sample }}>Ag</span>
                <span className="text-[0.5625rem]">{label}</span>
              </button>
            ))}
          </div>
          <p className="text-app-text-5 text-[0.625rem] mt-1.5">Geist Sans by Vercel is the default typeface.</p>
        </div>

      </div>

      {/* ── Dev-only Color System Reference ── */}
      {isDeveloperUser && (
        <div className="bg-app-surface border border-app-border rounded-xl p-6 mb-6">
          <h2 className="text-base font-semibold text-app-text mb-1">Color System Reference</h2>
          <p className="text-app-text-4 text-xs mb-5">
            SwiftUI-inspired color tokens. Values adapt to light/dark mode automatically.
          </p>

          {[
            {
              title: "System Colors",
              colors: [
                { name: "sys-red", label: "Red" },
                { name: "sys-orange", label: "Orange" },
                { name: "sys-yellow", label: "Yellow" },
                { name: "sys-green", label: "Green" },
                { name: "sys-mint", label: "Mint" },
                { name: "sys-teal", label: "Teal" },
                { name: "sys-cyan", label: "Cyan" },
                { name: "sys-blue", label: "Blue" },
                { name: "sys-indigo", label: "Indigo" },
                { name: "sys-purple", label: "Purple" },
                { name: "sys-pink", label: "Pink" },
                { name: "sys-brown", label: "Brown" },
              ],
            },
            {
              title: "Gray Scale",
              colors: [
                { name: "sys-gray", label: "Gray" },
                { name: "sys-gray2", label: "Gray 2" },
                { name: "sys-gray3", label: "Gray 3" },
                { name: "sys-gray4", label: "Gray 4" },
                { name: "sys-gray5", label: "Gray 5" },
                { name: "sys-gray6", label: "Gray 6" },
              ],
            },
            {
              title: "Labels",
              colors: [
                { name: "sys-label", label: "Label" },
                { name: "sys-secondary-label", label: "Secondary" },
                { name: "sys-tertiary-label", label: "Tertiary" },
                { name: "sys-quaternary-label", label: "Quaternary" },
              ],
            },
            {
              title: "Fills",
              colors: [
                { name: "sys-fill", label: "Fill" },
                { name: "sys-secondary-fill", label: "Secondary" },
                { name: "sys-tertiary-fill", label: "Tertiary" },
                { name: "sys-quaternary-fill", label: "Quaternary" },
              ],
            },
            {
              title: "Backgrounds",
              colors: [
                { name: "sys-bg", label: "Primary" },
                { name: "sys-secondary-bg", label: "Secondary" },
                { name: "sys-tertiary-bg", label: "Tertiary" },
              ],
            },
            {
              title: "Grouped Backgrounds",
              colors: [
                { name: "sys-grouped-bg", label: "Primary" },
                { name: "sys-secondary-grouped-bg", label: "Secondary" },
                { name: "sys-tertiary-grouped-bg", label: "Tertiary" },
              ],
            },
            {
              title: "Separators",
              colors: [
                { name: "sys-separator", label: "Separator" },
                { name: "sys-opaque-separator", label: "Opaque" },
              ],
            },
            {
              title: "App Theme Colors",
              colors: [
                { name: "bg", label: "Background" },
                { name: "surface", label: "Surface" },
                { name: "surface-2", label: "Surface 2" },
                { name: "border", label: "Border" },
                { name: "border-2", label: "Border 2" },
                { name: "text", label: "Text" },
                { name: "text-2", label: "Text 2" },
                { name: "text-3", label: "Text 3" },
                { name: "text-4", label: "Text 4" },
                { name: "text-5", label: "Text 5" },
                { name: "accent", label: "Accent" },
                { name: "accent-hover", label: "Accent Hover" },
                { name: "success", label: "Success" },
                { name: "success-soft", label: "Success Soft" },
                { name: "warning", label: "Warning" },
                { name: "warning-soft", label: "Warning Soft" },
                { name: "danger", label: "Danger" },
                { name: "danger-soft", label: "Danger Soft" },
              ],
            },
          ].map((group) => (
            <div key={group.title} className="mb-5 last:mb-0">
              <h3 className="text-xs font-semibold text-app-text-3 mb-2 uppercase tracking-wider">
                {group.title}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {group.colors.map(({ name, label }) => (
                  <div key={name} className="flex items-center gap-2 p-2 rounded-lg bg-app-surface-2/60">
                    <div
                      className="w-8 h-8 rounded-md border border-app-border-2 shrink-0"
                      style={{ backgroundColor: `var(--app-${name})` }}
                    />
                    <div className="min-w-0">
                      <p className="text-[0.625rem] font-medium text-app-text truncate">{label}</p>
                      <p className="text-[0.5625rem] font-mono text-app-text-4 truncate">--app-{name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Signature on File ── */}
      <div className="bg-app-surface border border-app-border rounded-xl p-6 mb-6">
        <h2 className="text-base font-semibold text-app-text mb-1">Signature</h2>
        <p className="text-app-text-4 text-xs mb-4">Your electronic signature used for agreements and documents.</p>

        {signatureOnFile && (
          <div className="mb-4">
            <p className="text-xs font-medium text-app-text-3 mb-2">Current signature on file:</p>
            <div className="bg-white rounded-lg border border-app-border-2 p-3 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={signatureOnFile} alt="Signature" style={{ height: "3rem", width: "auto" }} />
            </div>
          </div>
        )}

        <SignaturePad
          name={currentProfile ? `${currentProfile.firstName} ${currentProfile.lastName}` : ""}
          onSignature={async (dataUrl) => {
            if (!adminUid) return;
            setSignatureSaving(true);
            try {
              await setDoc(doc(db, "users", adminUid, "settings", "signature"), {
                dataUrl,
                updatedAt: serverTimestamp(),
              });
              setSignatureOnFile(dataUrl);
            } catch { /* ignore */ }
            setSignatureSaving(false);
          }}
        />
        {signatureSaving && <p className="text-app-accent text-xs mt-2">Saving...</p>}
      </div>

      {/* ── Team Captain: rename own team ── */}
      {!isAdmin && currentProfile?.role === "manager" && currentProfile.teamNumber > 0 && (
        <div className="bg-app-surface border border-app-border rounded-xl p-6 mb-6">
          <h2 className="text-base font-semibold text-app-text mb-1">Team Name</h2>
          <p className="text-app-text-4 text-xs mb-4">Give your team a name that shows on the leaderboard and dashboard.</p>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={editingTeamName === currentProfile.teamNumber ? teamNameDraft : (teamNames[String(currentProfile.teamNumber)] ?? "")}
              onFocus={() => { setEditingTeamName(currentProfile.teamNumber); setTeamNameDraft(teamNames[String(currentProfile.teamNumber)] ?? ""); }}
              onChange={(e) => setTeamNameDraft(e.target.value)}
              onBlur={() => saveTeamName(currentProfile.teamNumber, teamNameDraft)}
              onKeyDown={(e) => { if (e.key === "Enter") saveTeamName(currentProfile.teamNumber, teamNameDraft); }}
              placeholder={`Team ${currentProfile.teamNumber}`}
              maxLength={30}
              className="flex-1 px-3 py-2 bg-app-surface-2 border border-app-border-2 rounded-lg text-app-text text-sm focus:outline-none focus:ring-2 focus:ring-app-accent"
            />
            <span className="text-app-text-5 text-xs font-mono shrink-0">Team {currentProfile.teamNumber}</span>
          </div>
        </div>
      )}

      {/* ── Manager: Team Roster + TL Promotion ── */}
      {!isAdmin && currentProfile?.role === "manager" && managerTeamUsers.length > 0 && (
        <div className="bg-app-surface border border-app-border rounded-xl p-6 mb-6">
          <h2 className="text-base font-semibold text-app-text mb-1">Team Roster</h2>
          <p className="text-app-text-4 text-xs mb-4">Promote a rep to Team Lead. Requires an insurance license on file.</p>
          {promotionMsg && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-4 ${
              promotionMsg.type === "success"
                ? "bg-green-900/30 border border-green-700/40 text-green-400"
                : "bg-red-900/30 border border-red-700/40 text-red-400"
            }`}>
              {promotionMsg.text}
              <button type="button" onClick={() => setPromotionMsg(null)} className="ml-auto text-current opacity-60 hover:opacity-100">✕</button>
            </div>
          )}
          <div className="space-y-2">
            {managerTeamUsers.map(u => (
              <div key={u.uid} className="flex items-center gap-3 px-3 py-2.5 bg-app-surface-2/50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-app-text text-sm font-medium truncate">{u.firstName} {u.lastName}</p>
                  <p className="text-app-text-4 text-xs">{u.role === "manager" ? "Team Captain" : u.subRole === "TL" ? "Team Lead \u2713" : "Rep"}</p>
                </div>
                {u.role === "rep" && !u.subRole && (
                  <button
                    type="button"
                    onClick={() => promoteToTL(u.uid)}
                    disabled={promotingUid === u.uid}
                    className="shrink-0 px-3 py-1.5 bg-app-accent/20 hover:bg-app-accent/40 border border-app-accent/40 text-app-accent text-xs font-semibold rounded-lg transition disabled:opacity-50"
                  >
                    {promotingUid === u.uid ? "Checking…" : "Promote to TL"}
                  </button>
                )}
                {u.subRole === "TL" && (
                  <span className="shrink-0 px-2.5 py-1 bg-purple-900/30 border border-purple-700/40 text-purple-400 text-xs font-semibold rounded-lg">
                    Team Lead
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Owner/Dev-only sections ── */}
      {(currentProfile?.role === "owner" || currentProfile?.role === "developer") && <>

      {/* ── Environment / Phase ── */}
      <div className="mt-6 bg-app-surface border border-app-border rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-semibold text-app-text">Environment</h2>
            <p className="text-app-text-4 text-xs mt-0.5">Controls which features are visible across the portal.</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${
            phase === "live"     ? "bg-green-500/15 text-green-400 border-green-500/30" :
            phase === "merging"  ? "bg-amber-500/15 text-amber-400 border-amber-500/30" :
                                   "bg-red-500/15 text-red-400 border-red-500/30"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${phase === "live" ? "bg-green-400" : phase === "merging" ? "bg-amber-400" : "bg-red-400"}`} />
            {phase === "live" ? "Live" : phase === "merging" ? "Merging" : "Testing"}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(["testing", "merging", "live"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => savePhase(p)}
              className={`px-3 py-2.5 rounded-lg text-sm font-semibold border transition ${
                phase === p
                  ? p === "live"    ? "bg-green-600 border-green-500 text-white" :
                    p === "merging" ? "bg-amber-600 border-amber-500 text-white" :
                                      "bg-red-700 border-red-600 text-white"
                  : "bg-app-surface-2 border-app-border-2 text-app-text-3 hover:text-app-text hover:border-app-border-2"
              }`}
            >
              {p === "testing" ? "Testing" : p === "merging" ? "Merging" : "Live"}
            </button>
          ))}
        </div>
        <div className="mt-3 text-xs text-app-text-4 space-y-1.5">
          <p><span className="text-red-400 font-semibold">Testing</span> — all features visible including Reset All Claims</p>
          <p><span className="text-amber-400 font-semibold">Merging</span> — Verify menu + CSV import shown; Reset All Claims hidden</p>
          <p><span className="text-green-400 font-semibold">Live</span> — Verify menu, CSV import, and Reset All Claims are hidden</p>
        </div>
      </div>

      {/* ── Team Manager ── */}
      <div className="mt-6 bg-app-surface border border-app-border rounded-xl p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-app-text">Team Manager</h2>
          <p className="text-app-text-4 text-xs mt-0.5">Set the number of active teams and assign a color to each.</p>
        </div>

        {/* Team count stepper */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm text-app-text-3 w-36 shrink-0">Number of Teams</span>
          <button
            type="button"
            onClick={() => setTeamCount(c => Math.max(1, c - 1))}
            disabled={teamCount <= 1}
            className="w-7 h-7 rounded-lg bg-app-surface-2 border border-app-border-2 text-app-text flex items-center justify-center hover:bg-app-surface-2 disabled:opacity-30 disabled:cursor-not-allowed transition text-base leading-none"
          >{"\u2212"}</button>
          <span className="text-app-text font-semibold text-sm w-6 text-center">{teamCount}</span>
          <button
            type="button"
            onClick={() => setTeamCount(c => Math.min(10, c + 1))}
            disabled={teamCount >= 10}
            className="w-7 h-7 rounded-lg bg-app-surface-2 border border-app-border-2 text-app-text flex items-center justify-center hover:bg-app-surface-2 disabled:opacity-30 disabled:cursor-not-allowed transition text-base leading-none"
          >+</button>
        </div>

        {/* Per-team color rows */}
        <div className="space-y-3 mb-5">
          {Array.from({ length: teamCount }, (_, i) => i + 1).map(n => {
            const hex = colorsDraft[n] ?? DEFAULT_TEAM_COLORS[((n - 1) % 10) + 1];
            const name = teamNames[String(n)];
            return (
              <div key={n} className="flex items-center gap-3">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: hex }}
                />
                <span className="text-sm text-app-text-2 w-16 shrink-0">Team {n}</span>
                {name && (
                  <span className="text-xs text-app-text-4 flex-1 truncate">{name}</span>
                )}
                {!name && <span className="flex-1" />}
                <input
                  type="color"
                  value={hex}
                  onChange={e => setColorsDraft(d => ({ ...d, [n]: e.target.value }))}
                  className="w-8 h-8 rounded cursor-pointer border border-app-border-2 bg-transparent p-0.5"
                  title={`Team ${n} color`}
                />
                <span className="text-xs text-app-text-5 font-mono w-16">{hex}</span>
              </div>
            );
          })}
        </div>

        {colorsError && <p className="text-red-400 text-xs mb-3">{colorsError}</p>}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={saveTeamManager}
            disabled={colorsSaving}
            className="px-5 py-2 bg-app-accent hover:bg-app-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition flex items-center gap-2"
          >
            {colorsSaving && <Spinner className="w-4 h-4" />}
            {colorsSaving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* ── Chat Feature Toggle ── */}
      <div className="mt-6 bg-app-surface border border-app-border rounded-xl p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-app-text-3 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
            <div>
              <h2 className="text-base font-semibold text-app-text">Chat</h2>
              <p className="text-app-text-3 text-sm mt-1">
                Show the Chat nav item for all users. When disabled, the chat page is still accessible by direct URL but hidden from navigation.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleChat}
            disabled={chatEnableSaving}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-app-accent focus:ring-offset-2 focus:ring-offset-app-surface disabled:opacity-50 ${chatEnabled ? "bg-app-accent" : "bg-app-surface-2"}`}
            role="switch"
            aria-checked={chatEnabled}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${chatEnabled ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>
      </div>

      {/* ── Reset All Claims (Testing only) ── */}
      {phase === "testing" && <div className="mt-6 bg-app-surface border border-red-900/40 rounded-xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <div>
            <h2 className="text-base font-semibold text-app-text">Reset All Claims</h2>
            <p className="text-app-text-3 text-sm mt-1">
              Marks every claimed client as <span className="font-mono text-amber-400">pending:contractorId</span> so
              reps can verify and claim their own records through the Records page on Integration Monday.
              No data is deleted — only the agent link is reset.
            </p>
          </div>
        </div>

        {/* Success result */}
        {resetResult && (
          <div className="flex items-center gap-3 px-4 py-3 bg-green-900/20 border border-green-700/40 rounded-lg mb-4">
            <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-green-300 text-sm">
              Done — <span className="font-semibold">{resetResult.updated}</span> client{resetResult.updated !== 1 ? "s" : ""} reset to pending.
              {resetResult.skipped > 0 && (
                <span className="text-green-400/70"> ({resetResult.skipped} already pending, skipped.)</span>
              )}
            </p>
          </div>
        )}

        {resetError && (
          <p className="text-red-400 text-sm mb-4">{resetError}</p>
        )}

        {!resetConfirm ? (
          <button
            type="button"
            onClick={() => { setResetConfirm(true); setResetResult(null); setResetError(""); }}
            className="flex items-center gap-2 px-4 py-2 bg-red-900/40 hover:bg-red-900/60 border border-red-700/50 rounded-lg text-red-300 text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Reset All Claims
          </button>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-red-300 text-sm font-medium">
              This will unclaim all currently claimed clients. Continue?
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setResetConfirm(false)}
                disabled={resetRunning}
                className="px-3 py-1.5 text-sm text-app-text-3 hover:text-app-text transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={resetAllClaims}
                disabled={resetRunning}
                className="flex items-center gap-2 px-4 py-1.5 bg-red-700 hover:bg-red-600 disabled:bg-red-900 disabled:cursor-not-allowed rounded-lg text-white text-sm font-bold transition-colors"
              >
                {resetRunning ? (
                  <>
                    <Spinner className="w-3.5 h-3.5" />
                    Resetting…
                  </>
                ) : "Yes, Reset All"}
              </button>
            </div>
          </div>
        )}
      </div>} {/* end Testing-only Reset All Claims */}

      {/* ── Terms & Conditions (owner only) ── */}
      {(currentProfile?.role === "owner" || currentProfile?.role === "developer") && (
        <div className="mt-6 bg-app-surface border border-app-border rounded-xl p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-app-text">Terms & Conditions</h2>
            <p className="text-app-text-4 text-xs mt-0.5">
              Edit and publish terms. Saving bumps the version and prompts all users to re-accept on next login.
              {termsVersion > 0 && <span className="ml-2 text-app-text-5">Current version: {termsVersion}</span>}
            </p>
          </div>
          <RichTextEditor content={termsHtml} onChange={setTermsHtml} />
          <div className="flex items-center gap-3 mt-4">
            <button
              type="button"
              disabled={termsSaving}
              onClick={async () => {
                setTermsSaving(true);
                setTermsSaved(false);
                try {
                  const newVersion = termsVersion + 1;
                  await setDoc(doc(db, "settings", "terms"), {
                    html: termsHtml,
                    version: newVersion,
                    updatedAt: serverTimestamp(),
                    updatedBy: adminUid,
                    updatedByName: `${currentProfile?.firstName} ${currentProfile?.lastName}`,
                  });
                  setTermsVersion(newVersion);
                  setTermsSaved(true);
                  setTimeout(() => setTermsSaved(false), 3000);
                } catch { /* ignore */ } finally {
                  setTermsSaving(false);
                }
              }}
              className="px-5 py-2 bg-app-accent hover:bg-app-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition flex items-center gap-2"
            >
              {termsSaving ? <><Spinner className="w-3.5 h-3.5" /> Saving...</> : "Save & Publish"}
            </button>
            {termsSaved && (
              <span className="text-green-400 text-xs font-medium">Published as version {termsVersion}</span>
            )}
          </div>
        </div>
      )}

      </> /* end admin-only */}

      {/* Profile photo crop modal */}
      {cropFile && (
        <CropModal
          file={cropFile}
          onCrop={handleProfileCropApply}
          onCancel={() => setCropFile(null)}
        />
      )}
    </div>
  );
}
