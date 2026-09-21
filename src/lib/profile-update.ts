import { supabase } from "@/lib/supabase";
import { rebuildPlan } from "@/lib/plan/generate";
import { savePlan } from "@/lib/plan/storage";
import type { Plan } from "@/lib/plan/types";
import type { OnboardingData } from "@/lib/types";
import { affectsPlan, planProfile } from "@/lib/profile-changes";
import { readNotes } from "@/lib/ai/client";

export type ProfileSaveResult = { ok: true; plan: Plan | null; rebuilt: boolean } | { ok: false };

/**
 * Saves edited answers, and rebuilds the plan if the change affects it. If the
 * plan fails to save, the whole thing reports failure, so trying again rebuilds
 * from the same starting point.
 */
export async function saveProfileChanges(
  userId: string,
  before: OnboardingData,
  after: OnboardingData,
  plan: Plan | null
): Promise<ProfileSaveResult> {
  const consented = after.healthConsent === true;
  const { error } = await supabase
    .from("profiles")
    .update({
      goal: after.goal,
      experience: after.experience,
      days: after.days,
      length: after.length,
      environment: after.environment,
      equipment: after.equipment,
      liked_exercises: after.likedExercises,
      disliked_exercises: after.dislikedExercises,
      training_days: after.trainingDays,
      // Health details are only stored with consent. The record of when consent
      // was given is left alone: editing isn't consenting again.
      bodyweight_kg: consented ? after.bodyweightKg : null,
      age: consented ? after.age : null,
      height_cm: consented ? after.heightCm : null,
      sex: consented ? after.sex : null,
      considerations: consented ? after.considerations : null,
    })
    .eq("id", userId);

  if (error) {
    console.error("Failed to save profile changes:", error.message);
    return { ok: false };
  }

  if (!plan || !affectsPlan(before, after)) return { ok: true, plan, rebuilt: false };

  // New notes are read again; otherwise the plan keeps its last reading of them.
  const profile = planProfile(after);
  const notesChanged = planProfile(before).considerations !== profile.considerations;
  if (notesChanged) profile.notesReading = (await readNotes(profile.considerations)) ?? { avoiding: [], cautions: [] };
  const next = rebuildPlan(plan, profile);
  try {
    await savePlan(userId, next);
  } catch {
    // Already logged in savePlan.
    return { ok: false };
  }
  return { ok: true, plan: next, rebuilt: true };
}
