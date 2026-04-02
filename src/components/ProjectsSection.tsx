"use client";

import { useRouter } from "next/navigation";

// ─── Project definitions ───────────────────────────────────────────────────────

const PROJECTS = [
  {
    id: "ods-website",
    name: "Outpost Digital Solutions",
    subtitle: "Marketing website & client portal",
    status: "active",
    statusLabel: "Live",
    color: "from-blue-600 to-blue-800",
    iconColor: "text-white",
    icon: (
      <svg width="20" height="20" viewBox="0 0 36 36" fill="none">
        <ellipse cx="18.5" cy="17" rx="15" ry="12.5" stroke="white" strokeWidth="1" fill="none"/>
        <ellipse cx="18.5" cy="17" rx="10" ry="8.5" stroke="white" strokeWidth="1" fill="none"/>
        <ellipse cx="18.5" cy="17" rx="5" ry="4.5" stroke="white" strokeWidth="1.2" fill="none"/>
        <path d="M18.5 13.5 L20.2 17 L16.8 17 Z" fill="white" opacity="0.9"/>
        <circle cx="18.5" cy="12.8" r="1" fill="white"/>
      </svg>
    ),
    links: [
      { label: "Website", href: "https://outpostdigitalsolutions.com", external: true },
      { label: "Firebase Console", href: "https://console.firebase.google.com/project/outpostdigitalsolutions/overview", external: true },
      { label: "GitHub", href: "https://github.com/cbear1984/OutpostDigitalSolutions", external: true },
    ],
    tags: ["Next.js", "Firebase", "App Hosting"],
    description: "The main ODS marketing site and authenticated portal. Built on Next.js 16 with Firebase App Hosting.",
  },
  {
    id: "atx-financial",
    name: "ATX Financial",
    subtitle: "Insurance agency management platform",
    status: "active",
    statusLabel: "Live",
    color: "from-emerald-600 to-teal-700",
    iconColor: "text-white",
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    links: [
      { label: "Firebase Console", href: "https://console.firebase.google.com/project/atx-financial/overview", external: true },
      { label: "GitHub", href: "https://github.com/cbear1984/ATX-Financial", external: true },
    ],
    tags: ["Next.js", "Firebase", "Firestore", "Role-based auth"],
    description: "Full-featured agency portal with agent, manager, admin, and owner roles. Client records, commission tracking, and real-time sync.",
  },
  {
    id: "clientlist",
    name: "ClientList",
    subtitle: "Live product demo",
    status: "demo",
    statusLabel: "Demo",
    color: "from-cyan-600 to-sky-700",
    iconColor: "text-white",
    navigate: "/design",
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75.125v-2.25m3.75 0v2.25m0 0h.375a1.125 1.125 0 011.125 1.125v-1.5a3.375 3.375 0 00-3.375-3.375H3.375m0 0v-2.25m0 0h.375C5.496 13.5 6 12.996 6 12.375m-3.75.125v-3.375" />
      </svg>
    ),
    links: [],
    tags: ["ods-ui-library", "React", "Firebase SDK"],
    description: "Interactive demo showcasing the ClientList component with 22 mock clients, role-based permissions, week picker, and live editing.",
  },
  {
    id: "chore-crusher",
    name: "Chore Crusher",
    subtitle: "Household task management app",
    status: "active",
    statusLabel: "Active",
    color: "from-orange-500 to-red-600",
    iconColor: "text-white",
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    links: [
      { label: "Web App", href: "https://www.chorecrusher.com", external: true },
      { label: "App Store", href: "#", external: false, soon: true },
      { label: "Google Play", href: "#", external: false, soon: true },
      { label: "Analytics", href: "https://analytics.google.com/analytics/web/#/a167120426p525314290/reports/reportinghub?params=_u..nav%3Dmaui", external: true },
      { label: "Firebase Console", href: "https://console.firebase.google.com/project/chore-crusher/overview", external: true },
      { label: "OAuth Console", href: "https://console.cloud.google.com/auth/overview?project=chore-crusher", external: true },
    ],
    tags: ["React Native", "Firebase", "iOS", "Android"],
    description: "Mobile-first task manager for households. Assign chores, track completion, and earn rewards. Native iOS/Android apps in progress.",
  },
  {
    id: "ods-ui-library",
    name: "ods-ui-library",
    subtitle: "Shared component library",
    status: "internal",
    statusLabel: "Internal",
    color: "from-violet-600 to-purple-700",
    iconColor: "text-white",
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    links: [
      { label: "GitHub", href: "https://github.com/cbear1984/ods-ui-library", external: true },
    ],
    tags: ["TypeScript", "tsup", "Storybook", "Vitest"],
    description: "The shared UI component library powering ATX Financial and the ODS portal. ClientList, UserClaimDisplay, hooks, and permissions system.",
  },
];

const STATUS_STYLES: Record<string, string> = {
  active:   "bg-green-900/50 text-green-400 border-green-800",
  demo:     "bg-cyan-900/50 text-cyan-400 border-cyan-800",
  internal: "bg-violet-900/50 text-violet-400 border-violet-800",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProjectsSection() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-white font-semibold text-lg">Projects</h3>
        <p className="text-gray-500 text-sm mt-0.5">{PROJECTS.length} active projects across Outpost Digital Solutions</p>
      </div>

      {/* Project grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {PROJECTS.map((project) => {
          const isNavCard = !!project.navigate;

          return (
            <div
              key={project.id}
              className={`bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col ${
                isNavCard ? "cursor-pointer hover:border-cyan-700/60 hover:bg-gray-800/70 transition-all group" : ""
              }`}
              onClick={isNavCard ? () => router.push(project.navigate!) : undefined}
            >
              {/* Card header */}
              <div className="px-5 py-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${project.color} flex items-center justify-center shrink-0`}>
                    {project.icon}
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-sm leading-tight">{project.name}</h4>
                    <p className="text-gray-500 text-xs mt-0.5">{project.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs border px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[project.status] ?? ""}`}>
                    {project.statusLabel}
                  </span>
                  {isNavCard && (
                    <svg className="w-4 h-4 text-gray-600 group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="px-5 pb-4">
                <p className="text-gray-500 text-xs leading-relaxed">{project.description}</p>
              </div>

              {/* Tags */}
              <div className="px-5 pb-4 flex flex-wrap gap-1.5">
                {project.tags.map((tag) => (
                  <span key={tag} className="text-[11px] bg-gray-800 text-gray-400 border border-gray-700 px-2 py-0.5 rounded-md">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Links — only shown on non-nav cards */}
              {!isNavCard && project.links.length > 0 && (
                <div className="px-5 pb-5 mt-auto flex flex-wrap gap-2">
                  {project.links.map((link) => (
                    "soon" in link && link.soon ? (
                      <span
                        key={link.label}
                        className="inline-flex items-center gap-1 text-xs text-gray-600 border border-gray-800 px-3 py-1.5 rounded-lg cursor-not-allowed"
                      >
                        {link.label}
                        <span className="text-[10px] bg-gray-800 text-gray-600 px-1 rounded">Soon</span>
                      </span>
                    ) : (
                      <a
                        key={link.label}
                        href={link.href}
                        target={link.external ? "_blank" : undefined}
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-1.5 rounded-lg transition"
                      >
                        {link.label}
                        {link.external && (
                          <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        )}
                      </a>
                    )
                  ))}
                </div>
              )}

              {/* Nav card CTA */}
              {isNavCard && (
                <div className="px-5 pb-5 mt-auto">
                  <div className="flex items-center gap-2 text-xs text-cyan-500 group-hover:text-cyan-400 font-medium transition-colors">
                    <span>Open live demo</span>
                    <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
