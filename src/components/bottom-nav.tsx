"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/language-provider";
import { LayoutDashboard, Route, Ship, Users, Settings } from "lucide-react";

const items = [
  { href: "/dashboard", icon: LayoutDashboard, labelKey: "dashboard" as const },
  { href: "/trips", icon: Route, labelKey: "trips" as const },
  { href: "/boats", icon: Ship, labelKey: "boats" as const },
  { href: "/crew", icon: Users, labelKey: "crew" as const },
  { href: "/settings", icon: Settings, labelKey: "settings" as const },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-sand/95 backdrop-blur-sm border-t border-sand-dim safe-bottom md:hidden">
      <div className="flex items-center justify-around h-16 max-w-2xl mx-auto">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
                active ? "text-rope" : "text-ink-faint hover:text-ink-soft"
              }`}>
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
