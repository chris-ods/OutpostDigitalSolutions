"use client";

import { useState, useRef, useEffect } from "react";
import { collection, addDoc, serverTimestamp, getDoc, doc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { BrandLogo } from "../../lib/components/BrandLogo";
import Link from "next/link";
import CropModal from "../../components/CropModal";

/** Convert a Blob to a base64 data URL. */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("FileReader failed"));
    reader.readAsDataURL(blob);
  });
}

function formatPhoneDisplay(digits: string): string {
  const d = digits.slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

function toE164(digits: string): string {
  return `+1${digits}`;
}

function stripDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

export default function JoinPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneDigits: "",
    comments: "",
  });

  const [teamCount, setTeamCount] = useState(4);
  const [selectedTeam, setSelectedTeam] = useState(0);

  // Load team count from settings on mount
  useEffect(() => {
    getDoc(doc(db, "settings", "teamConfig"))
      .then((snap) => { if (snap.exists()) setTeamCount(snap.data().teamCount ?? 4); })
      .catch(() => {});
  }, []);

  const [phoneDisplay, setPhoneDisplay] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Photo picker state
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoBlob,    setPhotoBlob]    = useState<Blob | null>(null);
  const [cropFile,     setCropFile]     = useState<File | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = stripDigits(e.target.value);
    setForm((f) => ({ ...f, phoneDigits: digits }));
    setPhoneDisplay(formatPhoneDisplay(digits));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setCropFile(file);
    e.target.value = "";
  };

  const handleCropApply = (blob: Blob) => {
    if (photoPreview.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    setPhotoBlob(blob);
    setPhotoPreview(URL.createObjectURL(blob));
    setCropFile(null);
  };

  const clearPhoto = () => {
    if (photoPreview.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    setPhotoPreview("");
    setPhotoBlob(null);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "Required.";
    if (!form.lastName.trim()) e.lastName = "Required.";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Valid email required.";
    if (form.phoneDigits.length !== 10) e.phone = "Enter a valid 10-digit US number.";
    if (selectedTeam === 0) e.team = "Please select your team.";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    setErrors({});

    try {
      // Convert cropped photo blob to base64 for storage with the request (no auth required)
      let photoDataURL = "";
      if (photoBlob) {
        try { photoDataURL = await blobToBase64(photoBlob); } catch { /* non-critical */ }
      }

      const docData: Record<string, unknown> = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: toE164(form.phoneDigits),
        teamNumber: selectedTeam,
        comments: form.comments.trim(),
        status: "pending",
        submittedAt: serverTimestamp(),
      };
      if (photoDataURL) docData.photoDataURL = photoDataURL;

      await addDoc(collection(db, "onboardingRequests"), docData);
      setSubmitted(true);
    } catch {
      setErrors({ submit: "Something went wrong. Please try again." });
      setSubmitting(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-2.5 bg-app-surface-2 border rounded-lg text-app-text placeholder-app-text-4 focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent transition text-sm ${
      errors[field] ? "border-red-500" : "border-app-border-2"
    }`;

  if (submitted) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="flex justify-center mb-6">
            <BrandLogo width={220} height={78} priority />
          </div>
          <div className="bg-app-surface border border-app-border rounded-2xl p-8">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-green-900/40 border border-green-800 flex items-center justify-center">
                <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-app-text font-bold text-lg mb-2">Request Submitted</h2>
            <p className="text-app-text-3 text-sm">
              Your request has been sent to an admin for review. Once approved you&apos;ll receive an email to set up your password and sign in.
            </p>
            <Link href="/login" className="mt-6 block text-app-accent hover:opacity-80 text-sm transition">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <BrandLogo width={240} height={85} priority />
        </div>

        <div className="bg-app-surface border border-app-border rounded-2xl p-8 shadow-xl">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-app-text">Request to Join</h1>
            <p className="text-app-text-3 text-sm mt-1">Fill out your info and an admin will approve your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* ── Profile Photo ── */}
            <div className="flex flex-col items-center gap-2 pb-1">
              <p className="text-sm font-medium text-app-text-2">
                Profile Photo{" "}
                <span className="text-app-text-5 text-xs font-normal">(optional)</span>
              </p>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="relative w-20 h-20 rounded-full group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-20 h-20 rounded-full object-cover ring-2 ring-app-text-5"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-app-surface-2 border-2 border-dashed border-app-text-5 flex flex-col items-center justify-center gap-1 text-app-text-4 group-hover:border-app-text-3 group-hover:text-app-text-3 transition-colors">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                      </svg>
                      <span className="text-xs leading-none">Add Photo</span>
                    </div>
                  )}
                  {photoPreview && (
                    <div className="absolute inset-0 rounded-full bg-black/55 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                      </svg>
                    </div>
                  )}
                </button>

                {/* Remove button */}
                {photoPreview && (
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-app-surface-2 hover:bg-red-900 border border-app-text-5 hover:border-red-700 flex items-center justify-center transition-colors"
                    title="Remove photo"
                  >
                    <svg className="w-2.5 h-2.5 text-app-text-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-app-text-2 mb-1.5">First Name <span className="text-red-400">*</span></label>
                <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  placeholder="First" className={inputClass("firstName")} />
                {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-app-text-2 mb-1.5">Last Name <span className="text-red-400">*</span></label>
                <input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  placeholder="Last" className={inputClass("lastName")} />
                {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-app-text-2 mb-1.5">Email <span className="text-red-400">*</span></label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="your@email.com" className={inputClass("email")} />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-app-text-2 mb-1.5">Phone <span className="text-red-400">*</span></label>
              <input type="tel" value={phoneDisplay} onChange={handlePhoneChange}
                placeholder="(555) 000-0000" inputMode="numeric" className={inputClass("phone")} />
              {errors.phone
                ? <p className="text-red-400 text-xs mt-1">{errors.phone}</p>
                : form.phoneDigits.length === 10 && (
                  <p className="text-app-text-5 text-xs mt-1 font-mono">{toE164(form.phoneDigits)}</p>
                )}
            </div>

            {/* Team */}
            <div>
              <label className="block text-sm font-medium text-app-text-2 mb-1.5">
                Team <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedTeam || ""}
                onChange={(e) => {
                  setSelectedTeam(Number(e.target.value));
                  setErrors((prev) => { const n = { ...prev }; delete n.team; return n; });
                }}
                className={`w-full px-4 py-2.5 bg-app-surface-2 border rounded-lg text-app-text text-sm focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent transition appearance-none ${errors.team ? "border-red-500" : "border-app-border-2"}`}
              >
                <option value="" disabled className="text-app-text-4">Select your team...</option>
                {Array.from({ length: teamCount }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>Team {n}</option>
                ))}
              </select>
              {errors.team && <p className="text-red-400 text-xs mt-1">{errors.team}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-app-text-2 mb-1.5">
                About You <span className="text-app-text-5 text-xs font-normal">(optional)</span>
              </label>
              <textarea value={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.value })}
                placeholder="Tell us a bit about yourself..." rows={3}
                className="w-full px-4 py-2.5 bg-app-surface-2 border border-app-border-2 rounded-lg text-app-text text-sm placeholder-app-text-4 focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent transition resize-none" />
            </div>

            {errors.submit && (
              <div className="px-3 py-2.5 bg-red-950 border border-red-800 rounded-lg text-red-400 text-sm">
                {errors.submit}
              </div>
            )}

            <button type="submit" disabled={submitting}
              className="w-full py-2.5 bg-app-accent hover:bg-app-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition text-sm">
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Submitting...
                </span>
              ) : "Submit Request"}
            </button>
          </form>
        </div>

        <p className="text-center text-app-text-5 text-xs mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-app-accent hover:opacity-80">Sign in</Link>
        </p>
      </div>
      {cropFile && (
        <CropModal
          file={cropFile}
          onCrop={handleCropApply}
          onCancel={() => setCropFile(null)}
        />
      )}
    </div>
  );
}
