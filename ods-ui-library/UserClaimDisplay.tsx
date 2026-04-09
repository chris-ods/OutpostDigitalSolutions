"use client";
import React from "react";

// 1. Export the type so other projects know what data to pass in
export interface UserClaim {
    loading?: boolean;
    photoURL?: string | null;
    initials: string;
    avatarBgColor: string;
    displayName?: string | null;
    email: string;
    roleBadgeStyle: string;
    badgeTag: string;
    level: number;
    title?: string;
}

export interface UserClaimDisplayProps {
    claim: UserClaim;
    variant: "compact" | "normal";
    className?: string;
}

// 2. The component remains exactly the same, but now it relies on the local type
export default function UserClaimDisplay({ claim, variant, className = "" }: UserClaimDisplayProps) {
    if (claim.loading) return null;

    if (variant === "compact") {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <div className="relative shrink-0 w-8 h-8">
                    {claim.photoURL ? (
                        <img
                            src={claim.photoURL}
                            alt={claim.initials}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-app-border-2"
                        />
                    ) : (
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white select-none ring-1 ring-app-border-2"
                            style={{ backgroundColor: claim.avatarBgColor }}
                        >
                            {claim.initials}
                        </div>
                    )}
                </div>

                <span className="text-sm font-medium text-app-text truncate">
          {claim.displayName || claim.email}
        </span>

                <span
                    className={`shrink-0 px-1.5 py-px rounded text-[9px] font-bold tracking-widest uppercase border ${claim.roleBadgeStyle}`}
                    style={{ background: "rgba(10,12,18,0.95)" }}
                >
          {claim.badgeTag}
        </span>
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <div className="relative shrink-0" style={{ width: 44, height: 44 }}>
                {claim.photoURL ? (
                    <img
                        src={claim.photoURL}
                        alt={claim.initials}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-app-border-2"
                    />
                ) : (
                    <div
                        className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm select-none ring-2 ring-app-border-2"
                        style={{ backgroundColor: claim.avatarBgColor }}
                    >
                        {claim.initials}
                    </div>
                )}

                <div
                    className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-1.5 py-px rounded text-[8px] font-bold tracking-widest uppercase whitespace-nowrap border ${claim.roleBadgeStyle}`}
                    style={{ background: "rgba(10,12,18,0.95)" }}
                >
                    {claim.badgeTag}
                </div>

                {claim.level > 0 && (
                    <div className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] rounded-full bg-app-surface-2 border border-app-border-2 flex items-center justify-center text-[9px] font-bold text-app-text leading-none px-0.5">
                        {claim.level}
                    </div>
                )}
            </div>

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