import type { PlanProposal } from "@/lib/plan/proposal";
/** One logged set: weight in kg, and reps — or minutes, for timed work. */
export type SetLog = { w: number; r: number };

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
  /**
   * Permission to collect health information. null until they've been asked;
   * the health questions are only shown, and their answers only kept, when
   * this is true.
   */
  healthConsent: boolean | null;
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
  healthConsent: null,
};

export type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  /** A change to the plan the coach proposed with this reply, and what became of it. */
  proposal?: PlanProposal;
};

/** One conversation with the coach. A new one starts each day. */
export type Chat = {
  id: string;
  startedAt: string;
  /** When the last message was added, which decides when a new day's chat starts. */
  updatedAt: string;
  messages: ChatMessage[];
};
