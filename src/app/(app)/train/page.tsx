"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Check, Info, MoreHorizontal, Lightbulb } from "lucide-react";
import { EXERCISES_BY_ID, substitutesFor, type Equipment } from "@/lib/exercises";
import { useAppStore } from "@/lib/store";
import { RpeSelector } from "@/components/RpeSelector";
import { SetStepper } from "@/components/SetStepper";
import { clsx } from "@/lib/clsx";
import { ExerciseInfoModal } from "@/components/ExerciseInfoModal";
import { ExerciseSwapPanel } from "@/components/ExerciseSwapPanel";
import { sessionById, targetLabel } from "@/lib/plan/helpers";
import type { PlannedExercise } from "@/lib/plan/types";
import type { SetLog } from "@/lib/types";
import { useAuthStore } from "@/lib/auth";
import { loadHistory } from "@/lib/progress/storage";
import type { WorkoutRecord } from "@/lib/progress/types";
import { adjustForReadiness, isLowReadiness } from "@/lib/plan/readiness";
import { warmUpFor } from "@/lib/plan/warmup";
import { CheckIn } from "@/components/CheckIn";
import { WarmUp } from "@/components/WarmUp";

export default function Train() {
  const router = useRouter();
  const plan = useAppStore((s) => s.plan);
  const session = useAppStore((s) => s.session);
  const healthConsent = useAppStore((s) => s.onboarding.healthConsent === true);
  const equipment = useAppStore((s) => s.onboarding.equipment) as Equipment[];
  const setReadiness = useAppStore((s) => s.setReadiness);
  const markWarmedUp = useAppStore((s) => s.markWarmedUp);
  const user = useAuthStore((s) => s.user);
  const [history, setHistory] = useState<WorkoutRecord[] | null>(null);

  useEffect(() => {
    if (user) loadHistory(user.id).then(setHistory);
  }, [user]);

  /** The most recent logged sets for each exercise — history arrives oldest first. */
  const lastByExercise = useMemo(() => {
    const latest: Record<string, SetLog[]> = {};
    for (const record of history ?? []) {
      for (const [exerciseId, sets] of Object.entries(record.loggedSets)) {
        if (sets.length > 0) latest[exerciseId] = sets;
      }
    }
    return latest;
  }, [history]);

  // Phones lock between sets, which means unlocking with chalky hands to log
  // anything. Keep the screen on while a workout is open, where supported.
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const request = async () => {
      try {
        if ("wakeLock" in navigator) lock = await navigator.wakeLock.request("screen");
      } catch {
        // Denied or unsupported — the workout works the same without it.
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") request();
    };
    request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release().catch(() => {});
    };
  }, []);

  const planSession = sessionById(plan, session.workoutId);
  const warmUp = useMemo(
    () => (planSession ? warmUpFor(planSession, equipment) : null),
    [planSession, equipment]
  );
  const readiness = session.readiness && session.readiness !== "skipped" ? session.readiness : null;
  const basePlanned = planSession?.exercises[session.exerciseIdx];
  const planned = basePlanned ? adjustForReadiness(basePlanned, readiness) : undefined;
  const atStart = session.exerciseIdx === 0 && Object.keys(session.loggedSets).length === 0;
  // Asked once, before the first set, and only of people who've agreed to
  // share health information.
  const needsCheckIn = healthConsent && !session.readiness && atStart;

  if (!planSession) {
    return (
      <div className="py-16 text-center">
        <p className="mb-4 text-subhead text-muted">No workout selected.</p>
        <button
          onClick={() => router.push("/plan")}
          className="rounded-[20px] bg-ink px-5 py-3 text-subhead font-semibold text-background"
        >
          Pick one from your plan
        </button>
      </div>
    );
  }

  if (needsCheckIn) {
    return <CheckIn sessionName={planSession.name} onDone={setReadiness} />;
  }

  // After the check-in, before the first set, and only if there's anything to show.
  if (atStart && !session.warmedUp && warmUp && warmUp.moves.length > 0) {
    return <WarmUp sessionName={planSession.name} warmUp={warmUp} onDone={markWarmedUp} />;
  }

  return (
    <div className="relative">
      <button
        onClick={() => router.push("/home")}
        className="mb-4 flex items-center gap-1 text-subhead text-muted"
      >
        <ChevronLeft size={18} /> {planSession.name}
      </button>

      <div className="mb-1 text-footnote text-muted">
        {Math.min(session.exerciseIdx + 1, planSession.exercises.length)} /{" "}
        {planSession.exercises.length} exercises
        {isLowReadiness(readiness) && " · lighter day: one fewer set each, from your check-in"}
      </div>

      {planned ? (
        <ExercisePanel
          key={`${session.workoutId}:${session.exerciseIdx}`}
          planned={planned}
          exerciseCount={planSession.exercises.length}
          lastByExercise={lastByExercise}
        />
      ) : (
        <div className="py-16 text-center text-subhead text-muted">
          Nothing left in this session.{" "}
          <button className="underline" onClick={() => router.push("/home")}>
            Back home
          </button>
        </div>
      )}
    </div>
  );
}

/** "50 kg × 10, 10, 9", "12, 11, 10 reps" or "20 min" — however the exercise is measured. */
function describeSets(sets: SetLog[], unit: PlannedExercise["unit"]): string {
  if (unit === "time" || unit === "distance") return `${Math.max(...sets.map((s) => s.r))} min`;
  if (unit === "reps") return `${sets.map((s) => s.r).join(", ")} reps`;
  const sameWeight = sets.every((s) => s.w === sets[0].w);
  return sameWeight
    ? `${sets[0].w} kg × ${sets.map((s) => s.r).join(", ")}`
    : sets.map((s) => `${s.w} kg × ${s.r}`).join(", ");
}

function formatRest(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function ExercisePanel({
  planned,
  exerciseCount,
  lastByExercise,
}: {
  planned: PlannedExercise;
  exerciseCount: number;
  lastByExercise: Record<string, SetLog[]>;
}) {
  const router = useRouter();
  const session = useAppStore((s) => s.session);
  const onboarding = useAppStore((s) => s.onboarding);
  const logSet = useAppStore((s) => s.logSet);
  const submitRpe = useAppStore((s) => s.submitRpe);
  const nextExercise = useAppStore((s) => s.nextExercise);
  const swapExercise = useAppStore((s) => s.swapExercise);
  const completeWorkout = useAppStore((s) => s.completeWorkout);

  const override = session.overrides[planned.exerciseId];
  const activeId = override?.exerciseId ?? planned.exerciseId;
  const def = EXERCISES_BY_ID[activeId];

  const isTimed = planned.unit === "time" || planned.unit === "distance";
  const tracksWeight = planned.unit === "weight_reps";
  const needsCalibration = tracksWeight && planned.targetWeightKg == null;

  const [input, setInput] = useState({
    w: planned.targetWeightKg != null ? String(planned.targetWeightKg) : "",
    r: isTimed ? String(Math.round((planned.seconds ?? 0) / 60)) : String(planned.repMax ?? 10),
  });
  const [showInfo, setShowInfo] = useState(false);
  const [showSwap, setShowSwap] = useState(false);

  // Sets and effort are recorded against the exercise actually performed. If
  // it was swapped, the planned exercise gets no sets today, so its targets
  // hold rather than moving off a different movement's numbers.
  const logs = session.loggedSets[activeId] ?? [];
  const awaitingRpe = logs.length >= planned.sets && session.rpeValues[activeId] === undefined;
  const [saving, setSaving] = useState(false);
  const lastSets = lastByExercise[activeId];

  // The rest timer counts down to a timestamp rather than ticking a number,
  // so it stays right when the phone locks or the browser throttles the tab.
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const buzzed = useRef(false);

  useEffect(() => {
    if (restEndsAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [restEndsAt]);

  const restLeft = restEndsAt === null ? 0 : Math.max(0, Math.ceil((restEndsAt - now) / 1000));
  const restDone = restEndsAt !== null && now > 0 && restLeft === 0;

  useEffect(() => {
    if (restDone && !buzzed.current) {
      buzzed.current = true;
      if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
    }
  }, [restDone]);

  function startRest() {
    if (planned.restSeconds <= 0) return;
    const t = Date.now();
    buzzed.current = false;
    setNow(t);
    setRestEndsAt(t + planned.restSeconds * 1000);
  }

  function addRest(seconds: number) {
    const t = Date.now();
    setRestEndsAt((ends) => Math.max(ends ?? t, t) + seconds * 1000);
  }

  const alternatives = substitutesFor(activeId, onboarding.equipment as Equipment[]).slice(0, 4);

  const weightValue = parseFloat(input.w);
  const repsValue = parseInt(input.r, 10);
  // An empty weight box used to log 0 kg, which then became the target.
  const canLog = repsValue > 0 && (!tracksWeight || weightValue > 0);

  function handleLogSet() {
    if (!canLog) return;
    const log: SetLog = { w: tracksWeight ? weightValue : 0, r: repsValue };
    logSet(activeId, log);
    // No rest after the last set: the effort rating comes next.
    if (logs.length + 1 < planned.sets) startRest();
    else setRestEndsAt(null);
  }

  async function handleSubmitRpe(value: number) {
    submitRpe(activeId, value);
    if (session.exerciseIdx + 1 < exerciseCount) {
      nextExercise();
      return;
    }
    // Wait for the save so a fast navigation can't cut the request short.
    setSaving(true);
    await completeWorkout();
    router.push("/train/complete");
  }

  return (
    <div>
      <div className="mb-1 flex items-start justify-between gap-3">
        <h1 className="text-largetitle font-bold text-ink">{def?.name ?? activeId}</h1>
        <div className="flex flex-shrink-0 gap-1.5">
          {def?.cues && (
            <button
              onClick={() => setShowInfo(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-fill text-ink"
              aria-label="Exercise info"
            >
              <Info size={18} strokeWidth={1.9} />
            </button>
          )}
          {alternatives.length > 0 && (
            <button
              onClick={() => setShowSwap(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-fill text-ink"
              aria-label="Swap exercise"
            >
              <MoreHorizontal size={18} strokeWidth={1.9} />
            </button>
          )}
        </div>
      </div>

      <div className="tabular mb-1 text-[15px] font-semibold text-accent">
        {targetLabel(planned)}
      </div>
      {override && <div className="mb-4 text-footnote font-semibold text-success">Swapped in for today</div>}
      {lastSets && lastSets.length > 0 ? (
        <div className="tabular mb-4 text-footnote text-muted">Last time: {describeSets(lastSets, planned.unit)}</div>
      ) : (
        !override && <div className="mb-4" />
      )}

      {needsCalibration && logs.length === 0 && (
        <div className="mb-5 flex gap-2.5 rounded-[20px] bg-accent-soft p-4">
          <Lightbulb size={16} className="mt-0.5 flex-shrink-0 text-accent" />
          <p className="text-subhead leading-relaxed text-ink">
            First time on this one. Work up to a weight where the last two reps are hard but your
            form holds, then log what you did — we&apos;ll take it from there.
          </p>
        </div>
      )}

      {/*
        Every set in the exercise at a glance: what's done, with the numbers,
        and what's left. The old four-row table spent most of the screen
        showing em-dashes for sets nobody had done yet.
      */}
      <ol className="mb-5 flex flex-wrap gap-1.5">
        {Array.from({ length: planned.sets }).map((_, i) => {
          const done = logs[i];
          const current = !done && i === logs.length;
          return (
            <li
              key={i}
              aria-label={
                done
                  ? `Set ${i + 1}, done: ${tracksWeight ? `${done.w} kg, ` : ""}${done.r} ${isTimed ? "minutes" : "reps"}`
                  : `Set ${i + 1}, not done yet`
              }
              className={clsx(
                "tabular flex min-h-[38px] flex-1 basis-[70px] items-center justify-center gap-1 rounded-[12px] px-2 text-footnote font-semibold",
                done
                  ? "bg-success-soft text-ink"
                  : current
                    ? "bg-accent-soft text-accent"
                    : "bg-fill text-faint"
              )}
            >
              {done ? (
                <>
                  <Check size={13} className="flex-shrink-0 text-success" aria-hidden />
                  <span>
                    {tracksWeight ? `${done.w}×${done.r}` : done.r}
                  </span>
                </>
              ) : (
                <span>{i + 1}</span>
              )}
            </li>
          );
        })}
      </ol>

      {restEndsAt !== null && logs.length < planned.sets && !saving && (
        <div
          role="timer"
          className={clsx(
            "mb-4 rounded-[20px] px-4 py-4 transition-colors",
            restDone ? "bg-success-soft" : "bg-surface"
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div
                className={clsx(
                  "text-footnote font-semibold",
                  restDone ? "text-success" : "text-muted"
                )}
              >
                {restDone ? "Rest done" : "Resting"}
              </div>
              <div className="tabular text-largetitle font-bold text-ink">
                {restDone ? "Go" : formatRest(restLeft)}
              </div>
            </div>
            <div className="flex gap-2">
              {!restDone && (
                <button
                  onClick={() => addRest(30)}
                  className="min-h-[44px] rounded-[12px] bg-fill px-4 text-subhead font-semibold text-ink"
                >
                  +30s
                </button>
              )}
              <button
                onClick={() => setRestEndsAt(null)}
                className="min-h-[44px] rounded-[12px] bg-fill px-4 text-subhead font-semibold text-ink"
              >
                {restDone ? "Dismiss" : "Skip"}
              </button>
            </div>
          </div>

          {/* How much is left, without having to read the numbers. */}
          {!restDone && (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-fill">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-300 ease-linear"
                style={{
                  width: `${Math.max(0, Math.min(100, (restLeft / Math.max(1, planned.restSeconds)) * 100))}%`,
                }}
              />
            </div>
          )}

          <span className="sr-only" aria-live="polite">
            {restDone ? "Rest finished. Time for your next set." : ""}
          </span>
        </div>
      )}

      {saving ? (
        <p className="py-6 text-center text-subhead text-muted">Saving your workout…</p>
      ) : !awaitingRpe ? (
        logs.length < planned.sets && (
          <>
            <div className="mb-4 flex flex-col gap-3">
              {tracksWeight && (
                <SetStepper
                  label="Weight"
                  suffix="kg"
                  value={input.w}
                  onChange={(w) => setInput({ ...input, w })}
                  step={2.5}
                  max={500}
                />
              )}
              <SetStepper
                label={isTimed ? "Minutes" : "Reps"}
                value={input.r}
                onChange={(r) => setInput({ ...input, r })}
                step={1}
                min={1}
                max={isTimed ? 120 : 50}
              />
            </div>
            {tracksWeight && !(weightValue > 0) && (
              <p className="mb-2.5 text-footnote text-muted">Enter the weight you used to log this set.</p>
            )}
            <motion.button
              whileTap={canLog ? { scale: 0.98 } : undefined}
              onClick={handleLogSet}
              disabled={!canLog}
              className="min-h-[54px] w-full rounded-[14px] bg-accent text-body font-semibold text-accent-ink disabled:bg-fill-strong disabled:text-faint"
            >
              {isTimed ? "Log it" : "Log set"}
            </motion.button>
          </>
        )
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <RpeSelector onSubmit={handleSubmitRpe} />
        </motion.div>
      )}

      <AnimatePresence>
        {showInfo && def && (
          <ExerciseInfoModal
            exercise={{
              name: def.name,
              muscles: def.muscles,
              tips: def.cues ?? [],
            }}
            onClose={() => setShowInfo(false)}
          />
        )}
        {showSwap && (
          <ExerciseSwapPanel
            exerciseName={def?.name ?? activeId}
            alternatives={alternatives.map((a) => ({ id: a.id, name: a.name, muscles: a.muscles }))}
            onClose={() => setShowSwap(false)}
            onSwap={(alt) => {
              swapExercise(planned.exerciseId, { exerciseId: alt.id });
              setShowSwap(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
