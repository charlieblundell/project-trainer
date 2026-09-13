/**
 * The "why your plan looks like this" rules stay honest.
 *
 * Every research rule points at findings that exist, every judgement call says
 * why it's a judgement, and each rule that applies only to some people shows
 * only to them. A link to a finding that's been renamed away would quietly
 * turn a cited rule into an uncited one.
 * Run with: npm run check:rules
 */
import { EQUIPMENT_BY_ENVIRONMENT, type Equipment } from "../src/lib/exercises";
import { FINDINGS_BY_ID } from "../src/lib/evidence";
import { generatePlan } from "../src/lib/plan/generate";
import { NOT_YET, PLAN_RULES, rulesFor } from "../src/lib/plan/rules";

let failures = 0;
function expect(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label.padEnd(62)} ${JSON.stringify(actual)}`);
}

console.log("\nEvery citation resolves\n");
const cited = PLAN_RULES.flatMap((r) => (r.basis.kind === "research" ? r.basis.findings : []));
const missing = [...cited, ...NOT_YET.flatMap((n) => n.findings)].filter((id) => !FINDINGS_BY_ID[id]);
expect("no rule cites a finding that doesn't exist", missing, []);
expect(
  "every research rule cites at least one finding",
  PLAN_RULES.filter((r) => r.basis.kind === "research" && r.basis.findings.length === 0).map((r) => r.id),
  []
);
expect("the two new findings are both put to use", ["count-indirect-sets-as-half", "beginners-start-small"].every((id) => cited.includes(id)), true);

console.log("\nJudgement is labelled as judgement\n");
expect(
  "every judgement call says why it isn't research",
  PLAN_RULES.filter((r) => r.basis.kind === "judgement" && r.basis.why.trim().length < 20).map((r) => r.id),
  []
);
expect("there are judgement calls, and they're shown", PLAN_RULES.some((r) => r.basis.kind === "judgement"), true);
expect("rule ids are unique", new Set(PLAN_RULES.map((r) => r.id)).size, PLAN_RULES.length);

console.log("\nPeople see the rules that apply to them\n");
const gym = (EQUIPMENT_BY_ENVIRONMENT as Record<string, Equipment[]>)["Full gym"];
const build = (goal: string, experience: string) =>
  generatePlan({ goal, experience, days: 3, length: 60, equipment: gym, likedExercises: [], dislikedExercises: [], trainingDays: [], considerations: null, age: 30 });

const trained = build("Build muscle", "I've been training a while");
const trainedRules = rulesFor({ plan: trained, goal: "Build muscle", level: 2 }).map((r) => r.id);
expect("a trained lifter isn't told they're starting on less", trainedRules.includes("beginners"), false);
expect("nor given the fat-loss rule", trainedRules.includes("fat-loss-keeps-lifting"), false);
expect("but does see the barbell preference", trainedRules.includes("barbell-main-lifts"), true);

const beginner = build("Build muscle", "Brand new");
const beginnerRules = rulesFor({ plan: beginner, goal: "Build muscle", level: 1 }).map((r) => r.id);
expect("a beginner sees the beginner rule", beginnerRules.includes("beginners"), true);
expect("and not the barbell preference, which doesn't apply to them", beginnerRules.includes("barbell-main-lifts"), false);

const cut = build("Lose fat", "I've been training a while");
expect("a fat-loss plan explains why it keeps the lifting", rulesFor({ plan: cut, goal: "Lose fat", level: 2 }).some((r) => r.id === "fat-loss-keeps-lifting"), true);

const health = build("General health", "I've been training a while");
expect(
  "a general health plan isn't told about long rests it doesn't have",
  rulesFor({ plan: health, goal: "General health", level: 2 }).some((r) => r.id === "rest"),
  false
);

console.log("\nThe personal line matches the plan\n");
const volume = PLAN_RULES.find((r) => r.id === "weekly-volume")!;
const personal = volume.forYou!({ plan: trained, goal: "Build muscle", level: 2 });
const rows = personal && typeof personal !== "string" ? personal.rows : [];
const hamstrings = rows.find((r) => r.muscle === "hamstrings");
expect("it gives hamstrings their weekly sets and aim", [hamstrings!.sets > 0, hamstrings!.aim], [true, { min: 10, max: 20 }]);
expect("calves carry no aim that would read as a miss", rows.find((r) => r.muscle === "calves")?.aim, null);

console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} failure(s).\n`);
process.exit(failures === 0 ? 0 : 1);
