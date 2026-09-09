"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { PLAN_WEEK, WORKOUTS } from "@/lib/data";
import { useAppStore } from "@/lib/store";
import type { PlanDay } from "@/lib/types";

export default function Plan() {
  const router = useRouter();
  const startWorkout = useAppStore((s) => s.startWorkout);
  const [previewDay, setPreviewDay] = useState<PlanDay | null>(null);

  return (
    <div className="relative">
      <div className="mb-1 text-xs font-semibold tracking-widest text-muted">YOUR PROGRAM</div>
      <h1 className="mb-1 font-display text-2xl font-bold text-ink">Muscle Building</h1>
      <div className="mb-2.5 text-sm text-muted">Week 1 of 8</div>
      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-line">
        <div className="h-full w-[12.5%] rounded-full bg-ink" />
      </div>

      <div className="flex flex-col gap-2.5">
        {PLAN_WEEK.map((d) => (
          <button
            key={d.day}
            disabled={!d.workoutId}
            onClick={() => d.workoutId && setPreviewDay(d)}
            className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition ${
              d.today ? "border-ink bg-ink" : "border-line bg-surface"
            } ${d.workoutId ? "active:scale-[0.99]" : ""}`}
          >
            <div>
              <div className={`mb-0.5 text-xs ${d.today ? "text-background/50" : "text-muted"}`}>
                {d.day}
                {d.today ? " · Today" : ""}
              </div>
              <div className={`text-sm font-semibold ${d.today ? "text-background" : "text-ink"}`}>
                {d.label}
              </div>
            </div>
            {d.minutes && (
              <div className={`tabular text-sm ${d.today ? "text-background/50" : "text-muted"}`}>
                ~{d.minutes} min
              </div>
            )}
          </button>
        ))}
      </div>

      {previewDay && previewDay.workoutId && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-ink/45 md:items-center">
          <div className="max-h-[80%] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-surface p-6 md:rounded-3xl">
            <div className="mb-1 flex items-start justify-between">
              <h3 className="font-display text-lg font-bold text-ink">{previewDay.label}</h3>
              <button onClick={() => setPreviewDay(null)} className="text-muted">
                <X size={20} />
              </button>
            </div>
            <p className="mb-4 text-sm text-muted">
              {previewDay.day} · ~{previewDay.minutes} min
            </p>

            <div className="mb-5 flex flex-col gap-2">
              {WORKOUTS[previewDay.workoutId].exercises.map((ex) => (
                <div key={ex.id} className="flex justify-between rounded-xl bg-background px-3 py-2.5">
                  <span className="text-sm text-ink">{ex.name}</span>
                  <span className="tabular text-xs text-muted">
                    {ex.targetWeight > 0 ? `${ex.targetWeight} kg x ${ex.targetReps}` : `${ex.targetReps} reps`}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                if (!previewDay.workoutId) return;
                startWorkout(previewDay.workoutId);
                setPreviewDay(null);
                router.push("/train");
              }}
              className="w-full rounded-2xl bg-ink py-4 text-[15px] font-semibold text-background transition active:scale-[0.98]"
            >
              Start this workout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
