"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp,
  doc, getDoc, getDocs, where, setDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc,
  Timestamp,
} from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import type { FirebaseStorage } from "firebase/storage";

// ─── Public interfaces ────────────────────────────────────────────────────────

export interface ChatUser {
  uid: string;
  firstName: string;
  lastName: string;
  photoURL: string;
  role: string;
  teamNumber: number;
  active: boolean;
  level?: number;
}

export interface ChatAppProps {
  /** Firestore instance from the host app */
  db: Firestore;
  /** Firebase Storage instance from the host app */
  storage: FirebaseStorage;
  /** The currently authenticated user */
  currentUser: ChatUser;
  /** Returns true if a role string is considered admin-level */
  isAdminLevel: (role: string) => boolean;
}

// ─── Internal types ───────────────────────────────────────────────────────────

interface PortalUser {
  uid: string;
  firstName: string;
  lastName: string;
  photoURL: string;
  role: string;
  teamNumber: number;
  active: boolean;
  level?: number;
}

interface ConvMeta {
  id: string;
  type: "group" | "dm";
  name?: string;
  participants: string[];
  lastMessage: string;
  lastMessageAt: { seconds: number } | null;
  deletedBy?: string[];
}

interface ChatMessage {
  id: string;
  text: string;
  imageUrl?: string;
  uid: string;
  senderId?: string;
  displayName: string;
  photoURL: string;
  role: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dmId(a: string, b: string) { return "dm_" + [a, b].sort().join("__"); }

function fmtTime(ts: ChatMessage["createdAt"]) {
  if (!ts) return "";
  return new Date(ts.seconds * 1000).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function fmtConvTime(ts: { seconds: number } | null) {
  if (!ts) return "";
  const d = new Date(ts.seconds * 1000);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const yest = new Date(now); yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function dayLabel(ts: ChatMessage["createdAt"]) {
  if (!ts) return "";
  const d = new Date(ts.seconds * 1000);
  const today = new Date();
  const yest = new Date(today); yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

const AVATAR_COLORS = [
  "bg-blue-600","bg-purple-600","bg-green-600","bg-orange-500",
  "bg-pink-600","bg-teal-600","bg-indigo-600","bg-rose-600",
];
function avatarBg(uid: string) {
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase();
}

const LEVEL_TITLES: Record<number, string> = {
  1: "Account Representative", 2: "Junior Closer",  3: "Senior Closer",
  4: "Elite Closer",           5: "Master Closer",  6: "Team Lead",
  7: "Team Captain",           8: "Squad Leader",   9: "Commander",
  10: "Developer",
};

const LEVEL_BADGE: Record<number, { bg: string; text: string }> = {
  1: { bg: "bg-gray-600",    text: "text-white"    },
  2: { bg: "bg-emerald-600", text: "text-white"    },
  3: { bg: "bg-blue-600",    text: "text-white"    },
  4: { bg: "bg-violet-600",  text: "text-white"    },
  5: { bg: "bg-orange-500",  text: "text-white"    },
  6: { bg: "bg-amber-500",   text: "text-app-text" },
  7: { bg: "bg-red-600",     text: "text-white"    },
  8: { bg: "bg-cyan-500",    text: "text-app-text" },
  9: { bg: "bg-yellow-400",  text: "text-app-text" },
  10: { bg: "bg-red-500",   text: "text-white"    },
};

const LEVEL_SHORT: Record<number, string> = {
  1: "CSR", 2: "JUNIOR", 3: "SENIOR", 4: "ELITE", 5: "MASTER",
  6: "LEAD", 7: "CAPTAIN", 8: "SQUAD", 9: "COMPANY", 10: "DEV",
};

type PresenceStatus = "active" | "idle" | "offline";

function Avatar({ photoURL, name, uid, size = "md", status, level }: {
  photoURL: string; name: string; uid: string;
  size?: "sm" | "md" | "lg"; status?: PresenceStatus; level?: number; teamNumber?: number;
}) {
  const dim   = size === "sm" ? "w-8 h-8"   : size === "lg" ? "w-11 h-11" : "w-9 h-9";
  const fsize = size === "sm" ? "text-xs"   : size === "lg" ? "text-sm"   : "text-xs";
  const hasLevel = level != null;
  const badge    = hasLevel ? LEVEL_BADGE[level!] : null;

  return (
    <div className={`relative shrink-0 inline-flex${hasLevel ? " mb-2" : ""}`}>
      {photoURL ? (
        <img src={photoURL} alt={name} className={`${dim} rounded-full object-cover`} />
      ) : (
        <div className={`${dim} ${fsize} rounded-full flex items-center justify-center font-bold text-white select-none ${avatarBg(uid)}`}>
          {initials(name)}
        </div>
      )}
      {badge && (
        <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-px rounded text-[8px] font-bold tracking-widest uppercase whitespace-nowrap border border-app-surface ${badge.bg} ${badge.text}`}>
          {LEVEL_SHORT[level!]}
        </div>
      )}
      {hasLevel && (level ?? 0) > 0 && (
        <div className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] rounded-full bg-app-surface-2 border border-app-border-2 flex items-center justify-center text-[9px] font-bold text-app-text leading-none px-0.5">
          {level}
        </div>
      )}
      {status !== undefined && (
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-app-surface ${status === "active" ? "bg-app-success" : status === "idle" ? "bg-app-warning" : "bg-app-danger"}`} />
      )}
    </div>
  );
}

function renderWithMentions(text: string, myDisplayName: string) {
  const parts = text.split(/(@\S+(?:\s\S+)?)/g);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      const isSelf = part.slice(1).trim().toLowerCase() === myDisplayName.toLowerCase() ||
                     myDisplayName.toLowerCase().startsWith(part.slice(1).trim().toLowerCase());
      return (
        <span key={i} className={`inline font-semibold rounded px-0.5 ${isSelf ? "bg-yellow-400/20 text-yellow-300" : "text-blue-400"}`}>
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

// ─── Role grouping for DM directory ──────────────────────────────────────────

type RoleGroup = "owner" | "admin" | "manager" | "rep";

const ROLE_GROUP_LABELS: Record<RoleGroup, string> = {
  owner: "Leadership",
  admin: "Admin",
  manager: "Manager",
  rep: "Reps",
};

const ROLE_GROUP_ORDER: RoleGroup[] = ["owner", "admin", "manager", "rep"];

// ─── Chat permissions ─────────────────────────────────────────────────────────

type PermRole = "lead" | "admin" | "mgr" | "rep";

interface ChatPermRow { lead: boolean; admin: boolean; mgr: boolean; rep: boolean; }

interface ChatPermissions {
  sendMessages:    ChatPermRow;
  startDMs:        ChatPermRow;
  view7DayHistory: ChatPermRow;
  viewFullHistory: ChatPermRow;
  createChannels:  ChatPermRow;
  manageMembers:   ChatPermRow;
  deleteChannels:  ChatPermRow;
  chatSettings:    ChatPermRow;
}

const DEFAULT_CHAT_PERMS: ChatPermissions = {
  sendMessages:    { lead: true, admin: true,  mgr: true,  rep: true  },
  startDMs:        { lead: true, admin: true,  mgr: true,  rep: true  },
  view7DayHistory: { lead: true, admin: true,  mgr: true,  rep: true  },
  viewFullHistory: { lead: true, admin: false, mgr: false, rep: false },
  createChannels:  { lead: true, admin: false, mgr: false, rep: false },
  manageMembers:   { lead: true, admin: false, mgr: false, rep: false },
  deleteChannels:  { lead: true, admin: false, mgr: false, rep: false },
  chatSettings:    { lead: true, admin: false, mgr: false, rep: false },
};

const PERM_LABELS: { key: keyof ChatPermissions; label: string }[] = [
  { key: "sendMessages",    label: "Send messages"      },
  { key: "startDMs",        label: "Start DMs"          },
  { key: "view7DayHistory", label: "View 7-day history" },
  { key: "viewFullHistory", label: "View full history"  },
  { key: "createChannels",  label: "Create channels"    },
  { key: "manageMembers",   label: "Manage members"     },
  { key: "deleteChannels",  label: "Delete channels"    },
  { key: "chatSettings",    label: "Chat settings"      },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function ChatApp({ db, storage, currentUser, isAdminLevel }: ChatAppProps) {
  const myUid = currentUser.uid;
  const me    = currentUser;

  // ── Role helpers (closed over isAdminLevel prop) ──────────────────────────
  function roleLabel(role: string, level?: number) {
    if (level != null && LEVEL_TITLES[level]) return LEVEL_TITLES[level];
    if (role === "developer") return "Developer";
    if (role === "owner") return "Owner";
    if (isAdminLevel(role)) return "Admin";
    if (role === "manager") return "Manager";
    return "Rep";
  }

  function teamLabel(u: { role: string; teamNumber?: number; level?: number }) {
    if (u.teamNumber) return `Team ${u.teamNumber}`;
    return roleLabel(u.role, u.level);
  }

  // ── State ─────────────────────────────────────────────────────────────────
  const [allUsers, setAllUsers]         = useState<PortalUser[]>([]);
  const [convs, setConvs]               = useState<ConvMeta[]>([]);
  const [generalMeta, setGeneralMeta]   = useState<{ lastMessage?: string; lastMessageAt?: { seconds: number } | null }>({});
  const [activeChatId, setActiveChatId] = useState("general");
  const [messages, setMessages]         = useState<ChatMessage[]>([]);
  const [draft, setDraft]               = useState("");
  const [imageFile, setImageFile]       = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [sending, setSending]           = useState(false);
  const [searchText, setSearchText]     = useState("");
  const [loading, setLoading]           = useState(true);
  const [presence, setPresence]         = useState<Record<string, PresenceStatus>>({});
  const [lightboxUrl, setLightboxUrl]   = useState("");

  const [showCreateGroup, setShowCreateGroup]   = useState(false);
  const [newGroupName, setNewGroupName]         = useState("");
  const [newGroupMembers, setNewGroupMembers]   = useState<string[]>([]);
  const [creatingGroup, setCreatingGroup]       = useState(false);
  const [showManageMembers, setShowManageMembers] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<ConvMeta | null>(null);
  const [showDeleted, setShowDeleted]     = useState(false);

  const [showChatSettings, setShowChatSettings] = useState(false);
  const [showRemovedChats, setShowRemovedChats] = useState(true);
  const chatSettingsBtnRef   = useRef<HTMLDivElement>(null);
  const chatSettingsPanelRef = useRef<HTMLDivElement>(null);
  const [settingsFlyoutPos, setSettingsFlyoutPos] = useState({ left: 0, top: 0 });

  const [showSearch, setShowSearch]         = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const permissionsRef = useRef<HTMLDivElement>(null);

  const [collapsedGroups, setCollapsedGroups] = useState<Set<RoleGroup>>(new Set());

  const [chatPerms, setChatPerms] = useState<ChatPermissions>(DEFAULT_CHAT_PERMS);

  const [archiveConfig, setArchiveConfig]       = useState<{ startDate: string; duration: string } | null>(null);
  const [showArchived, setShowArchived]         = useState(false);
  const [archiveSaving, setArchiveSaving]       = useState(false);
  const [archiveDraftStart, setArchiveDraftStart]         = useState("");
  const [archiveDraftDuration, setArchiveDraftDuration]   = useState("weekly");

  const [pinnedIds, setPinnedIds] = useState<string[]>([]);

  const [groupOrder, setGroupOrder]         = useState<string[]>([]);
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);
  const dragGroupRef = useRef<string | null>(null);

  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionOpen, setMentionOpen]   = useState(false);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);
  const mentionListRef = useRef<HTMLDivElement>(null);

  const bottomRef    = useRef<HTMLDivElement>(null);
  const scrollRef    = useRef<HTMLDivElement>(null);
  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAtBottomRef  = useRef(true);
  const isOwnerRef     = useRef(currentUser.role === "owner" || currentUser.role === "developer");
  const justChangedRef = useRef(true);

  const isOwner     = currentUser.role === "owner" || currentUser.role === "developer";
  const isDeveloper = currentUser.role === "developer";

  // ── Load all users ────────────────────────────────────────────────────────
  useEffect(() => {
    getDocs(collection(db, "users"))
      .then((snap) => {
        const users: PortalUser[] = [];
        snap.forEach((d) => users.push({ uid: d.id, ...(d.data() as Omit<PortalUser, "uid">) }));
        setAllUsers(users.filter((u) => u.active !== false));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [db]);

  // ── General chat metadata ─────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "chats", "general"), (snap) => {
      if (snap.exists()) setGeneralMeta(snap.data());
    }, () => {});
    return () => unsub();
  }, [db]);

  // ── All conversations (DMs + groups) ──────────────────────────────────────
  const isDev = me.role === "developer" || me.role === "owner";
  useEffect(() => {
    // Dev/Owner see all chats; others only see chats they participate in
    const q = isDev
      ? query(collection(db, "chats"))
      : query(collection(db, "chats"), where("participants", "array-contains", myUid));
    const unsub = onSnapshot(q, (snap) => {
      const list: ConvMeta[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ConvMeta, "id">) }));
      setConvs(list.sort((a, b) => (b.lastMessageAt?.seconds ?? 0) - (a.lastMessageAt?.seconds ?? 0)));
    }, () => {});
    return () => unsub();
  }, [db, myUid, isDev]);

  // ── Presence ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const STALE_MS = 3 * 60 * 1000; // 3 minutes — heartbeat is every 60s
    const unsub = onSnapshot(collection(db, "presence"), (snap) => {
      const now = Date.now();
      const map: Record<string, PresenceStatus> = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        const lastSeen = data.lastSeen?.toMillis?.() ?? 0;
        const stale = now - lastSeen > STALE_MS;
        if (stale) { map[d.id] = "offline"; return; }
        if (data.status === "active" || data.status === "idle") map[d.id] = data.status;
        else if (data.online === true) map[d.id] = "active"; // backwards compat
        else map[d.id] = "offline";
      });
      setPresence(map);
    }, () => {});
    return () => unsub();
  }, [db]);

  // ── Messages ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeChatId) return;
    setMessages([]);
    isAtBottomRef.current = true;
    justChangedRef.current = true;

    const SEVEN_DAYS_AGO = Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const q = isOwnerRef.current
      ? query(collection(db, "chats", activeChatId, "messages"), orderBy("createdAt", "asc"), limit(500))
      : query(collection(db, "chats", activeChatId, "messages"), where("createdAt", ">=", SEVEN_DAYS_AGO), orderBy("createdAt", "asc"), limit(300));

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ChatMessage, "id">) })));
    }, () => {});
    return () => unsub();
  }, [db, activeChatId]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (messages.length === 0) return;
    const shouldScroll = justChangedRef.current || isAtBottomRef.current;
    if (!shouldScroll) return;
    if (justChangedRef.current) justChangedRef.current = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      });
    });
  }, [messages]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

  // ── Persisted preferences ────────────────────────────────────────────────
  useEffect(() => {
    try {
      const savedGroup = localStorage.getItem(`groupOrder_${myUid}`);
      if (savedGroup) setGroupOrder(JSON.parse(savedGroup));
      const savedShowRemoved = localStorage.getItem(`chatSettings_showRemovedChats_${myUid}`);
      if (savedShowRemoved !== null) setShowRemovedChats(savedShowRemoved === "true");
      const savedPinned = localStorage.getItem(`pinnedChats_${myUid}`);
      if (savedPinned) setPinnedIds(JSON.parse(savedPinned));
    } catch {}
  }, [myUid]);

  const togglePin = (chatId: string) => {
    setPinnedIds((prev) => {
      const next = prev.includes(chatId) ? prev.filter((id) => id !== chatId) : [...prev, chatId];
      try { localStorage.setItem(`pinnedChats_${myUid}`, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // ── Archive config + permissions ──────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "chatConfig"), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as { archiveStartDate?: string; archiveDuration?: string; permissions?: Partial<ChatPermissions> };
        const cfg = { startDate: data.archiveStartDate ?? "", duration: data.archiveDuration ?? "weekly" };
        setArchiveConfig(cfg);
        setArchiveDraftStart(cfg.startDate);
        setArchiveDraftDuration(cfg.duration);
        if (data.permissions) {
          setChatPerms((prev) => ({ ...prev, ...(data.permissions as ChatPermissions) }));
        }
      }
    }, () => {});
    return () => unsub();
  }, [db]);

  // ── Outside-click: close popovers ────────────────────────────────────────
  useEffect(() => {
    if (!showChatSettings) return;
    if (chatSettingsBtnRef.current) {
      const r = chatSettingsBtnRef.current.getBoundingClientRect();
      setSettingsFlyoutPos({ left: r.right + 4, top: r.top });
    }
    const handle = (e: MouseEvent) => {
      const t = e.target as Node;
      const inBtn   = chatSettingsBtnRef.current?.contains(t);
      const inPanel = chatSettingsPanelRef.current?.contains(t);
      if (!inBtn && !inPanel) setShowChatSettings(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [showChatSettings]);

  useEffect(() => {
    if (!showPermissions) return;
    const handle = (e: MouseEvent) => {
      if (permissionsRef.current && !permissionsRef.current.contains(e.target as Node))
        setShowPermissions(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [showPermissions]);

  // ── Auto-resize textarea ──────────────────────────────────────────────────
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [draft]);

  // ── Send ──────────────────────────────────────────────────────────────────
  const sendMessage = async () => {
    const text = draft.trim();
    if ((!text && !imageFile) || sending) return;
    setSending(true);
    setDraft("");
    const localFile    = imageFile;
    const localPreview = imagePreview;
    setImageFile(null);
    if (localPreview.startsWith("blob:")) URL.revokeObjectURL(localPreview);
    setImagePreview("");
    isAtBottomRef.current = true;
    try {
      let imageUrl = "";
      if (localFile) {
        const path = `chat-images/${activeChatId}/${myUid}/${Date.now()}_${localFile.name}`;
        const snap = await uploadBytes(storageRef(storage, path), localFile, { contentType: localFile.type });
        imageUrl = await getDownloadURL(snap.ref);
      }
      await addDoc(collection(db, "chats", activeChatId, "messages"), {
        text,
        ...(imageUrl ? { imageUrl } : {}),
        uid: myUid,
        senderId: myUid,
        displayName: `${me.firstName} ${me.lastName}`,
        photoURL: me.photoURL ?? "",
        role: me.role,
        createdAt: serverTimestamp(),
      });
      await setDoc(doc(db, "chats", activeChatId), {
        lastMessage: imageUrl ? "📷 Photo" : text.slice(0, 100),
        lastMessageAt: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.error("Send failed:", err);
      setDraft(text);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  // ── Open DM ───────────────────────────────────────────────────────────────
  const openDm = async (other: PortalUser) => {
    const chatId  = dmId(myUid, other.uid);
    setSearchText("");
    const chatRef = doc(db, "chats", chatId);
    let docExists = false;
    try { const snap = await getDoc(chatRef); docExists = snap.exists(); } catch {}
    if (!docExists) {
      await setDoc(chatRef, {
        type: "dm",
        participants: [myUid, other.uid].sort(),
        lastMessage: "",
        lastMessageAt: null,
        createdAt: serverTimestamp(),
      });
    }
    setActiveChatId(chatId);
  };

  // ── Soft-delete / restore ─────────────────────────────────────────────────
  const deleteConversation = async (chatId: string) => {
    try {
      await updateDoc(doc(db, "chats", chatId), { deletedBy: arrayUnion(myUid) });
      setConvs((prev) => prev.map((c) => c.id === chatId ? { ...c, deletedBy: [...(c.deletedBy ?? []), myUid] } : c));
      if (activeChatId === chatId) setActiveChatId("general");
    } catch (err) {
      console.error("Delete conversation failed:", err);
    }
    setDeleteConfirm(null);
  };

  const restoreConversation = async (chatId: string) => {
    if (!showRemovedChats) return;
    try {
      await updateDoc(doc(db, "chats", chatId), { deletedBy: arrayRemove(myUid) });
      setConvs((prev) => prev.map((c) => c.id === chatId ? { ...c, deletedBy: (c.deletedBy ?? []).filter((u) => u !== myUid) } : c));
    } catch (err) {
      console.error("Restore conversation failed:", err);
    }
  };

  // ── Create group channel ──────────────────────────────────────────────────
  const createGroupChannel = async () => {
    if (!newGroupName.trim() || creatingGroup) return;
    setCreatingGroup(true);
    try {
      const slug = newGroupName.trim().toLowerCase().replace(/\s+/g, "-");
      const participants = Array.from(new Set([myUid, ...newGroupMembers]));
      const ref = await addDoc(collection(db, "chats"), {
        type: "group", name: slug, participants, createdBy: myUid,
        lastMessage: "", lastMessageAt: null, createdAt: serverTimestamp(),
      });
      setShowCreateGroup(false); setNewGroupName(""); setNewGroupMembers([]);
      setActiveChatId(ref.id);
    } catch (err) {
      console.error("Failed to create channel:", err);
    } finally {
      setCreatingGroup(false);
    }
  };

  // ── Manage members ────────────────────────────────────────────────────────
  const addMember    = async (uid: string) => { await updateDoc(doc(db, "chats", activeChatId), { participants: arrayUnion(uid) }); };
  const removeMember = async (uid: string) => { await updateDoc(doc(db, "chats", activeChatId), { participants: arrayRemove(uid) }); };
  const deleteChannel = async () => {
    if (!confirm(`Delete #${activeGroupConv?.name ?? activeChatId}? This cannot be undone.`)) return;
    await deleteDoc(doc(db, "chats", activeChatId));
    setShowManageMembers(false);
    setActiveChatId("general");
  };

  // ── Chat settings ─────────────────────────────────────────────────────────
  function toggleShowRemovedChats() {
    if (!isOwner) return;
    const next = !showRemovedChats;
    setShowRemovedChats(next);
    if (!next) setShowDeleted(false);
    try { localStorage.setItem(`chatSettings_showRemovedChats_${myUid}`, String(next)); } catch {}
  }

  // ── Archive / reset ───────────────────────────────────────────────────────
  const saveArchiveConfig = async () => {
    if (archiveSaving) return;
    setArchiveSaving(true);
    try {
      await setDoc(doc(db, "settings", "chatConfig"), {
        archiveStartDate: archiveDraftStart,
        archiveDuration: archiveDraftDuration,
      }, { merge: true });
    } catch (err) {
      console.error("Save archive config failed:", err);
    } finally {
      setArchiveSaving(false);
    }
  };

  const togglePerm = async (key: keyof ChatPermissions, role: PermRole) => {
    if (!isOwner) return;
    const next: ChatPermissions = { ...chatPerms, [key]: { ...chatPerms[key], [role]: !chatPerms[key][role] } };
    setChatPerms(next);
    try {
      await setDoc(doc(db, "settings", "chatConfig"), { permissions: next }, { merge: true });
    } catch (err) {
      console.error("Failed to save permissions", err);
      setChatPerms(chatPerms);
    }
  };

  const archiveNow = async () => {
    if (!confirm("Archive all messages before today? They will be hidden from view until 'Show archived' is enabled.")) return;
    const today = new Date().toISOString().slice(0, 10);
    setArchiveDraftStart(today);
    try {
      await setDoc(doc(db, "settings", "chatConfig"), {
        archiveStartDate: today,
        archiveDuration: archiveDraftDuration,
      }, { merge: true });
    } catch (err) {
      console.error("Archive now failed:", err);
    }
  };

  // ── @mention ──────────────────────────────────────────────────────────────
  const mentionUsers = mentionOpen
    ? allUsers.filter((u) => {
        const name = `${u.firstName} ${u.lastName}`.toLowerCase();
        return name.startsWith(mentionQuery.toLowerCase()) || u.firstName.toLowerCase().startsWith(mentionQuery.toLowerCase());
      }).slice(0, 6)
    : [];

  const insertMention = useCallback((user: PortalUser) => {
    const ta = textareaRef.current;
    if (!ta || mentionStart < 0) return;
    const before = draft.slice(0, mentionStart);
    const after  = draft.slice(ta.selectionStart);
    const insert = `@${user.firstName} ${user.lastName} `;
    setDraft(before + insert + after);
    setMentionOpen(false); setMentionQuery(""); setMentionStart(-1);
    setTimeout(() => {
      ta.focus();
      const pos = before.length + insert.length;
      ta.setSelectionRange(pos, pos);
    }, 0);
  }, [draft, mentionStart]);

  const handleDraftChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val   = e.target.value;
    const caret = e.target.selectionStart ?? val.length;
    setDraft(val);
    const textBefore = val.slice(0, caret);
    const atIdx = textBefore.lastIndexOf("@");
    if (atIdx !== -1) {
      const fragment = textBefore.slice(atIdx + 1);
      if (!fragment.includes(" ") && (atIdx === 0 || /\s/.test(textBefore[atIdx - 1]))) {
        setMentionStart(atIdx); setMentionQuery(fragment); setMentionOpen(true); setMentionIndex(0);
        return;
      }
    }
    setMentionOpen(false); setMentionQuery(""); setMentionStart(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionOpen && mentionUsers.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setMentionIndex((i) => (i + 1) % mentionUsers.length); return; }
      if (e.key === "ArrowUp")   { e.preventDefault(); setMentionIndex((i) => (i - 1 + mentionUsers.length) % mentionUsers.length); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertMention(mentionUsers[mentionIndex]); return; }
      if (e.key === "Escape")    { e.preventDefault(); setMentionOpen(false); return; }
    }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const groupConvs   = convs.filter((c) => c.type === "group" && !c.deletedBy?.includes(myUid));
  const dmConvs      = convs.filter((c) => c.type === "dm"    && !c.deletedBy?.includes(myUid));
  const deletedConvs = convs.filter((c) => c.deletedBy?.includes(myUid));

  const sortedGroupConvs = useMemo(() => {
    if (groupOrder.length === 0) return groupConvs;
    return [...groupConvs].sort((a, b) => {
      const ai = groupOrder.indexOf(a.id); const bi = groupOrder.indexOf(b.id);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1; if (bi === -1) return -1;
      return ai - bi;
    });
  }, [groupConvs, groupOrder]);

  const searchResults = searchText.trim()
    ? allUsers.filter((u) => u.uid !== myUid && `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchText.toLowerCase()))
    : [];

  const dmByUid = useMemo(() => {
    const map = new Map<string, ConvMeta>();
    for (const c of dmConvs) {
      const otherUid = c.participants.find((p) => p !== myUid);
      if (otherUid) map.set(otherUid, c);
    }
    return map;
  }, [dmConvs, myUid]);

  const usersByGroup = useMemo((): Record<RoleGroup, PortalUser[]> => {
    const groups: Record<RoleGroup, PortalUser[]> = { owner: [], admin: [], manager: [], rep: [] };
    for (const u of allUsers) {
      if (u.uid === myUid) continue;
      let g: RoleGroup;
      if (u.role === "owner" || u.role === "developer") g = "owner";
      else if (isAdminLevel(u.role)) g = "admin";
      else if (u.role === "manager") g = "manager";
      else g = "rep";
      groups[g].push(u);
    }
    for (const g of ROLE_GROUP_ORDER) {
      groups[g].sort((a, b) => `${a.firstName}${a.lastName}`.localeCompare(`${b.firstName}${b.lastName}`));
    }
    return groups;
  }, [allUsers, myUid, isAdminLevel]);

  const activeGroupConv    = groupConvs.find((c) => c.id === activeChatId);
  const activeDmConv       = dmConvs.find((c) => c.id === activeChatId);
  const activeDmOtherUid   = activeDmConv?.participants.find((p) => p !== myUid) ?? "";
  const activeDmOther      = allUsers.find((u) => u.uid === activeDmOtherUid);
  const activeIsChannel    = activeChatId === "general" || !!activeGroupConv;
  const activeParticipants = activeGroupConv?.participants ?? [];

  const activeName = activeChatId === "general"
    ? "general"
    : activeGroupConv?.name ?? (activeDmOther ? `${activeDmOther.firstName} ${activeDmOther.lastName}` : "Chat");

  const archiveCutoffMs = archiveConfig?.startDate && !showArchived
    ? new Date(archiveConfig.startDate + "T00:00:00").getTime() : 0;
  const visibleMessages = archiveCutoffMs > 0
    ? messages.filter((m) => !m.createdAt || m.createdAt.seconds * 1000 >= archiveCutoffMs)
    : messages;

  type Row = { type: "date"; label: string } | { type: "msg"; msg: ChatMessage; showHeader: boolean };
  const rows: Row[] = [];
  let lastDay = ""; let lastSender = "";
  for (const msg of visibleMessages) {
    const day = dayLabel(msg.createdAt);
    if (day !== lastDay) { rows.push({ type: "date", label: day }); lastDay = day; lastSender = ""; }
    rows.push({ type: "msg", msg, showHeader: msg.uid !== lastSender });
    lastSender = msg.uid;
  }

  const nameSorter = (a: ChatUser, b: ChatUser) => `${a.firstName}${a.lastName}`.localeCompare(`${b.firstName}${b.lastName}`);
  const activeUsers  = allUsers.filter((u) => presence[u.uid] === "active").sort(nameSorter);
  const idleUsers    = allUsers.filter((u) => presence[u.uid] === "idle").sort(nameSorter);
  const offlineUsers = allUsers.filter((u) => !presence[u.uid] || presence[u.uid] === "offline").sort(nameSorter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-app-bg">
        <svg className="w-6 h-6 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );
  }

  return (
    <>
    <div className="flex h-full overflow-hidden bg-app-bg">

      {/* ════ LEFT SIDEBAR ════ */}
      <div className="w-60 shrink-0 bg-app-surface border-r border-app-border flex flex-col">

        {/* Toolbar: search · permissions · settings */}
        <div className="px-2 pt-3 pb-2 border-b border-app-border shrink-0">
          <div className="flex items-center gap-0.5">

            {/* Search toggle */}
            <button type="button" onClick={() => { setShowSearch((v) => !v); if (showSearch) setSearchText(""); }}
              title="Search"
              className={`p-1.5 rounded-lg transition-colors ${showSearch ? "text-app-text bg-app-surface-2" : "text-app-text-4 hover:text-app-text hover:bg-app-surface-2"}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            <div className="flex-1" />

            {/* Permissions */}
            <div className="relative" ref={permissionsRef}>
              <button type="button" onClick={() => setShowPermissions((v) => !v)} title="Permissions"
                className={`p-1.5 rounded-lg transition-colors ${showPermissions ? "text-app-text bg-app-surface-2" : "text-app-text-4 hover:text-app-text hover:bg-app-surface-2"}`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                </svg>
              </button>
              {showPermissions && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-app-surface border border-app-border-2 rounded-lg shadow-xl z-50">
                  <div className="px-4 py-2.5 border-b border-app-border flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-app-text-4">Chat Permissions</p>
                    {isOwner && <p className="text-[9px] text-app-text-5">Click to toggle</p>}
                  </div>
                  <div className="px-4 py-3">
                    {/* Header row — col-span-2 label + 4 role cols = 6 */}
                    <div className="grid grid-cols-6 gap-1 pb-2 border-b border-app-border mb-1">
                      <div className="col-span-2" />
                      {(["CSR","TC/TL","Admin","Owner"] as const).map((r) => (
                        <p key={r} className="text-[8px] font-bold uppercase tracking-wide text-app-text-4 text-center leading-tight">{r}</p>
                      ))}
                    </div>
                    {PERM_LABELS.map(({ key, label }) => {
                      const row = chatPerms[key];
                      // Order: CSR (rep) → TC/TL (mgr) → Admin → Owner (lead, always on)
                      const roles: { role: PermRole; value: boolean }[] = [
                        { role: "rep",   value: row.rep   },
                        { role: "mgr",   value: row.mgr   },
                        { role: "admin", value: row.admin },
                        { role: "lead",  value: row.lead  },
                      ];
                      return (
                        <div key={key} className="grid grid-cols-6 gap-1 items-center py-1">
                          <p className="col-span-2 text-[10px] text-app-text-3 leading-tight">{label}</p>
                          {roles.map(({ role, value }) => {
                            // Developer can toggle everything; owner can toggle all except lead column and chatSettings row
                            const canEdit = isDeveloper || (isOwner && role !== "lead" && key !== "chatSettings");
                            return (
                              <div key={role} className="flex items-center justify-center">
                                {canEdit ? (
                                  // Clickable checkbox for owner
                                  <button
                                    type="button"
                                    onClick={() => togglePerm(key, role)}
                                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                                      value ? "bg-blue-600 border-blue-500 hover:bg-blue-500" : "bg-app-surface-2 border-app-border-2 hover:border-blue-400"
                                    }`}
                                  >
                                    {value && (
                                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                      </svg>
                                    )}
                                  </button>
                                ) : (
                                  // Read-only ✓ / ✗ for non-owners and locked cells
                                  value ? (
                                    <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                  ) : (
                                    <svg className="w-3.5 h-3.5 text-app-text-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  )
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                    <p className="text-[9px] text-app-text-2 mt-3">Owner &amp; Dev always have full access.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Settings (owner only) */}
            {isOwner && (
              <div ref={chatSettingsBtnRef}>
                <button type="button" onClick={() => setShowChatSettings((v) => !v)} title="Chat settings"
                  className={`p-1.5 rounded-lg transition-colors ${showChatSettings ? "text-app-text bg-app-surface-2" : "text-app-text-4 hover:text-app-text hover:bg-app-surface-2"}`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            )}

          </div>{/* end toolbar flex row */}


          {/* Animated search input */}
          <div
            style={{
              maxHeight: showSearch ? "2.5rem" : "0",
              opacity: showSearch ? 1 : 0,
              marginTop: showSearch ? "8px" : "0",
              overflow: "hidden",
              transition: "max-height 0.2s ease, opacity 0.18s ease, margin-top 0.2s ease",
            }}
          >
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-app-text-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Find or start a DM…"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                autoFocus={showSearch}
                className="w-full pl-8 pr-7 py-1.5 bg-app-surface-2 border border-app-border-2 rounded-md text-app-text text-xs placeholder-app-text-4 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {searchText && (
                <button type="button" onClick={() => setSearchText("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-app-text-4 hover:text-app-text">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2 space-y-1">
          {searchText.trim() ? (
            <>
              <p className="px-3 py-1 text-app-text-4 text-[10px] font-semibold uppercase tracking-wider">People</p>
              {searchResults.length === 0 ? (
                <p className="px-3 py-4 text-center text-app-text-5 text-xs">No users found.</p>
              ) : (
                searchResults.map((u) => (
                  <button key={u.uid} type="button" onClick={() => openDm(u)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-app-surface-2/60 transition text-left">
                    <Avatar photoURL={u.photoURL} name={`${u.firstName} ${u.lastName}`} uid={u.uid} size="sm" status={presence[u.uid]} level={u.level} teamNumber={u.teamNumber} />
                    <div className="min-w-0">
                      <p className="text-app-text text-xs font-medium truncate">{u.firstName} {u.lastName}</p>
                      <p className="text-app-text-4 text-[10px]">{roleLabel(u.role, u.level)}</p>
                    </div>
                  </button>
                ))
              )}
            </>
          ) : (
            <>
              {/* PINNED */}
              {pinnedIds.length > 0 && (() => {
                const pinnedItems = pinnedIds.map((id) => {
                  if (id === "general") return { id, label: "general", isChannel: true, lastMessageAt: generalMeta.lastMessageAt ?? null, conv: null as ConvMeta | null };
                  const g = groupConvs.find((c) => c.id === id);
                  if (g) return { id, label: g.name ?? id, isChannel: true, lastMessageAt: g.lastMessageAt ?? null, conv: g };
                  const dmConv = dmConvs.find((c) => c.id === id);
                  if (dmConv) {
                    const otherUid = dmConv.participants.find((p) => p !== myUid) ?? "";
                    const other = allUsers.find((u) => u.uid === otherUid);
                    return { id, label: other ? `${other.firstName} ${other.lastName}` : "DM", isChannel: false, lastMessageAt: dmConv.lastMessageAt ?? null, conv: dmConv };
                  }
                  return null;
                }).filter(Boolean) as { id: string; label: string; isChannel: boolean; lastMessageAt: { seconds: number } | null; conv: ConvMeta | null }[];
                if (pinnedItems.length === 0) return null;
                return (
                  <div>
                    <p className="px-3 py-1 text-app-text-4 text-[10px] font-semibold uppercase tracking-wider">Pinned</p>
                    {pinnedItems.map((item) => (
                      <div key={item.id} className="group/conv relative">
                        <button type="button" onClick={() => setActiveChatId(item.id)}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 pr-14 transition text-left rounded-md ${activeChatId === item.id ? "bg-app-surface-2 text-app-text" : "text-app-text-3 hover:bg-app-surface-2/60 hover:text-app-text"}`}>
                          {item.isChannel
                            ? <span className="text-sm font-medium shrink-0">#</span>
                            : (() => { const c = item.conv!; const otherUid = c.participants.find((p) => p !== myUid) ?? ""; const u = allUsers.find((x) => x.uid === otherUid); return <Avatar photoURL={u?.photoURL ?? ""} name={item.label} uid={otherUid} size="sm" status={presence[otherUid] ?? "offline"} />; })()
                          }
                          <span className="text-sm truncate flex-1">{item.label}</span>
                          {item.lastMessageAt && <span className="text-[10px] text-app-text-5 shrink-0">{fmtConvTime(item.lastMessageAt)}</span>}
                        </button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); togglePin(item.id); }} title="Unpin"
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/conv:opacity-100 p-0.5 text-yellow-500 hover:text-app-text-3 transition rounded">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6h2v-6h5v-2l-2-2z"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* CHANNELS */}
              <div>
                <div className="flex items-center justify-between px-3 py-1">
                  <span className="text-app-text-4 text-[10px] font-semibold uppercase tracking-wider">Channels</span>
                  {isOwner && (
                    <button type="button" onClick={() => setShowCreateGroup(true)} title="Create channel"
                      className="text-app-text-4 hover:text-app-text transition">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* # general */}
                {!pinnedIds.includes("general") && (
                  <div className="group/conv relative">
                    <button type="button" onClick={() => setActiveChatId("general")}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 pr-14 transition text-left rounded-md ${activeChatId === "general" ? "bg-app-surface-2 text-app-text" : "text-app-text-3 hover:bg-app-surface-2/60 hover:text-app-text"}`}>
                      <span className="text-sm font-medium">#</span>
                      <span className="text-sm truncate">general</span>
                      {generalMeta.lastMessageAt && (
                        <span className="ml-auto text-[10px] text-app-text-5 shrink-0">{fmtConvTime(generalMeta.lastMessageAt)}</span>
                      )}
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); togglePin("general"); }} title="Pin"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/conv:opacity-100 p-0.5 text-app-text-5 hover:text-yellow-400 transition rounded">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6h2v-6h5v-2l-2-2z"/></svg>
                    </button>
                  </div>
                )}

                {/* Group channels — with content only, owners can drag to reorder */}
                {sortedGroupConvs.filter((g) => g.lastMessageAt || g.lastMessage).filter((g) => !pinnedIds.includes(g.id)).map((g) => {
                  const isDragOver = dragOverGroupId === g.id;
                  return (
                    <div
                      key={g.id}
                      className={`group/conv relative transition-all ${isDragOver ? "border-t-2 border-yellow-500" : "border-t-2 border-transparent"}`}
                      draggable={isOwner}
                      onDragStart={isOwner ? () => { dragGroupRef.current = g.id; } : undefined}
                      onDragOver={isOwner ? (e) => { e.preventDefault(); setDragOverGroupId(g.id); } : undefined}
                      onDragLeave={isOwner ? () => setDragOverGroupId(null) : undefined}
                      onDrop={isOwner ? () => {
                        const fromId = dragGroupRef.current;
                        dragGroupRef.current = null;
                        setDragOverGroupId(null);
                        if (!fromId || fromId === g.id) return;
                        setGroupOrder((prev) => {
                          const base = prev.length > 0 ? [...prev] : sortedGroupConvs.map((x) => x.id);
                          groupConvs.forEach((x) => { if (!base.includes(x.id)) base.push(x.id); });
                          const fi = base.indexOf(fromId); const ti = base.indexOf(g.id);
                          if (fi === -1 || ti === -1) return prev;
                          const next = [...base]; next.splice(fi, 1); next.splice(ti, 0, fromId);
                          localStorage.setItem(`groupOrder_${myUid}`, JSON.stringify(next));
                          return next;
                        });
                      } : undefined}
                    >
                      <button type="button" onClick={() => setActiveChatId(g.id)}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 transition text-left rounded-md ${isOwner ? "pr-14 cursor-grab active:cursor-grabbing" : "pr-14"} ${activeChatId === g.id ? "bg-app-surface-2 text-app-text" : "text-app-text-3 hover:bg-app-surface-2/60 hover:text-app-text"}`}>
                        <span className="text-sm font-medium">#</span>
                        <span className="text-sm truncate">{g.name ?? g.id}</span>
                        {g.lastMessageAt && (
                          <span className="ml-auto text-[10px] text-app-text-5 shrink-0">{fmtConvTime(g.lastMessageAt)}</span>
                        )}
                      </button>
                      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/conv:opacity-100 flex items-center gap-0.5">
                        <button type="button" onClick={(e) => { e.stopPropagation(); togglePin(g.id); }} title="Pin"
                          className="p-0.5 text-app-text-5 hover:text-yellow-400 transition rounded">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6h2v-6h5v-2l-2-2z"/></svg>
                        </button>
                        {isOwner && (
                          <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(g); }} title="Hide channel"
                            className="p-0.5 text-app-text-5 hover:text-red-400 transition rounded">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DIRECT MESSAGES — only convs with content */}
              {dmConvs.filter((c) => c.lastMessageAt || c.lastMessage).filter((c) => !pinnedIds.includes(c.id)).length > 0 && (
                <div className="pt-2">
                  <p className="px-3 py-1 text-app-text-4 text-[10px] font-semibold uppercase tracking-wider">Direct Messages</p>
                  {dmConvs
                    .filter((c) => c.lastMessageAt || c.lastMessage)
                    .filter((c) => !pinnedIds.includes(c.id))
                    .map((conv) => {
                      const otherUid = conv.participants.find((p) => p !== myUid) ?? "";
                      const other = allUsers.find((u) => u.uid === otherUid);
                      if (!other) return null;
                      const isActive = conv.id === activeChatId;
                      return (
                        <div key={conv.id} className="group/conv relative">
                          <button type="button" onClick={() => setActiveChatId(conv.id)}
                            className={`w-full flex items-center gap-2.5 px-3 py-1.5 pr-14 transition text-left rounded-md ${isActive ? "bg-app-surface-2 text-app-text" : "text-app-text-3 hover:bg-app-surface-2/60 hover:text-app-text"}`}>
                            <Avatar photoURL={other.photoURL} name={`${other.firstName} ${other.lastName}`} uid={other.uid} size="sm" status={presence[other.uid] ?? "offline"} />
                            <span className="text-sm truncate flex-1">{other.firstName} {other.lastName}</span>
                            {conv.lastMessageAt && (
                              <span className="text-[10px] text-app-text-5 shrink-0">{fmtConvTime(conv.lastMessageAt)}</span>
                            )}
                          </button>
                          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/conv:opacity-100 flex items-center gap-0.5">
                            <button type="button" onClick={(e) => { e.stopPropagation(); togglePin(conv.id); }} title="Pin"
                              className="p-0.5 text-app-text-5 hover:text-yellow-400 transition rounded">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6h2v-6h5v-2l-2-2z"/></svg>
                            </button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(conv); }} title="Hide conversation"
                              className="p-0.5 text-app-text-5 hover:text-red-400 transition rounded">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Deleted / hidden conversations */}
        {isOwner && showRemovedChats && deletedConvs.length > 0 && (
          <div className="border-t border-app-border">
            <button type="button" onClick={() => setShowDeleted((v) => !v)}
              className="w-full flex items-center gap-1.5 px-3 py-2 text-app-text-5 hover:text-app-text-3 transition text-left">
              <svg className={`w-3 h-3 shrink-0 transition-transform ${showDeleted ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              <span className="text-[10px] font-semibold uppercase tracking-wider">Hidden ({deletedConvs.length})</span>
            </button>
            {showDeleted && (
              <div className="pb-1">
                {deletedConvs.map((c) => {
                  const isGroup = c.type === "group";
                  const otherUid = !isGroup ? (c.participants.find((p) => p !== myUid) ?? "") : "";
                  const other = otherUid ? allUsers.find((u) => u.uid === otherUid) : null;
                  const name = isGroup ? (c.name ?? c.id) : (other ? `${other.firstName} ${other.lastName}` : "Unknown");
                  return (
                    <div key={c.id} className="flex items-center gap-2 px-3 py-1.5">
                      {isGroup ? (
                        <span className="text-app-text-2 text-sm font-medium shrink-0">#</span>
                      ) : (
                        <Avatar photoURL={other?.photoURL ?? ""} name={name} uid={otherUid} size="sm" />
                      )}
                      <span className="text-app-text-5 text-xs truncate flex-1">{name}</span>
                      <button type="button" onClick={() => restoreConversation(c.id)}
                        className="shrink-0 px-2 py-0.5 text-[10px] font-medium text-app-text-4 hover:text-green-400 border border-app-border-2 hover:border-green-700 rounded-full transition">
                        Restore
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* My profile */}
        <div className="px-3 pt-2.5 pb-5 border-t border-app-border flex items-center gap-2">
          <Avatar photoURL={me.photoURL} name={`${me.firstName} ${me.lastName}`} uid={myUid} size="sm" status={"active"} level={me.level} teamNumber={me.teamNumber} />
          <div className="min-w-0">
            <p className="text-app-text text-xs font-medium truncate">{me.firstName} {me.lastName}</p>
            <p className="text-app-text-4 text-[10px]">{teamLabel(me)}</p>
          </div>
        </div>
      </div>

      {/* ════ CENTER — Messages ════ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-app-border bg-app-surface shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {activeIsChannel ? (
              <span className="text-app-text-2 text-xl font-bold leading-none">#</span>
            ) : (
              <Avatar
                photoURL={activeDmOther?.photoURL ?? ""}
                name={activeDmOther ? `${activeDmOther.firstName} ${activeDmOther.lastName}` : ""}
                uid={activeDmOtherUid}
                size="md"
                status={presence[activeDmOtherUid] ?? "offline"}
                level={activeDmOther?.level}
                teamNumber={activeDmOther?.teamNumber}
              />
            )}
            <div className="min-w-0">
              <p className="text-app-text font-semibold text-sm truncate">{activeName}</p>
              <p className="text-app-text-4 text-xs">
                {activeChatId === "general"
                  ? `Team channel · ${allUsers.length} members`
                  : activeGroupConv
                    ? `${activeParticipants.length} member${activeParticipants.length !== 1 ? "s" : ""}`
                    : activeDmOther
                      ? `${presence[activeDmOtherUid] === "active" ? "● Active" : presence[activeDmOtherUid] === "idle" ? "◐ Idle" : "○ Offline"} · ${roleLabel(activeDmOther.role, activeDmOther.level)}`
                      : ""}
              </p>
            </div>
          </div>
          {isOwner && activeGroupConv && (
            <button type="button" onClick={() => setShowManageMembers(true)} title="Manage members"
              className="p-1.5 text-app-text-3 hover:text-app-text hover:bg-app-surface-2 rounded-lg transition shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </button>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-5 py-4">

          {/* Archive notices */}
          {archiveConfig?.startDate && messages.length > 0 && (
            <div className="flex items-center justify-center gap-1.5 py-2 mb-2">
              <svg className="w-3.5 h-3.5 text-app-text-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
              {showArchived ? (
                <>
                  <span className="text-amber-600 text-xs">Showing archived messages</span>
                  {isOwner && <button type="button" onClick={() => setShowArchived(false)} className="text-blue-500 text-xs hover:underline">Hide</button>}
                </>
              ) : (
                <>
                  <span className="text-app-text-5 text-xs">Messages before {archiveConfig.startDate} are archived</span>
                  {isOwner && <button type="button" onClick={() => setShowArchived(true)} className="text-blue-500 text-xs hover:underline">Show</button>}
                </>
              )}
            </div>
          )}
          {!archiveConfig?.startDate && !isOwner && messages.length > 0 && (
            <div className="flex items-center justify-center gap-1.5 py-2 mb-2">
              <svg className="w-3.5 h-3.5 text-app-text-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
              <span className="text-app-text-5 text-xs">Messages older than 7 days are archived</span>
            </div>
          )}

          {visibleMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <div className="w-14 h-14 rounded-full bg-app-surface-2 border border-app-border-2 flex items-center justify-center">
                {activeIsChannel ? (
                  <span className="text-app-text-4 text-2xl font-bold">#</span>
                ) : (
                  <svg className="w-7 h-7 text-app-text-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-app-text-2 text-sm font-semibold">
                  {activeIsChannel ? `Welcome to #${activeName}!` : `Your conversation with ${activeName}`}
                </p>
                <p className="text-app-text-5 text-xs mt-1">
                  {activeIsChannel ? "This is the very beginning of this channel." : "Send a message to start the conversation."}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-0.5">
            {rows.map((row, i) => {
              if (row.type === "date") {
                return (
                  <div key={`d-${i}`} className="flex items-center gap-3 py-4">
                    <div className="flex-1 h-px bg-app-surface-2" />
                    <span className="text-app-text-5 text-xs font-medium px-2 shrink-0">{row.label}</span>
                    <div className="flex-1 h-px bg-app-surface-2" />
                  </div>
                );
              }
              const { msg, showHeader } = row;
              const isMine = msg.uid === myUid;
              return (
                <div key={msg.id} className={`flex items-end gap-2.5 ${isMine ? "flex-row-reverse" : "flex-row"} ${showHeader ? "mt-4" : "mt-0.5"}`}>
                  <div className="w-8 shrink-0">
                    {!isMine && showHeader && (
                      <Avatar photoURL={msg.photoURL} name={msg.displayName} uid={msg.uid} size="sm" />
                    )}
                  </div>
                  <div className={`flex flex-col max-w-[65%] ${isMine ? "items-end" : "items-start"}`}>
                    {showHeader && !isMine && (
                      <p className="text-app-text-3 text-xs font-medium mb-1 px-1">{msg.displayName}</p>
                    )}
                    {msg.imageUrl && (
                      <button type="button" onClick={() => setLightboxUrl(msg.imageUrl!)}
                        className={`mb-1 block overflow-hidden rounded-2xl ${isMine ? "rounded-br-sm" : "rounded-bl-sm"} hover:opacity-90 transition-opacity focus:outline-none`}>
                        <img src={msg.imageUrl} alt="Shared image" className="max-w-45 max-h-45 object-cover block" />
                      </button>
                    )}
                    {msg.text && (
                      <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap wrap-break-word ${
                        isMine ? "bg-blue-600 text-white rounded-br-sm" : "bg-app-surface-2 text-app-text rounded-bl-sm"
                      }`}>
                        {renderWithMentions(msg.text, `${me.firstName} ${me.lastName}`)}
                      </div>
                    )}
                    <span className="text-app-text-5 text-[11px] mt-1 px-1">{fmtTime(msg.createdAt)}</span>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} className="h-1" />
          </div>
        </div>

        {/* Composer */}
        <div className="px-4 pb-4 pt-2 border-t border-app-border bg-app-surface shrink-0">
          {mentionOpen && mentionUsers.length > 0 && (
            <div ref={mentionListRef} className="mb-2 bg-app-surface-2 border border-app-border-2 rounded-xl overflow-hidden shadow-2xl">
              {mentionUsers.map((u, idx) => (
                <button key={u.uid} type="button"
                  onMouseDown={(e) => { e.preventDefault(); insertMention(u); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition ${idx === mentionIndex ? "bg-blue-600/20" : "hover:bg-app-surface-2/60"}`}>
                  <Avatar photoURL={u.photoURL} name={`${u.firstName} ${u.lastName}`} uid={u.uid} size="sm" status={presence[u.uid]} level={u.level} teamNumber={u.teamNumber} />
                  <div className="min-w-0">
                    <p className="text-app-text text-sm font-medium truncate">{u.firstName} {u.lastName}</p>
                    <p className="text-app-text-4 text-[10px]">{roleLabel(u.role, u.level)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {imagePreview && (
            <div className="relative inline-block mb-2 ml-10">
              <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-xl border border-app-border-2" />
              <button type="button"
                onClick={() => { if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview); setImageFile(null); setImagePreview(""); }}
                className="absolute -top-2 -right-2 w-5 h-5 bg-app-surface-2 hover:bg-app-surface-2 rounded-full flex items-center justify-center text-app-text transition">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="mb-0.5 p-2 text-app-text-4 hover:text-app-text hover:bg-app-surface-2 rounded-xl transition shrink-0" title="Attach image">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
              </svg>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f || !f.type.startsWith("image/")) return;
                if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
                setImageFile(f);
                setImagePreview(URL.createObjectURL(f));
                e.target.value = "";
              }}
            />
            <textarea ref={textareaRef} value={draft} onChange={handleDraftChange} onKeyDown={handleKeyDown}
              placeholder={activeIsChannel ? `Message #${activeName}…` : `Message ${activeName}…`}
              rows={1}
              className="flex-1 px-4 py-2.5 bg-app-surface-2 border border-app-border-2 rounded-2xl text-app-text text-sm placeholder-app-text-4 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden leading-relaxed"
              style={{ minHeight: "42px", maxHeight: "120px" }}
            />
            <button type="button" onClick={sendMessage} disabled={(!draft.trim() && !imageFile) || sending}
              className="mb-0.5 w-9 h-9 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-500 disabled:bg-app-surface-2 disabled:text-app-text-5 text-white transition shrink-0">
              {sending ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ════ RIGHT — Members ════ */}
      <div className="w-56 shrink-0 bg-app-surface border-l border-app-border flex flex-col overflow-hidden">
        <div className="pl-3 pr-3 py-3 border-b border-app-border">
          <p className="text-app-text-3 text-[10px] font-semibold uppercase tracking-wider">Members — {allUsers.length}</p>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {activeUsers.length > 0 && (
            <>
              <p className="pl-3 pr-3 pb-1 pt-1 text-app-text-4 text-[10px] font-semibold uppercase tracking-wider">Active — {activeUsers.length}</p>
              {activeUsers.map((u) => (
                <button key={u.uid} type="button"
                  onClick={() => { if (u.uid !== myUid) openDm(u); }}
                  className={`w-full flex items-start gap-2 pl-3 pr-3 pt-2 pb-3 text-left transition ${u.uid !== myUid ? "hover:bg-app-surface-2/60 cursor-pointer" : "cursor-default"}`}>
                  <Avatar photoURL={u.photoURL} name={`${u.firstName} ${u.lastName}`} uid={u.uid} size="sm" status="active" level={u.level} teamNumber={u.teamNumber} />
                  <div className="min-w-0 pt-0.5">
                    <p className="text-app-text text-xs font-medium truncate">{u.firstName} {u.lastName}</p>
                    <p className="text-app-text-4 text-[10px]">{teamLabel(u)}</p>
                  </div>
                </button>
              ))}
            </>
          )}
          {idleUsers.length > 0 && (
            <>
              <p className="pl-3 pr-3 pb-1 pt-3 text-app-text-4 text-[10px] font-semibold uppercase tracking-wider">Idle — {idleUsers.length}</p>
              {idleUsers.map((u) => (
                <button key={u.uid} type="button"
                  onClick={() => { if (u.uid !== myUid) openDm(u); }}
                  className={`w-full flex items-start gap-2 pl-3 pr-3 pt-2 pb-3 text-left transition ${u.uid !== myUid ? "hover:bg-app-surface-2/60 cursor-pointer" : "cursor-default"}`}>
                  <Avatar photoURL={u.photoURL} name={`${u.firstName} ${u.lastName}`} uid={u.uid} size="sm" status="idle" level={u.level} teamNumber={u.teamNumber} />
                  <div className="min-w-0 pt-0.5">
                    <p className="text-app-text-3 text-xs font-medium truncate">{u.firstName} {u.lastName}</p>
                    <p className="text-app-text-4 text-[10px]">{teamLabel(u)}</p>
                  </div>
                </button>
              ))}
            </>
          )}
          {offlineUsers.length > 0 && (
            <>
              <p className="pl-3 pr-3 pb-1 pt-3 text-app-text-4 text-[10px] font-semibold uppercase tracking-wider">Offline — {offlineUsers.length}</p>
              {offlineUsers.map((u) => (
                <button key={u.uid} type="button"
                  onClick={() => { if (u.uid !== myUid) openDm(u); }}
                  className={`w-full flex items-start gap-2 pl-3 pr-3 pt-2 pb-3 text-left transition ${u.uid !== myUid ? "hover:bg-app-surface-2/60 cursor-pointer" : "cursor-default"}`}>
                  <Avatar photoURL={u.photoURL} name={`${u.firstName} ${u.lastName}`} uid={u.uid} size="sm" status="offline" level={u.level} teamNumber={u.teamNumber} />
                  <div className="min-w-0 pt-0.5">
                    <p className="text-app-text-4 text-xs font-medium truncate">{u.firstName} {u.lastName}</p>
                    <p className="text-app-text-4 text-[10px]">{teamLabel(u)}</p>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      </div>

    </div>

    {/* ── Settings flyout — fixed position escapes all overflow ── */}
    {isOwner && showChatSettings && (
      <div
        ref={chatSettingsPanelRef}
        style={{ position: "fixed", left: settingsFlyoutPos.left, top: settingsFlyoutPos.top, zIndex: 9999 }}
        className="w-80 bg-app-surface border border-app-border-2 rounded-lg shadow-2xl overflow-y-auto max-h-[80vh]"
      >
        <div className="px-4 py-2.5 border-b border-app-border">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-app-text-4">Chat Settings</p>
        </div>
        <div className="px-4 py-4 space-y-4">

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-app-text font-medium leading-snug">Show removed chats</p>
              <p className="text-[10px] text-app-text-4 leading-snug mt-0.5">
                {showRemovedChats ? "Hidden chats are visible and can be restored." : "Hidden chats are not shown."}
              </p>
            </div>
            <button type="button" onClick={toggleShowRemovedChats}
              className={`shrink-0 w-8 rounded-full transition-colors relative mt-0.5 ${showRemovedChats ? "bg-blue-600" : "bg-app-surface-2"}`}
              style={{ minWidth: "2rem", height: "1.125rem" }}>
              <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${showRemovedChats ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
          </div>

          <div className="flex items-start justify-between gap-3 border-t border-app-border pt-4">
            <div className="min-w-0">
              <p className="text-xs text-app-text font-medium leading-snug">Show archived messages</p>
              <p className="text-[10px] text-app-text-4 leading-snug mt-0.5">
                {showArchived ? "Archived messages are visible." : "Messages before the archive cutoff are hidden."}
              </p>
            </div>
            <button type="button" onClick={() => setShowArchived((v) => !v)}
              className={`shrink-0 w-8 rounded-full transition-colors relative mt-0.5 ${showArchived ? "bg-blue-600" : "bg-app-surface-2"}`}
              style={{ minWidth: "2rem", height: "1.125rem" }}>
              <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${showArchived ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
          </div>

          <div className="border-t border-app-border pt-4 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-app-text-4">Message Archive</p>
            <div>
              <p className="text-[10px] text-app-text-3 mb-1">Archive cutoff date</p>
              <input type="date" value={archiveDraftStart} onChange={(e) => setArchiveDraftStart(e.target.value)}
                className="w-full px-2 py-1 text-xs bg-app-surface-2 border border-app-border-2 rounded text-app-text focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <p className="text-[10px] text-app-text-3 mb-1">Reset schedule</p>
              <select value={archiveDraftDuration} onChange={(e) => setArchiveDraftDuration(e.target.value)}
                className="w-full px-2 py-1 text-xs bg-app-surface-2 border border-app-border-2 rounded text-app-text focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="weekly">Weekly (every Monday)</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={archiveNow}
                className="flex-1 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-600/30 rounded transition">
                Archive Now
              </button>
              <button type="button" onClick={saveArchiveConfig} disabled={archiveSaving}
                className="flex-1 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/30 rounded disabled:opacity-50 transition">
                {archiveSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>

        </div>
      </div>
    )}

    {/* ── Hide conversation confirmation ── */}
    {deleteConfirm && (() => {
      const isGroup = deleteConfirm.type === "group";
      const otherUid = !isGroup ? (deleteConfirm.participants.find((p) => p !== myUid) ?? "") : "";
      const other = otherUid ? allUsers.find((u) => u.uid === otherUid) : null;
      const name = isGroup ? (deleteConfirm.name ?? deleteConfirm.id) : (other ? `${other.firstName} ${other.lastName}` : "Unknown");
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-app-surface border border-app-border-2 rounded-xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </div>
              <div>
                <p className="text-app-text font-semibold text-sm">Hide this conversation?</p>
                <p className="text-app-text-4 text-xs mt-0.5">{isGroup ? "#" : ""}{name}</p>
              </div>
            </div>
            <p className="text-app-text-3 text-sm mb-5">
              This conversation will be hidden from your sidebar. No messages are deleted — you can restore it from the Hidden section.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button type="button" onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-app-text-3 hover:text-app-text transition">Cancel</button>
              <button type="button" onClick={() => deleteConversation(deleteConfirm.id)}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg transition">
                Hide conversation
              </button>
            </div>
          </div>
        </div>
      );
    })()}

    {/* ── Image lightbox ── */}
    {lightboxUrl && (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
        onClick={() => setLightboxUrl("")}
        onKeyDown={(e) => e.key === "Escape" && setLightboxUrl("")}
        tabIndex={-1}>
        <button type="button" onClick={() => setLightboxUrl("")}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-app-surface-2/80 text-app-text hover:bg-app-surface-2 transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <img src={lightboxUrl} alt="Full size" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
        <a href={lightboxUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
          className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-app-surface-2/80 text-app-text-2 hover:text-app-text text-xs rounded-lg transition">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          Open original
        </a>
      </div>
    )}

    {/* ── Create Group Channel Modal ── */}
    {showCreateGroup && (
      <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
        onClick={(e) => { if (e.target === e.currentTarget) { setShowCreateGroup(false); setNewGroupName(""); setNewGroupMembers([]); } }}>
        <div className="bg-app-surface border border-app-border-2 rounded-2xl w-full max-w-md p-6 shadow-2xl">
          <h3 className="text-app-text font-bold text-lg mb-1">Create Channel</h3>
          <p className="text-app-text-4 text-sm mb-5">Channels are where your team communicates.</p>
          <label className="block text-app-text-3 text-xs font-semibold uppercase tracking-wider mb-1.5">Channel Name</label>
          <div className="flex items-center gap-2 bg-app-surface-2 border border-app-border-2 rounded-xl px-3 py-2 mb-5 focus-within:ring-2 focus-within:ring-blue-500">
            <span className="text-app-text-3 text-sm">#</span>
            <input type="text" value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value.toLowerCase().replace(/[^a-z0-9-\s]/g, ""))}
              placeholder="new-channel" autoFocus
              className="flex-1 bg-transparent text-app-text text-sm placeholder-app-text-5 focus:outline-none"
              onKeyDown={(e) => e.key === "Enter" && createGroupChannel()}
            />
          </div>
          <label className="block text-app-text-3 text-xs font-semibold uppercase tracking-wider mb-1.5">Add Members</label>
          <div className="max-h-48 overflow-y-auto border border-app-border-2 rounded-xl bg-app-surface-2/50 mb-5">
            {allUsers.filter((u) => u.uid !== myUid).map((u) => {
              const checked = newGroupMembers.includes(u.uid);
              return (
                <button key={u.uid} type="button"
                  onClick={() => setNewGroupMembers((prev) => checked ? prev.filter((id) => id !== u.uid) : [...prev, u.uid])}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-app-surface-2/50 transition text-left border-b border-app-border-2/50 last:border-0">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition ${checked ? "bg-blue-600 border-blue-600" : "border-app-border-2"}`}>
                    {checked && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>}
                  </div>
                  <Avatar photoURL={u.photoURL} name={`${u.firstName} ${u.lastName}`} uid={u.uid} size="sm" level={u.level} teamNumber={u.teamNumber} />
                  <div className="min-w-0">
                    <p className="text-app-text text-sm font-medium truncate">{u.firstName} {u.lastName}</p>
                    <p className="text-app-text-4 text-xs">{roleLabel(u.role, u.level)}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => { setShowCreateGroup(false); setNewGroupName(""); setNewGroupMembers([]); }}
              className="px-4 py-2 text-app-text-3 hover:text-app-text text-sm transition">Cancel</button>
            <button type="button" onClick={createGroupChannel} disabled={!newGroupName.trim() || creatingGroup}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-app-surface-2 disabled:text-app-text-4 text-white text-sm font-semibold rounded-xl transition">
              {creatingGroup ? "Creating…" : "Create Channel"}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── Manage Members Modal ── */}
    {showManageMembers && activeGroupConv && (
      <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
        onClick={(e) => { if (e.target === e.currentTarget) setShowManageMembers(false); }}>
        <div className="bg-app-surface border border-app-border-2 rounded-2xl w-full max-w-md p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-app-text font-bold text-lg">#{activeGroupConv.name ?? activeChatId}</h3>
            <button type="button" onClick={() => setShowManageMembers(false)} className="text-app-text-4 hover:text-app-text transition">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-app-text-3 text-xs font-semibold uppercase tracking-wider mb-2">Members ({activeParticipants.length})</p>
          <div className="max-h-44 overflow-y-auto border border-app-border-2 rounded-xl bg-app-surface-2/50 mb-4">
            {activeParticipants.map((uid) => {
              const u = allUsers.find((x) => x.uid === uid);
              const name = u ? `${u.firstName} ${u.lastName}` : uid;
              return (
                <div key={uid} className="flex items-center gap-3 px-3 py-2.5 border-b border-app-border-2/50 last:border-0">
                  <Avatar photoURL={u?.photoURL ?? ""} name={name} uid={uid} size="sm" status={presence[uid]} level={u?.level} teamNumber={u?.teamNumber} />
                  <div className="min-w-0 flex-1">
                    <p className="text-app-text text-sm font-medium truncate">{name}</p>
                    {u && <p className="text-app-text-4 text-xs">{roleLabel(u.role, u.level)}</p>}
                  </div>
                  {uid !== myUid && (
                    <button type="button" onClick={() => removeMember(uid)}
                      className="text-app-text-5 hover:text-red-400 transition text-xs shrink-0 px-2 py-1 rounded hover:bg-red-950/30">
                      Remove
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-app-text-3 text-xs font-semibold uppercase tracking-wider mb-2">Add Members</p>
          <div className="max-h-36 overflow-y-auto border border-app-border-2 rounded-xl bg-app-surface-2/50 mb-5">
            {allUsers.filter((u) => !activeParticipants.includes(u.uid)).length === 0 ? (
              <p className="px-3 py-4 text-center text-app-text-5 text-xs">All members are already in this channel.</p>
            ) : (
              allUsers.filter((u) => !activeParticipants.includes(u.uid)).map((u) => (
                <button key={u.uid} type="button" onClick={() => addMember(u.uid)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-app-surface-2/50 transition text-left border-b border-app-border-2/50 last:border-0">
                  <Avatar photoURL={u.photoURL} name={`${u.firstName} ${u.lastName}`} uid={u.uid} size="sm" level={u.level} teamNumber={u.teamNumber} />
                  <div className="min-w-0 flex-1">
                    <p className="text-app-text text-sm font-medium truncate">{u.firstName} {u.lastName}</p>
                    <p className="text-app-text-4 text-xs">{roleLabel(u.role, u.level)}</p>
                  </div>
                  <svg className="w-4 h-4 text-app-text-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              ))
            )}
          </div>
          <button type="button" onClick={deleteChannel}
            className="w-full py-2 text-red-500 hover:text-red-400 hover:bg-red-950/40 border border-red-900/50 rounded-xl text-sm font-medium transition">
            Delete Channel
          </button>
        </div>
      </div>
    )}
    </>
  );
}
