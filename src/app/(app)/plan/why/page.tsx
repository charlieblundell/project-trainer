"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  BookOpen,
  CalendarDays,
  CircleDashed,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  Flame,
  Footprints,
  Layers,
  ListOrdered,
  Moon,
  Scale,
  Sprout,
  Target,
  Timer,
  TrendingUp,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { FINDINGS_BY_ID, STRENGTH_LABEL } from "@/lib/evidence";
import { experienceToLevel } from "@/lib/plan/generate";
import {
  NOT_YET,
  PLAN_RULES,
  evidenceHref,
  rulesFor,
  type ForYou,
  type PlanRule,
  type VolumeRow,
} from "@/lib/plan/rules";
import { clsx } from "@/lib/clsx";

/*
 * How your plan is built.
 *
 * A list, not a report. Each rule is one line you can take in at a glance,
 * sorted under whether it comes from research or from us; the explanation,
 * what it means for this plan and the papers behind it are one tap away in a
 * sheet. The honesty is unchanged — judgement calls still sit in the same list
 * under their own heading — it just isn't all said at once.
 */

/** One glyph per rule, so a row can be recognised before it's read. */
const ICONS: Record<string, LucideIcon> = {
  "weekly-volume": BarChart3,
  "split-follows-volume": CalendarDays,
  "several-sets": Layers,
  "load-by-goal": Dumbbell,
  rest: Timer,
  "progress-not-failure": TrendingUp,
  machines: Activity,
  "fat-loss-keeps-lifting": Flame,
  beginners: Sprout,
  "warm-up": Zap,
  "check-in": Moon,
  "barbell-main-lifts": Target,
  "time-budget": Clock,
  "two-per-muscle": ListOrdered,
  calves: Footprints,
};

const STRENGTH_ORDER = { strong: 0, moderate: 1, limited: 2 } as const;

/** The weakest evidence behind a rule, since that's the honest one to show. */
function weakest(ids: string[]) {
  return ids
    .map((id) => FINDINGS_BY_ID[id]?.strength)
    .filter((s): s is keyof typeof STRENGTH_ORDER => !!s)
    .sort((a, b) => STRENGTH_ORDER[b] - STRENGTH_ORDER[a])[0];
}

const formatSets = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

type Tone = "research" | "judgement" | "week";

/* ------------------------------------------------------------------ *
 * Rows
 * ------------------------------------------------------------------ */

/** The coloured square iOS Settings uses, so a list of rules reads like one. */
function Tile({ icon: Icon, tone }: { icon: LucideIcon; tone: Tone }) {
  return (
    <span
      aria-hidden
      className={clsx(
        "flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[8px] text-white",
        tone === "research" && "bg-accent",
        tone === "judgement" && "bg-ink-soft",
        tone === "week" && "bg-success-ink"
      )}
    >
      <Icon size={17} strokeWidth={2.2} />
    </span>
  );
}

function Row({
  icon,
  tone,
  title,
  onPress,
  href,
  last,
}: {
  icon: LucideIcon;
  tone: Tone;
  title: string;
  onPress?: () => void;
  href?: string;
  last?: boolean;
}) {
  const inner = (
    <>
      <Tile icon={icon} tone={tone} />
      {/* The hairline starts where the text starts, not at the edge. */}
      <span
        className={clsx(
          "flex min-h-[50px] flex-1 items-center justify-between gap-3 py-2.5 pr-4",
          !last && "border-b border-line/40"
        )}
      >
        <span className="text-body text-ink">{title}</span>
        <ChevronRight size={17} strokeWidth={2.2} className="flex-shrink-0 text-faint" aria-hidden />
      </span>
    </>
  );
  const className = "flex w-full items-center gap-3 pl-4 text-left active:bg-fill";
  return href ? (
    <Link href={href} className={className}>
      {inner}
    </Link>
  ) : (
    <button onClick={onPress} className={className}>
      {inner}
    </button>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section aria-label={label} className="mb-6">
      <h2 className="mb-1.5 px-4 text-footnote font-medium text-muted">{label}</h2>
      <div className="overflow-hidden rounded-[20px] bg-surface">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * The sheet
 * ------------------------------------------------------------------ */

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
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
        aria-label={title}
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-[24px] bg-background px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-2 md:rounded-[24px]"
        initial={{ y: 48 }}
        animate={{ y: 0 }}
        exit={{ y: 48 }}
        transition={{ type: "spring", stiffness: 420, damping: 38 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* The grabber says "this slides away" before anyone looks for a button. */}
        <div className="mx-auto mb-2 h-[5px] w-9 rounded-full bg-fill-strong" aria-hidden />
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="pt-1 text-title2 font-bold text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-muted"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

function RuleDetail({ rule, personal }: { rule: PlanRule; personal: ForYou | null | undefined }) {
  const strength = rule.basis.kind === "research" ? weakest(rule.basis.findings) : undefined;
  return (
    <>
      <p className="mb-4 text-body leading-relaxed text-ink">{rule.explain}</p>

      {typeof personal === "string" && (
        <div className="mb-4 rounded-[14px] bg-surface p-3.5">
          <div className="mb-0.5 text-footnote font-semibold text-muted">In your plan</div>
          <p className="text-subhead leading-relaxed text-ink">{personal}</p>
        </div>
      )}

      {rule.basis.kind === "research" ? (
        <Link
          href={evidenceHref(rule.basis.findings)}
          className="flex min-h-[56px] items-center justify-between gap-3 rounded-[14px] bg-surface px-4 py-3"
        >
          <span className="flex items-center gap-3">
            <Tile icon={BookOpen} tone="research" />
            <span>
              <span className="block text-body text-ink">
                {rule.basis.findings.length === 1 ? "Read the research" : `Read the ${rule.basis.findings.length} findings`}
              </span>
              {strength && <span className="block text-footnote text-muted">{STRENGTH_LABEL[strength]}</span>}
            </span>
          </span>
          <ChevronRight size={17} className="flex-shrink-0 text-faint" aria-hidden />
        </Link>
      ) : (
        <div className="flex items-start gap-3 rounded-[14px] bg-surface px-4 py-3">
          <Tile icon={Scale} tone="judgement" />
          <span>
            <span className="block text-body text-ink">Our judgement</span>
            <span className="block text-footnote leading-relaxed text-muted">{rule.basis.why}</span>
          </span>
        </div>
      )}
    </>
  );
}

function WeekDetail({ rows }: { rows: VolumeRow[] }) {
  const under = rows.filter((r) => r.aim && r.sets < r.aim.min);
  return (
    <>
      <p className="mb-4 text-body leading-relaxed text-ink">
        Hard sets each muscle gets across your week. Indirect work, like triceps on a bench press, counts as half.
      </p>
      <ul className="mb-4 overflow-hidden rounded-[14px] bg-surface">
        {rows.map((row, i) => {
          const short = !!row.aim && row.sets < row.aim.min;
          return (
            <li
              key={row.muscle}
              className={clsx("flex min-h-[44px] items-center justify-between gap-3 px-4 py-2", i > 0 && "border-t border-line/40")}
            >
              <span className="text-body capitalize text-ink">{row.muscle}</span>
              <span className="flex items-baseline gap-2.5">
                <span className={clsx("tabular text-footnote", short ? "font-semibold text-warning" : "text-muted")}>
                  {row.aim ? (short ? `Under ${row.aim.min}–${row.aim.max}` : `${row.aim.min}–${row.aim.max}`) : "Small floor"}
                </span>
                <span className="tabular w-9 text-right text-headline font-semibold text-ink">{formatSets(row.sets)}</span>
              </span>
            </li>
          );
        })}
      </ul>
      {under.length > 0 && (
        <p className="mb-4 text-footnote leading-relaxed text-muted">
          A little under usually means the sessions ran out of time. Longer sessions or another day would close the gap.
        </p>
      )}
      <Link
        href={evidenceHref(["volume-dose-response", "count-indirect-sets-as-half"])}
        className="flex min-h-[56px] items-center justify-between gap-3 rounded-[14px] bg-surface px-4 py-3"
      >
        <span className="flex items-center gap-3">
          <Tile icon={BookOpen} tone="research" />
          <span className="text-body text-ink">Why weekly sets matter</span>
        </span>
        <ChevronRight size={17} className="flex-shrink-0 text-faint" aria-hidden />
      </Link>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Screen
 * ------------------------------------------------------------------ */

type Open = { kind: "rule"; id: string } | { kind: "week" } | null;

export default function HowYourPlanIsBuilt() {
  const router = useRouter();
  const plan = useAppStore((s) => s.plan);
  const onboarding = useAppStore((s) => s.onboarding);
  const [open, setOpen] = useState<Open>(null);

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
  // Weekly volume gets its own card at the top, so it isn't repeated in the list.
  const research = rules.filter((r) => r.basis.kind === "research" && r.id !== "weekly-volume");
  const judgement = rules.filter((r) => r.basis.kind === "judgement");

  const volume = PLAN_RULES.find((r) => r.id === "weekly-volume")?.forYou?.(ctx);
  const rows = volume && typeof volume !== "string" ? volume.rows : [];
  const under = rows.filter((r) => r.aim && r.sets < r.aim.min);

  const openRule = open?.kind === "rule" ? PLAN_RULES.find((r) => r.id === open.id) : undefined;

  return (
    <div>
      <button
        onClick={() => router.push("/plan")}
        className="-ml-1 mb-2 flex min-h-[44px] items-center gap-0.5 text-body text-accent"
      >
        <ChevronLeft size={22} strokeWidth={2.2} /> Your plan
      </button>

      <h1 className="mb-1 text-largetitle font-bold text-ink">How your plan is built</h1>
      <p className="mb-6 text-subhead text-muted">Every rule, and what it&apos;s based on.</p>

      {rows.length > 0 && (
        <button
          onClick={() => setOpen({ kind: "week" })}
          className="mb-6 flex w-full items-center gap-3.5 rounded-[20px] bg-surface p-4 text-left active:bg-fill"
        >
          <Tile icon={BarChart3} tone="week" />
          <span className="min-w-0 flex-1">
            <span className="block text-headline font-semibold text-ink">Your weekly sets</span>
            <span className="block text-subhead text-muted">
              {under.length === 0
                ? "Every muscle is on target"
                : `${rows.length - under.length} on target · ${under.length} a little under`}
            </span>
          </span>
          <ChevronRight size={17} strokeWidth={2.2} className="flex-shrink-0 text-faint" aria-hidden />
        </button>
      )}

      <Group label="Based on research">
        {research.map((rule, i) => (
          <Row
            key={rule.id}
            icon={ICONS[rule.id] ?? BookOpen}
            tone="research"
            title={rule.title}
            onPress={() => setOpen({ kind: "rule", id: rule.id })}
            last={i === research.length - 1}
          />
        ))}
      </Group>

      <Group label="Our judgement">
        {judgement.map((rule, i) => (
          <Row
            key={rule.id}
            icon={ICONS[rule.id] ?? Scale}
            tone="judgement"
            title={rule.title}
            onPress={() => setOpen({ kind: "rule", id: rule.id })}
            last={i === judgement.length - 1}
          />
        ))}
      </Group>

      <Group label="Not in your plan yet">
        {NOT_YET.map((item, i) => (
          <Row
            key={item.title}
            icon={CircleDashed}
            tone="judgement"
            title={item.title}
            href={evidenceHref(item.findings)}
            last={i === NOT_YET.length - 1}
          />
        ))}
      </Group>

      <AnimatePresence>
        {open?.kind === "week" && (
          <Sheet title="Your weekly sets" onClose={() => setOpen(null)}>
            <WeekDetail rows={rows} />
          </Sheet>
        )}
        {openRule && (
          <Sheet title={openRule.title} onClose={() => setOpen(null)}>
            <RuleDetail rule={openRule} personal={openRule.forYou?.(ctx)} />
          </Sheet>
        )}
      </AnimatePresence>
    </div>
  );
}
