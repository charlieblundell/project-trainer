"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth";
import { displayName } from "@/lib/displayName";
import { clsx } from "@/lib/clsx";
import {
  WEEKDAY_LABELS,
  WEEKDAY_ORDER,
  nextSession,
  sessionForToday,
  todayWeekday,
} from "@/lib/plan/helpers";
import { loadHistory } from "@/lib/progress/storage";
import {
  daysTrainedThisWeek,
  lastWeekSummary,
  sessionsPerWeek,
  weeklyStreak,
} from "@/lib/progress/compute";
import type { WorkoutRecord } from "@/lib/progress/types";
import { InstallPrompt } from "@/components/InstallPrompt";

function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return "Good morning,";
  if (h < 18) return "Good afternoon,";
  return "Good evening,";
}

/** A stable empty array, so the memos below don't recompute on every render. */
const NO_RECORDS: WorkoutRecord[] = [];

export default function Home() {
  const router = useRouter();
  const startWorkout = useAppStore((s) => s.startWorkout);
  const plan = useAppStore((s) => s.plan);
  const user = useAuthStore((s) => s.user);
  const [records, setRecords] = useState<WorkoutRecord[] | null>(null);

  useEffect(() => {
    if (user) loadHistory(user.id).then(setRecords);
  }, [user]);

  const history = records ?? NO_RECORDS;
  const target = plan?.sessions.length ?? 0;
  const trainedDays = useMemo(() => daysTrainedThisWeek(history), [history]);
  const sessionsThisWeek = useMemo(() => sessionsPerWeek(history, 1)[0]?.count ?? 0, [history]);
  const streak = useMemo(() => weeklyStreak(history, target), [history, target]);
  const lastWeek = useMemo(() => lastWeekSummary(history, target), [history, target]);

  const todayName = todayWeekday();
  const todayIndex = WEEKDAY_ORDER.indexOf(todayName);
  const trainedToday = trainedDays.has(todayIndex);

  const today = sessionForToday(plan);
  const upcoming = today ?? nextSession(plan);
  const isRestDay = !today && !!upcoming;

  function start() {
    if (!upcoming) return;
    startWorkout(upcoming.id);
    router.push("/train");
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="text-sm text-muted">{greeting()}</div>
          <h1 className="font-display text-2xl font-bold text-ink md:text-3xl">{displayName(user)}</h1>
        </div>
        <Link
          href="/settings"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-muted"
          aria-label="Settings"
        >
          <Settings size={16} />
        </Link>
      </div>

      {!plan ? (
        <div className="rounded-3xl border border-line bg-surface p-6 text-center">
          <p className="mb-4 text-sm text-muted">You don&apos;t have a plan yet.</p>
          <button
            onClick={() => router.push("/onboarding")}
            className="rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-background"
          >
            Build my plan
          </button>
        </div>
      ) : (
        <div className="mb-5 rounded-3xl bg-ink p-6 text-background">
          <div className="mb-1.5 text-xs font-semibold tracking-widest text-background/50">
            {trainedToday ? "DONE TODAY" : isRestDay ? "REST DAY" : "TODAY"}
          </div>
          {upcoming ? (
            <>
              <div className="mb-1 font-display text-xl font-bold">{upcoming.name}</div>
              <div className="mb-5 text-sm text-background/60">
                {trainedToday
                  ? "Logged today — nice work. Recovery is part of the plan."
                  : isRestDay
                    ? `Next up ${WEEKDAY_LABELS[upcoming.weekday]} · ${upcoming.exercises.length} exercises`
                    : `${upcoming.exercises.length} exercises · ~${upcoming.estMinutes} min`}
              </div>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={start}
                className={clsx(
                  "w-full rounded-xl py-3.5 text-sm font-semibold",
                  trainedToday ? "border border-background/25 text-background" : "bg-background text-ink"
                )}
              >
                {trainedToday ? "Train again anyway" : isRestDay ? "Start it early" : "Start workout"}
              </motion.button>
            </>
          ) : (
            <div className="text-sm text-background/60">No sessions scheduled.</div>
          )}
        </div>
      )}

      {plan && <InstallPrompt className="mb-5" dismissible mobileOnly />}

      {plan && (
        <section className="mb-5 rounded-2xl border border-line bg-surface p-4" aria-labelledby="this-week">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <div id="this-week" className="text-xs font-semibold tracking-widest text-muted">
                THIS WEEK
              </div>
              <div className="tabular font-display text-lg font-bold text-ink">
                {records === null ? "—" : `${sessionsThisWeek} of ${target} sessions`}
              </div>
            </div>
            {records !== null && (
              <div className="text-right">
                {streak > 0 ? (
                  <>
                    <div className="tabular font-display text-lg font-bold text-accent">{streak}</div>
                    <div className="text-xs text-muted">week{streak === 1 ? "" : "s"} in a row</div>
                  </>
                ) : (
                  <div className="max-w-[10rem] text-xs leading-snug text-muted">
                    Do {target} session{target === 1 ? "" : "s"} this week to start a streak
                  </div>
                )}
              </div>
            )}
          </div>

          <ol className="grid grid-cols-7 gap-1.5">
            {WEEKDAY_ORDER.map((day, i) => {
              const trained = trainedDays.has(i);
              const planned = plan.sessions.some((s) => s.weekday === day);
              const label = `${WEEKDAY_LABELS[day]}: ${trained ? "trained" : planned ? "planned" : "rest"}`;
              return (
                <li key={day} className="flex flex-col items-center gap-1" aria-label={label}>
                  <div
                    className={clsx(
                      "h-7 w-full rounded-sm border",
                      trained ? "border-accent bg-accent" : planned ? "border-ink/35" : "border-line bg-background"
                    )}
                  />
                  <span className={clsx("text-[11px]", i === todayIndex ? "font-bold text-ink" : "text-muted")}>
                    {WEEKDAY_LABELS[day].slice(0, 1)}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="mt-2.5 text-[11px] text-muted">Filled: trained · Outlined: planned</p>
        </section>
      )}

      {plan && lastWeek && (
        <section className="mb-5 rounded-2xl border border-line bg-surface p-4" aria-labelledby="last-week">
          <div id="last-week" className="mb-1 text-xs font-semibold tracking-widest text-muted">
            LAST WEEK
          </div>
          <div className="tabular text-sm text-ink">
            {lastWeek.sessions} of {lastWeek.target} sessions · {lastWeek.sets} set{lastWeek.sets === 1 ? "" : "s"}
            {lastWeek.newBests.length > 0 &&
              ` · ${lastWeek.newBests.length} new personal best${lastWeek.newBests.length === 1 ? "" : "s"}`}
          </div>
          {lastWeek.newBests[0] && (
            <div className="tabular mt-1 text-xs text-muted">
              Including {lastWeek.newBests[0].name}: {lastWeek.newBests[0].label}
            </div>
          )}
          {lastWeek.target > 0 && lastWeek.sessions >= lastWeek.target && (
            <div className="mt-1 text-xs font-semibold text-success">Weekly target hit.</div>
          )}
        </section>
      )}

      <Link href="/coach" className="block rounded-2xl bg-success-soft p-4">
        <div className="mb-1.5 text-sm leading-relaxed text-ink">
          Questions about your plan, or need to change something?
        </div>
        <div className="text-xs font-semibold text-success">Ask your coach &rarr;</div>
      </Link>
    </div>
  );
}
