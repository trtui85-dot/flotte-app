"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/components/language-provider";
import BottomNav from "@/components/bottom-nav";
import { Ship, LogOut, Globe } from "lucide-react";
import { useEffect } from "react";

const navLinks = [
  { href: "/dashboard", labelKey: "dashboard" as const },
  { href: "/trips", labelKey: "trips" as const },
  { href: "/boats", labelKey: "boats" as const },
  { href: "/crew", labelKey: "crew" as const },
  { href: "/buyers", labelKey: "buyers" as const },
  { href: "/reports", labelKey: "reports" as const },
  { href: "/settings", labelKey: "settings" as const },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, lang, setLang } = useLanguage();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/refresh");
        if (!res.ok) router.replace("/");
      } catch {
        router.replace("/");
      }
    };
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
  };

  return (
    <div className="min-h-screen bg-sand">
      {/* Desktop top bar */}
      <header className="hidden md:block bg-foam border-b border-sand-dim sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between h-14">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center">
              <Ship size={16} className="text-sand" />
            </span>
            <span className="font-display text-lg font-semibold">{t("appShort")}</span>
          </Link>
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith(link.href)
                    ? "bg-rope-soft text-rope"
                    : "text-ink-soft hover:bg-sand-dim"
                }`}>
                {t(link.labelKey)}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={() => setLang(lang === "ar" ? "fr" : "ar")}
              className="p-2 rounded-lg hover:bg-sand-dim text-ink-faint" title={lang === "ar" ? "Français" : "العربية"}>
              <Globe size={18} />
            </button>
            <button onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-danger-soft text-ink-faint hover:text-danger">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="md:hidden bg-foam border-b border-sand-dim sticky top-0 z-40">
        <div className="px-4 flex items-center justify-between h-12">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-ink flex items-center justify-center">
              <Ship size={14} className="text-sand" />
            </span>
            <span className="font-display text-base font-semibold">{t("appShort")}</span>
          </Link>
          <div className="flex items-center gap-1">
            <button onClick={() => setLang(lang === "ar" ? "fr" : "ar")}
              className="p-2 rounded-lg hover:bg-sand-dim text-ink-faint">
              <Globe size={18} />
            </button>
            <button onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-danger-soft text-ink-faint hover:text-danger">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 md:max-w-4xl md:pb-6">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
