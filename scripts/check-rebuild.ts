/**
 * Changing settings rebuilds the plan, and that mustn't throw away progress:
 * movements that stay keep their weights (converted if the rep range changed),
 * bodyweight and cardio work keep their reps and durations, a harder variation
 * someone earned survives, and anything the new equipment can't do is gone.
 * Run with: npm run check:rebuild
 */
import { generatePlan, rebuildPlan } from "../src/lib/plan/generate";
import { EXERCISES_BY_ID } from "../src/lib/exercises";
import { affectsPlan } from "../src/lib/profile-changes";
import { EMPTY_ONBOARDING, type OnboardingData } from "../src/lib/types";
import type { GeneratorProfile, Plan, PlannedExercise } from "../src/lib/plan/types";

let failures = 0;
function expect(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label.padEnd(56)} ${JSON.stringify(actual)}`);
}

const all = (plan: Plan): PlannedExercise[] => plan.sessions.flatMap((s) => s.exercises);

function mapExercises(plan: Plan, fn: (e: PlannedExercise) => PlannedExercise): Plan {
  return { ...plan, sessions: plan.sessions.map((s) => ({ ...s, exercises: s.exercises.map(fn) })) };
}

const gym: GeneratorProfile = {
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

// Every lift trained at 40 kg.
const before = mapExercises(generatePlan(gym), (e) => (e.unit === "weight_reps" ? { ...e, targetWeightKg: 40 } : e));
const beforeIds = new Set(all(before).map((e) => e.exerciseId));

console.log("\nNothing changed\n");
const same = rebuildPlan(before, gym);
expect("same exercises", all(same).map((e) => e.exerciseId), all(before).map((e) => e.exerciseId));
expect("same weights", all(same).map((e) => e.targetWeightKg), all(before).map((e) => e.targetWeightKg));

console.log("\nFewer days, same goal\n");
const fewerDays = rebuildPlan(before, { ...gym, days: 3, trainingDays: ["mon", "wed", "fri"] });
const carried = all(fewerDays).filter((e) => e.unit === "weight_reps" && beforeIds.has(e.exerciseId));
expect("3 sessions", fewerDays.sessions.length, 3);
expect("lifts carried over", carried.length > 0, true);
expect("every carried lift keeps 40 kg", carried.every((e) => e.targetWeightKg === 40), true);

console.log("\nNew goal with a lower rep range\n");
const stronger = rebuildPlan(before, { ...gym, goal: "Get stronger" });
const compound = all(stronger).find(
  (e) => e.unit === "weight_reps" && beforeIds.has(e.exerciseId) && EXERCISES_BY_ID[e.exerciseId]?.compound
);
expect("a compound lift carried over", !!compound, true);
// 40 kg for 6-10 reps is about 43.5 kg for 4-6.
expect("its weight converted for fewer reps", compound?.targetWeightKg, 43.5);

console.log("\nEquipment removed\n");
const noBarbell = rebuildPlan(before, { ...gym, equipment: gym.equipment.filter((e) => e !== "barbell") });
expect(
  "no barbell movements left",
  all(noBarbell).some((e) => EXERCISES_BY_ID[e.exerciseId]?.equipment.includes("barbell")),
  false
);

console.log("\nA harder bodyweight variation they earned\n");
const home: GeneratorProfile = {
  ...gym,
  experience: "I'm new to training",
  equipment: ["bodyweight", "mat"],
  days: 3,
  length: 30,
  trainingDays: ["mon", "wed", "fri"],
};
const homePlan = generatePlan(home);
const rung = all(homePlan).find((e) => {
  const harder = EXERCISES_BY_ID[EXERCISES_BY_ID[e.exerciseId]?.harder ?? ""];
  return e.unit === "reps" && !!harder && harder.equipment.every((q) => q === "bodyweight" || q === "mat");
});
expect("sample plan has a bodyweight ladder", !!rung, true);
if (rung) {
  const harderId = EXERCISES_BY_ID[rung.exerciseId].harder!;
  const promoted = mapExercises(homePlan, (e) =>
    e.exerciseId === rung.exerciseId ? { ...e, exerciseId: harderId, repMin: 5, repMax: 8, streak: 1 } : e
  );
  const longer = rebuildPlan(promoted, { ...home, length: 45 });
  const kept = all(longer).find((e) => e.exerciseId === harderId);
  expect(`${EXERCISES_BY_ID[harderId].name} stays in the plan`, !!kept, true);
  expect("with its reps and streak", kept ? [kept.repMin, kept.repMax, kept.streak] : null, [5, 8, 1]);
}

console.log("\nCardio duration\n");
const endurance: GeneratorProfile = { ...home, goal: "Improve endurance" };
const cardioPlan = generatePlan(endurance);
const cardio = all(cardioPlan).find((e) => e.unit === "time" || e.unit === "distance");
expect("sample plan has cardio", !!cardio, true);
if (cardio) {
  const stretched = mapExercises(cardioPlan, (e) => (e.exerciseId === cardio.exerciseId ? { ...e, seconds: 2400 } : e));
  const moved = rebuildPlan(stretched, { ...endurance, trainingDays: ["tue", "thu", "sat"] });
  const copies = all(moved).filter((e) => e.exerciseId === cardio.exerciseId);
  expect("keeps its longer duration", copies.length > 0 && copies.every((e) => e.seconds === 2400), true);
}

console.log("\nWhich changes rebuild the plan\n");
const answers: OnboardingData = {
  ...EMPTY_ONBOARDING,
  goal: "Build muscle",
  days: 3,
  equipment: ["dumbbell", "bench"],
  trainingDays: ["mon", "wed", "fri"],
  healthConsent: true,
};
expect("bodyweight alone doesn't", affectsPlan(answers, { ...answers, bodyweightKg: 80 }), false);
expect("injury notes do", affectsPlan(answers, { ...answers, considerations: "sore knee" }), true);
expect(
  "injury notes without consent don't",
  affectsPlan({ ...answers, healthConsent: false }, { ...answers, healthConsent: false, considerations: "sore knee" }),
  false
);
expect("same equipment in another order doesn't", affectsPlan(answers, { ...answers, equipment: ["bench", "dumbbell"] }), false);
expect("more days do", affectsPlan(answers, { ...answers, days: 4, trainingDays: ["mon", "tue", "thu", "fri"] }), true);

console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} failure(s).\n`);
process.exit(failures === 0 ? 0 : 1);
