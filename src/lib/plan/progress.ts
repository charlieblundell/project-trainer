import { EXERCISES_BY_ID, type Equipment, type ExerciseDef } from "@/lib/exercises";
import type { SetLog } from "@/lib/types";
import type { Plan, PlannedExercise, PlannedSession } from "./types";
import { isLowReadiness, type Readiness } from "./readiness";

export type ChangeKind =
  | "calibrated"
  | "increase"
  | "hold"
  | "add_reps"
  | "harder_variant"
  | "deload"
  | "longer";

export type Change = {
  exerciseId: string;
  exerciseName: string;
  kind: ChangeKind;
  /** Plain-language explanation, shown to the user. */
  reason: string;
  next: PlannedExercise;
};

/** Barbell squats and deadlifts move in bigger jumps than a lateral raise. */
function incrementFor(def: ExerciseDef | undefined): number {
  if (!def) return 2.5;
  if (!def.compound) return 2.5;
  const bigLift =
    def.equipment.includes("barbell") && (def.pattern === "squat" || def.pattern === "hinge");
  return bigLift ? 5 : 2.5;
}

function averageRpe(rpe: number | undefined): number | null {
  return typeof rpe === "number" ? rpe : null;
}

function roundToHalfKg(kg: number): number {
  return Math.round(kg * 2) / 2;
}

/**
 * Double progression: work up the rep range at a given weight, then add weight
 * and drop back to the bottom of the range. Effort rating gates the increase,
 * so scraping through at maximum effort holds rather than advances.
 */
function progressWeighted(
  planned: PlannedExercise,
  def: ExerciseDef | undefined,
  sets: SetLog[],
  rpe: number | null,
  lowReadiness = false
): Change {
  const name = def?.name ?? planned.exerciseId;
  const repMin = planned.repMin ?? 8;
  const repMax = planned.repMax ?? 12;
  const loggedWeight = roundToHalfKg(
    sets.reduce((sum, s) => sum + s.w, 0) / Math.max(sets.length, 1)
  );
  const worstReps = Math.min(...sets.map((s) => s.r));

  // First time on this movement: whatever they worked up to becomes the target.
  if (planned.targetWeightKg == null) {
    return {
      exerciseId: planned.exerciseId,
      exerciseName: name,
      kind: "calibrated",
      reason: `Starting weight set at ${loggedWeight} kg.`,
      next: { ...planned, targetWeightKg: loggedWeight },
    };
  }

  const hitTopOfRange = worstReps >= repMax;
  const belowRange = worstReps < repMin;
  const struggling = rpe !== null && rpe >= 9.5;

  if (hitTopOfRange && !struggling) {
    const step = incrementFor(def);
    const nextWeight = roundToHalfKg(loggedWeight + step);
    return {
      exerciseId: planned.exerciseId,
      exerciseName: name,
      kind: "increase",
      reason: `${repMax} reps on every set at ${loggedWeight} kg, so up to ${nextWeight} kg.`,
      next: { ...planned, targetWeightKg: nextWeight },
    };
  }

  if (hitTopOfRange && struggling) {
    return {
      exerciseId: planned.exerciseId,
      exerciseName: name,
      kind: "hold",
      reason: `You got the reps but it was near maximal, so staying at ${loggedWeight} kg.`,
      next: { ...planned, targetWeightKg: loggedWeight },
    };
  }

  // On a day they reported sleeping badly or being very sore, falling short is
  // expected, so it isn't held against the weight: the target simply holds.
  if (belowRange && lowReadiness) {
    return {
      exerciseId: planned.exerciseId,
      exerciseName: name,
      kind: "hold",
      reason: `A tough day by your check-in, so your target stays at ${planned.targetWeightKg} kg rather than dropping.`,
      next: planned,
    };
  }

  // Well short of the target range suggests the weight itself is too heavy.
  if (belowRange && worstReps < repMin * 0.6) {
    const nextWeight = roundToHalfKg(loggedWeight * 0.9);
    return {
      exerciseId: planned.exerciseId,
      exerciseName: name,
      kind: "deload",
      reason: `${worstReps} reps was well short of ${repMin}, so dropping to ${nextWeight} kg to rebuild.`,
      next: { ...planned, targetWeightKg: nextWeight },
    };
  }

  return {
    exerciseId: planned.exerciseId,
    exerciseName: name,
    kind: "hold",
    reason: `Staying at ${loggedWeight} kg — aim for ${repMax} reps next time.`,
    next: { ...planned, targetWeightKg: loggedWeight },
  };
}

/**
 * Bodyweight work can't add plates, so it progresses by reps until the range is
 * beaten, then by moving up the ladder to a harder variation.
 */
function progressBodyweight(
  planned: PlannedExercise,
  def: ExerciseDef | undefined,
  sets: SetLog[],
  owned: Equipment[]
): Change {
  const name = def?.name ?? planned.exerciseId;
  const repMin = planned.repMin ?? 8;
  const repMax = planned.repMax ?? 12;
  const worstReps = Math.min(...sets.map((s) => s.r));
  const streak = (planned.streak ?? 0) + 1;

  // Past this, more reps stops being useful training and the movement has been
  // outgrown — but only harder variations or equipment can fix that.
  const REP_CEILING = 20;
  // Two clean sessions before a variation jump: these are large steps, and one
  // good day is noise.
  const SESSIONS_BEFORE_HARDER = 2;

  if (worstReps < repMax) {
    return {
      exerciseId: planned.exerciseId,
      exerciseName: name,
      kind: "hold",
      reason: `Keep working toward ${repMax} reps.`,
      next: { ...planned, streak: 0 },
    };
  }

  const harderId = def?.harder;
  const harder = harderId ? EXERCISES_BY_ID[harderId] : undefined;
  const set = new Set<Equipment>([...owned, "bodyweight"]);
  const reachable = harder && harder.equipment.every((req) => set.has(req));

  if (harder && reachable) {
    if (streak < SESSIONS_BEFORE_HARDER) {
      return {
        exerciseId: planned.exerciseId,
        exerciseName: name,
        kind: "hold",
        reason: `${repMax} reps — one more session like that and you move up to ${harder.name}.`,
        next: { ...planned, streak },
      };
    }
    return {
      exerciseId: planned.exerciseId,
      exerciseName: name,
      kind: "harder_variant",
      reason: `Two clean sessions at ${repMax} reps, so you're moving up to ${harder.name}.`,
      next: {
        ...planned,
        exerciseId: harder.id,
        repMin: Math.max(3, Math.round(repMin * 0.5)),
        repMax: Math.max(5, Math.round(repMax * 0.5)),
        streak: 0,
      },
    };
  }

  if (repMax >= REP_CEILING) {
    return {
      exerciseId: planned.exerciseId,
      exerciseName: name,
      kind: "hold",
      reason: `You've outgrown this one at ${repMax} reps — a harder version needs equipment you don't have yet.`,
      next: { ...planned, streak: 0 },
    };
  }

  return {
    exerciseId: planned.exerciseId,
    exerciseName: name,
    kind: "add_reps",
    reason: `Comfortable at ${repMax} reps, so the target goes to ${repMax + 2}.`,
    next: { ...planned, repMin: repMin + 2, repMax: repMax + 2, streak: 0 },
  };
}

function progressTimed(planned: PlannedExercise, def: ExerciseDef | undefined, sets: SetLog[]): Change {
  const name = def?.name ?? planned.exerciseId;
  const targetMinutes = Math.round((planned.seconds ?? 0) / 60);
  const loggedMinutes = Math.max(...sets.map((s) => s.r));

  if (loggedMinutes >= targetMinutes) {
    // Cardio grows in useful chunks; a plank grows in seconds.
    const step = def?.pattern === "conditioning" ? 300 : 15;
    const nextSeconds = (planned.seconds ?? 0) + step;
    return {
      exerciseId: planned.exerciseId,
      exerciseName: name,
      kind: "longer",
      reason: `Completed ${loggedMinutes} min, so next time is ${Math.round(nextSeconds / 60)} min.`,
      next: { ...planned, seconds: nextSeconds },
    };
  }

  return {
    exerciseId: planned.exerciseId,
    exerciseName: name,
    kind: "hold",
    reason: `Building toward ${targetMinutes} min.`,
    next: planned,
  };
}

/**
 * Applies one session's results to the plan, returning the updated plan and a
 * plain-language list of what changed.
 */
export function applyProgression(
  plan: Plan,
  sessionId: string,
  loggedSets: Record<string, SetLog[]>,
  rpeValues: Record<string, number>,
  owned: Equipment[],
  readiness: Readiness | null = null
): { plan: Plan; changes: Change[] } {
  const changes: Change[] = [];

  const sessions: PlannedSession[] = plan.sessions.map((session) => {
    if (session.id !== sessionId) return session;

    const exercises = session.exercises.map((planned) => {
      const sets = loggedSets[planned.exerciseId] ?? [];
      if (sets.length === 0) return planned;

      const def = EXERCISES_BY_ID[planned.exerciseId];
      const rpe = averageRpe(rpeValues[planned.exerciseId]);

      let change: Change;
      if (planned.unit === "weight_reps") {
        change = progressWeighted(planned, def, sets, rpe, isLowReadiness(readiness));
      } else if (planned.unit === "reps") {
        change = progressBodyweight(planned, def, sets, owned);
      } else {
        change = progressTimed(planned, def, sets);
      }

      changes.push(change);
      return change.next;
    });

    return { ...session, exercises };
  });

  return { plan: { ...plan, sessions }, changes };
}
