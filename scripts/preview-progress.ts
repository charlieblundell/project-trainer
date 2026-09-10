/**
 * Feeds synthetic workout history through the progress calculations, so the
 * numbers on that screen can be checked without logging months of workouts.
 * Covers the awkward cases: a single session, a flat series, bodyweight work
 * that logs no weight, and a gap in training.
 * Run with: npm run preview:progress
 */
import {
  personalRecords,
  sessionsPerWeek,
  strengthSeries,
  trainingTotals,
} from "../src/lib/progress/compute";
import type { WorkoutRecord } from "../src/lib/progress/types";
import type { SetLog } from "../src/lib/types";

const NOW = new Date("2026-09-11T18:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

function daysAgo(n: number): string {
  return new Date(NOW.getTime() - n * DAY).toISOString();
}

function sets(count: number, w: number, r: number): SetLog[] {
  return Array.from({ length: count }, () => ({ w, r }));
}

/** Eight weeks of upper days, with bench climbing and a two-week gap. */
const history: WorkoutRecord[] = [
  {
    workoutId: "upper-a-0",
    completedAt: daysAgo(56),
    loggedSets: {
      bench_press: sets(4, 50, 8),
      pullup: sets(3, 0, 6),
      plank: [{ w: 0, r: 1 }],
    },
    rpe: { bench_press: 8 },
  },
  {
    workoutId: "upper-a-0",
    completedAt: daysAgo(49),
    loggedSets: {
      bench_press: sets(4, 52.5, 8),
      pullup: sets(3, 0, 7),
      plank: [{ w: 0, r: 1 }],
    },
    rpe: { bench_press: 8 },
  },
  {
    workoutId: "upper-a-0",
    completedAt: daysAgo(42),
    loggedSets: { bench_press: sets(4, 55, 8), pullup: sets(3, 0, 8) },
    rpe: {},
  },
  // Two weeks off.
  {
    workoutId: "upper-a-0",
    completedAt: daysAgo(21),
    loggedSets: { bench_press: sets(4, 55, 6), pullup: sets(3, 0, 8) },
    rpe: {},
  },
  {
    workoutId: "upper-a-0",
    completedAt: daysAgo(14),
    loggedSets: { bench_press: sets(4, 55, 8), pullup: sets(3, 0, 9) },
    rpe: {},
  },
  {
    workoutId: "upper-a-0",
    completedAt: daysAgo(7),
    loggedSets: { bench_press: sets(4, 57.5, 8), pullup: sets(3, 0, 10) },
    rpe: {},
  },
  {
    workoutId: "lower-a-1",
    completedAt: daysAgo(3),
    // A heavier single that should beat the higher-rep sets as a personal best.
    loggedSets: { back_squat: [...sets(3, 90, 5), { w: 100, r: 3 }] },
    rpe: {},
  },
];

const single: WorkoutRecord[] = [history[0]];

function report(label: string, records: WorkoutRecord[], daysPerWeek: number | null) {
  console.log("\n" + "=".repeat(78));
  console.log(label);
  console.log("=".repeat(78));

  console.log("\nStrength series (most recently trained first):");
  for (const s of strengthSeries(records)) {
    const trend =
      s.change === null ? "one session" : `${s.change > 0 ? "+" : ""}${s.change} over ${s.points.length}`;
    console.log(
      `  ${s.name.padEnd(22)} ${s.measure.padEnd(7)} latest ${s.points[s.points.length - 1].label.padEnd(12)} ${trend}`
    );
    console.log(`      plotted: ${s.points.map((p) => p.value).join(" -> ")}`);
  }

  console.log("\nPersonal bests (most recent first):");
  for (const pr of personalRecords(records)) {
    console.log(`  ${pr.name.padEnd(22)} ${pr.label.padEnd(12)} ${pr.achievedAt.slice(0, 10)}`);
  }

  const totals = trainingTotals(records, daysPerWeek, NOW);
  console.log("\nTotals:");
  console.log(`  workouts ${totals.workouts}  sets ${totals.sets}  reps ${totals.reps}`);
  console.log(`  volume ${totals.volumeKg.toLocaleString("en-GB")} kg`);
  console.log(
    `  consistency ${totals.consistency === null ? "n/a" : `${Math.round(totals.consistency * 100)}%`}`
  );

  const bars = sessionsPerWeek(records, 12, NOW);
  console.log("\nLast 12 weeks: " + bars.map((b) => b.count).join(" "));
  console.log(`  from ${bars[0].label} to ${bars[bars.length - 1].label}`);
}

report("Eight weeks of training, with a two-week gap", history, 4);
report("A single logged session", single, 4);
report("No plan, so no consistency figure", history, null);
