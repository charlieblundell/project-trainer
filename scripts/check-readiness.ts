/**
 * Checks the pre-workout check-in rules against the real progression code:
 * a tough day takes one set off (never below one, never on timed work), and
 * falling short on a tough day holds the weight instead of dropping it.
 * Run with: npm run check:readiness
 */
import { applyProgression } from "../src/lib/plan/progress";
import { adjustForReadiness, isLowReadiness, type Readiness } from "../src/lib/plan/readiness";
import type { Plan, PlannedExercise } from "../src/lib/plan/types";

let failures = 0;
function expect(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label.padEnd(60)} ${JSON.stringify(actual)}`);
}

const good: Readiness = { sleep: "good", soreness: "none", jointPain: "none" };
const badSleep: Readiness = { sleep: "poor", soreness: "none", jointPain: "none" };
const verySore: Readiness = { sleep: "ok", soreness: "lots", jointPain: "none" };
const bitSore: Readiness = { sleep: "ok", soreness: "some", jointPain: "mild" };

const bench: PlannedExercise = {
  exerciseId: "bench_press", unit: "weight_reps", sets: 4, repMin: 8, repMax: 12, restSeconds: 120, targetWeightKg: 50,
};

console.log("\nWhat counts as a tough day\n");
expect("bad sleep", isLowReadiness(badSleep), true);
expect("very sore", isLowReadiness(verySore), true);
expect("a bit sore with mild joint pain is not", isLowReadiness(bitSore), false);
expect("skipped / no check-in is not", isLowReadiness(null), false);

console.log("\nSets on a tough day\n");
expect("4 sets become 3", adjustForReadiness(bench, badSleep).sets, 3);
expect("1 set stays 1", adjustForReadiness({ ...bench, sets: 1 }, badSleep).sets, 1);
expect("timed work is left alone", adjustForReadiness({ ...bench, unit: "time", sets: 1, seconds: 1200 }, verySore).sets, 1);
expect("a good day changes nothing", adjustForReadiness(bench, good).sets, 4);

console.log("\nProgression on a tough day\n");
const plan = { sessions: [{ id: "s1", exercises: [bench] }] } as unknown as Plan;
const weightOf = (result: ReturnType<typeof applyProgression>) => result.plan.sessions[0].exercises[0].targetWeightKg;
const kindOf = (result: ReturnType<typeof applyProgression>) => result.changes[0]?.kind;

const wayShort = { bench_press: [{ w: 50, r: 4 }, { w: 50, r: 4 }] };
const normalDay = applyProgression(plan, "s1", wayShort, {}, ["barbell", "bench"], null);
expect("well short on a normal day drops the weight", [kindOf(normalDay), weightOf(normalDay)], ["deload", 45]);
const toughDay = applyProgression(plan, "s1", wayShort, {}, ["barbell", "bench"], badSleep);
expect("well short on a tough day holds the target", [kindOf(toughDay), weightOf(toughDay)], ["hold", 50]);

const topOfRange = { bench_press: [{ w: 50, r: 12 }, { w: 50, r: 12 }, { w: 50, r: 12 }] };
const strongToughDay = applyProgression(plan, "s1", topOfRange, { bench_press: 7 }, ["barbell", "bench"], verySore);
expect("a great session on a tough day still goes up", [kindOf(strongToughDay), weightOf(strongToughDay)], ["increase", 52.5]);

console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} failure(s).\n`);
process.exit(failures === 0 ? 0 : 1);
