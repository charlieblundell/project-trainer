"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth";
import { useAppStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { loadPlan } from "@/lib/plan/storage";
import { BILLING_COLUMNS, billingFromRow, hasAccess, type BillingRow } from "@/lib/billing/entitlement";
import {
  CLEARED_HEALTH_FIELDS,
  grantHealthConsent,
  hasHealthDetails,
  withdrawHealthConsent,
} from "@/lib/health-consent";
import { LogoMark } from "@/components/Wordmark";
import { HealthConsentPrompt } from "@/components/HealthConsentPrompt";

/**
 * Pages someone whose trial has ended can still reach: the way to pay, the
 * way back from paying, their settings (to log out or manage billing), and
 * the evidence library, which is reference rather than product.
 */
const OPEN_WHEN_LOCKED = ["/upgrade", "/billing", "/settings", "/evidence"];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);
  const setOnboarding = useAppStore((s) => s.setOnboarding);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const claimForUser = useAppStore((s) => s.claimForUser);
  const setPlan = useAppStore((s) => s.setPlan);
  const setSessionsLogged = useAppStore((s) => s.setSessionsLogged);
  const billing = useAppStore((s) => s.billing);
  const setBilling = useAppStore((s) => s.setBilling);
  const [profileSynced, setProfileSynced] = useState(false);
  const [billingChecked, setBillingChecked] = useState(false);
  const [needsHealthConsent, setNeedsHealthConsent] = useState(false);
  const [consentBusy, setConsentBusy] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const syncedForUser = useRef<string | null>(null);

  useEffect(() => {
    if (!initialized) return;
    if (!user) {
      router.replace("/signup");
      return;
    }
    if (syncedForUser.current === user.id) return;
    syncedForUser.current = user.id;
    claimForUser(user.id);

    loadPlan(user.id).then(setPlan);

    // The workouts table is the record of what they've actually done, so the
    // running total is read from it rather than kept on the plan.
    supabase
      .from("workout_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .then(({ count }) => setSessionsLogged(count ?? 0));

    supabase
      .from("billing")
      .select(BILLING_COLUMNS)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        // If billing can't be read, the app stays open rather than locking out
        // someone who may well have paid. The coach, which is what costs
        // money, is still enforced on the server either way.
        setBilling(data && !error ? billingFromRow(data as BillingRow) : null);
        setBillingChecked(true);
      });

    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        const hasHealth = !!data && hasHealthDetails(data);
        const consented = !!data?.health_consent_at;

        if (data?.goal) {
          setOnboarding({
            goal: data.goal,
            experience: data.experience,
            days: data.days,
            length: data.length,
            environment: data.environment,
            equipment: data.equipment ?? [],
            likedExercises: data.liked_exercises ?? [],
            dislikedExercises: data.disliked_exercises ?? [],
            trainingDays: data.training_days ?? [],
            bodyweightKg: data.bodyweight_kg,
            age: data.age,
            heightCm: data.height_cm,
            sex: data.sex,
            considerations: data.considerations,
            healthConsent: consented ? true : hasHealth ? null : false,
          });
          completeOnboarding();
        }

        // Details given before the app asked for consent can't keep being
        // used without it, so anyone in that position is asked once.
        setNeedsHealthConsent(hasHealth && !consented);
        setProfileSynced(true);
      });
  }, [
    initialized,
    user,
    router,
    setOnboarding,
    completeOnboarding,
    claimForUser,
    setPlan,
    setSessionsLogged,
    setBilling,
  ]);

  const locked = billingChecked && billing !== null && !hasAccess(billing);
  const pageIsOpen = OPEN_WHEN_LOCKED.some((path) => pathname.startsWith(path));

  useEffect(() => {
    if (locked && !pageIsOpen) router.replace("/upgrade");
  }, [locked, pageIsOpen, router]);

  async function agreeToHealthConsent() {
    if (!user) return;
    setConsentBusy(true);
    setConsentError(null);
    if (await grantHealthConsent(user.id)) {
      setOnboarding({ healthConsent: true });
      setNeedsHealthConsent(false);
    } else {
      setConsentError("That didn't save — check your connection and try again.");
    }
    setConsentBusy(false);
  }

  async function declineHealthConsent() {
    if (!user) return;
    setConsentBusy(true);
    setConsentError(null);
    const result = await withdrawHealthConsent(user.id, useAppStore.getState().plan);
    if (result.ok) {
      setOnboarding({ ...CLEARED_HEALTH_FIELDS, healthConsent: false });
      if (result.plan) setPlan(result.plan);
      setNeedsHealthConsent(false);
    } else {
      setConsentError("That didn't save — check your connection and try again.");
    }
    setConsentBusy(false);
  }

  if (!initialized || !user || !profileSynced || !billingChecked || (locked && !pageIsOpen)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LogoMark size={36} />
      </div>
    );
  }

  if (needsHealthConsent) {
    return (
      <HealthConsentPrompt
        busy={consentBusy}
        error={consentError}
        onAgree={agreeToHealthConsent}
        onDecline={declineHealthConsent}
      />
    );
  }

  return <>{children}</>;
}
