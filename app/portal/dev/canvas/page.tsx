"use client";

/**
 * /portal/dev/canvas  — UserClaim live preview
 *
 * Drop any component here to build & inspect it against the real
 * signed-in user's claim. Only visible to developers.
 */

import { useUserClaim } from "../../../../lib/hooks/useUserClaim";
import { Spinner } from "../../../../lib/components/Spinner";
import UserClaimDisplay from "../../../../components/UserClaimDisplay";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// ─── tiny helper ─────────────────────────────────────────────────────────────
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-app-border last:border-0">
      <span className="w-40 shrink-0 text-app-text-4 text-xs font-mono">{label}</span>
      <span className="text-app-text-2 text-xs font-mono break-all">{String(value)}</span>
    </div>
  );
}

function Flag({ label, value }: { label: string; value: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono ${
      value
        ? "bg-green-500/10 border-green-500/30 text-green-400"
        : "bg-app-surface-2/60 border-app-border-2 text-app-text-5"
    }`}>
      <span className={`w-2 h-2 rounded-full ${value ? "bg-green-400" : "bg-app-text-5"}`} />
      {label}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function CanvasPage() {
  const claim = useUserClaim();
  const router = useRouter();

  // Guard: only developers can access this page
  useEffect(() => {
    if (!claim.loading && !claim.isDeveloper) {
      router.replace("/portal/dashboard");
    }
  }, [claim.loading, claim.isDeveloper, router]);

  if (claim.loading) {
    return (
      <div className="min-h-full bg-app-bg overflow-y-auto flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!claim.isDeveloper) return null;

  return (
    <div className="bg-app-bg min-h-full p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Dev Canvas</h1>
          <p className="text-app-text-4 text-sm mt-1">
            Live <code className="text-app-accent">useUserClaim</code> inspector -- drop components below the divider to preview them.
          </p>
        </div>

        {/* ── UserClaim Inspector ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Avatar card */}
          <div className="bg-app-surface border border-app-border rounded-xl p-6 flex flex-col gap-5">
            <p className="text-xs font-semibold text-app-text-4 uppercase tracking-wider">Profile Card</p>
            <div className="flex items-center gap-4">
              <div className="relative shrink-0" style={{ width: 56, height: 56 }}>
                {claim.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={claim.photoURL}
                    alt={claim.initials}
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-app-border-2"
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-white text-lg select-none ring-2 ring-app-border-2"
                    style={{ backgroundColor: claim.avatarBgColor }}
                  >
                    {claim.initials}
                  </div>
                )}
                {/* Badge */}
                <div
                  className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-1.5 py-px rounded text-[8px] font-bold tracking-widest uppercase whitespace-nowrap border ${claim.roleBadgeStyle}`}
                  style={{ background: "rgba(10,12,18,0.95)" }}
                >
                  {claim.badgeTag}
                </div>
                {claim.level > 0 && (
                  <div className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] rounded-full bg-app-surface-2 border border-app-border-2 flex items-center justify-center text-[9px] font-bold text-white leading-none px-0.5">
                    {claim.level}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <p className="text-app-text font-semibold truncate">{claim.displayName || "(no name)"}</p>
                <p className="text-app-text-3 text-sm truncate">{claim.title}</p>
                <p className="text-app-text-5 text-xs truncate">{claim.email}</p>
              </div>
            </div>
          </div>

          {/* UserClaimDisplay variants */}
          <div className="bg-app-surface border border-app-border rounded-xl p-6 flex flex-col gap-4 lg:col-span-2">
            <p className="text-xs font-semibold text-app-text-4 uppercase tracking-wider">UserClaimDisplay Variants</p>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-app-text-5 text-xs font-mono mb-2">variant="normal"</p>
                <UserClaimDisplay claim={claim} variant="normal" className="max-w-xs" />
              </div>
              <div>
                <p className="text-app-text-5 text-xs font-mono mb-2">variant="compact"</p>
                <UserClaimDisplay claim={claim} variant="compact" />
              </div>
            </div>
          </div>

          {/* Role flags */}
          <div className="bg-app-surface border border-app-border rounded-xl p-6 flex flex-col gap-4">
            <p className="text-xs font-semibold text-app-text-4 uppercase tracking-wider">Role Flags</p>
            <div className="grid grid-cols-2 gap-2">
              <Flag label="isRep"         value={claim.isRep} />
              <Flag label="isManager"     value={claim.isManager} />
              <Flag label="isAdmin"       value={claim.isAdmin} />
              <Flag label="isOwner"       value={claim.isOwner} />
              <Flag label="isDeveloper"   value={claim.isDeveloper} />
              <Flag label="isStrictAdmin" value={claim.isStrictAdmin} />
            </div>
          </div>

          {/* Raw fields */}
          <div className="bg-app-surface border border-app-border rounded-xl p-6 lg:col-span-2">
            <p className="text-xs font-semibold text-app-text-4 uppercase tracking-wider mb-3">Raw Claim Fields</p>
            <Row label="uid"            value={claim.uid || "(none)"} />
            <Row label="email"          value={claim.email || "(none)"} />
            <Row label="displayName"    value={claim.displayName || "(none)"} />
            <Row label="initials"       value={claim.initials} />
            <Row label="role"           value={claim.profile?.role ?? "(none)"} />
            <Row label="badgeTag"       value={claim.badgeTag} />
            <Row label="title"          value={claim.title} />
            <Row label="level"          value={claim.level || "(not set)"} />
            <Row label="teamNumber"     value={claim.teamNumber || "(none)"} />
            <Row label="contractorId"   value={claim.profile?.contractorId || "(none)"} />
            <Row label="avatarBgColor"  value={claim.avatarBgColor} />
            <Row label="loading"        value={String(claim.loading)} />
          </div>
        </div>

        {/* ── Component Sandbox ─────────────────────────────────────────── */}
        <div className="border-t border-dashed border-app-border-2 pt-8">
          <p className="text-xs font-semibold text-app-text-5 uppercase tracking-wider mb-6">
            — Component Sandbox — drop components here —
          </p>

          {/* ↓ Put your work-in-progress components below this line ↓ */}


          {/* ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ */}
        </div>

      </div>
    </div>
  );
}
