/**
 * Generates plans for a spread of user profiles and prints them, so the engine
 * can be sanity-checked without clicking through onboarding.
 * Run with: npm run preview:plans
 */
import { generatePlan } from "../src/lib/plan/generate";
import { EXERCISES_BY_ID } from "../src/lib/exercises";
import { targetLabel } from "../src/lib/plan/helpers";

import type { GeneratorProfile } from "../src/lib/plan/types";

const base: GeneratorProfile = {
  goal: "Build muscle",
  experience: "I've been training a while",
  days: 4,
  length: 60,
  equipment: ["barbell", "dumbbell", "bench", "pullup_bar", "cable", "machine", "squat_rack"],
  likedExercises: [],
  dislikedExercises: [],
  trainingDays: ["mon", "tue", "thu", "fri"],
  considerations: null,
  age: 34,
};

const profiles: { label: string; profile: GeneratorProfile }[] = [
  { label: "Gym / build muscle / 4 days / 60 min / intermediate", profile: base },
  {
    label: "Home, nothing at all / general health / 2 days / 20 min / beginner / age 68",
    profile: {
      ...base,
      goal: "General health",
      experience: "I'm new to training",
      days: 2,
      length: 20,
      equipment: ["bodyweight", "chair", "mat"],
      trainingDays: ["tue", "sat"],
      age: 68,
    },
  },
  {
    label: "Bands only / lose fat / 3 days / 30 min / beginner",
    profile: {
      ...base,
      goal: "Lose fat",
      experience: "I'm new to training",
      days: 3,
      length: 30,
      equipment: ["bands", "bodyweight", "mat"],
      trainingDays: ["mon", "wed", "fri"],
    },
  },
  {
    label: "Full gym / get stronger / 3 days / 90 min / advanced",
    profile: {
      ...base,
      goal: "Get stronger",
      experience: "I've trained consistently for years",
      days: 3,
      length: 90,
      trainingDays: ["mon", "wed", "fri"],
    },
  },
  {
    label: "Gym / build muscle / dodgy shoulder",
    profile: { ...base, considerations: "Dodgy left shoulder, overhead pressing aggravates it." },
  },
  {
    label: "Gym + cardio / improve endurance / 5 days / 45 min",
    profile: {
      ...base,
      goal: "Improve endurance",
      days: 5,
      length: 45,
      equipment: [...base.equipment, "cardio"],
      trainingDays: ["mon", "tue", "wed", "fri", "sat"],
    },
  },
  {
    label: "Dumbbells at home / build muscle / likes goblet squat, hates burpees",
    profile: {
      ...base,
      equipment: ["dumbbell", "bodyweight", "mat"],
      likedExercises: ["goblet_squat"],
      dislikedExercises: ["burpee"],
    },
  },
];

for (const { label, profile } of profiles) {
  const plan = generatePlan(profile);
  console.log("\n" + "=".repeat(78));
  console.log(label);
  console.log("=".repeat(78));
  if (plan.notes.length) plan.notes.forEach((n) => console.log("  ! " + n));

  for (const session of plan.sessions) {
    console.log(`\n  ${session.weekday.toUpperCase()}  ${session.name} — ${session.focus} (~${session.estMinutes} min)`);
    if (session.exercises.length === 0) {
      console.log("      (empty!)");
      continue;
    }
    for (const ex of session.exercises) {
      const def = EXERCISES_BY_ID[ex.exerciseId];
      const target = targetLabel(ex);
      console.log(`      ${(def?.name ?? ex.exerciseId).padEnd(34)} ${target.padEnd(14)} rest ${ex.restSeconds}s`);
    }
  }
}

console.log("");
