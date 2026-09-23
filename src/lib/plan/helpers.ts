import { EXERCISES_BY_ID, countsSeconds, formatDuration } from "@/lib/exercises";
import type { Weekday } from "@/lib/types";
import type { Plan, PlannedExercise, PlannedSession } from "./types";

export const WEEKDAY_ORDER: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

export function todayWeekday(now = new Date()): Weekday {
  // getDay() is Sunday-first; our week starts Monday.
  return WEEKDAY_ORDER[(now.getDay() + 6) % 7];
}

export function sessionForToday(plan: Plan | null, now = new Date()): PlannedSession | null {
  if (!plan) return null;
  const today = todayWeekday(now);
  return plan.sessions.find((s) => s.weekday === today) ?? null;
}

/** The next session due, starting from today and wrapping around the week. */
export function nextSession(plan: Plan | null, now = new Date()): PlannedSession | null {
  if (!plan || plan.sessions.length === 0) return null;
  const startIdx = WEEKDAY_ORDER.indexOf(todayWeekday(now));
  for (let i = 0; i < 7; i++) {
    const day = WEEKDAY_ORDER[(startIdx + i) % 7];
    const found = plan.sessions.find((s) => s.weekday === day);
    if (found) return found;
  }
  return null;
}

/**
 * Which week of training they're on. The plan has no end date, so this counts
 * up from the day it was built rather than down toward a finish line.
 */
export function weekNumber(plan: Plan, now = new Date()): number {
  const started = new Date(plan.createdAt).getTime();
  const weeks = Math.floor((now.getTime() - started) / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, weeks + 1);
}

export function sessionById(plan: Plan | null, id: string): PlannedSession | null {
  return plan?.sessions.find((s) => s.id === id) ?? null;
}

export function exerciseName(planned: PlannedExercise): string {
  return EXERCISES_BY_ID[planned.exerciseId]?.name ?? planned.exerciseId;
}

/** "62.5 kg x 8", "3 x 8-12", "20 min" — whatever suits how it's measured. */
export function targetLabel(planned: PlannedExercise): string {
  if (planned.unit === "time" || planned.unit === "distance") {
    const duration = formatDuration(planned.seconds ?? 0, countsSeconds(planned.exerciseId, planned.unit));
    return planned.sets > 1 ? `${planned.sets} x ${duration}` : duration;
  }
  const reps = planned.repMin === planned.repMax ? `${planned.repMax}` : `${planned.repMin}-${planned.repMax}`;
  if (planned.targetWeightKg != null) {
    // On a rep-counted movement a target weight can only be weight added to
    // bodyweight, and saying "20 kg" for a calf raise would read as the total.
    const prefix = planned.unit === "reps" ? "+" : "";
    return `${prefix}${planned.targetWeightKg} kg · ${planned.sets} x ${reps}`;
  }
  return `${planned.sets} x ${reps}`;
}

/** Rest-day view of the week, for the plan screen. */
export function weekOverview(plan: Plan | null): { weekday: Weekday; session: PlannedSession | null }[] {
  return WEEKDAY_ORDER.map((weekday) => ({
    weekday,
    session: plan?.sessions.find((s) => s.weekday === weekday) ?? null,
  }));
}
