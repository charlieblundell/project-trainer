"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import type { WarmUp as WarmUpPlan } from "@/lib/plan/warmup";

/**
 * Shown once before the first exercise. Skipping is a single tap, because a
 * warm-up nobody can get past is a warm-up people close the app on.
 */
export function WarmUp({
  sessionName,
  warmUp,
  onDone,
}: {
  sessionName: string;
  warmUp: WarmUpPlan;
  onDone: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-sm">
      <div className="mb-1 flex items-center gap-2 text-footnote font-semibold text-accent">
        <Flame size={13} /> Warm-up
      </div>
      <h1 className="mb-2 text-title1 font-bold text-ink">Five minutes first.</h1>
      <p className="mb-5 text-subhead leading-relaxed text-muted">
        Picked for {sessionName.toLowerCase()}. Move through these, then start your sets.
      </p>

      <ol className="mb-5 overflow-hidden rounded-[20px] bg-surface">
        {warmUp.moves.map((move, i) => (
          <li key={move.id} className="flex gap-3 border-b border-line px-4 py-3.5 last:border-b-0">
            <span className="tabular flex-shrink-0 text-subhead font-semibold text-muted">{i + 1}</span>
            <div>
              <div className="text-subhead font-semibold text-ink">{move.name}</div>
              <div className="tabular text-footnote text-accent">{move.dose}</div>
              {move.cue && <div className="mt-1 text-footnote leading-relaxed text-muted">{move.cue}</div>}
            </div>
          </li>
        ))}
      </ol>

      {warmUp.rampUp && (
        <div className="mb-5 rounded-[20px] bg-accent-soft p-4">
          <div className="mb-1 text-footnote font-semibold text-accent">Then</div>
          <p className="text-subhead leading-relaxed text-ink">{warmUp.rampUp}</p>
        </div>
      )}

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onDone}
        className="w-full rounded-[20px] bg-ink py-4 text-[15px] font-semibold text-background"
      >
        Done — start the workout
      </motion.button>
      <button onClick={onDone} className="mt-2 w-full py-3 text-subhead font-semibold text-muted hover:text-ink">
        Skip the warm-up
      </button>
    </motion.div>
  );
}
