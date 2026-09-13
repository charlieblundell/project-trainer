/**
 * The rules for building a week, enforced against real generated plans.
 *
 * Before these existed the builder filled sessions by movement pattern and
 * never counted what that added up to. A trained lifter on three days got no
 * hamstring work at all, a fat-loss plan had no leg training, and someone who
 * said they had an hour got 38 minutes. Every rule below is a finding the app
 * already shows its users.
 * Run with: npm run check:volume
 */
import { generatePlan } from "../src/lib/plan/generate";
import { EXERCISES_BY_ID, EQUIPMENT_BY_ENVIRONMENT, type Equipment } from "../src/lib/exercises";
import { MUSCLE_GROUPS, primaryGroup, setsByGroup, weeklyTarget } from "../src/lib/plan/volume";
import type { Plan } from "../src/lib/plan/types";

let failures = 0;
function expect(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label.padEnd(66)} ${JSON.stringify(actual)}`);
}

const gym = (EQUIPMENT_BY_ENVIRONMENT as Record<string, Equipment[]>)["Full gym"];

function build(goal: string, experience: string, days: number, length: number): Plan {
  return generatePlan({
    goal,
    experience,
    days,
    length,
    equipment: gym,
    likedExercises: [],
    dislikedExercises: [],
    trainingDays: [],
    considerations: null,
    age: 30,
  });
}

const TRAINED = "I've been training a while";
const weekly = (plan: Plan) => setsByGroup(plan.sessions.flatMap((s) => s.exercises));
const lifts = (plan: Plan) => plan.sessions.flatMap((s) => s.exercises).filter((e) => e.unit !== "time" && e.unit !== "distance");
const primaryOf = (id: string) => {
  const def = EXERCISES_BY_ID[id];
  return def ? primaryGroup(def) : undefined;
};

console.log("\nPush/Pull/Legs, trained, three days, an hour\n");
const ppl = build("Build muscle", TRAINED, 3, 60);
const pplWeek = weekly(ppl);
const [push, pull, legs] = ppl.sessions;

expect("it's a Push/Pull/Legs week", ppl.sessions.map((s) => s.name), ["Push", "Pull", "Legs"]);
for (const group of ["chest", "back", "shoulders", "quads", "hamstrings", "glutes"] as const) {
  expect(`${group} is trained`, pplWeek[group] > 0, true);
}
expect("hamstrings get real work, not a token set", pplWeek.hamstrings >= 8, true);
expect(
  "Legs day has a hamstring-led hinge",
  legs.exercises.some((e) => EXERCISES_BY_ID[e.exerciseId]?.pattern === "hinge" && primaryOf(e.exerciseId) === "hamstrings"),
  true
);
expect(
  "a trained lifter's main hinge isn't a kettlebell swing",
  legs.exercises.slice(0, 2).some((e) => e.exerciseId === "kb_swing"),
  false
);

console.log("\nEach session trains what it's for\n");
expect("no curls on Push day", push.exercises.some((e) => primaryOf(e.exerciseId) === "biceps"), false);
expect(
  "no pressing muscles on Pull day",
  pull.exercises.some((e) => ["chest", "triceps"].includes(primaryOf(e.exerciseId) ?? "")),
  false
);
expect("no upper body on Legs day", legs.exercises.some((e) => ["chest", "back", "biceps", "triceps"].includes(primaryOf(e.exerciseId) ?? "")), false);

console.log("\nThe time they gave is the time they get\n");
for (const session of ppl.sessions) {
  expect(`${session.name} uses most of the hour`, session.estMinutes >= 48, true);
  expect(`${session.name} doesn't run over`, session.estMinutes <= 60, true);
}

console.log("\nFilling adds work, not clutter\n");
for (const session of ppl.sessions) {
  const perGroup = new Map<string, number>();
  for (const e of session.exercises) {
    const g = primaryOf(e.exerciseId);
    if (g) perGroup.set(g, (perGroup.get(g) ?? 0) + 1);
  }
  expect(`${session.name}: no muscle gets more than three movements`, Math.max(...perGroup.values()) <= 3, true);
}
expect(
  "no beginner regressions handed to a trained lifter",
  lifts(ppl).some((e) => e.exerciseId === "scapular_pullup"),
  false
);
for (const group of MUSCLE_GROUPS) {
  expect(
    `${group} stays inside a sane weekly ceiling`,
    pplWeek[group] <= weeklyTarget("Build muscle", 2, group).max + 4,
    true
  );
}

console.log("\nRest follows the evidence\n");
const mainLifts = ppl.sessions.flatMap((s) => s.exercises.slice(0, 2));
expect("main lifts rest at least two minutes", mainLifts.every((e) => e.restSeconds >= 120), true);

console.log("\nFat loss keeps the lifting and adds conditioning\n");
const cut = build("Lose fat", TRAINED, 3, 45);
const cutWeek = weekly(cut);
expect("legs are still trained", cutWeek.quads > 0 && cutWeek.hamstrings > 0 && cutWeek.glutes > 0, true);
expect("no lifting day was swapped out", cut.sessions.map((s) => s.name), ["Push", "Pull", "Legs"]);
expect(
  "every lifting day ends with conditioning",
  cut.sessions.every((s) => s.exercises.some((e) => e.unit === "time")),
  true
);
expect(
  "the main lifts are the same heavy work as building muscle",
  cut.sessions[0].exercises[0].repMax,
  ppl.sessions[0].exercises[0].repMax
);

console.log("\nWhen the time can't hold the volume, it says so\n");
const short = build("Get stronger", TRAINED, 3, 30);
expect("a 30-minute plan still has its main lifts", short.sessions.every((s) => s.exercises.length >= 2), true);
expect(
  "and tells them what didn't fit",
  short.notes.some((n) => n.includes("don't have room")),
  true
);
expect("but a plan with room makes no such claim", build("Build muscle", TRAINED, 4, 60).notes.some((n) => n.includes("don't have room")), false);

console.log("\nBeginners aren't buried\n");
const beginner = build("Build muscle", "Brand new", 3, 45);
const beginnerWeek = weekly(beginner);
expect("a new lifter trains full body", beginner.sessions.every((s) => s.name.startsWith("Full Body")), true);
expect("and nothing is trained past a beginner's ceiling", MUSCLE_GROUPS.every((g) => beginnerWeek[g] <= weeklyTarget("Build muscle", 1, g).max + 4), true);

console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} failure(s).\n`);
process.exit(failures === 0 ? 0 : 1);
