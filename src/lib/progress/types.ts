import type { SetLog } from "@/lib/types";

/** One completed workout, as it comes back from the database. */
export type WorkoutRecord = {
  workoutId: string;
  completedAt: string;
  loggedSets: Record<string, SetLog[]>;
  rpe: Record<string, number>;
};

/** How an exercise's best set is measured, which decides how it reads. */
export type Measure = "weight" | "reps" | "time" | "seconds";


export type SeriesPoint = {
  completedAt: string;
  /** The number that gets plotted. */
  value: number;
  /** How that number reads to a person: "62.5 kg x 8", "12 reps", "20 min". */
  label: string;
};

export type ExerciseSeries = {
  exerciseId: string;
  name: string;
  measure: Measure;
  points: SeriesPoint[];
  /** Difference between the first and last points, or null with one point. */
  change: number | null;
};

export type PersonalRecord = {
  exerciseId: string;
  name: string;
  label: string;
  achievedAt: string;
};

export type TrainingTotals = {
  workouts: number;
  sets: number;
  reps: number;
  /** Kilograms moved: weight x reps, over sets that carried weight. */
  volumeKg: number;
  /**
   * Sessions in the last four weeks against what the plan asks for, or null
   * when there's no plan to measure against.
   */
  consistency: number | null;
};

export type WeekBar = { weekStart: string; label: string; count: number };
