"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { planProfile } from "@/lib/profile-changes";
import { planUpgrade, upgradeDismissKey } from "@/lib/plan/upgrade";

/*
 * The offer of a better plan to someone who already has one.
 *
 * Nothing about their week changes unless they say so. The card says what
 * improves in a sentence or two; the preview shows every exercise that comes
 * and goes, session by session; "Keep my plan" means it, and doesn't come back
 * until the rules improve again.
 */

function dismissedHere(): boolean {
  try {
    return window.localStorage.getItem(upgradeDismissKey()) !== null;
  } catch {
    return false;
  }
}

export function PlanUpgradeCard({ className = "" }: { className?: string }) {
  const plan = useAppStore((s) => s.plan);
  const onboarding = useAppStore((s) => s.onboarding);
  const updatePlan = useAppStore((s) => s.updatePlan);

  const [dismissed, setDismissed] = useState(dismissedHere);
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const upgrade = useMemo(
    () => (plan && onboarding.goal ? planUpgrade(plan, planProfile(onboarding)) : null),
    [plan, onboarding]
  );

  if (done) {
    return (
      <div role="status" className={`rounded-[20px] bg-success-soft p-4 ${className}`}>
        <div className="text-subhead font-semibold text-ink">Your plan is updated.</div>
        <div className="text-footnote text-muted">Every weight you&apos;d built came with it.</div>
      </div>
    );
  }

  if (!upgrade || dismissed) return null;

  function keep() {
    try {
      window.localStorage.setItem(upgradeDismissKey(), String(Date.now()));
    } catch {
      // Storage unavailable: the card just shows again next visit.
    }
    setDismissed(true);
    setPreviewing(false);
  }

  async function accept() {
    if (!upgrade) return;
    setSaving(true);
    await updatePlan(upgrade.next);
    setSaving(false);
    setPreviewing(false);
    setDone(true);
  }

  return (
    <>
      <section aria-labelledby="plan-upgrade" className={`rounded-[20px] bg-surface p-4 ${className}`}>
        <div className="mb-1 flex items-center gap-1.5">
          <Sparkles size={16} className="text-accent" aria-hidden />
          <h2 id="plan-upgrade" className="text-subhead font-semibold text-ink">
            Your plan has been improved
          </h2>
        </div>
        <p className="mb-2 text-footnote leading-relaxed text-muted">
          We changed how weeks are built, so every muscle gets the weekly work the research says it needs.
        </p>
        {upgrade.highlights.length > 0 && (
          <ul className="mb-3 flex flex-col gap-1">
            {upgrade.highlights.map((h) => (
              <li key={h} className="tabular text-footnote text-ink">
                {h}
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => setPreviewing(true)}
            className="min-h-[44px] flex-1 rounded-[12px] bg-accent text-subhead font-semibold text-accent-ink"
          >
            See what changes
          </button>
          <button
            onClick={keep}
            className="min-h-[44px] rounded-[12px] bg-fill px-4 text-subhead font-semibold text-ink"
          >
            Keep my plan
          </button>
        </div>
      </section>

      <AnimatePresence>
        {previewing && (
          <motion.div
            className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 md:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewing(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="upgrade-preview"
              className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-[24px] bg-background p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] md:rounded-[24px]"
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <h2 id="upgrade-preview" className="text-title2 font-bold text-ink">
                  What changes
                </h2>
                <button
                  onClick={() => setPreviewing(false)}
                  aria-label="Close"
                  className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-muted"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="mb-4 text-footnote leading-relaxed text-muted">
                Weights you&apos;ve built stay with every exercise that stays. Anything new starts by finding a
                working weight, the same as your first session did.
              </p>

              <div className="flex flex-col gap-3">
                {upgrade.sessions.map((s) => (
                  <div key={s.name} className="rounded-[16px] bg-surface p-3.5">
                    <div className="mb-1.5 text-subhead font-semibold text-ink">{s.name}</div>
                    {s.added.length === 0 && s.removed.length === 0 ? (
                      <div className="text-footnote text-muted">Same exercises — sets and rest adjusted.</div>
                    ) : (
                      <ul className="flex flex-col gap-1">
                        {s.added.map((name) => (
                          <li key={`+${name}`} className="text-footnote text-ink">
                            <span className="font-semibold text-success-ink">Adds </span>
                            {name}
                          </li>
                        ))}
                        {s.removed.map((name) => (
                          <li key={`-${name}`} className="text-footnote text-muted">
                            <span className="font-semibold">Drops </span>
                            {name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-col gap-2">
                <button
                  onClick={accept}
                  disabled={saving}
                  className="min-h-[50px] w-full rounded-[14px] bg-accent text-body font-semibold text-accent-ink disabled:opacity-60"
                >
                  {saving ? "Updating…" : "Update my plan"}
                </button>
                <button onClick={keep} className="min-h-[44px] w-full text-body text-accent">
                  Keep my current plan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
