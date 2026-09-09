export type SetLog = { w: number; r: number };

export type ExerciseAlternative = {
  name: string;
  targetWeight: number;
  targetReps: number;
};

export type Exercise = {
  id: string;
  name: string;
  targetWeight: number;
  targetReps: number;
  sets: number;
  previous: SetLog[];
  muscles?: string[];
  tips?: string[];
  alternatives?: ExerciseAlternative[];
};

export type Workout = {
  id: string;
  name: string;
  displayName: string;
  estMinutes: number;
  exercises: Exercise[];
};

export type PlanDay = {
  day: string;
  label: string;
  minutes: number | null;
  today?: boolean;
  workoutId?: string;
};

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type Sex = "male" | "female" | "prefer_not_to_say";

export type OnboardingData = {
  goal: string | null;
  experience: string | null;
  days: number | null;
  length: number | null;
  environment: string | null;
  equipment: string[];
  likedExercises: string[];
  dislikedExercises: string[];
  trainingDays: Weekday[];
  bodyweightKg: number | null;
  age: number | null;
  heightCm: number | null;
  sex: Sex | null;
  considerations: string | null;
};

export const EMPTY_ONBOARDING: OnboardingData = {
  goal: null,
  experience: null,
  days: null,
  length: null,
  environment: null,
  equipment: [],
  likedExercises: [],
  dislikedExercises: [],
  trainingDays: [],
  bodyweightKg: null,
  age: null,
  heightCm: null,
  sex: null,
  considerations: null,
};

export type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};
