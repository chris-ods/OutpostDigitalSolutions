"use client";

import { useEffect } from "react";

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-app-bg gap-5 p-8">
      <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
        <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <div className="text-center max-w-sm">
        <p className="text-app-text font-semibold text-base mb-1">Something went wrong</p>
        <p className="text-app-text-4 text-sm leading-relaxed">
          {error.message || "An unexpected error occurred on this page."}
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="px-5 py-2 bg-app-surface-2 hover:bg-app-surface-2 border border-app-border-2 text-app-text text-sm font-medium rounded-lg transition"
      >
        Try again
      </button>
    </div>
  );
}
