"use client";

import { useCallback } from "react";
import { ReceiptScanner, useReceiptList } from "ods-ui-library";
import type { ReceiptRecord } from "ods-ui-library";
import { useAuth } from "../hooks/useAuth";

async function callScanReceipt(file: File): Promise<Partial<ReceiptRecord>> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch("/api/scan-receipt", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { error?: string }).error ?? `Server error ${res.status}`
    );
  }

  return res.json();
}

export default function ReceiptsSection() {
  const { user } = useAuth();
  const { receipts, loading, onSave, onDelete } = useReceiptList(user?.uid ?? "");

  const processReceipt = useCallback(callScanReceipt, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-white font-semibold text-lg">Receipts</h3>
        <p className="text-gray-500 text-sm mt-0.5">
          Upload a receipt photo or PDF — Gemini reads it and fills the form for you.
          Receipts are saved to your account.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <svg className="w-5 h-5 animate-spin text-gray-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : (
        <ReceiptScanner
          receipts={receipts}
          processReceipt={processReceipt}
          onSave={onSave}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}
