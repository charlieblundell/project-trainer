"use client";

import { useState } from "react";

export function RpeSelector({ onSubmit }: { onSubmit: (value: number) => void }) {
  const [value, setValue] = useState(7);
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
      />
      <div className="mb-4 flex justify-between text-xs text-muted">
        <span>Easy</span>
        <span className="tabular font-semibold text-ink">{value}</span>
        <span>Max effort</span>
      </div>
      <button
        onClick={() => onSubmit(value)}
        className="w-full rounded-2xl bg-ink py-3.5 text-sm font-semibold text-background transition active:scale-[0.98]"
      >
        Next exercise
      </button>
    </div>
  );
}
