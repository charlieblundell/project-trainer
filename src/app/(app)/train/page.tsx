"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Check, Info, MoreHorizontal } from "lucide-react";
import { WORKOUTS } from "@/lib/data";
import { useAppStore } from "@/lib/store";
import { RpeSelector } from "@/components/RpeSelector";
import { ExerciseInfoModal } from "@/components/ExerciseInfoModal";
import { ExerciseSwapPanel } from "@/components/ExerciseSwapPanel";
import type { Exercise, ExerciseAlternative, SetLog } from "@/lib/types";

export default function Train() {
  const router = useRouter();
  const session = useAppStore((s) => s.session);

  const workout = WORKOUTS[session.workoutId] ?? WORKOUTS.upperA;
  const ex = workout.exercises[session.exerciseIdx];

  return (
    <div className="relative">
      <button
        onClick={() => router.push("/home")}
        className="mb-4 flex items-center gap-1 text-sm text-muted"
      >
        <ChevronLeft size={18} /> {workout.name}
      </button>

      <div className="mb-1 text-xs text-muted">
        {Math.min(session.exerciseIdx + 1, workout.exercises.length)} / {workout.exercises.length} exercises
      </div>

      {ex ? (
        <ExercisePanel
          key={`${session.workoutId}:${session.exerciseIdx}`}
          workoutExerciseCount={workout.exercises.length}
          exercise={ex}
        />
      ) : (
        <div className="py-16 text-center text-sm text-muted">
          No exercises left.{" "}
          <button className="underline" onClick={() => router.push("/home")}>
            Back home
          </button>
        </div>
      )}
    </div>
  );
}

function ExercisePanel({
  workoutExerciseCount,
  exercise,
}: {
  workoutExerciseCount: number;
  exercise: Exercise;
}) {
  const router = useRouter();
  const session = useAppStore((s) => s.session);
  const logSet = useAppStore((s) => s.logSet);
  const submitRpe = useAppStore((s) => s.submitRpe);
  const nextExercise = useAppStore((s) => s.nextExercise);
  const swapExercise = useAppStore((s) => s.swapExercise);
  const completeWorkout = useAppStore((s) => s.completeWorkout);

  const override = session.overrides[exercise.id];
  const displayWeight = override?.targetWeight ?? exercise.targetWeight;
  const displayReps = override?.targetReps ?? exercise.targetReps;

  const [setInput, setSetInput] = useState({ w: String(displayWeight), r: String(displayReps) });
  const [showInfo, setShowInfo] = useState(false);
  const [showSwap, setShowSwap] = useState(false);

  const logs = session.loggedSets[exercise.id] ?? [];
  const awaitingRpe = logs.length >= exercise.sets && session.rpeValues[exercise.id] === undefined;
  const hasExtras = Boolean(exercise.muscles && exercise.alternatives);

  function handleLogSet() {
    const w = parseFloat(setInput.w) || displayWeight;
    const r = parseInt(setInput.r, 10) || displayReps;
    const log: SetLog = { w, r };
    logSet(exercise.id, log);
  }

  function handleSubmitRpe(value: number) {
    submitRpe(exercise.id, value);
    if (session.exerciseIdx + 1 < workoutExerciseCount) {
      nextExercise();
    } else {
      completeWorkout();
      router.push("/train/complete");
    }
  }

  function handleSwap(alt: ExerciseAlternative) {
    swapExercise(exercise.id, alt);
    setSetInput({ w: String(alt.targetWeight), r: String(alt.targetReps) });
    setShowSwap(false);
  }

  return (
    <div>
      <div className="mb-1 flex items-start justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-ink">{override?.name ?? exercise.name}</h1>
        {hasExtras && (
          <div className="flex flex-shrink-0 gap-1.5 pt-1">
            <button
              onClick={() => setShowInfo(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface text-muted"
            >
              <Info size={15} />
            </button>
            <button
              onClick={() => setShowSwap(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface text-muted"
            >
              <MoreHorizontal size={15} />
            </button>
          </div>
        )}
      </div>

      <div className="tabular mb-1 text-[15px] font-semibold text-accent">
        Target: {displayWeight} kg x {displayReps}
      </div>
      {override ? (
        <div className="mb-5 text-xs font-semibold text-success">Swapped in for today</div>
      ) : (
        <div className="tabular mb-5 text-xs text-muted">
          Previous: {exercise.previous.map((p) => `${p.w}x${p.r}`).join(", ")}
        </div>
      )}

      <div className="mb-5 overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="grid grid-cols-[1fr_2fr_2fr_1fr] border-b border-line px-4 py-2.5 text-xs font-semibold text-muted">
          <span>Set</span>
          <span>Weight</span>
          <span>Reps</span>
          <span />
        </div>
        {Array.from({ length: exercise.sets }).map((_, i) => {
          const done = logs[i];
          return (
            <div
              key={i}
              className="tabular grid grid-cols-[1fr_2fr_2fr_1fr] items-center border-b border-line px-4 py-3 text-sm last:border-b-0"
            >
              <span>{i + 1}</span>
              <span>{done ? `${done.w} kg` : "—"}</span>
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
        logs.length < exercise.sets && (
          <>
            <div className="mb-3.5 flex gap-2.5">
              <div className="flex-1">
                <label className="text-xs text-muted">Weight (kg)</label>
                <input
                  type="number"
                  value={setInput.w}
                  onChange={(e) => setSetInput({ ...setInput, w: e.target.value })}
                  className="tabular mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted">Reps</label>
                <input
                  type="number"
                  value={setInput.r}
                  onChange={(e) => setSetInput({ ...setInput, r: e.target.value })}
                  className="tabular mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm"
                />
              </div>
            </div>
            <button
              onClick={handleLogSet}
              className="w-full rounded-2xl bg-ink py-4 text-[15px] font-semibold text-background transition active:scale-[0.98]"
            >
              Log set
            </button>
          </>
        )
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <RpeSelector onSubmit={handleSubmitRpe} />
        </motion.div>
      )}

      <AnimatePresence>
        {showInfo && <ExerciseInfoModal exercise={exercise} onClose={() => setShowInfo(false)} />}
        {showSwap && (
          <ExerciseSwapPanel exercise={exercise} onClose={() => setShowSwap(false)} onSwap={handleSwap} />
        )}
      </AnimatePresence>
    </div>
  );
}
