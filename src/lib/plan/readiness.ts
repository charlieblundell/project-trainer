import type { PlannedExercise } from "./types";

/** Answers to the pre-workout check-in. */
export type Readiness = {
  sleep: "poor" | "ok" | "good";
  soreness: "none" | "some" | "lots";
  jointPain: "none" | "mild" | "sharp";
};

/** Poor sleep or heavy soreness: a day to train, but not to push. */
export function isLowReadiness(readiness: Readiness | null | undefined): boolean {
  return !!readiness && (readiness.sleep === "poor" || readiness.soreness === "lots");
}

/**
 * A low-readiness day keeps the session but takes one set off each strength
 * exercise. The evidence on sleep loss says to expect less from a session,
 * not to skip it, and a dropped set keeps most of a session's benefit.
 * Timed work is left alone: it has one set already.
 */
export function adjustForReadiness(
  planned: PlannedExercise,
  readiness: Readiness | null | undefined
): PlannedExercise {
  if (!isLowReadiness(readiness)) return planned;
  if (planned.unit === "time" || planned.unit === "distance") return planned;
  return { ...planned, sets: Math.max(1, planned.sets - 1) };
}
