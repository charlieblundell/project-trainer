import { motion } from "framer-motion";
import { X } from "lucide-react";

export function ExerciseInfoModal({
  exercise,
  onClose,
}: {
  exercise: { name: string; muscles: string[]; tips: string[] };
  onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-30 flex items-end justify-center bg-ink/45 md:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="max-h-[80%] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-surface p-6 md:rounded-3xl"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 38 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <h3 className="font-display text-lg font-bold text-ink">{exercise.name}</h3>
          <button onClick={onClose} className="text-muted" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="mb-2 text-xs font-semibold tracking-widest text-muted">MUSCLES WORKED</div>
        <div className="mb-5 flex flex-wrap gap-1.5">
          {exercise.muscles.map((m) => (
            <span
              key={m}
              className="rounded-full border border-line bg-background px-2.5 py-1 text-xs text-ink"
            >
              {m}
            </span>
          ))}
        </div>

        {exercise.tips.length > 0 && (
          <>
            <div className="mb-2 text-xs font-semibold tracking-widest text-muted">
              TECHNIQUE TIPS
            </div>
            <div className="flex flex-col gap-2">
              {exercise.tips.map((tip, i) => (
                <div key={i} className="relative pl-4 text-sm leading-relaxed text-ink">
                  <span className="absolute left-0">&bull;</span>
                  {tip}
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
