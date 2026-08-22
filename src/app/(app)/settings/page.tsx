"use client";

import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { Plus, Trash2, Settings, Globe, Fish, Tag, DollarSign } from "lucide-react";

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-sand-dim bg-foam text-sm focus:outline-none focus:border-rope";

interface SettingItem { id: string; name: string }

export default function SettingsPage() {
  const { t, lang, setLang } = useLanguage();
  const [companyName, setCompanyName] = useState("");
  const [fishCategories, setFishCategories] = useState<SettingItem[]>([]);
  const [fishQuality, setFishQuality] = useState<SettingItem[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<SettingItem[]>([]);
  const [newItem, setNewItem] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [settingsRes, fcRes, fqRes, ecRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/settings/fishCategories"),
        fetch("/api/settings/fishQuality"),
        fetch("/api/settings/expenseCategories"),
      ]);
      if (settingsRes.ok) { const d = await settingsRes.json(); setCompanyName(d.companyName || ""); }
      if (fcRes.ok) setFishCategories(await fcRes.json());
      if (fqRes.ok) setFishQuality(await fqRes.json());
      if (ecRes.ok) setExpenseCategories(await ecRes.json());
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveSettings = async () => {
    setSaving(true);
    try { await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ companyName }) }); } catch {} finally { setSaving(false); }
  };

  const addItem = async (category: string) => {
    if (!newItem.trim()) return;
    await fetch(`/api/settings/${category}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newItem }) });
    setNewItem(""); await load();
  };

  const deleteItem = async (category: string, id: string) => {
    await fetch(`/api/settings/${category}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    await load();
  };

  const renderSection = (title: string, icon: React.ReactNode, category: string, items: SettingItem[]) => (
    <div className="bg-foam rounded-2xl border border-sand-dim shadow-sm overflow-hidden">
      <button onClick={() => setActiveSection(activeSection === category ? null : category)}
        className="w-full flex items-center justify-between p-4 hover:bg-sand-dim/50 transition-colors">
        <div className="flex items-center gap-2">{icon}<span className="font-medium text-sm">{title}</span><span className="text-xs text-ink-faint bg-sand-dim rounded-full px-2">{items.length}</span></div>
        <span className="text-ink-faint text-xs">{activeSection === category ? "▲" : "▼"}</span>
      </button>
      {activeSection === category && (
        <div className="px-4 pb-4 border-t border-sand-dim pt-3 space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-1.5">
              <span className="text-sm">{item.name}</span>
              <button onClick={() => deleteItem(category, item.id)} className="p-1.5 rounded-lg text-ink-faint hover:bg-danger-soft hover:text-danger"><Trash2 size={14} /></button>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder={t("add")}
              onKeyDown={(e) => e.key === "Enter" && addItem(category)}
              className={`${inputCls} flex-1`} />
            <button onClick={() => addItem(category)} className="bg-rope text-white rounded-xl px-3 text-sm hover:bg-rope-dark"><Plus size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold flex items-center gap-2"><Settings size={22} /> {t("settingsTitle")}</h1>

      <div className="bg-foam rounded-2xl p-4 border border-sand-dim shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">{t("companyName")}</label>
          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputCls} />
        </div>
        <button onClick={saveSettings} disabled={saving} className="w-full bg-rope text-white rounded-xl py-2.5 text-sm font-medium hover:bg-rope-dark disabled:opacity-50">
          {saving ? "..." : t("save")}
        </button>
      </div>

      <div className="bg-foam rounded-2xl p-4 border border-sand-dim shadow-sm">
        <div className="flex items-center gap-2 mb-3"><Globe size={18} className="text-rope" /><span className="text-sm font-medium">{t("language")}</span></div>
        <div className="flex gap-2">
          <button onClick={() => setLang("ar")} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${lang === "ar" ? "bg-rope text-white" : "border border-sand-dim hover:bg-sand-dim"}`}>العربية</button>
          <button onClick={() => setLang("fr")} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${lang === "fr" ? "bg-rope text-white" : "border border-sand-dim hover:bg-sand-dim"}`}>Français</button>
        </div>
      </div>

      {renderSection(t("fishCategories"), <Fish size={18} className="text-sea" />, "fishCategories", fishCategories)}
      {renderSection(t("fishQualityLevels"), <Tag size={18} className="text-success" />, "fishQuality", fishQuality)}
      {renderSection(t("expenseCategories"), <DollarSign size={18} className="text-rope" />, "expenseCategories", expenseCategories)}
    </div>
  );
}
