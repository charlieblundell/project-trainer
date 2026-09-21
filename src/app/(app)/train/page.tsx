"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Check, Info, MoreHorizontal, Lightbulb } from "lucide-react";
import { EXERCISES_BY_ID, substitutesFor, type Equipment } from "@/lib/exercises";
import { sessionHasSets, sessionStatus, useAppStore } from "@/lib/store";
import { RpeSelector } from "@/components/RpeSelector";
import { SetStepper } from "@/components/SetStepper";
import { clsx } from "@/lib/clsx";
import Link from "next/link";
import { ExerciseInfoModal } from "@/components/ExerciseInfoModal";
import { AskCoachLink } from "@/components/AskCoachLink";
import { ExerciseSwapPanel } from "@/components/ExerciseSwapPanel";
import { WEEKDAY_LABELS, nextSession, sessionById, sessionForToday, targetLabel } from "@/lib/plan/helpers";
import type { PlannedExercise } from "@/lib/plan/types";
import type { SetLog } from "@/lib/types";
import { useAuthStore } from "@/lib/auth";
import { loadHistory } from "@/lib/progress/storage";
import type { WorkoutRecord } from "@/lib/progress/types";
import { adjustForReadiness, isLowReadiness } from "@/lib/plan/readiness";
import { warmUpFor, warmUpProfile } from "@/lib/plan/warmup";
import { CheckIn } from "@/components/CheckIn";
import { WarmUp } from "@/components/WarmUp";
import { DoneForToday } from "@/components/DoneForToday";

export default function Train() {
  const router = useRouter();
  const plan = useAppStore((s) => s.plan);
  const session = useAppStore((s) => s.session);
  const healthConsent = useAppStore((s) => s.onboarding.healthConsent === true);
  const equipment = useAppStore((s) => s.onboarding.equipment) as Equipment[];
  const setReadiness = useAppStore((s) => s.setReadiness);
  const markWarmedUp = useAppStore((s) => s.markWarmedUp);
  const startWorkout = useAppStore((s) => s.startWorkout);
  const resumeWorkout = useAppStore((s) => s.resumeWorkout);
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
    () => (planSession ? warmUpFor(planSession, equipment, warmUpProfile(plan)) : null),
    [planSession, equipment, plan]
  );
  const readiness = session.readiness && session.readiness !== "skipped" ? session.readiness : null;
  const basePlanned = planSession?.exercises[session.exerciseIdx];
  const planned = basePlanned ? adjustForReadiness(basePlanned, readiness) : undefined;
  const atStart = session.exerciseIdx === 0 && Object.keys(session.loggedSets).length === 0;
  // Asked once, before the first set, and only of people who've agreed to
  // share health information.
  const needsCheckIn = healthConsent && !session.readiness && atStart;

  const status = planSession ? sessionStatus(session) : "none";
  // Started on an earlier day and never finished. It doesn't get to stand in
  // the way of today's session, but its sets aren't thrown away either.
  const leftBehindProgress = status === "stale" && !session.finishedAt && sessionHasSets(session);

  if (planSession && plan && status === "finished") {
    return <DoneForToday plan={plan} finished={planSession} loggedSets={session.loggedSets} />;
  }

  // Nothing started, or what's here is from an earlier day. Only today's
  // session can be started; on a rest day this says when the next is.
  if (!planSession || status !== "active") {
    const today = sessionForToday(plan);
    const upcoming = nextSession(plan);
    return (
      <div className="py-16 text-center">
        <p className="mb-4 text-subhead text-muted">
          {today
            ? `Ready when you are. ${today.name} is today.`
            : upcoming
              ? `Rest day. ${upcoming.name} is on ${WEEKDAY_LABELS[upcoming.weekday]}.`
              : "No workout selected."}
        </p>
        {today ? (
          <button
            onClick={() => startWorkout(today.id)}
            className="press min-h-[48px] rounded-[12px] bg-accent px-5 text-body font-semibold text-accent-ink"
          >
            Start {today.name}
          </button>
        ) : upcoming ? (
          <button
            onClick={() => router.push("/home")}
            className="press min-h-[48px] rounded-[12px] bg-surface px-5 text-body font-semibold text-ink shadow-card"
          >
            Back home
          </button>
        ) : (
          <button
            onClick={() => router.push("/plan")}
            className="min-h-[48px] rounded-[12px] bg-accent px-5 text-body font-semibold text-accent-ink"
          >
            Pick one from your plan
          </button>
        )}
        {/* Sets were logged, so let them finish it rather than lose them. */}
        {leftBehindProgress && planSession && (
          <button
            onClick={resumeWorkout}
            className="mx-auto mt-3 block min-h-[44px] px-4 text-subhead font-semibold text-accent"
          >
            Finish {planSession.name} instead
          </button>
        )}
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
        className="-ml-1 mb-2 flex min-h-[44px] items-center gap-0.5 text-body text-accent"
      >
        <ChevronLeft size={22} strokeWidth={2.2} /> {planSession.name}
      </button>

      {/* Where you are in the session, readable at arm's length between sets. */}
      <div className="mb-3">
        <ol className="mb-1.5 flex gap-1" aria-hidden>
          {planSession.exercises.map((_, i) => (
            <li
              key={i}
              className={clsx(
                "h-1.5 flex-1 rounded-full transition-colors",
                i < session.exerciseIdx ? "bg-success" : i === session.exerciseIdx ? "bg-accent" : "bg-fill-strong"
              )}
            />
          ))}
        </ol>
        <div className="tabular text-footnote text-muted">
          Exercise {Math.min(session.exerciseIdx + 1, planSession.exercises.length)} of{" "}
          {planSession.exercises.length}
          {isLowReadiness(readiness) && " · lighter day, one fewer set each"}
        </div>
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
  if (unit === "reps") {
    const added = sets.every((s) => s.w === sets[0].w) && sets[0].w > 0 ? `+${sets[0].w} kg × ` : "";
    return added
      ? `${added}${sets.map((s) => s.r).join(", ")}`
      : `${sets.map((s) => s.r).join(", ")} reps`;
  }
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
  /*
   * A bodyweight movement you can hold a dumbbell for. The weight box is
   * offered but never required: leaving it empty logs a bodyweight set, which
   * is how most people will do most of these.
   */
  const canAddWeight = planned.unit === "reps" && !!def?.loadable;
  const needsCalibration = tracksWeight && planned.targetWeightKg == null;

  // Coming back to an exercise part-way through starts from the weight last
  // used on it, not an empty box.
  const lastLogged = session.loggedSets[activeId]?.at(-1);
  const [input, setInput] = useState({
    w:
      lastLogged && lastLogged.w > 0
        ? String(lastLogged.w)
        : planned.targetWeightKg != null
          ? String(planned.targetWeightKg)
          : "",
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
    // An empty box on a loadable movement means bodyweight, which is a real
    // answer rather than a missing one.
    const addedWeight = canAddWeight && weightValue > 0 ? weightValue : 0;
    const log: SetLog = { w: tracksWeight ? weightValue : addedWeight, r: repsValue };
    logSet(activeId, log);
    if ("vibrate" in navigator) navigator.vibrate(25);
    // No rest after the last set: the effort rating comes next.
    if (logs.length + 1 < planned.sets) startRest();
    else setRestEndsAt(null);
  }

  const isLastExercise = session.exerciseIdx + 1 >= exerciseCount;
  const [confirmFinish, setConfirmFinish] = useState(false);
  const setsSoFar = Object.values(session.loggedSets).reduce((n, l) => n + l.length, 0);

  async function finish() {
    // Wait for the save so a fast navigation can't cut the request short, but
    // never leave "Saving…" on screen if something throws: the workout is
    // already kept on the phone by then.
    setSaving(true);
    try {
      await completeWorkout();
    } catch (e) {
      console.error("Finishing the workout failed:", e);
    }
    router.push("/train/complete");
  }

  function handleSubmitRpe(value: number) {
    submitRpe(activeId, value);
    if (isLastExercise) void finish();
    else nextExercise();
  }

  function handleSkip() {
    if (isLastExercise) {
      if (setsSoFar > 0) void finish();
      else router.push("/home");
      return;
    }
    setRestEndsAt(null);
    nextExercise();
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

      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="tabular text-callout font-semibold text-accent">{targetLabel(planned)}</span>
        {/* Rep and weight targets are what this explains; a timed interval has neither. */}
        {!isTimed && (
          <Link
            href="/plan/why?rule=load-by-goal"
            className="-mr-2 flex min-h-[44px] items-center px-2 text-footnote text-muted"
          >
            Why these numbers?
          </Link>
        )}
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
            <span className="font-semibold">First time on this one.</span> Pick a weight where the
            last two reps are hard but clean. We&apos;ll set your targets from there.
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
                  ? `Set ${i + 1}, done: ${done.w > 0 ? `${tracksWeight ? "" : "plus "}${done.w} kg, ` : ""}${done.r} ${isTimed ? "minutes" : "reps"}`
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
                <motion.span
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  className="flex items-center gap-1"
                >
                  <Check size={13} strokeWidth={3} className="flex-shrink-0 text-success-ink" aria-hidden />
                  <span>
                    {tracksWeight ? `${done.w}×${done.r}` : done.w > 0 ? `+${done.w}×${done.r}` : done.r}
                  </span>
                </motion.span>
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
              {(tracksWeight || canAddWeight) && (
                <SetStepper
                  label={tracksWeight ? "Weight" : "Added weight (optional)"}
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
            <motion.button
              whileTap={canLog ? { scale: 0.98 } : undefined}
              onClick={handleLogSet}
              disabled={!canLog}
              className="min-h-[54px] w-full rounded-[14px] bg-accent text-body font-semibold text-accent-ink disabled:bg-fill-strong disabled:text-faint"
            >
              {tracksWeight && !(weightValue > 0)
                ? "Add a weight to log this set"
                : isTimed
                  ? "Log it"
                  : `Log set ${logs.length + 1} of ${planned.sets}`}
            </motion.button>
          </>
        )
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <RpeSelector
            onSubmit={handleSubmitRpe}
            submitLabel={isLastExercise ? "Finish workout" : "Next exercise"}
          />
        </motion.div>
      )}

      {/*
        A way out that isn't "log every planned set": skip a movement you can't
        do today, or save what's done and call it. Without these a workout only
        ever saved if every set of every exercise was logged.
      */}
      {!saving && (
        <div className="mt-6 flex flex-col items-center gap-1">
          {confirmFinish ? (
            <div role="group" aria-label="Finish workout now" className="w-full rounded-[20px] bg-surface p-4 text-center shadow-card">
              <p className="mb-3 text-subhead text-ink">
                Save {setsSoFar} set{setsSoFar === 1 ? "" : "s"} and finish here?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmFinish(false)}
                  className="press min-h-[48px] flex-1 rounded-[12px] bg-fill text-body font-semibold text-ink"
                >
                  Keep going
                </button>
                <button
                  onClick={() => void finish()}
                  className="press min-h-[48px] flex-1 rounded-[12px] bg-accent text-body font-semibold text-accent-ink"
                >
                  Save and finish
                </button>
              </div>
            </div>
          ) : (
            <>
              {!awaitingRpe && (
                <button
                  onClick={handleSkip}
                  className="min-h-[44px] px-4 text-subhead text-accent"
                >
                  {isLastExercise
                    ? setsSoFar > 0
                      ? "Skip this and finish workout"
                      : "Skip this exercise"
                    : "Skip this exercise"}
                </button>
              )}
              {setsSoFar > 0 && !isLastExercise && (
                <button
                  onClick={() => setConfirmFinish(true)}
                  className="min-h-[44px] px-4 text-subhead text-muted"
                >
                  Finish workout now
                </button>
              )}
              {/* The workout is kept while they ask, and carries on from here. */}
              <AskCoachLink
                className="px-4"
                label="Something not right? Ask the coach"
                question={`${def?.name ?? "This exercise"} doesn't feel right today. What should I change?`}
              />
            </>
          )}
        </div>
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
