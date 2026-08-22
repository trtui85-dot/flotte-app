"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ar, fr, type Language, type TranslationKey } from "@/lib/i18n";

interface LanguageContextValue {
  lang: Language;
  t: (key: TranslationKey, replacements?: Record<string, string>) => string;
  setLang: (lang: Language) => void;
  dir: "rtl" | "ltr";
  fontFamily: string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = "flotte:locale";
const dictionaries = { ar, fr };

function getInitialLang(): Language {
  if (typeof window === "undefined") return "ar";
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "fr" || saved === "ar") return saved;
  return "ar";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(getInitialLang);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("lang", lang);
    root.setAttribute("dir", lang === "fr" ? "ltr" : "rtl");
    document.body.style.fontFamily =
      lang === "fr"
        ? "'Inter', 'IBM Plex Sans Arabic', sans-serif"
        : "'IBM Plex Sans Arabic', 'Inter', sans-serif";
  }, [lang]);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = useCallback(
    (key: TranslationKey, replacements?: Record<string, string>) => {
      let text = dictionaries[lang]?.[key] || dictionaries.ar[key] || key;
      if (replacements) {
        for (const [k, v] of Object.entries(replacements)) {
          text = text.replace(new RegExp(`\\{${k}\\}`, "g"), v);
        }
      }
      return text;
    },
    [lang]
  );

  const value = useMemo(
    () => ({
      lang, t, setLang,
      dir: (lang === "fr" ? "ltr" : "rtl") as "rtl" | "ltr",
      fontFamily: lang === "fr"
        ? "'Inter', 'IBM Plex Sans Arabic', sans-serif"
        : "'IBM Plex Sans Arabic', 'Inter', sans-serif",
    }),
    [lang, t, setLang]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      lang: "ar" as Language,
      t: (key: TranslationKey) => key,
      setLang: () => {},
      dir: "rtl" as const,
      fontFamily: "'IBM Plex Sans Arabic', sans-serif",
    };
  }
  return ctx;
}
