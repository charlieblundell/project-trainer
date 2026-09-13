/**
 * Offering an existing plan the improved building rules.
 *
 * Nobody's week changes without their say-so, a plan someone wrote by hand is
 * never touched, a plan already on the current rules isn't nagged, and every
 * weight carries across to whatever survives.
 * Run with: npm run check:upgrade
 */
import { EQUIPMENT_BY_ENVIRONMENT, type Equipment } from "../src/lib/exercises";
import { generatePlan } from "../src/lib/plan/generate";
import { addSession } from "../src/lib/plan/edit";
import { planUpgrade } from "../src/lib/plan/upgrade";
import { setsByGroup } from "../src/lib/plan/volume";
import type { GeneratorProfile, Plan } from "../src/lib/plan/types";

let failures = 0;
function expect(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label.padEnd(62)} ${JSON.stringify(actual)}`);
}

const profile: GeneratorProfile = {
  goal: "Build muscle",
  experience: "I've been training a while",
  days: 3,
  length: 60,
  equipment: (EQUIPMENT_BY_ENVIRONMENT as Record<string, Equipment[]>)["Full gym"],
  likedExercises: [],
  dislikedExercises: [],
  trainingDays: [],
  considerations: null,
  age: 30,
};

/** A plan the way the old rules built it: no hamstring work, curls on Push day, 90s rests. */
function oldRulesPlan(): Plan {
  const ex = (exerciseId: string, sets: number, weight: number | null, rest = 90) => ({
    exerciseId,
    sets,
    unit: "weight_reps" as const,
    repMin: 6,
    repMax: 10,
    restSeconds: rest,
    targetWeightKg: weight,
  });
  return {
    createdAt: "2026-09-10T00:00:00.000Z",
    goal: "Build muscle",
    level: 2,
    daysPerWeek: 3,
    refreshes: 0,
    retired: [],
    avoiding: [],
    notes: [],
    sessions: [
      { id: "push-0", name: "Push", focus: "Chest, Shoulders & Triceps", weekday: "tue", estMinutes: 38, region: "upper",
        exercises: [ex("bench_press", 4, 80), ex("kb_press", 4, 20), ex("incline_bench", 4, 60), ex("barbell_curl", 3, 30, 60), ex("cable_fly", 3, 15, 60)] },
      { id: "pull-1", name: "Pull", focus: "Back & Biceps", weekday: "thu", estMinutes: 38, region: "upper",
        exercises: [ex("lat_pulldown", 4, 60), ex("barbell_row", 4, 70), ex("cable_row", 4, 55), ex("cable_lateral_raise", 3, 8, 60), ex("db_curl", 3, 14, 60)] },
      { id: "legs-2", name: "Legs", focus: "Legs", weekday: "sat", estMinutes: 38, region: "lower",
        exercises: [ex("back_squat", 4, 100), ex("hip_thrust", 4, 90), ex("split_squat", 4, 40), ex("db_calf_raise", 3, 20, 60), ex("cable_crunch", 3, 25, 60)] },
    ],
  };
}

console.log("\nA plan built by the old rules gets offered the new ones\n");
const old = oldRulesPlan();
const offer = planUpgrade(old, profile);
expect("an offer is made", offer !== null, true);

const before = setsByGroup(old.sessions.flatMap((s) => s.exercises));
const after = setsByGroup(offer!.next.sessions.flatMap((s) => s.exercises));
expect("hamstrings go from almost nothing to real work", [before.hamstrings < 3, after.hamstrings >= 8], [true, true]);
expect("and the offer leads with it", offer!.highlights.some((h) => h.startsWith("Hamstrings")), true);

const legs = offer!.sessions.find((s) => s.name === "Legs")!;
expect("the preview names what Legs day adds", legs.added.includes("Romanian Deadlift"), true);
const push = offer!.sessions.find((s) => s.name === "Push")!;
expect("and that curls leave Push day", push.removed.includes("Barbell Curl"), true);

console.log("\nEvery weight they built comes with it\n");
const benchAfter = offer!.next.sessions.flatMap((s) => s.exercises).find((e) => e.exerciseId === "bench_press");
expect("bench keeps its 80 kg", benchAfter?.targetWeightKg, 80);
const squatAfter = offer!.next.sessions.flatMap((s) => s.exercises).find((e) => e.exerciseId === "back_squat");
expect("squat keeps its 100 kg", squatAfter?.targetWeightKg, 100);
const rdl = offer!.next.sessions.flatMap((s) => s.exercises).find((e) => e.exerciseId === "rdl");
expect("anything new starts by finding a working weight", rdl?.targetWeightKg, null);

console.log("\nNobody is offered what they already have, or what they chose\n");
const current = generatePlan(profile);
expect("a plan already on the current rules gets no offer", planUpgrade(current, profile), null);

const handBuilt = addSession(old, "My arms day");
expect("a plan someone edited by hand is left alone", planUpgrade(handBuilt, profile), null);

// Changing a few sets in the editor is choosing too, not only adding sessions.
expect("a plan tweaked in the editor is left alone", planUpgrade({ ...old, editedByHand: true }, profile), null);

console.log("\nAn improvement is never a downgrade\n");

// A saved profile that has lost track of the barbell — mistyped, half-migrated,
// edited — would rebuild a barbell lifter onto bodyweight work and call it better.
const noBarbell = { ...profile, equipment: ["dumbbell", "bench", "bodyweight"] };
expect("a rebuild that would lose the barbell isn't offered", planUpgrade(old, noBarbell), null);

// The profile says less experience than the plan was built for.
const lessExperienced = { ...profile, experience: "Brand new" };
expect("nor is one that would drop them to a beginner's week", planUpgrade(old, lessExperienced), null);

// Swapping one loaded tool for a heavier one is still an upgrade.
expect(
  "a kettlebell press becoming a barbell press is still offered",
  offer!.sessions.find((s) => s.name === "Push")!.removed.includes("Kettlebell Overhead Press"),
  true
);

console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} failure(s).\n`);
process.exit(failures === 0 ? 0 : 1);
