/**
 * Checks the weekly streak and last-week summary against hand-built
 * histories. Streaks are motivating only if they're right: a streak that
 * resets for no reason is worse than none.
 * Run with: npm run check:weekly
 */
import {
  daysTrainedThisWeek,
  lastWeekSummary,
  weeklyStreak,
} from "../src/lib/progress/compute";
import type { WorkoutRecord } from "../src/lib/progress/types";
import type { SetLog } from "../src/lib/types";

// Friday 11 September 2026, midday local time. Monday of this week is the 7th.
const NOW = new Date(2026, 8, 11, 12, 0, 0);

function on(month: number, day: number, sets: Record<string, SetLog[]> = { goblet_squat: [{ w: 12, r: 10 }] }): WorkoutRecord {
  return {
    workoutId: "session",
    completedAt: new Date(2026, month, day, 18, 0, 0).toISOString(),
    loggedSets: sets,
    rpe: {},
  };
}

let failures = 0;
function expect(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label.padEnd(58)} ${JSON.stringify(actual)}`);
}

console.log("\nWeekly streak (target 3 a week)\n");

// This week Mon/Wed/Fri, last week 3, the week before only 2.
const strongRun = [
  on(8, 7), on(8, 9), on(8, 11),
  on(7, 31), on(8, 2), on(8, 4),
  on(7, 24), on(7, 26),
];
expect("target met this week and last week, missed the week before", weeklyStreak(strongRun, 3, NOW), 2);

// Only 1 so far this week — the week isn't over, so the streak holds at 2.
const midWeek = [
  on(8, 7),
  on(7, 31), on(8, 2), on(8, 4),
  on(7, 24), on(7, 26), on(7, 28),
];
expect("current week not finished doesn't break the streak", weeklyStreak(midWeek, 3, NOW), 2);

expect("no workouts means no streak", weeklyStreak([], 3, NOW), 0);
expect("last week missed resets to 0 even with older good weeks", weeklyStreak([on(7, 24), on(7, 26), on(7, 28)], 3, NOW), 0);
expect("extra sessions still count as target met", weeklyStreak([on(8, 7), on(8, 8), on(8, 9), on(8, 10)], 3, NOW), 1);

console.log("\nDays trained this week\n");
expect("Monday, Wednesday and Friday", [...daysTrainedThisWeek(strongRun, NOW)].sort(), [0, 2, 4]);
expect("last week's sessions aren't counted", [...daysTrainedThisWeek([on(8, 4)], NOW)], []);

console.log("\nLast week summary\n");

expect("brand-new this week has no last week", lastWeekSummary([on(8, 8)], 3, NOW), null);

const withBests: WorkoutRecord[] = [
  // Two weeks ago: first time on both exercises.
  on(7, 26, { goblet_squat: [{ w: 12, r: 10 }], push_up: [{ w: 0, r: 8 }] }),
  // Last week: squat improves, a brand-new exercise appears.
  on(8, 2, { goblet_squat: [{ w: 14.5, r: 10 }, { w: 14.5, r: 9 }], plank: [{ w: 0, r: 1 }] }),
  on(8, 4, { push_up: [{ w: 0, r: 10 }] }),
];
const summary = lastWeekSummary(withBests, 3, NOW);
expect("sessions last week", summary?.sessions, 2);
// 2 squat sets + 1 plank set on the 2nd, 1 push-up set on the 4th.
expect("sets last week", summary?.sets, 4);
expect(
  "bests only on exercises done before last week",
  summary?.newBests.map((b) => b.exerciseId).sort(),
  ["goblet_squat", "push_up"]
);

console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} failure(s).\n`);
process.exit(failures === 0 ? 0 : 1);
