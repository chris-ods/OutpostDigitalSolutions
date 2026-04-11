import Link from "next/link";

const links = [
  { section: "Products", items: [
    { label: "ATX Financial", href: "/demo/atx-financial" },
    { label: "ClientList", href: "/demo/client-list" },
  ]},
  { section: "Company", items: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ]},
  { section: "Account", items: [
    { label: "Sign In", href: "/login" },
    { label: "Portal", href: "/portal" },
  ]},
];

export function Footer() {
  return (
    <footer className="bg-black border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <p className="text-white font-semibold text-sm mb-2">Outpost Digital Solutions</p>
            <p className="text-white/40 text-xs leading-relaxed">
              Modern software for modern businesses. Built on Firebase.
            </p>
          </div>
          {links.map(({ section, items }) => (
            <div key={section}>
              <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">{section}</p>
              <ul className="space-y-2">
                {items.map(({ label, href }) => (
                  <li key={href}>
                    <Link href={href} className="text-white/60 text-sm hover:text-white transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-xs">
            &copy; {new Date().getFullYear()} Outpost Digital Solutions LLC. All Rights Reserved.
          </p>
          <p className="text-white/20 text-xs">Built with Next.js &amp; Firebase</p>
        </div>
      </div>
    </footer>
  );
}
