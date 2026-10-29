import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, ChevronRight, Scale, X } from "lucide-react";
import { AGREEMENT_LABEL, FINDINGS_BY_ID, STRENGTH_LABEL, type Agreement, type EvidenceStrength } from "@/lib/evidence";
import { evidenceHref } from "@/lib/plan/rules";
import type { Reason } from "@/lib/plan/why";
import { AskCoachLink } from "@/components/AskCoachLink";

/*
 * "Why these numbers?" for the exercise on screen: its sets, reps, effort and
 * rest, each with the reason in plain words and a way into the research.
 * The badge under each one is the weakest evidence behind it, since that's
 * the honest one to show.
 */

const STRENGTH_ORDER: Record<EvidenceStrength, number> = { strong: 0, moderate: 1, limited: 2 };
const AGREEMENT_ORDER: Record<Agreement, number> = { consistent: 0, mostly: 1, mixed: 2 };

function weakest(ids: string[]) {
  const found = ids.map((id) => FINDINGS_BY_ID[id]).filter((f) => !!f);
  if (found.length === 0) return null;
  const strength = found.map((f) => f.strength).sort((a, b) => STRENGTH_ORDER[b] - STRENGTH_ORDER[a])[0];
  const agreement = found.map((f) => f.agreement).sort((a, b) => AGREEMENT_ORDER[b] - AGREEMENT_ORDER[a])[0];
  const newest = Math.max(...found.flatMap((f) => f.sources.map((s) => s.year)));
  return { strength, agreement, newest };
}

export function ExerciseWhySheet({
  name,
  reasons,
  onClose,
}: {
  name: string;
  reasons: Reason[];
  onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 md:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`Why these numbers for ${name}`}
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-[24px] bg-background px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-2 md:rounded-[24px]"
        initial={{ y: 48 }}
        animate={{ y: 0 }}
        exit={{ y: 48 }}
        transition={{ type: "spring", stiffness: 420, damping: 38 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-2 h-[5px] w-9 rounded-full bg-fill-strong" aria-hidden />
        <div className="mb-1 flex items-start justify-between gap-3">
          <h2 className="pt-1 text-title2 font-bold text-ink">Why these numbers?</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-muted"
          >
            <X size={20} />
          </button>
        </div>
        <p className="mb-4 text-subhead text-muted">{name}, for your goal and your week.</p>

        <ul className="flex flex-col gap-3">
          {reasons.map((reason) => {
            const evidence = weakest(reason.findings);
            return (
              <li key={reason.label} className="overflow-hidden rounded-[16px] bg-surface">
                <div className="px-4 pb-3 pt-3.5">
                  <div className="mb-1 flex items-baseline justify-between gap-3">
                    <span className="text-footnote font-semibold text-muted">{reason.label}</span>
                    <span className="tabular text-headline font-semibold text-ink">{reason.value}</span>
                  </div>
                  <p className="text-subhead leading-relaxed text-ink">{reason.why}</p>
                </div>
                {evidence ? (
                  <Link
                    href={evidenceHref(reason.findings)}
                    className="flex min-h-[48px] items-center justify-between gap-3 border-t border-line/40 px-4 py-2.5 active:bg-fill"
                  >
                    <span className="flex items-center gap-2.5">
                      <BookOpen size={16} className="flex-shrink-0 text-accent" aria-hidden />
                      <span className="text-footnote text-ink">
                        {STRENGTH_LABEL[evidence.strength]} · {AGREEMENT_LABEL[evidence.agreement]} · newest {evidence.newest}
                      </span>
                    </span>
                    <ChevronRight size={16} className="flex-shrink-0 text-faint" aria-hidden />
                  </Link>
                ) : (
                  <div className="flex items-center gap-2.5 border-t border-line/40 px-4 py-2.5 text-footnote text-muted">
                    <Scale size={16} aria-hidden /> Our judgement
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <AskCoachLink
          className="mt-4"
          label="Ask the coach about these numbers"
          question={`Why am I doing ${reasons.map((r) => r.value).join(", ")} for ${name}?`}
        />
      </motion.div>
    </motion.div>
  );
}
