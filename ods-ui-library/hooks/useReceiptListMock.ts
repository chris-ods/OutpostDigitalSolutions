/**
 * useReceiptListMock
 *
 * Local-state version of a receipt list — no Firebase, no backend.
 * Use this in the ODS portal demo, Storybook stories, and unit tests.
 *
 * Drop-in pattern (future Firestore hook would match this interface):
 *   const props = useReceiptListMock();
 */

import { useState, useCallback } from "react";
import type { ReceiptRecord } from "../ReceiptScanner";

export interface UseReceiptListResult {
  receipts: ReceiptRecord[];
  onSave: (record: Omit<ReceiptRecord, "id" | "createdAt">) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export interface ReceiptMockOptions {
  /** Seed receipts to pre-populate the list. */
  initialReceipts?: ReceiptRecord[];
}

export function useReceiptListMock(
  options: ReceiptMockOptions = {}
): UseReceiptListResult {
  const [receipts, setReceipts] = useState<ReceiptRecord[]>(
    options.initialReceipts ?? []
  );

  const onSave = useCallback(
    async (record: Omit<ReceiptRecord, "id" | "createdAt">) => {
      const full: ReceiptRecord = {
        ...record,
        id: uid(),
        createdAt: new Date().toISOString(),
      };
      setReceipts((prev) => [full, ...prev]);
    },
    []
  );

  const onDelete = useCallback(async (id: string) => {
    setReceipts((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return { receipts, onSave, onDelete };
}
