/**
 * useClientList
 *
 * Firestore-backed hook for the OdsList component.
 * Each call is scoped to a single Firestore collection (e.g. "clients").
 *
 * Data layout in Firestore:
 *   /{collectionId}/{docId}                  ← client records
 *   /{collectionId}/_config/views/{viewId}   ← saved views for this list
 *   /{collectionId}/_config                  ← permissions matrix for this list
 *
 * Usage:
 *   const props = useClientList("clients");
 *   return <OdsList {...props} uid={user.uid} userName={user.displayName} />;
 *
 * To wire up a new portal:
 *   1. Update firebase.config.ts with the project credentials.
 *   2. Call this hook with the Firestore collection name for each list.
 *   3. Pass the returned props spread to <OdsList />.
 *
 * Note: _config is an intermediate document (even segments) that enables
 * the views subcollection (odd segments). Firestore requires alternating
 * collection/document path segments.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
  arrayUnion,
  Firestore,
  serverTimestamp,
} from "firebase/firestore";

import type { OdsRecord, OdsListView, ChangeRecord, FilterRow, PermissionsMatrix } from "../ClientList";
import { DEFAULT_PERMISSIONS } from "../ClientList";
import { firebaseConfig } from "../firebase.config";

// ─── Singleton Firebase init ──────────────────────────────────────────────────
// Guard against double-init (React StrictMode, HMR, multiple hooks on same page)

let app: FirebaseApp;
let db: Firestore;

function getDB(): Firestore {
  if (!db) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
  }
  return db;
}

// ─── Return type ─────────────────────────────────────────────────────────────

export interface UseClientListResult {
  data: OdsRecord[];
  views: OdsListView[];
  permissions: PermissionsMatrix;
  loading: boolean;
  hasMore: boolean;
  listTitle: string;
  onSave: (id: string, field: string, value: string | number, updaterName: string, fromValue?: string | number) => Promise<void>;
  onSaveView: (view: Omit<OdsListView, "id">) => Promise<string>;
  onDeleteView: (id: string) => Promise<void>;
  onSavePermissions: (matrix: PermissionsMatrix) => Promise<void>;
  onRenameList: (name: string) => Promise<void>;
  onLoadMore: () => Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * @param collectionId  Firestore collection name — e.g. "clients", "leads".
 *                      This doubles as the document ID in /permissions/{collectionId}.
 */
const PAGE_SIZE = 30;

export function useClientList(collectionId: string): UseClientListResult {
  const firestore = getDB();

  const [clients, setClients] = useState<OdsRecord[]>([]);
  const [views, setViews] = useState<OdsListView[]>([]);
  const [permissions, setPermissions] = useState<PermissionsMatrix>(DEFAULT_PERMISSIONS);
  const [listTitle, setListTitle] = useState(collectionId);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  // Current window size — incrementing this re-subscribes with a larger limit.
  const [pageLimit, setPageLimit] = useState(PAGE_SIZE);
  // Prevent concurrent load-more clicks from stacking.
  const loadingMore = useRef(false);

  // ── Clients live sync (paginated) ─────────────────────────────────────────
  // Fetch pageLimit + 1 docs so we can tell if there is a next page without
  // a separate count query. Only the first pageLimit docs are exposed.
  // orderBy("date", "desc") means documents without a `date` field are excluded,
  // which also naturally filters out meta docs (_meta, _views) that have no date.
  useEffect(() => {
    const q = query(
      collection(firestore, collectionId),
      orderBy("date", "desc"),
      limit(pageLimit + 1),
    );
    const unsub = onSnapshot(q, (snap) => {
      const allDocs = snap.docs.filter((d) => !d.id.startsWith("_"));
      setHasMore(allDocs.length > pageLimit);
      const records: OdsRecord[] = allDocs
        .slice(0, pageLimit)
        .map((d) => ({ id: d.id, ...d.data() } as OdsRecord));
      setClients(records);
      setLoading(false);
      loadingMore.current = false;
    }, (err) => {
      console.error(`[useClientList] clients onSnapshot error (${collectionId}):`, err);
      setLoading(false);
      loadingMore.current = false;
    });
    return () => unsub();
  }, [collectionId, firestore, pageLimit]);

  // ── Views live sync ────────────────────────────────────────────────────────
  useEffect(() => {
    const viewsRef = collection(firestore, collectionId, "_config", "views");
    const unsub = onSnapshot(viewsRef, (snap) => {
      const saved: OdsListView[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<OdsListView, "id">),
      }));
      setViews(saved);
    }, (err) => {
      console.error(`[useClientList] views onSnapshot error (${collectionId}):`, err);
    });
    return () => unsub();
  }, [collectionId, firestore]);

  // ── Permissions load (not live — changes are intentional and infrequent) ───
  useEffect(() => {
    const permRef = doc(firestore, collectionId, "_config");
    getDoc(permRef).then((snap) => {
      if (snap.exists()) {
        setPermissions(snap.data() as PermissionsMatrix);
      }
    }).catch((err) => {
      console.error(`[useClientList] permissions load error (${collectionId}):`, err);
    });
  }, [collectionId, firestore]);

  // ── Callbacks ─────────────────────────────────────────────────────────────

  const onSave = useCallback(async (
    id: string,
    field: string,
    value: string | number,
    updaterName: string,
    fromValue?: string | number,
  ) => {
    const docRef = doc(firestore, collectionId, id);
    // serverTimestamp() cannot be nested inside arrayUnion objects — use client-side timestamp.
    const changeEntry: ChangeRecord = {
      at: { seconds: Math.floor(Date.now() / 1000) },
      by: updaterName,
      field,
      from: String(fromValue ?? ""),
      to: String(value),
    };
    await updateDoc(docRef, {
      [field]: value,
      updatedAt: serverTimestamp(),
      updatedByName: updaterName,
      changeLog: arrayUnion(changeEntry),
    });
  }, [collectionId, firestore]);

  const onSaveView = useCallback(async (view: Omit<OdsListView, "id">): Promise<string> => {
    const viewsRef = collection(firestore, collectionId, "_config", "views");
    const docRef = await addDoc(viewsRef, { ...view, createdAt: serverTimestamp() });
    return docRef.id;
  }, [collectionId, firestore]);

  const onDeleteView = useCallback(async (id: string) => {
    const viewRef = doc(firestore, collectionId, "_config", "views", id);
    await deleteDoc(viewRef);
  }, [collectionId, firestore]);

  const onRenameList = useCallback(async (name: string) => {
    const metaRef = doc(firestore, collectionId, "_meta");
    await setDoc(metaRef, { title: name }, { merge: true });
    setListTitle(name);
  }, [collectionId, firestore]);

  const onSavePermissions = useCallback(async (matrix: PermissionsMatrix) => {
    const permRef = doc(firestore, collectionId, "_config");
    await setDoc(permRef, matrix, { merge: true });
    setPermissions(matrix); // optimistic update
  }, [collectionId, firestore]);

  const onLoadMore = useCallback(async () => {
    if (loadingMore.current || !hasMore) return;
    loadingMore.current = true;
    // Expanding the limit re-triggers the onSnapshot above, which will set
    // loadingMore.current = false once the new batch arrives.
    setPageLimit((prev) => prev + PAGE_SIZE);
  }, [hasMore]);

  return {
    data: clients,
    views,
    permissions,
    loading,
    hasMore,
    listTitle,
    onSave,
    onSaveView,
    onDeleteView,
    onSavePermissions,
    onRenameList,
    onLoadMore,
  };
}
