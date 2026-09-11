import { supabase } from "@/lib/supabase";
import type { OnboardingData } from "@/lib/types";

/**
 * Writes the answers from first-time setup to the profile, including the
 * record that health consent was given. Shared by the two ways a plan starts:
 * letting the app write one, and building your own week.
 */
export async function saveSetupProfile(userId: string, onboarding: OnboardingData): Promise<void> {
  const consented = onboarding.healthConsent === true;
  const { error } = await supabase
    .from("profiles")
    .update({
      goal: onboarding.goal,
      experience: onboarding.experience,
      days: onboarding.days,
      length: onboarding.length,
      environment: onboarding.environment,
      equipment: onboarding.equipment,
      liked_exercises: onboarding.likedExercises,
      disliked_exercises: onboarding.dislikedExercises,
      training_days: onboarding.trainingDays,
      // Health details are only stored, or used for the plan, with consent.
      bodyweight_kg: consented ? onboarding.bodyweightKg : null,
      age: consented ? onboarding.age : null,
      height_cm: consented ? onboarding.heightCm : null,
      sex: consented ? onboarding.sex : null,
      considerations: consented ? onboarding.considerations : null,
      // The record that consent was given, and when.
      health_consent_at: consented ? new Date().toISOString() : null,
    })
    .eq("id", userId);

  if (error) throw new Error(error.message);
}
