import { EXERCISES_BY_ID } from "@/lib/exercises";
import { WEEKDAY_LABELS } from "./helpers";
import { MUSCLE_GROUPS, setsByGroup } from "./volume";
import type { Plan, PlannedExercise } from "./types";

/*
 * What a settings change actually does to someone's plan, in plain words.
 *
 * "Saving rebuilds your plan" told people something would happen but not
 * what, so changing a goal or joining a gym felt like a leap in the dark.
 * This compares the plan they have with the one they'd get, before they save
 * and again after, so the change is never a surprise.
 */

export type PlanChanges = {
  /** Two to five lines on what changes, most important first. */
  lines: string[];
  added: string[];
  removed: string[];
};

const nameOf = (id: string) => EXERCISES_BY_ID[id]?.name ?? id;

const round = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

const shortDay = (day: keyof typeof WEEKDAY_LABELS) => WEEKDAY_LABELS[day].slice(0, 3);

const lifts = (plan: Plan) =>
  plan.sessions.flatMap((s) => s.exercises).filter((e) => e.unit !== "time" && e.unit !== "distance");

/** The rep range and rest on the first main lift, which is what a goal change moves. */
function mainLift(plan: Plan): PlannedExercise | undefined {
  return lifts(plan).find((e) => EXERCISES_BY_ID[e.exerciseId]?.compound && e.repMin != null);
}

const averageMinutes = (plan: Plan) =>
  plan.sessions.length ? Math.round(plan.sessions.reduce((sum, s) => sum + s.estMinutes, 0) / plan.sessions.length) : 0;

export function planChanges(before: Plan, after: Plan): PlanChanges {
  const lines: string[] = [];

  const shape = (plan: Plan) => plan.sessions.map((s) => s.name).join(", ");
  if (before.sessions.length !== after.sessions.length || shape(before) !== shape(after)) {
    lines.push(
      `Your week: ${before.sessions.length} sessions (${shape(before)}) becomes ${after.sessions.length} (${shape(after)})`
    );
  } else {
    const days = (plan: Plan) => plan.sessions.map((s) => shortDay(s.weekday)).join(", ");
    if (days(before) !== days(after)) lines.push(`Training days: ${days(before)} becomes ${days(after)}`);
  }

  const minutesBefore = averageMinutes(before);
  const minutesAfter = averageMinutes(after);
  if (Math.abs(minutesAfter - minutesBefore) >= 5) {
    lines.push(`Sessions: about ${minutesBefore} min becomes about ${minutesAfter} min`);
  }

  const liftBefore = mainLift(before);
  const liftAfter = mainLift(after);
  if (liftBefore && liftAfter) {
    const reps = (e: PlannedExercise) => `${e.repMin}–${e.repMax} reps`;
    if (reps(liftBefore) !== reps(liftAfter) || liftBefore.restSeconds !== liftAfter.restSeconds) {
      const rest = (e: PlannedExercise) => (e.restSeconds >= 60 ? `${round(e.restSeconds / 60)} min` : `${e.restSeconds} s`);
      lines.push(
        `Main lifts: ${reps(liftBefore)}, ${rest(liftBefore)} rest becomes ${reps(liftAfter)}, ${rest(liftAfter)} rest`
      );
    }
  }

  // The muscles whose weekly sets move by two or more, biggest change first.
  const setsBefore = setsByGroup(before.sessions.flatMap((s) => s.exercises));
  const setsAfter = setsByGroup(after.sessions.flatMap((s) => s.exercises));
  const moved = MUSCLE_GROUPS.map((g) => ({ g, from: setsBefore[g], to: setsAfter[g] }))
    .filter(({ from, to }) => Math.abs(to - from) >= 2)
    .sort((a, b) => Math.abs(b.to - b.from) - Math.abs(a.to - a.from))
    .slice(0, 3);
  for (const { g, from, to } of moved) {
    const muscle = g.charAt(0).toUpperCase() + g.slice(1);
    lines.push(`${muscle}: ${round(from)} sets a week becomes ${round(to)}`);
  }

  const ids = (plan: Plan) => new Set(plan.sessions.flatMap((s) => s.exercises.map((e) => e.exerciseId)));
  const was = ids(before);
  const now = ids(after);
  const added = [...now].filter((id) => !was.has(id)).map(nameOf);
  const removed = [...was].filter((id) => !now.has(id)).map(nameOf);

  return { lines: lines.slice(0, 5), added, removed };
}

export function hasChanges(changes: PlanChanges): boolean {
  return changes.lines.length > 0 || changes.added.length > 0 || changes.removed.length > 0;
}
