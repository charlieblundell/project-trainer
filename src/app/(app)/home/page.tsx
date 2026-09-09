"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import { WORKOUTS, todaysWorkoutId } from "@/lib/data";
import { useAppStore } from "@/lib/store";

export default function Home() {
  const router = useRouter();
  const startWorkout = useAppStore((s) => s.startWorkout);
  const workout = WORKOUTS[todaysWorkoutId()];

  function start() {
    startWorkout(workout.id);
    router.push("/train");
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="text-sm text-muted">Good afternoon,</div>
          <h1 className="font-display text-2xl font-bold text-ink md:text-3xl">Charlie</h1>
        </div>
        <Link
          href="/settings"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-muted"
        >
          <Settings size={16} />
        </Link>
      </div>

      <div className="mb-5 rounded-3xl bg-ink p-6 text-background">
        <div className="mb-1.5 text-xs font-semibold tracking-widest text-background/50">TODAY</div>
        <div className="mb-1 font-display text-xl font-bold">{workout.displayName}</div>
        <div className="mb-5 text-sm text-background/60">
          {workout.exercises.length} exercises · ~{workout.estMinutes} min
        </div>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={start}
          className="w-full rounded-xl bg-background py-3.5 text-sm font-semibold text-ink"
        >
          Start workout
        </motion.button>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="mb-1.5 text-xs text-muted">This week</div>
          <div className="tabular mb-2 font-display text-lg font-bold text-ink">3 / 4</div>
          <div className="h-1.5 overflow-hidden rounded-full bg-line">
            <motion.div
              className="h-full rounded-full bg-success"
              initial={{ width: 0 }}
              animate={{ width: "75%" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            />
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="mb-1.5 text-xs text-muted">Bench Press</div>
          <div className="tabular mb-1 font-display text-lg font-bold text-ink">62.5 kg</div>
          <div className="text-xs font-semibold text-success">+4% this month</div>
        </div>
      </div>

      <Link href="/coach" className="block rounded-2xl bg-success-soft p-4">
        <div className="mb-1.5 text-sm leading-relaxed text-ink">
          &ldquo;You&apos;ve completed your last 6 workouts. Your consistency is excellent.&rdquo;
        </div>
        <div className="text-xs font-semibold text-success">Ask your coach &rarr;</div>
      </Link>
    </div>
  );
}
