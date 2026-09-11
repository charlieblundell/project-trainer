"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { CLEARED_HEALTH_FIELDS, withdrawHealthConsent } from "@/lib/health-consent";
import { isIos, isRunningInstalled, useInstallStore } from "@/lib/install";
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
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
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

/**
 * Getting the app onto the home screen. Browsers that support a real install
 * prompt get a button; iPhones, which don't, get the two taps it takes.
 * Settings only renders after sign-in has resolved in the browser, so reading
 * window directly in the initial state can't mismatch server HTML.
 */
function InstallApp() {
  const promptEvent = useInstallStore((s) => s.promptEvent);
  const setPromptEvent = useInstallStore((s) => s.setPromptEvent);
  const [installed, setInstalled] = useState(() => isRunningInstalled());
  const [ios] = useState(() => isIos());

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    // A prompt can only be used once, whatever they chose.
    setPromptEvent(null);
    if (choice.outcome === "accepted") setInstalled(true);
  }

  if (installed) {
    return (
      <>
        <div className="mb-2 text-xs font-semibold tracking-widest text-muted">APP</div>
        <div className="mb-6 rounded-2xl border border-line bg-surface px-4 py-3.5">
          <div className="text-sm font-semibold text-ink">Installed</div>
          <div className="text-xs leading-relaxed text-muted">You&apos;re using the app from your home screen.</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-2 text-xs font-semibold tracking-widest text-muted">APP</div>
      <div className="mb-6 rounded-2xl border border-line bg-surface px-4 py-3.5">
        <div className="text-sm font-semibold text-ink">Add it to your home screen</div>
        {promptEvent ? (
          <>
            <div className="text-xs leading-relaxed text-muted">
              Opens full screen like any other app, straight into your plan.
            </div>
            <button
              onClick={install}
              className="mt-3 w-full rounded-xl bg-ink py-2.5 text-sm font-semibold text-background"
            >
              Install the app
            </button>
          </>
        ) : ios ? (
          <div className="text-xs leading-relaxed text-muted">
            In Safari, tap the <span className="font-semibold text-ink">Share</span> button, then{" "}
            <span className="font-semibold text-ink">Add to Home Screen</span>. It opens full screen, straight into
            your plan.
          </div>
        ) : (
          <div className="text-xs leading-relaxed text-muted">
            On your phone, open this site in Chrome or Safari and choose{" "}
            <span className="font-semibold text-ink">Install app</span> or{" "}
            <span className="font-semibold text-ink">Add to Home Screen</span> from the browser menu.
          </div>
        )}
      </div>
    </>
  );
}

/**
 * Consent to health information can be withdrawn as easily as it was given,
 * as the Privacy Policy promises. Withdrawing deletes the details themselves.
 */
function HealthDetails() {
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
      <div className="mb-2 text-xs font-semibold tracking-widest text-muted">HEALTH DETAILS</div>
      <div className="mb-6 rounded-2xl border border-line bg-surface px-4 py-3.5">
        <div className="text-sm font-semibold text-ink">{shared ? "Shared with your consent" : "Not shared"}</div>
        <div className="text-xs leading-relaxed text-muted">
          {shared
            ? "Your bodyweight, height, age, sex and injury notes are used to tailor your plan."
            : "Your plan doesn't use your bodyweight, height, age, sex or injury notes."}
        </div>

        {shared && !confirming && (
          <button
            onClick={() => setConfirming(true)}
            className="mt-3 w-full rounded-xl border border-line py-2.5 text-sm font-semibold text-ink"
          >
            Stop sharing health details
          </button>
        )}

        {shared && confirming && (
          <div className="mt-3">
            <p className="mb-2.5 text-xs leading-relaxed text-ink">
              This deletes your bodyweight, height, age, sex and injury notes, and removes anything your plan
              worked out from them. Your workouts and progress stay.
            </p>
            <div className="flex gap-2">
              <button
                onClick={withdraw}
                disabled={busy}
                className="flex-1 rounded-xl bg-ink py-2.5 text-sm font-semibold text-background disabled:opacity-60"
              >
                {busy ? "Deleting" : "Delete them"}
              </button>
              <button
                onClick={() => setConfirming(false)}
                disabled={busy}
                className="flex-1 rounded-xl border border-line py-2.5 text-sm font-semibold text-ink"
              >
                Keep them
              </button>
            </div>
          </div>
        )}

        {error && <p className="mt-2 text-xs text-warning">{error}</p>}
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
      <div className="mb-2 text-xs font-semibold tracking-widest text-muted">DELETE ACCOUNT</div>
      <div className="mb-6 rounded-2xl border border-line bg-surface px-4 py-3.5">
        <div className="text-sm font-semibold text-ink">Delete your account and data</div>
        <div className="text-xs leading-relaxed text-muted">
          Permanently removes your account and everything in it, and cancels any subscription.
        </div>

        {!open ? (
          <button
            onClick={() => setOpen(true)}
            className="mt-3 w-full rounded-xl border border-line py-2.5 text-sm font-semibold text-warning"
          >
            Delete my account and data
          </button>
        ) : (
          <div className="mt-3">
            <p className="mb-2 text-sm font-semibold text-ink">This can&apos;t be undone.</p>
            <ul className="mb-3 flex list-disc flex-col gap-1 pl-4 text-xs leading-relaxed text-ink marker:text-muted">
              <li>Your profile, plan, logged workouts, progress and health details are deleted straight away.</li>
              <li>
                Any subscription is cancelled immediately, so you won&apos;t be charged again. You&apos;ll lose any
                time left in your current billing period.
              </li>
              <li>Stripe keeps a record of past payments, because payment records have to be kept for tax.</li>
            </ul>

            <label htmlFor="confirm-delete" className="mb-1.5 block text-xs text-muted">
              Type DELETE to confirm
            </label>
            <input
              id="confirm-delete"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              className="mb-3 w-full rounded-xl border border-line bg-background px-3 py-2.5 text-sm"
            />

            <div className="flex gap-2">
              <button
                onClick={deleteAccount}
                disabled={!confirmed || busy}
                className="flex-1 rounded-xl bg-warning py-2.5 text-sm font-semibold text-background disabled:opacity-40"
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
                className="flex-1 rounded-xl border border-line py-2.5 text-sm font-semibold text-ink"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && <p className="mt-2 text-xs text-warning">{error}</p>}
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

      <InstallApp />

      <HealthDetails />

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

      <DeleteAccount />

      <button
        onClick={logOut}
        className="w-full rounded-2xl border border-line py-3.5 text-sm font-semibold text-warning"
      >
        Log out
      </button>
    </div>
  );
}
