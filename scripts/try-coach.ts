/**
 * Tries the coach against the real model with a sample athlete, to see how it
 * answers and what changes it proposes. Costs a few cents a run, so it's not
 * part of CI. Needs ANTHROPIC_API_KEY in .env.local.
 * Run with: npx tsx scripts/try-coach.ts
 */
import { readFileSync } from "node:fs";
import { generatePlan } from "../src/lib/plan/generate";
import { describeChanges } from "../src/lib/plan/proposal";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^(ANTHROPIC_API_KEY)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const profile = {
  goal: "Build muscle",
  experience: "I've been training a while",
  days: 3,
  length: 60,
  environment: "Full gym",
  equipment: ["barbell", "dumbbell", "bench", "cable", "machine", "squat_rack", "pullup_bar", "bodyweight"],
  liked_exercises: [],
  disliked_exercises: [],
  training_days: ["mon", "wed", "fri"],
  age: 34,
  considerations: null,
};
const plan = generatePlan({
  goal: profile.goal,
  experience: profile.experience,
  days: profile.days,
  length: profile.length,
  equipment: profile.equipment,
  likedExercises: [],
  dislikedExercises: [],
  trainingDays: ["mon", "wed", "fri"],
  considerations: null,
  age: profile.age,
});

const QUESTIONS = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
      "My shoulder has been achy on overhead press. Can we swap it for something else?",
      "Can I train Wednesday's session on Thursday instead from now on?",
      "Why do I do Romanian deadlifts?",
      "Can you make my bench press 3 sets of 5 at 80kg?",
    ];

async function main() {
  const { askCoach } = await import("../src/lib/ai/coach");
  for (const question of QUESTIONS) {
    const answer = await askCoach({ name: "Sam", profile, plan, recentSessions: [], messages: [{ role: "user", text: question }] });
    console.log(`\n> ${question}\n${answer?.reply}`);
    if (answer?.proposal) {
      console.log(`  [card] ${answer.proposal.summary}`);
      for (const line of describeChanges(plan, answer.proposal.changes)) console.log(`         ${line}`);
    }
  }
}
main();
