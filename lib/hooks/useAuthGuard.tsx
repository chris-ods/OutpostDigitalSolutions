"use client";

import { useUserClaim } from "./useUserClaim";
import { PageSpinner } from "../components/Spinner";
import { UserProfile } from "../types";
import React from "react";

type MinRole = "any" | "admin" | "owner" | "developer";

type GuardResult =
  | { ready: false; node: React.ReactElement }
  | { ready: true; uid: string; profile: UserProfile };

/**
 * Replaces the repeated role-guard boilerplate in every portal page:
 *
 *   const guard = useAuthGuard("admin");
 *   if (!guard.ready) return guard.node;
 *   const { uid, profile } = guard;
 *
 * minRole:
 *   "any"       — authenticated users only (no role check)
 *   "admin"     — admin | owner | developer
 *   "owner"     — owner | developer
 *   "developer" — developer only
 */
export function useAuthGuard(minRole: MinRole): GuardResult {
  const claim = useUserClaim();

  if (claim.loading) {
    return { ready: false, node: <PageSpinner /> };
  }

  if (!claim.uid || !claim.profile) {
    return { ready: false, node: <div /> };
  }

  const role = claim.profile.role;
  const allowed =
    minRole === "any"       ? true :
    minRole === "admin"     ? (role === "admin" || role === "owner" || role === "developer") :
    minRole === "owner"     ? (role === "owner" || role === "developer") :
    minRole === "developer" ? (role === "developer") :
    false;

  if (!allowed) {
    return {
      ready: false,
      node: (
        <div className="flex items-center justify-center h-full bg-app-bg">
          <p className="text-app-text-4 text-sm">Access denied.</p>
        </div>
      ),
    };
  }

  return { ready: true, uid: claim.uid, profile: claim.profile };
}
