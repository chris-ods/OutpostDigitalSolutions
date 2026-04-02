"use client";

import { useCallback } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import { ReceiptScanner, ReceiptList } from "ods-ui-library";
import type { ReceiptRecord } from "ods-ui-library";
import { useAuth } from "../hooks/useAuth";
import { useReceiptList } from "../hooks/useReceiptList";

async function processReceipt(file: File, uid: string): Promise<Partial<ReceiptRecord>> {
  // 1 — Upload to Storage
  const filePath = `receipts/${uid}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const storageRef = ref(storage, filePath);
  await uploadBytes(storageRef, file, { contentType: file.type });
  const fileUrl = await getDownloadURL(storageRef);

  // 2 — Parse with Gemini
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/scan-receipt", { method: "POST", body: form });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? `Server error ${res.status}`);
  }

  return { ...await res.json(), fileUrl, filePath };
}

export default function ReceiptsSection() {
  const { user } = useAuth();
  const uid = user?.uid ?? "";
  const { receipts, loading, onSave, onUpdate, onDelete } = useReceiptList(uid);

  const handleProcess = useCallback(
    (file: File) => processReceipt(file, uid),
    [uid]
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div>
        <h3 className="text-white font-semibold text-lg">Receipts</h3>
        <p className="text-gray-500 text-sm mt-0.5">
          Upload a receipt — Gemini reads it and fills the form. Files are stored securely per account.
        </p>
      </div>

      {/* Upload + review */}
      <ReceiptScanner
        receipts={receipts}
        processReceipt={handleProcess}
        onSave={onSave}
      />

      {/* Full data table */}
      <div className="flex-1 min-h-0" style={{ minHeight: 400 }}>
        <ReceiptList
          receipts={receipts}
          loading={loading}
          onSave={onUpdate}
          onDelete={onDelete}
          listTitle="Receipts"
        />
      </div>
    </div>
  );
}
