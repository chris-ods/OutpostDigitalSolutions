"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";
import { UserProfile, CAREER_LEVELS, avatarColor } from "../types";

export interface UserClaim {
  // Raw data
  uid: string;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;

  // Role flags
  isRep: boolean;
  isManager: boolean;
  isAdmin: boolean;      // admin | owner | developer
  isOwner: boolean;
  isDeveloper: boolean;
  isStrictAdmin: boolean; // owner | developer only

  // Display helpers
  displayName: string;   // "First Last"
  initials: string;      // "FL"
  email: string;

  // Profile card helpers (mirrors layout.tsx sidebar logic)
  badgeTag: string;      // career tag or role abbreviation
  title: string;         // companyRole > career title > role label
  roleBadgeStyle: string; // tailwind classes for the badge colour
  avatarBgColor: string; // deterministic hex from displayName
  photoURL: string;
  level: number;         // career level (0 = not set)
  teamNumber: number;
}

const EMPTY: UserClaim = {
  uid: "",
  user: null,
  profile: null,
  loading: true,
  isRep: false,
  isManager: false,
  isAdmin: false,
  isOwner: false,
  isDeveloper: false,
  isStrictAdmin: false,
  displayName: "",
  initials: "",
  email: "",
  badgeTag: "",
  title: "",
  roleBadgeStyle: "text-app-text-3 border-app-border-2/40",
  avatarBgColor: "#3b82f6",
  photoURL: "",
  level: 0,
  teamNumber: 0,
};

function buildClaim(uid: string, user: User, profile: UserProfile | null): UserClaim {
  const role = profile?.role;

  const isRep       = role === "rep";
  const isManager   = role === "manager";
  const isDeveloper = role === "developer";
  const isOwner     = role === "owner";
  const isAdmin     = isDeveloper || isOwner || role === "admin";
  const isStrictAdmin = isDeveloper || isOwner;

  const displayName = profile ? `${profile.firstName} ${profile.lastName}` : "";
  const initials    = profile
    ? `${profile.firstName[0] ?? ""}${profile.lastName[0] ?? ""}`.toUpperCase()
    : "?";
  const email = profile?.email ?? user.email ?? "";

  const level      = profile?.level ?? 0;
  const teamNumber = profile?.teamNumber ?? 0;

  const careerEntry = level > 0
    ? CAREER_LEVELS.find((l) => l.level === level) ?? null
    : null;

  const badgeTag = careerEntry?.tag
    ?? (isDeveloper ? "DEV"
      : isOwner     ? "OWNER"
      : isAdmin     ? "ADMIN"
      : isManager   ? "MGR"
      : "AGENT");

  const title = profile?.companyRole
    || careerEntry?.title
    || (isDeveloper ? "Developer"
      : isOwner     ? "Owner"
      : isAdmin     ? "Administrator"
      : isManager   ? "Manager"
      : "Agent");

  const roleBadgeStyle = isDeveloper
    ? "text-red-300 border-red-500/40"
    : isOwner
    ? "text-amber-300 border-amber-500/40"
    : isAdmin
    ? "text-blue-300 border-blue-500/40"
    : isManager
    ? "text-purple-300 border-purple-500/40"
    : "text-app-text-3 border-app-border-2/40";

  const avatarBgColor = displayName ? avatarColor(displayName) : "#3b82f6";
  const photoURL = profile?.photoURL ?? "";

  return {
    uid,
    user,
    profile,
    loading: false,
    isRep,
    isManager,
    isAdmin,
    isOwner,
    isDeveloper,
    isStrictAdmin,
    displayName,
    initials,
    email,
    badgeTag,
    title,
    roleBadgeStyle,
    avatarBgColor,
    photoURL,
    level,
    teamNumber,
  };
}

export function useUserClaim(): UserClaim {
  const [claim, setClaim] = useState<UserClaim>(EMPTY);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      // Clean up previous profile listener
      if (unsubProfile) { unsubProfile(); unsubProfile = null; }
      if (!user) {
        setClaim({ ...EMPTY, loading: false });
        return;
      }
      // Live-listen to the user profile doc so changes (e.g. onboarding) reflect immediately
      unsubProfile = onSnapshot(doc(db, "users", user.uid),
        (snap) => {
          const profile = snap.exists() ? (snap.data() as UserProfile) : null;
          setClaim(buildClaim(user.uid, user, profile));
        },
        () => {
          // Permission error or doc doesn't exist yet
          setClaim(buildClaim(user.uid, user, null));
        },
      );
    });
    return () => { unsubAuth(); if (unsubProfile) unsubProfile(); };
  }, []);

  return claim;
}
