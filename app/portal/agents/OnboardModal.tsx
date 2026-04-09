"use client";

import { useState } from "react";
import {
  collection, doc, setDoc, addDoc, serverTimestamp,
} from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "../../../lib/firebase";
import { UserProfile } from "../../../lib/types";
import { Spinner } from "../../../lib/components/Spinner";
import { AgentRow } from "./columns";
import { licenseStatus } from "./AgentDetailPanel";

const US_STATES = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" }, { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" }, { code: "CO", name: "Colorado" }, { code: "CT", name: "Connecticut" }, { code: "DC", name: "District of Columbia" },
  { code: "DE", name: "Delaware" }, { code: "FL", name: "Florida" }, { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" }, { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" }, { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" }, { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" }, { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" }, { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" }, { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" }, { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" }, { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" }, { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" }, { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" }, { code: "DC", name: "District of Columbia" },
];

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OnboardModalProps {
  open: boolean;
  onClose: () => void;
  onAgentCreated: (agent: AgentRow) => void;
  teamCount: number;
  isOwnerOrDev: boolean;
}

// ── Blank form states ─────────────────────────────────────────────────────────

const blankBasic = { firstName: "", lastName: "", email: "", phone: "", role: "rep" as string, teamNumber: 1, contractorId: "" };
const blankIdent = { dob: "", ssn: "", npnPersonal: "", npnBusiness: "", ein: "", address: "", notes: "" };
const blankCred  = { platform: "", link: "", username: "", password: "", notes: "" };
const blankWn    = { carrier: "", individualNumber: "", agencyNumber: "", notes: "" };
const blankLic   = { stateCode: "", state: "", individualLicense: "", individualExpiry: "", agencyLicense: "", agencyExpiry: "" };

// ── Helpers ───────────────────────────────────────────────────────────────────

function generatePassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// ── Component ────────────────────────────────────────────────────────────────

export default function OnboardModal({ open, onClose, onAgentCreated, teamCount, isOwnerOrDev }: OnboardModalProps) {
  const [obSaving, setObSaving] = useState(false);
  const [obError,  setObError]  = useState("");
  const [obBasic,  setObBasic]  = useState({ ...blankBasic });
  const [obIdent,  setObIdent]  = useState({ ...blankIdent });
  const [obCreds,  setObCreds]  = useState<typeof blankCred[]>([]);
  const [obWns,    setObWns]    = useState<typeof blankWn[]>([]);
  const [obLics,   setObLics]   = useState<typeof blankLic[]>([]);

  if (!open) return null;

  const resetAndClose = () => {
    setObBasic({ ...blankBasic }); setObIdent({ ...blankIdent });
    setObCreds([]); setObWns([]); setObLics([]);
    setObError("");
    onClose();
  };

  const submitOnboard = async () => {
    if (!obBasic.firstName.trim() || !obBasic.lastName.trim() || !obBasic.email.trim()) {
      setObError("First name, last name, and email are required."); return;
    }
    setObSaving(true); setObError("");
    try {
      const password = generatePassword();
      const apiKey   = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
        { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: obBasic.email.trim(), password, returnSecureToken: true }) }
      );
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error?.message ?? "Failed to create account.";
        throw new Error(msg === "EMAIL_EXISTS" ? "This email is already registered." : msg);
      }
      const newUid: string = data.localId;

      // User document
      const userDoc: Record<string, unknown> = {
        firstName:    obBasic.firstName.trim(),
        lastName:     obBasic.lastName.trim(),
        email:        obBasic.email.trim(),
        phone:        obBasic.phone.trim(),
        role:         obBasic.role,
        subRole:      "",
        teamNumber:   obBasic.teamNumber,
        contractorId: obBasic.contractorId.trim(),
        active:       true,
        photoURL:     "",
        comments:     "",
        createdAt:    serverTimestamp(),
        mustChangePassword: false,
        level:        1,
        companyRole:  "",
        npnPersonal:  obIdent.npnPersonal.trim(),
        hideFromPayroll: false,
        acceptedTermsVersion: 0,
        acceptedTermsAt: null,
        onboardingPacketSigned: false,
        onboardingSignedAt: null,
      };
      await setDoc(doc(db, "users", newUid), userDoc);

      // Identity / secrets (encrypted via API)
      const identData: Record<string, string> = {};
      if (obIdent.dob.trim())         identData.dob         = obIdent.dob.trim();
      if (obIdent.ssn.trim())         identData.ssn         = obIdent.ssn.trim();
      if (obIdent.npnPersonal.trim()) identData.npnPersonal = obIdent.npnPersonal.trim();
      if (obIdent.npnBusiness.trim()) identData.npnBusiness = obIdent.npnBusiness.trim();
      if (obIdent.ein.trim())         identData.ein         = obIdent.ein.trim();
      if (obIdent.address.trim())     identData.address     = obIdent.address.trim();
      if (obIdent.notes.trim())       identData.notes       = obIdent.notes.trim();
      if (Object.keys(identData).length > 0) {
        await fetch("/api/admin/secrets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: newUid, type: "identity", callerUid: newUid, data: identData }),
        });
      }

      // Credentials
      for (const c of obCreds) {
        if (!c.platform.trim()) continue;
        const d: Record<string, string> = { platform: c.platform.trim(), username: c.username.trim(), password: c.password.trim() };
        if (c.link.trim())  d.link  = c.link.trim();
        if (c.notes.trim()) d.notes = c.notes.trim();
        await addDoc(collection(db, "users", newUid, "credentials"), d);
      }

      // Writing numbers
      for (const w of obWns) {
        if (!w.carrier.trim() || !w.individualNumber.trim()) continue;
        const d: Record<string, string> = { carrier: w.carrier.trim(), individualNumber: w.individualNumber.trim() };
        if (w.agencyNumber.trim()) d.agencyNumber = w.agencyNumber.trim();
        if (w.notes.trim())        d.notes        = w.notes.trim();
        await addDoc(collection(db, "users", newUid, "writingNumbers"), d);
      }

      // State licenses
      let alertCount = 0; let hasExpired = false;
      for (const l of obLics) {
        if (!l.stateCode || !l.individualLicense.trim()) continue;
        const stateObj = US_STATES.find(s => s.code === l.stateCode);
        const d: Record<string, string> = {
          state: stateObj?.name ?? l.stateCode, stateCode: l.stateCode,
          individualLicense: l.individualLicense.trim(), individualExpiry: l.individualExpiry,
        };
        if (l.agencyLicense.trim()) d.agencyLicense = l.agencyLicense.trim();
        if (l.agencyExpiry)         d.agencyExpiry  = l.agencyExpiry;
        await addDoc(collection(db, "users", newUid, "stateLicenses"), d);
        const s = licenseStatus(l.individualExpiry);
        if (s === "expired" || s === "warning") { alertCount++; if (s === "expired") hasExpired = true; }
      }
      if (alertCount > 0) await setDoc(doc(db, "users", newUid), { licenseAlertCount: alertCount, hasExpiredLicense: hasExpired }, { merge: true });

      await sendPasswordResetEmail(auth, obBasic.email.trim());

      // Build the new agent row and notify parent
      const newAgent: AgentRow = {
        uid: newUid, firstName: obBasic.firstName.trim(), lastName: obBasic.lastName.trim(),
        email: obBasic.email.trim(), phone: obBasic.phone.trim(),
        role: obBasic.role as UserProfile["role"], teamNumber: obBasic.teamNumber,
        contractorId: obBasic.contractorId.trim(), active: true, photoURL: "",
        comments: "", createdAt: undefined as unknown as UserProfile["createdAt"],
        subRole: "", hideFromPayroll: false, mustChangePassword: false,
        level: 0, companyRole: "", npnPersonal: obIdent.npnPersonal.trim(),
        acceptedTermsVersion: 0, acceptedTermsAt: null,
        onboardingPacketSigned: false, onboardingSignedAt: null, birthday: "",
      };
      onAgentCreated(newAgent);
      resetAndClose();
    } catch (err) {
      setObError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setObSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={() => !obSaving && resetAndClose()}/>
      <div className="relative bg-app-surface border border-app-border-2 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-app-border shrink-0">
          <div>
            <h3 className="text-app-text font-semibold text-lg">Onboard Agent</h3>
            <p className="text-app-text-4 text-xs mt-0.5">Creates Firebase account and seeds all data in one step.</p>
          </div>
          <button type="button" onClick={resetAndClose} disabled={obSaving} className="text-app-text-4 hover:text-app-text transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-8">

          {/* Basic Info */}
          <section>
            <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-app-accent mb-3">Basic Info</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[0.625rem] font-medium text-app-text-4 mb-1">First Name *</label>
                <input type="text" value={obBasic.firstName} onChange={e => setObBasic(p => ({ ...p, firstName: e.target.value }))}
                  className="w-full px-3 py-2 bg-app-surface-2 border border-app-border-2 rounded-lg text-app-text text-sm focus:outline-none focus:ring-2 focus:ring-app-accent"/>
              </div>
              <div>
                <label className="block text-[0.625rem] font-medium text-app-text-4 mb-1">Last Name *</label>
                <input type="text" value={obBasic.lastName} onChange={e => setObBasic(p => ({ ...p, lastName: e.target.value }))}
                  className="w-full px-3 py-2 bg-app-surface-2 border border-app-border-2 rounded-lg text-app-text text-sm focus:outline-none focus:ring-2 focus:ring-app-accent"/>
              </div>
              <div>
                <label className="block text-[0.625rem] font-medium text-app-text-4 mb-1">Email *</label>
                <input type="email" value={obBasic.email} onChange={e => setObBasic(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2 bg-app-surface-2 border border-app-border-2 rounded-lg text-app-text text-sm focus:outline-none focus:ring-2 focus:ring-app-accent"/>
              </div>
              <div>
                <label className="block text-[0.625rem] font-medium text-app-text-4 mb-1">Phone</label>
                <input type="tel" value={obBasic.phone} onChange={e => setObBasic(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3 py-2 bg-app-surface-2 border border-app-border-2 rounded-lg text-app-text text-sm focus:outline-none focus:ring-2 focus:ring-app-accent"/>
              </div>
              <div>
                <label className="block text-[0.625rem] font-medium text-app-text-4 mb-1">Role</label>
                <select value={obBasic.role} onChange={e => setObBasic(p => ({ ...p, role: e.target.value }))}
                  className="w-full px-3 py-2 bg-app-surface-2 border border-app-border-2 rounded-lg text-app-text text-sm focus:outline-none focus:ring-2 focus:ring-app-accent">
                  <option value="rep">CSR (Rep)</option>
                  <option value="manager">TC/TL (Manager)</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-[0.625rem] font-medium text-app-text-4 mb-1">Team</label>
                <input type="number" min={0} value={obBasic.teamNumber} onChange={e => setObBasic(p => ({ ...p, teamNumber: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-app-surface-2 border border-app-border-2 rounded-lg text-app-text text-sm focus:outline-none focus:ring-2 focus:ring-app-accent"/>
              </div>
              <div className="col-span-2">
                <label className="block text-[0.625rem] font-medium text-app-text-4 mb-1">Contractor ID</label>
                <input type="text" value={obBasic.contractorId} onChange={e => setObBasic(p => ({ ...p, contractorId: e.target.value }))}
                  className="w-full px-3 py-2 bg-app-surface-2 border border-app-border-2 rounded-lg text-app-text text-sm focus:outline-none focus:ring-2 focus:ring-app-accent"/>
              </div>
            </div>
          </section>

          {/* Identity */}
          <section>
            <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-amber-400 mb-3">
              <svg className="w-3 h-3 inline mr-1 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>
              Identity (Admin Only)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[0.625rem] font-medium text-app-text-4 mb-1">Date of Birth</label>
                <input type="text" placeholder="MM/DD/YYYY" value={obIdent.dob} onChange={e => setObIdent(p => ({ ...p, dob: e.target.value }))}
                  className="w-full px-3 py-2 bg-app-surface-2 border border-app-border-2 rounded-lg text-app-text text-sm placeholder-app-text-5 focus:outline-none focus:ring-2 focus:ring-app-accent"/>
              </div>
              <div>
                <label className="block text-[0.625rem] font-medium text-app-text-4 mb-1">SSN / Last 4</label>
                <input type="text" value={obIdent.ssn} onChange={e => setObIdent(p => ({ ...p, ssn: e.target.value }))}
                  className="w-full px-3 py-2 bg-app-surface-2 border border-app-border-2 rounded-lg text-app-text text-sm font-mono focus:outline-none focus:ring-2 focus:ring-app-accent"/>
              </div>
              <div>
                <label className="block text-[0.625rem] font-medium text-app-text-4 mb-1">NPN — Personal</label>
                <input type="text" value={obIdent.npnPersonal} onChange={e => setObIdent(p => ({ ...p, npnPersonal: e.target.value }))}
                  className="w-full px-3 py-2 bg-app-surface-2 border border-app-border-2 rounded-lg text-app-text text-sm font-mono focus:outline-none focus:ring-2 focus:ring-app-accent"/>
              </div>
              <div>
                <label className="block text-[0.625rem] font-medium text-app-text-4 mb-1">NPN — Business</label>
                <input type="text" value={obIdent.npnBusiness} onChange={e => setObIdent(p => ({ ...p, npnBusiness: e.target.value }))}
                  className="w-full px-3 py-2 bg-app-surface-2 border border-app-border-2 rounded-lg text-app-text text-sm font-mono focus:outline-none focus:ring-2 focus:ring-app-accent"/>
              </div>
              <div>
                <label className="block text-[0.625rem] font-medium text-app-text-4 mb-1">EIN</label>
                <input type="text" value={obIdent.ein} onChange={e => setObIdent(p => ({ ...p, ein: e.target.value }))}
                  className="w-full px-3 py-2 bg-app-surface-2 border border-app-border-2 rounded-lg text-app-text text-sm font-mono focus:outline-none focus:ring-2 focus:ring-app-accent"/>
              </div>
              <div>
                <label className="block text-[0.625rem] font-medium text-app-text-4 mb-1">Address</label>
                <input type="text" value={obIdent.address} onChange={e => setObIdent(p => ({ ...p, address: e.target.value }))}
                  className="w-full px-3 py-2 bg-app-surface-2 border border-app-border-2 rounded-lg text-app-text text-sm focus:outline-none focus:ring-2 focus:ring-app-accent"/>
              </div>
              <div className="col-span-2">
                <label className="block text-[0.625rem] font-medium text-app-text-4 mb-1">Notes</label>
                <input type="text" value={obIdent.notes} onChange={e => setObIdent(p => ({ ...p, notes: e.target.value }))}
                  className="w-full px-3 py-2 bg-app-surface-2 border border-app-border-2 rounded-lg text-app-text text-sm focus:outline-none focus:ring-2 focus:ring-app-accent"/>
              </div>
            </div>
          </section>

          {/* Credentials */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-app-text-3">Platform Credentials</p>
              <button type="button" onClick={() => setObCreds(p => [...p, { ...blankCred }])}
                className="text-xs text-app-accent hover:opacity-80 transition">+ Add</button>
            </div>
            {obCreds.length === 0 && <p className="text-app-text-2 text-xs">No credentials added yet.</p>}
            <div className="space-y-3">
              {obCreds.map((c, i) => (
                <div key={i} className="p-3 bg-app-surface-2/60 border border-app-border-2 rounded-xl">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[0.625rem] font-medium text-app-text-4 mb-1">Platform</label>
                      <input type="text" value={c.platform} onChange={e => setObCreds(p => p.map((x, j) => j === i ? { ...x, platform: e.target.value } : x))}
                        placeholder="e.g. HCMS / Gateway"
                        className="w-full px-3 py-1.5 bg-app-surface border border-app-border-2 rounded-lg text-app-text text-sm placeholder-app-text-5 focus:outline-none focus:ring-1 focus:ring-app-accent"/>
                    </div>
                    <div>
                      <label className="block text-[0.625rem] font-medium text-app-text-4 mb-1">Username</label>
                      <input type="text" value={c.username} onChange={e => setObCreds(p => p.map((x, j) => j === i ? { ...x, username: e.target.value } : x))}
                        className="w-full px-3 py-1.5 bg-app-surface border border-app-border-2 rounded-lg text-app-text text-sm focus:outline-none focus:ring-1 focus:ring-app-accent"/>
                    </div>
                    <div>
                      <label className="block text-[0.625rem] font-medium text-app-text-4 mb-1">Password</label>
                      <input type="text" value={c.password} onChange={e => setObCreds(p => p.map((x, j) => j === i ? { ...x, password: e.target.value } : x))}
                        className="w-full px-3 py-1.5 bg-app-surface border border-app-border-2 rounded-lg text-app-text text-sm font-mono focus:outline-none focus:ring-1 focus:ring-app-accent"/>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[0.625rem] font-medium text-app-text-4 mb-1">Link (optional)</label>
                      <input type="url" value={c.link} onChange={e => setObCreds(p => p.map((x, j) => j === i ? { ...x, link: e.target.value } : x))}
                        placeholder="https://..."
                        className="w-full px-3 py-1.5 bg-app-surface border border-app-border-2 rounded-lg text-app-text text-sm placeholder-app-text-5 focus:outline-none focus:ring-1 focus:ring-app-accent"/>
                    </div>
                  </div>
                  <button type="button" onClick={() => setObCreds(p => p.filter((_, j) => j !== i))}
                    className="mt-2 text-[0.625rem] text-red-500 hover:text-red-400 transition">Remove</button>
                </div>
              ))}
            </div>
          </section>

          {/* Writing Numbers */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-app-text-3">Writing Numbers</p>
              <button type="button" onClick={() => setObWns(p => [...p, { ...blankWn }])}
                className="text-xs text-app-accent hover:opacity-80 transition">+ Add</button>
            </div>
            {obWns.length === 0 && <p className="text-app-text-2 text-xs">No writing numbers added yet.</p>}
            <div className="space-y-2">
              {obWns.map((w, i) => (
                <div key={i} className="p-3 bg-app-surface-2/60 border border-app-border-2 rounded-xl">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-3">
                      <label className="block text-[0.625rem] font-medium text-app-text-4 mb-1">Carrier</label>
                      <input type="text" value={w.carrier} onChange={e => setObWns(p => p.map((x, j) => j === i ? { ...x, carrier: e.target.value } : x))}
                        placeholder="e.g. Mutual of Omaha"
                        className="w-full px-3 py-1.5 bg-app-surface border border-app-border-2 rounded-lg text-app-text text-sm placeholder-app-text-5 focus:outline-none focus:ring-1 focus:ring-app-accent"/>
                    </div>
                    <div>
                      <label className="block text-[0.625rem] font-medium text-app-text-4 mb-1">Individual #</label>
                      <input type="text" value={w.individualNumber} onChange={e => setObWns(p => p.map((x, j) => j === i ? { ...x, individualNumber: e.target.value } : x))}
                        className="w-full px-3 py-1.5 bg-app-surface border border-app-border-2 rounded-lg text-app-text text-sm font-mono focus:outline-none focus:ring-1 focus:ring-app-accent"/>
                    </div>
                    <div>
                      <label className="block text-[0.625rem] font-medium text-app-text-4 mb-1">Agency #</label>
                      <input type="text" value={w.agencyNumber} onChange={e => setObWns(p => p.map((x, j) => j === i ? { ...x, agencyNumber: e.target.value } : x))}
                        className="w-full px-3 py-1.5 bg-app-surface border border-app-border-2 rounded-lg text-app-text text-sm font-mono focus:outline-none focus:ring-1 focus:ring-app-accent"/>
                    </div>
                    <div>
                      <label className="block text-[0.625rem] font-medium text-app-text-4 mb-1">Notes</label>
                      <input type="text" value={w.notes} onChange={e => setObWns(p => p.map((x, j) => j === i ? { ...x, notes: e.target.value } : x))}
                        className="w-full px-3 py-1.5 bg-app-surface border border-app-border-2 rounded-lg text-app-text text-sm focus:outline-none focus:ring-1 focus:ring-app-accent"/>
                    </div>
                  </div>
                  <button type="button" onClick={() => setObWns(p => p.filter((_, j) => j !== i))}
                    className="mt-2 text-[0.625rem] text-red-500 hover:text-red-400 transition">Remove</button>
                </div>
              ))}
            </div>
          </section>

          {/* State Licenses */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-app-text-3">State Licenses</p>
              <button type="button" onClick={() => setObLics(p => [...p, { ...blankLic }])}
                className="text-xs text-app-accent hover:opacity-80 transition">+ Add State</button>
            </div>
            {obLics.length === 0 && <p className="text-app-text-2 text-xs">No licenses added yet.</p>}
            <div className="space-y-2">
              {obLics.map((l, i) => (
                <div key={i} className="p-3 bg-app-surface-2/60 border border-app-border-2 rounded-xl">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[0.625rem] font-medium text-app-text-4 mb-1">State *</label>
                      <select value={l.stateCode}
                        onChange={e => setObLics(p => p.map((x, j) => j === i ? { ...x, stateCode: e.target.value, state: US_STATES.find(s => s.code === e.target.value)?.name ?? "" } : x))}
                        className="w-full px-3 py-1.5 bg-app-surface border border-app-border-2 rounded-lg text-app-text text-sm focus:outline-none focus:ring-1 focus:ring-app-accent">
                        <option value="">Select...</option>
                        {US_STATES.map(s => <option key={s.code} value={s.code}>{s.name} ({s.code})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[0.625rem] font-medium text-app-text-4 mb-1">Individual License #</label>
                      <input type="text" value={l.individualLicense} onChange={e => setObLics(p => p.map((x, j) => j === i ? { ...x, individualLicense: e.target.value } : x))}
                        className="w-full px-3 py-1.5 bg-app-surface border border-app-border-2 rounded-lg text-app-text text-sm font-mono focus:outline-none focus:ring-1 focus:ring-app-accent"/>
                    </div>
                    <div>
                      <label className="block text-[0.625rem] font-medium text-app-text-4 mb-1">Individual Expiry</label>
                      <input type="date" value={l.individualExpiry} onChange={e => setObLics(p => p.map((x, j) => j === i ? { ...x, individualExpiry: e.target.value } : x))}
                        className="w-full px-3 py-1.5 bg-app-surface border border-app-border-2 rounded-lg text-app-text text-sm focus:outline-none focus:ring-1 focus:ring-app-accent"/>
                    </div>
                    <div>
                      <label className="block text-[0.625rem] font-medium text-app-text-4 mb-1">Agency License # <span className="text-app-text-5">(opt)</span></label>
                      <input type="text" value={l.agencyLicense} onChange={e => setObLics(p => p.map((x, j) => j === i ? { ...x, agencyLicense: e.target.value } : x))}
                        className="w-full px-3 py-1.5 bg-app-surface border border-app-border-2 rounded-lg text-app-text text-sm font-mono focus:outline-none focus:ring-1 focus:ring-app-accent"/>
                    </div>
                    <div>
                      <label className="block text-[0.625rem] font-medium text-app-text-4 mb-1">Agency Expiry <span className="text-app-text-5">(opt)</span></label>
                      <input type="date" value={l.agencyExpiry} onChange={e => setObLics(p => p.map((x, j) => j === i ? { ...x, agencyExpiry: e.target.value } : x))}
                        className="w-full px-3 py-1.5 bg-app-surface border border-app-border-2 rounded-lg text-app-text text-sm focus:outline-none focus:ring-1 focus:ring-app-accent"/>
                    </div>
                  </div>
                  <button type="button" onClick={() => setObLics(p => p.filter((_, j) => j !== i))}
                    className="mt-2 text-[0.625rem] text-red-500 hover:text-red-400 transition">Remove</button>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-app-border shrink-0">
          {obError && <p className="text-red-400 text-xs mb-3">{obError}</p>}
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={resetAndClose} disabled={obSaving}
              className="px-4 py-2 text-sm text-app-text-3 hover:text-app-text transition">Cancel</button>
            <button type="button" onClick={submitOnboard} disabled={obSaving}
              className="px-5 py-2 bg-app-accent hover:bg-app-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition flex items-center gap-2">
              {obSaving && <Spinner className="w-4 h-4" />}
              {obSaving ? "Onboarding..." : "Onboard Agent"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
