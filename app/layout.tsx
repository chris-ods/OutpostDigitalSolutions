import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../lib/themeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Outpost Digital Solutions | Portal",
  description: "Outpost Digital Solutions agent portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('ods-theme');var s=localStorage.getItem('ods-text-size');var f=localStorage.getItem('ods-font');var a=localStorage.getItem('ods-accent');var dark=t==='dark'||(t!=='light'&&(t==='system'?matchMedia('(prefers-color-scheme:dark)').matches:true));if(dark)document.documentElement.classList.add('dark');if(s&&s!=='base')document.documentElement.dataset.textSize=s;var fonts={geist:"var(--font-geist-sans,ui-sans-serif),system-ui,-apple-system,sans-serif",inter:"'Inter',ui-sans-serif,system-ui,-apple-system,sans-serif",system:"ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",mono:"var(--font-geist-mono,ui-monospace),'SF Mono','Fira Code',monospace"};if(f&&fonts[f])document.body.style.fontFamily=fonts[f];if(a){var h=a.replace('#','');var r=Math.max(0,Math.round(parseInt(h.slice(0,2),16)*0.85));var g=Math.max(0,Math.round(parseInt(h.slice(2,4),16)*0.85));var b=Math.max(0,Math.round(parseInt(h.slice(4,6),16)*0.85));document.documentElement.style.setProperty('--app-accent',a);document.documentElement.style.setProperty('--app-accent-hover','#'+r.toString(16).padStart(2,'0')+g.toString(16).padStart(2,'0')+b.toString(16).padStart(2,'0'));}}catch(e){}})()` }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
