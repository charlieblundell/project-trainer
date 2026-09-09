import type { BodyPart, Level, LoggingUnit } from "@/lib/exercises";
import type { Weekday } from "@/lib/types";

export type PlannedExercise = {
  exerciseId: string;
  sets: number;
  unit: LoggingUnit;
  /** Rep target range, for rep-based work. */
  repMin?: number;
  repMax?: number;
  /** Work duration, for time-based work (planks, intervals, steady cardio). */
  seconds?: number;
  restSeconds: number;
  /**
   * null means "not calibrated yet" — the first time someone meets a movement
   * we ask them to find a working weight rather than inventing one for them.
   */
  targetWeightKg: number | null;
};

export type PlannedSession = {
  id: string;
  /** "Upper A", "Full Body B", "Conditioning" */
  name: string;
  /** Human-facing summary, e.g. "Upper Body" */
  focus: string;
  weekday: Weekday;
  estMinutes: number;
  exercises: PlannedExercise[];
};

export type Plan = {
  createdAt: string;
  goal: string;
  level: Level;
  weeks: number;
  daysPerWeek: number;
  sessions: PlannedSession[];
  /** Body parts we steered around, derived from the user's own notes. */
  avoiding: BodyPart[];
  /** Compromises worth being upfront about, shown to the user. */
  notes: string[];
};

export type GeneratorProfile = {
  goal: string | null;
  experience: string | null;
  days: number | null;
  length: number | null;
  equipment: string[];
  likedExercises: string[];
  dislikedExercises: string[];
  trainingDays: Weekday[];
  considerations: string | null;
  age: number | null;
};
