import { profileFromOnboarding } from "@/lib/plan/generate";
import type { GeneratorProfile } from "@/lib/plan/types";
import type { OnboardingData } from "@/lib/types";

/** What a plan is built from. Health details only count with consent. */
export function planProfile(o: OnboardingData): GeneratorProfile {
  const consented = o.healthConsent === true;
  return {
    ...profileFromOnboarding(o),
    considerations: consented ? o.considerations : null,
    age: consented ? o.age : null,
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
