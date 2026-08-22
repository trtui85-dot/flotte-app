"use client";

import { LanguageProvider } from "@/components/language-provider";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}
