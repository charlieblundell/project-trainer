"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export function RpeSelector({
  onSubmit,
  submitLabel = "Next exercise",
}: {
  onSubmit: (value: number) => void;
  submitLabel?: string;
}) {
  const [value, setValue] = useState(7);
  const pct = ((value - 1) / 9) * 100;

  return (
    <div className="rounded-[20px] bg-surface shadow-card p-5">
      <div className="mb-3 text-subhead font-semibold text-ink">How hard was that?</div>
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
      <div className="mb-4 flex justify-between text-footnote text-muted">
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
        className="min-h-[54px] w-full rounded-[14px] bg-accent text-body font-semibold text-accent-ink"
      >
        {submitLabel}
      </motion.button>
    </div>
  );
}
