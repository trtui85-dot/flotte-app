"use client";

import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import BottomSheet from "@/components/bottom-sheet";
import ConfirmDialog from "@/components/confirm-dialog";
import EmptyState from "@/components/empty-state";
import { Plus, Search, Pencil, Trash2, Ship, type LucideIcon } from "lucide-react";

interface Boat {
  id: string;
  name: string;
  registrationNum?: string | null;
  captainName?: string | null;
  notes?: string | null;
  status: string;
  _count?: { trips?: number };
}

const EMPTY_FORM = { name: "", registrationNum: "", captainName: "", notes: "", status: "active" };
const inputCls =
  "w-full px-4 py-2.5 rounded-xl border border-sand-dim bg-foam text-sm focus:outline-none focus:border-rope";

function badgeCls(status: string): string {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-700";
    case "maintenance":
      return "bg-yellow-100 text-yellow-700";
    case "in_trip":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-200 text-gray-600";
  }
}

export default function BoatsPage() {
  const { t } = useLanguage();
  const [boats, setBoats] = useState<Boat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/boats");
      if (!res.ok) throw new Error();
      setBoats(await res.json());
      setError("");
    } catch {
      setError(t("noResults"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setSheetOpen(true);
  };

  const openEdit = (boat: Boat) => {
    setEditingId(boat.id);
    setForm({
      name: boat.name,
      registrationNum: boat.registrationNum || "",
      captainName: boat.captainName || "",
      notes: boat.notes || "",
      status: boat.status,
    });
    setFormError("");
    setSheetOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    setFormError("");
    try {
      const res = await fetch(editingId ? `/api/boats/${editingId}` : "/api/boats", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setSheetOpen(false);
      await load();
    } catch {
      setFormError(t("noResults"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!confirmId) return;
    setDeleting(true);
    try {
      await fetch(`/api/boats/${confirmId}`, { method: "DELETE" });
      setConfirmId(null);
      await load();
    } finally {
      setDeleting(false);
    }
  };

  const filtered = boats.filter((b) =>
    [b.name, b.captainName, b.registrationNum]
      .filter(Boolean)
      .some((v) => v!.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">{t("boatsTitle")}</h1>
        <button
          onClick={openAdd}
          className="bg-rope text-white rounded-xl p-2.5 hover:bg-rope-dark transition-colors"
          aria-label={t("addBoat")}
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("search")}
          className={`${inputCls} ps-10`}
        />
      </div>

      {error && <div className="bg-danger-soft text-danger rounded-xl p-3 text-sm">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-rope border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Ship as LucideIcon}
          title={t("noResults")}
          action={
            <button onClick={openAdd} className="bg-rope text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-rope-dark transition-colors">
              {t("addBoat")}
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((boat) => (
            <div key={boat.id} className="bg-foam rounded-2xl p-4 border border-sand-dim shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-display font-semibold truncate">{boat.name}</p>
                  <p className="text-sm text-ink-faint mt-0.5 truncate">{boat.captainName}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeCls(boat.status)}`}>
                  {t(
                    boat.status === "active"
                      ? "statusActive"
                      : boat.status === "maintenance"
                        ? "statusMaintenance"
                        : "statusInTrip"
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-sand-dim">
                <span className="text-xs text-ink-faint">
                  {t("tripsCount")}: {(boat._count?.trips ?? 0).toLocaleString()}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(boat)} className="p-2 rounded-lg text-ink-faint hover:bg-sand-dim hover:text-ink transition-colors" aria-label={t("edit")}>
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => setConfirmId(boat.id)} className="p-2 rounded-lg text-ink-faint hover:bg-danger-soft hover:text-danger transition-colors" aria-label={t("delete")}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={editingId ? t("editBoat") : t("addBoat")}>
        <div className="space-y-4">
          {formError && <div className="bg-danger-soft text-danger rounded-xl p-3 text-sm">{formError}</div>}
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("boatName")}</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("registrationNumber")}</label>
            <input value={form.registrationNum} onChange={(e) => setForm({ ...form, registrationNum: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("captainName")}</label>
            <input value={form.captainName} onChange={(e) => setForm({ ...form, captainName: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("boatStatus")}</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls}>
              <option value="active">{t("statusActive")}</option>
              <option value="maintenance">{t("statusMaintenance")}</option>
              <option value="in_trip">{t("statusInTrip")}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("notes")}</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className={inputCls} />
          </div>
          <button
            onClick={submit}
            disabled={saving || !form.name.trim()}
            className="w-full bg-rope text-white rounded-xl py-2.5 text-sm font-medium hover:bg-rope-dark transition-colors disabled:opacity-50"
          >
            {saving ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : t("save")}
          </button>
        </div>
      </BottomSheet>

      <ConfirmDialog
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={confirmDelete}
        title={t("confirmDeleteTitle")}
        message={t("boatDeleteMessage")}
        danger
      />
    </div>
  );
}
