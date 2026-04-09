"use client";

import { useState, useEffect, useRef } from "react";
import { collection, addDoc, getDocs, serverTimestamp, query, where, limit } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { UserProfile } from "../../../../lib/types";
import { getWeekStart } from "../../../../lib/weekUtils";
import { useUserClaim } from "../../../../lib/hooks/useUserClaim";
import { useRouter } from "next/navigation";
import { Spinner } from "../../../../lib/components/Spinner";
import MemberSelect, { MemberOption } from "../../../../components/MemberSelect";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
];

const CARRIERS = [
  "Americo","AMAM","Aetna","CICA","Chubb",
  "Corebridge","Ethos","MOO","Trans","Instabrain","Other",
];

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const today = localDateStr(new Date());
const startDateMin = (() => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return localDateStr(d);
})();


export default function NewClientPage() {
  const router = useRouter();
  const claim = useUserClaim();
  const { uid, profile } = claim;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memberOptions, setMemberOptions] = useState<MemberOption[]>([]);
  const [appNumStatus, setAppNumStatus] = useState<"idle" | "checking" | "ok" | "taken">("idle");
  const appNumTimer = useRef<ReturnType<typeof setTimeout> | null>(null);


  const [noEmail, setNoEmail] = useState(false);
  const [form, setForm] = useState({
    date: today,
    clientName: "",
    phone: "",
    email: "",
    startDate: "",
    state: "",
    carrier: "",
    appNumber: "",
    annualPremium: "",
    portalUid: "",
    portalName: "",
    agentStatus: "Approved",
    adminStatus: "",
    splitPercent: 0,
    clientPaidDate: "",
    compDate: "",
    notes: "",
  });


  // Load active managers for split dropdown
  useEffect(() => {
    async function loadMembers() {
      try {
        const snap = await getDocs(collection(db, "users"));
        const opts: MemberOption[] = [];
        snap.forEach((d) => {
          const u = d.data() as UserProfile;
          // Only include active managers with completed onboarding
          if (u.role === "manager" && u.firstName && u.lastName && u.active !== false) {
            opts.push({
              uid: d.id,
              firstName: u.firstName,
              lastName: u.lastName,
              contractorId: u.contractorId || "",
              email: u.email || "",
              phone: u.phone || "",
              teamNumber: u.teamNumber || 0,
              photoURL: u.photoURL || "",
            });
          }
        });
        opts.sort((a, b) =>
          `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
        );
        setMemberOptions(opts);
      } catch { /* ignore */ }
    }
    loadMembers();
  }, []);

  function formatPhoneUS(raw: string): string {
    const digits = raw.replace(/\D/g, "").slice(0, 10);
    if (digits.length === 0) return "";
    if (digits.length <= 3) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement;
    let value: string | boolean = target.type === "checkbox" ? target.checked : target.value;
    if (target.name === "phone") value = formatPhoneUS(target.value);
    setForm((prev) => ({ ...prev, [target.name]: value }));

    if (target.name === "appNumber") {
      const appNum = (value as string).trim().toUpperCase();
      if (appNumTimer.current) clearTimeout(appNumTimer.current);
      if (!appNum) { setAppNumStatus("idle"); return; }
      setAppNumStatus("checking");
      appNumTimer.current = setTimeout(async () => {
        try {
          const snap = await getDocs(query(collection(db, "clients"), where("appNumber", "==", appNum), limit(1)));
          setAppNumStatus(snap.empty ? "ok" : "taken");
        } catch { setAppNumStatus("idle"); }
      }, 400);
    }
  };

  const handlePortalChange = (portalUid: string, member: MemberOption | null) => {
    const isSplit = portalUid !== "" && portalUid !== uid;
    setForm((prev) => ({
      ...prev,
      portalUid,
      portalName: member ? `${member.firstName} ${member.lastName}` : "",
      splitPercent: isSplit ? 50 : 0,
    }));
  };

  const isRep         = profile?.role === "rep";
  const isAdmin       = profile?.role === "admin";
  const isStrictAdmin = ["admin", "owner", "developer"].includes(profile?.role ?? "");

  // Hide TCs on the same team — splits are cross-team only
  const filteredMemberOptions = profile?.teamNumber
    ? memberOptions.filter((m) => m.teamNumber !== profile.teamNumber)
    : memberOptions;
  const isFormValid =
    !!form.date &&
    !!form.clientName.trim() &&
    !!form.phone.trim() &&
    !!form.startDate &&
    !!form.state &&
    !!form.carrier &&
    !!form.appNumber.trim() &&
    appNumStatus !== "taken" &&
    appNumStatus !== "checking" &&
    !!form.annualPremium &&
    !!form.agentStatus &&
    (!isAdmin || !!form.adminStatus);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !isFormValid) return;
    setSaving(true);
    setError(null);

    try {
      const weekStart = getWeekStart(new Date(form.date + "T12:00:00"));
      const agentName = profile ? `${profile.firstName} ${profile.lastName}` : "";
      await addDoc(collection(db, "clients"), {
        // Agent info
        agentId: uid,
        agentName,
        contractorId: profile?.contractorId || "",
        agentTeamNumber: profile?.teamNumber || 0,
        // Client fields
        date: form.date,
        clientName: form.clientName,
        phone: form.phone.trim(),
        email: form.email,
        startDate: form.startDate,
        state: form.state,
        carrier: form.carrier,
        appNumber: form.appNumber,
        annualPremium: parseFloat(form.annualPremium) || 0,
        portal: form.portalUid,
        portalName: form.portalName,
        agentStatus: form.agentStatus || "Approved",
        adminStatus: isAdmin ? (form.adminStatus || "Pending Client Payment") : "Pending Client Payment",
        splitPercent: form.splitPercent,
        clientPaidDate: form.clientPaidDate,
        compDate: form.compDate,
        notes: form.notes,
        weekStart,
        // Metadata
        createdAt: serverTimestamp(),
        createdBy: uid,
        createdByName: agentName,
        updatedAt: serverTimestamp(),
        updatedBy: uid,
        updatedByName: agentName,
      });
      router.push("/portal/clients");
    } catch (err) {
      console.error(err);
      setError("Failed to save client. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 bg-app-surface-2 border border-app-border-2 rounded-lg text-app-text placeholder-app-text-4 focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent transition text-sm";
  const labelClass = "block text-sm font-medium text-app-text-2 mb-1";

  return (
    <div className="bg-app-bg min-h-full p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-app-text">Add New Client</h1>
          <p className="text-app-text-3 text-sm mt-1">Fill in the client application details below.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-app-surface border border-app-border rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Date */}
            <div>
              <label className={labelClass}>Date <span className="text-red-400">*</span></label>
              <input type="date" name="date" value={form.date} onChange={handleChange} className={inputClass} required />
            </div>

            {/* Client Name */}
            <div>
              <label className={labelClass}>Client Name <span className="text-red-400">*</span></label>
              <input type="text" name="clientName" value={form.clientName} onChange={handleChange} placeholder="Full name" className={inputClass} required />
            </div>

            {/* Phone */}
            <div>
              <label className={labelClass}>Phone <span className="text-red-400">*</span></label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="(555) 000-0000" className={inputClass} />
            </div>

            {/* Email */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-app-text-2">Email</label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noEmail}
                    onChange={(e) => {
                      setNoEmail(e.target.checked);
                      if (e.target.checked) setForm((prev) => ({ ...prev, email: "" }));
                    }}
                    className="w-3.5 h-3.5 rounded border-app-border-2 bg-app-surface-2 text-app-accent focus:ring-app-accent focus:ring-offset-0"
                  />
                  <span className="text-xs text-app-text-4">No email</span>
                </label>
              </div>
              {noEmail ? (
                <div className="px-3 py-2 bg-app-surface-2/50 border border-app-border-2 rounded-lg text-app-text-4 text-sm">
                  No email provided
                </div>
              ) : (
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="client@example.com" className={inputClass} />
              )}
            </div>

            {/* Start Date */}
            <div>
              <label className={labelClass}>Start Date <span className="text-red-400">*</span></label>
              <input type="date" name="startDate" value={form.startDate} onChange={handleChange} className={inputClass} required min={startDateMin} />
            </div>

            {/* State */}
            <div>
              <label className={labelClass}>State <span className="text-red-400">*</span></label>
              <select name="state" value={form.state} onChange={handleChange} className={inputClass} required>
                <option value="">Select state...</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Carrier */}
            <div>
              <label className={labelClass}>Carrier <span className="text-red-400">*</span></label>
              <select name="carrier" value={form.carrier} onChange={handleChange} className={inputClass} required>
                <option value="">Select a carrier...</option>
                {CARRIERS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* App Number */}
            <div>
              <label className={labelClass}>App Number <span className="text-red-400">*</span></label>
              <input
                type="text"
                name="appNumber"
                value={form.appNumber}
                onChange={handleChange}
                placeholder="Application #"
                className={`${inputClass} ${appNumStatus === "taken" ? "border-red-500 focus:ring-red-500" : appNumStatus === "ok" ? "border-green-600 focus:ring-green-500" : ""}`}
                required
              />
              {appNumStatus === "checking" && (
                <p className="text-app-text-4 text-xs mt-1">Checking...</p>
              )}
              {appNumStatus === "taken" && (
                <p className="text-red-400 text-xs mt-1">This app number already exists in the database.</p>
              )}
              {appNumStatus === "ok" && (
                <p className="text-green-500 text-xs mt-1">App number is available.</p>
              )}
            </div>

            {/* Annual Premium */}
            <div>
              <label className={labelClass}>Annual Premium ($) <span className="text-red-400">*</span></label>
              <input type="number" name="annualPremium" value={form.annualPremium} onChange={handleChange} placeholder="0.00" min="0" step="0.01" className={inputClass} required />
            </div>

            {/* Split — optional; hides TCs on same team */}
            <div>
              <label className={labelClass}>Split (cross-team TC)</label>
              <MemberSelect
                options={filteredMemberOptions}
                value={form.portalUid}
                onChange={handlePortalChange}
                placeholder="Select a TC from another team..."
              />
            </div>

            {/* Agent Status — all roles see this; Cancelled only for admin/owner/developer */}
            <div>
              <label className={labelClass}>Agent Status <span className="text-red-400">*</span></label>
              <select name="agentStatus" value={form.agentStatus} onChange={handleChange} className={inputClass}>
                <option>Approved</option>
                <option>Sent UW</option>
                <option>Declined</option>
                {isStrictAdmin && <option>Cancelled</option>}
              </select>
            </div>

            {/* Admin Status — admins only */}
            {isAdmin && (
              <div>
                <label className={labelClass}>Admin Status <span className="text-red-400">*</span></label>
                <select name="adminStatus" value={form.adminStatus} onChange={handleChange} className={inputClass} required>
                  <option value="">Select a status...</option>
                  <option>Pending Client Payment</option>
                  <option>Client Paid|Comp Paid</option>
                  <option>Client Paid|Waiting on Comp</option>
                  <option>Comp Paid|Client Not Paid</option>
                  <option>UW or Requirements</option>
                  <option>Decline - Rewrite</option>
                  <option>Lapsed</option>
                  <option>CXL</option>
                </select>
              </div>
            )}

            {/* Split % — fixed 50/50 on new form; full selector available in edit modal */}
            {form.portalUid && form.portalUid !== uid && (
              <div className="md:col-span-2">
                <label className={labelClass}>Split</label>
                <div className="flex items-center gap-3 px-4 py-3 bg-app-surface-2 border border-app-border-2 rounded-lg">
                  <span className="text-app-text text-sm font-semibold">50 / 50</span>
                  <span className="text-app-text-4 text-xs">You · {form.portalName || "TC"}</span>
                  <span className="ml-auto text-app-text-5 text-xs">Adjust split % after saving via Edit</span>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="md:col-span-2">
              <label className={labelClass}>Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Additional notes..." rows={4} className={inputClass + " resize-none"} />
            </div>
          </div>

          {error && (
            <div className="mt-4 px-4 py-3 bg-red-950 border border-red-800 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 mt-6">
            <button
              type="submit"
              disabled={saving || !isFormValid}
              className="px-6 py-2.5 bg-app-accent hover:bg-app-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition text-sm"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <Spinner className="w-4 h-4" />
                  Saving...
                </span>
              ) : (
                "Save Client"
              )}
            </button>
            <button type="button" onClick={() => router.push("/portal/clients")} className="px-6 py-2.5 bg-app-surface-2 hover:bg-app-surface-2 text-app-text-2 font-semibold rounded-lg transition text-sm">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
