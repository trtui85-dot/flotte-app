"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/language-provider";
import { Ship, Eye, EyeOff, Globe } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { t, lang, setLang } = useLanguage();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/^[234]\d{7}$/.test(phone)) {
      setError(t("phoneInvalid"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("loginError"));
        return;
      }
      router.push(data.user?.role === "admin" ? "/dashboard" : "/dashboard");
    } catch {
      setError(t("loginError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sand flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-ink flex items-center justify-center">
              <Ship size={24} className="text-sand" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold">{t("appShort")}</h1>
              <p className="text-xs text-ink-faint">{t("appName")}</p>
            </div>
          </div>
          <button onClick={() => setLang(lang === "ar" ? "fr" : "ar")}
            className="p-2 rounded-xl hover:bg-sand-dim text-ink-faint transition-colors">
            <Globe size={20} />
          </button>
        </div>

        <form onSubmit={handleLogin} className="bg-foam rounded-2xl p-6 shadow-sm border border-sand-dim">
          <h2 className="font-display text-lg font-semibold mb-4">{t("loginTitle")}</h2>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-danger-soft text-danger text-sm">{error}</div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5">{t("phone")}</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="43XXXXXX" maxLength={8} dir="ltr"
              className="w-full px-4 py-2.5 rounded-xl border border-sand-dim bg-foam text-sm focus:outline-none focus:border-rope transition-colors text-center tracking-wider"
              required />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1.5">{t("code")}</label>
            <div className="relative">
              <input type={showCode ? "text" : "password"} value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="••••" dir="ltr"
                className="w-full px-4 py-2.5 rounded-xl border border-sand-dim bg-foam text-sm focus:outline-none focus:border-rope transition-colors text-center tracking-widest"
                required />
              <button type="button" onClick={() => setShowCode(!showCode)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink">
                {showCode ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-rope text-white font-medium text-sm hover:bg-rope-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? t("loggingIn") : t("loginButton")}
          </button>
        </form>

        <p className="text-center text-xs text-ink-faint mt-6">
          {lang === "ar" ? "نظام إدارة قوارب الصيد © 2026" : "Système de gestion des bateaux © 2026"}
        </p>
      </div>
    </div>
  );
}
