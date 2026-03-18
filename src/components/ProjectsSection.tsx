"use client";

import { useState } from "react";

const QUICK_LINKS = [
  {
    id: "analytics",
    label: "Analytics",
    href: "https://analytics.google.com/analytics/web/#/a167120426p525314290/reports/reportinghub?params=_u..nav%3Dmaui",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: "oauth",
    label: "OAuth",
    href: "https://console.cloud.google.com/auth/overview?project=chore-crusher",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    ),
  },
  {
    id: "firebase",
    label: "Firebase",
    href: "https://console.firebase.google.com/project/chore-crusher/overview",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
      </svg>
    ),
  },
];

const STORE_LINKS = [
  {
    id: "appstore",
    label: "App Store",
    sublabel: "Download on the",
    href: "#",
    placeholder: true,
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    ),
    bg: "from-gray-800 to-gray-900",
    border: "border-gray-700",
    iconColor: "text-white",
  },
  {
    id: "playstore",
    label: "Google Play",
    sublabel: "Get it on",
    href: "#",
    placeholder: true,
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3.18 23.76c.3.17.64.22.99.14l12.82-7.4-2.82-2.82-10.99 10zM.43 1.01C.17 1.3 0 1.73 0 2.28v19.44c0 .55.17.98.44 1.27l.07.06 10.89-10.89v-.26L.5.95l-.07.06zM20.13 9.53l-2.77-1.6-3.14 3.14 3.14 3.14 2.8-1.61c.8-.46.8-1.21-.03-1.67zM4.17.24L17 7.64l-2.82 2.82L4.17.24z" />
      </svg>
    ),
    bg: "from-gray-800 to-gray-900",
    border: "border-gray-700",
    iconColor: "text-white",
  },
  {
    id: "webapp",
    label: "Web App",
    sublabel: "Open in browser",
    href: "https://www.chorecrusher.com",
    placeholder: false,
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253M3 12c0 .778.099 1.533.284 2.253" />
      </svg>
    ),
    bg: "from-blue-900 to-blue-950",
    border: "border-blue-700",
    iconColor: "text-blue-300",
  },
];

export default function ProjectsSection() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-white font-semibold text-lg">Projects</h3>
        <p className="text-gray-500 text-sm mt-0.5">Manage and access your active projects</p>
      </div>

      {/* Chore Crusher project card */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {/* Project header */}
        <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h4 className="text-white font-semibold">Chore Crusher</h4>
              <p className="text-gray-500 text-xs">Household task management app</p>
            </div>
          </div>
          <span className="text-xs bg-green-900/50 text-green-400 border border-green-800 px-2.5 py-1 rounded-full font-medium">
            Active
          </span>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-800 px-6 gap-1">
          {["overview", "quick links"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium capitalize transition border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-blue-500 text-white"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab: Overview — store links */}
        {activeTab === "overview" && (
          <div className="p-6 space-y-5">
            <p className="text-gray-400 text-sm">Access Chore Crusher across platforms:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {STORE_LINKS.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  target={link.placeholder ? undefined : "_blank"}
                  rel="noreferrer"
                  className={`relative flex items-center gap-4 bg-gradient-to-br ${link.bg} border ${link.border} rounded-xl px-5 py-4 transition hover:brightness-110 ${
                    link.placeholder ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                  }`}
                  onClick={link.placeholder ? (e) => e.preventDefault() : undefined}
                >
                  {link.placeholder && (
                    <span className="absolute top-2 right-2 text-[10px] bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded font-medium">
                      Soon
                    </span>
                  )}
                  <span className={link.iconColor}>{link.icon}</span>
                  <div>
                    <p className="text-gray-400 text-[11px] leading-none mb-0.5">{link.sublabel}</p>
                    <p className="text-white font-semibold text-sm">{link.label}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Quick Links */}
        {activeTab === "quick links" && (
          <div className="p-6 space-y-3">
            <p className="text-gray-400 text-sm mb-4">Developer consoles for Chore Crusher:</p>
            {QUICK_LINKS.map((link) => (
              <a
                key={link.id}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl px-5 py-4 transition group"
              >
                <div className="w-9 h-9 rounded-lg bg-gray-700 group-hover:bg-gray-600 flex items-center justify-center text-gray-300 shrink-0 transition">
                  {link.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{link.label}</p>
                  <p className="text-gray-500 text-xs truncate">{link.href}</p>
                </div>
                <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
