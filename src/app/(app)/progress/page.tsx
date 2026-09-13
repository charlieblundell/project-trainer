"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/auth";
import { useAppStore } from "@/lib/store";
import { loadHistory } from "@/lib/progress/storage";
import {
  personalRecords,
  sessionsPerWeek,
  strengthSeries,
  trainingTotals,
} from "@/lib/progress/compute";
import type { ExerciseSeries, WorkoutRecord } from "@/lib/progress/types";
import { Sparkline } from "@/components/Sparkline";
import { clsx } from "@/lib/clsx";

/** A stable empty array, so the memos below don't recompute on every render. */
const NO_RECORDS: WorkoutRecord[] = [];

/**
 * Enough to see how training is going without an endless scroll — refreshing
 * the plan a few times leaves far more movements behind than anyone reads.
 */
const SHOWN = 10;

/** "+7.5 kg over 6 sessions", or an honest note when there's no trend yet. */
function trendLabel(series: ExerciseSeries): string {
  const sessions = series.points.length;
  if (series.change === null) return "First session logged";

  const unit = series.measure === "weight" ? "kg" : series.measure === "time" ? "min" : "reps";
  if (series.change === 0) return `Holding steady over ${sessions} sessions`;
  const sign = series.change > 0 ? "+" : "";
  return `${sign}${series.change} ${unit} over ${sessions} sessions`;
}

export default function Progress() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const plan = useAppStore((s) => s.plan);
  const [tab, setTab] = useState<"Strength" | "Training">("Strength");
  const [records, setRecords] = useState<WorkoutRecord[] | null>(null);

  useEffect(() => {
    if (!user) return;
    loadHistory(user.id).then(setRecords);
  }, [user]);

  const history = records ?? NO_RECORDS;
  const series = useMemo(() => strengthSeries(history), [history]);
  const prs = useMemo(() => personalRecords(history), [history]);
  const daysPerWeek = plan?.daysPerWeek ?? null;
  const totals = useMemo(() => trainingTotals(history, daysPerWeek), [history, daysPerWeek]);
  const weeks = useMemo(() => sessionsPerWeek(history), [history]);
  const busiestWeek = Math.max(1, ...weeks.map((w) => w.count));

  if (records === null) {
    return (
      <div>
        <h1 className="mb-5 text-largetitle font-bold text-ink">Your progress</h1>
        <p className="text-subhead text-muted">Loading what you&apos;ve logged…</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div>
        <h1 className="mb-5 text-largetitle font-bold text-ink">Your progress</h1>
        <div className="rounded-[20px] bg-surface p-6 text-center">
          {/* What this screen will become, drawn faintly, so the empty state has a shape. */}
          <svg viewBox="0 0 200 70" className="mx-auto mb-4 h-20 w-full max-w-[220px]" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <line key={i} x1="0" x2="200" y1={10 + i * 18} y2={10 + i * 18} stroke="var(--fill-strong)" strokeWidth="1" />
            ))}
            <motion.path
              d="M4 60 C 40 55, 55 44, 80 42 S 120 30, 140 24 S 180 12, 196 8"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
            <circle cx="196" cy="8" r="5" fill="var(--accent)" />
          </svg>
          <p className="mb-1 text-headline font-semibold text-ink">Your first workout starts this</p>
          <p className="mb-5 text-subhead leading-relaxed text-muted">
            Strength trends, personal bests and weekly sets, all from what you actually lift.
          </p>
          <button
            onClick={() => router.push("/plan")}
            className="min-h-[44px] rounded-[12px] bg-accent px-5 text-body font-semibold text-accent-ink"
          >
            See my plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-5 text-largetitle font-bold text-ink">Your progress</h1>

      <div className="mb-6 flex gap-1 rounded-[10px] bg-fill p-[3px]">
        {(["Strength", "Training"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "min-h-[36px] flex-1 rounded-[8px] text-subhead font-semibold transition",
              tab === t ? "bg-surface text-ink shadow-[0_1px_3px_rgba(0,0,0,0.12)]" : "text-muted"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Strength" ? (
        <>
          {series.length > SHOWN && (
            <p className="mb-3 text-footnote text-muted">
              The {SHOWN} movements you&apos;ve trained most recently, of {series.length}.
            </p>
          )}
          {series.slice(0, SHOWN).map((s, i) => (
            <motion.div
              key={s.exerciseId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 6) * 0.03 }}
              className="mb-3 rounded-[20px] bg-surface p-4"
            >
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <span className="text-subhead font-semibold text-ink">{s.name}</span>
                <span className="tabular flex-shrink-0 text-subhead text-muted">
                  {s.points[s.points.length - 1].label}
                </span>
              </div>
              <Sparkline values={s.points.map((p) => p.value)} />
              <div className="tabular mt-2 text-footnote text-muted">{trendLabel(s)}</div>
            </motion.div>
          ))}

          <div className="mb-2.5 mt-6 text-footnote font-semibold text-muted">
            PERSONAL BESTS
          </div>
          {prs.slice(0, SHOWN).map((pr) => (
            <div
              key={pr.exerciseId}
              className="flex items-center justify-between gap-4 border-t border-line py-2.5 first:border-t-0"
            >
              <span className="text-subhead text-ink">{pr.name}</span>
              <span className="tabular flex-shrink-0 text-subhead font-semibold text-ink">
                {pr.label}
              </span>
            </div>
          ))}
        </>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Workouts", totals.workouts.toLocaleString("en-AU")],
              ["Sets logged", totals.sets.toLocaleString("en-AU")],
              ["Weight lifted", `${totals.volumeKg.toLocaleString("en-AU")} kg`],
              [
                "Consistency",
                totals.consistency === null
                  ? "—"
                  : `${Math.round(totals.consistency * 100)}%`,
              ],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[20px] bg-surface px-4 py-4">
                <div className="tabular text-title2 font-bold text-ink">{value}</div>
                <div className="mt-0.5 text-footnote text-muted">{label}</div>
              </div>
            ))}
          </div>

          {totals.consistency !== null && (
            <p className="px-1 text-footnote leading-relaxed text-muted">
              Consistency is the last four weeks against the {plan?.daysPerWeek} sessions a week
              your plan asks for.
            </p>
          )}

          <div className="rounded-[20px] bg-surface p-4">
            <div className="mb-3 text-footnote font-semibold text-muted">
              LAST 12 WEEKS
            </div>
            <div className="flex h-24 items-end gap-1.5">
              {weeks.map((week) => (
                <div
                  key={week.weekStart}
                  className={clsx(
                    "flex-1 rounded-t-sm",
                    week.count > 0 ? "bg-accent" : "bg-line"
                  )}
                  style={{
                    height: week.count > 0 ? `${(week.count / busiestWeek) * 100}%` : "3px",
                  }}
                  title={`Week of ${week.label}: ${week.count} session${
                    week.count === 1 ? "" : "s"
                  }`}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-footnote text-muted">
              <span>{weeks[0].label}</span>
              <span>This week</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
