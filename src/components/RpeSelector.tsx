"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export function RpeSelector({ onSubmit }: { onSubmit: (value: number) => void }) {
  const [value, setValue] = useState(7);
  const pct = ((value - 1) / 9) * 100;

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="mb-3 text-sm font-semibold text-ink">How hard was that?</div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => setValue(parseInt(e.target.value, 10))}
        className="mb-2 w-full accent-accent"
        style={{
          background: `linear-gradient(to right, var(--accent) ${pct}%, var(--line) ${pct}%)`,
          height: 4,
          borderRadius: 999,
          appearance: "none",
        }}
      />
      <div className="mb-4 flex justify-between text-xs text-muted">
        <span>Easy</span>
        <motion.span
          key={value}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          className="tabular font-semibold text-ink"
        >
          {value}
        </motion.span>
        <span>Max effort</span>
      </div>
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => onSubmit(value)}
        className="w-full rounded-2xl bg-ink py-3.5 text-sm font-semibold text-background"
      >
        Next exercise
      </motion.button>
    </div>
  );
}
