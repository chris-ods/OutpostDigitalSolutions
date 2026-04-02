/**
 * useReceiptList — portal-local version
 *
 * Uses the portal's existing Firebase instance (src/firebase.ts) rather than
 * the library's own Firebase init, which requires NEXT_PUBLIC_FIREBASE_* env vars.
 *
 * Firestore layout:  /receipts/{docId}  — uid field scopes per user
 * Storage layout:    receipts/{uid}/{timestamp}_{filename}
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "../firebase";
import type { ReceiptRecord } from "ods-ui-library";

const RECEIPTS_COLLECTION = "receipts";

export interface UseReceiptListResult {
  receipts: ReceiptRecord[];
  loading: boolean;
  onSave: (record: Omit<ReceiptRecord, "id" | "createdAt">) => Promise<void>;
  onUpdate: (id: string, field: string, value: string | number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function useReceiptList(uid: string): UseReceiptListResult {
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setReceipts([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, RECEIPTS_COLLECTION),
      where("uid", "==", uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const records: ReceiptRecord[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            ...(data as Omit<ReceiptRecord, "id">),
            id: d.id,
            createdAt:
              typeof data.createdAt?.toDate === "function"
                ? data.createdAt.toDate().toISOString()
                : String(data.createdAt ?? ""),
          };
        });
        setReceipts(records);
        setLoading(false);
      },
      (err) => {
        console.error("[useReceiptList] onSnapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [uid]);

  const onSave = useCallback(
    async (record: Omit<ReceiptRecord, "id" | "createdAt">) => {
      await addDoc(collection(db, RECEIPTS_COLLECTION), {
        ...record,
        uid,
        createdAt: serverTimestamp(),
      });
    },
    [uid]
  );

  const onUpdate = useCallback(
    async (id: string, field: string, value: string | number) => {
      await updateDoc(doc(db, RECEIPTS_COLLECTION, id), { [field]: value });
    },
    []
  );

  const onDelete = useCallback(
    async (id: string) => {
      const receipt = receipts.find((r) => r.id === id);
      await deleteDoc(doc(db, RECEIPTS_COLLECTION, id));
      if (receipt?.filePath) {
        try {
          await deleteObject(ref(storage, receipt.filePath));
        } catch (err) {
          console.warn("[useReceiptList] Storage delete failed:", err);
        }
      }
    },
    [receipts]
  );

  return { receipts, loading, onSave, onUpdate, onDelete };
}
