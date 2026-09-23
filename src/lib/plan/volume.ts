import { EXERCISES_BY_ID, type ExerciseDef, type Level } from "@/lib/exercises";
import type { PlannedExercise } from "./types";

/*
 * Weekly volume: hard sets per muscle per week.
 *
 * This is the number the app's own evidence library rates most strongly for
 * building muscle, and until now the plan builder never counted it. It filled
 * sessions by movement pattern — a squat here, a press there — and whatever
 * volume fell out was what someone got. For a trained lifter on three days
 * that was zero sets for their hamstrings.
 */

export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "biceps"
  | "triceps"
  | "calves";

export const MUSCLE_GROUPS: MuscleGroup[] = [
  "chest",
  "back",
  "shoulders",
  "quads",
  "hamstrings",
  "glutes",
  "biceps",
  "triceps",
  "calves",
];

/** How the exercise library names muscles, folded into the groups volume is counted in. */
const GROUP_OF: Record<string, MuscleGroup> = {
  chest: "chest",
  "upper chest": "chest",
  lats: "back",
  "upper back": "back",
  back: "back",
  shoulders: "shoulders",
  "front delts": "shoulders",
  "side delts": "shoulders",
  "rear delts": "shoulders",
  quads: "quads",
  hamstrings: "hamstrings",
  glutes: "glutes",
  biceps: "biceps",
  triceps: "triceps",
  calves: "calves",
};

export function groupOf(muscle: string): MuscleGroup | undefined {
  return GROUP_OF[muscle.toLowerCase()];
}

/** The muscle a movement is mostly for, in volume terms. */
export function primaryGroup(def: ExerciseDef): MuscleGroup | undefined {
  return groupOf(def.muscles[0] ?? "");
}

/**
 * Sets a movement contributes to each group.
 *
 * The primary muscle gets the full set; every other listed muscle gets half.
 * That's the fractional counting the volume research itself uses: a bench
 * press is real triceps work, but calling it a full triceps set would let a
 * week of pressing hide the fact that triceps were never trained directly.
 */
export function contribution(def: ExerciseDef, sets: number): Partial<Record<MuscleGroup, number>> {
  const out: Partial<Record<MuscleGroup, number>> = {};
  def.muscles.forEach((muscle, i) => {
    const group = groupOf(muscle);
    if (!group) return;
    out[group] = (out[group] ?? 0) + sets * (i === 0 ? 1 : 0.5);
  });
  return out;
}

/**
 * Sets per group across a list of planned exercises. Timed work doesn't count,
 * and nor does mobility: arm circles are counted in reps, but they're not a
 * hard set for the shoulders, and counting them let a drill stand in for
 * shoulder training.
 */
export function setsByGroup(exercises: PlannedExercise[]): Record<MuscleGroup, number> {
  const totals = Object.fromEntries(MUSCLE_GROUPS.map((g) => [g, 0])) as Record<MuscleGroup, number>;
  for (const planned of exercises) {
    if (planned.unit === "time" || planned.unit === "distance") continue;
    const def = EXERCISES_BY_ID[planned.exerciseId];
    // Nor is a balance walk a set for the glutes, however it's counted.
    if (!def || def.pattern === "mobility" || def.pattern === "balance") continue;

    for (const [group, sets] of Object.entries(contribution(def, planned.sets))) {
      totals[group as MuscleGroup] += sets;
    }
  }
  return totals;
}

export type Range = { min: number; max: number };

/*
 * Weekly targets, by goal and experience.
 *
 * Building muscle aims for roughly 10–20 hard sets a muscle — the range the
 * dose-response research covers, where more is better but returns shrink.
 * Beginners grow on much less, and asking a new lifter for twenty sets of
 * anything mostly produces soreness and a skipped second week.
 *
 * Fat loss uses the same targets as building muscle, deliberately: the
 * library's finding is that continued resistance training is what protects
 * muscle in a deficit, so the lifting doesn't get lighter when the goal
 * changes.
 *
 * Small muscles get lower floors because the big compound lifts already train
 * them hard: biceps get pulled through every row, triceps through every press.
 */
const BIG = new Set<MuscleGroup>(["chest", "back", "quads", "hamstrings", "glutes"]);

const TARGETS: Record<string, { big: Range; small: Range; beginner: Range }> = {
  "Build muscle": { big: { min: 10, max: 20 }, small: { min: 6, max: 14 }, beginner: { min: 6, max: 12 } },
  "Lose fat": { big: { min: 10, max: 20 }, small: { min: 6, max: 14 }, beginner: { min: 6, max: 12 } },
  "Get stronger": { big: { min: 6, max: 14 }, small: { min: 4, max: 10 }, beginner: { min: 5, max: 10 } },
  "Improve fitness": { big: { min: 6, max: 12 }, small: { min: 4, max: 8 }, beginner: { min: 4, max: 8 } },
  "General health": { big: { min: 4, max: 10 }, small: { min: 2, max: 6 }, beginner: { min: 3, max: 8 } },
  "Improve endurance": { big: { min: 4, max: 8 }, small: { min: 2, max: 6 }, beginner: { min: 3, max: 6 } },
};

export function weeklyTarget(goal: string, level: Level, group: MuscleGroup): Range {
  const table = TARGETS[goal] ?? TARGETS["Build muscle"];
  if (level === 1) {
    // Beginners' small muscles still get something, just less.
    return BIG.has(group) ? table.beginner : { min: Math.max(2, table.beginner.min - 2), max: table.beginner.max - 2 };
  }
  return BIG.has(group) ? table.big : table.small;
}

/** Calves are trained, but a plan that's short on time drops them before it drops anything else. */
export function isLowPriority(group: MuscleGroup): boolean {
  return group === "calves";
}
