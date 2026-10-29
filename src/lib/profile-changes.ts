import { profileFromOnboarding } from "@/lib/plan/generate";
import type { GeneratorProfile } from "@/lib/plan/types";
import type { OnboardingData } from "@/lib/types";

/** What a plan is built from. Health details only count with consent. */
export function planProfile(o: OnboardingData): GeneratorProfile {
  const consented = o.healthConsent === true;
  return {
    ...profileFromOnboarding(o),
    considerations: consented ? o.considerations : null,
    age: o.age,
  };
}

function planKey(o: OnboardingData): string {
  const p = planProfile(o);
  // The same equipment or exercises ticked in a different order build the same plan.
  return JSON.stringify({
    ...p,
    equipment: [...p.equipment].sort(),
    likedExercises: [...p.likedExercises].sort(),
    dislikedExercises: [...p.dislikedExercises].sort(),
  });
}

/** Whether a change to someone's answers would build them a different plan. */
export function affectsPlan(before: OnboardingData, after: OnboardingData): boolean {
  return planKey(before) !== planKey(after);
}

/**
 * Whether a rebuild should hold on to the exercises they already do. Usually
 * yes: a new schedule or goal isn't a request for new movements. Not when
 * they've gained equipment, though. Someone who joins a gym kept their whole
 * home routine, with a cable crunch swapped in, which is exactly the opposite
 * of what joining a gym was for.
 */
export function keepsCurrentExercises(before: OnboardingData, after: OnboardingData): boolean {
  return !after.equipment.some((kit) => !before.equipment.includes(kit));
}
