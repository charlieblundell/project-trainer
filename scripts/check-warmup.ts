/**
 * The warm-up has to suit the session and the equipment someone actually has:
 * leg days get hips and ankles, upper days get shoulders, nobody is given a
 * mat drill without a mat, and the first lift gets an easy set before it.
 * Run with: npm run check:warmup
 */
import { warmUpFor } from "../src/lib/plan/warmup";
import { EXERCISES_BY_ID, type Equipment } from "../src/lib/exercises";
import type { PlannedExercise, PlannedSession, Region } from "../src/lib/plan/types";

let failures = 0;
function expect(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label.padEnd(56)} ${JSON.stringify(actual)}`);
}

const squat: PlannedExercise = {
  exerciseId: "back_squat",
  unit: "weight_reps",
  sets: 4,
  repMin: 6,
  repMax: 10,
  restSeconds: 120,
  targetWeightKg: 80,
};

const pressUnknown: PlannedExercise = { ...squat, exerciseId: "bench_press", targetWeightKg: null };

const pushup: PlannedExercise = {
  exerciseId: "pushup",
  unit: "reps",
  sets: 3,
  repMin: 8,
  repMax: 12,
  restSeconds: 60,
  targetWeightKg: null,
};

function session(region: Region, exercises: PlannedExercise[]): PlannedSession {
  return { id: "s1", name: "Session", focus: "Focus", weekday: "mon", estMinutes: 45, region, exercises };
}

const GYM: Equipment[] = ["barbell", "dumbbell", "bench", "cable", "machine", "squat_rack", "mat", "pullup_bar"];
const BODYWEIGHT: Equipment[] = ["bodyweight"];

/** What each move touches, so a pick can be checked against the session. */
function areas(ids: string[]): string {
  return ids
    .map((id) => {
      const def = EXERCISES_BY_ID[id];
      return `${def?.muscles.join(" ")} ${def?.loads.join(" ")}`.toLowerCase();
    })
    .join(" | ");
}

/** A move is shoulder work when that's what it's chiefly for, not merely what it passes through. */
function isShoulderFocused(id: string): boolean {
  const primary = (EXERCISES_BY_ID[id]?.muscles[0] ?? "").toLowerCase();
  return /shoulder|chest|delt|upper back/.test(primary);
}

function heldCount(ids: string[]): number {
  return ids.filter((id) => EXERCISES_BY_ID[id]?.unit !== "reps").length;
}

console.log("\nLower body day, full gym\n");
const lower = warmUpFor(session("lower", [squat]), GYM);
const lowerIds = lower.moves.map((m) => m.id);
expect("three or four moves", lower.moves.length >= 3 && lower.moves.length <= 4, true);
expect("covers hips", /hip/.test(areas(lowerIds)), true);
expect("covers ankles or hamstrings", /ankle|hamstring/.test(areas(lowerIds)), true);
expect("no shoulder-focused drills", lowerIds.some(isShoulderFocused), false);
expect("at most one held stretch", heldCount(lowerIds) <= 1, true);
expect("mostly moving drills", lower.moves.filter((m) => m.dose.includes("reps")).length >= 2, true);
expect("easy set before the first lift", lower.rampUp, "One easy set of Back Squat at about 40 kg, then straight into your working sets.");

console.log("\nUpper body day, full gym\n");
const upper = warmUpFor(session("upper", [pressUnknown]), GYM);
const upperIds = upper.moves.map((m) => m.id);
expect("covers shoulders or chest", /shoulder|chest|delt/.test(areas(upperIds)), true);
expect("uncalibrated lift asks for a light set", upper.rampUp?.includes("light weight"), true);

console.log("\nBodyweight only, at home\n");
const home = warmUpFor(session("full", [pushup]), BODYWEIGHT);
const homeIds = home.moves.map((m) => m.id);
expect("still gets moves", home.moves.length >= 2, true);
expect(
  "nothing needing kit they don't have",
  homeIds.every((id) => (EXERCISES_BY_ID[id]?.equipment ?? []).every((e) => e === "bodyweight")),
  true
);
expect("no easy set for bodyweight work", home.rampUp, null);

console.log("\nEvery move has a dose\n");
expect("all moves say what to do", [...lower.moves, ...upper.moves, ...home.moves].every((m) => m.dose.length > 0), true);

console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} failure(s).\n`);
process.exit(failures === 0 ? 0 : 1);
