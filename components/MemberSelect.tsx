"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { avatarColor } from "../lib/types";

export interface MemberOption {
  uid: string;
  firstName: string;
  lastName: string;
  contractorId: string;
  email: string;
  phone: string;
  teamNumber: number;
  photoURL?: string;
}

function getInitials(first: string, last: string): string {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.length === 11 && d[0] === "1")
    return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  return raw || "—";
}

interface Props {
  options: MemberOption[];
  value: string; // uid of selected member
  onChange: (uid: string, member: MemberOption | null) => void;
  placeholder?: string;
}

interface CardState {
  member: MemberOption;
  top: number;
  left: number;
}

function MemberAvatar({ m, size }: { m: MemberOption; size: number }) {
  const bg = avatarColor(`${m.firstName} ${m.lastName}`);
  const ini = getInitials(m.firstName, m.lastName);
  const fs = size <= 30 ? "0.6rem" : size <= 40 ? "0.72rem" : "0.9rem";

  if (m.photoURL) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={m.photoURL}
        alt={ini}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 font-semibold text-white select-none"
      style={{ width: size, height: size, backgroundColor: bg, fontSize: fs }}
    >
      {ini}
    </div>
  );
}

function PhotoPlaceholder({ size }: { size: number }) {
  return (
    <div
      className="rounded-full border-2 border-dashed border-app-border-2 flex flex-col items-center justify-center gap-0.5 shrink-0"
      style={{ width: size, height: size }}
      title="Profile photo — connect Firebase Storage to enable uploads"
    >
      <svg
        className="text-app-text-5"
        style={{ width: size * 0.38, height: size * 0.38 }}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
      </svg>
      {size >= 48 && (
        <span className="text-app-text-5 leading-none" style={{ fontSize: "0.6rem" }}>
          Photo
        </span>
      )}
    </div>
  );
}

export default function MemberSelect({
  options,
  value,
  onChange,
  placeholder = "Select a member...",
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [card, setCard] = useState<CardState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.uid === value) ?? null;

  // Close on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
        setCard(null);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  // Auto-focus search when opening
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 40);
  }, [open]);

  const filtered = options.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      `${o.firstName} ${o.lastName}`.toLowerCase().includes(q) ||
      o.contractorId.toLowerCase().includes(q)
    );
  });

  function handleRowHover(e: React.MouseEvent, member: MemberOption) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    // Position card to the right; clamp to viewport bottom
    const cardHeight = 160;
    const top = Math.min(rect.top, window.innerHeight - cardHeight - 8);
    setCard({ member, top, left: rect.right + 8 });
  }

  return (
    <div ref={containerRef} className="relative">
      {/* ── Trigger ── */}
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setCard(null); }}
        className={`w-full flex items-center gap-2.5 px-3 py-2 bg-app-surface-2 border rounded-lg text-left transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[42px] ${
          open ? "border-blue-500" : "border-app-border-2"
        }`}
      >
        {selected ? (
          <>
            <MemberAvatar m={selected} size={30} />
            <div className="flex-1 min-w-0">
              <p className="text-app-text text-sm font-medium truncate leading-tight">
                {selected.firstName} {selected.lastName}
              </p>
              <p className="text-app-text-4 text-xs font-mono leading-tight">
                {selected.contractorId}
              </p>
            </div>
            {/* Clear button */}
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); onChange("", null); }}
              className="shrink-0 p-0.5 text-app-text-4 hover:text-app-text transition rounded cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          </>
        ) : (
          <span className="text-app-text-4 text-sm flex-1">{placeholder}</span>
        )}
        <svg
          className="w-4 h-4 text-app-text-4 shrink-0 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div className="absolute z-40 top-full left-0 right-0 mt-1 bg-app-surface border border-app-border-2 rounded-xl shadow-2xl overflow-hidden">
          {/* Search bar */}
          <div className="p-2 border-b border-app-border">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-app-surface-2 rounded-lg">
              <svg className="w-4 h-4 text-app-text-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or ID..."
                className="flex-1 bg-transparent text-app-text text-sm placeholder-app-text-4 focus:outline-none"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} className="text-app-text-4 hover:text-app-text-2 transition">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-5 text-center text-app-text-4 text-sm">
                {search ? "No results found." : "No active members."}
              </p>
            ) : (
              filtered.map((member) => (
                <button
                  key={member.uid}
                  type="button"
                  onMouseEnter={(e) => handleRowHover(e, member)}
                  onMouseLeave={() => setCard(null)}
                  onClick={() => {
                    onChange(member.uid, member);
                    setOpen(false);
                    setSearch("");
                    setCard(null);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition hover:bg-app-surface-2 ${
                    value === member.uid ? "bg-blue-600/10" : ""
                  }`}
                >
                  <MemberAvatar m={member} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 leading-tight">
                      <p className="text-app-text text-sm font-medium truncate">
                        {member.firstName} {member.lastName}
                      </p>
                      <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-blue-900/50 border border-blue-800 text-blue-300">TC</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-app-text-4 text-xs font-mono leading-tight">{member.contractorId}</p>
                      {member.teamNumber > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          Team {member.teamNumber}
                        </span>
                      )}
                    </div>
                  </div>
                  {value === member.uid && (
                    <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Contact card — portaled to <body> to escape overflow clipping ── */}
      {card && typeof window !== 'undefined' &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: card.top,
              left: card.left,
              zIndex: 9999,
              width: 240,
            }}
            className="bg-app-surface border border-app-border-2 rounded-xl shadow-2xl p-4 pointer-events-none"
          >
            {/* Avatar + name */}
            <div className="flex items-start gap-3 mb-3">
              {card.member.photoURL ? (
                <MemberAvatar m={card.member} size={52} />
              ) : (
                <PhotoPlaceholder size={52} />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-app-text text-sm font-semibold leading-tight">
                  {card.member.firstName} {card.member.lastName}
                </p>
                {card.member.teamNumber > 0 && (
                  <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/20">
                    Team {card.member.teamNumber}
                  </span>
                )}
                <p className="text-app-text-4 text-xs font-mono mt-1">
                  {card.member.contractorId}
                </p>
              </div>
            </div>

            {/* Contact details */}
            <div className="border-t border-app-border pt-3 space-y-2">
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-app-text-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <span className="text-app-text-2 text-xs truncate">{card.member.email || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-app-text-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 6.75z" />
                </svg>
                <span className="text-app-text-2 text-xs">{formatPhone(card.member.phone || "")}</span>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
