"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useAppStore } from "@/lib/store";

export default function Settings() {
  const router = useRouter();
  const onboarding = useAppStore((s) => s.onboarding);

  return (
    <div className="mx-auto max-w-sm">
      <button onClick={() => router.push("/home")} className="mb-4 flex items-center text-muted">
        <ChevronLeft size={18} />
      </button>
      <h1 className="mb-5 font-display text-2xl font-bold text-ink">Settings</h1>

      <div className="mb-2 text-xs font-semibold tracking-widest text-muted">YOUR PROFILE</div>
      <div className="mb-6 overflow-hidden rounded-2xl border border-line bg-surface">
        {[
          ["Goal", onboarding.goal ?? "Build muscle"],
          ["Experience", onboarding.experience ?? "Intermediate"],
          ["Training days", `${onboarding.days ?? 4}/week`],
          ["Session length", `~${onboarding.length ?? 60} min`],
          ["Where you train", onboarding.environment ?? "Full gym"],
        ].map(([label, value], i) => (
          <div
            key={label}
            className={`flex justify-between px-4 py-3.5 text-sm ${i !== 0 ? "border-t border-line" : ""}`}
          >
            <span className="text-muted">{label}</span>
            <span className="font-semibold text-ink">{value}</span>
          </div>
        ))}
      </div>

      <div className="mb-2 text-xs font-semibold tracking-widest text-muted">PLAN</div>
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3.5">
        <div>
          <div className="text-sm font-semibold text-ink">Free</div>
          <div className="text-xs text-muted">1 program · limited coach messages</div>
        </div>
        <button className="rounded-xl bg-ink px-3.5 py-2 text-xs font-semibold text-background">
          Upgrade
        </button>
      </div>

      <button
        onClick={() => router.push("/")}
        className="w-full rounded-2xl border border-line py-3.5 text-sm font-semibold text-warning"
      >
        Log out
      </button>
    </div>
  );
}
