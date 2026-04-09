"use client";

import { useState, useEffect, useCallback } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

interface ListUserPrefs {
  fontSize?: string;
}

/**
 * Per-user, per-list accessibility preferences stored in Firestore.
 * Path: users/{uid}/listPrefs/{listKey}
 */
export function useListUserPrefs(uid: string | undefined, listKey: string) {
  const [prefs, setPrefs] = useState<ListUserPrefs>({});

  useEffect(() => {
    if (!uid || !listKey) return;
    getDoc(doc(db, "users", uid, "listPrefs", listKey))
      .then(snap => { if (snap.exists()) setPrefs(snap.data() as ListUserPrefs); })
      .catch(() => {});
  }, [uid, listKey]);

  const savePrefs = useCallback(async (p: ListUserPrefs) => {
    if (!uid || !listKey) return;
    await setDoc(doc(db, "users", uid, "listPrefs", listKey), p, { merge: true });
    setPrefs(prev => ({ ...prev, ...p }));
  }, [uid, listKey]);

  return { prefs, savePrefs };
}
