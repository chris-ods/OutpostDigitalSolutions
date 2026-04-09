"use client";

import { useState } from "react";
import { AGREEMENTS } from "../agreements";
import { formatSSN } from "../validation";
import { Spinner } from "../../../../lib/components/Spinner";
import SignaturePad from "./SignaturePad";

interface Props {
  signerName: string;
  signerEmail: string;
  ssn: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  bankName: string;
  routingNumber: string;
  accountNumber: string;
  accountType: string;
  saving: boolean;
  onBack: () => void;
  onSubmit: (signatureDataUrl: string) => void;
}

export default function StepAgreements({
  signerName, signerEmail, ssn, address, city, state, zip,
  bankName, routingNumber, accountNumber, accountType,
  saving, onBack, onSubmit,
}: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const allChecked = AGREEMENTS.every(a => checked[a.id]);

  const toggle = (id: string) => setChecked(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-4">
      <p className="text-app-text-3 text-sm">
        Review each document below and check the box to confirm you agree. All 5 must be accepted to complete onboarding.
      </p>

      {AGREEMENTS.map(agreement => {
        let body = agreement.body;

        // For the EFT authorization, append the signer's banking details
        if (agreement.id === "eft-authorization") {
          body += `\n\n--- Your Information ---\nContractor Name: ${signerName}\nSSN / EIN: ${formatSSN(ssn)}\nMailing Address: ${address}, ${city}, ${state} ${zip}\nEmail: ${signerEmail}\nBank Name: ${bankName}\nRouting Number: ${routingNumber}\nAccount Number: ${accountNumber}\nAccount Type: ${accountType.charAt(0).toUpperCase() + accountType.slice(1)}`;
        }

        return (
          <div key={agreement.id} className="bg-app-surface-2 border border-app-border-2 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-app-border bg-app-surface">
              <h3 className="text-sm font-bold text-app-text">{agreement.title}</h3>
            </div>
            <div className="px-5 py-4 max-h-48 overflow-y-auto">
              <pre className="text-app-text-3 text-xs leading-5 whitespace-pre-wrap font-sans">{body}</pre>
            </div>
            <label className="flex items-center gap-3 px-5 py-3 border-t border-app-border cursor-pointer select-none hover:bg-app-surface/50 transition">
              <input
                type="checkbox"
                checked={checked[agreement.id] ?? false}
                onChange={() => toggle(agreement.id)}
                className="w-4 h-4 rounded border-app-border-2 bg-app-surface-2 text-app-accent focus:ring-app-accent focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-app-text-2 text-sm">
                I have read and agree to the <span className="font-semibold text-app-text">{agreement.title}</span>
              </span>
            </label>
          </div>
        );
      })}

      {/* Signature pad */}
      <SignaturePad name={signerName} onSignature={setSignatureDataUrl} />

      {signatureDataUrl && (
        <div className="flex items-center gap-2 px-3 py-2 bg-app-success-soft border border-app-success rounded-lg">
          <svg className="w-4 h-4 text-app-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-app-success text-sm font-medium">Signature adopted</span>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={saving}
          className="flex-1 py-2.5 bg-app-surface-2 border border-app-border-2 text-app-text-3 hover:text-app-text font-semibold rounded-lg transition disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => { if (signatureDataUrl) onSubmit(signatureDataUrl); }}
          disabled={!allChecked || !signatureDataUrl || saving}
          className="flex-1 py-2.5 bg-app-accent hover:bg-app-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
        >
          {saving ? <><Spinner className="w-4 h-4" /> Setting up your account...</> : "Sign & Complete Onboarding"}
        </button>
      </div>
    </div>
  );
}
