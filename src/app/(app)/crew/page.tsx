"use client";

import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import BottomSheet from "@/components/bottom-sheet";
import ConfirmDialog from "@/components/confirm-dialog";
import EmptyState from "@/components/empty-state";
import { Plus, Search, Pencil, Trash2, Users } from "lucide-react";

interface CrewMember { id: string; name: string; phone?: string | null; notes?: string | null; _count?: { tripCrews?: number } }

const EMPTY_FORM = { name: "", phone: "", notes: "" };
const inputCls = "w-full px-4 py-2.5 rounded-xl border border-sand-dim bg-foam text-sm focus:outline-none focus:border-rope";

export default function CrewPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { const res = await fetch("/api/crew"); if (res.ok) setItems(await res.json()); } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditingId(null); setForm(EMPTY_FORM); setSheetOpen(true); };
  const openEdit = (m: CrewMember) => { setEditingId(m.id); setForm({ name: m.name, phone: m.phone || "", notes: m.notes || "" }); setSheetOpen(true); };

  const submit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await fetch(editingId ? `/api/crew/${editingId}` : "/api/crew", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSheetOpen(false); await load();
    } catch {} finally { setSaving(false); }
  };

  const doDelete = async () => {
    if (!confirmId) return;
    await fetch(`/api/crew/${confirmId}`, { method: "DELETE" });
    setConfirmId(null); await load();
  };

  const filtered = items.filter((m) => [m.name, m.phone].filter(Boolean).some((v) => v!.toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">{t("crewTitle")}</h1>
        <button onClick={openAdd} className="bg-rope text-white rounded-xl p-2.5 hover:bg-rope-dark"><Plus size={18} /></button>
      </div>
      <div className="relative">
        <Search size={16} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("search")} className={`${inputCls} ps-10`} />
      </div>
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-rope border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title={t("noResults")} action={<button onClick={openAdd} className="bg-rope text-white rounded-xl px-4 py-2.5 text-sm">{t("addCrew")}</button>} />
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <div key={m.id} className="bg-foam rounded-2xl p-4 border border-sand-dim shadow-sm">
              <div className="flex items-start justify-between">
                <div><p className="font-semibold">{m.name}</p>{m.phone && <p className="text-sm text-ink-faint mt-0.5">{m.phone}</p>}</div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(m)} className="p-2 rounded-lg text-ink-faint hover:bg-sand-dim"><Pencil size={16} /></button>
                  <button onClick={() => setConfirmId(m.id)} className="p-2 rounded-lg text-ink-faint hover:bg-danger-soft hover:text-danger"><Trash2 size={16} /></button>
                </div>
              </div>
              <p className="text-xs text-ink-faint mt-2 border-t border-sand-dim pt-2">{t("tripsCount")}: {(m._count?.tripCrews ?? 0).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={editingId ? t("editCrew") : t("addCrew")}>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium mb-1.5">{t("crewName")}</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-sm font-medium mb-1.5">{t("phone")}</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-sm font-medium mb-1.5">{t("notes")}</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={inputCls} /></div>
          <button onClick={submit} disabled={saving || !form.name.trim()} className="w-full bg-rope text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50">{saving ? "..." : t("save")}</button>
        </div>
      </BottomSheet>
      <ConfirmDialog open={confirmId !== null} onClose={() => setConfirmId(null)} onConfirm={doDelete} title={t("confirmDeleteTitle")} message={t("crewDeleteMessage")} danger />
    </div>
  );
}
