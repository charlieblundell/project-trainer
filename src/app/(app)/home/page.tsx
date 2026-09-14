"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, ChevronRight, Flame, MessageCircle, Play, Settings } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth";
import { displayName } from "@/lib/displayName";
import { clsx } from "@/lib/clsx";
import {
  WEEKDAY_LABELS,
  WEEKDAY_ORDER,
  exerciseName,
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
import { PlanUpgradeCard } from "@/components/PlanUpgradeCard";
import { sessionBackground, sessionStyle } from "@/lib/sessionStyle";
import { greeting, homeNote } from "@/lib/homeNote";
import { Rise, useCountUp } from "@/components/Rise";

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

  const name = displayName(user);
  const note = useMemo(() => homeNote(history, plan), [history, plan]);
  const shownDone = useCountUp(records === null ? 0 : sessionsThisWeek);
  const today = sessionForToday(plan);
  const upcoming = today ?? nextSession(plan);
  const isRestDay = !today && !!upcoming;

  function start() {
    if (!upcoming) return;
    startWorkout(upcoming.id);
    router.push("/train");
  }

  const style = upcoming ? sessionStyle(upcoming) : null;
  const Icon = style?.icon;
  const preview = upcoming?.exercises.slice(0, 3).map(exerciseName) ?? [];
  const extra = (upcoming?.exercises.length ?? 0) - preview.length;
  const dateLine = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <div className="text-footnote font-semibold text-muted">{dateLine}</div>
          <h1 className="text-largetitle font-bold text-ink">
            {name ? `${greeting()}, ${name}` : greeting()}
          </h1>
          {records !== null && note && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="mt-0.5 text-subhead text-muted"
            >
              {note}
            </motion.p>
          )}
        </div>
        <Link
          href="/settings"
          className="-mr-2 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-accent"
          aria-label="Settings"
        >
          <Settings size={22} strokeWidth={1.9} />
        </Link>
      </div>

      {!plan ? (
        <div className="rounded-[20px] bg-surface shadow-card p-6 text-center">
          <p className="mb-4 text-subhead text-muted">You don&apos;t have a plan yet.</p>
          <button
            onClick={() => router.push("/onboarding")}
            className="min-h-[44px] rounded-[12px] bg-accent px-5 text-body font-semibold text-accent-ink"
          >
            Build my plan
          </button>
        </div>
      ) : upcoming && style && Icon ? (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          aria-label="Your next workout"
          className="relative mb-4 overflow-hidden rounded-[24px] p-5 text-white shadow-[0_14px_30px_-14px_rgba(0,0,0,0.45)]"
          style={sessionBackground(style)}
        >
          {/* The session's symbol, large and quiet, so each kind of day has a face. */}
          <Icon
            aria-hidden
            size={150}
            strokeWidth={1.4}
            className="pointer-events-none absolute -right-6 -top-5 text-white/10"
          />

          <div className="relative">
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-footnote font-semibold text-white">
              {trainedToday ? (
                <Check size={13} strokeWidth={3} aria-hidden />
              ) : (
                <Icon size={13} strokeWidth={2.4} aria-hidden />
              )}
              {trainedToday
                ? "Done today"
                : isRestDay
                  ? `Rest day · next up ${WEEKDAY_LABELS[upcoming.weekday]}`
                  : "Today"}
            </span>
            <div className="text-title1 font-bold">{upcoming.name}</div>
            <div className="tabular mb-4 text-subhead text-white">
              {trainedToday
                ? "Logged today, nice work. Recovery is part of the plan."
                : `${upcoming.exercises.length} exercises · ~${upcoming.estMinutes} min`}
            </div>

            {!trainedToday && preview.length > 0 && (
              <ul className={clsx("flex flex-wrap gap-1.5", !isRestDay && "mb-5")} aria-label="Exercises">
                {preview.map((n, i) => (
                  <li
                    key={`${n}-${i}`}
                    className="rounded-full bg-black/15 px-2.5 py-1 text-footnote font-medium text-white"
                  >
                    {n}
                  </li>
                ))}
                {extra > 0 && (
                  <li className="rounded-full bg-black/15 px-2.5 py-1 text-footnote font-medium text-white">
                    +{extra} more
                  </li>
                )}
              </ul>
            )}

            {/* A session starts on its own day: a rest day shows what's coming, not a way to start it. */}
            {isRestDay ? (
              !trainedToday && (
                <p className="mt-4 text-subhead font-medium text-white">
                  Ready to start on {WEEKDAY_LABELS[upcoming.weekday]}.
                </p>
              )
            ) : (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={start}
                className={clsx(
                  "flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[16px] text-body font-semibold",
                  trainedToday ? "border border-white/40 text-white" : "bg-white text-ink"
                )}
              >
                {!trainedToday && <Play size={16} fill="currentColor" aria-hidden />}
                {trainedToday ? "Train again anyway" : "Start workout"}
              </motion.button>
            )}
          </div>
        </motion.section>
      ) : (
        <div className="mb-4 rounded-[20px] bg-surface shadow-card p-5 text-subhead text-muted">
          No sessions scheduled.
        </div>
      )}

      {plan && (
        <Rise order={1}>
        <section className="mb-4 rounded-[20px] bg-surface shadow-card p-4" aria-labelledby="this-week">
          <div className="mb-4 flex items-center gap-4">
            <WeekRing done={records === null ? 0 : sessionsThisWeek} shown={shownDone} target={target} />
            <div className="min-w-0 flex-1">
              <div id="this-week" className="text-footnote font-semibold text-muted">
                This week
              </div>
              <div className="tabular text-title3 font-bold text-ink">
                {records === null ? "—" : `${shownDone} of ${target} sessions`}
              </div>
              {records !== null && (
                <div className="flex items-center gap-1 text-footnote text-muted">
                  {streak > 0 ? (
                    <>
                      <Flame size={14} className="text-[#d9480f]" aria-hidden />
                      <span>
                        {streak} week{streak === 1 ? "" : "s"} in a row
                      </span>
                    </>
                  ) : target > 0 && sessionsThisWeek >= target ? (
                    <span>Target hit. That starts a streak.</span>
                  ) : (
                    <span>{target - sessionsThisWeek} more this week to start a streak</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <ol className="grid grid-cols-7 gap-1">
            {WEEKDAY_ORDER.map((day, i) => {
              const trained = trainedDays.has(i);
              const planned = plan.sessions.find((s) => s.weekday === day);
              const isToday = i === todayIndex;
              const dayStyle = planned ? sessionStyle(planned) : null;
              const DayIcon = dayStyle?.icon;
              const label = `${WEEKDAY_LABELS[day]}${isToday ? " (today)" : ""}: ${
                trained ? "trained" : planned ? `${planned.name} planned` : "rest"
              }`;
              return (
                <motion.li
                  key={day}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 420, damping: 24, delay: 0.15 + i * 0.04 }}
                  className="flex flex-col items-center gap-1.5"
                  aria-label={label}
                >
                  <span
                    className={clsx(
                      "text-caption",
                      isToday ? "font-bold text-accent" : "text-muted"
                    )}
                  >
                    {WEEKDAY_LABELS[day].slice(0, 1)}
                  </span>
                  <span
                    aria-hidden
                    className={clsx(
                      "flex h-9 w-9 items-center justify-center rounded-full",
                      isToday && "ring-2 ring-accent ring-offset-2 ring-offset-surface"
                    )}
                    style={
                      trained
                        ? { backgroundColor: "var(--success)" }
                        : dayStyle
                          ? sessionBackground(dayStyle)
                          : { backgroundColor: "var(--fill)" }
                    }
                  >
                    {trained ? (
                      <Check size={17} strokeWidth={3} className="text-white" />
                    ) : DayIcon ? (
                      <DayIcon size={15} strokeWidth={2.3} className="text-white" />
                    ) : null}
                  </span>
                </motion.li>
              );
            })}
          </ol>
        </section>
        </Rise>
      )}

      {plan && (
        <Rise order={2}>
          <PlanUpgradeCard className="mb-4" />
        </Rise>
      )}

      {plan && lastWeek && (
        <Rise order={3}>
        <section className="mb-4 rounded-[20px] bg-surface shadow-card p-4" aria-labelledby="last-week">
          <div id="last-week" className="mb-1 text-footnote font-semibold text-muted">
            Last week
          </div>
          <div className="tabular text-subhead text-ink">
            {lastWeek.sessions} of {lastWeek.target} sessions · {lastWeek.sets} set
            {lastWeek.sets === 1 ? "" : "s"}
            {lastWeek.newBests.length > 0 &&
              ` · ${lastWeek.newBests.length} new personal best${lastWeek.newBests.length === 1 ? "" : "s"}`}
          </div>
          {lastWeek.newBests[0] && (
            <div className="tabular mt-1 text-footnote text-muted">
              Including {lastWeek.newBests[0].name}: {lastWeek.newBests[0].label}
            </div>
          )}
          {lastWeek.target > 0 && lastWeek.sessions >= lastWeek.target && (
            <div className="mt-1 text-footnote font-semibold text-success-ink">
              Weekly target hit.
            </div>
          )}
        </section>
        </Rise>
      )}

      <Rise order={4}>
      <Link
        href="/coach"
        className="press mb-4 flex min-h-[64px] items-center gap-3.5 rounded-[20px] bg-surface shadow-card p-4 active:bg-fill"
      >
        <span
          aria-hidden
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[11px] bg-[#1c7a34] text-white"
        >
          <MessageCircle size={21} strokeWidth={2.2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-headline font-semibold text-ink">Ask your coach</span>
          <span className="block text-subhead text-muted">
            Swap an exercise, move a day, ask why
          </span>
        </span>
        <ChevronRight
          size={18}
          strokeWidth={2.2}
          className="flex-shrink-0 text-faint"
          aria-hidden
        />
      </Link>
      </Rise>

      {plan && (
        <Rise order={5}>
          <InstallPrompt dismissible mobileOnly />
        </Rise>
      )}
    </div>
  );
}

/** Sessions done this week as a ring, the shape Fitness uses for a goal. */
function WeekRing({ done, shown, target }: { done: number; shown: number; target: number }) {
  const r = 24;
  const c = 2 * Math.PI * r;
  const fraction = target > 0 ? Math.min(done / target, 1) : 0;
  return (
    <div className="relative flex-shrink-0" aria-hidden>
      <span className="tabular absolute inset-0 flex items-center justify-center text-subhead font-bold text-ink">
        {shown}/{target}
      </span>
      <svg width="60" height="60" viewBox="0 0 60 60" className="-rotate-90">
        <circle cx="30" cy="30" r={r} fill="none" stroke="var(--fill-strong)" strokeWidth="8" />
        {fraction > 0 && (
          <motion.circle
            cx="30"
            cy="30"
            r={r}
            fill="none"
            stroke={fraction >= 1 ? "var(--success)" : "var(--accent)"}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c * (1 - fraction) }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        )}
      </svg>
    </div>
  );
}
