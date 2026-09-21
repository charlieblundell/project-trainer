import { EXERCISES_BY_ID } from "@/lib/exercises";
import { BALANCE_IDS, experienceToLevel, rebuildPlan } from "./generate";
import { isHandEdited } from "./edit";
import { MUSCLE_GROUPS, setsByGroup, type MuscleGroup } from "./volume";
import type { GeneratorProfile, Plan } from "./types";

/*
 * Offering an existing plan the current rules.
 *
 * The rules for building a week improved after people already had plans, and
 * those plans don't change on their own — which is right: nobody should open
 * the app mid-week to find different exercises they didn't ask for. So the
 * better version is offered, with what changes and why, and taken only if
 * they say yes. Every weight they've built carries over.
 *
 * Bump this whenever the building rules change enough to be worth offering
 * again; it's what lets a dismissed offer come back for a new improvement
 * without nagging about the old one.
 */
export const PLAN_RULES_VERSION = 3;

/** The share of their loaded sets a rebuilt plan has to keep to be offered. */
const LIGHTEST_ACCEPTED = 0.8;

export type SessionChange = {
  name: string;
  added: string[];
  removed: string[];
};

export type PlanUpgrade = {
  next: Plan;
  /** The two or three changes that matter most, in plain words. */
  highlights: string[];
  sessions: SessionChange[];
};

const MUSCLE_NAMES: Record<MuscleGroup, string> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  quads: "Quads",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  biceps: "Biceps",
  triceps: "Triceps",
  calves: "Calves",
};

/**
 * What a person calls it. An id the library no longer knows — a renamed or
 * retired movement in an old plan — still reads as words, never as a slug.
 */
const nameOf = (id: string) =>
  EXERCISES_BY_ID[id]?.name ??
  id
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

/**
 * The better plan and what changes, or null when there's nothing worth
 * offering: a plan someone built or edited by hand is theirs, and a plan that
 * already follows the current rules has nothing to gain.
 */
export function planUpgrade(current: Plan, profile: GeneratorProfile): PlanUpgrade | null {
  // Someone who wrote their own week wrote it on purpose.
  if (isHandEdited(current)) return null;

  /*
   * The profile says less experience than the plan was built for. Either it
   * was edited down or it doesn't describe them properly, and in both cases a
   * rebuild would hand a trained lifter a beginner's week and call it better.
   */
  if (experienceToLevel(profile.experience) < current.level) return null;

  const next = rebuildPlan(current, profile, { preferCurrent: false });

  /*
   * An improvement never takes the barbell away from someone who lifts with
   * one. Swapping a kettlebell press for a barbell press is a real upgrade; a
   * rebuild that loses the barbell entirely is working from a profile that
   * doesn't match how they train, and accepting it would swap squats and bench
   * press for bodyweight work.
   */
  const usesBarbell = (plan: Plan) =>
    plan.sessions
      .flatMap((s) => s.exercises)
      .some((e) => e.unit === "weight_reps" && EXERCISES_BY_ID[e.exerciseId]?.equipment.includes("barbell"));
  if (usesBarbell(current) && !usesBarbell(next)) return null;

  /*
   * Nor does it make the week much lighter. Counted in loaded sets rather than
   * exercises, and with some give: an older lifter's twelve exercises becoming
   * eight, with a few minutes handed to balance work, is a little less lifting
   * and a much better plan, and the strict count refused exactly the people
   * who needed it. A rebuild onto bodyweight loses nearly all of it, and is
   * still refused.
   */
  const loadedSets = (plan: Plan) =>
    plan.sessions
      .flatMap((s) => s.exercises)
      .filter((e) => e.unit === "weight_reps")
      .reduce((sum, e) => sum + e.sets, 0);
  if (loadedSets(next) < loadedSets(current) * LIGHTEST_ACCEPTED) return null;

  const before = setsByGroup(current.sessions.flatMap((s) => s.exercises));
  const after = setsByGroup(next.sessions.flatMap((s) => s.exercises));

  const diff = (oldIds: Set<string>, newIds: Set<string>) => ({
    added: [...newIds].filter((id) => !oldIds.has(id)).map(nameOf),
    removed: [...oldIds].filter((id) => !newIds.has(id)).map(nameOf),
  });
  const idsOf = (plan: Plan) => new Set(plan.sessions.flatMap((s) => s.exercises.map((e) => e.exerciseId)));

  /*
   * Session by session when the sessions are the same ones. When the split
   * itself changes — Push and Legs becoming Full Body A and B — comparing by
   * position says a squat was added to one day and dropped from another, which
   * is true and useless. Then the honest comparison is the whole week.
   */
  const sameSplit =
    current.sessions.length === next.sessions.length &&
    next.sessions.every((s, i) => s.name === current.sessions[i]?.name);

  const sessions: SessionChange[] = sameSplit
    ? next.sessions.map((session, i) => ({
        name: session.name,
        ...diff(
          new Set(current.sessions[i].exercises.map((e) => e.exerciseId)),
          new Set(session.exercises.map((e) => e.exerciseId))
        ),
      }))
    : [{ name: `Your week: ${next.sessions.map((s) => s.name).join(", ")}`, ...diff(idsOf(current), idsOf(next)) }];

  const changedExercises = sessions.some((s) => s.added.length > 0 || s.removed.length > 0);

  // A muscle gaining real weekly work is the change worth leading with.
  const gains = MUSCLE_GROUPS.map((group) => ({ group, from: before[group], to: after[group] }))
    .filter(({ from, to }) => to - from >= 3)
    .sort((a, b) => b.to - b.from - (a.to - a.from));

  if (!changedExercises && gains.length === 0) return null;

  const round = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

  // For someone who needs it, balance work is the most important change of all.
  const hasBalance = (plan: Plan) =>
    plan.sessions.some((s) => s.exercises.some((e) => BALANCE_IDS.has(e.exerciseId)));
  const lead: string[] = [];
  if (hasBalance(next) && !hasBalance(current)) {
    lead.push("A short balance exercise in every session, which cuts the rate of falls");
  }
  // A cardio day's ankle drills are counted in reps, so it's the session's focus that says what it is.
  const strengthDays = (plan: Plan) => plan.sessions.filter((s) => s.focus !== "Conditioning").length;
  if (strengthDays(next) > strengthDays(current)) {
    lead.push(`Strength work on ${strengthDays(next)} days a week, up from ${strengthDays(current)}`);
  }

  const highlights = [
    ...lead,
    ...gains
      .slice(0, 3)
      .map(({ group, from, to }) =>
        from < 1
          ? `${MUSCLE_NAMES[group]} now get trained — ${round(to)} sets a week, up from none`
          : `${MUSCLE_NAMES[group]}: ${round(from)} → ${round(to)} sets a week`
      ),
  ].slice(0, 3);

  const longerRest = next.sessions.some((s) =>
    s.exercises.slice(0, 2).some((e, j) => {
      const was = current.sessions.find((c) => c.name === s.name)?.exercises[j];
      return was && e.exerciseId === was.exerciseId && e.restSeconds > was.restSeconds;
    })
  );
  if (longerRest && highlights.length < 3) highlights.push("Main lifts rest two minutes, so the next set isn't cut short");

  return { next, highlights, sessions };
}

/** Where a dismissal is remembered on this device, per rules version. */
export const upgradeDismissKey = (version = PLAN_RULES_VERSION) => `plan-upgrade-dismissed-v${version}`;
