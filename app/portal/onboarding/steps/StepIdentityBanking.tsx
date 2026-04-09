"use client";

import { useState } from "react";
import { validateIdentityBanking, formatSSN, stripSSN, US_STATES } from "../validation";

interface Props {
  form: {
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
  };
  onUpdate: (partial: Record<string, unknown>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepIdentityBanking({ form, onUpdate, onNext, onBack }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ssnDisplay, setSsnDisplay] = useState(formatSSN(form.ssn));

  const handleSSNChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = stripSSN(e.target.value);
    onUpdate({ ssn: raw });
    setSsnDisplay(formatSSN(raw));
  };

  const handleNext = () => {
    const errs = validateIdentityBanking(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    onNext();
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-2.5 bg-app-surface-2 border rounded-lg text-app-text placeholder-app-text-4 focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent transition ${
      errors[field] ? "border-red-500" : "border-app-border-2"
    }`;

  return (
    <div className="space-y-6">
      {/* Identity Section */}
      <div>
        <h3 className="text-sm font-semibold text-app-text mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-app-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
          </svg>
          Identity Information
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-app-text-2 mb-1.5">
                Social Security Number <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={ssnDisplay}
                onChange={handleSSNChange}
                placeholder="XXX-XX-XXXX"
                inputMode="numeric"
                className={inputClass("ssn")}
              />
              {errors.ssn && <p className="text-red-400 text-xs mt-1">{errors.ssn}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-app-text-2 mb-1.5">
                Date of Birth <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={form.dob ? form.dob.split("-")[1] : ""}
                  onChange={(e) => {
                    const [y, , d] = (form.dob || "--").split("-");
                    onUpdate({ dob: `${y || "0000"}-${e.target.value}-${d || "01"}` });
                  }}
                  className={inputClass("dob")}
                >
                  <option value="">MM</option>
                  {Array.from({ length: 12 }, (_, i) => {
                    const m = String(i + 1).padStart(2, "0");
                    return <option key={m} value={m}>{m}</option>;
                  })}
                </select>
                <select
                  value={form.dob ? form.dob.split("-")[2] : ""}
                  onChange={(e) => {
                    const [y, m] = (form.dob || "--").split("-");
                    onUpdate({ dob: `${y || "0000"}-${m || "01"}-${e.target.value}` });
                  }}
                  className={inputClass("dob")}
                >
                  <option value="">DD</option>
                  {Array.from({ length: 31 }, (_, i) => {
                    const d = String(i + 1).padStart(2, "0");
                    return <option key={d} value={d}>{d}</option>;
                  })}
                </select>
                <select
                  value={form.dob ? form.dob.split("-")[0] : ""}
                  onChange={(e) => {
                    const [, m, d] = (form.dob || "--").split("-");
                    onUpdate({ dob: `${e.target.value}-${m || "01"}-${d || "01"}` });
                  }}
                  className={inputClass("dob")}
                >
                  <option value="">YYYY</option>
                  {Array.from({ length: 80 }, (_, i) => {
                    const y = String(new Date().getFullYear() - 16 - i);
                    return <option key={y} value={y}>{y}</option>;
                  })}
                </select>
              </div>
              {errors.dob && <p className="text-red-400 text-xs mt-1">{errors.dob}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-app-text-2 mb-1.5">
              Mailing Address <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => onUpdate({ address: e.target.value })}
              placeholder="123 Main St"
              className={inputClass("address")}
            />
            {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-app-text-2 mb-1.5">
                City <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => onUpdate({ city: e.target.value })}
                placeholder="Austin"
                className={inputClass("city")}
              />
              {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-app-text-2 mb-1.5">
                State <span className="text-red-400">*</span>
              </label>
              <select
                value={form.state}
                onChange={(e) => onUpdate({ state: e.target.value })}
                className={`w-full px-4 py-2.5 bg-app-surface-2 border rounded-lg text-app-text focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent transition appearance-none ${
                  errors.state ? "border-red-500" : "border-app-border-2"
                }`}
              >
                <option value="">--</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.state && <p className="text-red-400 text-xs mt-1">{errors.state}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-app-text-2 mb-1.5">
                ZIP <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.zip}
                onChange={(e) => onUpdate({ zip: e.target.value.replace(/\D/g, "").slice(0, 5) })}
                placeholder="78746"
                maxLength={5}
                inputMode="numeric"
                className={inputClass("zip")}
              />
              {errors.zip && <p className="text-red-400 text-xs mt-1">{errors.zip}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Banking Section */}
      <div>
        <h3 className="text-sm font-semibold text-app-text mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-app-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
          </svg>
          Banking Information (EFT Direct Deposit)
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-app-text-2 mb-1.5">
              Bank Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.bankName}
              onChange={(e) => onUpdate({ bankName: e.target.value })}
              placeholder="e.g. Chase, Wells Fargo"
              className={inputClass("bankName")}
            />
            {errors.bankName && <p className="text-red-400 text-xs mt-1">{errors.bankName}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-app-text-2 mb-1.5">
                Routing Number (9 digits) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.routingNumber}
                onChange={(e) => onUpdate({ routingNumber: e.target.value.replace(/\D/g, "").slice(0, 9) })}
                placeholder="9 digits"
                inputMode="numeric"
                className={inputClass("routingNumber")}
              />
              {errors.routingNumber && <p className="text-red-400 text-xs mt-1">{errors.routingNumber}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-app-text-2 mb-1.5">
                Account Number <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.accountNumber}
                onChange={(e) => onUpdate({ accountNumber: e.target.value })}
                placeholder="Account number"
                className={inputClass("accountNumber")}
              />
              {errors.accountNumber && <p className="text-red-400 text-xs mt-1">{errors.accountNumber}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-app-text-2 mb-1.5">
              Account Type <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-4">
              {(["checking", "savings"] as const).map(type => (
                <label key={type} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="accountType"
                    value={type}
                    checked={form.accountType === type}
                    onChange={() => onUpdate({ accountType: type })}
                    className="w-4 h-4 text-app-accent focus:ring-app-accent"
                  />
                  <span className="text-sm text-app-text-2 capitalize">{type}</span>
                </label>
              ))}
            </div>
            {errors.accountType && <p className="text-red-400 text-xs mt-1">{errors.accountType}</p>}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-2.5 bg-app-surface-2 border border-app-border-2 text-app-text-3 hover:text-app-text font-semibold rounded-lg transition"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="flex-1 py-2.5 bg-app-accent hover:bg-app-accent-hover text-white font-semibold rounded-lg transition"
        >
          Next: Review & Sign
        </button>
      </div>
    </div>
  );
}
