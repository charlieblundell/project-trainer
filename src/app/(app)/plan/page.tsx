"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { PLAN_WEEK, WORKOUTS } from "@/lib/data";
import { useAppStore } from "@/lib/store";
import type { PlanDay } from "@/lib/types";

export default function Plan() {
  const router = useRouter();
  const startWorkout = useAppStore((s) => s.startWorkout);
  const [previewDay, setPreviewDay] = useState<PlanDay | null>(null);

  return (
    <div className="relative">
      <div className="mb-1 text-xs font-semibold tracking-widest text-muted">YOUR PROGRAM</div>
      <h1 className="mb-1 font-display text-2xl font-bold text-ink">Muscle Building</h1>
      <div className="mb-2.5 text-sm text-muted">Week 1 of 8</div>
      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-line">
        <motion.div
          className="h-full rounded-full bg-ink"
          initial={{ width: 0 }}
          animate={{ width: "12.5%" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        />
      </div>

      <div className="flex flex-col gap-2.5">
        {PLAN_WEEK.map((d, i) => (
          <motion.button
            key={d.day}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileTap={d.workoutId ? { scale: 0.99 } : undefined}
            disabled={!d.workoutId}
            onClick={() => d.workoutId && setPreviewDay(d)}
            className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left ${
              d.today ? "border-ink bg-ink" : "border-line bg-surface"
            }`}
          >
            <div>
              <div className={`mb-0.5 text-xs ${d.today ? "text-background/50" : "text-muted"}`}>
                {d.day}
                {d.today ? " · Today" : ""}
              </div>
              <div className={`text-sm font-semibold ${d.today ? "text-background" : "text-ink"}`}>
                {d.label}
              </div>
            </div>
            {d.minutes && (
              <div className={`tabular text-sm ${d.today ? "text-background/50" : "text-muted"}`}>
                ~{d.minutes} min
              </div>
            )}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {previewDay && previewDay.workoutId && (
          <motion.div
            className="fixed inset-0 z-30 flex items-end justify-center bg-ink/45 md:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewDay(null)}
          >
            <motion.div
              className="max-h-[80%] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-surface p-6 md:rounded-3xl"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 38 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-1 flex items-start justify-between">
                <h3 className="font-display text-lg font-bold text-ink">{previewDay.label}</h3>
                <button onClick={() => setPreviewDay(null)} className="text-muted">
                  <X size={20} />
                </button>
              </div>
              <p className="mb-4 text-sm text-muted">
                {previewDay.day} · ~{previewDay.minutes} min
              </p>

              <div className="mb-5 flex flex-col gap-2">
                {WORKOUTS[previewDay.workoutId].exercises.map((ex) => (
                  <div key={ex.id} className="flex justify-between rounded-xl bg-background px-3 py-2.5">
                    <span className="text-sm text-ink">{ex.name}</span>
                    <span className="tabular text-xs text-muted">
                      {ex.targetWeight > 0 ? `${ex.targetWeight} kg x ${ex.targetReps}` : `${ex.targetReps} reps`}
                    </span>
                  </div>
                ))}
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (!previewDay.workoutId) return;
                  startWorkout(previewDay.workoutId);
                  setPreviewDay(null);
                  router.push("/train");
                }}
                className="w-full rounded-2xl bg-ink py-4 text-[15px] font-semibold text-background"
              >
                Start this workout
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
