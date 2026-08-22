"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/components/language-provider";
import BottomSheet from "@/components/bottom-sheet";
import ConfirmDialog from "@/components/confirm-dialog";
import { ChevronRight, Anchor, ShoppingCart, Package, Wallet, ArrowRight, RefreshCw, Plus, Trash2 } from "lucide-react";
import type { TranslationKey } from "@/lib/i18n";

interface TripDetail {
  id: string; status: string; captainName?: string | null; departureDate: string; expectedReturnDate?: string | null; actualReturnDate?: string | null; crewPaymentMethod: string; notes?: string | null;
  boat?: { id: string; name: string } | null;
  tripCrews: { id: string; crewMember?: { name: string } | null; paymentType: string; fixedAmount?: number | null; percentage?: number | null }[];
  catches: { id: string; fishCategory?: { name: string } | null; fishQuality?: { name: string } | null; quantity: number; unit: string; estimatedPrice?: number | null }[];
  expenses: { id: string; expenseCategory?: { name: string } | null; amount: number; date: string; description?: string | null }[];
  sales: { id: string; buyer?: { name: string } | null; fishCategory?: { name: string } | null; fishQuality?: { name: string } | null; quantity: number; salePrice: number; totalAmount: number; payments: { id: string; amount: number }[] }[];
}

interface SettingItem { id: string; name: string }
interface BuyerItem { id: string; name: string }

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
  const [saving, setSaving] = useState(false);

  const [fishCategories, setFishCategories] = useState<SettingItem[]>([]);
  const [fishQuality, setFishQuality] = useState<SettingItem[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<SettingItem[]>([]);
  const [buyers, setBuyers] = useState<BuyerItem[]>([]);

  const [catchForm, setCatchForm] = useState({ fishCategoryId: "", fishQualityId: "", quantity: "", unit: "kg", estimatedPrice: "" });
  const [expenseForm, setExpenseForm] = useState({ expenseCategoryId: "", amount: "", date: "", description: "" });
  const [saleForm, setSaleForm] = useState({ buyerId: "", fishCategoryId: "", fishQualityId: "", quantity: "", salePrice: "" });

  const [deleteId, setDeleteId] = useState<{ type: string; id: string } | null>(null);

  const load = useCallback(async () => {
    try { const res = await fetch(`/api/trips/${id}`); if (res.ok) setTrip(await res.json()); } catch {} finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings/fishCategories").then((r) => r.ok ? r.json() : []),
      fetch("/api/settings/fishQuality").then((r) => r.ok ? r.json() : []),
      fetch("/api/settings/expenseCategories").then((r) => r.ok ? r.json() : []),
      fetch("/api/buyers").then((r) => r.ok ? r.json() : []),
    ]).then(([fc, fq, ec, bl]) => { setFishCategories(fc); setFishQuality(fq); setExpenseCategories(ec); setBuyers(bl); }).catch(() => {});
  }, []);

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

  const submitCatch = async () => {
    if (!catchForm.fishCategoryId || !catchForm.fishQualityId || !catchForm.quantity) return;
    setSaving(true);
    try {
      await fetch(`/api/trips/${id}/catches`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...catchForm, quantity: Number(catchForm.quantity), estimatedPrice: catchForm.estimatedPrice ? Number(catchForm.estimatedPrice) : null }),
      });
      setCatchForm({ fishCategoryId: "", fishQualityId: "", quantity: "", unit: "kg", estimatedPrice: "" });
      setSheetOpen(false); await load();
    } catch {} finally { setSaving(false); }
  };

  const submitExpense = async () => {
    if (!expenseForm.expenseCategoryId || !expenseForm.amount) return;
    setSaving(true);
    try {
      await fetch(`/api/trips/${id}/expenses`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...expenseForm, amount: Number(expenseForm.amount) }),
      });
      setExpenseForm({ expenseCategoryId: "", amount: "", date: "", description: "" });
      setSheetOpen(false); await load();
    } catch {} finally { setSaving(false); }
  };

  const submitSale = async () => {
    if (!saleForm.buyerId || !saleForm.fishCategoryId || !saleForm.fishQualityId || !saleForm.quantity || !saleForm.salePrice) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/trips/${id}/sales`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...saleForm, quantity: Number(saleForm.quantity), salePrice: Number(saleForm.salePrice) }),
      });
      if (res.ok) {
        setSaleForm({ buyerId: "", fishCategoryId: "", fishQualityId: "", quantity: "", salePrice: "" });
        setSheetOpen(false); await load();
      }
    } catch {} finally { setSaving(false); }
  };

  const doDelete = async () => {
    if (!deleteId) return;
    try {
      if (deleteId.type === "catch") {
        await fetch(`/api/trips/${id}/catches`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ catchId: deleteId.id }) });
      } else if (deleteId.type === "expense") {
        await fetch(`/api/trips/${id}/expenses`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expenseId: deleteId.id }) });
      } else if (deleteId.type === "sale") {
        await fetch(`/api/trips/${id}/sales`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ saleId: deleteId.id }) });
      }
      await load();
    } catch {} finally { setDeleteId(null); }
  };

  const sheetTitle = tab === "catches" ? t("addCatch") : tab === "expenses" ? t("addExpense") : t("addSale");

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
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${tab === key ? "border-rope text-rope bg-rope-soft" : "border-sand-dim text-ink-faint hover:bg-sand-dim"}`}>
            {key === "catches" ? <Package size={14} className="inline me-1" /> : key === "expenses" ? <Wallet size={14} className="inline me-1" /> : <ShoppingCart size={14} className="inline me-1" />}
            {t(`${key}Title` as TranslationKey)} ({key === "catches" ? trip.catches.length : key === "expenses" ? trip.expenses.length : trip.sales.length})
          </button>
        ))}
      </div>

      {trip.status !== "closed" && (
        <button onClick={() => setSheetOpen(true)} className="w-full bg-rope text-white rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2 hover:bg-rope-dark">
          <Plus size={16} /> {sheetTitle}
        </button>
      )}

      <div className="space-y-2">
        {tab === "catches" && (trip.catches.length === 0 ? <p className="text-sm text-ink-faint text-center py-4">{t("noResults")}</p> : trip.catches.map((c) => (
          <div key={c.id} className="bg-foam rounded-2xl p-3 border border-sand-dim shadow-sm text-sm">
            <div className="flex justify-between items-start">
              <div><span className="font-medium">{c.fishCategory?.name} — {c.fishQuality?.name}</span><p className="text-xs text-ink-faint mt-0.5">{c.quantity} {c.unit} {c.estimatedPrice ? `@ ${nf.format(c.estimatedPrice)}` : ""}</p></div>
              {trip.status !== "closed" && <button onClick={() => setDeleteId({ type: "catch", id: c.id })} className="p-1.5 rounded-lg text-ink-faint hover:bg-danger-soft hover:text-danger"><Trash2 size={14} /></button>}
            </div>
          </div>
        )))}
        {tab === "expenses" && (trip.expenses.length === 0 ? <p className="text-sm text-ink-faint text-center py-4">{t("noResults")}</p> : trip.expenses.map((e) => (
          <div key={e.id} className="bg-foam rounded-2xl p-3 border border-sand-dim shadow-sm text-sm">
            <div className="flex justify-between items-start">
              <div><span className="font-medium">{e.expenseCategory?.name}</span><p className="text-danger font-bold mt-0.5">{nf.format(e.amount)} أ.م</p>{e.description && <p className="text-xs text-ink-faint mt-1">{e.description}</p>}</div>
              {trip.status !== "closed" && <button onClick={() => setDeleteId({ type: "expense", id: e.id })} className="p-1.5 rounded-lg text-ink-faint hover:bg-danger-soft hover:text-danger"><Trash2 size={14} /></button>}
            </div>
          </div>
        )))}
        {tab === "sales" && (trip.sales.length === 0 ? <p className="text-sm text-ink-faint text-center py-4">{t("noResults")}</p> : trip.sales.map((s) => {
          const paid = s.payments.reduce((a, p) => a + p.amount, 0);
          return (
            <div key={s.id} className="bg-foam rounded-2xl p-3 border border-sand-dim shadow-sm text-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium">{s.buyer?.name}</span>
                  <p className="text-xs text-ink-faint mt-0.5">{s.fishCategory?.name} {s.fishQuality?.name ? `(${s.fishQuality.name})` : ""} × {s.quantity} @ {nf.format(s.salePrice)}</p>
                  <p className="text-success font-bold mt-1">{nf.format(s.totalAmount)} أ.م</p>
                  {paid > 0 && <p className="text-xs text-success-soft mt-0.5">{t("paid")}: {nf.format(paid)} — {t("outstanding")}: {nf.format(s.totalAmount - paid)}</p>}
                </div>
                {trip.status !== "closed" && <button onClick={() => setDeleteId({ type: "sale", id: s.id })} className="p-1.5 rounded-lg text-ink-faint hover:bg-danger-soft hover:text-danger"><Trash2 size={14} /></button>}
              </div>
            </div>
          );
        }))}
      </div>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={sheetTitle}>
        {tab === "catches" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("fishCategory")}</label>
              <select value={catchForm.fishCategoryId} onChange={(e) => setCatchForm({ ...catchForm, fishCategoryId: e.target.value })} className={inputCls}>
                <option value="">{t("noFishCategoriesAvailable")}</option>
                {fishCategories.map((fc) => <option key={fc.id} value={fc.id}>{fc.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("fishQuality")}</label>
              <select value={catchForm.fishQualityId} onChange={(e) => setCatchForm({ ...catchForm, fishQualityId: e.target.value })} className={inputCls}>
                <option value="">{t("noFishQualityAvailable")}</option>
                {fishQuality.map((fq) => <option key={fq.id} value={fq.id}>{fq.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">{t("quantity")}</label>
                <input type="number" value={catchForm.quantity} onChange={(e) => setCatchForm({ ...catchForm, quantity: e.target.value })} className={inputCls} min="0" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t("unit")}</label>
                <select value={catchForm.unit} onChange={(e) => setCatchForm({ ...catchForm, unit: e.target.value })} className={inputCls}>
                  <option value="kg">kg</option>
                  <option value="tonne">tonne</option>
                  <option value="piece">piece</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("estimatedPrice")} ({t("notes")})</label>
              <input type="number" value={catchForm.estimatedPrice} onChange={(e) => setCatchForm({ ...catchForm, estimatedPrice: e.target.value })} className={inputCls} min="0" />
            </div>
            <button onClick={submitCatch} disabled={saving || !catchForm.fishCategoryId || !catchForm.fishQualityId || !catchForm.quantity}
              className="w-full bg-rope text-white rounded-xl py-2.5 text-sm font-medium hover:bg-rope-dark disabled:opacity-50">
              {saving ? "..." : t("save")}
            </button>
          </div>
        )}

        {tab === "expenses" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("category")}</label>
              <select value={expenseForm.expenseCategoryId} onChange={(e) => setExpenseForm({ ...expenseForm, expenseCategoryId: e.target.value })} className={inputCls}>
                <option value="">{t("noCategoriesAvailable")}</option>
                {expenseCategories.map((ec) => <option key={ec.id} value={ec.id}>{ec.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("amount")} (أ.م)</label>
              <input type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} className={inputCls} min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("date")}</label>
              <input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("description")} ({t("notes")})</label>
              <textarea value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} rows={2} className={inputCls} />
            </div>
            <button onClick={submitExpense} disabled={saving || !expenseForm.expenseCategoryId || !expenseForm.amount}
              className="w-full bg-rope text-white rounded-xl py-2.5 text-sm font-medium hover:bg-rope-dark disabled:opacity-50">
              {saving ? "..." : t("save")}
            </button>
          </div>
        )}

        {tab === "sales" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("buyer")}</label>
              <select value={saleForm.buyerId} onChange={(e) => setSaleForm({ ...saleForm, buyerId: e.target.value })} className={inputCls}>
                <option value="">{t("noBuyersAvailable")}</option>
                {buyers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("fishCategory")}</label>
              <select value={saleForm.fishCategoryId} onChange={(e) => setSaleForm({ ...saleForm, fishCategoryId: e.target.value })} className={inputCls}>
                <option value="">{t("noFishCategoriesAvailable")}</option>
                {fishCategories.map((fc) => <option key={fc.id} value={fc.id}>{fc.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("fishQuality")}</label>
              <select value={saleForm.fishQualityId} onChange={(e) => setSaleForm({ ...saleForm, fishQualityId: e.target.value })} className={inputCls}>
                <option value="">{t("noFishQualityAvailable")}</option>
                {fishQuality.map((fq) => <option key={fq.id} value={fq.id}>{fq.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">{t("quantity")}</label>
                <input type="number" value={saleForm.quantity} onChange={(e) => setSaleForm({ ...saleForm, quantity: e.target.value })} className={inputCls} min="0" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t("salePrice")}</label>
                <input type="number" value={saleForm.salePrice} onChange={(e) => setSaleForm({ ...saleForm, salePrice: e.target.value })} className={inputCls} min="0" />
              </div>
            </div>
            <button onClick={submitSale} disabled={saving || !saleForm.buyerId || !saleForm.fishCategoryId || !saleForm.fishQualityId || !saleForm.quantity || !saleForm.salePrice}
              className="w-full bg-rope text-white rounded-xl py-2.5 text-sm font-medium hover:bg-rope-dark disabled:opacity-50">
              {saving ? "..." : t("save")}
            </button>
          </div>
        )}
      </BottomSheet>

      <ConfirmDialog open={deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={doDelete} title={t("confirmDeleteTitle")} message={t("confirmDeleteMessage")} danger />
    </div>
  );
}
