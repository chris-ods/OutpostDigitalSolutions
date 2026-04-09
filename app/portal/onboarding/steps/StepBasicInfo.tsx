"use client";

import { useState } from "react";
import { validateBasicInfo, formatPhoneDisplay, stripDigits, toE164 } from "../validation";

interface Props {
  form: {
    firstName: string;
    lastName: string;
    email: string;
    phoneDigits: string;
    comments: string;
  };
  selectedTeam: number;
  teamCount: number;
  onUpdate: (partial: Record<string, unknown>) => void;
  onNext: () => void;
}

const COMMENTS_MAX = 500;

export default function StepBasicInfo({ form, selectedTeam, teamCount, onUpdate, onNext }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phoneDisplay, setPhoneDisplay] = useState(formatPhoneDisplay(form.phoneDigits));

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = stripDigits(e.target.value);
    onUpdate({ phoneDigits: digits });
    setPhoneDisplay(formatPhoneDisplay(digits));
  };

  const handleNext = () => {
    const errs = validateBasicInfo({ ...form, selectedTeam });
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    onNext();
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-2.5 bg-app-surface-2 border rounded-lg text-app-text placeholder-app-text-4 focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent transition ${
      errors[field] ? "border-red-500" : "border-app-border-2"
    }`;

  const teams = Array.from({ length: teamCount }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-app-text-2 mb-1.5">
            First Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.firstName}
            onChange={(e) => onUpdate({ firstName: e.target.value })}
            placeholder="First"
            className={inputClass("firstName")}
          />
          {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-app-text-2 mb-1.5">
            Last Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.lastName}
            onChange={(e) => onUpdate({ lastName: e.target.value })}
            placeholder="Last"
            className={inputClass("lastName")}
          />
          {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-app-text-2 mb-1.5">
          Email <span className="text-red-400">*</span>
        </label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => onUpdate({ email: e.target.value })}
          placeholder="your@email.com"
          className={inputClass("email")}
        />
        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-app-text-2 mb-1.5">
          Phone Number <span className="text-red-400">*</span>
        </label>
        <input
          type="tel"
          value={phoneDisplay}
          onChange={handlePhoneChange}
          placeholder="(555) 000-0000"
          inputMode="numeric"
          className={inputClass("phone")}
        />
        <div className="flex items-center justify-between mt-1">
          {errors.phone
            ? <p className="text-red-400 text-xs">{errors.phone}</p>
            : <p className="text-app-text-5 text-xs">US numbers only</p>
          }
          {form.phoneDigits.length === 10 && (
            <p className="text-app-text-4 text-xs font-mono">{toE164(form.phoneDigits)}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-app-text-2 mb-1.5">
          Your Team <span className="text-red-400">*</span>
        </label>
        <select
          value={selectedTeam || ""}
          onChange={(e) => onUpdate({ selectedTeam: Number(e.target.value) })}
          className={`w-full px-4 py-2.5 bg-app-surface-2 border rounded-lg text-app-text focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent transition appearance-none ${
            errors.team ? "border-red-500" : "border-app-border-2"
          }`}
        >
          <option value="" disabled className="text-app-text-4">Select your team...</option>
          {teams.map((n) => <option key={n} value={n}>Team {n}</option>)}
        </select>
        {errors.team && <p className="text-red-400 text-xs mt-1">{errors.team}</p>}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-app-text-2">
            About You <span className="text-app-text-5 text-xs font-normal">(optional)</span>
          </label>
          <span className={`text-xs ${form.comments.length > COMMENTS_MAX ? "text-red-400" : "text-app-text-5"}`}>
            {form.comments.length}/{COMMENTS_MAX}
          </span>
        </div>
        <textarea
          value={form.comments}
          onChange={(e) => {
            if (e.target.value.length <= COMMENTS_MAX) onUpdate({ comments: e.target.value });
          }}
          placeholder="Tell us something about yourself..."
          rows={3}
          className="w-full px-4 py-2.5 bg-app-surface-2 border border-app-border-2 rounded-lg text-app-text placeholder-app-text-4 focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent transition resize-none"
        />
      </div>

      <button
        type="button"
        onClick={handleNext}
        className="w-full py-2.5 px-4 bg-app-accent hover:bg-app-accent-hover text-white font-semibold rounded-lg transition"
      >
        Next: Identity & Banking
      </button>
    </div>
  );
}
