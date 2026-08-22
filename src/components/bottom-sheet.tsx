"use client";

import { X } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function BottomSheet({ open, onClose, title, children }: Props) {
  const { t } = useLanguage();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-foam rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-foam rounded-t-3xl sm:rounded-t-2xl px-6 py-4 border-b border-sand-dim flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-ink-faint hover:text-ink p-1">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
        <div className="sticky bottom-0 bg-foam px-6 py-3 border-t border-sand-dim flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-sand-dim hover:bg-sand-dim transition-colors">
            {t("cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
