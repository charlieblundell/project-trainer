import { EXERCISES_BY_ID } from "@/lib/exercises";
import type { SetLog } from "@/lib/types";
import type {
  ExerciseSeries,
  Measure,
  PersonalRecord,
  SeriesPoint,
  TrainingTotals,
  WeekBar,
  WorkoutRecord,
} from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * How this exercise's best set should be read. The library knows, but a
 * session logged against an exercise that has since left the library still has
 * to render, so the sets themselves are the fallback.
 */
function measureOf(exerciseId: string, sets: SetLog[]): Measure {
  const unit = EXERCISES_BY_ID[exerciseId]?.unit;
  if (unit === "weight_reps") return "weight";
  if (unit === "reps") return "reps";
  if (unit === "time" || unit === "distance") return "time";
  return sets.some((s) => s.w > 0) ? "weight" : "reps";
}

function nameOf(exerciseId: string): string {
  return EXERCISES_BY_ID[exerciseId]?.name ?? exerciseId;
}

/**
 * Epley's estimate of a one-rep max. Used only to rank one set against
 * another, so that 100 kg x 5 correctly beats 90 kg x 8 — never shown as a
 * number, because it's an estimate and nobody asked for it.
 */
function oneRepMax(set: SetLog): number {
  return set.w * (1 + set.r / 30);
}

/** The set worth remembering from one session's worth of an exercise. */
function bestSet(sets: SetLog[], measure: Measure): SetLog | null {
  if (sets.length === 0) return null;
  const rank = measure === "weight" ? oneRepMax : (s: SetLog) => s.r;
  return sets.reduce((best, s) => (rank(s) > rank(best) ? s : best));
}

function labelFor(set: SetLog, measure: Measure): string {
  if (measure === "weight") return `${set.w} kg × ${set.r}`;
  if (measure === "time") return `${set.r} min`;
  return `${set.r} rep${set.r === 1 ? "" : "s"}`;
}

/** What gets plotted: the weight for weighted work, otherwise reps or minutes. */
function plotValue(set: SetLog, measure: Measure): number {
  return measure === "weight" ? set.w : set.r;
}

/**
 * One line per exercise, a point per session. Ordered so the movements
 * they've trained most recently come first, since that's what they came
 * to look at.
 */
export function strengthSeries(records: WorkoutRecord[]): ExerciseSeries[] {
  const byExercise = new Map<string, SeriesPoint[]>();
  const measures = new Map<string, Measure>();
  const lastSeen = new Map<string, number>();

  const ordered = [...records].sort(
    (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
  );

  for (const record of ordered) {
    for (const [exerciseId, sets] of Object.entries(record.loggedSets)) {
      if (sets.length === 0) continue;
      const measure = measures.get(exerciseId) ?? measureOf(exerciseId, sets);
      measures.set(exerciseId, measure);

      const best = bestSet(sets, measure);
      if (!best) continue;

      const points = byExercise.get(exerciseId) ?? [];
      points.push({
        completedAt: record.completedAt,
        value: plotValue(best, measure),
        label: labelFor(best, measure),
      });
      byExercise.set(exerciseId, points);
      lastSeen.set(exerciseId, new Date(record.completedAt).getTime());
    }
  }

  return [...byExercise.entries()]
    .map(([exerciseId, points]) => ({
      exerciseId,
      name: nameOf(exerciseId),
      measure: measures.get(exerciseId) ?? "reps",
      points,
      change: points.length > 1 ? points[points.length - 1].value - points[0].value : null,
    }))
    .sort((a, b) => (lastSeen.get(b.exerciseId) ?? 0) - (lastSeen.get(a.exerciseId) ?? 0));
}

/** The single best set of each movement, most recently set first. */
export function personalRecords(records: WorkoutRecord[]): PersonalRecord[] {
  const best = new Map<string, { set: SetLog; measure: Measure; achievedAt: string }>();

  for (const record of records) {
    for (const [exerciseId, sets] of Object.entries(record.loggedSets)) {
      if (sets.length === 0) continue;
      const measure = best.get(exerciseId)?.measure ?? measureOf(exerciseId, sets);
      const candidate = bestSet(sets, measure);
      if (!candidate) continue;

      const current = best.get(exerciseId);
      const rank = measure === "weight" ? oneRepMax : (s: SetLog) => s.r;
      if (!current || rank(candidate) > rank(current.set)) {
        best.set(exerciseId, { set: candidate, measure, achievedAt: record.completedAt });
      }
    }
  }

  return [...best.entries()]
    .map(([exerciseId, { set, measure, achievedAt }]) => ({
      exerciseId,
      name: nameOf(exerciseId),
      label: labelFor(set, measure),
      achievedAt,
    }))
    .sort((a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime());
}

export function trainingTotals(
  records: WorkoutRecord[],
  daysPerWeek: number | null,
  now = new Date()
): TrainingTotals {
  let sets = 0;
  let reps = 0;
  let volumeKg = 0;

  for (const record of records) {
    for (const logged of Object.values(record.loggedSets)) {
      for (const set of logged) {
        sets += 1;
        reps += set.r;
        // Bodyweight and timed work log a zero weight, and counting those as
        // zero volume is right — they just don't contribute to this number.
        if (set.w > 0) volumeKg += set.w * set.r;
      }
    }
  }

  let consistency: number | null = null;
  if (daysPerWeek && daysPerWeek > 0) {
    const cutoff = now.getTime() - 28 * DAY_MS;
    const recent = records.filter((r) => new Date(r.completedAt).getTime() >= cutoff).length;
    consistency = Math.min(1, recent / (daysPerWeek * 4));
  }

  return { workouts: records.length, sets, reps, volumeKg: Math.round(volumeKg), consistency };
}

/** Monday of the week a date falls in, at midnight. */
function weekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

/**
 * Sessions per week over the recent past, oldest first. Weeks with nothing in
 * them are included on purpose — a gap is information.
 */
export function sessionsPerWeek(
  records: WorkoutRecord[],
  weeks = 12,
  now = new Date()
): WeekBar[] {
  const counts = new Map<number, number>();
  for (const record of records) {
    const key = weekStart(new Date(record.completedAt)).getTime();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const thisWeek = weekStart(now);
  const bars: WeekBar[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(thisWeek);
    start.setDate(start.getDate() - i * 7);
    bars.push({
      weekStart: start.toISOString(),
      label: `${start.getDate()} ${start.toLocaleString("en-AU", { month: "short" })}`,
      count: counts.get(start.getTime()) ?? 0,
    });
  }
  return bars;
}
