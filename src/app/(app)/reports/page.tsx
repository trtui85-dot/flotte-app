"use client";

import { useLanguage } from "@/components/language-provider";
import { Ship, Route, Wallet, ShoppingCart, AlertTriangle, BarChart3 } from "lucide-react";

export default function ReportsPage() {
  const { t } = useLanguage();

  const cards = [
    { icon: Ship, label: t("boatReport"), color: "bg-blue-50 text-blue-600" },
    { icon: Route, label: t("tripReport"), color: "bg-yellow-50 text-yellow-600" },
    { icon: Wallet, label: t("expenseReport"), color: "bg-red-50 text-red-600" },
    { icon: ShoppingCart, label: t("salesReport"), color: "bg-green-50 text-green-600" },
    { icon: AlertTriangle, label: t("customerDebtReport"), color: "bg-orange-50 text-orange-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 size={24} className="text-rope" />
        <h1 className="font-display text-2xl font-bold">{t("reportsTitle")}</h1>
      </div>

      <div className="space-y-3">
        {cards.map((card, i) => (
          <div key={i} className="bg-foam rounded-2xl p-4 border border-sand-dim shadow-sm flex items-center gap-4 hover:border-rope transition-colors cursor-pointer">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color}`}>
              <card.icon size={22} />
            </div>
            <span className="font-medium">{card.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
