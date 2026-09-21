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
  /**
   * Consecutive sessions hitting the top of the rep range. Moving up a
   * bodyweight ladder is a big jump, so it takes more than one good day.
   */
  streak?: number;
};

/**
 * Something in a person's notes or age that changes how the whole plan is
 * built, not just which joints it steers around: an unsteady balance or
 * fragile bones rule out jumping and add balance work to every session.
 */
export type Caution = "balance" | "bone";

/** What was read from someone's own notes about injuries and health. */
export type NotesReading = { avoiding: BodyPart[]; cautions: Caution[] };

/** Which half of the body a session trains, used to keep accessories on-topic. */
export type Region = "upper" | "lower" | "core" | "full";

export type PlannedSession = {
  id: string;
  /** "Upper A", "Full Body B", "Conditioning" */
  name: string;
  /** Human-facing summary, e.g. "Upper Body" */
  focus: string;
  weekday: Weekday;
  estMinutes: number;
  region: Region;
  exercises: PlannedExercise[];
};

export type Plan = {
  createdAt: string;
  goal: string;
  level: Level;
  daysPerWeek: number;
  /** How many times the accessory work has been re-picked. */
  refreshes: number;
  /**
   * Accessory movements recently swapped out. Without this, a second refresh
   * hands straight back what the first one replaced. Oldest entries fall off,
   * so nothing is banned forever.
   */
  retired: string[];
  sessions: PlannedSession[];
  /** Body parts we steered around, derived from the user's own notes. */
  avoiding: BodyPart[];
  /** Whole-plan cautions from their notes (and age), which older plans don't have. */
  cautions?: Caution[];
  /**
   * The coach's reading of their notes, kept so a rebuild for some other
   * reason (a new schedule, better rules) doesn't have to ask again. Replaced
   * whenever the notes themselves change.
   */
  notesReading?: NotesReading;
  /** Compromises worth being upfront about, shown to the user. */
  notes: string[];
  /**
   * Set when someone saves changes in the plan editor. Their week is theirs from
   * then on: nothing offers to rebuild it over the top of what they chose.
   */
  editedByHand?: boolean;
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
  /**
   * The coach's reading of `considerations`, where one was made. It catches
   * what the keyword match can't ("my balance isn't great"); the keyword
   * match still runs, so a failed or missing reading only loses the extras.
   */
  notesReading?: NotesReading;
};
