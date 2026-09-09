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

export type OnboardingData = {
  goal: string | null;
  experience: string | null;
  days: number | null;
  length: number | null;
  environment: string | null;
};

export type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};
