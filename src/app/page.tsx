"use client";

import { useAuth } from "../hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

const SERVICES = [
  {
    title: "Web & Mobile Apps",
    desc: "Full-stack applications built with modern frameworks — React, Next.js, React Native, and Firebase.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3" />
      </svg>
    ),
  },
  {
    title: "Cloud & Firebase",
    desc: "Scalable backend infrastructure using Firebase, Google Cloud, and secure real-time databases.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
      </svg>
    ),
  },
  {
    title: "Product Design",
    desc: "Clean, intuitive interfaces designed for real users — from wireframes to polished production UI.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
      </svg>
    ),
  },
  {
    title: "Analytics & Growth",
    desc: "Data-driven insights with Google Analytics 4, custom dashboards, and performance tracking.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
];

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/portal");
      } else {
        setReady(true);
      }
    }
  }, [user, loading, router]);

  if (!ready) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <svg className="w-6 h-6 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="32" height="32" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="36" height="36" rx="10" fill="#0a1628"/>
              <ellipse cx="18.5" cy="17" rx="15" ry="12.5" stroke="#1e40af" strokeWidth="0.5" fill="none"/>
              <ellipse cx="18.5" cy="17" rx="10" ry="8.5" stroke="#3b82f6" strokeWidth="0.5" fill="none"/>
              <ellipse cx="18.5" cy="17" rx="5" ry="4.5" stroke="#93c5fd" strokeWidth="0.7" fill="none"/>
              <path d="M18.5 13.5 L20.2 17 L16.8 17 Z" fill="#93c5fd" opacity="0.9"/>
              <circle cx="18.5" cy="12.8" r="0.8" fill="#dbeafe"/>
            </svg>
            <span className="font-semibold text-sm">Outpost Digital Solutions</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-400">
            <a href="#services" className="hover:text-white transition">Services</a>
            <a href="#about" className="hover:text-white transition">About</a>
            <Link href="/design" className="hover:text-white transition">Demo</Link>
            <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
          </nav>
          <Link
            href="/login"
            className="text-sm font-medium px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition"
          >
            Client Portal →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-40 pb-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-900/30 border border-blue-700/40 text-blue-300 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Software Development Studio
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.08] mb-6">
            Outpost Digital
            <br />
            <span className="text-blue-400">Solutions</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            We design and build web and mobile applications for businesses —
            from early-stage products to production-ready platforms.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a
              href="mailto:hello@outpostdigitalsolutions.com"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition text-sm"
            >
              Get in Touch
            </a>
            <Link
              href="/login"
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl font-semibold transition text-sm text-gray-300"
            >
              Client Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 px-6 border-t border-gray-800/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">What We Build</h2>
          <p className="text-gray-500 text-center text-sm mb-12">End-to-end digital products tailored to your business.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {SERVICES.map((s) => (
              <div key={s.title} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition">
                <div className="w-11 h-11 rounded-xl bg-blue-900/40 border border-blue-800/40 flex items-center justify-center text-blue-400 mb-4">
                  {s.icon}
                </div>
                <h3 className="text-white font-semibold mb-1.5">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 px-6 border-t border-gray-800/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">About Us</h2>
          <p className="text-gray-400 leading-relaxed mb-4">
            Outpost Digital Solutions LLC is a software development studio specializing in
            building modern web and mobile applications. We work directly with businesses
            to design, develop, and deploy digital products that are fast, secure, and scalable.
          </p>
          <p className="text-gray-500 text-sm">
            Based in the United States &middot; hello@outpostdigitalsolutions.com
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-8 px-6 text-center text-gray-600 text-sm">
        <div className="flex items-center justify-center gap-6 mb-3">
          <a href="mailto:hello@outpostdigitalsolutions.com" className="hover:text-gray-400 transition">Contact</a>
          <Link href="/privacy" className="hover:text-gray-400 transition">Privacy Policy</Link>
          <Link href="/login" className="hover:text-gray-400 transition">Client Portal</Link>
        </div>
        <p>&copy; 2026 Outpost Digital Solutions LLC. All rights reserved.</p>
      </footer>

    </div>
  );
}
