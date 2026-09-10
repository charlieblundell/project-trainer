/**
 * Runs the accessory refresh several times over a generated plan, so it can be
 * checked that main lifts and their calibrated weights survive, that repeated
 * refreshes keep finding new work rather than toggling between two options,
 * and that a thin equipment list fails gracefully.
 * Run with: npm run preview:refresh
 */
import { generatePlan, refreshAccessories } from "../src/lib/plan/generate";
import { EXERCISES_BY_ID } from "../src/lib/exercises";
import type { GeneratorProfile, Plan } from "../src/lib/plan/types";

const ACCESSORY = new Set(["isolation", "core", "mobility"]);

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
  experience: "I'm new to training",
  equipment: ["bodyweight", "mat"],
  days: 3,
  length: 30,
  trainingDays: ["mon", "wed", "fri"],
};

/** Pretends every session has been trained, so weights are no longer null. */
function calibrate(plan: Plan): Plan {
  return {
    ...plan,
    sessions: plan.sessions.map((s) => ({
      ...s,
      exercises: s.exercises.map((e) =>
        e.unit === "weight_reps" ? { ...e, targetWeightKg: 40 } : e
      ),
    })),
  };
}

function print(plan: Plan) {
  for (const session of plan.sessions) {
    const lines = session.exercises.map((e) => {
      const def = EXERCISES_BY_ID[e.exerciseId];
      const tag = def && ACCESSORY.has(def.pattern) ? "  accessory" : "  MAIN";
      const weight = e.targetWeightKg == null ? "uncalibrated" : `${e.targetWeightKg} kg`;
      return `    ${tag.padEnd(11)} ${(def?.name ?? e.exerciseId).padEnd(26)} ${weight}`;
    });
    console.log(`  ${session.name} (${session.region}, ~${session.estMinutes} min)`);
    console.log(lines.join("\n"));
  }
}

function run(label: string, profile: GeneratorProfile, rounds: number) {
  console.log("\n" + "=".repeat(78));
  console.log(label);
  console.log("=".repeat(78));

  let plan = calibrate(generatePlan(profile));
  const mainsBefore = plan.sessions.flatMap((s) =>
    s.exercises
      .filter((e) => !ACCESSORY.has(EXERCISES_BY_ID[e.exerciseId]?.pattern ?? ""))
      .map((e) => `${e.exerciseId}@${e.targetWeightKg}`)
  );

  console.log("\nAs generated:");
  print(plan);

  const seen = new Set<string>();
  for (let round = 1; round <= rounds; round++) {
    const result = refreshAccessories(plan, profile);
    plan = result.plan;
    console.log(`\nRefresh ${round} — ${result.swapped.length} swapped:`);
    for (const s of result.swapped) {
      console.log(`    ${s.from} -> ${s.to}`);
      seen.add(s.to);
    }
    if (result.swapped.length === 0) console.log("    (nothing available)");
  }

  console.log("\nAfter all refreshes:");
  print(plan);

  const mainsAfter = plan.sessions.flatMap((s) =>
    s.exercises
      .filter((e) => !ACCESSORY.has(EXERCISES_BY_ID[e.exerciseId]?.pattern ?? ""))
      .map((e) => `${e.exerciseId}@${e.targetWeightKg}`)
  );

  const intact = JSON.stringify(mainsBefore) === JSON.stringify(mainsAfter);
  console.log(`\n  Main lifts and weights untouched: ${intact ? "yes" : "NO — BUG"}`);
  console.log(`  Distinct accessories seen across ${rounds} refreshes: ${seen.size}`);
  console.log(`  Retired list: ${plan.retired.length} remembered`);
}

run("Full gym, 4 days — repeated refreshes", gymProfile, 4);
run("Bodyweight at home, 3 days — thin pool", homeProfile, 4);
