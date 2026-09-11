"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { EQUIPMENT_LABELS, EXERCISES_BY_ID, type Equipment } from "@/lib/exercises";
import type { OnboardingData } from "@/lib/types";
import { PLANS } from "@/lib/billing/plans";
import {
  inTrial,
  isSubscribed,
  trialDaysLeft,
  type Billing,
} from "@/lib/billing/entitlement";

const DAY_LABELS: Record<string, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

const SEX_LABELS: Record<string, string> = {
  male: "Male",
  female: "Female",
  prefer_not_to_say: "Not specified",
};

function exerciseNames(ids: string[]): string {
  return ids.map((id) => EXERCISES_BY_ID[id]?.name ?? id).join(", ");
}

function profileRows(o: OnboardingData): [string, string][] {
  const rows: [string, string][] = [
    ["Goal", o.goal ?? "Not set"],
    ["Experience", o.experience ?? "Not set"],
    ["Sessions", o.days ? `${o.days}/week` : "Not set"],
    ["Session length", o.length ? `~${o.length} min` : "Not set"],
    ["Where you train", o.environment ?? "Not set"],
  ];

  if (o.trainingDays.length) {
    rows.push(["Days", o.trainingDays.map((d) => DAY_LABELS[d] ?? d).join(", ")]);
  }
  if (o.equipment.length) {
    rows.push(["Equipment", o.equipment.map((e) => EQUIPMENT_LABELS[e as Equipment] ?? e).join(", ")]);
  }
  if (o.likedExercises.length) {
    rows.push(["Favourites", exerciseNames(o.likedExercises)]);
  }
  if (o.dislikedExercises.length) {
    rows.push(["Avoiding", exerciseNames(o.dislikedExercises)]);
  }
  if (o.bodyweightKg) rows.push(["Bodyweight", `${o.bodyweightKg} kg`]);
  if (o.age) rows.push(["Age", `${o.age}`]);
  if (o.heightCm) rows.push(["Height", `${o.heightCm} cm`]);
  if (o.sex) rows.push(["Sex", SEX_LABELS[o.sex] ?? o.sex]);
  if (o.considerations) rows.push(["Notes", o.considerations]);

  return rows;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/** What to say about someone's subscription, and what they can do about it. */
function billingSummary(billing: Billing | null): {
  title: string;
  detail: string;
  action: "subscribe" | "manage";
  urgent?: boolean;
} {
  if (!billing) {
    return { title: "Subscription", detail: "Your subscription status couldn't be loaded.", action: "subscribe" };
  }

  if (isSubscribed(billing)) {
    const plan = billing.interval ? `${PLANS[billing.interval].label} plan` : "Subscribed";
    if (billing.status === "past_due") {
      return {
        title: plan,
        detail: "Your last payment didn't go through. Update your card to keep access.",
        action: "manage",
        urgent: true,
      };
    }
    if (billing.currentPeriodEnd) {
      return {
        title: plan,
        detail: billing.cancelAtPeriodEnd
          ? `Cancelled — you have access until ${formatDate(billing.currentPeriodEnd)}.`
          : `Renews on ${formatDate(billing.currentPeriodEnd)}.`,
        action: "manage",
      };
    }
    return { title: plan, detail: "Active.", action: "manage" };
  }

  if (inTrial(billing)) {
    const days = trialDaysLeft(billing);
    return {
      title: "Free trial",
      detail: `${days} day${days === 1 ? "" : "s"} left. No card needed until you subscribe.`,
      action: "subscribe",
    };
  }

  return {
    title: "Trial ended",
    detail: "Subscribe to keep using your plan and coach.",
    action: "subscribe",
    urgent: true,
  };
}

export default function Settings() {
  const router = useRouter();
  const onboarding = useAppStore((s) => s.onboarding);
  const billing = useAppStore((s) => s.billing);
  const user = useAuthStore((s) => s.user);
  const [opening, setOpening] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);

  const summary = billingSummary(billing);

  async function logOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  async function manageBilling() {
    setOpening(true);
    setBillingError(null);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (res.ok && data.url) {
        window.location.assign(data.url);
        return;
      }
      setBillingError(data.error ?? "Couldn't open billing — try again in a moment.");
    } catch {
      setBillingError("Couldn't reach billing — check your connection and try again.");
    }
    setOpening(false);
  }

  return (
    <div className="mx-auto max-w-sm">
      <button onClick={() => router.push("/home")} className="mb-4 flex items-center text-muted">
        <ChevronLeft size={18} />
      </button>
      <h1 className="mb-1 font-display text-2xl font-bold text-ink">Settings</h1>
      {user?.email && <p className="mb-5 text-sm text-muted">{user.email}</p>}

      <div className="mb-2 text-xs font-semibold tracking-widest text-muted">SUBSCRIPTION</div>
      <div className="mb-6 rounded-2xl border border-line bg-surface px-4 py-3.5">
        <div className="mb-3">
          <div className="text-sm font-semibold text-ink">{summary.title}</div>
          <div className={`text-xs leading-relaxed ${summary.urgent ? "text-warning" : "text-muted"}`}>
            {summary.detail}
          </div>
        </div>
        {summary.action === "subscribe" ? (
          <button
            onClick={() => router.push("/upgrade")}
            className="w-full rounded-xl bg-ink py-2.5 text-sm font-semibold text-background"
          >
            Subscribe
          </button>
        ) : (
          <button
            onClick={manageBilling}
            disabled={opening}
            className="w-full rounded-xl border border-line py-2.5 text-sm font-semibold text-ink disabled:opacity-60"
          >
            {opening ? "Opening billing" : "Manage billing"}
          </button>
        )}
        {billingError && <p className="mt-2 text-xs text-warning">{billingError}</p>}
      </div>

      <div className="mb-2 text-xs font-semibold tracking-widest text-muted">YOUR PROFILE</div>
      <div className="mb-6 overflow-hidden rounded-2xl border border-line bg-surface">
        {profileRows(onboarding).map(([label, value], i) => (
          <div
            key={label}
            className={`flex justify-between gap-6 px-4 py-3.5 text-sm ${i !== 0 ? "border-t border-line" : ""}`}
          >
            <span className="flex-shrink-0 text-muted">{label}</span>
            <span className="text-right font-semibold text-ink">{value}</span>
          </div>
        ))}
      </div>

      <div className="mb-2 text-xs font-semibold tracking-widest text-muted">REFERENCE</div>
      <button
        onClick={() => router.push("/evidence")}
        className="mb-6 flex w-full items-center justify-between gap-4 rounded-2xl border border-line bg-surface px-4 py-3.5 text-left"
      >
        <div>
          <div className="text-sm font-semibold text-ink">The evidence behind your plan</div>
          <div className="text-xs text-muted">
            The research your plan and coach are built on, with sources
          </div>
        </div>
        <ChevronRight size={18} className="flex-shrink-0 text-muted" />
      </button>

      <button
        onClick={logOut}
        className="w-full rounded-2xl border border-line py-3.5 text-sm font-semibold text-warning"
      >
        Log out
      </button>
    </div>
  );
}
