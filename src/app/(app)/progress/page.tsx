"use client";

import { useState } from "react";
import { STRENGTH_HISTORY, PERSONAL_RECORDS } from "@/lib/data";
import { Sparkline } from "@/components/Sparkline";
import { clsx } from "@/lib/clsx";

export default function Progress() {
  const [tab, setTab] = useState<"Strength" | "Training">("Strength");

  return (
    <div>
      <h1 className="mb-5 font-display text-2xl font-bold text-ink">Your progress</h1>

      <div className="mb-6 flex gap-1.5 rounded-xl border border-line bg-surface p-1">
        {(["Strength", "Training"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "flex-1 rounded-lg py-2 text-sm font-semibold transition",
              tab === t ? "bg-ink text-background" : "text-muted"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Strength" ? (
        <>
          {Object.entries(STRENGTH_HISTORY).map(([name, values]) => (
            <div key={name} className="mb-3 rounded-2xl border border-line bg-surface p-4">
              <div className="mb-2 flex justify-between">
                <span className="text-sm font-semibold text-ink">{name}</span>
                <span className="tabular text-sm text-muted">
                  {values[values.length - 1]}
                  {name.includes("reps") ? "" : " kg"}
                </span>
              </div>
              <Sparkline values={values} />
            </div>
          ))}

          <div className="mb-2.5 mt-6 text-xs font-semibold tracking-widest text-muted">
            PERSONAL RECORDS
          </div>
          {PERSONAL_RECORDS.map((pr) => (
            <div key={pr.name} className="flex justify-between border-t border-line py-2.5 first:border-t-0">
              <span className="text-sm text-ink">{pr.name}</span>
              <span className="tabular text-sm font-semibold text-ink">{pr.value}</span>
            </div>
          ))}
        </>
      ) : (
        <div className="flex flex-col gap-3">
          {[
            ["Workouts completed", "34"],
            ["Total volume", "48,620 kg"],
            ["Consistency", "87%"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-4"
            >
              <span className="text-sm text-muted">{label}</span>
              <span className="tabular font-display text-lg font-bold text-ink">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
