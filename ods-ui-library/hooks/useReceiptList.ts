/**
 * useReceiptList
 *
 * Firestore-backed hook for the ReceiptScanner component.
 *
 * Data layout in Firestore:
 *   /receipts/{docId}   ← receipt records scoped per user via uid field
 *
 * Storage layout (managed by the consuming app, path stored here):
 *   receipts/{uid}/{timestamp}_{filename}
 *
 * Usage:
 *   const { receipts, loading, onSave, onDelete } = useReceiptList(user.uid);
 */

import { useEffect, useState, useCallback } from "react";
import { getApps, initializeApp, FirebaseApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  serverTimestamp,
  Firestore,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  deleteObject,
  FirebaseStorage,
} from "firebase/storage";

import type { ReceiptRecord } from "../ReceiptScanner";
import { firebaseConfig } from "../firebase.config";

// ─── Singleton Firebase init ──────────────────────────────────────────────────

let _app: FirebaseApp;
let _db: Firestore;
let _storage: FirebaseStorage;

function getDB(): Firestore {
  if (!_db) {
    _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    _db = getFirestore(_app);
  }
  return _db;
}

function getStorageInstance(): FirebaseStorage {
  if (!_storage) {
    _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    _storage = getStorage(_app);
  }
  return _storage;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseReceiptListResult {
  receipts: ReceiptRecord[];
  loading: boolean;
  onSave: (record: Omit<ReceiptRecord, "id" | "createdAt">) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const RECEIPTS_COLLECTION = "receipts";

export function useReceiptList(uid: string): UseReceiptListResult {
  const firestore = getDB();
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Live sync — only this user's receipts, newest first ───────────────────
  useEffect(() => {
    if (!uid) {
      setReceipts([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(firestore, RECEIPTS_COLLECTION),
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
  }, [uid, firestore]);

  // ── Save — Firestore doc (Storage upload handled in the consuming component)
  const onSave = useCallback(
    async (record: Omit<ReceiptRecord, "id" | "createdAt">) => {
      await addDoc(collection(firestore, RECEIPTS_COLLECTION), {
        ...record,
        uid,
        createdAt: serverTimestamp(),
      });
    },
    [uid, firestore]
  );

  // ── Delete — removes Firestore doc AND the Storage file if filePath exists ─
  const onDelete = useCallback(
    async (id: string) => {
      // Find the receipt to get its filePath before deleting the Firestore doc
      const receipt = receipts.find((r) => r.id === id);

      await deleteDoc(doc(firestore, RECEIPTS_COLLECTION, id));

      if (receipt?.filePath) {
        try {
          const storageRef = ref(getStorageInstance(), receipt.filePath);
          await deleteObject(storageRef);
        } catch (err) {
          // Log but don't throw — Firestore delete succeeded, Storage cleanup is best-effort
          console.warn("[useReceiptList] Storage delete failed:", err);
        }
      }
    },
    [firestore, receipts]
  );

  return { receipts, loading, onSave, onDelete };
}
