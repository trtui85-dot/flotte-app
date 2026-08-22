import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Inter, El_Messiri } from "next/font/google";
import "./globals.css";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const elMessiri = El_Messiri({
  subsets: ["arabic", "latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "نظام إدارة قوارب الصيد",
  description: "إدارة قوارب الصيد، السورتيات، المصاريف، المبيعات والأرباح",
  manifest: "/manifest.json",
  themeColor: "#0b1220",
  appleWebApp: { capable: true, title: "قوارب الصيد", statusBarStyle: "default" },
};

import ClientShell from "@/components/client-shell";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning
      className={`${ibmPlexArabic.variable} ${inter.variable} ${elMessiri.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var v=localStorage.getItem("flotte:locale");var l=(v==="fr"||v==="ar")?v:"ar";document.documentElement.lang=l;document.documentElement.dir=l==="fr"?"ltr":"rtl";}catch(e){}})();`
        }} />
      </head>
      <body className="min-h-screen bg-sand text-ink font-body antialiased">
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
