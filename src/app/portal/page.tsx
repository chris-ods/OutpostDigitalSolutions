"use client";

import withAuth from "../../components/withAuth";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { useState } from "react";
import DocumentLibrary from "./DocumentLibrary";
import ChoreCrusherDashboard from "./ChoreCrusherDashboard";
import ReportsSection from "../../components/ReportsSection";
import ProjectsSection from "../../components/ProjectsSection";
import ClientsSection from "../../components/ClientsSection";
import SettingsSection from "../../components/SettingsSection";
import TimeSheetSection from "../../components/TimeSheetSection";

type NavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: "documents",
    label: "Documents",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
  },
  {
    id: "projects",
    label: "Projects",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    id: "timesheet",
    label: "Time & Tasks",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: "clients",
    label: "Clients",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: "reports",
    label: "Reports",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

function PortalPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const displayName = user?.displayName ?? user?.email?.split("@")[0] ?? "User";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 border-r border-gray-800 flex flex-col transform transition-transform duration-200 lg:translate-x-0 lg:static lg:inset-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <rect width="36" height="36" rx="10" fill="#0a1628"/>
            <line x1="0" y1="18" x2="36" y2="18" stroke="#1e3a5f" strokeWidth="0.3" opacity="0.7"/>
            <line x1="18" y1="0" x2="18" y2="36" stroke="#1e3a5f" strokeWidth="0.3" opacity="0.7"/>
            <ellipse cx="18.5" cy="17" rx="15" ry="12.5" stroke="#1e40af" strokeWidth="0.5" fill="none"/>
            <ellipse cx="18.5" cy="17" rx="12.5" ry="10.5" stroke="#2563eb" strokeWidth="0.5" fill="none"/>
            <ellipse cx="18.5" cy="17" rx="10" ry="8.5" stroke="#3b82f6" strokeWidth="0.5" fill="none"/>
            <ellipse cx="18.5" cy="17" rx="7.5" ry="6.5" stroke="#60a5fa" strokeWidth="0.6" fill="none"/>
            <ellipse cx="18.5" cy="17" rx="5" ry="4.5" stroke="#93c5fd" strokeWidth="0.7" fill="none"/>
            <ellipse cx="18.5" cy="17" rx="2.5" ry="2" stroke="#bfdbfe" strokeWidth="0.8" fill="none"/>
            <path d="M18.5 13.5 L20.2 17 L16.8 17 Z" fill="#93c5fd" opacity="0.9"/>
            <circle cx="18.5" cy="12.8" r="0.8" fill="#dbeafe"/>
          </svg>
          <span className="text-white font-semibold text-sm leading-tight">Outpost Digital<br />Solutions</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveNav(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                activeNav === item.id
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="px-3 py-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-800 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{displayName}</p>
              <p className="text-gray-500 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-gray-400 hover:text-white"
              onClick={() => setSidebarOpen(true)}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h2 className="text-white font-semibold">
                {navItems.find((n) => n.id === activeNav)?.label ?? "Dashboard"}
              </h2>
              <p className="text-gray-500 text-xs">Outpost Digital Solutions Portal</p>
            </div>
          </div>
          <div className="text-gray-500 text-sm hidden sm:block">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 p-6">
          {activeNav === "dashboard" && <ChoreCrusherDashboard />}
          {activeNav === "documents" && <DocumentLibrary />}
          {activeNav === "projects" && <ProjectsSection />}
          {activeNav === "clients" && <ClientsSection />}
          {activeNav === "reports" && <ReportsSection />}
          {activeNav === "settings" && <SettingsSection />}
          {activeNav === "timesheet" && <TimeSheetSection />}
        </main>
      </div>
    </div>
  );
}

export default withAuth(PortalPage);
