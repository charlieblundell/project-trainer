"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { GENERATING_STEPS } from "@/lib/data";
import { useAppStore } from "@/lib/store";
import { LogoMark } from "@/components/Wordmark";
import { supabase } from "@/lib/supabase";
import { generatePlan } from "@/lib/plan/generate";
import { savePlan } from "@/lib/plan/storage";
import { track } from "@/lib/analytics";
import { saveSetupProfile } from "@/lib/setup";
import { signedInUser } from "@/lib/session";
import { InstallPrompt } from "@/components/InstallPrompt";
import { BuiltOnResearch } from "@/components/BuiltOnResearch";
import {
  WEEKDAY_LABELS,
  WEEKDAY_ORDER,
  exerciseName,
  nextSession,
  sessionForToday,
  targetLabel,
} from "@/lib/plan/helpers";
import {
  BILLING_COLUMNS,
  billingFromRow,
  PAYMENTS_OPEN,
  inTrial,
  isSubscribed,
  trialDaysLeft,
  type BillingRow,
} from "@/lib/billing/entitlement";
import type { Plan } from "@/lib/plan/types";

type SaveState =
  | { kind: "saving" }
  | { kind: "saved"; plan: Plan; trialDays: number | null }
  | { kind: "error" };

const STEP_MS = 550;

export default function Generating() {
  const router = useRouter();
  const onboarding = useAppStore((s) => s.onboarding);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const setPlan = useAppStore((s) => s.setPlan);
  const startWorkout = useAppStore((s) => s.startWorkout);
  const [genStep, setGenStep] = useState(0);
  const [save, setSave] = useState<SaveState>({ kind: "saving" });
  const started = useRef(false);

  /**
   * The plan is built and saved while the progress steps play, so what's
   * revealed at the end is the real, saved plan — not a promise of one.
   */
  const buildAndSave = useCallback(async () => {
    setSave({ kind: "saving" });
    try {
      const signedIn = await signedInUser();
      if (!signedIn) {
        router.replace("/signup");
        return;
      }

      // Health details are only stored, or used for the plan, with consent.
      const consented = onboarding.healthConsent === true;
      await saveSetupProfile(signedIn.id, onboarding);

      const plan = generatePlan({
        goal: onboarding.goal,
        experience: onboarding.experience,
        days: onboarding.days,
        length: onboarding.length,
        equipment: onboarding.equipment,
        likedExercises: onboarding.likedExercises,
        dislikedExercises: onboarding.dislikedExercises,
        trainingDays: onboarding.trainingDays,
        considerations: consented ? onboarding.considerations : null,
        age: consented ? onboarding.age : null,
      });
      await savePlan(signedIn.id, plan);
      track("plan_built", { from: "generating" });
      setPlan(plan);
      completeOnboarding();

      const { data: billingRow } = await supabase
        .from("billing")
        .select(BILLING_COLUMNS)
        .eq("user_id", signedIn.id)
        .maybeSingle();
      const billing = billingRow ? billingFromRow(billingRow as BillingRow) : null;
      // No trial countdown while payments are paused: nothing ends yet.
      const trialDays =
        PAYMENTS_OPEN && billing && !isSubscribed(billing) && inTrial(billing) ? trialDaysLeft(billing) : null;

      setSave({ kind: "saved", plan, trialDays });
    } catch (err) {
      console.error("Failed to build plan:", err);
      setSave({ kind: "error" });
    }
  }, [onboarding, router, setPlan, completeOnboarding]);

  useEffect(() => {
    // Effects run twice in development; saving twice would store two plans.
    if (started.current) return;
    started.current = true;
    buildAndSave();
  }, [buildAndSave]);

  useEffect(() => {
    const id = setInterval(() => {
      setGenStep((s) => {
        if (s >= GENERATING_STEPS.length) {
          clearInterval(id);
          return s;
        }
        return s + 1;
      });
    }, STEP_MS);
    return () => clearInterval(id);
  }, []);

  const animationDone = genStep >= GENERATING_STEPS.length;

  if (animationDone && save.kind === "error") {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-10">
        <h1 className="mb-2 text-title1 font-bold text-ink">Your plan didn&apos;t save.</h1>
        <p className="mb-6 text-subhead leading-relaxed text-muted">
          Your answers are still here. It&apos;s usually a dropped connection — check you&apos;re online and try
          again.
        </p>
        <button
          onClick={buildAndSave}
          className="min-h-[54px] w-full rounded-[14px] bg-accent text-body font-semibold text-accent-ink"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!animationDone || save.kind !== "saved") {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-10">
        <div className="relative mx-auto mb-10 flex h-20 w-20 items-center justify-center">
          <motion.div className="absolute inset-0 rounded-full" style={{ border: "2px solid var(--accent-soft)" }} />
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: "2px solid transparent", borderTopColor: "var(--accent)" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
          />
          <LogoMark size={40} />
        </div>
        <h1 className="mb-8 text-center text-title1 font-bold text-ink">Building your plan.</h1>
        <div className="flex flex-col gap-4">
          {GENERATING_STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-3" style={{ opacity: i <= genStep ? 1 : 0.35 }}>
              <div
                className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border"
                style={{
                  borderColor: i < genStep ? "var(--success)" : "var(--line)",
                  background: i < genStep ? "var(--success)" : "transparent",
                }}
              >
                {i < genStep && <Check size={12} className="text-white" />}
              </div>
              <span className={`text-subhead ${i < genStep ? "text-ink" : "text-muted"}`}>
                {label}
                {i === genStep ? "..." : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <PlanReveal
      plan={save.plan}
      trialDays={save.trialDays}
      onStart={(sessionId) => {
        startWorkout(sessionId);
        router.push("/train");
      }}
      onHome={() => router.push("/home")}
    />
  );
}

function PlanReveal({
  plan,
  trialDays,
  onStart,
  onHome,
}: {
  plan: Plan;
  trialDays: number | null;
  onStart: (sessionId: string) => void;
  onHome: () => void;
}) {
  const today = sessionForToday(plan);
  const first = today ?? nextSession(plan);
  const averageMinutes = plan.sessions.length
    ? Math.round(plan.sessions.reduce((sum, s) => sum + s.estMinutes, 0) / plan.sessions.length)
    : 0;
  const lifts = plan.sessions.some((s) => s.exercises.some((e) => e.unit === "weight_reps"));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-md px-6 pb-16 pt-10"
    >
      <div className="mb-1 text-footnote font-semibold text-accent">Your plan is ready</div>
      <h1 className="mb-2 text-3xl font-bold leading-tight text-ink">Here&apos;s your week.</h1>
      <p className="tabular mb-7 text-subhead text-muted">
        {plan.goal} · {plan.sessions.length} session{plan.sessions.length === 1 ? "" : "s"} a week · about{" "}
        {averageMinutes} min each
      </p>

      <ol className="mb-8 overflow-hidden rounded-[20px] bg-surface shadow-card">
        {WEEKDAY_ORDER.map((day) => {
          const session = plan.sessions.find((s) => s.weekday === day);
          const isFirst = !!session && session.id === first?.id;
          return (
            <li
              key={day}
              className="flex items-center justify-between gap-4 border-b border-line px-4 py-3 last:border-b-0"
            >
              <span className={`w-24 text-subhead ${session ? "text-ink" : "text-muted"}`}>{WEEKDAY_LABELS[day]}</span>
              <span className={`flex-1 text-subhead ${session ? "font-semibold text-ink" : "text-muted"}`}>
                {session ? session.name : "Rest"}
                {isFirst && <span className="ml-2 text-footnote font-semibold text-accent">First</span>}
              </span>
              {session && <span className="tabular text-footnote text-muted">~{session.estMinutes} min</span>}
            </li>
          );
        })}
      </ol>

      <BuiltOnResearch plan={plan} className="mb-8" />

      {first && (
        <section className="mb-8">
          <div className="mb-2 text-footnote font-semibold text-muted">
            Your first session · {today ? "today" : WEEKDAY_LABELS[first.weekday]}
          </div>
          <div className="rounded-[20px] bg-surface shadow-card p-5">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="text-title2 font-bold text-ink">{first.name}</h2>
              <span className="tabular text-subhead text-muted">~{first.estMinutes} min</span>
            </div>
            <ul className="flex flex-col">
              {first.exercises.map((ex, i) => (
                <li
                  key={`${ex.exerciseId}-${i}`}
                  className="flex items-center justify-between gap-4 border-t border-line py-2.5 first:border-t-0"
                >
                  <span className="text-subhead text-ink">{exerciseName(ex)}</span>
                  <span className="tabular flex-shrink-0 text-footnote text-muted">{targetLabel(ex)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="mb-8">
        <div className="mb-3 text-footnote font-semibold text-muted">How your first week works</div>
        <div className="flex flex-col gap-4 text-subhead leading-relaxed">
          {lifts && (
            <p>
              <span className="font-semibold text-ink">Find your starting weights. </span>
              <span className="text-muted">
                The app doesn&apos;t know how strong you are yet. On each exercise, work up to a weight where the last
                two reps are hard but your form holds, and log it. That becomes your starting target.
              </span>
            </p>
          )}
          <p>
            <span className="font-semibold text-ink">Rate how hard it felt. </span>
            <span className="text-muted">
              After the last set of each exercise you&apos;ll rate the effort. It&apos;s how the app tells
              &ldquo;easy&rdquo; from &ldquo;barely made it&rdquo; — and decides whether your target goes up next time.
            </span>
          </p>
          <p>
            <span className="font-semibold text-ink">It keeps adjusting. </span>
            <span className="text-muted">
              Every session you log moves your next targets: up when you&apos;ve earned it, held when you haven&apos;t.
              Stuck or unsure? Ask your coach.
            </span>
          </p>
        </div>
      </section>

      {plan.notes.length > 0 && (
        <section className="mb-8 rounded-[20px] bg-accent-soft p-4">
          <div className="mb-2 text-footnote font-semibold text-accent">What your plan works around</div>
          <ul className="flex flex-col gap-1.5">
            {plan.notes.map((note) => (
              <li key={note} className="text-subhead leading-relaxed text-ink">
                {note}
              </li>
            ))}
          </ul>
        </section>
      )}

      <InstallPrompt className="mb-6" mobileOnly />

      {trialDays !== null && (
        <p className="mb-4 text-center text-subhead text-muted">
          Your free trial has started — {trialDays} day{trialDays === 1 ? "" : "s"}, no card needed.
        </p>
      )}

      {first ? (
        <button
          onClick={() => onStart(first.id)}
          className="mb-2.5 min-h-[54px] w-full rounded-[14px] bg-accent text-body font-semibold text-accent-ink"
        >
          {today ? "Start today's session" : `Start ${first.name} now`}
        </button>
      ) : null}
      <button onClick={onHome} className="w-full py-3 text-subhead font-semibold text-muted hover:text-ink">
        {first && !today ? `Save it for ${WEEKDAY_LABELS[first.weekday]} — go to home` : "Go to home"}
      </button>
    </motion.div>
  );
}
