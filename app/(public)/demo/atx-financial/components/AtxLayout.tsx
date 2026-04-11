"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { AtxState, AtxAction } from "../data/types";
import { AtxDashboard } from "./AtxDashboard";
import { AtxContacts } from "./AtxContacts";
import { AtxPipeline } from "./AtxPipeline";
import { AtxTasks } from "./AtxTasks";
import { AtxReports } from "./AtxReports";

// ── Types ───────────────────────────────────────────────────────────────────

type TabKey = "dashboard" | "contacts" | "pipeline" | "tasks" | "reports";

const TABS: { key: TabKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "contacts", label: "Contacts" },
  { key: "pipeline", label: "Pipeline" },
  { key: "tasks", label: "Tasks" },
  { key: "reports", label: "Reports" },
];

// ── Component ───────────────────────────────────────────────────────────────

export function AtxLayout({
  state,
  dispatch,
}: {
  state: AtxState;
  dispatch: React.Dispatch<AtxAction>;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");

  return (
    <div className="min-h-screen bg-[#0a1628] text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-700/50 bg-[#0d1526]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo + Title */}
            <div className="flex items-center gap-3">
              <ShieldLogo />
              <div>
                <h1 className="text-sm font-bold text-gray-100 leading-none tracking-tight">
                  ATX Financial
                </h1>
                <p className="text-[10px] text-gray-500 leading-tight mt-0.5">
                  Insurance CRM
                </p>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
                Demo Mode
              </span>
              <Link
                href="/"
                className="text-xs text-gray-400 hover:text-[#d4a843] transition-colors"
              >
                Back to ODS
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Bar */}
      <nav className="border-b border-gray-700/30 bg-[#0d1526]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-[#d4a843] text-[#d4a843]"
                    : "border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === "dashboard" && <AtxDashboard state={state} />}
        {activeTab === "contacts" && <AtxContacts state={state} dispatch={dispatch} />}
        {activeTab === "pipeline" && <AtxPipeline state={state} dispatch={dispatch} />}
        {activeTab === "tasks" && <AtxTasks state={state} dispatch={dispatch} />}
        {activeTab === "reports" && <AtxReports state={state} />}
      </main>
    </div>
  );
}

// ── Shield Logo SVG ─────────────────────────────────────────────────────────

function ShieldLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shield shape */}
      <path
        d="M16 2L4 8v8c0 7.18 5.12 13.88 12 15.5C22.88 29.88 28 23.18 28 16V8L16 2z"
        fill="#0d1526"
        stroke="#d4a843"
        strokeWidth="1.5"
      />
      {/* Inner shield accent */}
      <path
        d="M16 5.5L7 10v6c0 5.4 3.84 10.44 9 11.65 5.16-1.21 9-6.25 9-11.65v-6L16 5.5z"
        fill="#0f1a2e"
        stroke="#d4a843"
        strokeWidth="0.75"
        opacity="0.6"
      />
      {/* Dollar sign */}
      <text
        x="16"
        y="20"
        textAnchor="middle"
        fill="#d4a843"
        fontSize="12"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        $
      </text>
    </svg>
  );
}
