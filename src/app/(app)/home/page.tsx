"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth";
import { displayName } from "@/lib/displayName";
import { WEEKDAY_LABELS, nextSession, sessionForToday, todayWeekday } from "@/lib/plan/helpers";

function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return "Good morning,";
  if (h < 18) return "Good afternoon,";
  return "Good evening,";
}

export default function Home() {
  const router = useRouter();
  const startWorkout = useAppStore((s) => s.startWorkout);
  const plan = useAppStore((s) => s.plan);
  const user = useAuthStore((s) => s.user);

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
          <h1 className="font-display text-2xl font-bold text-ink md:text-3xl">
            {displayName(user)}
          </h1>
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
            {isRestDay ? "REST DAY" : "TODAY"}
          </div>
          {upcoming ? (
            <>
              <div className="mb-1 font-display text-xl font-bold">{upcoming.name}</div>
              <div className="mb-5 text-sm text-background/60">
                {isRestDay
                  ? `Next up ${WEEKDAY_LABELS[upcoming.weekday]} · ${upcoming.exercises.length} exercises`
                  : `${upcoming.exercises.length} exercises · ~${upcoming.estMinutes} min`}
              </div>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={start}
                className="w-full rounded-xl bg-background py-3.5 text-sm font-semibold text-ink"
              >
                {isRestDay ? "Start it early" : "Start workout"}
              </motion.button>
            </>
          ) : (
            <div className="text-sm text-background/60">No sessions scheduled.</div>
          )}
        </div>
      )}

      {plan && (
        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-line bg-surface p-4">
            <div className="mb-1.5 text-xs text-muted">Program</div>
            <div className="tabular mb-1 font-display text-lg font-bold text-ink">
              {plan.sessions.length}/week
            </div>
            <div className="text-xs text-muted">{plan.goal}</div>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-4">
            <div className="mb-1.5 text-xs text-muted">Today</div>
            <div className="tabular mb-1 font-display text-lg font-bold text-ink">
              {WEEKDAY_LABELS[todayWeekday()].slice(0, 3)}
            </div>
            <div className="text-xs text-muted">{today ? today.focus : "Rest"}</div>
          </div>
        </div>
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
