"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { PLANS } from "@/lib/billing/plans";
import { PAYMENTS_OPEN, inTrial, isSubscribed, trialDaysLeft, type PlanInterval } from "@/lib/billing/entitlement";
import { clsx } from "@/lib/clsx";

const INCLUDED = [
  "A training plan built around your goal, equipment and schedule",
  "Targets that move up as you get stronger",
  "Your AI coach, grounded in published research",
  "Every workout and personal best, kept",
];

export default function Upgrade() {
  const router = useRouter();
  const billing = useAppStore((s) => s.billing);
  const [interval, setInterval] = useState<PlanInterval>("year");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (billing && isSubscribed(billing)) {
    return (
      <div className="mx-auto max-w-sm">
        <h1 className="mb-2 text-title1 font-bold text-ink">You&apos;re subscribed.</h1>
        <p className="mb-6 text-subhead leading-relaxed text-muted">
          Change your plan, update your card or cancel from Settings.
        </p>
        <button
          onClick={() => router.push("/settings")}
          className="w-full rounded-[20px] bg-ink py-4 text-[15px] font-semibold text-background"
        >
          Go to Settings
        </button>
      </div>
    );
  }

  if (!PAYMENTS_OPEN) {
    return (
      <div className="mx-auto max-w-sm">
        <h1 className="mb-2 text-title1 font-bold text-ink">Subscriptions open soon.</h1>
        <p className="mb-6 text-subhead leading-relaxed text-muted">
          We&apos;re not taking payments yet, so your plan, your coach and your progress are all free for now. When
          subscriptions open, you&apos;ll have at least 7 more days free before you&apos;d need to subscribe.
        </p>

        <div className="mb-6 flex flex-col gap-2.5" aria-label="Prices when subscriptions open">
          {(Object.keys(PLANS) as PlanInterval[]).map((id) => {
            const plan = PLANS[id];
            return (
              <div
                key={id}
                className="flex items-center justify-between gap-4 rounded-[20px] bg-surface px-4 py-4"
              >
                <div>
                  <div className="text-subhead font-semibold text-ink">{plan.label}</div>
                  {plan.note && <div className="text-footnote text-accent">{plan.note}</div>}
                </div>
                <div className="tabular text-right">
                  <div className="text-title3 font-bold text-ink">{plan.price}</div>
                  <div className="text-footnote text-muted">{plan.per}</div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => router.push("/home")}
          className="w-full rounded-[20px] bg-ink py-4 text-[15px] font-semibold text-background"
        >
          Back to my plan
        </button>
      </div>
    );
  }

  const trialActive = billing ? inTrial(billing) : false;
  const daysLeft = billing ? trialDaysLeft(billing) : 0;

  async function checkout() {
    setBusy(true);
    setError(null);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ interval }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (res.ok && data.url) {
        window.location.assign(data.url);
        return;
      }
      setError(data.error ?? "Couldn't start checkout — try again in a moment.");
    } catch {
      setError("Couldn't reach payments — check your connection and try again.");
    }
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-2 text-title1 font-bold text-ink">
        {trialActive ? "Keep your plan going." : "Your free trial has ended."}
      </h1>
      <p className="mb-6 text-subhead leading-relaxed text-muted">
        {trialActive
          ? `You have ${daysLeft} day${daysLeft === 1 ? "" : "s"} of your free trial left. Subscribe now and nothing changes when it ends.`
          : "Your plan, your logged workouts and your progress are all still here. Subscribe to pick up exactly where you left off."}
      </p>

      <div role="radiogroup" aria-label="Choose a plan" className="mb-6 flex flex-col gap-2.5">
        {(Object.keys(PLANS) as PlanInterval[]).map((id) => {
          const plan = PLANS[id];
          const selected = interval === id;
          return (
            <button
              key={id}
              role="radio"
              aria-checked={selected}
              onClick={() => setInterval(id)}
              className={clsx(
                "flex items-center justify-between gap-4 rounded-[20px] border bg-surface px-4 py-4 text-left transition",
                selected ? "border-accent" : "border-line"
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={clsx(
                    "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border",
                    selected ? "border-accent bg-accent" : "border-line"
                  )}
                >
                  {selected && <Check size={12} className="text-accent-ink" />}
                </span>
                <div>
                  <div className="text-subhead font-semibold text-ink">{plan.label}</div>
                  {plan.note && <div className="text-footnote text-accent">{plan.note}</div>}
                </div>
              </div>
              <div className="tabular text-right">
                <div className="text-title3 font-bold text-ink">{plan.price}</div>
                <div className="text-footnote text-muted">{plan.per}</div>
              </div>
            </button>
          );
        })}
      </div>

      <ul className="mb-6 flex flex-col gap-2.5">
        {INCLUDED.map((line) => (
          <li key={line} className="flex gap-2.5 text-subhead leading-relaxed text-ink">
            <Check size={16} className="mt-0.5 flex-shrink-0 text-success" />
            {line}
          </li>
        ))}
      </ul>

      {error && <p className="mb-3 text-subhead text-warning">{error}</p>}

      <button
        onClick={checkout}
        disabled={busy}
        className="w-full rounded-[20px] bg-ink py-4 text-[15px] font-semibold text-background disabled:opacity-60"
      >
        {busy ? "Opening secure checkout" : "Continue to payment"}
      </button>

      <p className="mt-4 text-footnote leading-relaxed text-muted">
        Payments are handled securely by Stripe — your card details never touch this app. Cancel
        any time from Settings and keep access until the end of the period you&apos;ve paid for.
      </p>
    </div>
  );
}
