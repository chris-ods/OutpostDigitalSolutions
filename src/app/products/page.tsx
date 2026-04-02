import Link from "next/link";
import { Nav } from "../../components/Nav";
import { Footer } from "../../components/Footer";

const atxFeatures = [
  { title: "Agent portal", desc: "Agents log in to view their own clients, track application status, and manage their book of business." },
  { title: "Admin dashboard", desc: "Full visibility across all agents, carriers, and statuses. Approve, issue, and track every policy in one place." },
  { title: "Commission tracking", desc: "Track split percentages, annual premiums, and comp status per client — with a full audit log of every change." },
  { title: "Role-based access", desc: "Owner, agent, and contractor roles with granular column-level permissions. Agents only see what they need to see." },
  { title: "Real-time data", desc: "Firestore keeps every portal in sync instantly. No refresh required — changes appear the moment they're made." },
  { title: "CSV export", desc: "Export any filtered view of your client list to CSV with one click. Works with any carrier reporting workflow." },
];

const clientListFeatures = [
  { title: "Drag-to-reorder columns", desc: "Users can rearrange columns to match their personal workflow. Order is saved per-user." },
  { title: "Per-column filters", desc: "Checkbox filters for enum fields, text search, and date/number range pickers — all composable." },
  { title: "Inline cell editing", desc: "Click any editable cell to update it in place. Changes are saved to Firestore immediately with a full change log." },
  { title: "Saved views", desc: "Users can save named filter + column configurations and switch between them instantly." },
  { title: "Claim / Unclaim", desc: "Built-in claim workflow with section dividers separating claimed and unclaimed records." },
  { title: "Permissions matrix", desc: "Fine-grained control over which roles can view or edit each column. Configurable per deployment." },
];

export default function Products() {
  return (
    <div className="bg-black text-white">
      <Nav />

      {/* Hero */}
      <section className="min-h-[50vh] flex flex-col items-center justify-center text-center px-6 pt-14">
        <div className="max-w-3xl mx-auto">
          <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-4">Our products</p>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6">
            Built for the real work.
          </h1>
          <p className="text-white/50 text-lg leading-relaxed">
            Two focused products that solve real problems for agencies and teams
            managing clients at scale.
          </p>
        </div>
      </section>

      {/* ATX Financial */}
      <section id="atx" className="py-24 px-6 border-t border-white/10 scroll-mt-14">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-16">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-4">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-blue-400 text-xs font-semibold">Insurance Agency Platform</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">ATX Financial</h2>
            </div>
            <Link
              href="/contact"
              className="shrink-0 bg-blue-500 hover:bg-blue-400 text-white font-semibold px-6 py-3 rounded-full transition-colors text-sm"
            >
              Request access
            </Link>
          </div>

          <p className="text-white/50 text-lg leading-relaxed max-w-3xl mb-16">
            A full-featured insurance agency management platform — built from the ground up
            on Firebase. ATX Financial gives agents their own portal, gives admins full
            visibility, and keeps everyone in sync in real time.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {atxFeatures.map(({ title, desc }) => (
              <div key={title} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                  <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold mb-2">{title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ClientList */}
      <section id="clientlist" className="py-24 px-6 border-t border-white/10 scroll-mt-14">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-16">
            <div>
              <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 mb-4">
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className="text-cyan-400 text-xs font-semibold">UI Component · Firebase SDK</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">ClientList</h2>
            </div>
            <div className="flex gap-3">
              <Link
                href="/design"
                className="shrink-0 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-6 py-3 rounded-full transition-colors text-sm"
              >
                Live demo
              </Link>
              <Link
                href="/contact"
                className="shrink-0 border border-white/20 hover:border-white/40 text-white font-semibold px-6 py-3 rounded-full transition-colors text-sm"
              >
                Get in touch
              </Link>
            </div>
          </div>

          <p className="text-white/50 text-lg leading-relaxed max-w-3xl mb-16">
            A production-ready data table for managing client records at scale. Drop it into
            any Firebase app and get filtering, sorting, inline editing, and CSV export out of
            the box — with a permissions system that supports any role structure.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientListFeatures.map(({ title, desc }) => (
              <div key={title} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-4">
                  <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold mb-2">{title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-white/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold tracking-tight mb-6">Interested in either product?</h2>
          <p className="text-white/50 mb-10">
            Reach out and we&apos;ll set up a live demo tailored to your use case.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-white text-black font-semibold px-10 py-4 rounded-full hover:bg-white/90 transition-colors"
          >
            Contact us
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
