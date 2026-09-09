/**
 * Simulates several weeks of training against a generated plan so progression
 * can be checked without logging workouts by hand.
 * Run with: npm run preview:progression
 */
import { generatePlan } from "../src/lib/plan/generate";
import { applyProgression } from "../src/lib/plan/progress";
import { EXERCISES_BY_ID, type Equipment } from "../src/lib/exercises";
import type { GeneratorProfile, PlannedExercise } from "../src/lib/plan/types";
import type { SetLog } from "../src/lib/types";

type Performer = {
  label: string;
  /** Reps achieved, given the prescribed range. */
  reps: (ex: PlannedExercise) => number;
  rpe: number;
};

const PERFORMERS: Performer[] = [
  { label: "Hits the top of the range every time, feels easy", reps: (ex) => ex.repMax ?? 10, rpe: 7 },
  { label: "Hits the top of the range but at maximum effort", reps: (ex) => ex.repMax ?? 10, rpe: 10 },
  { label: "Lands mid-range", reps: (ex) => Math.round(((ex.repMin ?? 8) + (ex.repMax ?? 12)) / 2), rpe: 8 },
  { label: "Badly short of the target", reps: (ex) => Math.max(1, Math.floor((ex.repMin ?? 8) * 0.4)), rpe: 10 },
];

const gymProfile: GeneratorProfile = {
  goal: "Build muscle",
  experience: "I've been training a while",
  days: 4,
  length: 60,
  equipment: ["barbell", "dumbbell", "bench", "pullup_bar", "cable", "machine", "squat_rack"],
  likedExercises: [],
  dislikedExercises: [],
  trainingDays: ["mon", "tue", "thu", "fri"],
  considerations: null,
  age: 34,
};

const homeProfile: GeneratorProfile = {
  ...gymProfile,
  goal: "Build muscle",
  experience: "I'm new to training",
  equipment: ["bodyweight", "mat"],
  days: 3,
  length: 30,
  trainingDays: ["mon", "wed", "fri"],
};

function simulate(label: string, profile: GeneratorProfile, performer: Performer, weeks: number) {
  console.log("\n" + "=".repeat(78));
  console.log(`${label}\n  performer: ${performer.label}`);
  console.log("=".repeat(78));

  let plan = generatePlan(profile);
  const sessionId = plan.sessions[0].id;
  const tracked = plan.sessions[0].exercises.slice(0, 3).map((e) => e.exerciseId);

  const show = (week: number) => {
    const session = plan.sessions.find((s) => s.id === sessionId)!;
    const line = session.exercises
      .slice(0, 3)
      .map((ex) => {
        const name = EXERCISES_BY_ID[ex.exerciseId]?.name ?? ex.exerciseId;
        const target =
          ex.unit === "weight_reps"
            ? `${ex.targetWeightKg ?? "?"}kg x ${ex.repMin}-${ex.repMax}`
            : `${ex.repMin}-${ex.repMax} reps`;
        return `${name} ${target}`;
      })
      .join("   |   ");
    console.log(`  week ${week}: ${line}`);
  };

  show(1);

  for (let week = 1; week <= weeks; week++) {
    const session = plan.sessions.find((s) => s.id === sessionId)!;
    const loggedSets: Record<string, SetLog[]> = {};
    const rpe: Record<string, number> = {};

    for (const ex of session.exercises) {
      const weight = ex.targetWeightKg ?? (ex.unit === "weight_reps" ? 40 : 0);
      loggedSets[ex.exerciseId] = Array.from({ length: ex.sets }, () => ({
        w: weight,
        r: ex.unit === "time" || ex.unit === "distance"
          ? Math.round((ex.seconds ?? 0) / 60)
          : performer.reps(ex),
      }));
      rpe[ex.exerciseId] = performer.rpe;
    }

    const result = applyProgression(plan, sessionId, loggedSets, rpe, profile.equipment as Equipment[]);
    plan = result.plan;

    if (week === 1) {
      console.log("\n  first session's decisions:");
      for (const c of result.changes.filter((c) => tracked.includes(c.exerciseId))) {
        console.log(`    ${c.kind.padEnd(16)} ${c.reason}`);
      }
      console.log("");
    }
    show(week + 1);
  }
}

simulate("Full gym, build muscle", gymProfile, PERFORMERS[0], 4);
simulate("Full gym, build muscle", gymProfile, PERFORMERS[1], 3);
simulate("Full gym, build muscle", gymProfile, PERFORMERS[2], 3);
simulate("Full gym, build muscle", gymProfile, PERFORMERS[3], 3);
simulate("Home, nothing at all, beginner", homeProfile, PERFORMERS[0], 5);

console.log("");
