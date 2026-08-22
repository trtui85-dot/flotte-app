"use client";

import { useLanguage } from "@/components/language-provider";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel, danger }: Props) {
  const { t } = useLanguage();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-foam rounded-2xl p-6 w-full max-w-sm shadow-xl animate-fade-in">
        <button onClick={onClose} className="absolute top-3 left-3 text-ink-faint hover:text-ink">
          <X size={18} />
        </button>
        <h3 className="font-display text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-ink-soft mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-sand-dim hover:bg-sand-dim transition-colors">
            {t("cancel")}
          </button>
          <button onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-colors ${
              danger ? "bg-danger hover:bg-danger/90" : "bg-rope hover:bg-rope-dark"
            }`}>
            {confirmLabel || t("confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
