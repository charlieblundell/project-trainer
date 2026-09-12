"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X, Info, Pencil, RefreshCw, Shuffle, BookOpen } from "lucide-react";
import { useAppStore } from "@/lib/store";
import {
  WEEKDAY_LABELS,
  exerciseName,
  targetLabel,
  todayWeekday,
  weekNumber,
  weekOverview,
} from "@/lib/plan/helpers";
import type { PlannedSession } from "@/lib/plan/types";

/** The findings that actually decide the numbers on a session card. */
const PRESCRIPTION_EVIDENCE = [
  "goal-changes-prescription",
  "volume-dose-response",
  "multiple-sets-beat-one-for-strength",
  "load-for-strength",
  "load-range-hypertrophy",
  "rest-between-sets",
  "failure-not-required",
  "effort-gauged-by-reps-left",
];

export default function Plan() {
  const router = useRouter();
  const plan = useAppStore((s) => s.plan);
  const startWorkout = useAppStore((s) => s.startWorkout);
  const sessionsLogged = useAppStore((s) => s.sessionsLogged);
  const refreshPlan = useAppStore((s) => s.refreshPlan);
  const lastRefresh = useAppStore((s) => s.lastRefresh);
  const clearLastRefresh = useAppStore((s) => s.clearLastRefresh);
  const [preview, setPreview] = useState<PlannedSession | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const today = todayWeekday();

  if (!plan) {
    return (
      <div className="py-16 text-center">
        <p className="mb-4 text-subhead text-muted">You don&apos;t have a plan yet.</p>
        <button
          onClick={() => router.push("/onboarding")}
          className="rounded-[20px] bg-ink px-5 py-3 text-subhead font-semibold text-background"
        >
          Build my plan
        </button>
      </div>
    );
  }

  const week = weekOverview(plan);
  const done = sessionsLogged;

  return (
    <div className="relative">
      <div className="mb-1 text-footnote font-semibold text-muted">Your program</div>
      <h1 className="mb-1 text-largetitle font-bold text-ink">{plan.goal}</h1>
      <div className="tabular mb-5 text-subhead text-muted">
        Week {weekNumber(plan)} ·{" "}
        {done === 0 ? "nothing logged yet" : `${done} session${done > 1 ? "s" : ""} done`}
      </div>

      {plan.notes.length > 0 && (
        <div className="mb-6 rounded-[20px] bg-accent-soft p-4">
          <div className="mb-2 flex items-center gap-1.5 text-footnote font-semibold text-accent">
            <Info size={13} /> HOW THIS WAS BUILT
          </div>
          <ul className="flex flex-col gap-1.5">
            {plan.notes.map((note) => (
              <li key={note} className="text-subhead leading-relaxed text-ink">
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
              className={`flex w-full items-center justify-between rounded-[20px] border px-4 py-3.5 text-left ${
                isToday ? "border-ink bg-ink" : "border-line bg-surface"
              }`}
            >
              <div>
                <div className={`mb-0.5 text-footnote ${isToday ? "text-background/50" : "text-muted"}`}>
                  {WEEKDAY_LABELS[weekday]}
                  {isToday ? " · Today" : ""}
                </div>
                <div className={`text-subhead font-semibold ${isToday ? "text-background" : "text-ink"}`}>
                  {session ? session.name : "Rest"}
                </div>
              </div>
              {session && (
                <div className={`tabular text-subhead ${isToday ? "text-background/50" : "text-muted"}`}>
                  ~{session.estMinutes} min
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      <button
        onClick={() => router.push("/plan/edit")}
        className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-[20px] border border-line py-3.5 text-subhead font-semibold text-ink"
      >
        <Pencil size={15} /> Edit my plan
      </button>

      <div className="mt-6 rounded-[20px] bg-surface p-4">
        <div className="mb-1 flex items-center gap-1.5 text-subhead font-semibold text-ink">
          <Shuffle size={14} className="text-accent" /> Getting stale?
        </div>
        <p className="mb-3 text-subhead leading-relaxed text-muted">
          Swaps the isolation, core and mobility work for something different. Your main lifts stay
          put, along with every weight you&apos;ve built on them — you&apos;ll find a working weight
          for anything new on your next session.
        </p>
        <motion.button
          whileTap={{ scale: 0.98 }}
          disabled={refreshing}
          onClick={async () => {
            setRefreshing(true);
            await refreshPlan();
            setRefreshing(false);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-[20px] border border-line py-3 text-subhead font-semibold text-ink disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : undefined} />
          {refreshing ? "Picking new work" : "Freshen up my accessories"}
        </motion.button>

        {lastRefresh && (
          <div className="mt-3 rounded-[12px] bg-accent-soft p-3.5">
            <div className="mb-2 flex items-start justify-between gap-3">
              <span className="text-footnote font-semibold text-accent">Last refresh</span>
              <button onClick={clearLastRefresh} className="text-accent" aria-label="Dismiss">
                <X size={14} />
              </button>
            </div>
            {lastRefresh.length === 0 ? (
              <p className="text-subhead leading-relaxed text-ink">
                Nothing to swap — your equipment doesn&apos;t leave another option for those slots.
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {lastRefresh.map((swap, i) => (
                  <li key={`${swap.from}-${i}`} className="text-subhead leading-relaxed text-ink">
                    <span className="text-muted">{swap.from}</span> → {swap.to}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {preview && (
          <motion.div
            className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 md:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreview(null)}
          >
            <motion.div
              className="max-h-[80%] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-surface p-6 md:rounded-[20px]"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 38 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-1 flex items-start justify-between">
                <h3 className="text-title3 font-bold text-ink">{preview.name}</h3>
                <button onClick={() => setPreview(null)} className="text-muted" aria-label="Close">
                  <X size={20} />
                </button>
              </div>
              <p className="mb-4 text-subhead text-muted">
                {preview.focus} · ~{preview.estMinutes} min
              </p>

              <div className="mb-5 flex flex-col gap-2">
                {preview.exercises.map((ex, i) => (
                  <div
                    key={`${ex.exerciseId}-${i}`}
                    className="flex items-center justify-between gap-4 rounded-[12px] bg-background px-3 py-2.5"
                  >
                    <span className="text-subhead text-ink">{exerciseName(ex)}</span>
                    <span className="tabular flex-shrink-0 text-footnote text-muted">{targetLabel(ex)}</span>
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
                className="w-full rounded-[20px] bg-ink py-4 text-[15px] font-semibold text-background"
              >
                Start this workout
              </motion.button>

              <button
                onClick={() => router.push(`/evidence?ids=${PRESCRIPTION_EVIDENCE.join(",")}`)}
                className="mt-3 flex w-full items-center justify-center gap-2 py-2 text-subhead font-semibold text-muted"
              >
                <BookOpen size={14} />
                Why these sets and reps?
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
