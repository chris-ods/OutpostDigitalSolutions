"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebase";

// ── Types ────────────────────────────────────────────────────────────────────

export type Theme = "light" | "dark" | "system";
export type TextSize = "sm" | "base" | "lg" | "xl";
export type FontFamily = "geist" | "inter" | "system" | "mono";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (t: Theme) => void;
  textSize: TextSize;
  setTextSize: (s: TextSize) => void;
  fontFamily: FontFamily;
  setFontFamily: (f: FontFamily) => void;
  accentColor: string | null;
  setAccentColor: (c: string | null) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  resolvedTheme: "dark",
  setTheme: () => {},
  textSize: "base",
  setTextSize: () => {},
  fontFamily: "geist",
  setFontFamily: () => {},
  accentColor: null,
  setAccentColor: () => {},
});

// ── Helpers ──────────────────────────────────────────────────────────────────

const THEME_KEY = "atx-theme";
const TEXT_SIZE_KEY = "atx-text-size";
const FONT_KEY = "atx-font";
const ACCENT_KEY = "atx-accent";

const FONT_STACKS: Record<FontFamily, string> = {
  geist: "var(--font-geist-sans, ui-sans-serif), system-ui, -apple-system, sans-serif",
  inter: "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
  system: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  mono: "var(--font-geist-mono, ui-monospace), 'SF Mono', 'Fira Code', monospace",
};

function darkenHex(hex: string, amount = 0.15): string {
  const h = hex.replace("#", "");
  const r = Math.max(0, Math.round(parseInt(h.slice(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(h.slice(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(h.slice(4, 6), 16) * (1 - amount)));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function applyAccent(color: string | null) {
  const el = document.documentElement;
  if (!color) {
    el.style.removeProperty("--app-accent");
    el.style.removeProperty("--app-accent-hover");
  } else {
    el.style.setProperty("--app-accent", color);
    el.style.setProperty("--app-accent-hover", darkenHex(color));
  }
}

function applyFont(f: FontFamily) {
  document.documentElement.style.setProperty("--app-font", FONT_STACKS[f]);
  document.body.style.fontFamily = FONT_STACKS[f];
}

function getSystemPreference(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") return getSystemPreference();
  return theme;
}

function applyTheme(resolved: "light" | "dark") {
  const el = document.documentElement;
  if (resolved === "dark") {
    el.classList.add("dark");
  } else {
    el.classList.remove("dark");
  }
}

function applyTextSize(size: TextSize) {
  const el = document.documentElement;
  if (size === "base") {
    el.removeAttribute("data-text-size");
  } else {
    el.dataset.textSize = size;
  }
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    return (localStorage.getItem(THEME_KEY) as Theme) || "dark";
  });

  const [textSize, setTextSizeState] = useState<TextSize>(() => {
    if (typeof window === "undefined") return "base";
    return (localStorage.getItem(TEXT_SIZE_KEY) as TextSize) || "base";
  });

  const [fontFamily, setFontFamilyState] = useState<FontFamily>(() => {
    if (typeof window === "undefined") return "geist";
    return (localStorage.getItem(FONT_KEY) as FontFamily) || "geist";
  });

  const [accentColor, setAccentColorState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACCENT_KEY) || null;
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => resolveTheme(theme));
  const uidRef = useRef<string | null>(null);
  const loadedFromFirestore = useRef(false);

  // Save prefs to both localStorage (fast) and Firestore (persistent)
  const savePrefs = useCallback((patch: Record<string, unknown>) => {
    if (!uidRef.current) return;
    const prefsRef = doc(db, "users", uidRef.current, "settings", "preferences");
    setDoc(prefsRef, patch, { merge: true }).catch(() => {});
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem(THEME_KEY, t);
    const resolved = resolveTheme(t);
    setResolvedTheme(resolved);
    applyTheme(resolved);
    savePrefs({ theme: t });
  }, [savePrefs]);

  const setTextSize = useCallback((s: TextSize) => {
    setTextSizeState(s);
    localStorage.setItem(TEXT_SIZE_KEY, s);
    applyTextSize(s);
    savePrefs({ textSize: s });
  }, [savePrefs]);

  const setFontFamily = useCallback((f: FontFamily) => {
    setFontFamilyState(f);
    localStorage.setItem(FONT_KEY, f);
    applyFont(f);
    savePrefs({ fontFamily: f });
  }, [savePrefs]);

  const setAccentColor = useCallback((c: string | null) => {
    setAccentColorState(c);
    if (c) localStorage.setItem(ACCENT_KEY, c);
    else localStorage.removeItem(ACCENT_KEY);
    applyAccent(c);
    savePrefs({ accentColor: c ?? null });
  }, [savePrefs]);

  // Apply on mount (from localStorage for instant render)
  useEffect(() => {
    applyTheme(resolvedTheme);
    applyTextSize(textSize);
    applyFont(fontFamily);
    applyAccent(accentColor);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load preferences from Firestore when user authenticates
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { uidRef.current = null; return; }
      uidRef.current = user.uid;
      if (loadedFromFirestore.current) return;
      loadedFromFirestore.current = true;
      try {
        const snap = await getDoc(doc(db, "users", user.uid, "settings", "preferences"));
        if (!snap.exists()) return;
        const data = snap.data();
        if (data.theme && data.theme !== theme) {
          setThemeState(data.theme); localStorage.setItem(THEME_KEY, data.theme);
          const r = resolveTheme(data.theme); setResolvedTheme(r); applyTheme(r);
        }
        if (data.textSize && data.textSize !== textSize) {
          setTextSizeState(data.textSize); localStorage.setItem(TEXT_SIZE_KEY, data.textSize);
          applyTextSize(data.textSize);
        }
        if (data.fontFamily && data.fontFamily !== fontFamily) {
          setFontFamilyState(data.fontFamily); localStorage.setItem(FONT_KEY, data.fontFamily);
          applyFont(data.fontFamily);
        }
        if (data.accentColor !== undefined && data.accentColor !== accentColor) {
          setAccentColorState(data.accentColor);
          if (data.accentColor) localStorage.setItem(ACCENT_KEY, data.accentColor);
          else localStorage.removeItem(ACCENT_KEY);
          applyAccent(data.accentColor);
        }
      } catch { /* preferences not available yet */ }
    });
    return () => unsub();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for OS preference changes when in "system" mode
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const resolved = resolveTheme("system");
      setResolvedTheme(resolved);
      applyTheme(resolved);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, textSize, setTextSize, fontFamily, setFontFamily, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
