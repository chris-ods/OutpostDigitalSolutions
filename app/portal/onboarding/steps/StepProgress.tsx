"use client";

const STEPS = ["Info", "Identity & Banking", "Agreements"] as const;

export default function StepProgress({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && (
              <div className={`w-8 h-px ${done || active ? "bg-app-accent" : "bg-app-border-2"}`} />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition ${
                  done
                    ? "bg-app-accent border-app-accent text-white"
                    : active
                    ? "bg-app-accent/20 border-app-accent text-app-accent"
                    : "bg-app-surface-2 border-app-border-2 text-app-text-4"
                }`}
              >
                {done ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step
                )}
              </div>
              <span
                className={`text-xs font-medium hidden sm:inline ${
                  active ? "text-app-text" : done ? "text-app-text-3" : "text-app-text-4"
                }`}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
