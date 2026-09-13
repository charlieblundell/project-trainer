"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { WEEKDAY_LABELS, nextSession } from "@/lib/plan/helpers";
import type { Plan, PlannedSession } from "@/lib/plan/types";
import type { SetLog } from "@/lib/types";
import { sessionBackground, sessionStyle } from "@/lib/sessionStyle";
import { FinishBadge } from "@/components/FinishBadge";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.35 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

/**
 * What the Train tab shows once today's workout is finished: a well done, what
 * got done, and what's next — rather than reopening the last exercise with
 * every set already ticked.
 */
export function DoneForToday({
  plan,
  finished,
  loggedSets,
}: {
  plan: Plan;
  finished: PlannedSession;
  loggedSets: Record<string, SetLog[]>;
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const style = sessionStyle(finished);

  const sets = Object.values(loggedSets).reduce((n, l) => n + l.length, 0);
  const exercises = Object.values(loggedSets).filter((l) => l.length > 0).length;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const upNext = nextSession(plan, tomorrow);
  const NextIcon = upNext ? sessionStyle(upNext).icon : null;

  return (
    <div className="mx-auto max-w-sm">
      <div className="mb-5 flex flex-col items-center pt-6 text-center">
        <FinishBadge background={sessionBackground(style)} />
        <motion.h1
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-largetitle font-bold text-ink"
        >
          Good job!
        </motion.h1>
        <motion.p
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-[18rem] text-subhead text-muted"
        >
          You finished {finished.name} today. That&apos;s the work done. Rest is where it pays off.
        </motion.p>
      </div>

      <motion.div variants={container} initial="hidden" animate="show">
        <motion.div variants={item} className="mb-4 flex overflow-hidden rounded-[20px] bg-surface shadow-card">
          {[
            [String(exercises), exercises === 1 ? "exercise" : "exercises"],
            [String(sets), sets === 1 ? "set" : "sets"],
          ].map(([num, label]) => (
            <div key={label} className="flex-1 border-r border-line/40 py-4 text-center last:border-r-0">
              <div className="tabular text-title1 font-bold text-ink">{num}</div>
              <div className="text-footnote text-muted">{label}</div>
            </div>
          ))}
        </motion.div>

        {upNext && NextIcon && (
          <motion.div
            variants={item}
            className="mb-6 flex items-center gap-3.5 rounded-[20px] bg-surface shadow-card p-4"
          >
            <span
              aria-hidden
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[12px] text-white"
              style={sessionBackground(sessionStyle(upNext))}
            >
              <NextIcon size={20} strokeWidth={2.2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-footnote text-muted">Next up</span>
              <span className="block text-headline font-semibold text-ink">
                {upNext.name} on {WEEKDAY_LABELS[upNext.weekday]}
              </span>
            </span>
          </motion.div>
        )}

        <motion.button
          variants={item}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push("/home")}
          className="mb-3 min-h-[54px] w-full rounded-[14px] bg-accent text-body font-semibold text-accent-ink"
        >
          Back home
        </motion.button>

        <motion.div variants={item}>
          <Link
            href="/progress"
            className="press mb-5 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-[14px] bg-surface shadow-card text-body font-semibold text-ink"
          >
            <TrendingUp size={18} aria-hidden /> See my progress
          </Link>
        </motion.div>

        <motion.div variants={item} className="text-center">
          <Link href="/plan" className="inline-flex min-h-[44px] items-center text-subhead text-accent">
            Train again anyway
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
