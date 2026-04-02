"use client";

import { useCallback } from "react";
import { ReceiptScanner, useReceiptListMock } from "ods-ui-library";
import type { ReceiptRecord } from "ods-ui-library";

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
  const { receipts, onSave, onDelete } = useReceiptListMock();

  const processReceipt = useCallback(callScanReceipt, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-white font-semibold text-lg">Receipts</h3>
        <p className="text-gray-500 text-sm mt-0.5">
          Upload a receipt photo or PDF — Gemini reads it and fills the form for you.
        </p>
      </div>

      <ReceiptScanner
        receipts={receipts}
        processReceipt={processReceipt}
        onSave={onSave}
        onDelete={onDelete}
      />
    </div>
  );
}
