"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronLeft, ChevronRight, Scale } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { FINDINGS_BY_ID, STRENGTH_LABEL } from "@/lib/evidence";
import { experienceToLevel } from "@/lib/plan/generate";
import { NOT_YET, evidenceHref, rulesFor, type PlanRule, type VolumeRow } from "@/lib/plan/rules";
import { clsx } from "@/lib/clsx";

/*
 * Why your plan looks like this.
 *
 * Every rule the plan was built by, what it means for this person's week, and
 * what it rests on — a finding they can open and read the paper behind, or a
 * plain statement that it's our judgement. The judgement calls are shown in
 * the same list, not tucked away, because an app that says it follows the
 * research has to say where it doesn't.
 */

const STRENGTH_ORDER = { strong: 0, moderate: 1, limited: 2 } as const;

/** The weakest evidence behind a rule, since that's the honest one to show. */
function weakest(ids: string[]) {
  return ids
    .map((id) => FINDINGS_BY_ID[id]?.strength)
    .filter((s): s is keyof typeof STRENGTH_ORDER => !!s)
    .sort((a, b) => STRENGTH_ORDER[b] - STRENGTH_ORDER[a])[0];
}

function Basis({ rule }: { rule: PlanRule }) {
  if (rule.basis.kind === "judgement") {
    return (
      <div className="mt-3 rounded-[12px] bg-fill px-3 py-2.5">
        <div className="mb-0.5 flex items-center gap-1.5 text-footnote font-semibold text-ink">
          <Scale size={14} aria-hidden /> Our judgement
        </div>
        <p className="text-footnote leading-relaxed text-muted">{rule.basis.why}</p>
      </div>
    );
  }

  const strength = weakest(rule.basis.findings);
  const count = rule.basis.findings.length;
  return (
    <Link
      href={evidenceHref(rule.basis.findings)}
      className="mt-3 flex min-h-[44px] items-center justify-between gap-3 rounded-[12px] bg-accent-soft px-3 py-2.5"
    >
      <span className="flex items-start gap-2">
        <BookOpen size={15} className="mt-0.5 flex-shrink-0 text-accent" aria-hidden />
        <span>
          <span className="block text-footnote font-semibold text-accent">
            {count === 1 ? "Read the research" : `Read the research · ${count} findings`}
          </span>
          {/* The weakest of the evidence, since that's the honest one to lead with. */}
          {strength && <span className="block text-caption text-ink-soft">{STRENGTH_LABEL[strength]}</span>}
        </span>
      </span>
      <ChevronRight size={16} className="flex-shrink-0 text-accent" aria-hidden />
    </Link>
  );
}

const sets = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/**
 * Their week in numbers. A muscle under its aim is the most useful thing on
 * the screen, so it's marked in words as well as colour rather than left to
 * be found in a sentence.
 */
function VolumeGrid({ rows }: { rows: VolumeRow[] }) {
  const under = rows.filter((r) => r.aim && r.sets < r.aim.min);
  return (
    <div className="mt-3">
      <div className="mb-1.5 text-footnote font-semibold text-ink">Your week, in hard sets</div>
      <ul className="grid grid-cols-3 gap-1.5">
        {rows.map((row) => {
          const short = !!row.aim && row.sets < row.aim.min;
          return (
            <li
              key={row.muscle}
              className={clsx("rounded-[10px] px-2.5 py-2", short ? "bg-warning-soft" : "bg-fill")}
            >
              <div className="text-caption capitalize text-ink-soft">{row.muscle}</div>
              <div className="tabular text-headline font-semibold text-ink">{sets(row.sets)}</div>
              <div className={clsx("tabular text-caption", short ? "font-semibold text-warning" : "text-ink-soft")}>
                {row.aim ? (short ? `under ${row.aim.min}–${row.aim.max}` : `aim ${row.aim.min}–${row.aim.max}`) : "small floor"}
              </div>
            </li>
          );
        })}
      </ul>
      {under.length > 0 && (
        <p className="mt-2 text-footnote leading-relaxed text-muted">
          {under.map((r) => r.muscle).join(", ")} {under.length === 1 ? "sits" : "sit"} under
          {under.length === 1 ? " its" : " their"} aim. Usually that&apos;s session time running out; it can also be
          equipment, or an area you&apos;ve asked the plan to go easy on.
        </p>
      )}
    </div>
  );
}

export default function WhyThisPlan() {
  const router = useRouter();
  const plan = useAppStore((s) => s.plan);
  const onboarding = useAppStore((s) => s.onboarding);

  if (!plan) {
    return (
      <div className="py-16 text-center">
        <p className="mb-4 text-subhead text-muted">There&apos;s no plan to explain yet.</p>
        <button
          onClick={() => router.push("/onboarding")}
          className="min-h-[48px] rounded-[12px] bg-accent px-5 text-body font-semibold text-accent-ink"
        >
          Build my plan
        </button>
      </div>
    );
  }

  const ctx = {
    plan,
    goal: plan.goal ?? onboarding.goal ?? "Build muscle",
    level: plan.level ?? experienceToLevel(onboarding.experience),
  };
  const rules = rulesFor(ctx);
  const research = rules.filter((r) => r.basis.kind === "research");
  const judgement = rules.filter((r) => r.basis.kind === "judgement");

  const renderRule = (rule: PlanRule) => {
    const personal = rule.forYou?.(ctx);
    return (
      <article key={rule.id} aria-labelledby={`rule-${rule.id}`} className="rounded-[20px] bg-surface p-4">
        <h3 id={`rule-${rule.id}`} className="mb-1 text-headline font-semibold text-ink">
          {rule.title}
        </h3>
        <p className="text-subhead leading-relaxed text-muted">{rule.explain}</p>
        {typeof personal === "string" && (
          <p className="mt-2.5 text-footnote leading-relaxed text-ink">
            <span className="font-semibold">Your plan: </span>
            {personal}
          </p>
        )}
        {personal && typeof personal !== "string" && <VolumeGrid rows={personal.rows} />}
        <Basis rule={rule} />
      </article>
    );
  };

  return (
    <div>
      <button
        onClick={() => router.push("/plan")}
        className="-ml-1 mb-2 flex min-h-[44px] items-center gap-0.5 text-body text-accent"
      >
        <ChevronLeft size={22} strokeWidth={2.2} /> Your plan
      </button>

      <h1 className="mb-2 text-largetitle font-bold text-ink">Why your plan looks like this</h1>
      <p className="mb-6 text-subhead leading-relaxed text-muted">
        Every rule your week was built by, and what it rests on. Most come from published research you
        can open and read. The ones that don&apos;t are marked as our judgement, because a plan that says
        it follows the evidence should say where it doesn&apos;t.
      </p>

      <section aria-labelledby="from-research" className="mb-7">
        <h2 id="from-research" className="mb-2 px-1 text-footnote font-medium text-muted">
          From the research · {research.length}
        </h2>
        <div className="flex flex-col gap-2.5">{research.map(renderRule)}</div>
      </section>

      <section aria-labelledby="our-judgement" className="mb-7">
        <h2 id="our-judgement" className="mb-2 px-1 text-footnote font-medium text-muted">
          Our judgement · {judgement.length}
        </h2>
        <div className="flex flex-col gap-2.5">{judgement.map(renderRule)}</div>
      </section>

      <section aria-labelledby="not-yet" className="mb-4">
        <h2 id="not-yet" className="mb-2 px-1 text-footnote font-medium text-muted">
          What your plan doesn&apos;t do yet
        </h2>
        <div className="overflow-hidden rounded-[20px] bg-surface">
          {NOT_YET.map((item, i) => (
            <Link
              key={item.title}
              href={evidenceHref(item.findings)}
              className={clsx(
                "flex min-h-[44px] items-center justify-between gap-4 px-4 py-3 active:bg-fill",
                i > 0 && "border-t border-line/40"
              )}
            >
              <span>
                <span className="block text-body text-ink">{item.title}</span>
                <span className="mt-0.5 block text-footnote leading-relaxed text-muted">{item.explain}</span>
              </span>
              <ChevronRight size={17} className="flex-shrink-0 text-faint" aria-hidden />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
