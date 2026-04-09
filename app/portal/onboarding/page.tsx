"use client";

import { useState, useEffect, useRef } from "react";
import {
  doc, setDoc, getDoc, addDoc, collection, query, where,
  getDocs, serverTimestamp, writeBatch, updateDoc, arrayUnion,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../../lib/firebase";
import { useUserClaim } from "../../../lib/hooks/useUserClaim";
import { useRouter } from "next/navigation";
import { Spinner } from "../../../lib/components/Spinner";
import { BrandLogo } from "../../../lib/components/BrandLogo";
import { toE164, formatPhoneDisplay } from "./validation";
import { AGREEMENTS } from "./agreements";
import { generateOnboardingPDF } from "./generateOnboardingPDF";
import StepProgress from "./steps/StepProgress";
import StepBasicInfo from "./steps/StepBasicInfo";
import StepIdentityBanking from "./steps/StepIdentityBanking";
import StepAgreements from "./steps/StepAgreements";

// ── Contractor ID helpers ────────────────────────────────────────────────────

function buildContractorId(teamNumber: number, firstName: string, lastName: string): string {
  const now = new Date();
  const tt   = String(teamNumber).padStart(2, "0");
  const dd   = String(now.getDate()).padStart(2, "0");
  const mm   = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = String(now.getFullYear());
  const ii   = ((firstName.charAt(0) || "X") + (lastName.charAt(0) || "X")).toUpperCase();
  return `${tt}${dd}${mm}${yyyy}${ii}`;
}

async function uniqueContractorId(
  teamNumber: number, firstName: string, lastName: string
): Promise<string> {
  const base = buildContractorId(teamNumber, firstName, lastName);
  const snap = await getDoc(doc(db, "contractorIds", base));
  if (!snap.exists()) return base;
  for (let n = 2; n <= 99; n++) {
    const candidate = `${base}${n}`;
    const s = await getDoc(doc(db, "contractorIds", candidate));
    if (!s.exists()) return candidate;
  }
  return `${base}_${Date.now()}`;
}

// ── Wizard state ─────────────────────────────────────────────────────────────

interface WizardState {
  // Step 1
  firstName: string;
  lastName: string;
  email: string;
  phoneDigits: string;
  comments: string;
  selectedTeam: number;
  // Step 2
  ssn: string;
  dob: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  bankName: string;
  routingNumber: string;
  accountNumber: string;
  accountType: string;
}

const INITIAL_STATE: WizardState = {
  firstName: "", lastName: "", email: "", phoneDigits: "", comments: "", selectedTeam: 0,
  ssn: "", dob: "", address: "", city: "", state: "", zip: "",
  bankName: "", routingNumber: "", accountNumber: "", accountType: "",
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const claim = useUserClaim();
  const uid = claim.uid;
  const [teamCount, setTeamCount] = useState(0);
  const [form, setForm] = useState<WizardState>(INITIAL_STATE);
  const [step, setStepRaw] = useState(1);
  const setStep = (s: number) => { setStepRaw(s); setError(""); window.scrollTo(0, 0); };
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingStep, setSavingStep] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const update = (partial: Record<string, unknown>) => {
    setForm(prev => ({ ...prev, ...partial }));
  };

  // ── Init: auth check, prefill, team count ─────────────────────────────────
  useEffect(() => {
    if (claim.loading) return;
    if (!claim.uid) { router.push("/login"); return; }
    // Already fully onboarded — go to dashboard
    if (claim.profile?.onboardingPacketSigned && !saving) { router.push("/portal/dashboard"); return; }

    // Admin-created user: has profile but hasn't signed agreements → skip to step 2
    const existingProfile = claim.profile;

    const email = claim.user?.email || "";

    (async () => {
      try {
        const settingsSnap = await getDoc(doc(db, "settings", "teamConfig"));
        setTeamCount(settingsSnap.exists() ? (settingsSnap.data().teamCount ?? 4) : 4);

        const prefill: Partial<WizardState> = { email };

        if (existingProfile) {
          // Pre-fill from existing profile (admin-created user)
          prefill.firstName = existingProfile.firstName || "";
          prefill.lastName = existingProfile.lastName || "";
          prefill.email = existingProfile.email || email;
          prefill.phoneDigits = (existingProfile.phone || "").replace(/^\+1/, "").replace(/\D/g, "").slice(0, 10);
          prefill.selectedTeam = existingProfile.teamNumber || 0;
          prefill.comments = existingProfile.comments || "";
          setStep(2); // Skip basic info — already on file
        } else if (email) {
          // Pre-fill from approved onboarding request
          const reqQuery = query(
            collection(db, "onboardingRequests"),
            where("email", "==", email.toLowerCase()),
            where("status", "==", "approved")
          );
          const reqSnap = await getDocs(reqQuery);
          if (!reqSnap.empty) {
            const data = reqSnap.docs[0].data();
            if (data.firstName) prefill.firstName = data.firstName;
            if (data.lastName)  prefill.lastName  = data.lastName;
            if (data.teamNumber && data.teamNumber > 0) prefill.selectedTeam = data.teamNumber;
            if (data.phone) {
              const digits = data.phone.replace(/^\+1/, "").replace(/\D/g, "").slice(0, 10);
              prefill.phoneDigits = digits;
            }
            if (data.comments) prefill.comments = data.comments;
          }
        }
        setForm(f => ({ ...f, ...prefill }));
      } catch { /* ignore */ }
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claim.loading, claim.uid, claim.profile, saving]);

  // ── Final submission ──────────────────────────────────────────────────────
  const signatureRef = useRef<string>("");
  const completeOnboarding = async () => {
    if (!uid) return;
    setSaving(true);
    setError("");
    setSavingStep("Creating your profile...");

    const firstName  = form.firstName.trim();
    const lastName   = form.lastName.trim();
    const teamNumber = form.selectedTeam;
    const agentName  = `${firstName} ${lastName}`;
    const fullAddress = `${form.address.trim()}, ${form.city.trim()}, ${form.state} ${form.zip}`;

    const hasExistingProfile = !!claim.profile;

    try {
      let contractorId: string;

      if (hasExistingProfile) {
        contractorId = claim.profile!.contractorId || "";
        await updateDoc(doc(db, "users", uid), {
          onboardingPacketSigned: true,
          onboardingSignedAt: serverTimestamp(),
        });
      } else {
        contractorId = await uniqueContractorId(teamNumber, firstName, lastName);

        await setDoc(doc(db, "contractorIds", contractorId), {
          uid,
          claimedAt: serverTimestamp(),
        });

        await setDoc(doc(db, "users", uid), {
          firstName,
          lastName,
          email: form.email.trim(),
          phone: toE164(form.phoneDigits),
          comments: form.comments.trim(),
          role: "rep",
          subRole: "",
          teamNumber,
          contractorId,
          active: true,
          photoURL: "",
          createdAt: serverTimestamp(),
          mustChangePassword: false,
          level: 0,
          companyRole: "",
          npnPersonal: "",
          hideFromPayroll: false,
          acceptedTermsVersion: 0,
          acceptedTermsAt: null,
          onboardingPacketSigned: true,
          onboardingSignedAt: serverTimestamp(),
        });
      }

      // ── Non-critical steps (don't block onboarding) ──

      setSavingStep("Encrypting identity & banking info...");
      try {
        await fetch("/api/admin/secrets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid, type: "identity", callerUid: uid,
            data: { ssn: form.ssn, dob: form.dob, address: form.address.trim(), city: form.city.trim(), state: form.state, zip: form.zip },
          }),
        });
        await fetch("/api/admin/secrets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid, type: "banking", callerUid: uid,
            data: { bankName: form.bankName.trim(), routingNumber: form.routingNumber, accountNumber: form.accountNumber.trim(), accountType: form.accountType },
          }),
        });
      } catch { /* non-blocking */ }

      setSavingStep("Saving signature...");
      try {
        if (signatureRef.current) {
          await setDoc(doc(db, "users", uid, "settings", "signature"), {
            dataUrl: signatureRef.current,
            updatedAt: serverTimestamp(),
          });
        }
      } catch { /* non-blocking */ }

      setSavingStep("Linking your account...");
      try {
        if (!hasExistingProfile) {
          const pendingId = `pending:${contractorId}`;
          const clientSnap = await getDocs(
            query(collection(db, "clients"), where("agentId", "==", pendingId))
          );
          if (!clientSnap.empty) {
            const BATCH_LIMIT = 499;
            const clientDocs = clientSnap.docs;
            for (let i = 0; i < clientDocs.length; i += BATCH_LIMIT) {
              const batch = writeBatch(db);
              clientDocs.slice(i, i + BATCH_LIMIT).forEach((d) => {
                batch.update(d.ref, { agentId: uid, agentName, contractorId, agentTeamNumber: teamNumber });
              });
              await batch.commit();
            }
          }
          const generalRef = doc(db, "chats", "general");
          const generalSnap = await getDoc(generalRef);
          if (generalSnap.exists()) await updateDoc(generalRef, { participants: arrayUnion(uid) });
          const teamSlug = `team-${teamNumber}`;
          const chatsSnap = await getDocs(query(collection(db, "chats"), where("type", "==", "group"), where("name", "==", teamSlug)));
          for (const chatDoc of chatsSnap.docs) await updateDoc(chatDoc.ref, { participants: arrayUnion(uid) });
        }
      } catch { /* non-blocking */ }

      setSavingStep("Generating your onboarding certificate...");
      try {
        const now = new Date();
        let logoDataUrl: string | undefined;
        try {
          const logoRes = await fetch("/atx_logo_dark.png");
          const logoBlob = await logoRes.blob();
          const img = new Image();
          const imgUrl = URL.createObjectURL(logoBlob);
          await new Promise<void>((resolve) => { img.onload = () => resolve(); img.src = imgUrl; });
          const canvas = document.createElement("canvas");
          const scale = 200 / img.width;
          canvas.width = 200;
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(imgUrl);
          logoDataUrl = canvas.toDataURL("image/png");
        } catch { /* logo failed */ }

        const pdfBlob = await generateOnboardingPDF({
          name: agentName,
          email: form.email.trim(),
          ssn: form.ssn,
          address: fullAddress,
          agreements: [...AGREEMENTS],
          timestamp: now,
          logoDataUrl,
          signatureDataUrl: signatureRef.current || undefined,
        });

        setSavingStep("Uploading certificate...");
        const storagePath = `onboarding-packets/${uid}/onboarding-${now.getTime()}.pdf`;
        const sRef = ref(storage, storagePath);
        await uploadBytes(sRef, pdfBlob, { contentType: "application/pdf" });
        const downloadURL = await getDownloadURL(sRef);

        await setDoc(doc(db, "onboardingCertificates", uid), {
          uid, name: agentName, email: form.email.trim(),
          signedAt: serverTimestamp(), storagePath, certificateUrl: downloadURL,
          agreements: AGREEMENTS.map(a => a.id), reviewed: false,
        });

        await addDoc(collection(db, "documents"), {
          name: `Onboarding Packet — ${agentName}`,
          fileName: `onboarding-${agentName.replace(/\s+/g, "-").toLowerCase()}.pdf`,
          category: "Compliance", docDate: now.toISOString().split("T")[0],
          notes: `Signed onboarding agreements for ${agentName} (${form.email.trim()})`,
          fileSize: pdfBlob.size, fileType: "application/pdf",
          storagePath, storageUrl: downloadURL,
          uploadedBy: uid, uploadedByName: agentName, uploadedByRole: hasExistingProfile ? (claim.profile!.role || "rep") : "rep", uploadedByTeam: teamNumber,
          uploadedAt: serverTimestamp(), createdAt: serverTimestamp(), createdBy: uid, createdByName: agentName,
          updatedAt: serverTimestamp(), updatedBy: uid, updatedByName: agentName, protected: true,
        });
      } catch (pdfErr) {
        console.error("[onboarding] PDF failed (non-blocking):", pdfErr);
      }

      setSavingStep("Done! Redirecting...");
      router.push("/portal/dashboard");
    } catch (err) {
      console.error("[onboarding] submission failed:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Onboarding failed: ${msg}`);
      setSaving(false);
      setSavingStep("");
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <Spinner className="w-7 h-7" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-app-bg flex flex-col items-center px-4 py-8 overflow-y-auto">
      {/* Logo pinned to top */}
      <div className="flex justify-center mb-6 shrink-0">
        <BrandLogo width={240} height={85} priority />
      </div>

      <div className="w-full max-w-2xl">
        <StepProgress current={step} />

        <div className="bg-app-surface border border-app-border rounded-2xl p-6 md:p-10 shadow-xl mt-4">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-app-text">
              {step === 1 && "Welcome to ATX Financial Group"}
              {step === 2 && "Identity & Banking"}
              {step === 3 && "Review & Sign Agreements"}
            </h1>
            <p className="text-app-text-3 text-sm mt-1">
              {step === 1 && "Complete your profile to get started."}
              {step === 2 && "We need this information for EFT payroll and tax reporting."}
              {step === 3 && "Review each document and confirm your agreement."}
            </p>
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-950/80 border border-red-700 rounded-xl mb-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-red-300 text-sm font-semibold">Something went wrong</p>
                  <p className="text-red-400/80 text-xs mt-1 break-all font-mono">{error}</p>
                  <button
                    type="button"
                    onClick={() => setError("")}
                    className="mt-2 text-red-400 hover:text-red-200 text-xs underline transition"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <StepBasicInfo
              form={form}
              selectedTeam={form.selectedTeam}
              teamCount={teamCount}
              onUpdate={update}
              onNext={() => setStep(2)}
            />
          )}

          {step === 2 && (
            <StepIdentityBanking
              form={form}
              onUpdate={update}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}

          {step === 3 && (
            <StepAgreements
              signerName={`${form.firstName.trim()} ${form.lastName.trim()}`}
              signerEmail={form.email.trim()}
              ssn={form.ssn}
              address={form.address.trim()}
              city={form.city.trim()}
              state={form.state}
              zip={form.zip}
              bankName={form.bankName.trim()}
              routingNumber={form.routingNumber}
              accountNumber={form.accountNumber.trim()}
              accountType={form.accountType}
              saving={saving}
              onBack={() => setStep(2)}
              onSubmit={(sigDataUrl: string) => { signatureRef.current = sigDataUrl; completeOnboarding(); }}
            />
          )}
        </div>
      </div>

      {/* ── Saving overlay ── */}
      {saving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-app-surface border border-app-border-2 rounded-2xl p-8 w-full max-w-sm shadow-2xl text-center">
            <Spinner className="w-8 h-8 mx-auto mb-4" />
            <p className="text-app-text font-semibold text-sm">{savingStep || "Processing..."}</p>
            <p className="text-app-text-4 text-xs mt-2">Please don&apos;t close this page.</p>
          </div>
        </div>
      )}
    </div>
  );
}
