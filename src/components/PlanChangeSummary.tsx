import type { PlanChanges } from "@/lib/plan/diff";

/** What a change to someone's answers does to their plan, before or after saving. */
export function PlanChangeSummary({ title, changes }: { title: string; changes: PlanChanges }) {
  const nothing = changes.lines.length === 0 && changes.added.length === 0 && changes.removed.length === 0;
  return (
    <div className="mb-4 rounded-[16px] bg-surface p-4 shadow-card">
      <div className="mb-2 text-footnote font-semibold text-muted">{title}</div>
      {nothing ? (
        <p className="text-subhead leading-relaxed text-ink">Your exercises and sets stay the same.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {changes.lines.map((line) => (
            <li key={line} className="relative pl-4 text-subhead leading-relaxed text-ink">
              <span className="absolute left-0 text-muted" aria-hidden>
                •
              </span>
              {line}
            </li>
          ))}
          {changes.added.length > 0 && (
            <li className="relative pl-4 text-subhead leading-relaxed text-ink">
              <span className="absolute left-0 text-success" aria-hidden>
                +
              </span>
              Adds {changes.added.join(", ")}
            </li>
          )}
          {changes.removed.length > 0 && (
            <li className="relative pl-4 text-subhead leading-relaxed text-ink">
              <span className="absolute left-0 text-warning" aria-hidden>
                −
              </span>
              Removes {changes.removed.join(", ")}
            </li>
          )}
        </ul>
      )}
      <p className="mt-3 text-footnote leading-relaxed text-muted">
        Your workout history and personal bests stay, and exercises that stay in your plan keep their weights.
      </p>
    </div>
  );
}
