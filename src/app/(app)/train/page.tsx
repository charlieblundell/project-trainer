"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Check, Info, MoreHorizontal, Lightbulb } from "lucide-react";
import { EXERCISES_BY_ID, substitutesFor, type Equipment } from "@/lib/exercises";
import { useAppStore } from "@/lib/store";
import { RpeSelector } from "@/components/RpeSelector";
import { ExerciseInfoModal } from "@/components/ExerciseInfoModal";
import { ExerciseSwapPanel } from "@/components/ExerciseSwapPanel";
import { sessionById, targetLabel } from "@/lib/plan/helpers";
import type { PlannedExercise } from "@/lib/plan/types";
import type { SetLog } from "@/lib/types";

export default function Train() {
  const router = useRouter();
  const plan = useAppStore((s) => s.plan);
  const session = useAppStore((s) => s.session);

  const planSession = sessionById(plan, session.workoutId);
  const planned = planSession?.exercises[session.exerciseIdx];

  if (!planSession) {
    return (
      <div className="py-16 text-center">
        <p className="mb-4 text-sm text-muted">No workout selected.</p>
        <button
          onClick={() => router.push("/plan")}
          className="rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-background"
        >
          Pick one from your plan
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => router.push("/home")}
        className="mb-4 flex items-center gap-1 text-sm text-muted"
      >
        <ChevronLeft size={18} /> {planSession.name}
      </button>

      <div className="mb-1 text-xs text-muted">
        {Math.min(session.exerciseIdx + 1, planSession.exercises.length)} /{" "}
        {planSession.exercises.length} exercises
      </div>

      {planned ? (
        <ExercisePanel
          key={`${session.workoutId}:${session.exerciseIdx}`}
          planned={planned}
          exerciseCount={planSession.exercises.length}
        />
      ) : (
        <div className="py-16 text-center text-sm text-muted">
          Nothing left in this session.{" "}
          <button className="underline" onClick={() => router.push("/home")}>
            Back home
          </button>
        </div>
      )}
    </div>
  );
}

function ExercisePanel({
  planned,
  exerciseCount,
}: {
  planned: PlannedExercise;
  exerciseCount: number;
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

  const logs = session.loggedSets[planned.exerciseId] ?? [];
  const awaitingRpe =
    logs.length >= planned.sets && session.rpeValues[planned.exerciseId] === undefined;

  const alternatives = substitutesFor(activeId, onboarding.equipment as Equipment[]).slice(0, 4);

  function handleLogSet() {
    const log: SetLog = {
      w: parseFloat(input.w) || 0,
      r: parseInt(input.r, 10) || 0,
    };
    logSet(planned.exerciseId, log);
  }

  async function handleSubmitRpe(value: number) {
    submitRpe(planned.exerciseId, value);
    if (session.exerciseIdx + 1 < exerciseCount) {
      nextExercise();
      return;
    }
    // Wait for the save so a fast navigation can't cut the request short.
    await completeWorkout();
    router.push("/train/complete");
  }

  return (
    <div>
      <div className="mb-1 flex items-start justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-ink">{def?.name ?? activeId}</h1>
        <div className="flex flex-shrink-0 gap-1.5 pt-1">
          {def?.cues && (
            <button
              onClick={() => setShowInfo(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface text-muted"
              aria-label="Exercise info"
            >
              <Info size={15} />
            </button>
          )}
          {alternatives.length > 0 && (
            <button
              onClick={() => setShowSwap(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface text-muted"
              aria-label="Swap exercise"
            >
              <MoreHorizontal size={15} />
            </button>
          )}
        </div>
      </div>

      <div className="tabular mb-1 text-[15px] font-semibold text-accent">
        {targetLabel(planned)}
      </div>
      {override && <div className="mb-4 text-xs font-semibold text-success">Swapped in for today</div>}

      {needsCalibration && (
        <div className="mb-5 flex gap-2.5 rounded-2xl bg-accent-soft p-4">
          <Lightbulb size={16} className="mt-0.5 flex-shrink-0 text-accent" />
          <p className="text-sm leading-relaxed text-ink">
            First time on this one. Work up to a weight where the last two reps are hard but your
            form holds, then log what you did — we&apos;ll take it from there.
          </p>
        </div>
      )}

      <div className="mb-5 overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="grid grid-cols-[1fr_2fr_2fr_1fr] border-b border-line px-4 py-2.5 text-xs font-semibold text-muted">
          <span>Set</span>
          <span>{tracksWeight ? "Weight" : ""}</span>
          <span>{isTimed ? "Minutes" : "Reps"}</span>
          <span />
        </div>
        {Array.from({ length: planned.sets }).map((_, i) => {
          const done = logs[i];
          return (
            <div
              key={i}
              className="tabular grid grid-cols-[1fr_2fr_2fr_1fr] items-center border-b border-line px-4 py-3 text-sm last:border-b-0"
            >
              <span>{i + 1}</span>
              <span>{done && tracksWeight ? `${done.w} kg` : tracksWeight ? "—" : ""}</span>
              <span>{done ? done.r : "—"}</span>
              <span>
                {done && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    className="inline-flex"
                  >
                    <Check size={16} className="text-success" />
                  </motion.span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {!awaitingRpe ? (
        logs.length < planned.sets && (
          <>
            <div className="mb-3.5 flex gap-2.5">
              {tracksWeight && (
                <div className="flex-1">
                  <label className="text-xs text-muted">Weight (kg)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={input.w}
                    onChange={(e) => setInput({ ...input, w: e.target.value })}
                    className="tabular mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm"
                  />
                </div>
              )}
              <div className="flex-1">
                <label className="text-xs text-muted">{isTimed ? "Minutes" : "Reps"}</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={input.r}
                  onChange={(e) => setInput({ ...input, r: e.target.value })}
                  className="tabular mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm"
                />
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleLogSet}
              className="w-full rounded-2xl bg-ink py-4 text-[15px] font-semibold text-background"
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
