"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import EmptyState from "@/components/empty-state";
import {
  Ship,
  Route,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Wallet,
  Package,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import type { TranslationKey } from "@/lib/i18n";

interface RecentTrip {
  id: string;
  status: string;
  captainName?: string | null;
  departureDate: string;
  expectedReturnDate?: string | null;
  boat?: { id: string; name: string } | null;
}

interface DashboardData {
  totalBoats: number;
  activeTrips: number;
  completedTrips: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  unsoldStockValue: number;
  outstandingDebt: number;
  recentTrips: RecentTrip[];
}

const EMPTY: DashboardData = {
  totalBoats: 0,
  activeTrips: 0,
  completedTrips: 0,
  totalRevenue: 0,
  totalExpenses: 0,
  netProfit: 0,
  unsoldStockValue: 0,
  outstandingDebt: 0,
  recentTrips: [],
};

function tripBadgeCls(status: string): string {
  switch (status) {
    case "preparing":
      return "bg-yellow-100 text-yellow-700";
    case "at_sea":
      return "bg-blue-100 text-blue-700";
    case "returned":
      return "bg-green-100 text-green-700";
    default:
      return "bg-gray-200 text-gray-600";
  }
}

function tripStatusKey(status: string): TranslationKey {
  switch (status) {
    case "preparing":
      return "statusPreparing";
    case "at_sea":
      return "statusAtSea";
    case "returned":
      return "statusReturned";
    default:
      return "statusClosed";
  }
}

export default function DashboardPage() {
  const { t, lang } = useLanguage();
  const [data, setData] = useState<DashboardData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error();
        setData({ ...EMPTY, ...(await res.json()) });
      } catch {
        setError(t("noResults"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [t]);

  const nf = new Intl.NumberFormat(lang === "fr" ? "fr-FR" : "en-US");
  const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US") : "-";

  const kpis: { icon: LucideIcon; labelKey: TranslationKey; value: number; money?: boolean; cls: string }[] = [
    { icon: Ship, labelKey: "totalBoats", value: data.totalBoats, cls: "bg-blue-100 text-blue-600" },
    { icon: Route, labelKey: "activeTrips", value: data.activeTrips, cls: "bg-yellow-100 text-yellow-600" },
    { icon: CheckCircle, labelKey: "completedTrips", value: data.completedTrips, cls: "bg-green-100 text-green-600" },
    { icon: TrendingUp, labelKey: "totalRevenue", value: data.totalRevenue, money: true, cls: "bg-emerald-100 text-emerald-600" },
    { icon: TrendingDown, labelKey: "totalExpensesLabel", value: data.totalExpenses, money: true, cls: "bg-red-100 text-red-600" },
    { icon: Wallet, labelKey: "netProfit", value: data.netProfit, money: true, cls: "bg-purple-100 text-purple-600" },
    { icon: Package, labelKey: "unsoldStockValue", value: data.unsoldStockValue, money: true, cls: "bg-orange-100 text-orange-600" },
    { icon: AlertTriangle, labelKey: "outstandingDebt", value: data.outstandingDebt, money: true, cls: "bg-danger-soft text-danger" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">{t("dashboardTitle")}</h1>

      {error && <div className="bg-danger-soft text-danger rounded-xl p-3 text-sm">{error}</div>}

      {loading ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-28 bg-foam rounded-2xl border border-sand-dim shadow-sm animate-pulse" />
            ))}
          </div>
          <div className="h-40 bg-foam rounded-2xl border border-sand-dim shadow-sm animate-pulse" />
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {kpis.map((kpi) => (
              <div key={kpi.labelKey} className="bg-foam rounded-2xl p-4 border border-sand-dim shadow-sm">
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${kpi.cls}`}>
                  <kpi.icon size={18} />
                </span>
                <p className="font-display text-xl font-bold truncate">
                  {nf.format(kpi.value)}
                  {kpi.money && <span className="text-xs font-normal text-ink-faint"> أ.م</span>}
                </p>
                <p className="text-xs text-ink-faint mt-1">{t(kpi.labelKey)}</p>
              </div>
            ))}
          </div>

          <section>
            <h2 className="font-display text-lg font-semibold mb-3">{t("recentTrips")}</h2>
            {data.recentTrips.length === 0 ? (
              <EmptyState icon={Route} title={t("noResults")} />
            ) : (
              <div className="space-y-3">
                {data.recentTrips.slice(0, 5).map((trip) => (
                  <Link
                    key={trip.id}
                    href={`/trips/${trip.id}`}
                    className="block bg-foam rounded-2xl p-4 border border-sand-dim shadow-sm hover:border-rope transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium truncate">{trip.boat?.name || "-"}</p>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${tripBadgeCls(trip.status)}`}>
                        {t(tripStatusKey(trip.status))}
                      </span>
                    </div>
                    <p className="text-sm text-ink-faint mt-1">{trip.captainName}</p>
                    <p className="text-xs text-ink-faint mt-2">
                      {fmtDate(trip.departureDate)} ← {fmtDate(trip.expectedReturnDate)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
