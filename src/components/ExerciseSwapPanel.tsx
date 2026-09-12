import { motion } from "framer-motion";
import { X } from "lucide-react";

type Alternative = { id: string; name: string; muscles: string[] };

export function ExerciseSwapPanel({
  exerciseName,
  alternatives,
  onClose,
  onSwap,
}: {
  exerciseName: string;
  alternatives: Alternative[];
  onClose: () => void;
  onSwap: (alt: Alternative) => void;
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
        className="w-full max-w-lg rounded-t-3xl bg-surface p-6 md:rounded-[20px]"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 38 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-start justify-between">
          <h3 className="text-title3 font-bold text-ink">Don&apos;t like this one?</h3>
          <button onClick={onClose} className="text-muted" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <p className="mb-4 text-subhead text-muted">
          Swap {exerciseName} for something that trains the same thing.
        </p>

        <div className="flex flex-col gap-2">
          {alternatives.map((alt, i) => (
            <motion.button
              key={alt.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSwap(alt)}
              className="w-full rounded-[20px] border border-line bg-background px-4 py-3.5 text-left"
            >
              <div className="mb-0.5 text-subhead font-semibold text-ink">{alt.name}</div>
              <div className="text-footnote text-muted">{alt.muscles.join(", ")}</div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
