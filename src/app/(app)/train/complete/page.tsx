"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { CloudOff, Flame, TrendingUp } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { sessionById } from "@/lib/plan/helpers";
import { sessionBackground, sessionStyle } from "@/lib/sessionStyle";
import { InstallPrompt } from "@/components/InstallPrompt";
import { InviteFriends } from "@/components/InviteFriends";
import { FinishBadge } from "@/components/FinishBadge";
import { CoachNote } from "@/components/CoachNote";
import { callAi } from "@/lib/ai/client";
import { EXERCISES_BY_ID, countsSeconds } from "@/lib/exercises";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.35 } },
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
  const savedOnPhone = useAppStore((s) => s.lastSaveQueued);
  const sessionWorkoutId = useAppStore((s) => s.session.workoutId);
  const markSessionFinished = useAppStore((s) => s.markSessionFinished);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!summary) router.replace("/home");
  }, [summary, router]);

  useEffect(() => {
    if (summary && "vibrate" in navigator) navigator.vibrate([30, 60, 30]);
  }, [summary]);

  useEffect(() => {
    if (summary && summary.workoutId === sessionWorkoutId) markSessionFinished();
  }, [summary, sessionWorkoutId, markSessionFinished]);

  if (!summary) return null;

  const planSession = sessionById(plan, summary.workoutId);
  const totalSets = Object.values(summary.loggedSets).reduce((sum, arr) => sum + arr.length, 0);
  const exerciseCount = Object.keys(summary.loggedSets).length;
  const estMinutes = planSession?.estMinutes ?? 0;
  const upgrades = changes.filter(
    (c) => c.kind === "increase" || c.kind === "harder_variant" || c.kind === "add_reps"
  );
  const style = planSession ? sessionStyle(planSession) : null;
  const sessionName = planSession?.name ?? "Workout";

  // What the coach is told: the sets as logged, and what the app already said changes.
  // A timed set is a bare number, so the name carries whether it's seconds or minutes.
  const timedUnitNote = (id: string) => {
    const unit = EXERCISES_BY_ID[id]?.unit;
    if (unit !== "time" && unit !== "distance") return "";
    return countsSeconds(id, unit) ? " (seconds held)" : " (minutes)";
  };

  const debriefBody = {
    session: sessionName,
    exercises: Object.entries(summary.loggedSets)
      .filter(([, sets]) => sets.length > 0)
      .map(([id, sets]) => ({
        name: `${EXERCISES_BY_ID[id]?.name ?? id}${timedUnitNote(id)}`,
        sets: sets.slice(0, 12),
        change: changes.find((c) => c.exerciseId === id)?.reason.slice(0, 200),
      }))
      .slice(0, 20),
  };

  return (
    <div className="mx-auto max-w-sm">
      <div className="relative mb-4 flex flex-col items-center pt-6 text-center">
        <FinishBadge background={style ? sessionBackground(style) : { backgroundColor: "var(--success)" }} />
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
        {savedOnPhone && (
          <motion.div
            variants={item}
            role="status"
            className="mb-4 flex items-start gap-3 rounded-[20px] bg-surface px-4 py-3.5 shadow-card"
          >
            <CloudOff size={18} className="mt-0.5 flex-shrink-0 text-muted" aria-hidden />
            <span className="text-subhead leading-relaxed text-ink">
              Saved on this phone. It&apos;ll sync by itself when you&apos;re back online.
            </span>
          </motion.div>
        )}
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

        {debriefBody.exercises.length > 0 && (
          <motion.div variants={item}>
            <CoachNote
              className="mb-6"
              cacheKey={`debrief:${summary.workoutId}:${totalSets}:${JSON.stringify(summary.loggedSets).length}`}
              load={() =>
                callAi<{ debrief?: string | null }>("/api/debrief", debriefBody).then((r) => r?.debrief ?? null)
              }
              followUp={`About today's ${sessionName} session: `}
            />
          </motion.div>
        )}

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
