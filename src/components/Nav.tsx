"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
      <nav className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="36" height="36" rx="10" fill="#0a1628"/>
            <ellipse cx="18.5" cy="17" rx="15" ry="12.5" stroke="#1e40af" strokeWidth="0.5" fill="none"/>
            <ellipse cx="18.5" cy="17" rx="10" ry="8.5" stroke="#3b82f6" strokeWidth="0.5" fill="none"/>
            <ellipse cx="18.5" cy="17" rx="5" ry="4.5" stroke="#93c5fd" strokeWidth="0.7" fill="none"/>
            <path d="M18.5 13.5 L20.2 17 L16.8 17 Z" fill="#93c5fd" opacity="0.9"/>
            <circle cx="18.5" cy="12.8" r="0.8" fill="#dbeafe"/>
          </svg>
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
