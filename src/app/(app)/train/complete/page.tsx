"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Flame, TrendingUp } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { sessionById } from "@/lib/plan/helpers";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function TrainComplete() {
  const router = useRouter();
  const summary = useAppStore((s) => s.lastCompletedSummary);
  const plan = useAppStore((s) => s.plan);
  const changes = useAppStore((s) => s.lastChanges);

  useEffect(() => {
    if (!summary) router.replace("/home");
  }, [summary, router]);

  if (!summary) return null;

  const planSession = sessionById(plan, summary.workoutId);
  const totalSets = Object.values(summary.loggedSets).reduce((sum, arr) => sum + arr.length, 0);
  const exerciseCount = Object.keys(summary.loggedSets).length;
  const estMinutes = planSession?.estMinutes ?? 0;
  const upgrades = changes.filter(
    (c) => c.kind === "increase" || c.kind === "harder_variant" || c.kind === "add_reps"
  );

  return (
    <motion.div className="mx-auto max-w-sm" variants={container} initial="hidden" animate="show">
      <motion.h1 variants={item} className="mb-5 font-display text-3xl font-bold text-ink">
        Workout complete.
      </motion.h1>

      <motion.div variants={item} className="mb-5 flex gap-2.5">
        {[
          [String(estMinutes), "minutes"],
          [String(exerciseCount), "exercises"],
          [String(totalSets), "sets"],
        ].map(([num, label]) => (
          <div
            key={label}
            className="flex-1 rounded-2xl border border-line bg-surface py-4 text-center"
          >
            <div className="tabular font-display text-xl font-bold text-ink">{num}</div>
            <div className="text-xs text-muted">{label}</div>
          </div>
        ))}
      </motion.div>

      {upgrades.length > 0 && (
        <motion.div
          variants={item}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 22, delay: 0.15 }}
          className="mb-5 flex items-center gap-2 rounded-2xl bg-warning-soft px-4 py-3"
        >
          <Flame size={16} className="flex-shrink-0 text-warning" />
          <span className="text-sm font-semibold text-ink">
            {upgrades.length} target{upgrades.length > 1 ? "s" : ""} going up next session.
          </span>
        </motion.div>
      )}

      <motion.div variants={item} className="mb-6 rounded-2xl bg-success-soft p-5">
        <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-success">
          <TrendingUp size={13} /> WHAT CHANGES NEXT TIME
        </div>
        {changes.length === 0 ? (
          <p className="text-sm leading-relaxed text-ink">
            That&apos;s logged. Next session will build on what you did today.
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {changes.map((c) => (
              <li key={c.exerciseId} className="text-sm leading-relaxed text-ink">
                <span className="font-semibold">{c.exerciseName}</span>
                <span className="text-muted"> — {c.reason}</span>
              </li>
            ))}
          </ul>
        )}
      </motion.div>

      <motion.button
        variants={item}
        whileTap={{ scale: 0.98 }}
        onClick={() => router.push("/home")}
        className="w-full rounded-2xl bg-ink py-4 text-[15px] font-semibold text-background"
      >
        Done
      </motion.button>
    </motion.div>
  );
}
