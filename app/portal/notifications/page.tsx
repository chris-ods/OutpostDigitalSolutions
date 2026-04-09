"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { collection, getDocs, doc, updateDoc, deleteDoc, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { isAdminLevel, avatarColor } from "../../../lib/types";
import { useUserClaim } from "../../../lib/hooks/useUserClaim";
import { useAuthGuard } from "../../../lib/hooks/useAuthGuard";
import { Spinner } from "../../../lib/components/Spinner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(ts: unknown): string {
  if (!ts || typeof ts !== "object" || !("seconds" in (ts as Record<string, unknown>))) return "\u2014";
  return new Date((ts as { seconds: number }).seconds * 1000).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function timeAgo(ts: unknown): string {
  if (!ts || typeof ts !== "object" || !("seconds" in (ts as Record<string, unknown>))) return "";
  const diff = Date.now() - (ts as { seconds: number }).seconds * 1000;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return fmtDate(ts);
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const cls = s === "approved" ? "bg-green-500/15 text-green-400 border-green-500/30"
    : s === "rejected" ? "bg-red-500/15 text-red-400 border-red-500/30"
    : "bg-amber-500/15 text-amber-400 border-amber-500/30";
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${cls}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface JoinRequest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  teamNumber: number;
  status: string;
  comments: string;
  submittedAt: unknown;
  photoDataURL: string;
}

interface RecentDoc {
  id: string;
  name: string;
  fileName: string;
  category: string;
  uploadedByName: string;
  uploadedAt: unknown;
  storageUrl: string;
  uploadedBy: string;
  uploadedByTeam: number;
}

interface BirthdayUser {
  uid: string;
  firstName: string;
  lastName: string;
  photoURL: string;
  birthday: string;
  daysAway: number;
  displayDate: string;
}

interface PayrollNotif {
  id: string;
  type: "locked" | "paid";
  periodStart: string;
  periodEnd: string;
  payday: string;
  totalPayroll: number;
  employeeCount: number;
  lockedBy?: string;
  paidBy?: string;
  createdAt: unknown;
}

interface StatusChangeNotif {
  id: string;
  type: "statusChange";
  clientId: string;
  clientName: string;
  carrier: string;
  appNumber: string;
  field: string;
  fromValue: string;
  toValue: string;
  changedBy: string;
  changedByUid: string;
  agentId: string;
  agentName: string;
  teamNumber: number;
  createdAt: unknown;
  visibleTo: string[];
  visibleToUids: string[];
}

// Unified notification item for the email-like list
type NotifItem =
  | { kind: "birthday"; key: string; user: BirthdayUser }
  | { kind: "document"; key: string; doc: RecentDoc }
  | { kind: "request"; key: string; req: JoinRequest }
  | { kind: "payroll"; key: string; notif: PayrollNotif }
  | { kind: "statusChange"; key: string; notif: StatusChangeNotif };

// ─── Birthday calculation ─────────────────────────────────────────────────────

function getWeekBirthdays(
  users: { uid: string; firstName: string; lastName: string; photoURL: string; birthday: string }[],
): BirthdayUser[] {
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayDateOnly = new Date(todayYear, today.getMonth(), today.getDate());
  const day = todayDateOnly.getDay();
  const monday = new Date(todayDateOnly);
  monday.setDate(todayDateOnly.getDate() - (day === 0 ? 6 : day - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return users
    .filter(u => u.birthday && u.birthday.includes("-"))
    .map(u => {
      const [mmStr, ddStr] = u.birthday.split("-");
      const mm = parseInt(mmStr, 10);
      const dd = parseInt(ddStr, 10);
      if (isNaN(mm) || isNaN(dd)) return null;
      const bdayThisYear = new Date(todayYear, mm - 1, dd);
      if (bdayThisYear < monday || bdayThisYear > sunday) return null;
      const diffMs = bdayThisYear.getTime() - todayDateOnly.getTime();
      const daysAway = Math.round(diffMs / (1000 * 60 * 60 * 24));
      const displayDate = bdayThisYear.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      return { ...u, daysAway, displayDate };
    })
    .filter((u): u is BirthdayUser => u !== null)
    .sort((a, b) => a.daysAway - b.daysAway);
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

function getStoredSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch { return new Set(); }
}

function storeSet(key: string, set: Set<string>) {
  try { localStorage.setItem(key, JSON.stringify([...set])); } catch { /* ignore */ }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const guard = useAuthGuard("any");
  const claim = useUserClaim();

  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [recentDocs, setRecentDocs] = useState<RecentDoc[]>([]);
  const [birthdayUsers, setBirthdayUsers] = useState<BirthdayUser[]>([]);
  const [payrollNotifs, setPayrollNotifs] = useState<PayrollNotif[]>([]);
  const [statusChangeNotifs, setStatusChangeNotifs] = useState<StatusChangeNotif[]>([]);
  const [loading, setLoading] = useState(true);
  const [birthdayLoading, setBirthdayLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{ id: string; resetLink?: string; contractorId?: string; error?: string } | null>(null);

  // Email-like state
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [readItems, setReadItems] = useState<Set<string>>(new Set());
  const [deletedItems, setDeletedItems] = useState<Set<string>>(new Set());

  const role = claim.profile?.role ?? "rep";
  const isAdmin = isAdminLevel(role);
  const storagePrefix = claim.uid ?? "anon";

  // Load read/deleted state from localStorage
  useEffect(() => {
    if (!claim.uid) return;
    setReadItems(getStoredSet(`notifRead_${claim.uid}`));
    setDeletedItems(getStoredSet(`notifDeleted_${claim.uid}`));
  }, [claim.uid]);

  // Record last-seen timestamp
  useEffect(() => {
    if (!claim.uid) return;
    try { localStorage.setItem(`notifLastSeen_${claim.uid}`, Date.now().toString()); } catch { /* ignore */ }
  }, [claim.uid]);

  // ── Load join requests ──────────────────────────────────────────────────
  useEffect(() => {
    if (!guard.ready) return;
    if (!isAdmin) { setLoading(false); return; }
    getDocs(collection(db, "onboardingRequests")).then(snap => {
      setRequests(snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          firstName: (data.firstName as string) ?? "",
          lastName: (data.lastName as string) ?? "",
          email: (data.email as string) ?? "",
          phone: (data.phone as string) ?? "",
          teamNumber: (data.teamNumber as number) ?? 0,
          status: (data.status as string) ?? "pending",
          comments: (data.comments as string) ?? "",
          submittedAt: data.submittedAt ?? null,
          photoDataURL: (data.photoDataURL as string) ?? "",
        };
      }).sort((a, b) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (b.status === "pending" && a.status !== "pending") return 1;
        return 0;
      }));
      setLoading(false);
    }).catch(err => { setError(err.message); setLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guard.ready]);

  // ── Load recent documents (real-time, role-scoped like documents page) ───
  useEffect(() => {
    if (!guard.ready || !claim.uid || !claim.profile) return;
    const uid = claim.uid;
    const userRole = claim.profile.role;
    const teamNumber = claim.profile.teamNumber;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Server-side role scoping — matches documents page query logic
    let q;
    if (isAdminLevel(userRole)) {
      q = query(collection(db, "documents"), orderBy("uploadedAt", "desc"));
    } else if (userRole === "manager") {
      q = query(collection(db, "documents"), where("uploadedByTeam", "==", teamNumber));
    } else {
      q = query(collection(db, "documents"), where("uploadedBy", "==", uid));
    }

    const unsub = onSnapshot(
      q,
      snap => {
        let docs: RecentDoc[] = snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            name: (data.name as string) ?? "",
            fileName: (data.fileName as string) ?? "",
            category: (data.category as string) ?? "",
            uploadedByName: (data.uploadedByName as string) ?? "",
            uploadedAt: data.uploadedAt ?? null,
            storageUrl: (data.storageUrl as string) ?? "",
            uploadedBy: (data.uploadedBy as string) ?? "",
            uploadedByTeam: (data.uploadedByTeam as number) ?? 0,
          };
        });
        // Filter to last 7 days
        docs = docs.filter(d => {
          const ts = d.uploadedAt as { seconds: number } | null;
          return ts?.seconds ? ts.seconds * 1000 > sevenDaysAgo.getTime() : false;
        });
        setRecentDocs(docs);
      },
      () => {},
    );
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guard.ready, claim.uid, claim.profile?.role]);

  // ── Load birthdays ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!guard.ready) return;
    getDocs(collection(db, "users")).then(snap => {
      const users = snap.docs
        .map(d => {
          const data = d.data();
          return {
            uid: d.id,
            firstName: (data.firstName as string) ?? "",
            lastName: (data.lastName as string) ?? "",
            photoURL: (data.photoURL as string) ?? "",
            birthday: (data.birthday as string) ?? "",
            active: data.active as boolean,
          };
        })
        .filter(u => u.active !== false && u.birthday !== "");
      setBirthdayUsers(getWeekBirthdays(users));
      setBirthdayLoading(false);
    }).catch(() => setBirthdayLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guard.ready]);

  // ── Load payroll + status change notifications ─────────────────────────
  useEffect(() => {
    if (!guard.ready || !claim.uid || !claim.profile) return;
    const userRole = claim.profile.role;
    const uid = claim.uid;
    const unsub = onSnapshot(
      query(collection(db, "payrollNotifications"), orderBy("createdAt", "desc")),
      snap => {
        const payroll: PayrollNotif[] = [];
        const statusChanges: StatusChangeNotif[] = [];
        snap.docs.forEach(d => {
          const data = d.data();
          const type = data.type as string;

          if (type === "statusChange") {
            // Visibility check: role-based or uid-based
            const roles = (data.visibleTo as string[]) ?? [];
            const uids = (data.visibleToUids as string[]) ?? [];
            if (!roles.includes(userRole) && !uids.includes(uid)) return;
            statusChanges.push({
              id: d.id,
              type: "statusChange",
              clientId: (data.clientId as string) ?? "",
              clientName: (data.clientName as string) ?? "",
              carrier: (data.carrier as string) ?? "",
              appNumber: (data.appNumber as string) ?? "",
              field: (data.field as string) ?? "",
              fromValue: (data.fromValue as string) ?? "",
              toValue: (data.toValue as string) ?? "",
              changedBy: (data.changedBy as string) ?? "",
              changedByUid: (data.changedByUid as string) ?? "",
              agentId: (data.agentId as string) ?? "",
              agentName: (data.agentName as string) ?? "",
              teamNumber: (data.teamNumber as number) ?? 0,
              createdAt: data.createdAt ?? null,
              visibleTo: roles,
              visibleToUids: uids,
            });
          } else if (type === "locked" || type === "paid") {
            // Only owner/dev see lock/paid notifications
            if (userRole !== "owner" && userRole !== "developer") return;
            payroll.push({
              id: d.id,
              type: type as "locked" | "paid",
              periodStart: (data.periodStart as string) ?? "",
              periodEnd: (data.periodEnd as string) ?? "",
              payday: (data.payday as string) ?? "",
              totalPayroll: (data.totalPayroll as number) ?? 0,
              employeeCount: (data.employeeCount as number) ?? 0,
              lockedBy: (data.lockedBy as string) ?? undefined,
              paidBy: (data.paidBy as string) ?? undefined,
              createdAt: data.createdAt ?? null,
            });
          }
        });
        setPayrollNotifs(payroll);
        setStatusChangeNotifs(statusChanges);
      },
      () => {},
    );
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guard.ready, claim.uid, claim.profile?.role]);

  // ── Actions ─────────────────────────────────────────────────────────────
  const handleApprove = useCallback(async (id: string) => {
    setActionLoading(id);
    setActionResult(null);
    try {
      const res = await fetch("/api/admin/approve-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to approve");
      setActionResult({ id, resetLink: data.resetLink, contractorId: data.contractorId });
      await updateDoc(doc(db, "onboardingRequests", id), { status: "approved" });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "approved" } : r));
    } catch (err) {
      setActionResult({ id, error: err instanceof Error ? err.message : "Failed" });
    } finally {
      setActionLoading(null);
    }
  }, []);

  const handleReject = useCallback(async (id: string) => {
    setActionLoading(id);
    try {
      await updateDoc(doc(db, "onboardingRequests", id), { status: "rejected" });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "rejected" } : r));
    } finally {
      setActionLoading(null);
    }
  }, []);

  const handleDeleteRequest = useCallback(async (id: string) => {
    await deleteDoc(doc(db, "onboardingRequests", id));
    setRequests(prev => prev.filter(r => r.id !== id));
  }, []);

  // ── Email-like actions ──────────────────────────────────────────────────

  // Build the unified notification list
  const allItems: NotifItem[] = useMemo(() => {
    const items: NotifItem[] = [];
    // Payroll notifications first (owner/dev)
    payrollNotifs.forEach(n => items.push({ kind: "payroll", key: `payroll-${n.id}`, notif: n }));
    // Status change notifications
    statusChangeNotifs.forEach(n => items.push({ kind: "statusChange", key: `sc-${n.id}`, notif: n }));
    // Birthdays
    birthdayUsers.forEach(u => items.push({ kind: "birthday", key: `bday-${u.uid}`, user: u }));
    // Documents
    recentDocs.forEach(d => items.push({ kind: "document", key: `doc-${d.id}`, doc: d }));
    // Access requests (admin only)
    if (isAdmin) {
      requests.forEach(r => items.push({ kind: "request", key: `req-${r.id}`, req: r }));
    }
    return items;
  }, [payrollNotifs, statusChangeNotifs, birthdayUsers, recentDocs, requests, isAdmin]);

  // Filter out deleted items
  const visibleItems = useMemo(
    () => allItems.filter(it => !deletedItems.has(it.key)),
    [allItems, deletedItems],
  );

  const unreadCount = useMemo(
    () => visibleItems.filter(it => !readItems.has(it.key)).length,
    [visibleItems, readItems],
  );

  const toggleSelect = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === visibleItems.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(visibleItems.map(it => it.key)));
    }
  };

  const markSelectedRead = () => {
    setReadItems(prev => {
      const next = new Set(prev);
      selected.forEach(k => next.add(k));
      storeSet(`notifRead_${storagePrefix}`, next);
      return next;
    });
    setSelected(new Set());
  };

  const markSelectedUnread = () => {
    setReadItems(prev => {
      const next = new Set(prev);
      selected.forEach(k => next.delete(k));
      storeSet(`notifRead_${storagePrefix}`, next);
      return next;
    });
    setSelected(new Set());
  };

  const deleteSelected = () => {
    setDeletedItems(prev => {
      const next = new Set(prev);
      selected.forEach(k => next.add(k));
      storeSet(`notifDeleted_${storagePrefix}`, next);
      return next;
    });
    setSelected(new Set());
  };

  const markAllRead = () => {
    setReadItems(prev => {
      const next = new Set(prev);
      visibleItems.forEach(it => next.add(it.key));
      storeSet(`notifRead_${storagePrefix}`, next);
      return next;
    });
  };

  // ── Render ──────────────────────────────────────────────────────────────
  if (!guard.ready) return guard.node;
  if (loading) return <div className="flex-1 flex items-center justify-center bg-app-bg"><Spinner className="w-7 h-7" /></div>;

  const allSelected = visibleItems.length > 0 && selected.size === visibleItems.length;
  const someSelected = selected.size > 0;

  return (
    <div className="bg-app-bg min-h-full flex flex-col">

      {/* ── Header ── */}
      <div className="sticky top-0 z-10 bg-app-bg border-b border-app-border px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-app-text">Notifications</h1>
            {unreadCount > 0 && (
              <span className="min-w-5.5 h-5.5 px-1.5 rounded-full bg-app-accent/20 border border-app-accent/40 text-app-accent text-xs font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="px-3 py-1.5 text-xs font-medium text-app-text-3 hover:text-app-text hover:bg-app-surface-2/60 rounded-lg transition"
              >
                Mark all read
              </button>
            )}
            <span className="text-app-text-5 text-xs">{visibleItems.length} notification{visibleItems.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="flex items-center gap-2 min-h-9">
          {/* Select All checkbox */}
          <button
            onClick={selectAll}
            className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition
              border-app-border-2 hover:border-app-text-3"
            title={allSelected ? "Deselect all" : "Select all"}
          >
            {allSelected ? (
              <svg className="w-3.5 h-3.5 text-app-accent" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : someSelected ? (
              <span className="w-2.5 h-0.5 bg-app-accent rounded-full" />
            ) : null}
          </button>

          {someSelected ? (
            <>
              <span className="text-xs text-app-text-3 font-medium">{selected.size} selected</span>
              <div className="w-px h-4 bg-app-border mx-1" />
              <button onClick={markSelectedRead} className="px-2.5 py-1 text-xs font-medium text-app-text-3 hover:text-app-text hover:bg-app-surface-2/60 rounded transition" title="Mark read">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 0l.194-.104a2.25 2.25 0 001.183-1.98V9M2.25 9l.194.104a2.25 2.25 0 001.183 1.98l.055.03M2.25 9V6.75A2.25 2.25 0 014.5 4.5h15A2.25 2.25 0 0121.75 6.75V9m-9 6.868l-6.489-3.496M12 15.868l6.489-3.496" />
                </svg>
              </button>
              <button onClick={markSelectedUnread} className="px-2.5 py-1 text-xs font-medium text-app-text-3 hover:text-app-text hover:bg-app-surface-2/60 rounded transition" title="Mark unread">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </button>
              <button onClick={deleteSelected} className="px-2.5 py-1 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition" title="Delete">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </>
          ) : (
            <span className="text-xs text-app-text-5">Select items to manage</span>
          )}
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mx-6 mt-4 px-4 py-3 bg-red-950/80 border border-red-700 rounded-xl text-red-300 text-sm">
          {error}
          <button onClick={() => setError("")} className="ml-2 text-red-400 underline text-xs">Dismiss</button>
        </div>
      )}

      {/* ── Notification List ── */}
      <div className="flex-1 overflow-y-auto">
        {visibleItems.length === 0 && !birthdayLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <svg className="w-12 h-12 text-app-text-5 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <p className="text-app-text-3 text-sm font-medium">All caught up</p>
            <p className="text-app-text-5 text-xs mt-1">No notifications right now</p>
          </div>
        ) : (
          <div className="divide-y divide-app-border">

            {/* ── Payroll Section (owner/dev) ── */}
            {payrollNotifs.filter(n => !deletedItems.has(`payroll-${n.id}`)).length > 0 && (
              <>
                <div className="px-6 py-2 bg-app-surface-2/30">
                  <span className="text-[11px] font-semibold text-app-text-4 uppercase tracking-wider">Payroll</span>
                </div>
                {payrollNotifs
                  .filter(n => !deletedItems.has(`payroll-${n.id}`))
                  .map(n => {
                    const key = `payroll-${n.id}`;
                    const isRead = readItems.has(key);
                    const isSelected = selected.has(key);
                    const isLocked = n.type === "locked";
                    const periodLabel = (() => {
                      const s = new Date(n.periodStart + "T12:00:00");
                      const e = new Date(n.periodEnd + "T12:00:00");
                      return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
                    })();
                    const total = n.totalPayroll.toLocaleString("en-US", { style: "currency", currency: "USD" });

                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-3 px-6 py-3 transition cursor-pointer
                          ${isSelected ? "bg-app-accent/5" : isRead ? "bg-transparent hover:bg-app-surface-2/20" : "bg-app-surface hover:bg-app-surface-2/30"}
                          border-l-2 ${isLocked ? "border-l-amber-500" : "border-l-green-500"}`}
                        onClick={() => {
                          if (!isRead) {
                            setReadItems(prev => {
                              const next = new Set(prev);
                              next.add(key);
                              storeSet(`notifRead_${storagePrefix}`, next);
                              return next;
                            });
                          }
                        }}
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleSelect(key); }}
                          className={`rounded border-2 flex items-center justify-center shrink-0 transition
                            ${isSelected ? "bg-app-accent border-app-accent" : "border-app-border-2 hover:border-app-text-3"}`}
                          style={{ width: 18, height: 18 }}
                        >
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>

                        <span className={`w-2 h-2 rounded-full shrink-0 ${isRead ? "bg-transparent" : isLocked ? "bg-amber-400" : "bg-green-400"}`} />

                        {/* Icon */}
                        {isLocked ? (
                          <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${isRead ? "text-app-text-3" : "text-app-text font-semibold"}`}>
                            {isLocked
                              ? `Payroll locked — ready for review`
                              : `Payroll marked as paid`}
                          </p>
                          <p className="text-app-text-4 text-xs truncate">
                            {periodLabel} &middot; {total} &middot; {n.employeeCount} employees
                            {isLocked && n.lockedBy ? ` · by ${n.lockedBy}` : ""}
                            {!isLocked && n.paidBy ? ` · by ${n.paidBy}` : ""}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border
                            ${isLocked
                              ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                              : "bg-green-500/15 text-green-400 border-green-500/30"}`}>
                            {isLocked ? "Needs Review" : "Paid"}
                          </span>
                          <span className="text-app-text-5 text-[11px]">{timeAgo(n.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
              </>
            )}

            {/* ── Status Changes Section ── */}
            {statusChangeNotifs.filter(n => !deletedItems.has(`sc-${n.id}`)).length > 0 && (
              <>
                <div className="px-6 py-2 bg-app-surface-2/30">
                  <span className="text-[11px] font-semibold text-app-text-4 uppercase tracking-wider">Policy Status Changes</span>
                </div>
                {statusChangeNotifs
                  .filter(n => !deletedItems.has(`sc-${n.id}`))
                  .map(n => {
                    const key = `sc-${n.id}`;
                    const isRead = readItems.has(key);
                    const isSel = selected.has(key);
                    const isCancelOrDecline = ["Cancelled", "Declined"].includes(n.toValue) || ["Decline - Rewrite", "Lapsed", "CXL"].includes(n.toValue);
                    const isApproved = n.toValue === "Approved";
                    const borderCls = isCancelOrDecline ? "border-l-red-500" : isApproved ? "border-l-green-500" : "border-l-blue-500";
                    const dotCls = isCancelOrDecline ? "bg-red-400" : isApproved ? "bg-green-400" : "bg-blue-400";
                    const iconBg = isCancelOrDecline ? "bg-red-500/15 border-red-500/30" : isApproved ? "bg-green-500/15 border-green-500/30" : "bg-blue-500/15 border-blue-500/30";
                    const iconColor = isCancelOrDecline ? "text-red-400" : isApproved ? "text-green-400" : "text-blue-400";

                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-3 px-6 py-3 transition cursor-pointer
                          ${isSel ? "bg-app-accent/5" : isRead ? "bg-transparent hover:bg-app-surface-2/20" : "bg-app-surface hover:bg-app-surface-2/30"}
                          border-l-2 ${borderCls}`}
                        onClick={() => {
                          if (!isRead) {
                            setReadItems(prev => {
                              const next = new Set(prev);
                              next.add(key);
                              storeSet(`notifRead_${storagePrefix}`, next);
                              return next;
                            });
                          }
                        }}
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleSelect(key); }}
                          className={`rounded border-2 flex items-center justify-center shrink-0 transition
                            ${isSel ? "bg-app-accent border-app-accent" : "border-app-border-2 hover:border-app-text-3"}`}
                          style={{ width: 18, height: 18 }}
                        >
                          {isSel && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>

                        <span className={`w-2 h-2 rounded-full shrink-0 ${isRead ? "bg-transparent" : dotCls}`} />

                        <div className={`w-8 h-8 rounded-full ${iconBg} border flex items-center justify-center shrink-0`}>
                          <svg className={`w-4 h-4 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                          </svg>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${isRead ? "text-app-text-3" : "text-app-text font-semibold"}`}>
                            {n.clientName} ({n.carrier})
                          </p>
                          <p className="text-app-text-4 text-xs truncate">
                            {n.fromValue} &rarr; {n.toValue}
                            {n.agentName ? ` · ${n.agentName}` : ""}
                            {n.appNumber ? ` · #${n.appNumber}` : ""}
                            {n.changedBy ? ` · by ${n.changedBy}` : ""}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border
                            ${isCancelOrDecline
                              ? "bg-red-500/15 text-red-400 border-red-500/30"
                              : isApproved
                              ? "bg-green-500/15 text-green-400 border-green-500/30"
                              : "bg-blue-500/15 text-blue-400 border-blue-500/30"}`}>
                            {n.toValue}
                          </span>
                          <span className="text-app-text-5 text-[11px]">{timeAgo(n.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
              </>
            )}

            {/* ── Birthdays Section ── */}
            {birthdayUsers.filter(u => !deletedItems.has(`bday-${u.uid}`)).length > 0 && (
              <>
                <div className="px-6 py-2 bg-app-surface-2/30">
                  <span className="text-[11px] font-semibold text-app-text-4 uppercase tracking-wider">Birthdays This Week</span>
                </div>
                {birthdayUsers
                  .filter(u => !deletedItems.has(`bday-${u.uid}`))
                  .map(u => {
                    const key = `bday-${u.uid}`;
                    const isRead = readItems.has(key);
                    const isSelected = selected.has(key);
                    const name = `${u.firstName} ${u.lastName}`;
                    const initials = `${u.firstName.charAt(0)}${u.lastName.charAt(0)}`.toUpperCase();
                    const isToday = u.daysAway === 0;

                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-3 px-6 py-3 transition cursor-pointer
                          ${isSelected ? "bg-app-accent/5" : isRead ? "bg-transparent hover:bg-app-surface-2/20" : "bg-app-surface hover:bg-app-surface-2/30"}
                          ${isToday ? "border-l-2 border-l-amber-500" : "border-l-2 border-l-transparent"}`}
                        onClick={() => {
                          if (!isRead) {
                            setReadItems(prev => {
                              const next = new Set(prev);
                              next.add(key);
                              storeSet(`notifRead_${storagePrefix}`, next);
                              return next;
                            });
                          }
                        }}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleSelect(key); }}
                          className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center shrink-0 transition
                            ${isSelected ? "bg-app-accent border-app-accent" : "border-app-border-2 hover:border-app-text-3"}`}
                          style={{ width: 18, height: 18 }}
                        >
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>

                        {/* Unread dot */}
                        <span className={`w-2 h-2 rounded-full shrink-0 ${isRead ? "bg-transparent" : "bg-app-accent"}`} />

                        {/* Avatar */}
                        {u.photoURL ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.photoURL} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: avatarColor(name) }}
                          >
                            {initials}
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${isRead ? "text-app-text-3" : "text-app-text font-semibold"}`}>
                            {name}
                          </p>
                          <p className="text-app-text-4 text-xs truncate">
                            {isToday ? "Birthday today!" : u.daysAway === 1 ? "Birthday tomorrow" : `Birthday ${u.displayDate}`}
                          </p>
                        </div>

                        {/* Badge */}
                        <div className="shrink-0">
                          {isToday ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              Today
                            </span>
                          ) : (
                            <span className="text-app-text-5 text-[11px]">
                              {u.daysAway === 1 ? "Tomorrow" : `${u.daysAway}d`}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </>
            )}

            {/* ── Documents Section ── */}
            {recentDocs.filter(d => !deletedItems.has(`doc-${d.id}`)).length > 0 && (
              <>
                <div className="px-6 py-2 bg-app-surface-2/30">
                  <span className="text-[11px] font-semibold text-app-text-4 uppercase tracking-wider">New Documents &middot; Last 7 Days</span>
                </div>
                {recentDocs
                  .filter(d => !deletedItems.has(`doc-${d.id}`))
                  .map(d => {
                    const key = `doc-${d.id}`;
                    const isRead = readItems.has(key);
                    const isSelected = selected.has(key);

                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-3 px-6 py-3 transition cursor-pointer
                          ${isSelected ? "bg-app-accent/5" : isRead ? "bg-transparent hover:bg-app-surface-2/20" : "bg-app-surface hover:bg-app-surface-2/30"}`}
                        onClick={() => {
                          if (!isRead) {
                            setReadItems(prev => {
                              const next = new Set(prev);
                              next.add(key);
                              storeSet(`notifRead_${storagePrefix}`, next);
                              return next;
                            });
                          }
                        }}
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleSelect(key); }}
                          className={`rounded border-2 flex items-center justify-center shrink-0 transition
                            ${isSelected ? "bg-app-accent border-app-accent" : "border-app-border-2 hover:border-app-text-3"}`}
                          style={{ width: 18, height: 18 }}
                        >
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>

                        <span className={`w-2 h-2 rounded-full shrink-0 ${isRead ? "bg-transparent" : "bg-app-accent"}`} />

                        <svg className="w-5 h-5 text-app-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>

                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${isRead ? "text-app-text-3" : "text-app-text font-semibold"}`}>
                            {d.name}
                          </p>
                          <p className="text-app-text-4 text-xs truncate">
                            {d.category} &middot; {d.uploadedByName}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-app-text-5 text-[11px]">{timeAgo(d.uploadedAt)}</span>
                          <a
                            href={d.storageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 text-app-text-4 hover:text-app-accent rounded transition"
                            title="Download"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    );
                  })}
              </>
            )}

            {/* ── Access Requests Section (admin only) ── */}
            {isAdmin && requests.filter(r => !deletedItems.has(`req-${r.id}`)).length > 0 && (
              <>
                <div className="px-6 py-2 bg-app-surface-2/30">
                  <span className="text-[11px] font-semibold text-app-text-4 uppercase tracking-wider">Access Requests</span>
                </div>
                {requests
                  .filter(r => !deletedItems.has(`req-${r.id}`))
                  .map(req => {
                    const key = `req-${req.id}`;
                    const isRead = readItems.has(key);
                    const isSelected = selected.has(key);
                    const isExpanded = expandedId === req.id;
                    const isPending = req.status === "pending";
                    const result = actionResult?.id === req.id ? actionResult : null;
                    const isLoading = actionLoading === req.id;
                    const initials = `${req.firstName.charAt(0)}${req.lastName.charAt(0)}`.toUpperCase();

                    return (
                      <div key={key} className={isExpanded ? "border-b border-app-border" : ""}>
                        <div
                          className={`flex items-center gap-3 px-6 py-3 transition cursor-pointer
                            ${isSelected ? "bg-app-accent/5" : isRead ? "bg-transparent hover:bg-app-surface-2/20" : "bg-app-surface hover:bg-app-surface-2/30"}
                            ${isPending ? "border-l-2 border-l-amber-500" : "border-l-2 border-l-transparent"}`}
                          onClick={() => {
                            setExpandedId(isExpanded ? null : req.id);
                            if (!isRead) {
                              setReadItems(prev => {
                                const next = new Set(prev);
                                next.add(key);
                                storeSet(`notifRead_${storagePrefix}`, next);
                                return next;
                              });
                            }
                          }}
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleSelect(key); }}
                            className={`rounded border-2 flex items-center justify-center shrink-0 transition
                              ${isSelected ? "bg-app-accent border-app-accent" : "border-app-border-2 hover:border-app-text-3"}`}
                            style={{ width: 18, height: 18 }}
                          >
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>

                          <span className={`w-2 h-2 rounded-full shrink-0 ${isRead ? "bg-transparent" : isPending ? "bg-amber-400" : "bg-app-accent"}`} />

                          {req.photoDataURL ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={req.photoDataURL} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-app-surface-2 border border-app-border-2 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-app-text-2">{initials}</span>
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate ${isRead ? "text-app-text-3" : "text-app-text font-semibold"}`}>
                              {req.firstName} {req.lastName}
                            </p>
                            <p className="text-app-text-4 text-xs truncate">
                              {req.email}{req.teamNumber ? ` \u00b7 Team ${req.teamNumber}` : ""}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <StatusBadge status={req.status} />
                            <span className="text-app-text-5 text-[11px] hidden sm:inline">{timeAgo(req.submittedAt)}</span>
                            <svg className={`w-3.5 h-3.5 text-app-text-4 transition ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                          </div>
                        </div>

                        {/* Expanded detail */}
                        {isExpanded && (
                          <div className="bg-app-surface/50 border-t border-app-border ml-6">
                            <div className="px-5 py-4 space-y-2">
                              {[
                                { label: "Phone", value: req.phone },
                                { label: "Team", value: req.teamNumber ? `Team ${req.teamNumber}` : "" },
                                { label: "Comments", value: req.comments },
                                { label: "Submitted", value: fmtDate(req.submittedAt) },
                              ].filter(f => f.value).map(f => (
                                <div key={f.label} className="flex justify-between py-1">
                                  <span className="text-app-text-4 text-xs font-semibold">{f.label}</span>
                                  <span className="text-app-text text-sm">{f.value}</span>
                                </div>
                              ))}
                            </div>

                            {result?.error && (
                              <div className="px-5 py-3 bg-red-950/50 text-red-400 text-sm font-medium">{result.error}</div>
                            )}
                            {result?.resetLink && (
                              <div className="px-5 py-3 bg-green-950/50 border-t border-green-700/30">
                                <p className="text-green-400 text-sm font-semibold mb-2">Account created! Send this link to the user:</p>
                                <div className="flex gap-2">
                                  <input
                                    readOnly value={result.resetLink}
                                    className="flex-1 px-3 py-1.5 bg-app-surface border border-app-border-2 rounded-lg text-xs font-mono text-app-text focus:outline-none"
                                    onClick={e => (e.target as HTMLInputElement).select()}
                                  />
                                  <button
                                    onClick={() => navigator.clipboard.writeText(result.resetLink!)}
                                    className="px-3 py-1.5 bg-app-accent text-white text-xs font-semibold rounded-lg"
                                  >Copy</button>
                                </div>
                                {result.contractorId && (
                                  <p className="text-app-text-3 text-xs mt-2">Contractor ID: <strong className="text-app-text">{result.contractorId}</strong></p>
                                )}
                              </div>
                            )}

                            <div className="flex gap-2 px-5 py-3 border-t border-app-border">
                              {isPending && !result?.resetLink && (
                                <>
                                  <button
                                    disabled={isLoading}
                                    onClick={() => handleReject(req.id)}
                                    className="flex-1 py-2 rounded-lg border border-red-500/50 bg-red-500/10 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition disabled:opacity-50"
                                  >{isLoading ? "..." : "Reject"}</button>
                                  <button
                                    disabled={isLoading}
                                    onClick={() => handleApprove(req.id)}
                                    className="flex-1 py-2 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-500 transition disabled:opacity-50"
                                  >{isLoading ? "Creating account..." : "Approve"}</button>
                                </>
                              )}
                              {req.status !== "pending" && (
                                <button
                                  onClick={() => handleDeleteRequest(req.id)}
                                  className="text-app-text-5 hover:text-red-400 text-xs transition"
                                >Delete request</button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </>
            )}

            {birthdayLoading && (
              <div className="flex justify-center py-8"><Spinner className="w-6 h-6" /></div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
