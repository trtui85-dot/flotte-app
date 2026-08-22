"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import BottomSheet from "@/components/bottom-sheet";
import EmptyState from "@/components/empty-state";
import { Plus, Route, Calendar } from "lucide-react";
import type { TranslationKey } from "@/lib/i18n";

interface Trip { id: string; status: string; captainName?: string | null; departureDate: string; expectedReturnDate?: string | null; boat?: { name: string } | null; _count?: { catches?: number; expenses?: number; sales?: number } }
interface Boat { id: string; name: string }

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-sand-dim bg-foam text-sm focus:outline-none focus:border-rope";
const STATUSES = ["all", "preparing", "at_sea", "returned", "closed"] as const;

function badgeCls(s: string) { switch (s) { case "preparing": return "bg-yellow-100 text-yellow-700"; case "at_sea": return "bg-blue-100 text-blue-700"; case "returned": return "bg-green-100 text-green-700"; default: return "bg-gray-200 text-gray-600"; } }
function statusKey(s: string): TranslationKey { switch (s) { case "preparing": return "statusPreparing"; case "at_sea": return "statusAtSea"; case "returned": return "statusReturned"; default: return "statusClosed"; } }

export default function TripsPage() {
  const { t } = useLanguage();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState({ boatId: "", captainName: "", departureDate: "", expectedReturnDate: "", crewPaymentMethod: "gross", notes: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const url = filter === "all" ? "/api/trips" : `/api/trips?status=${filter}`;
      const [tripsRes, boatsRes] = await Promise.all([fetch(url), fetch("/api/boats")]);
      if (tripsRes.ok) setTrips(await tripsRes.json());
      if (boatsRes.ok) setBoats(await boatsRes.json());
    } catch {} finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.boatId) return;
    setSaving(true);
    try {
      await fetch("/api/trips", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setSheetOpen(false); await load();
    } catch {} finally { setSaving(false); }
  };

  const fmt = (d?: string | null) => d ? new Date(d).toLocaleDateString() : "-";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">{t("tripsTitle")}</h1>
        <button onClick={() => { setForm({ boatId: "", captainName: "", departureDate: "", expectedReturnDate: "", crewPaymentMethod: "gross", notes: "" }); setSheetOpen(true); }} className="bg-rope text-white rounded-xl p-2.5 hover:bg-rope-dark"><Plus size={18} /></button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === s ? "bg-rope text-white" : "bg-foam border border-sand-dim text-ink-soft hover:bg-sand-dim"}`}>
            {s === "all" ? t("all") : t(statusKey(s))}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-rope border-t-transparent rounded-full animate-spin" /></div>
      ) : trips.length === 0 ? (
        <EmptyState icon={Route} title={t("noResults")} />
      ) : (
        <div className="space-y-3">
          {trips.map((trip) => (
            <Link key={trip.id} href={`/trips/${trip.id}`}
              className="block bg-foam rounded-2xl p-4 border border-sand-dim shadow-sm hover:border-rope transition-colors">
              <div className="flex items-center justify-between gap-2">
                <p className="font-display font-semibold truncate">{trip.boat?.name || "-"}</p>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeCls(trip.status)}`}>{t(statusKey(trip.status))}</span>
              </div>
              {trip.captainName && <p className="text-sm text-ink-faint mt-1">{trip.captainName}</p>}
              <div className="flex items-center gap-2 mt-2 text-xs text-ink-faint">
                <Calendar size={12} /><span>{fmt(trip.departureDate)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={t("addTrip")}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("boat")}</label>
            <select value={form.boatId} onChange={(e) => setForm({ ...form, boatId: e.target.value })} className={inputCls}>
              <option value="">{t("noBoatsAvailable")}</option>
              {boats.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1.5">{t("captainName")}</label><input value={form.captainName} onChange={(e) => setForm({ ...form, captainName: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-sm font-medium mb-1.5">{t("departureDate")}</label><input type="date" value={form.departureDate} onChange={(e) => setForm({ ...form, departureDate: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-sm font-medium mb-1.5">{t("expectedReturnDate")}</label><input type="date" value={form.expectedReturnDate} onChange={(e) => setForm({ ...form, expectedReturnDate: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-sm font-medium mb-1.5">{t("crewPaymentMethod")}</label>
            <select value={form.crewPaymentMethod} onChange={(e) => setForm({ ...form, crewPaymentMethod: e.target.value })} className={inputCls}>
              <option value="gross">{t("crewPaymentMethodGross")}</option>
              <option value="after_expenses">{t("crewPaymentMethodAfterExpenses")}</option>
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1.5">{t("notes")}</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={inputCls} /></div>
          <button onClick={submit} disabled={saving || !form.boatId} className="w-full bg-rope text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50">{saving ? "..." : t("save")}</button>
        </div>
      </BottomSheet>
    </div>
  );
}
