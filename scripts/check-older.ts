/**
 * Plans for older adults, and for anyone whose notes mention their balance or
 * bones: balance work in every session, nothing that jumps, and strength on at
 * least two days. Before this, a 75-year-old beginner who wrote "unsteady on
 * my feet" was given ten minutes of skipping four times a week.
 * Run with: npm run check:older
 */
import { EXERCISES_BY_ID } from "../src/lib/exercises";
import {
  BALANCE_IDS,
  generatePlan,
  parseCautions,
  rebuildPlan,
  refreshAccessories,
} from "../src/lib/plan/generate";
import { planUpgrade } from "../src/lib/plan/upgrade";
import type { GeneratorProfile, Plan } from "../src/lib/plan/types";

let failures = 0;
function expect(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label.padEnd(66)} ${JSON.stringify(actual)}`);
}

const GYM = ["dumbbell", "machine", "cable", "bodyweight", "bench"];
const base: GeneratorProfile = {
  goal: "General health",
  experience: "I'm new to training",
  days: 2,
  length: 45,
  equipment: GYM,
  likedExercises: [],
  dislikedExercises: [],
  trainingDays: ["mon", "thu"],
  considerations: null,
  age: 70,
};

const exercisesOf = (plan: Plan) => plan.sessions.flatMap((s) => s.exercises);
const everySessionBalances = (plan: Plan) =>
  plan.sessions.every((s) => s.exercises.some((e) => BALANCE_IDS.has(e.exerciseId)));
const conditioning = (plan: Plan) =>
  exercisesOf(plan)
    .map((e) => EXERCISES_BY_ID[e.exerciseId])
    .filter((d) => d?.pattern === "conditioning" || d?.pattern === "plyometric");
/** Sessions built around lifting, rather than a walk with some drills. */
const strengthDays = (plan: Plan) =>
  plan.sessions.filter((s) => s.focus !== "Conditioning").length;

console.log("\nReading the notes\n");
expect("a fall reads as a balance caution", parseCautions("I've had a couple of falls this year"), ["balance"]);
expect("unsteady does too", parseCautions("bit unsteady on my feet"), ["balance"]);
expect("osteopenia reads as bones", parseCautions("osteopenia"), ["bone"]);
expect("'fallen behind' is not a fall", parseCautions("fallen behind on my fitness"), []);
expect("'dizzy spells' is balance", parseCautions("I get dizzy spells"), ["balance"]);

console.log("\nA 70-year-old, two days a week, general health\n");
const seventy = generatePlan(base);
expect("both days are strength days", strengthDays(seventy), 2);
expect("balance work in every session", everySessionBalances(seventy), true);
expect("the plan records why", seventy.cautions, ["balance"]);
expect("and says so", seventy.notes.some((n) => n.includes("short balance exercise")), true);
expect(
  "balance comes straight after the main lifts",
  seventy.sessions.map((s) => s.exercises.findIndex((e) => BALANCE_IDS.has(e.exerciseId))),
  [2, 2]
);

console.log("\nA 75-year-old losing fat, osteoporosis, unsteady\n");
const frail = generatePlan({
  ...base,
  goal: "Lose fat",
  days: 4,
  trainingDays: ["mon", "tue", "thu", "fri"],
  considerations: "osteoporosis, bit unsteady on my feet",
  age: 75,
});
expect("balance and bone cautions", frail.cautions, ["balance", "bone"]);
expect("balance work in every session", everySessionBalances(frail), true);
expect("no skipping", exercisesOf(frail).some((e) => e.exerciseId === "jump_rope"), false);
expect("every finisher is low impact", conditioning(frail).every((d) => d?.lowImpact), true);
expect("the finisher is still there", conditioning(frail).length > 0, true);
expect("told to check before loading heavily", frail.notes.some((n) => n.includes("check with your doctor")), true);

console.log("\nA 68-year-old at home with a chair, three days\n");
const home = generatePlan({
  ...base,
  days: 3,
  length: 30,
  equipment: ["bodyweight", "chair", "mat"],
  trainingDays: ["mon", "wed", "fri"],
  age: 68,
});
expect("balance on the cardio day too", everySessionBalances(home), true);
expect("still two strength days", strengthDays(home), 2);

console.log("\nEveryone else is unchanged\n");
const young = generatePlan({
  ...base,
  goal: "Lose fat",
  days: 3,
  trainingDays: ["mon", "wed", "fri"],
  equipment: ["bodyweight"],
  age: 30,
});
expect("a 30-year-old gets no balance slot", exercisesOf(young).some((e) => BALANCE_IDS.has(e.exerciseId)), false);
expect("nor any cautions", young.cautions, []);
expect("a beginner's finisher is within their level", conditioning(young).every((d) => (d?.level ?? 9) <= 1), true);
expect("and there still is one", conditioning(young).length > 0, true);
const trained = generatePlan({
  ...base,
  goal: "Lose fat",
  experience: "I've been training a while",
  days: 3,
  trainingDays: ["mon", "wed", "fri"],
  equipment: ["bodyweight", "cardio"],
  age: 30,
});
expect(
  "a trained lifter still gets intervals",
  conditioning(trained).every((d) => d && !["steady_walk", "steady_bike"].includes(d.id)),
  true
);

console.log("\nThe coach's reading of the notes\n");
const read = generatePlan({
  ...base,
  age: 45,
  considerations: "my legs aren't what they were",
  notesReading: { avoiding: [], cautions: ["balance"] },
});
expect("a caution only the coach caught still counts", everySessionBalances(read), true);
expect("and is kept on the plan", read.notesReading, { avoiding: [], cautions: ["balance"] });
const rebuilt = rebuildPlan(read, { ...base, age: 45, considerations: "my legs aren't what they were", days: 3, trainingDays: ["mon", "wed", "fri"] });
expect("a rebuild for a new schedule keeps it", everySessionBalances(rebuilt), true);
const reread = rebuildPlan(read, {
  ...base,
  age: 45,
  considerations: "all fine now",
  notesReading: { avoiding: [], cautions: [] },
});
expect("new notes, read again, replace it", exercisesOf(reread).some((e) => BALANCE_IDS.has(e.exerciseId)), false);

console.log("\nLater changes leave balance work alone\n");
const refreshed = refreshAccessories(seventy, base).plan;
expect("a refresh keeps the balance work", everySessionBalances(refreshed), true);

console.log("\nAn existing older plan is offered the change\n");
const oldPlan: Plan = {
  ...seventy,
  cautions: undefined,
  sessions: seventy.sessions.map((s) => ({
    ...s,
    exercises: s.exercises.filter((e) => !BALANCE_IDS.has(e.exerciseId)),
  })),
};
const offer = planUpgrade(oldPlan, base);
expect("an offer is made", offer !== null, true);
expect("and it leads with balance", offer?.highlights[0]?.startsWith("A short balance exercise"), true);

const oldHealthWeek = generatePlan(base);
const walkDay: Plan = {
  ...oldHealthWeek,
  cautions: undefined,
  // How a two-day health week used to be built: one strength day and a walk.
  sessions: [
    { ...oldHealthWeek.sessions[0], exercises: oldHealthWeek.sessions[0].exercises.filter((e) => !BALANCE_IDS.has(e.exerciseId)) },
    { ...home.sessions[1], weekday: "thu" },
  ],
};
expect(
  "a walk-day week hears about its second strength day",
  planUpgrade(walkDay, { ...base, age: 50 })?.highlights.some((h) => h.startsWith("Strength work on 2 days")),
  true
);

async function main() {
  // health-consent makes a Supabase client as it loads; nothing here talks to it.
  process.env.NEXT_PUBLIC_SUPABASE_URL ??= "http://localhost:54321";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "unused";
  const { withoutHealthDerived } = await import("../src/lib/health-consent");
  const withdrawn = withoutHealthDerived(frail);
  expect("withdrawing health consent clears the cautions", [withdrawn.cautions, withdrawn.notesReading ?? null], [[], null]);
  expect("and their notes", withdrawn.notes.some((n) => n.includes("short balance exercise")), false);

  console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} check(s) failed.\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
