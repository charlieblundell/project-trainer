"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Flame, TrendingUp } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { sessionById } from "@/lib/plan/helpers";
import { sessionBackground, sessionStyle } from "@/lib/sessionStyle";
import { InstallPrompt } from "@/components/InstallPrompt";
import { InviteFriends } from "@/components/InviteFriends";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.35 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

/** A small burst around the badge: finishing a session deserves a moment. */
const SPARKS = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2;
  const distance = 70 + (i % 3) * 18;
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    color: ["#0068e0", "#34c759", "#ff9f0a", "#af52de"][i % 4],
    size: 6 + (i % 2) * 3,
  };
});

export default function TrainComplete() {
  const router = useRouter();
  const summary = useAppStore((s) => s.lastCompletedSummary);
  const plan = useAppStore((s) => s.plan);
  const changes = useAppStore((s) => s.lastChanges);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!summary) router.replace("/home");
  }, [summary, router]);

  useEffect(() => {
    if (summary && "vibrate" in navigator) navigator.vibrate([30, 60, 30]);
  }, [summary]);

  if (!summary) return null;

  const planSession = sessionById(plan, summary.workoutId);
  const totalSets = Object.values(summary.loggedSets).reduce((sum, arr) => sum + arr.length, 0);
  const exerciseCount = Object.keys(summary.loggedSets).length;
  const estMinutes = planSession?.estMinutes ?? 0;
  const upgrades = changes.filter(
    (c) => c.kind === "increase" || c.kind === "harder_variant" || c.kind === "add_reps"
  );
  const style = planSession ? sessionStyle(planSession) : null;

  return (
    <div className="mx-auto max-w-sm">
      <div className="relative mb-4 flex flex-col items-center pt-6 text-center">
        <div className="relative mb-5 flex h-24 w-24 items-center justify-center">
          {!reduceMotion &&
            SPARKS.map((spark, i) => (
              <motion.span
                key={i}
                aria-hidden
                className="absolute rounded-full"
                style={{ width: spark.size, height: spark.size, backgroundColor: spark.color }}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                animate={{ x: spark.x, y: spark.y, opacity: [0, 1, 0], scale: [0.4, 1, 0.6] }}
                transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
              />
            ))}
          <motion.div
            initial={reduceMotion ? false : { scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 16 }}
            className="flex h-24 w-24 items-center justify-center rounded-full text-white shadow-[0_14px_30px_-12px_rgba(0,0,0,0.4)]"
            style={style ? sessionBackground(style) : { backgroundColor: "var(--success)" }}
          >
            <Check size={48} strokeWidth={3} aria-hidden />
          </motion.div>
        </div>
        <motion.h1
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-largetitle font-bold text-ink"
        >
          Workout complete
        </motion.h1>
        {planSession && (
          <motion.p
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-subhead text-muted"
          >
            {planSession.name} is in the books.
          </motion.p>
        )}
      </div>

      <motion.div variants={container} initial="hidden" animate="show">
        <motion.div variants={item} className="mb-4 flex overflow-hidden rounded-[20px] bg-surface shadow-card">
          {[
            [String(estMinutes), "minutes"],
            [String(exerciseCount), "exercises"],
            [String(totalSets), "sets"],
          ].map(([num, label]) => (
            <div key={label} className="flex-1 border-r border-line/40 py-4 text-center last:border-r-0">
              <div className="tabular text-title1 font-bold text-ink">{num}</div>
              <div className="text-footnote text-muted">{label}</div>
            </div>
          ))}
        </motion.div>

        {upgrades.length > 0 && (
          <motion.div
            variants={item}
            className="mb-4 flex items-center gap-3 rounded-[20px] bg-surface shadow-card px-4 py-3.5"
          >
            <span
              aria-hidden
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-[#b54708] text-white"
            >
              <Flame size={18} />
            </span>
            <span className="text-subhead font-semibold text-ink">
              {upgrades.length} target{upgrades.length > 1 ? "s" : ""} going up next session
            </span>
          </motion.div>
        )}

        <motion.section variants={item} className="mb-6 rounded-[20px] bg-surface shadow-card p-4" aria-labelledby="next-time">
          <h2 id="next-time" className="mb-3 flex items-center gap-1.5 text-footnote font-semibold text-success-ink">
            <TrendingUp size={14} aria-hidden /> What changes next time
          </h2>
          {changes.length === 0 ? (
            <p className="text-subhead leading-relaxed text-ink">
              That&apos;s logged. Next session will build on what you did today.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {changes.map((c) => (
                <li key={c.exerciseId} className="text-subhead leading-relaxed text-ink">
                  <span className="font-semibold">{c.exerciseName}</span>
                  <span className="text-muted"> · {c.reason}</span>
                </li>
              ))}
            </ul>
          )}
        </motion.section>

        <motion.button
          variants={item}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push("/home")}
          className="mb-6 min-h-[54px] w-full rounded-[14px] bg-accent text-body font-semibold text-accent-ink"
        >
          Done
        </motion.button>

        <InstallPrompt className="mb-4" dismissible mobileOnly />
        <InviteFriends className="mb-4" />
      </motion.div>
    </div>
  );
}
