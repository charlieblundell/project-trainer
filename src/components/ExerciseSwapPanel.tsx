import { X } from "lucide-react";
import type { Exercise, ExerciseAlternative } from "@/lib/types";

export function ExerciseSwapPanel({
  exercise,
  onClose,
  onSwap,
}: {
  exercise: Exercise;
  onClose: () => void;
  onSwap: (alt: ExerciseAlternative) => void;
}) {
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-ink/45 md:items-center">
      <div className="w-full max-w-lg rounded-t-3xl bg-surface p-6 md:rounded-3xl">
        <div className="mb-1 flex items-start justify-between">
          <h3 className="font-display text-lg font-bold text-ink">Don&apos;t like this one?</h3>
          <button onClick={onClose} className="text-muted">
            <X size={20} />
          </button>
        </div>
        <p className="mb-4 text-sm text-muted">
          Swap {exercise.name} for an alternative that works the same muscles.
        </p>

        <div className="flex flex-col gap-2">
          {exercise.alternatives?.map((alt) => (
            <button
              key={alt.name}
              onClick={() => onSwap(alt)}
              className="w-full rounded-2xl border border-line bg-background px-4 py-3.5 text-left transition active:scale-[0.98]"
            >
              <div className="mb-0.5 text-sm font-semibold text-ink">{alt.name}</div>
              <div className="tabular text-xs text-muted">
                {alt.targetWeight > 0 ? `${alt.targetWeight} kg x ${alt.targetReps}` : `${alt.targetReps} reps`}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
