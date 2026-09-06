"use client";

import { useEffect, useState } from "react";

interface SplashScreenProps {
  iconSrc: string;
  name: string;
  subtitle: string;
  durationMs?: number;
  onFinish?: () => void;
}

export default function SplashScreen({
  iconSrc,
  name,
  subtitle,
  durationMs = 2500,
  onFinish,
}: SplashScreenProps) {
  const [exiting, setExiting] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), durationMs);
    const removeTimer = setTimeout(() => {
      setGone(true);
      onFinish?.();
    }, durationMs + 450);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [durationMs, onFinish]);

  if (gone) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0b1220] ${
        exiting ? "splash-exiting" : ""
      }`}
    >
      <div className="relative flex items-center justify-center mb-8">
        <div className="splash-glow absolute w-36 h-36 rounded-full bg-rope/20 blur-2xl" />
        <div className="splash-logo relative w-24 h-24 rounded-full bg-white/10 ring-1 ring-white/15 flex items-center justify-center overflow-hidden">
          <img src={iconSrc} alt={name} className="w-16 h-16 object-contain" />
        </div>
      </div>
      <h1 className="splash-name font-display text-white text-2xl md:text-3xl mb-2 text-center leading-snug" dir="rtl">
        {name}
      </h1>
      <p className="splash-sub text-white/50 text-sm mb-10 text-center">{subtitle}</p>
      <div className="w-[120px] h-[3px] rounded-full bg-white/15 overflow-hidden">
        <div className="splash-bar h-full bg-rope rounded-full" />
      </div>
    </div>
  );
}