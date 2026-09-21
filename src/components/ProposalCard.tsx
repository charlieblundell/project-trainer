"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Undo2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { normalizePlan } from "@/lib/plan/normalize";
import { applyChanges, canUndo, describeChanges, type PlanProposal } from "@/lib/plan/proposal";

/**
 * A plan change the coach proposed, shown for the person to decide on.
 * Nothing changes until they tap Apply; once applied it can be undone for as
 * long as the plan hasn't been changed again since.
 */
export function ProposalCard({
  proposal,
  onChange,
}: {
  proposal: PlanProposal;
  onChange: (proposal: PlanProposal) => void;
}) {
  const plan = useAppStore((s) => s.plan);
  const updatePlan = useAppStore((s) => s.updatePlan);
  const [error, setError] = useState<string | null>(null);

  // Worked out against the plan as it was when proposed, so the card still
  // reads the same after it's been applied.
  const lines = describeChanges(proposal.before ?? plan ?? ({ sessions: [] } as never), proposal.changes);

  async function apply() {
    if (!plan) return;
    const result = applyChanges(plan, proposal.changes);
    if ("error" in result) {
      setError(`${result.error} Ask the coach again and it'll work from your plan as it is now.`);
      return;
    }
    setError(null);
    // Saved exactly as the store will hold it, so Undo can tell nothing has changed since.
    const after = normalizePlan(result.plan);
    onChange({ ...proposal, state: "applied", before: plan, after });
    await updatePlan(after);
  }

  async function undo() {
    if (!proposal.before) return;
    onChange({ ...proposal, state: "undone" });
    await updatePlan(proposal.before);
  }

  const undoable = canUndo(proposal, plan);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      role="group"
      aria-label="Proposed change to your plan"
      className="w-full max-w-[85%] self-start rounded-[20px] bg-surface p-4 shadow-card"
    >
      <div className="mb-1 text-footnote font-semibold text-muted">Change to your plan</div>
      <div className="mb-2 text-headline font-semibold text-ink">{proposal.summary}</div>
      <ul className="mb-3 flex flex-col gap-1">
        {lines.map((line, i) => (
          <li key={i} className="text-subhead leading-snug text-ink">
            {line}
          </li>
        ))}
      </ul>

      {error && <p className="mb-3 text-subhead text-warning">{error}</p>}

      {proposal.state === "pending" && (
        <div className="flex gap-2">
          <button
            onClick={() => void apply()}
            className="press min-h-[44px] flex-1 rounded-[12px] bg-accent text-body font-semibold text-accent-ink"
          >
            Apply
          </button>
          <button
            onClick={() => onChange({ ...proposal, state: "declined" })}
            className="press min-h-[44px] flex-1 rounded-[12px] bg-fill text-body font-semibold text-ink"
          >
            No thanks
          </button>
        </div>
      )}

      {proposal.state === "applied" && (
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-subhead font-semibold text-success-ink">
            <Check size={16} strokeWidth={3} aria-hidden /> Applied to your plan
          </span>
          {undoable ? (
            <button
              onClick={() => void undo()}
              className="press flex min-h-[44px] items-center gap-1.5 px-2 text-subhead font-semibold text-accent"
            >
              <Undo2 size={16} aria-hidden /> Undo
            </button>
          ) : (
            <span className="text-footnote text-muted">Plan changed since</span>
          )}
        </div>
      )}

      {proposal.state === "declined" && <p className="text-subhead text-muted">Left your plan as it was.</p>}
      {proposal.state === "undone" && <p className="text-subhead text-muted">Undone. Your plan is back as it was.</p>}
    </motion.div>
  );
}
