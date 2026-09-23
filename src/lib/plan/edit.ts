import { EXERCISES_BY_ID } from "@/lib/exercises";
import type { Weekday } from "@/lib/types";
import { estimateMinutes, prescribe } from "./generate";
import { inferRegion } from "./normalize";
import type { Level } from "@/lib/exercises";
import type { Plan, PlannedExercise, PlannedSession } from "./types";

/*
 * Changing a plan by hand — for someone who already has a program, or who
 * wants the app's plan with their own tweaks. Every change here is permanent:
 * it rewrites the plan the app trains from, not just today's session.
 *
 * Pure functions returning a new plan, so the screens stay thin and the rules
 * (what a sensible number of sets is, which day a session lands on, how long
 * it takes) live in one place and can be checked.
 */

/** Limits on hand-typed numbers: wide enough for any real program, narrow enough to catch a slip. */
export const LIMITS = {
  sets: { min: 1, max: 12 },
  reps: { min: 1, max: 50 },
  restSeconds: { min: 0, max: 600 },
  minutes: { min: 1, max: 120 },
  holdSeconds: { min: 5, max: 600 },
  weightKg: { min: 0, max: 500 },
} as const;

function clamp(value: number, { min, max }: { min: number; max: number }): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/**
 * What a hand-typed box should hold once someone has finished with it.
 *
 * Clamping each keystroke instead makes the box impossible to use: clearing it
 * to type a new number reads as zero, snaps to the minimum, and whatever gets
 * typed next lands beside that. Half-typed and empty states have to survive
 * until the person moves on.
 *
 * Returns `previous` when there's nothing usable to commit, so an abandoned
 * edit leaves the plan as it was.
 */
export function commitTyped(
  raw: string,
  previous: number | null,
  limits: { min: number; max: number },
  allowEmpty = false
): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return allowEmpty ? null : previous;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return previous;

  return clamp(parsed, limits);
}

/** Rebuilds what the app works out for itself: how long a session takes, and which half of the body it trains. */
function settle(session: PlannedSession): PlannedSession {
  return {
    ...session,
    region: inferRegion(session),
    estMinutes: estimateMinutes(session.exercises),
  };
}

function mapSession(
  plan: Plan,
  sessionId: string,
  change: (session: PlannedSession) => PlannedSession
): Plan {
  return {
    ...plan,
    sessions: plan.sessions.map((session) => (session.id === sessionId ? settle(change(session)) : session)),
  };
}

function mapExercise(
  plan: Plan,
  sessionId: string,
  index: number,
  change: (exercise: PlannedExercise) => PlannedExercise
): Plan {
  return mapSession(plan, sessionId, (session) => ({
    ...session,
    exercises: session.exercises.map((exercise, i) => (i === index ? change(exercise) : exercise)),
  }));
}

/* ------------------------------------------------------------------ *
 * Sessions
 * ------------------------------------------------------------------ */

/** A plan with no sessions, for someone bringing their own program. */
export function emptyWeek(goal: string, level: Level): Plan {
  return {
    createdAt: new Date().toISOString(),
    goal,
    level,
    daysPerWeek: 0,
    refreshes: 0,
    retired: [],
    sessions: [],
    avoiding: [],
    notes: [],
  };
}

function newSessionId(plan: Plan): string {
  let n = plan.sessions.length + 1;
  while (plan.sessions.some((s) => s.id === `custom-${n}`)) n += 1;
  return `custom-${n}`;
}

/** The first day of the week nothing is on yet, so a new session doesn't land on an occupied day. */
export function firstFreeDay(plan: Plan): Weekday {
  const order: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  return order.find((day) => !plan.sessions.some((s) => s.weekday === day)) ?? "mon";
}

export function addSession(plan: Plan, name = "New session"): Plan {
  const session: PlannedSession = {
    id: newSessionId(plan),
    name,
    focus: "Your own session",
    weekday: firstFreeDay(plan),
    estMinutes: 0,
    region: "full",
    exercises: [],
  };
  return withDayCount({ ...plan, sessions: [...plan.sessions, session] });
}

export function removeSession(plan: Plan, sessionId: string): Plan {
  return withDayCount({ ...plan, sessions: plan.sessions.filter((s) => s.id !== sessionId) });
}

export function renameSession(plan: Plan, sessionId: string, name: string): Plan {
  const trimmed = name.trim().slice(0, 40);
  return mapSession(plan, sessionId, (session) => ({ ...session, name: trimmed || session.name }));
}

/**
 * Moves a session to another day. If that day is taken the two swap, because
 * the week shows one session per day and the other would otherwise vanish.
 */
export function moveSession(plan: Plan, sessionId: string, weekday: Weekday): Plan {
  const moving = plan.sessions.find((s) => s.id === sessionId);
  if (!moving) return plan;
  const occupant = plan.sessions.find((s) => s.weekday === weekday && s.id !== sessionId);

  return {
    ...plan,
    sessions: plan.sessions.map((session) => {
      if (session.id === sessionId) return { ...session, weekday };
      if (occupant && session.id === occupant.id) return { ...session, weekday: moving.weekday };
      return session;
    }),
  };
}

/** daysPerWeek follows the sessions, since the plan may no longer be the one the app wrote. */
function withDayCount(plan: Plan): Plan {
  return { ...plan, daysPerWeek: plan.sessions.length };
}

/* ------------------------------------------------------------------ *
 * Exercises
 * ------------------------------------------------------------------ */

/** Adds a movement with the sets and reps that suit the plan's goal. */
export function addExercise(plan: Plan, sessionId: string, exerciseId: string): Plan {
  const def = EXERCISES_BY_ID[exerciseId];
  if (!def) return plan;
  return mapSession(plan, sessionId, (session) => ({
    ...session,
    exercises: [...session.exercises, prescribe(def, plan.goal)],
  }));
}

export function removeExercise(plan: Plan, sessionId: string, index: number): Plan {
  return mapSession(plan, sessionId, (session) => ({
    ...session,
    exercises: session.exercises.filter((_, i) => i !== index),
  }));
}

/** Moves an exercise up or down the session. Order is the order they're trained in. */
export function moveExercise(plan: Plan, sessionId: string, index: number, direction: -1 | 1): Plan {
  return mapSession(plan, sessionId, (session) => {
    const target = index + direction;
    if (target < 0 || target >= session.exercises.length) return session;
    const exercises = [...session.exercises];
    [exercises[index], exercises[target]] = [exercises[target], exercises[index]];
    return { ...session, exercises };
  });
}

export type ExercisePatch = {
  sets?: number;
  repMin?: number;
  repMax?: number;
  /** Minutes, for cardio — stored as seconds. */
  minutes?: number;
  /** Seconds, for a hold like a plank or a balance stand. */
  seconds?: number;
  restSeconds?: number;
  targetWeightKg?: number | null;
};

/** Applies hand-typed numbers, keeping them sane and keeping repMin under repMax. */
export function updateExercise(
  plan: Plan,
  sessionId: string,
  index: number,
  patch: ExercisePatch
): Plan {
  return mapExercise(plan, sessionId, index, (exercise) => {
    const next: PlannedExercise = { ...exercise };

    if (patch.sets !== undefined) next.sets = Math.round(clamp(patch.sets, LIMITS.sets));
    if (patch.restSeconds !== undefined) {
      next.restSeconds = Math.round(clamp(patch.restSeconds, LIMITS.restSeconds));
    }
    if (patch.minutes !== undefined) next.seconds = Math.round(clamp(patch.minutes, LIMITS.minutes)) * 60;
    if (patch.seconds !== undefined) next.seconds = Math.round(clamp(patch.seconds, LIMITS.holdSeconds));

    if (patch.targetWeightKg !== undefined) {
      next.targetWeightKg =
        patch.targetWeightKg === null ? null : clamp(patch.targetWeightKg, LIMITS.weightKg);
    }

    if (patch.repMin !== undefined) next.repMin = Math.round(clamp(patch.repMin, LIMITS.reps));
    if (patch.repMax !== undefined) next.repMax = Math.round(clamp(patch.repMax, LIMITS.reps));

    // A range that reads "10 to 6" is a typo, not an instruction.
    if (next.repMin !== undefined && next.repMax !== undefined && next.repMin > next.repMax) {
      if (patch.repMin !== undefined) next.repMax = next.repMin;
      else next.repMin = next.repMax;
    }

    return next;
  });
}

/** Swaps the movement while keeping the sets, reps and weight already set against the slot. */
export function replaceExercise(plan: Plan, sessionId: string, index: number, exerciseId: string): Plan {
  const def = EXERCISES_BY_ID[exerciseId];
  if (!def) return plan;
  return mapExercise(plan, sessionId, index, (exercise) => {
    const fresh = prescribe(def, plan.goal);
    const sameUnit = fresh.unit === exercise.unit;
    // A different kind of movement can't inherit numbers that don't apply to it.
    return sameUnit
      ? { ...exercise, exerciseId: def.id, unit: fresh.unit }
      : { ...fresh, sets: exercise.sets, restSeconds: exercise.restSeconds };
  });
}

/** True once a plan has been changed by hand, so screens can stop calling it "the plan we built". */
export function isHandEdited(plan: Plan): boolean {
  return plan.editedByHand === true || plan.sessions.some((session) => session.id.startsWith("custom-"));
}
