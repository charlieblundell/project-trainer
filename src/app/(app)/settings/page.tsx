"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { CLEARED_HEALTH_FIELDS, withdrawHealthConsent } from "@/lib/health-consent";
import { InstallPrompt } from "@/components/InstallPrompt";
import { InviteFriends } from "@/components/InviteFriends";
import { PasswordSettings } from "@/components/PasswordSettings";
import { ListButton, ListLink, ListRow, ListSection } from "@/components/List";
import { EQUIPMENT_LABELS, EXERCISES_BY_ID, type Equipment } from "@/lib/exercises";
import type { OnboardingData } from "@/lib/types";
import { PLANS } from "@/lib/billing/plans";
import {
  PAYMENTS_OPEN,
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

type ProfileGroup = { title: string; href: string; rows: [string, string][] };

/** Their setup answers, grouped the way they can be edited. */
function profileGroups(o: OnboardingData): ProfileGroup[] {
  const dayOrder = Object.keys(DAY_LABELS);
  const days = [...o.trainingDays].sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));

  const groups: ProfileGroup[] = [
    {
      title: "Goal and experience",
      href: "/settings/training",
      rows: [
        ["Goal", o.goal ?? "Not set"],
        ["Experience", o.experience ?? "Not set"],
        ["Age", o.age ? `${o.age}` : "Not given"],
      ],
    },
    {
      title: "Training schedule",
      href: "/settings/schedule",
      rows: [
        ["Sessions", o.days ? `${o.days} a week` : "Not set"],
        ["Days", days.length ? days.map((d) => DAY_LABELS[d] ?? d).join(", ") : "Not set"],
        ["Session length", o.length ? `~${o.length} min` : "Not set"],
      ],
    },
    {
      title: "Equipment and exercises",
      href: "/settings/equipment",
      rows: [
        ["Where you train", o.environment ?? "Not set"],
        [
          "Equipment",
          // The full list wrapped into a paragraph beside its label; the count
          // reads at a glance, and the list is one tap away.
          o.equipment.length
            ? o.equipment.length <= 2
              ? o.equipment.map((e) => EQUIPMENT_LABELS[e as Equipment] ?? e).join(", ")
              : `${o.equipment.length} items`
            : "Not set",
        ],
        ["Favourites", o.likedExercises.length ? exerciseNames(o.likedExercises) : "None"],
        ["Avoiding", o.dislikedExercises.length ? exerciseNames(o.dislikedExercises) : "None"],
      ],
    },
  ];

  if (o.healthConsent === true) {
    groups.push({
      title: "Body and injury details",
      href: "/settings/body",
      rows: [
        ["Bodyweight", o.bodyweightKg ? `${o.bodyweightKg} kg` : "Not given"],
        ["Height", o.heightCm ? `${o.heightCm} cm` : "Not given"],
        ["Sex", o.sex ? (SEX_LABELS[o.sex] ?? o.sex) : "Not given"],
        ["Injuries", o.considerations?.trim() || "None given"],
      ],
    });
  }

  return groups;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
}

function freeEarlyAccess() {
  return {
    title: "Free early access",
    detail:
      "Subscriptions aren't open yet, so everything is free for now. When they open, you'll have at least 7 more days free before you'd need to subscribe.",
    action: "none" as const,
  };
}

/** What to say about someone's subscription, and what they can do about it. */

function billingSummary(billing: Billing | null): {
  title: string;
  detail: string;
  action: "subscribe" | "manage" | "none";
  urgent?: boolean;
} {
  // While payments are paused nobody can be subscribed, so a status that
  // didn't load changes nothing, and a Subscribe button would lead nowhere.
  if (!billing && !PAYMENTS_OPEN) return freeEarlyAccess();
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

  if (!PAYMENTS_OPEN) return freeEarlyAccess();


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

/**
 * Consent to health information can be withdrawn as easily as it was given,
 * as the Privacy Policy promises. Withdrawing deletes the details themselves.
 */
function HealthDetails() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const shared = useAppStore((s) => s.onboarding.healthConsent === true);
  const plan = useAppStore((s) => s.plan);
  const setPlan = useAppStore((s) => s.setPlan);
  const setOnboarding = useAppStore((s) => s.setOnboarding);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function withdraw() {
    if (!user) return;
    setBusy(true);
    setError(null);
    const result = await withdrawHealthConsent(user.id, plan);
    if (result.ok) {
      setOnboarding({ ...CLEARED_HEALTH_FIELDS, healthConsent: false });
      if (result.plan) setPlan(result.plan);
      setConfirming(false);
    } else {
      setError("That didn't save — check your connection and try again.");
    }
    setBusy(false);
  }

  return (
    <>
      <div className="mb-2 text-footnote font-semibold text-muted">Health details</div>
      <div className="mb-6 rounded-[20px] bg-surface shadow-card px-4 py-3.5">
        <div className="text-subhead font-semibold text-ink">{shared ? "Shared with your consent" : "Not shared"}</div>
        <div className="text-footnote leading-relaxed text-muted">
          {shared
            ? "Your bodyweight, height, sex and injury notes are used to tailor your plan."
            : "Your plan doesn't use your bodyweight, height, sex or injury notes."}
        </div>

        {!shared && (
          <button
            onClick={() => router.push("/settings/body")}
            className="mt-3 w-full min-h-[48px] rounded-[12px] border border-line text-subhead font-semibold text-ink"
          >
            Share health details
          </button>
        )}

        {shared && !confirming && (
          <button
            onClick={() => setConfirming(true)}
            className="mt-3 w-full min-h-[48px] rounded-[12px] border border-line text-subhead font-semibold text-ink"
          >
            Stop sharing health details
          </button>
        )}

        {shared && confirming && (
          <div className="mt-3">
            <p className="mb-2.5 text-footnote leading-relaxed text-ink">
              This deletes your bodyweight, height, sex, injury notes and check-in answers, and removes anything your plan
              worked out from them. Your workouts and progress stay.
            </p>
            <div className="flex gap-2">
              <button
                onClick={withdraw}
                disabled={busy}
                className="flex-1 min-h-[48px] rounded-[12px] bg-accent text-body font-semibold text-accent-ink disabled:opacity-60"
              >
                {busy ? "Deleting" : "Delete them"}
              </button>
              <button
                onClick={() => setConfirming(false)}
                disabled={busy}
                className="flex-1 min-h-[48px] rounded-[12px] border border-line text-subhead font-semibold text-ink"
              >
                Keep them
              </button>
            </div>
          </div>
        )}

        {error && <p className="mt-2 text-footnote text-warning">{error}</p>}
      </div>
    </>
  );
}

/** Deleting an account takes typing the word, so it can't happen by a mis-tap. */
function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmed = typed.trim() === "DELETE";

  async function deleteAccount() {
    if (!confirmed) return;
    setBusy(true);
    setError(null);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ confirm: "DELETE" }),
      });
      const data = (await res.json()) as { deleted?: boolean; error?: string };
      if (res.ok && data.deleted) {
        // A full page load, so nothing from the deleted account survives in memory.
        window.location.replace("/account-deleted");
        return;
      }
      setError(data.error ?? "Your account couldn't be deleted. Try again in a moment.");
    } catch {
      setError("Couldn't reach the server — check your connection and try again.");
    }
    setBusy(false);
  }

  return (
    <>
      <div className="mb-2 text-footnote font-semibold text-muted">Delete account</div>
      <div className="mb-6 rounded-[20px] bg-surface shadow-card px-4 py-3.5">
        <div className="text-subhead font-semibold text-ink">Delete your account and data</div>
        <div className="text-footnote leading-relaxed text-muted">
          Permanently removes your account and everything in it, and cancels any subscription.
        </div>

        {!open ? (
          <button
            onClick={() => setOpen(true)}
            className="mt-3 w-full min-h-[48px] rounded-[12px] border border-line text-subhead font-semibold text-warning"
          >
            Delete my account and data
          </button>
        ) : (
          <div className="mt-3">
            <p className="mb-2 text-subhead font-semibold text-ink">This can&apos;t be undone.</p>
            <ul className="mb-3 flex list-disc flex-col gap-1 pl-4 text-footnote leading-relaxed text-ink marker:text-muted">
              <li>Your profile, plan, logged workouts, progress and health details are deleted straight away.</li>
              <li>
                Any subscription is cancelled immediately, so you won&apos;t be charged again. You&apos;ll lose any
                time left in your current billing period.
              </li>
              <li>Stripe keeps a record of past payments, because payment records have to be kept for tax.</li>
            </ul>

            <label htmlFor="confirm-delete" className="mb-1.5 block text-footnote text-muted">
              Type DELETE to confirm
            </label>
            <input
              id="confirm-delete"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              className="mb-3 w-full rounded-[12px] border border-line bg-background px-3 py-2.5 text-subhead"
            />

            <div className="flex gap-2">
              <button
                onClick={deleteAccount}
                disabled={!confirmed || busy}
                className="flex-1 rounded-[12px] bg-warning py-2.5 text-subhead font-semibold text-background disabled:opacity-40"
              >
                {busy ? "Deleting" : "Permanently delete"}
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  setTyped("");
                  setError(null);
                }}
                disabled={busy}
                className="flex-1 min-h-[48px] rounded-[12px] border border-line text-subhead font-semibold text-ink"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && <p className="mt-2 text-footnote text-warning">{error}</p>}
      </div>
    </>
  );
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
      <button
        onClick={() => router.push("/home")}
        className="-ml-1 mb-3 flex min-h-[44px] items-center gap-0.5 text-body text-accent"
      >
        <ChevronLeft size={22} strokeWidth={2.2} /> Home
      </button>
      <h1 className="mb-1 text-largetitle font-bold text-ink">Settings</h1>
      {user?.email && <p className="mb-6 text-subhead text-muted">{user.email}</p>}

      <div className="mb-2 text-footnote font-semibold text-muted">Subscription</div>
      <div className="mb-6 rounded-[20px] bg-surface shadow-card px-4 py-3.5">
        <div className={summary.action === "none" ? "" : "mb-3"}>
          <div className="text-subhead font-semibold text-ink">{summary.title}</div>
          <div className={`text-footnote leading-relaxed ${summary.urgent ? "text-warning" : "text-muted"}`}>
            {summary.detail}
          </div>
        </div>
        {summary.action === "none" ? null : summary.action === "subscribe" ? (
          <button
            onClick={() => router.push("/upgrade")}
            className="w-full min-h-[48px] rounded-[12px] bg-accent text-body font-semibold text-accent-ink"
          >
            Subscribe
          </button>
        ) : (
          <button
            onClick={manageBilling}
            disabled={opening}
            className="w-full min-h-[48px] rounded-[12px] border border-line text-subhead font-semibold text-ink disabled:opacity-60"
          >
            {opening ? "Opening billing" : "Manage billing"}
          </button>
        )}
        {billingError && <p className="mt-2 text-footnote text-warning">{billingError}</p>}
      </div>

      {profileGroups(onboarding).map((group) => (
        <ListSection key={group.href} header={group.title}>
          {group.rows.map(([label, value]) => (
            <ListRow key={label} label={label} value={value} />
          ))}
          <ListLink href={group.href} title={`Change ${group.title.toLowerCase()}`} />
        </ListSection>
      ))}

      <ListSection header="App">
        <ListLink
          onClick={() => router.push("/evidence?from=settings")}
          title="The evidence behind your plan"
          detail="The research your plan and coach are built on, with sources"
        />
      </ListSection>

      <InstallPrompt className="mb-3" showInstalled />
      <InviteFriends className="mb-6" />

      <PasswordSettings />

      <HealthDetails />

      <DeleteAccount />

      <ListSection>
        <ListButton onClick={logOut} destructive>
          Log out
        </ListButton>
      </ListSection>
    </div>
  );
}
