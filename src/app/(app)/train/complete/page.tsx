"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Flame } from "lucide-react";
import { WORKOUTS } from "@/lib/data";
import { useAppStore } from "@/lib/store";

export default function TrainComplete() {
  const router = useRouter();
  const summary = useAppStore((s) => s.lastCompletedSummary);

  useEffect(() => {
    if (!summary) router.replace("/home");
  }, [summary, router]);

  if (!summary) {
    return null;
  }

  const workout = WORKOUTS[summary.workoutId];
  const totalSets = Object.values(summary.loggedSets).reduce((sum, arr) => sum + arr.length, 0);
  const prCount = workout.exercises.reduce((count, ex) => {
    const logs = summary.loggedSets[ex.id] ?? [];
    const prevMax = Math.max(...ex.previous.map((p) => p.w));
    return logs.some((s) => s.w > prevMax) ? count + 1 : count;
  }, 0);

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-5 font-display text-3xl font-bold text-ink">Workout complete.</h1>

      <div className="mb-5 flex gap-2.5">
        {[
          [String(workout.estMinutes), "minutes"],
          [String(workout.exercises.length), "exercises"],
          [String(totalSets), "sets"],
        ].map(([num, label]) => (
          <div key={label} className="flex-1 rounded-2xl border border-line bg-surface py-4 text-center">
            <div className="tabular font-display text-xl font-bold text-ink">{num}</div>
            <div className="text-xs text-muted">{label}</div>
          </div>
        ))}
      </div>

      {prCount > 0 && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl bg-warning-soft px-4 py-3">
          <Flame size={16} className="text-warning" />
          <span className="text-sm font-semibold text-ink">
            {prCount} new personal record{prCount > 1 ? "s" : ""} today.
          </span>
        </div>
      )}

      <div className="mb-6 rounded-2xl bg-success-soft p-5">
        <div className="mb-2 text-xs font-semibold text-success">COACH&apos;S FEEDBACK</div>
        <div className="text-sm leading-relaxed text-ink">
          {prCount > 0
            ? "Nice work — you pushed past your previous best today. I'll raise a couple of your targets for next session."
            : "Solid session. You hit your numbers across the board, so I'll nudge a couple of targets up for next time."}
        </div>
      </div>

      <button
        onClick={() => router.push("/home")}
        className="w-full rounded-2xl bg-ink py-4 text-[15px] font-semibold text-background transition active:scale-[0.98]"
      >
        View next workout
      </button>
    </div>
  );
}
