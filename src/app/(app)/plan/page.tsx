"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X, Info } from "lucide-react";
import { useAppStore } from "@/lib/store";
import {
  WEEKDAY_LABELS,
  exerciseName,
  targetLabel,
  todayWeekday,
  weekOverview,
} from "@/lib/plan/helpers";
import type { PlannedSession } from "@/lib/plan/types";

export default function Plan() {
  const router = useRouter();
  const plan = useAppStore((s) => s.plan);
  const startWorkout = useAppStore((s) => s.startWorkout);
  const [preview, setPreview] = useState<PlannedSession | null>(null);
  const today = todayWeekday();

  if (!plan) {
    return (
      <div className="py-16 text-center">
        <p className="mb-4 text-sm text-muted">You don&apos;t have a plan yet.</p>
        <button
          onClick={() => router.push("/onboarding")}
          className="rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-background"
        >
          Build my plan
        </button>
      </div>
    );
  }

  const week = weekOverview(plan);
  const trainingDays = plan.sessions.length;

  return (
    <div className="relative">
      <div className="mb-1 text-xs font-semibold tracking-widest text-muted">YOUR PROGRAM</div>
      <h1 className="mb-1 font-display text-2xl font-bold text-ink">{plan.goal}</h1>
      <div className="mb-5 text-sm text-muted">
        {plan.weeks} weeks · {trainingDays} sessions a week
      </div>

      {plan.notes.length > 0 && (
        <div className="mb-6 rounded-2xl bg-accent-soft p-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-accent">
            <Info size={13} /> HOW THIS WAS BUILT
          </div>
          <ul className="flex flex-col gap-1.5">
            {plan.notes.map((note) => (
              <li key={note} className="text-sm leading-relaxed text-ink">
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {week.map(({ weekday, session }, i) => {
          const isToday = weekday === today;
          return (
            <motion.button
              key={weekday}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              whileTap={session ? { scale: 0.99 } : undefined}
              disabled={!session}
              onClick={() => session && setPreview(session)}
              className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left ${
                isToday ? "border-ink bg-ink" : "border-line bg-surface"
              }`}
            >
              <div>
                <div className={`mb-0.5 text-xs ${isToday ? "text-background/50" : "text-muted"}`}>
                  {WEEKDAY_LABELS[weekday]}
                  {isToday ? " · Today" : ""}
                </div>
                <div className={`text-sm font-semibold ${isToday ? "text-background" : "text-ink"}`}>
                  {session ? session.name : "Rest"}
                </div>
              </div>
              {session && (
                <div className={`tabular text-sm ${isToday ? "text-background/50" : "text-muted"}`}>
                  ~{session.estMinutes} min
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {preview && (
          <motion.div
            className="fixed inset-0 z-30 flex items-end justify-center bg-ink/45 md:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreview(null)}
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
                <h3 className="font-display text-lg font-bold text-ink">{preview.name}</h3>
                <button onClick={() => setPreview(null)} className="text-muted" aria-label="Close">
                  <X size={20} />
                </button>
              </div>
              <p className="mb-4 text-sm text-muted">
                {preview.focus} · ~{preview.estMinutes} min
              </p>

              <div className="mb-5 flex flex-col gap-2">
                {preview.exercises.map((ex, i) => (
                  <div
                    key={`${ex.exerciseId}-${i}`}
                    className="flex items-center justify-between gap-4 rounded-xl bg-background px-3 py-2.5"
                  >
                    <span className="text-sm text-ink">{exerciseName(ex)}</span>
                    <span className="tabular flex-shrink-0 text-xs text-muted">{targetLabel(ex)}</span>
                  </div>
                ))}
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  startWorkout(preview.id);
                  setPreview(null);
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
