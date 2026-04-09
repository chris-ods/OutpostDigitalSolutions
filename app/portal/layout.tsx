"use client";

import { useEffect, useState, useRef } from "react";
import { signOut } from "firebase/auth";
import { doc, getDoc, getDocs, updateDoc, setDoc, collection, query, orderBy, limit, where, onSnapshot, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BrandLogo } from "../../lib/components/BrandLogo";
import { useUserClaim } from "../../lib/hooks/useUserClaim";
import { TeamColorProvider } from "../../lib/teamColorContext";
import { isAdminLevel } from "../../lib/types";
import { useTheme } from "../../lib/themeContext";
import { Spinner } from "../../lib/components/Spinner";
import TermsModal from "../../components/TermsModal";

const IDLE_MS    = 60 * 60 * 1000; // 1 hour
const WARNING_MS =      60 * 1000; // warn 60 s before timeout
const IDLE_PRESENCE_MS = 5 * 60 * 1000; // 5 min → mark presence as idle

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const claim = useUserClaim();
  const { resolvedTheme, setTheme } = useTheme();
  const user = claim.user;
  const profile = claim.profile;
  const loading = claim.loading;
  const [pendingCount, setPendingCount] = useState(0);
  const [payrollNotifCount, setPayrollNotifCount] = useState(0);
  const [phase, setPhase] = useState<"testing"|"merging"|"live">("live");
  const [chatUnread, setChatUnread] = useState(0);
  const [chatEnabled, setChatEnabled] = useState(false);
  const [showIdleWarning, setShowIdleWarning] = useState(false);
  const [idleCountdown, setIdleCountdown] = useState(60);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // License alerts
  const [licenseAlertTotal, setLicenseAlertTotal] = useState(0);
  const [licenseAlertHasExpired, setLicenseAlertHasExpired] = useState(false);
  const [showLicenseBanner, setShowLicenseBanner] = useState(false);
  const [licenseBannerHasExpired, setLicenseBannerHasExpired] = useState(false);
  // Terms & Conditions
  const [termsHtml, setTermsHtml] = useState("");
  const [termsVersion, setTermsVersion] = useState(0);
  const [showTerms, setShowTerms] = useState(false);
  // New onboarding completions (admin only)
  const [newOnboardingCount, setNewOnboardingCount] = useState(0);
  const [newOnboardingNames, setNewOnboardingNames] = useState<string[]>([]);
  const [showOnboardingBanner, setShowOnboardingBanner] = useState(false);
  // Badge: new doc count (all users)
  const [newDocCount, setNewDocCount] = useState(0);
  const idleTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownInt = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  // Keep a ref so onSnapshot callbacks always see the current pathname
  const pathnameRef = useRef(pathname);

  // ── Auth redirect ────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    if (!profile && !pathname.startsWith("/portal/onboarding")) {
      router.push("/portal/onboarding");
      return;
    }
    // Force users who haven't signed the onboarding packet through the wizard
    if (profile && !profile.onboardingPacketSigned && !pathname.startsWith("/portal/onboarding")) {
      router.push("/portal/onboarding");
      return;
    }
  }, [loading, user, profile, pathname, router]);

  // ── Load settings (phase, chatEnabled) ──────────────────────────────────
  useEffect(() => {
    if (!claim.uid) return;
    getDoc(doc(db, "settings", "appConfig")).then((snap) => {
      if (snap.exists()) {
        setPhase((snap.data().phase as "testing"|"merging"|"live") ?? "live");
        setChatEnabled(snap.data().chatEnabled === true);
      }
    }).catch(() => {});
  }, [claim.uid]);

  // Load Terms & Conditions — show once per session if not accepted
  useEffect(() => {
    if (!claim.uid || !profile) return;
    getDoc(doc(db, "settings", "terms")).then((snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const currentVersion = (data.version as number) ?? 0;
      const html = (data.html as string) ?? "";
      if (currentVersion > 0 && html) {
        setTermsHtml(html);
        setTermsVersion(currentVersion);
        const userAccepted = (profile as any).acceptedTermsVersion ?? 0;
        if (userAccepted < currentVersion && !sessionStorage.getItem("termsDismissed")) {
          setShowTerms(true);
        } else {
          setShowTerms(false);
        }
      }
    }).catch(() => {});
  }, [claim.uid, profile]);

  // Presence heartbeat — write status (active/idle/offline) on mount, offline on unload/hidden
  useEffect(() => {
    if (!claim.uid) return;
    const uid = claim.uid;
    const presenceRef = doc(db, "presence", uid);
    const write = (status: "active" | "idle" | "offline") =>
      setDoc(presenceRef, { online: status !== "offline", status, lastSeen: serverTimestamp() }, { merge: true }).catch(() => {});

    let idlePresenceTimer: ReturnType<typeof setTimeout> | null = null;

    const markActive = () => {
      if (idlePresenceTimer) clearTimeout(idlePresenceTimer);
      write("active");
      idlePresenceTimer = setTimeout(() => write("idle"), IDLE_PRESENCE_MS);
    };

    markActive();
    const heartbeat = setInterval(() => {
      // heartbeat keeps lastSeen fresh but doesn't reset idle state
    }, 60_000);

    const activityEvents = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    activityEvents.forEach((e) => window.addEventListener(e, markActive, { passive: true }));

    const onVisibility = () => {
      if (document.visibilityState === "visible") markActive();
      else write("idle");
    };
    const onUnload = () => write("offline");
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      clearInterval(heartbeat);
      if (idlePresenceTimer) clearTimeout(idlePresenceTimer);
      activityEvents.forEach((e) => window.removeEventListener(e, markActive));
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onUnload);
      write("offline");
    };
  }, [claim.uid]);

  // ── Inactivity timeout ──────────────────────────────────────────────────
  useEffect(() => {
    if (!claim.uid) return;

    const doSignOut = async () => {
      setShowIdleWarning(false);
      if (claim.uid) {
        await setDoc(doc(db, "presence", claim.uid), { online: false, status: "offline", lastSeen: serverTimestamp() }, { merge: true }).catch(() => {});
      }
      await signOut(auth);
      router.push("/login");
    };

    const clearAll = () => {
      if (idleTimer.current)    clearTimeout(idleTimer.current);
      if (warnTimer.current)    clearTimeout(warnTimer.current);
      if (countdownInt.current) clearInterval(countdownInt.current);
    };

    const resetTimers = () => {
      clearAll();
      setShowIdleWarning(false);
      warnTimer.current = setTimeout(() => {
        setShowIdleWarning(true);
        setIdleCountdown(WARNING_MS / 1000);
        countdownInt.current = setInterval(() => {
          setIdleCountdown((n) => n - 1);
        }, 1000);
        idleTimer.current = setTimeout(doSignOut, WARNING_MS);
      }, IDLE_MS - WARNING_MS);
    };

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetTimers, { passive: true }));
    resetTimers();

    return () => {
      clearAll();
      events.forEach((e) => window.removeEventListener(e, resetTimers));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claim.uid]);

  // Live pending onboarding requests count (admin only)
  // Must be before any conditional returns to comply with React Rules of Hooks
  useEffect(() => {
    if (!claim.uid || !claim.isAdmin) return;
    const uid = claim.uid;
    const q = query(collection(db, "onboardingRequests"), where("status", "==", "pending"));
    const unsub = onSnapshot(q, (snap) => {
      if (pathnameRef.current === "/portal/notifications") { setPendingCount(0); return; }
      const lastSeen = (() => {
        try { return parseInt(localStorage.getItem(`notifLastSeen_${uid}`) ?? "0", 10); } catch { return 0; }
      })();
      const count = snap.docs.filter(d => {
        const ts = d.data().submittedAt as { seconds: number } | null;
        return ts?.seconds ? ts.seconds * 1000 > lastSeen : false;
      }).length;
      setPendingCount(count);
    }, () => {});
    return () => unsub();
  }, [claim.uid, claim.isAdmin]);

  // New onboarding completions — certificates not yet reviewed (admin only)
  useEffect(() => {
    if (!claim.uid || !claim.isAdmin) return;
    const q = query(collection(db, "onboardingCertificates"), where("reviewed", "==", false));
    const unsub = onSnapshot(q, (snap) => {
      setNewOnboardingCount(snap.size);
      const names = snap.docs.map(d => (d.data().name as string) || "Unknown").slice(0, 5);
      setNewOnboardingNames(names);
      if (snap.size > 0 && !sessionStorage.getItem("onboardingBannerDismissed")) {
        setShowOnboardingBanner(true);
      }
    }, () => {});
    return () => unsub();
  }, [claim.uid, claim.isAdmin]);

  // Payroll notification badge — locked/paid (owner/dev) + statusChange (any role via visibility)
  useEffect(() => {
    if (!claim.uid || !claim.profile) return;
    const userRole = claim.profile.role;
    const uid = claim.uid;
    const unsub = onSnapshot(
      query(collection(db, "payrollNotifications"), orderBy("createdAt", "desc")),
      (snap) => {
        if (pathnameRef.current === "/portal/notifications") { setPayrollNotifCount(0); return; }
        const lastSeen = (() => {
          try { return parseInt(localStorage.getItem(`notifLastSeen_${uid}`) ?? "0", 10); } catch { return 0; }
        })();
        const count = snap.docs.filter(d => {
          const data = d.data();
          const ts = data.createdAt as { seconds: number } | null;
          if (!ts?.seconds || ts.seconds * 1000 <= lastSeen) return false;
          const type = data.type as string;
          if (type === "statusChange") {
            const roles = (data.visibleTo as string[]) ?? [];
            const uids = (data.visibleToUids as string[]) ?? [];
            return roles.includes(userRole) || uids.includes(uid);
          }
          // locked/paid — owner/dev only
          return userRole === "owner" || userRole === "developer";
        }).length;
        setPayrollNotifCount(count);
      },
      () => {},
    );
    return () => unsub();
  }, [claim.uid, claim.profile?.role]);

  // License alert badge — sum licenseAlertCount across all users (admin only)
  useEffect(() => {
    if (!claim.uid || !claim.isAdmin) return;
    getDocs(collection(db, "users")).then(snap => {
      let total = 0, hasExpired = false;
      snap.docs.forEach(d => {
        const data = d.data();
        total += (data.licenseAlertCount as number) || 0;
        if (data.hasExpiredLicense) hasExpired = true;
      });
      setLicenseAlertTotal(total);
      setLicenseAlertHasExpired(hasExpired);
    }).catch(() => {});
  }, [claim.uid, claim.isAdmin]);

  // New document count for badge (all users, role-filtered)
  useEffect(() => {
    if (!claim.uid || !claim.profile) return;
    const uid = claim.uid;
    const userRole = claim.profile.role;
    const teamNumber = claim.profile.teamNumber;
    const lastSeen = (() => {
      try { return parseInt(localStorage.getItem(`notifLastSeen_${uid}`) ?? "0", 10); } catch { return 0; }
    })();
    const unsub = onSnapshot(
      query(collection(db, "documents"), orderBy("uploadedAt", "desc")),
      snap => {
        if (pathnameRef.current === "/portal/notifications") { setNewDocCount(0); return; }
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const cutoff = Math.max(sevenDaysAgo, lastSeen);
        let docs = snap.docs.filter(d => {
          const ts = d.data().uploadedAt as { seconds: number } | null;
          return ts?.seconds ? ts.seconds * 1000 > cutoff : false;
        });
        if (!isAdminLevel(userRole)) {
          if (userRole === "manager") {
            docs = docs.filter(d => d.data().uploadedBy === uid || d.data().uploadedByTeam === teamNumber);
          } else {
            docs = docs.filter(d => d.data().uploadedBy === uid);
          }
        }
        setNewDocCount(docs.length);
      },
      () => {},
    );
    return () => unsub();
  }, [claim.uid, claim.profile?.role, claim.profile?.teamNumber]);

  // Session banner — show once per session if the logged-in user has expiring/expired licenses
  useEffect(() => {
    if (!claim.uid) return;
    getDoc(doc(db, "users", claim.uid)).then(snap => {
      const data = snap.data();
      const count = (data?.licenseAlertCount as number) || 0;
      const hasExpired = data?.hasExpiredLicense === true;
      if (count > 0 && !sessionStorage.getItem("licenseBannerDismissed")) {
        setLicenseBannerHasExpired(hasExpired);
        setShowLicenseBanner(true);
      }
    }).catch(() => {});
  }, [claim.uid]);

  // Keep pathnameRef current so onSnapshot callbacks see the latest path
  useEffect(() => {
    pathnameRef.current = pathname;
    setSidebarOpen(false);
    // Clear badge and record last-seen when user visits Chat
    if (pathname === "/portal/chat" && claim.uid) {
      setChatUnread(0);
      try { localStorage.setItem(`chatLastSeen_${claim.uid}`, Date.now().toString()); } catch { /* ignore */ }
    }
    // Clear notification counts when visiting Notifications
    if (pathname === "/portal/notifications" && claim.uid) {
      try { localStorage.setItem(`notifLastSeen_${claim.uid}`, Date.now().toString()); } catch { /* ignore */ }
      setNewDocCount(0);
      setPendingCount(0);
      setPayrollNotifCount(0);
    }
  }, [pathname, claim.uid]);

  // Live unread chat badge — messages by others since last visit
  useEffect(() => {
    if (!claim.uid) return;
    const uid = claim.uid;
    const q = query(
      collection(db, "chats", "general", "messages"),
      orderBy("createdAt", "desc"),
      limit(99),
    );
    const unsub = onSnapshot(q, (snap) => {
      if (pathnameRef.current === "/portal/chat") { setChatUnread(0); return; }
      const lastSeen = (() => {
        try { return parseInt(localStorage.getItem(`chatLastSeen_${uid}`) ?? "0", 10); } catch { return 0; }
      })();
      const count = snap.docs.filter((d) => {
        const data = d.data();
        if (data.uid === uid) return false;
        const ms = data.createdAt ? data.createdAt.seconds * 1000 : 0;
        return ms > lastSeen;
      }).length;
      setChatUnread(Math.min(count, 99));
    }, () => {});
    return () => unsub();
  }, [claim.uid]);

  const handleSignOut = async () => {
    if (claim.uid) {
      await setDoc(doc(db, "presence", claim.uid), { online: false, status: "offline", lastSeen: serverTimestamp() }, { merge: true }).catch(() => {});
    }
    await signOut(auth);
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="w-8 h-8" />
          <p className="text-app-text-3 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isAdmin    = claim.isAdmin;
  const isManager  = claim.isManager;

  const isOwner    = claim.isOwner;

  const profileName      = claim.displayName;
  const profileInitials  = claim.initials;
  const profileBadgeTag  = claim.badgeTag;
  const profileTitle     = claim.title;
  const roleBadgeStyle   = claim.roleBadgeStyle;

  const navItems = [
    {
      href: "/portal/dashboard",
      label: "Dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
    },
    {
      href: "/portal/clients",
      label: "Clients",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
    ...(chatEnabled ? [{
      href: "/portal/chat",
      label: "Chat",
      badge: chatUnread,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
        </svg>
      ),
    }] : []),
    {
      href: "/portal/documents",
      label: "Documents",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
    },
    {
      href: "/portal/notifications",
      label: "Notifications",
      badge: pendingCount + newDocCount + payrollNotifCount,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
      ),
    },
    {
      href: "/portal/leaderboard",
      label: "Leaderboard",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
        </svg>
      ),
    },
    {
      href: "/portal/settings",
      label: "Settings",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  const adminNavItems = [
    {
      href: "/portal/payroll",
      label: "Payroll",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      href: "/portal/agents",
      label: "Agents",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex h-screen bg-app-bg overflow-hidden">

      {/* ── Idle warning modal ── */}
      {showIdleWarning && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/70">
          <div className="bg-app-surface border border-app-border-2 rounded-2xl p-8 w-full max-w-sm shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-app-text font-semibold text-lg mb-1">Session Expiring</h2>
            <p className="text-app-text-3 text-sm mb-5">
              You've been inactive. You'll be signed out in{" "}
              <span className="text-amber-400 font-bold">{idleCountdown}s</span>.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowIdleWarning(false);
                if (idleTimer.current)    clearTimeout(idleTimer.current);
                if (warnTimer.current)    clearTimeout(warnTimer.current);
                if (countdownInt.current) clearInterval(countdownInt.current);
                // Retrigger timers by dispatching a mousemove
                window.dispatchEvent(new Event("mousemove"));
              }}
              className="w-full py-2.5 bg-app-accent hover:bg-app-accent-hover text-white font-semibold rounded-xl transition text-sm"
            >
              Stay Signed In
            </button>
          </div>
        </div>
      )}

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-app-surface border-r border-app-border flex flex-col shrink-0 transition-transform duration-200 md:static md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Logo + close button */}
        <div className="flex items-center justify-center px-4 py-4 border-b border-app-border relative">
          <BrandLogo width={180} height={64} priority />
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-app-text-4 hover:text-app-text hover:bg-app-surface-2 transition md:hidden"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const badge = "badge" in item ? (item.badge as number) : 0;
            const isClients = item.href === "/portal/clients";
            const clientsExpanded = isClients && pathname.startsWith("/portal/clients");
            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? "bg-app-surface-2 text-app-text"
                      : "text-app-text-3 hover:text-app-text hover:bg-app-surface-2/60"
                  }`}
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {badge > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold flex items-center justify-center">
                      {badge}
                    </span>
                  )}
                </Link>
                {clientsExpanded && (
                  <Link
                    href="/portal/clients/licenses"
                    className={`flex items-center gap-3 ml-8 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      pathname === "/portal/clients/licenses"
                        ? "text-app-accent"
                        : "text-app-text-4 hover:text-app-text-2"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Licenses
                  </Link>
                )}
              </div>
            );
          })}

          {/* Admin-only section */}
          {isAdmin && (
            <>
              <div className="pt-4 pb-1 px-3">
                <p className="text-xs font-semibold text-app-text-5 uppercase tracking-wider">Admin</p>
              </div>
              {adminNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const isSettings = item.href === "/portal/settings";
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? "bg-app-accent/20 text-app-accent"
                        : "text-app-text-3 hover:text-app-text hover:bg-app-surface-2/60"
                    }`}
                  >
                    {item.icon}
                    <span className="flex-1">{item.label}</span>
                    {isSettings && (
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                        phase === "live"    ? "bg-green-500/15 text-green-400 border-green-500/30" :
                        phase === "merging" ? "bg-amber-500/15 text-amber-400 border-amber-500/30" :
                                              "bg-red-500/15 text-red-400 border-red-500/30"
                      }`}>
                        {phase === "live" ? "Live" : phase === "merging" ? "Merging" : "Testing"}
                      </span>
                    )}
                  </Link>
                );
              })}

            </>
          )}
        </nav>

        {/* User info + Sign Out */}
        <div className="px-3 py-4 border-t border-app-border">
          <div className="flex items-center gap-3 mb-3 px-1">
            {/* Avatar with role + team badges */}
            <div className="relative shrink-0" style={{ width: 44, height: 44 }}>
              {claim.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={claim.photoURL}
                  alt={profileInitials}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-app-border-2"
                />
              ) : (
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm select-none ring-2 ring-app-border-2"
                  style={{ backgroundColor: claim.avatarBgColor }}
                >
                  {profileInitials}
                </div>
              )}
              {/* Career/role badge — centered below avatar */}
              <div
                className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-1.5 py-px rounded text-[8px] font-bold tracking-widest uppercase whitespace-nowrap border ${roleBadgeStyle}`}
                style={{ background: "rgba(10,12,18,0.95)" }}
              >
                {profileBadgeTag}
              </div>
              {/* Level / team number badge — top-right corner */}
              {claim.level > 0 && (
                <div className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] rounded-full bg-app-surface-2 border border-app-border-2 flex items-center justify-center text-[9px] font-bold text-app-text leading-none px-0.5">
                  {claim.level}
                </div>
              )}
            </div>

            {/* Name + title card */}
            <div className="flex-1 min-w-0 bg-app-surface-2/90 rounded-lg px-3 py-2 border border-app-border-2/60 shadow-sm">
              <p className="text-app-text text-sm font-semibold truncate leading-tight">
                {profileName || claim.email}
              </p>
              <p className="text-app-text-3 text-xs truncate leading-tight mt-0.5">
                {profileTitle}
              </p>
            </div>
          </div>

          <a
            href={`mailto:christian@outpostdigitalsolutions.com?subject=Portal Help — ${profileName || claim.email}`}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-app-text-4 hover:text-amber-400 hover:bg-app-surface-2/60 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
            Having trouble?
          </a>
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-app-text-3 hover:text-app-text hover:bg-app-surface-2/60 transition"
            aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {resolvedTheme === "dark" ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
            {resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-app-text-3 hover:text-app-text hover:bg-app-surface-2/60 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-auto">
        {/* Mobile header with hamburger */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-app-border bg-app-surface shrink-0 md:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-app-text-3 hover:text-app-text hover:bg-app-surface-2 transition"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <BrandLogo width={120} height={42} />
        </div>
        <TeamColorProvider>
          {children}
        </TeamColorProvider>
      </main>

      {/* ── Terms & Conditions Prompt ── */}
      {showTerms && claim.uid && (
        <TermsModal
          uid={claim.uid}
          userName={claim.displayName}
          userEmail={user?.email ?? ""}
          termsHtml={termsHtml}
          termsVersion={termsVersion}
          onAccepted={() => setShowTerms(false)}
          onDismiss={() => { sessionStorage.setItem("termsDismissed", "1"); setShowTerms(false); }}
        />
      )}

    </div>
  );
}
