"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/components/language-provider";
import BottomSheet from "@/components/bottom-sheet";
import { ChevronRight, Anchor, ShoppingCart, Package, Wallet, ArrowRight, RefreshCw, Plus } from "lucide-react";
import type { TranslationKey } from "@/lib/i18n";

interface TripDetail {
  id: string; status: string; captainName?: string | null; departureDate: string; expectedReturnDate?: string | null; actualReturnDate?: string | null; crewPaymentMethod: string; notes?: string | null;
  boat?: { id: string; name: string } | null;
  tripCrews: { id: string; crewMember?: { name: string } | null; paymentType: string; fixedAmount?: number | null; percentage?: number | null }[];
  catches: { id: string; fishCategory?: { name: string } | null; fishQuality?: { name: string } | null; quantity: number; unit: string; estimatedPrice?: number | null }[];
  expenses: { id: string; expenseCategory?: { name: string } | null; amount: number; date: string; description?: string | null }[];
  sales: { id: string; buyer?: { name: string } | null; fishCategory?: { name: string } | null; quantity: number; salePrice: number; totalAmount: number; payments: { id: string; amount: number }[] }[];
}

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-sand-dim bg-foam text-sm focus:outline-none focus:border-rope";
const badgeCls = (s: string) => { switch (s) { case "preparing": return "bg-yellow-100 text-yellow-700"; case "at_sea": return "bg-blue-100 text-blue-700"; case "returned": return "bg-green-100 text-green-700"; default: return "bg-gray-200 text-gray-600"; } };
const statusKey = (s: string): TranslationKey => { switch (s) { case "preparing": return "statusPreparing"; case "at_sea": return "statusAtSea"; case "returned": return "statusReturned"; default: return "statusClosed"; } };
const NEXT: Record<string, string> = { preparing: "at_sea", at_sea: "returned", returned: "closed" };
const nf = new Intl.NumberFormat("en-US");

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLanguage();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"catches" | "expenses" | "sales">("catches");
  const [sheetOpen, setSheetOpen] = useState(false);

  const load = useCallback(async () => {
    try { const res = await fetch(`/api/trips/${id}`); if (res.ok) setTrip(await res.json()); } catch {} finally { setLoading(false); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const advance = async () => {
    if (!trip) return;
    const next = NEXT[trip.status];
    if (!next) return;
    await fetch(`/api/trips/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
    await load();
  };

  const reopen = async () => {
    await fetch(`/api/trips/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "returned" }) });
    await load();
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-rope border-t-transparent rounded-full animate-spin" /></div>;
  if (!trip) return <div className="text-center py-16 text-ink-faint">{t("noResults")}</div>;

  const totalRevenue = trip.sales.reduce((s, sale) => s + sale.totalAmount, 0);
  const totalExpenses = trip.expenses.reduce((s, e) => s + e.amount, 0);
  const totalPaid = trip.sales.reduce((s, sale) => s + sale.payments.reduce((p, pay) => p + pay.amount, 0), 0);
  const fmt = (d?: string | null) => d ? new Date(d).toLocaleDateString() : "-";

  return (
    <div className="space-y-4">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-ink-faint hover:text-ink text-sm"><ChevronRight size={16} /> {t("back")}</button>

      <div className="bg-foam rounded-2xl p-4 border border-sand-dim shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h1 className="font-display text-xl font-bold">{trip.boat?.name}</h1>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeCls(trip.status)}`}>{t(statusKey(trip.status))}</span>
        </div>
        {trip.captainName && <p className="text-sm text-ink-faint">{t("captainName")}: {trip.captainName}</p>}
        <p className="text-xs text-ink-faint mt-1">{fmt(trip.departureDate)} — {fmt(trip.expectedReturnDate)}</p>

        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-sand-dim">
          <div className="text-center"><p className="font-bold text-success">{nf.format(totalRevenue)}</p><p className="text-[10px] text-ink-faint">{t("revenue")}</p></div>
          <div className="text-center"><p className="font-bold text-danger">{nf.format(totalExpenses)}</p><p className="text-[10px] text-ink-faint">{t("expensesTotal")}</p></div>
          <div className="text-center"><p className="font-bold text-rope">{nf.format(totalPaid)}</p><p className="text-[10px] text-ink-faint">{t("paid")}</p></div>
        </div>

        {trip.status !== "closed" && (
          <button onClick={advance} className="w-full mt-4 bg-rope text-white rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2 hover:bg-rope-dark">
            <ArrowRight size={16} /> {t("advanceTo")} {t(statusKey(NEXT[trip.status] || ""))}
          </button>
        )}
        {trip.status === "closed" && (
          <button onClick={reopen} className="w-full mt-4 border border-rope text-rope rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2 hover:bg-rope-soft">
            <RefreshCw size={16} /> {t("reopen")}
          </button>
        )}
      </div>

      {trip.tripCrews.length > 0 && (
        <div className="bg-foam rounded-2xl p-4 border border-sand-dim shadow-sm">
          <h3 className="font-display font-semibold mb-2 flex items-center gap-2"><Anchor size={16} /> {t("crewSection")}</h3>
          <div className="space-y-2">
            {trip.tripCrews.map((tc) => (
              <div key={tc.id} className="flex items-center justify-between text-sm">
                <span>{tc.crewMember?.name}</span>
                <span className="text-ink-faint">{tc.paymentType === "fixed" ? `${nf.format(tc.fixedAmount || 0)} أ.م` : `${tc.percentage || 0}%`}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {(["catches", "expenses", "sales"] as const).map((key) => (
          <button key={key} onClick={() => { setTab(key); setSheetOpen(true); }}
            className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${tab === key ? "border-rope text-rope bg-rope-soft" : "border-sand-dim text-ink-faint hover:bg-sand-dim"}`}>
            {key === "catches" ? <Package size={14} className="inline me-1" /> : key === "expenses" ? <Wallet size={14} className="inline me-1" /> : <ShoppingCart size={14} className="inline me-1" />}
            {t(`${key}Title` as TranslationKey)} ({key === "catches" ? trip.catches.length : key === "expenses" ? trip.expenses.length : trip.sales.length})
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {tab === "catches" && trip.catches.map((c) => (
          <div key={c.id} className="bg-foam rounded-2xl p-3 border border-sand-dim shadow-sm text-sm">
            <div className="flex justify-between"><span className="font-medium">{c.fishCategory?.name} — {c.fishQuality?.name}</span><span className="text-ink-faint">{c.quantity} {c.unit}</span></div>
            {c.estimatedPrice && <p className="text-xs text-ink-faint mt-1">{t("estimatedPrice")}: {nf.format(c.estimatedPrice)}</p>}
          </div>
        ))}
        {tab === "expenses" && trip.expenses.map((e) => (
          <div key={e.id} className="bg-foam rounded-2xl p-3 border border-sand-dim shadow-sm text-sm">
            <div className="flex justify-between"><span className="font-medium">{e.expenseCategory?.name}</span><span className="text-danger font-bold">{nf.format(e.amount)} أ.م</span></div>
            {e.description && <p className="text-xs text-ink-faint mt-1">{e.description}</p>}
          </div>
        ))}
        {tab === "sales" && trip.sales.map((s) => (
          <div key={s.id} className="bg-foam rounded-2xl p-3 border border-sand-dim shadow-sm text-sm">
            <div className="flex justify-between"><span className="font-medium">{s.buyer?.name}</span><span className="text-success font-bold">{nf.format(s.totalAmount)} أ.م</span></div>
            <p className="text-xs text-ink-faint">{s.fishCategory?.name} × {s.quantity} @ {nf.format(s.salePrice)}</p>
          </div>
        ))}
      </div>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={tab === "catches" ? t("addCatch") : tab === "expenses" ? t("addExpense") : t("addSale")}>
        <p className="text-sm text-ink-faint">Formulaire d&apos;ajout — {tab}</p>
      </BottomSheet>
    </div>
  );
}
