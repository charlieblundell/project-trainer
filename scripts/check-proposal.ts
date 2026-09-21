/**
 * The coach's plan changes: only a proposal that fits the plan and the
 * person's equipment gets through, applying it makes exactly the change it
 * describes, and Undo only works while nothing else has changed since.
 * Run with: npm run check:proposal
 */
import { EXERCISES_BY_ID, availableExercises, type Equipment } from "../src/lib/exercises";
import { generatePlan } from "../src/lib/plan/generate";
import { applyChanges, canUndo, describeChanges, parseProposal, proposalNote } from "../src/lib/plan/proposal";
import type { GeneratorProfile, Plan } from "../src/lib/plan/types";

let failures = 0;
function expect(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label.padEnd(64)} ${JSON.stringify(actual)}`);
}

const GYM = ["barbell", "dumbbell", "bench", "cable", "machine", "squat_rack", "pullup_bar", "bodyweight"];
const profile: GeneratorProfile = {
  goal: "Build muscle",
  experience: "I've been training a while",
  days: 3,
  length: 60,
  equipment: GYM,
  likedExercises: [],
  dislikedExercises: [],
  trainingDays: ["mon", "wed", "fri"],
  considerations: null,
  age: 34,
};
const plan = generatePlan(profile);
const available = new Set(availableExercises(GYM as Equipment[]).map((e) => e.id));
const push = plan.sessions[0];
const first = push.exercises[0];
const alternative = [...available].find(
  (id) =>
    EXERCISES_BY_ID[id].pattern === EXERCISES_BY_ID[first.exerciseId].pattern &&
    !push.exercises.some((e) => e.exerciseId === id)
)!;

console.log(`\nWorking from ${push.name}: ${push.exercises.map((e) => e.exerciseId).join(", ")}\n`);

console.log("Only proposals that fit get through\n");
const swap = { kind: "replace_exercise", session_id: push.id, exercise_id: first.exerciseId, to_exercise_id: alternative };
expect("a swap within their equipment", parseProposal({ summary: "Swap it", changes: [swap] }, plan, available) !== null, true);
expect(
  "not a swap to equipment they don't have",
  parseProposal({ summary: "x", changes: [{ ...swap, to_exercise_id: "kb_swing" }] }, plan, available),
  null
);
const alreadyThere = push.exercises[2].exerciseId;
expect(
  "not a swap to something already in the session",
  parseProposal({ summary: "x", changes: [{ ...swap, to_exercise_id: alreadyThere }] }, plan, available),
  null
);
expect(
  "nor adding it twice",
  parseProposal({ summary: "x", changes: [{ kind: "add_exercise", session_id: push.id, exercise_id: alreadyThere }] }, plan, available),
  null
);
expect("not a session that doesn't exist", parseProposal({ summary: "x", changes: [{ ...swap, session_id: "nope" }] }, plan, available), null);
expect(
  "not an exercise that isn't in the session",
  parseProposal({ summary: "x", changes: [{ ...swap, exercise_id: "made_up" }] }, plan, available),
  null
);
expect(
  "not 40 sets",
  parseProposal(
    { summary: "x", changes: [{ kind: "update_exercise", session_id: push.id, exercise_id: first.exerciseId, sets: 40 }] },
    plan,
    available
  ),
  null
);
expect("not an unknown kind of change", parseProposal({ summary: "x", changes: [{ kind: "delete_everything", session_id: push.id }] }, plan, available), null);
expect("not an empty proposal", parseProposal({ summary: "x", changes: [] }, plan, available), null);
expect(
  "one bad change sinks the whole proposal",
  parseProposal({ summary: "x", changes: [swap, { ...swap, session_id: "nope" }] }, plan, available),
  null
);

console.log("\nApplying makes exactly that change\n");
const swapped = parseProposal({ summary: "Swap it", changes: [swap] }, plan, available)!;
const applied = applyChanges(plan, swapped.changes);
const after = "plan" in applied ? applied.plan : (null as unknown as Plan);
expect("the new exercise is in the slot", after.sessions[0].exercises[0].exerciseId, alternative);
expect("and starts by finding its working weight", after.sessions[0].exercises[0].targetWeightKg, null);
expect("the other sessions are untouched", JSON.stringify(after.sessions.slice(1)) === JSON.stringify(plan.sessions.slice(1)), true);
expect("the plan counts as changed by hand", after.editedByHand, true);
expect("the card says what it does", describeChanges(plan, swapped.changes)[0].includes("→"), true);

const reps = parseProposal(
  {
    summary: "Lighter and more reps",
    changes: [{ kind: "update_exercise", session_id: push.id, exercise_id: first.exerciseId, sets: 3, rep_min: 10, rep_max: 12 }],
  },
  plan,
  available
)!;
const repsPlan = applyChanges(plan, reps.changes);
expect(
  "sets and reps change as asked",
  "plan" in repsPlan ? [repsPlan.plan.sessions[0].exercises[0].sets, repsPlan.plan.sessions[0].exercises[0].repMin, repsPlan.plan.sessions[0].exercises[0].repMax] : null,
  [3, 10, 12]
);

const toSunday = parseProposal({ summary: "Move it", changes: [{ kind: "move_session", session_id: push.id, weekday: "sun" }] }, plan, available)!;
const moved = applyChanges(plan, toSunday.changes);
expect("a session moves day", "plan" in moved ? moved.plan.sessions[0].weekday : null, "sun");

const addThenSet = parseProposal(
  {
    summary: "Add curls",
    changes: [
      { kind: "add_exercise", session_id: push.id, exercise_id: "db_curl" },
      { kind: "update_exercise", session_id: push.id, exercise_id: "db_curl", sets: 2 },
    ],
  },
  plan,
  available
);
expect("a change can set up an exercise it just added", addThenSet !== null, true);

console.log("\nAgainst a plan that has moved on\n");
const without = applyChanges(plan, [{ kind: "remove_exercise", sessionId: push.id, exerciseId: first.exerciseId }]);
const changedSince = "plan" in without ? without.plan : plan;
const stale = applyChanges(changedSince, swapped.changes);
expect("a stale proposal is refused, not half-applied", "error" in stale, true);

console.log("\nUndo\n");
const appliedProposal = { ...swapped, state: "applied" as const, before: plan, after };
expect("works while nothing else has changed", canUndo(appliedProposal, after), true);
expect("not once the plan has changed again", canUndo(appliedProposal, changedSince), false);
expect("the coach hears what came of it", proposalNote(appliedProposal).includes("they applied it"), true);

console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
