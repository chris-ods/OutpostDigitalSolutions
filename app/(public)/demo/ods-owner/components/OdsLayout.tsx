"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { OdsState, OdsAction } from "../data/types";
import { OdsDashboard } from "./OdsDashboard";
import { OdsClients } from "./OdsClients";
import { OdsPipeline } from "./OdsPipeline";
import { OdsTasks } from "./OdsTasks";
import { OdsReports } from "./OdsReports";

// ── Types ───────────────────────────────────────────────────────────────────

type TabKey = "dashboard" | "clients" | "pipeline" | "tasks" | "reports";

const TABS: { key: TabKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "clients", label: "Clients" },
  { key: "pipeline", label: "Pipeline" },
  { key: "tasks", label: "Tasks" },
  { key: "reports", label: "Reports" },
];

// ── Component ───────────────────────────────────────────────────────────────

export function OdsLayout({
  state,
  dispatch,
}: {
  state: OdsState;
  dispatch: React.Dispatch<OdsAction>;
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
              <Image
                src="/Images/ods_logo_round.png"
                alt="Outpost Digital Solutions"
                width={32}
                height={32}
                className="rounded-full"
              />
              <div>
                <h1 className="text-sm font-bold text-gray-100 leading-none tracking-tight">
                  Outpost Digital Solutions
                </h1>
                <p className="text-[10px] text-gray-500 leading-tight mt-0.5">
                  Owner Portal
                </p>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
                Demo Mode
              </span>
              <Link
                href="/"
                className="text-xs text-gray-400 hover:text-cyan-400 transition-colors"
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
                    ? "border-cyan-400 text-cyan-400"
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
        {activeTab === "dashboard" && <OdsDashboard state={state} />}
        {activeTab === "clients" && <OdsClients state={state} dispatch={dispatch} />}
        {activeTab === "pipeline" && <OdsPipeline state={state} dispatch={dispatch} />}
        {activeTab === "tasks" && <OdsTasks state={state} dispatch={dispatch} />}
        {activeTab === "reports" && <OdsReports state={state} />}
      </main>
    </div>
  );
}
