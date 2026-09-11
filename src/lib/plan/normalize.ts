import { EXERCISES_BY_ID } from "@/lib/exercises";
import { regionOf } from "./generate";
import type { Plan, PlannedSession, Region } from "./types";

/** The shape a plan can come back in: anything added since it was saved is missing. */
type StoredPlan = Omit<Plan, "refreshes" | "retired" | "sessions"> & {
  refreshes?: number;
  retired?: string[];
  sessions: (Omit<PlannedSession, "region"> & { region?: Region })[];
};

/**
 * Plans live in the database and in the browser's own storage, so a plan built
 * by last week's code can arrive at today's screens. Filling in what's missing
 * on the way in means no screen has to guard against a field that only exists
 * on newer plans.
 */
export function normalizePlan(plan: StoredPlan): Plan {
  return {
    ...plan,
    refreshes: plan.refreshes ?? 0,
    retired: plan.retired ?? [],
    sessions: plan.sessions.map((session) => ({
      ...session,
      region: session.region ?? inferRegion(session),
    })),
  };
}

/** Reads a session's region back off the movements it already contains. */
export function inferRegion(session: { exercises: { exerciseId: string }[] }): Region {
  let upper = 0;
  let lower = 0;
  for (const planned of session.exercises) {
    const def = EXERCISES_BY_ID[planned.exerciseId];
    if (!def) continue;
    const region = regionOf(def);
    if (region === "upper") upper += 1;
    if (region === "lower") lower += 1;
  }
  // Work on both halves means a full-body day. Guessing "upper" there would
  // narrow the accessory pool of a session that was never meant to be narrow.
  if (upper > 0 && lower > 0) return "full";
  if (lower > upper) return "lower";
  if (upper > 0) return "upper";
  return "full";
}
