import { supabase } from "@/lib/supabase";
import { loadPlan, savePlan } from "@/lib/plan/storage";
import type { Plan } from "@/lib/plan/types";

/*
 * Health information — bodyweight, height, age, sex and injury notes — is
 * sensitive information under the Privacy Act, so it's only collected and
 * kept with consent, and removed when that consent is withdrawn.
 */

export const CLEARED_HEALTH_FIELDS = {
  bodyweightKg: null,
  age: null,
  heightCm: null,
  sex: null,
  considerations: null,
};

type HealthRow = {
  bodyweight_kg?: number | null;
  age?: number | null;
  height_cm?: number | null;
  sex?: string | null;
  considerations?: string | null;
};

export function hasHealthDetails(row: HealthRow): boolean {
  return (
    row.bodyweight_kg != null ||
    row.age != null ||
    row.height_cm != null ||
    row.sex != null ||
    !!row.considerations?.trim()
  );
}

export async function grantHealthConsent(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from("profiles")
    .update({ health_consent_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) console.error("Failed to record health consent:", error.message);
  return !error;
}

/**
 * Plan notes the generator only writes because of injury notes. Matched on the
 * generator's own wording in lib/plan/generate.ts — if that wording changes,
 * these have to change with it.
 */
const HEALTH_NOTE_MARKERS = [
  "Steering away from anything that loads",
  "every option there would have loaded a sore area",
  "usually well tolerated",
  "short balance exercise",
  "check with your doctor before loading heavily",
  "curls or twists your spine under load",
];

/** The plan without anything that was worked out from someone's injury notes. */
export function withoutHealthDerived(plan: Plan): Plan {
  return {
    ...plan,
    avoiding: [],
    cautions: [],
    notesReading: undefined,
    notes: plan.notes.filter((note) => !HEALTH_NOTE_MARKERS.some((marker) => note.includes(marker))),
  };
}

/**
 * Deletes someone's health details and the consent record, and strips what the
 * plan inferred from their injury notes. The exercises already chosen stay, so
 * nobody loses their progress for changing their mind. Earlier plan versions
 * kept as history still contain the old notes until the account is deleted.
 */
export async function withdrawHealthConsent(
  userId: string,
  plan: Plan | null
): Promise<{ ok: boolean; plan: Plan | null }> {
  const { error } = await supabase
    .from("profiles")
    .update({
      bodyweight_kg: null,
      age: null,
      height_cm: null,
      sex: null,
      considerations: null,
      health_consent_at: null,
    })
    .eq("id", userId);

  if (error) {
    console.error("Failed to withdraw health consent:", error.message);
    return { ok: false, plan };
  }

  // Check-in answers saved with past workouts are health information too.
  const { error: readinessError } = await supabase
    .from("workout_sessions")
    .update({ readiness: null })
    .eq("user_id", userId)
    .not("readiness", "is", null);
  if (readinessError) {
    console.error("Failed to clear check-in answers:", readinessError.message);
    return { ok: false, plan };
  }

  const current = plan ?? (await loadPlan(userId).catch(() => null));
  if (!current) return { ok: true, plan: null };

  const cleaned = withoutHealthDerived(current);
  const changed = current.avoiding.length > 0 || cleaned.notes.length !== current.notes.length;
  if (changed) {
    try {
      await savePlan(userId, cleaned);
    } catch {
      // Already logged in savePlan; the profile itself has been cleared.
    }
  }
  return { ok: true, plan: cleaned };
}
