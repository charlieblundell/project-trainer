"use client";

import { AskCoachLink } from "@/components/AskCoachLink";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X, Info, Pencil, RefreshCw, Shuffle, BookOpen, ChevronRight } from "lucide-react";
import { BuiltOnResearch } from "@/components/BuiltOnResearch";
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
import { sessionBackground, sessionStyle } from "@/lib/sessionStyle";


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
          className="min-h-[48px] rounded-[12px] bg-accent px-5 text-body font-semibold text-accent-ink"
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

      <BuiltOnResearch plan={plan} className="mb-5" />

      {plan.notes.length > 0 && (
        <div className="mb-6 rounded-[20px] bg-surface shadow-card p-4">
          <div className="mb-2 flex items-center gap-1.5 text-footnote font-semibold text-muted">
            <Info size={13} /> What your plan works around
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

      {/*
       * The week as one list. Training days are the rows worth a tap, with their
       * own colour and symbol; rest days step back to a single quiet line, so
       * the shape of the week is visible without scrolling past seven cards.
       */}
      <section aria-label="This week" className="mb-6 overflow-hidden rounded-[20px] bg-surface shadow-card">
        {week.map(({ weekday, session }, i) => {
          const isToday = weekday === today;
          const dayLabel = (
            <span className="flex items-center gap-1.5 text-footnote text-muted">
              <span className={isToday ? "font-semibold text-accent" : undefined}>{WEEKDAY_LABELS[weekday]}</span>
              {isToday && (
                <span className="rounded-full bg-accent px-1.5 py-px text-caption font-semibold text-white">Today</span>
              )}
            </span>
          );

          if (!session) {
            return (
              <div
                key={weekday}
                className="flex min-h-[44px] items-center justify-between gap-3 border-b border-line/40 px-4 py-2 last:border-b-0"
              >
                {dayLabel}
                <span className="text-footnote text-muted">Rest</span>
              </div>
            );
          }

          const style = sessionStyle(session);
          const Icon = style.icon;
          return (
            <motion.button
              key={weekday}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setPreview(session)}
              className="press flex min-h-[72px] w-full items-center gap-3.5 border-b border-line/40 px-4 py-3 text-left last:border-b-0 active:bg-fill"
            >
              <span
                aria-hidden
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[12px] text-white"
                style={sessionBackground(style)}
              >
                <Icon size={21} strokeWidth={2.2} />
              </span>
              <span className="min-w-0 flex-1">
                {dayLabel}
                <span className="block text-headline font-semibold text-ink">{session.name}</span>
                <span className="tabular block text-footnote text-muted">
                  {session.exercises.length} exercises · ~{session.estMinutes} min
                </span>
              </span>
              <ChevronRight size={18} strokeWidth={2.2} className="flex-shrink-0 text-faint" aria-hidden />
            </motion.button>
          );
        })}
      </section>

      <section aria-label="Change your plan" className="overflow-hidden rounded-[20px] bg-surface shadow-card">
        <button
          onClick={() => router.push("/plan/edit")}
          className="press flex min-h-[56px] w-full items-center gap-3.5 border-b border-line/40 px-4 py-3 text-left active:bg-fill"
        >
          <span aria-hidden className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px] bg-[#5d5d63] text-white">
            <Pencil size={16} strokeWidth={2.2} />
          </span>
          <span className="flex-1 text-body text-ink">Edit my plan</span>
          <ChevronRight size={18} strokeWidth={2.2} className="flex-shrink-0 text-faint" aria-hidden />
        </button>
        <button
          disabled={refreshing}
          onClick={async () => {
            setRefreshing(true);
            await refreshPlan();
            setRefreshing(false);
          }}
          className="press flex min-h-[56px] w-full items-center gap-3.5 px-4 py-3 text-left active:bg-fill disabled:opacity-60"
        >
          <span aria-hidden className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px] bg-[#b54708] text-white">
            {refreshing ? <RefreshCw size={16} strokeWidth={2.2} className="animate-spin" /> : <Shuffle size={16} strokeWidth={2.2} />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-body text-ink">{refreshing ? "Picking new work" : "Freshen up my accessories"}</span>
            <span className="block text-footnote text-muted">New isolation and core work. Main lifts and weights stay.</span>
          </span>
        </button>

        {lastRefresh && (
          <div className="mx-4 mb-4 rounded-[12px] bg-accent-soft p-3.5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-footnote font-semibold text-accent">What changed</span>
              <button
                onClick={clearLastRefresh}
                className="-m-3 flex h-11 w-11 items-center justify-center text-accent"
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
            {lastRefresh.length === 0 ? (
              <p className="text-subhead leading-relaxed text-ink">
                Nothing to swap. Your equipment doesn&apos;t leave another option for those slots.
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
      </section>

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
              <div className="mb-1 flex items-start justify-between gap-3">
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[12px] text-white"
                    style={sessionBackground(sessionStyle(preview))}
                  >
                    {(() => {
                      const PreviewIcon = sessionStyle(preview).icon;
                      return <PreviewIcon size={21} strokeWidth={2.2} />;
                    })()}
                  </span>
                  <h3 className="text-title2 font-bold text-ink">{preview.name}</h3>
                </span>
                <button
                  onClick={() => setPreview(null)}
                  className="-mr-2 -mt-1 flex h-11 w-11 items-center justify-center rounded-full text-muted"
                  aria-label="Close"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-fill">
                    <X size={18} />
                  </span>
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

              {/* A session starts on its own day; any other day it's here to read. */}
              {preview.weekday === today ? (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    startWorkout(preview.id);
                    setPreview(null);
                    router.push("/train");
                  }}
                  className="min-h-[54px] w-full rounded-[14px] bg-accent text-body font-semibold text-accent-ink"
                >
                  Start this workout
                </motion.button>
              ) : (
                <p className="rounded-[14px] bg-fill px-4 py-3.5 text-center text-subhead text-ink">
                  You can start this on {WEEKDAY_LABELS[preview.weekday]}.
                </p>
              )}

              <Link
                href="/plan/why?rule=load-by-goal"
                className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 text-body text-accent"
              >
                <BookOpen size={16} aria-hidden />
                Why these sets and reps?
              </Link>
              <AskCoachLink
                className="w-full justify-center font-normal text-body"
                label={`Ask the coach about ${preview.name}`}
                question={`What's my ${preview.name} session for, and how hard should it feel?`}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
