/**
 * Editing a plan by hand has to stay sane: numbers get clamped, a rep range
 * can't read backwards, moving a session onto a taken day swaps rather than
 * hides, and the app's own workings — how long a session takes, which half of
 * the body it trains — follow the edits.
 * Run with: npm run check:plan-edit
 */
import {
  LIMITS,
  addExercise,
  addSession,
  commitTyped,
  emptyWeek,
  moveExercise,
  moveSession,
  removeExercise,
  removeSession,
  renameSession,
  replaceExercise,
  updateExercise,
} from "../src/lib/plan/edit";
import type { Plan } from "../src/lib/plan/types";

let failures = 0;
function expect(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label.padEnd(58)} ${JSON.stringify(actual)}`);
}

const first = (plan: Plan) => plan.sessions[0];
const firstExercise = (plan: Plan) => plan.sessions[0].exercises[0];

console.log("\nBuilding a week from nothing\n");
let plan = emptyWeek("Build muscle", 2);
expect("starts empty", [plan.sessions.length, plan.daysPerWeek], [0, 0]);

plan = addSession(plan, "Push");
expect("first session lands on Monday", first(plan).weekday, "mon");
expect("days per week follows the sessions", plan.daysPerWeek, 1);

plan = addSession(plan, "Pull");
expect("second session takes the next free day", plan.sessions[1].weekday, "tue");

console.log("\nAdding exercises\n");
plan = addExercise(plan, first(plan).id, "back_squat");
expect("uses the goal's sets and reps", [firstExercise(plan).sets, firstExercise(plan).repMin, firstExercise(plan).repMax], [4, 6, 10]);
expect("session length is worked out", first(plan).estMinutes > 0, true);
expect("a squat day reads as lower body", first(plan).region, "lower");

plan = addExercise(plan, first(plan).id, "bench_press");
expect("adding upper body work makes it full body", first(plan).region, "full");
expect("unknown exercises are ignored", addExercise(plan, first(plan).id, "not_an_exercise"), plan);

console.log("\nTyping numbers in\n");
const sessionId = first(plan).id;
plan = updateExercise(plan, sessionId, 0, { sets: 99, repMin: 8, repMax: 12, restSeconds: 9999 });
expect("sets are capped", firstExercise(plan).sets, 12);
expect("rest is capped", firstExercise(plan).restSeconds, 600);
expect("reps are kept", [firstExercise(plan).repMin, firstExercise(plan).repMax], [8, 12]);

plan = updateExercise(plan, sessionId, 0, { repMin: 20 });
expect("a backwards range follows the number just typed", [firstExercise(plan).repMin, firstExercise(plan).repMax], [20, 20]);

plan = updateExercise(plan, sessionId, 0, { repMin: 5, repMax: 3 });
expect("and the other way round", [firstExercise(plan).repMin, firstExercise(plan).repMax], [5, 5]);

plan = updateExercise(plan, sessionId, 0, { targetWeightKg: 60 });
expect("a weight can be set by hand", firstExercise(plan).targetWeightKg, 60);
plan = updateExercise(plan, sessionId, 0, { targetWeightKg: null });
expect("and cleared back to uncalibrated", firstExercise(plan).targetWeightKg, null);

console.log("\nOrder and swaps\n");
const before = first(plan).exercises.map((e) => e.exerciseId);
plan = moveExercise(plan, sessionId, 0, 1);
expect("an exercise moves down", first(plan).exercises.map((e) => e.exerciseId), [before[1], before[0]]);
expect("moving past the end does nothing", moveExercise(plan, sessionId, 1, 1), plan);
expect("moving past the start does nothing", moveExercise(plan, sessionId, 0, -1), plan);

const swapped = replaceExercise(plan, sessionId, 0, "pushup");
expect("swapping to a different kind of movement keeps sets and rest", [swapped.sessions[0].exercises[0].sets, swapped.sessions[0].exercises[0].restSeconds], [first(plan).exercises[0].sets, first(plan).exercises[0].restSeconds]);
expect("and takes the new movement's id", swapped.sessions[0].exercises[0].exerciseId, "pushup");

console.log("\nSessions\n");
plan = renameSession(plan, sessionId, "  Legs and chest  ");
expect("names are trimmed", first(plan).name, "Legs and chest");
expect("an empty name is refused", renameSession(plan, sessionId, "   ").sessions[0].name, "Legs and chest");

plan = moveSession(plan, plan.sessions[1].id, "mon");
expect("moving onto a taken day swaps them", [plan.sessions[0].weekday, plan.sessions[1].weekday], ["tue", "mon"]);

const shorter = removeExercise(plan, sessionId, 0);
expect("removing work shortens the session", shorter.sessions[0].estMinutes < first(plan).estMinutes, true);

const gone = removeSession(plan, sessionId);
expect("removing a session updates the day count", [gone.sessions.length, gone.daysPerWeek], [1, 1]);

/*
 * Typing into the boxes. Clamping each keystroke made the sets box impossible
 * to change: clearing it read as zero, snapped to the minimum, and the next
 * keystroke landed beside that. A real user hit this.
 */
console.log("\nTyping a number in\n");
expect("clearing a required box keeps what was there", commitTyped("", 3, LIMITS.sets), 3);
expect("a half-typed box is left alone until finished", commitTyped("", 8, LIMITS.reps), 8);
expect("clearing the weight empties the target", commitTyped("", 60, LIMITS.weightKg, true), null);
expect("a normal number goes through", commitTyped("4", 3, LIMITS.sets), 4);
expect("spaces around it are fine", commitTyped(" 5 ", 3, LIMITS.sets), 5);
expect("above the limit still clamps", commitTyped("99", 3, LIMITS.sets), 12);
expect("below the limit still clamps", commitTyped("0", 3, LIMITS.sets), 1);
expect("nonsense keeps what was there", commitTyped("abc", 3, LIMITS.sets), 3);
expect("half-kilos survive", commitTyped("62.5", 60, LIMITS.weightKg, true), 62.5);

console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} failure(s).\n`);
process.exit(failures === 0 ? 0 : 1);
