import type { Level } from "@/lib/exercises";
import { MUSCLE_GROUPS, setsByGroup, weeklyTarget, type MuscleGroup } from "./volume";
import type { Plan } from "./types";

/*
 * The rules a plan is built by, and what each one rests on.
 *
 * Every rule here is either tied to findings in the evidence library or
 * labelled plainly as a judgement call. The screen that shows these is the
 * app's working shown in full: a claim to be evidence-based is only worth
 * something if the parts that aren't are said out loud.
 *
 * Keep this in step with src/lib/plan/generate.ts and volume.ts. A rule the
 * builder no longer follows is worse than a rule left unexplained.
 */

export type RuleContext = { plan: Plan; goal: string; level: Level };

export type RuleBasis =
  | { kind: "research"; findings: string[] }
  | { kind: "judgement"; why: string };

export type VolumeRow = {
  muscle: string;
  sets: number;
  /** Null for calves, which have a small floor rather than a range to aim at. */
  aim: { min: number; max: number } | null;
};

/** What a rule means for one person's plan: a sentence, or their week's numbers. */
export type ForYou = string | { kind: "volume"; rows: VolumeRow[] };

export type PlanRule = {
  id: string;
  title: string;
  explain: string;
  basis: RuleBasis;
  /** Only shown when it applies to this person's plan. */
  appliesTo?: (ctx: RuleContext) => boolean;
  /** What the rule means for their plan in particular. */
  forYou?: (ctx: RuleContext) => ForYou | null;
};

const NAMES: Record<MuscleGroup, string> = {
  chest: "chest",
  back: "back",
  shoulders: "shoulders",
  quads: "quads",
  hamstrings: "hamstrings",
  glutes: "glutes",
  biceps: "biceps",
  triceps: "triceps",
  calves: "calves",
};

const liftingSessions = (plan: Plan) =>
  plan.sessions.filter((s) => s.exercises.some((e) => e.unit !== "time" && e.unit !== "distance"));

export const PLAN_RULES: PlanRule[] = [
  /* ---------------- Grounded in research ---------------- */
  {
    id: "weekly-volume",
    title: "Every muscle gets a weekly set target",
    explain:
      "Hard sets per muscle per week are the strongest predictor of growth in the research, with more helping up to a point. Your plan counts them, and sets that train a muscle indirectly — triceps during a bench press — count as half.",
    basis: { kind: "research", findings: ["volume-dose-response", "count-indirect-sets-as-half"] },
    forYou: ({ plan, goal, level }) => {
      const week = setsByGroup(plan.sessions.flatMap((s) => s.exercises));
      const trained = MUSCLE_GROUPS.filter((g) => week[g] > 0);
      if (trained.length === 0) return null;
      return {
        kind: "volume",
        rows: trained.map((g) => ({
          muscle: NAMES[g],
          sets: week[g],
          aim: g === "calves" ? null : weeklyTarget(goal, level, g),
        })),
      };
    },
  },
  {
    id: "split-follows-volume",
    title: "Your split fits your week",
    explain:
      "Once the week's sets are matched, spreading them over more sessions doesn't add growth. So the plan fits the days you'll actually train, and makes sure each session carries its share of the week.",
    basis: { kind: "research", findings: ["frequency-follows-volume"] },
    forYou: ({ plan }) => {
      const names = liftingSessions(plan).map((s) => s.name);
      if (names.length === 0) return null;
      const ppl = ["Push", "Pull", "Legs"].every((n) => names.includes(n));
      return ppl
        ? "You train Push, Pull and Legs, so each of those sessions carries a muscle's whole week."
        : `You train ${names.join(", ")}.`;
    },
  },
  {
    id: "several-sets",
    title: "Several sets per exercise",
    explain:
      "Multiple sets produce more strength than a single set, so every main lift gets more than one. How many depends on your goal.",
    basis: { kind: "research", findings: ["multiple-sets-beat-one-for-strength"] },
  },
  {
    id: "load-by-goal",
    title: "Reps and weight for your goal",
    explain:
      "Strength depends on lifting heavy, so a strength plan works in low reps. Size responds to light and heavy loads alike when sets are hard, so a muscle-building plan uses moderate ranges. The exact range is a practical choice within what the research allows: heavy enough to progress, light enough not to grind.",
    basis: { kind: "research", findings: ["load-for-strength", "load-range-hypertrophy", "goal-changes-prescription"] },
  },
  {
    id: "rest",
    title: "Real rest on the main lifts",
    explain:
      "Two to three minutes before the next set of a heavy lift keeps the reps you'd otherwise lose. That evidence is strongest for strength; applying it to a muscle-building plan is a reasonable step, not a direct finding.",
    basis: { kind: "research", findings: ["rest-between-sets"] },
    // General health, fitness and endurance plans rest for less, on purpose.
    appliesTo: ({ goal }) => ["Get stronger", "Build muscle", "Lose fat"].includes(goal),
  },
  {
    id: "progress-not-failure",
    title: "When your weights go up",
    explain:
      "Stopping a rep or two short builds almost as much and costs far less. So the plan raises your target when you reach the top of the rep range and your effort rating says there was something left.",
    basis: { kind: "research", findings: ["failure-not-required", "effort-gauged-by-reps-left"] },
  },
  {
    id: "machines",
    title: "Machines and cables count",
    explain: "They build muscle as well as free weights, so the plan uses whichever fits the job and your equipment.",
    basis: { kind: "research", findings: ["machines-and-free-weights-both-work"] },
  },
  {
    id: "fat-loss-keeps-lifting",
    title: "Losing fat keeps the lifting",
    explain:
      "Resistance training is what holds on to muscle while you eat less, and cardio alongside it doesn't take away from it. So a fat-loss plan is the full lifting plan with conditioning added at the end, not a lighter one.",
    basis: { kind: "research", findings: ["slow-fat-loss-protects-muscle", "cardio-does-not-kill-gains"] },
    appliesTo: ({ goal }) => goal === "Lose fat",
  },
  {
    id: "beginners",
    title: "New lifters start on less",
    explain:
      "People new to lifting progress on very little, so your weekly set targets start lower — easier to recover from and to keep turning up for. More still helps early, so the targets rise as you move up. The evidence here is limited.",
    basis: { kind: "research", findings: ["beginners-start-small"] },
    appliesTo: ({ level }) => level === 1,
  },
  {
    id: "balance-work",
    title: "Balance work in every session",
    explain:
      "In older adults, balance and functional exercise cuts the rate of falls by about a quarter, and the WHO asks for balance and strength work on three or more days a week from 65. So every session has a short balance exercise, straight after the main lifts, and nothing in the plan involves jumping.",
    basis: { kind: "research", findings: ["balance-exercise-prevents-falls"] },
    appliesTo: ({ plan }) => (plan.cautions ?? []).length > 0,
    forYou: ({ plan }) => {
      const cautions = plan.cautions ?? [];
      if (cautions.includes("bone")) return "Your notes mention your bones, so falls matter more than usual.";
      return "It's in your plan because of your age or what you said about your balance.";
    },
  },
  {
    id: "strength-twice-weekly",
    title: "Strength on at least two days",
    explain:
      "The international guideline for health is muscle-strengthening work on two or more days a week, whatever your age. So a two-day health plan is two strength sessions, and walking or cardio days come on top from the third day.",
    basis: { kind: "research", findings: ["activity-guidelines"] },
    appliesTo: ({ goal }) => goal === "General health",
  },
  {
    id: "warm-up",
    title: "A short warm-up, mostly moving",
    explain:
      "Warming up helps performance, and long static stretches right before lifting reduce it. So the warm-up is movement first, with at most one held stretch.",
    basis: { kind: "research", findings: ["warm-up-helps", "long-static-stretching-before-lifting"] },
  },
  {
    id: "check-in",
    title: "Lighter days after bad sleep",
    explain:
      "Sleep loss measurably hurts performance. If your check-in says you slept badly or you're very sore, each strength exercise loses a set that day, and a missed target isn't counted as going backwards. Only the sleep part rests on research; treating heavy soreness the same way is our call.",
    basis: { kind: "research", findings: ["sleep-loss-hurts-performance"] },
  },

  /* ---------------- Our judgement ---------------- */
  {
    id: "barbell-main-lifts",
    title: "Barbells for main lifts",
    explain:
      "Machines build muscle just as well. This is about progress you can measure: a barbell goes up in small, steady steps for years.",
    basis: {
      kind: "judgement",
      why: "A coaching preference for how progression is tracked, not something the growth research requires.",
    },
    appliesTo: ({ level }) => level >= 2,
  },
  {
    id: "time-budget",
    title: "Using the time you have",
    explain:
      "Spare minutes go toward the top of each muscle's range. If a session runs long, accessory sets come down first and the first two lifts are never cut.",
    basis: {
      kind: "judgement",
      why: "How to spend a fixed amount of time is a design decision the research doesn't settle.",
    },
  },
  {
    id: "two-per-muscle",
    title: "Two exercises per muscle",
    explain:
      "When filling spare time, a muscle that already has two exercises in the session gets another set rather than a third exercise. A third curl variation adds little that one more set wouldn't.",
    basis: { kind: "judgement", why: "A practical limit to keep sessions focused, not a tested threshold." },
  },
  {
    id: "calves",
    title: "Calves always get a few sets",
    explain: "They come last when time is short, but never drop to nothing — people notice when they're missing.",
    basis: { kind: "judgement", why: "A small floor chosen for completeness. There's no research on the right minimum for calves." },
  },
];

/** Findings the plan does not act on yet, said plainly rather than implied. */
export const NOT_YET: { title: string; explain: string; findings: string[] }[] = [
  {
    title: "Planned variation over months",
    explain:
      "Structured variation gives a small strength edge. Your plan changes when you refresh accessories or rebuild it, but it doesn't run planned phases yet.",
    findings: ["periodisation-small-edge"],
  },
  {
    title: "Scheduled easy weeks",
    explain:
      "Nearly every strength coach programmes deloads, but the evidence for them is thin. The plan doesn't schedule them; it holds targets when a session goes badly instead.",
    findings: ["deloads-are-under-studied"],
  },
];

export function rulesFor(ctx: RuleContext): PlanRule[] {
  return PLAN_RULES.filter((rule) => !rule.appliesTo || rule.appliesTo(ctx));
}

/**
 * A link to the findings behind something. `from` tells the evidence screen
 * where its Back button goes when there's no history to return through — a
 * link opened fresh, or the app reopened on that screen.
 */
export function evidenceHref(findings: string[], from?: "why" | "settings", rule?: string): string {
  const back = from ? `&from=${from}${rule ? `&rule=${rule}` : ""}` : "";
  return `/evidence?ids=${findings.join(",")}${back}`;
}
