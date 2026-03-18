"use client";

import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

type SettingsTab = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

const tabs: SettingsTab[] = [
  {
    id: "account",
    label: "Account",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: "team",
    label: "Team",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    id: "security",
    label: "Security",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    id: "billing",
    label: "Billing",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
];

function ComingSoonBadge() {
  return (
    <span className="text-[10px] bg-gray-800 text-gray-500 border border-gray-700 px-1.5 py-0.5 rounded font-medium">
      Coming soon
    </span>
  );
}

function SectionBlock({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
      <div className="border-b border-gray-800 pb-3">
        <h4 className="text-white font-semibold text-sm">{title}</h4>
        {description && <p className="text-gray-500 text-xs mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function ToggleRow({ label, description, enabled }: { label: string; description?: string; enabled?: boolean }) {
  const [on, setOn] = useState(enabled ?? false);
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-gray-300 text-sm">{label}</p>
        {description && <p className="text-gray-500 text-xs mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => setOn(!on)}
        className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${on ? "bg-blue-600" : "bg-gray-700"}`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? "translate-x-4" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}

function PlaceholderField({ label, value, placeholder }: { label: string; value?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-gray-400 text-xs font-medium mb-1">{label}</label>
      <input
        type="text"
        defaultValue={value}
        placeholder={placeholder}
        disabled
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-400 text-sm cursor-not-allowed"
      />
    </div>
  );
}

// ── Tab panels ──────────────────────────────────────────────────────────────

function AccountTab() {
  const { user } = useAuth();
  const displayName = user?.displayName ?? user?.email?.split("@")[0] ?? "User";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="space-y-4">
      <SectionBlock title="Profile" description="Your personal information.">
        <div className="flex items-center gap-4 pb-2">
          <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-white font-medium">{displayName}</p>
            <p className="text-gray-500 text-sm">{user?.email}</p>
          </div>
        </div>
        <PlaceholderField label="Display Name" value={displayName} />
        <PlaceholderField label="Email" value={user?.email ?? ""} />
        <div className="flex justify-end">
          <button disabled className="px-4 py-2 bg-blue-600 opacity-40 cursor-not-allowed text-white text-sm rounded-lg font-medium flex items-center gap-2">
            Save Changes <ComingSoonBadge />
          </button>
        </div>
      </SectionBlock>

      <SectionBlock title="Preferences" description="App-level display settings.">
        <ToggleRow label="Dark mode" description="Currently always on." enabled={true} />
        <ToggleRow label="Compact sidebar" />
      </SectionBlock>
    </div>
  );
}

function TeamTab() {
  return (
    <div className="space-y-4">
      <SectionBlock title="Team Members" description="Manage who has access to this portal.">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <svg className="w-10 h-10 text-gray-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-gray-400 text-sm font-medium mb-1">Team management</p>
          <p className="text-gray-600 text-xs">Invite and manage team members with role-based access.</p>
          <span className="mt-3"><ComingSoonBadge /></span>
        </div>
      </SectionBlock>

      <SectionBlock title="Roles & Permissions" description="Control what each role can see and do.">
        {["Admin", "Editor", "Viewer"].map((role) => (
          <div key={role} className="flex items-center justify-between py-1">
            <span className="text-gray-300 text-sm">{role}</span>
            <ComingSoonBadge />
          </div>
        ))}
      </SectionBlock>
    </div>
  );
}

function NotificationsTab() {
  return (
    <div className="space-y-4">
      <SectionBlock title="Email Notifications" description="Choose what triggers an email.">
        <ToggleRow label="New client added" enabled />
        <ToggleRow label="Project status changes" enabled />
        <ToggleRow label="Weekly analytics digest" />
        <ToggleRow label="Billing reminders" enabled />
      </SectionBlock>

      <SectionBlock title="In-App Alerts" description="Alerts shown inside the portal.">
        <ToggleRow label="Activity feed updates" enabled />
        <ToggleRow label="Task assignments" />
        <ToggleRow label="System announcements" enabled />
      </SectionBlock>

      <div className="flex justify-end">
        <button disabled className="px-4 py-2 bg-blue-600 opacity-40 cursor-not-allowed text-white text-sm rounded-lg font-medium flex items-center gap-2">
          Save Preferences <ComingSoonBadge />
        </button>
      </div>
    </div>
  );
}

function SecurityTab() {
  return (
    <div className="space-y-4">
      <SectionBlock title="Password" description="Update your login credentials.">
        <PlaceholderField label="Current Password" placeholder="••••••••" />
        <PlaceholderField label="New Password" placeholder="••••••••" />
        <PlaceholderField label="Confirm New Password" placeholder="••••••••" />
        <div className="flex justify-end">
          <button disabled className="px-4 py-2 bg-blue-600 opacity-40 cursor-not-allowed text-white text-sm rounded-lg font-medium flex items-center gap-2">
            Update Password <ComingSoonBadge />
          </button>
        </div>
      </SectionBlock>

      <SectionBlock title="Two-Factor Authentication" description="Add an extra layer of security to your account.">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-300 text-sm">Authenticator App</p>
            <p className="text-gray-500 text-xs mt-0.5">Use an app like Google Authenticator or Authy.</p>
          </div>
          <ComingSoonBadge />
        </div>
      </SectionBlock>

      <SectionBlock title="Active Sessions" description="Devices currently logged in to your account.">
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-gray-300 text-sm">This device</p>
            <p className="text-gray-500 text-xs">macOS · Active now</p>
          </div>
          <span className="w-2 h-2 rounded-full bg-green-500" />
        </div>
      </SectionBlock>
    </div>
  );
}

function BillingTab() {
  return (
    <div className="space-y-4">
      <SectionBlock title="Current Plan" description="Your subscription details.">
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-white font-semibold">Internal</p>
            <p className="text-gray-500 text-xs mt-0.5">Outpost Digital Solutions internal portal</p>
          </div>
          <span className="text-xs bg-blue-900/50 text-blue-400 border border-blue-800 px-2.5 py-1 rounded-full font-medium">
            Active
          </span>
        </div>
      </SectionBlock>

      <SectionBlock title="Payment Method" description="Manage how you pay for client projects.">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <svg className="w-10 h-10 text-gray-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <p className="text-gray-500 text-sm">Billing management coming soon.</p>
          <span className="mt-3"><ComingSoonBadge /></span>
        </div>
      </SectionBlock>
    </div>
  );
}

const PANELS: Record<string, React.ReactNode> = {
  account: <AccountTab />,
  team: <TeamTab />,
  notifications: <NotificationsTab />,
  security: <SecurityTab />,
  billing: <BillingTab />,
};

// ── Main ─────────────────────────────────────────────────────────────────────

export default function SettingsSection() {
  const [active, setActive] = useState("account");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-white font-semibold text-lg">Settings</h3>
        <p className="text-gray-500 text-sm mt-0.5">Manage your account and portal preferences</p>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Sidebar nav */}
        <nav className="lg:w-48 shrink-0">
          <ul className="flex lg:flex-col gap-1 flex-wrap">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => setActive(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition text-left ${
                    active === tab.id
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Panel */}
        <div className="flex-1 min-w-0">{PANELS[active]}</div>
      </div>
    </div>
  );
}
