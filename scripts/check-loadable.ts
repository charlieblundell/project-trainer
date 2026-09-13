/**
 * Bodyweight movements that take added weight.
 *
 * A calf raise or a back extension is bodyweight because that's where you
 * start, not where you stay. Once someone holds a dumbbell the app has to
 * follow the weight rather than shove them up a variation ladder — and it has
 * to keep saying "+20 kg", because "20 kg" on a calf raise reads as the total.
 * Run with: npm run check:loadable
 */
import { EXERCISES, EXERCISES_BY_ID } from "../src/lib/exercises";
import { applyProgression } from "../src/lib/plan/progress";
import { targetLabel } from "../src/lib/plan/helpers";
import { normalizePlan } from "../src/lib/plan/normalize";
import type { Plan, PlannedExercise } from "../src/lib/plan/types";
import type { SetLog } from "../src/lib/types";

let failures = 0;
function expect(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label.padEnd(60)} ${JSON.stringify(actual)}`);
}

console.log("\nWhich movements are marked loadable\n");

const loadable = EXERCISES.filter((e) => e.loadable);
expect("the ones people actually load are marked", loadable.length > 20, true);
expect("calf raise takes weight", !!EXERCISES_BY_ID["calf_raise"]?.loadable, true);
expect("back extension takes weight", !!EXERCISES_BY_ID["back_extension_bw"]?.loadable, true);
expect("pull-up takes weight", !!EXERCISES_BY_ID["pullup"]?.loadable, true);

// Loading a jump or a skill progression changes the movement rather than
// advancing it, so these stay unloaded on purpose.
expect("jump squat doesn't", !!EXERCISES_BY_ID["jump_squat"]?.loadable, false);
expect("burpee doesn't", !!EXERCISES_BY_ID["burpee"]?.loadable, false);
expect("handstand push-up doesn't", !!EXERCISES_BY_ID["handstand_pushup"]?.loadable, false);
expect("every loadable movement is rep-counted", loadable.every((e) => e.unit === "reps"), true);

function planWith(exercise: PlannedExercise): Plan {
  return {
    createdAt: new Date().toISOString(),
    goal: "Build muscle",
    level: 2,
    daysPerWeek: 1,
    refreshes: 0,
    retired: [],
    avoiding: [],
    notes: [],
    sessions: [
      {
        id: "s1",
        name: "Legs",
        focus: "Lower Body",
        weekday: "mon",
        estMinutes: 30,
        region: "lower",
        exercises: [exercise],
      },
    ],
  };
}

const calfRaise: PlannedExercise = {
  exerciseId: "calf_raise",
  sets: 3,
  unit: "reps",
  repMin: 10,
  repMax: 12,
  restSeconds: 60,
  targetWeightKg: null,
};

const run = (exercise: PlannedExercise, sets: SetLog[]) =>
  applyProgression(planWith(exercise), "s1", { [exercise.exerciseId]: sets }, {}, ["dumbbell"]);

console.log("\nUnloaded, it still climbs the ladder it always did\n");
const unloaded = run(calfRaise, [
  { w: 0, r: 12 },
  { w: 0, r: 12 },
  { w: 0, r: 12 },
]);
// One clean session isn't enough to jump variation, so it holds and says why.
expect("a clean session points at the harder version", unloaded.changes[0].kind, "hold");
expect("and names it", unloaded.changes[0].reason.includes("Single-Leg"), true);
expect("no weight is invented", unloaded.plan.sessions[0].exercises[0].targetWeightKg, null);

const secondClean = run({ ...calfRaise, streak: 1 }, [
  { w: 0, r: 12 },
  { w: 0, r: 12 },
  { w: 0, r: 12 },
]);
expect("a second one moves up a variation", secondClean.changes[0].kind, "harder_variant");
expect("to the single-leg version", secondClean.plan.sessions[0].exercises[0].exerciseId, "single_leg_calf_raise");

console.log("\nLoaded, it follows the weight instead\n");
const firstLoaded = run(calfRaise, [
  { w: 20, r: 12 },
  { w: 20, r: 12 },
  { w: 20, r: 12 },
]);
expect("the weight it was done with becomes the target", firstLoaded.changes[0].kind, "calibrated");
expect("stored as added weight", firstLoaded.plan.sessions[0].exercises[0].targetWeightKg, 20);
expect("and the reason says it's added", firstLoaded.changes[0].reason.includes("+20 kg"), true);

const calibrated = { ...calfRaise, targetWeightKg: 20 };
const climbing = run(calibrated, [
  { w: 20, r: 12 },
  { w: 20, r: 12 },
  { w: 20, r: 12 },
]);
expect("a full range at that weight adds weight", climbing.changes[0].kind, "increase");
expect("rather than a harder variation", climbing.plan.sessions[0].exercises[0].exerciseId, "calf_raise");
expect("and the weight actually goes up", climbing.plan.sessions[0].exercises[0].targetWeightKg! > 20, true);
expect("the reason keeps the plus sign", climbing.changes[0].reason.includes("+"), true);

const short = run(calibrated, [
  { w: 20, r: 8 },
  { w: 20, r: 8 },
  { w: 20, r: 8 },
]);
expect("falling short holds the weight", short.plan.sessions[0].exercises[0].targetWeightKg, 20);

console.log("\nThe bell is the load, not an addition to it\n");

const swing = EXERCISES_BY_ID["kb_swing"]!;
expect("a kettlebell swing records its weight", swing.unit, "weight_reps");
expect("and isn't treated as bodyweight-plus", !!swing.loadable, false);

/*
 * A plan written before that correction still says "reps". The measurement
 * belongs to the movement, so normalising a stored plan fixes it rather than
 * leaving that person's swings unweighed forever.
 */
const stale = planWith({
  exerciseId: "kb_swing",
  sets: 3,
  unit: "reps",
  repMin: 10,
  repMax: 15,
  restSeconds: 60,
  targetWeightKg: null,
});
expect(
  "an old plan is corrected on the way in",
  normalizePlan(stale).sessions[0].exercises[0].unit,
  "weight_reps"
);
expect(
  "and a movement that hasn't changed is left alone",
  normalizePlan(planWith(calfRaise)).sessions[0].exercises[0].unit,
  "reps"
);

console.log("\nHow it reads on screen\n");
expect("a loaded target says added", targetLabel(calibrated), "+20 kg · 3 x 10-12");
expect("a barbell target doesn't", targetLabel({ ...calibrated, unit: "weight_reps" }), "20 kg · 3 x 10-12");
expect("an unloaded one says nothing about weight", targetLabel(calfRaise), "3 x 10-12");

console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} failure(s).\n`);
process.exit(failures === 0 ? 0 : 1);
