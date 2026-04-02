"use client";

import { useCallback } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import { ReceiptScanner } from "ods-ui-library";
import type { ReceiptRecord } from "ods-ui-library";
import { useAuth } from "../hooks/useAuth";
import { useReceiptList } from "../hooks/useReceiptList";

/**
 * Upload the file to Firebase Storage under receipts/{uid}/{timestamp}_{filename},
 * then POST it to the Gemini API route for parsing.
 * Returns the parsed receipt fields plus the Storage URL and path.
 */
async function processReceipt(
  file: File,
  uid: string
): Promise<Partial<ReceiptRecord>> {
  // 1 — Upload to Storage
  const ext = file.name.split(".").pop() ?? "bin";
  const filePath = `receipts/${uid}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const storageRef = ref(storage, filePath);
  await uploadBytes(storageRef, file, { contentType: file.type });
  const fileUrl = await getDownloadURL(storageRef);

  // 2 — Parse with Gemini (server-side route)
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

  const parsed = await res.json();

  // 3 — Return parsed fields + storage metadata
  return { ...parsed, fileUrl, filePath };
}

export default function ReceiptsSection() {
  const { user } = useAuth();
  const uid = user?.uid ?? "";
  const { receipts, loading, onSave, onDelete } = useReceiptList(uid);

  const handleProcessReceipt = useCallback(
    (file: File) => processReceipt(file, uid),
    [uid]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-white font-semibold text-lg">Receipts</h3>
        <p className="text-gray-500 text-sm mt-0.5">
          Upload a receipt photo or PDF — Gemini reads it and fills the form.
          Files are stored securely and receipts persist to your account.
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
          processReceipt={handleProcessReceipt}
          onSave={onSave}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}
