/**
 * The "Why these numbers?" sheet, checked against real plans: every lifting
 * exercise gets an explanation, every finding it cites exists, and the
 * numbers it states are the ones the plan actually prescribes.
 *
 * Run with: npm run check:why
 */
import { FINDINGS_BY_ID } from "../src/lib/evidence";
import { EXERCISES_BY_ID } from "../src/lib/exercises";
import { experienceToLevel, generatePlan } from "../src/lib/plan/generate";
import { whyTheseNumbers } from "../src/lib/plan/why";
import type { GeneratorProfile } from "../src/lib/plan/types";

let problems = 0;
function expect(label: string, ok: boolean) {
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label}`);
  if (!ok) problems += 1;
}

const base: GeneratorProfile = {
  goal: "Build muscle",
  experience: "I've been training for a while",
  days: 3,
  length: 60,
  equipment: ["barbell", "dumbbell", "bench", "cable", "machine", "pullup_bar"],
  likedExercises: [],
  dislikedExercises: [],
  trainingDays: ["mon", "wed", "fri"],
  considerations: null,
  age: 30,
} as GeneratorProfile;

const CASES: { label: string; profile: GeneratorProfile }[] = [
  { label: "Build muscle, an hour", profile: base },
  { label: "Build muscle, 45 minutes", profile: { ...base, length: 45 } },
  { label: "Get stronger", profile: { ...base, goal: "Get stronger" } },
  { label: "Lose fat, beginner", profile: { ...base, goal: "Lose fat", experience: "I'm new to training" } },
  { label: "General health, bands", profile: { ...base, goal: "General health", equipment: ["bands", "bodyweight", "mat"] } },
];

for (const { label, profile } of CASES) {
  console.log(`\n${label}\n`);
  const plan = generatePlan(profile);
  const ctx = { plan, goal: plan.goal, level: plan.level ?? experienceToLevel(profile.experience) };
  const lifts = plan.sessions
    .flatMap((s) => s.exercises)
    .filter((e) => e.unit !== "time" && e.unit !== "distance" && EXERCISES_BY_ID[e.exerciseId]?.pattern !== "mobility");

  const all = lifts.map((e) => ({ e, reasons: whyTheseNumbers(e, ctx) }));
  expect("every lift is explained", all.every(({ reasons }) => reasons.length >= 3));
  expect(
    "every cited finding exists",
    all.every(({ reasons }) => reasons.every((r) => r.findings.every((id) => !!FINDINGS_BY_ID[id])))
  );
  expect(
    "the sets it states are the plan's",
    all.every(({ e, reasons }) => {
      const sets = reasons.find((r) => r.label === "Sets");
      return !sets || sets.value === `${e.sets} sets`;
    })
  );
  expect(
    "it explains the rest the plan actually gives",
    all.every(({ e, reasons }) => e.restSeconds === 0 || reasons.some((r) => r.label === "Rest"))
  );
}

console.log(problems === 0 ? "\nAll checks passed.\n" : `\n${problems} problem(s).\n`);
process.exit(problems === 0 ? 0 : 1);
