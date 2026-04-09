"use client";

/**
 * UserClaimDisplay
 *
 * Renders the signed-in user's identity from a UserClaim.
 *
 * Variants:
 *   variant="compact"  — inline row: small avatar + name + role badge
 *                        Use in headers, table cells, modals, dropdowns
 *   variant="normal"   — full card: avatar with level/role badges + name + title
 *                        Use in sidebars, profile panels, settings pages
 */

import { UserClaim } from "../lib/hooks/useUserClaim";

interface UserClaimDisplayProps {
  claim: UserClaim;
  variant: "compact" | "normal";
  className?: string;
}

export default function UserClaimDisplay({ claim, variant, className = "" }: UserClaimDisplayProps) {
  if (claim.loading) return null;

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Avatar */}
        <div className="relative shrink-0 w-8 h-8">
          {claim.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={claim.photoURL}
              alt={claim.initials}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-700"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white select-none ring-1 ring-gray-700"
              style={{ backgroundColor: claim.avatarBgColor }}
            >
              {claim.initials}
            </div>
          )}
        </div>

        {/* Name */}
        <span className="text-sm font-medium text-white truncate">
          {claim.displayName || claim.email}
        </span>

        {/* Role badge */}
        <span
          className={`shrink-0 px-1.5 py-px rounded text-[9px] font-bold tracking-widest uppercase border ${claim.roleBadgeStyle}`}
          style={{ background: "rgba(10,12,18,0.95)" }}
        >
          {claim.badgeTag}
        </span>
      </div>
    );
  }

  // variant === "normal"
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Avatar with level + role badges */}
      <div className="relative shrink-0" style={{ width: 44, height: 44 }}>
        {claim.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={claim.photoURL}
            alt={claim.initials}
            className="w-11 h-11 rounded-full object-cover ring-2 ring-gray-700"
          />
        ) : (
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm select-none ring-2 ring-gray-700"
            style={{ backgroundColor: claim.avatarBgColor }}
          >
            {claim.initials}
          </div>
        )}

        {/* Role badge — centered below avatar */}
        <div
          className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-1.5 py-px rounded text-[8px] font-bold tracking-widest uppercase whitespace-nowrap border ${claim.roleBadgeStyle}`}
          style={{ background: "rgba(10,12,18,0.95)" }}
        >
          {claim.badgeTag}
        </div>

        {/* Level badge — top-right corner */}
        {claim.level > 0 && (
          <div className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] rounded-full bg-app-surface-2 border border-app-border-2 flex items-center justify-center text-[9px] font-bold text-app-text leading-none px-0.5">
            {claim.level}
          </div>
        )}
      </div>

      {/* Name + title */}
      <div className="min-w-0 bg-app-surface-2/90 rounded-lg px-3 py-2 border border-app-border-2/60 shadow-sm flex-1">
        <p className="text-app-text text-sm font-semibold truncate leading-tight">
          {claim.displayName || claim.email}
        </p>
        <p className="text-app-text-3 text-xs truncate leading-tight mt-0.5">
          {claim.title}
        </p>
      </div>
    </div>
  );
}
