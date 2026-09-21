"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { clsx } from "@/lib/clsx";

const DISMISSED_KEY = "add-age-dismissed";

/**
 * For people who set up before age was its own question: if they didn't
 * share health details then, the app doesn't know their age, and a 70-year-old
 * would be missing the balance work and gentler warm-ups meant for them.
 *
 * It goes to Settings rather than saving here, because a new age rebuilds the
 * plan and Settings is where that's said before it happens. Dismissed once,
 * it stays gone on this device.
 */
export function AddAgeCard({ className }: { className?: string }) {
  const hasPlan = useAppStore((s) => s.plan !== null);
  const age = useAppStore((s) => s.onboarding.age);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return window.localStorage.getItem(DISMISSED_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (!hasPlan || age !== null || dismissed) return null;

  function dismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Private mode: it'll just show again next time.
    }
  }

  return (
    <div className={clsx("relative rounded-[20px] bg-surface shadow-card", className)}>
      <Link
        href="/settings/training"
        className="press flex min-h-[64px] items-center gap-3 rounded-[20px] p-4 pr-12 active:bg-fill"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-headline font-semibold text-ink">Add your age</span>
          <span className="block text-subhead text-muted">
            From 65, your plan adds balance work and gentler warm-ups.
          </span>
        </span>
      </Link>
      <button
        onClick={dismiss}
        aria-label="Don't ask about my age"
        className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full text-muted"
      >
        <X size={16} strokeWidth={2.4} />
      </button>
    </div>
  );
}
