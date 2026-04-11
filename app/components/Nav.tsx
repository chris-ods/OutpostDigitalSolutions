"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/demo/client-list", label: "ClientList" },
  { href: "/demo/atx-financial", label: "ATX Financial" },
  { href: "/demo/ods-owner", label: "Owner Portal" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
      <nav className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image
            src="/Images/ods_logo_round.png"
            alt="Outpost Digital Solutions"
            width={28}
            height={28}
            className="rounded-full"
          />
          <span className="text-white text-sm font-semibold tracking-tight hidden sm:block">
            Outpost Digital Solutions
          </span>
        </Link>

        <ul className="hidden md:flex items-center gap-1">
          {links.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  pathname === href
                    ? "text-white font-medium"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/login"
          className="text-sm font-medium bg-white text-black px-4 py-1.5 rounded-full hover:bg-white/90 transition-colors"
        >
          Sign In
        </Link>
      </nav>
    </header>
  );
}
