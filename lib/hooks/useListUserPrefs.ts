"use client";

import { useState, useEffect, useCallback } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { OdsListView } from "ods-ui-library";

interface ListUserPrefs {
  fontSize?: string;
  views?: OdsListView[];
}

function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Per-user, per-list preferences stored in Firestore.
 * Path: users/{uid}/listPrefs/{listKey}
 *
 * Holds:
 *  - fontSize and other accessibility prefs
 *  - The user's saved views (per-user, NOT global)
 */
export function useListUserPrefs(uid: string | undefined, listKey: string) {
  const [prefs, setPrefs] = useState<ListUserPrefs>({});
  const [views, setViews] = useState<OdsListView[]>([]);

  // Real-time sync so changes from another tab/device show up immediately.
  useEffect(() => {
    if (!uid || !listKey) return;
    const ref = doc(db, "users", uid, "listPrefs", listKey);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = (snap.exists() ? (snap.data() as ListUserPrefs) : {}) ?? {};
        setPrefs(data);
        setViews(Array.isArray(data.views) ? data.views : []);
      },
      (err) => { console.error(`listPrefs[${listKey}] listener failed:`, err); },
    );
    return () => unsub();
  }, [uid, listKey]);

  const savePrefs = useCallback(async (p: Partial<ListUserPrefs>) => {
    if (!uid || !listKey) return;
    await setDoc(doc(db, "users", uid, "listPrefs", listKey), p, { merge: true });
  }, [uid, listKey]);

  /**
   * Persist a new view for this user. If the view is being marked as default,
   * isDefault is cleared from any existing views first so only one is default.
   */
  const saveView = useCallback(async (view: Omit<OdsListView, "id">): Promise<string> => {
    if (!uid || !listKey) throw new Error("saveView called before user is ready");
    const id = genId();
    const cleaned = view.isDefault
      ? views.map((v) => ({ ...v, isDefault: false }))
      : views;
    const next = [...cleaned, { ...view, id }];
    await setDoc(
      doc(db, "users", uid, "listPrefs", listKey),
      { views: next },
      { merge: true },
    );
    return id;
  }, [uid, listKey, views]);

  const deleteView = useCallback(async (id: string) => {
    if (!uid || !listKey) return;
    const next = views.filter((v) => v.id !== id);
    await setDoc(
      doc(db, "users", uid, "listPrefs", listKey),
      { views: next },
      { merge: true },
    );
  }, [uid, listKey, views]);

  return { prefs, savePrefs, views, saveView, deleteView };
}
