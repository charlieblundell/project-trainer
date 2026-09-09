import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OnboardingData, SetLog, ChatMessage } from "./types";
import { WORKOUTS, todaysWorkoutId } from "./data";
import { supabase } from "./supabase";

type TrainingSession = {
  workoutId: string;
  exerciseIdx: number;
  loggedSets: Record<string, SetLog[]>;
  rpeValues: Record<string, number>;
  overrides: Record<string, { name: string; targetWeight: number; targetReps: number }>;
};

function emptySession(workoutId: string): TrainingSession {
  return { workoutId, exerciseIdx: 0, loggedSets: {}, rpeValues: {}, overrides: {} };
}

type AppState = {
  onboarding: OnboardingData;
  onboardingComplete: boolean;
  setOnboarding: (patch: Partial<OnboardingData>) => void;
  completeOnboarding: () => void;

  session: TrainingSession;
  startWorkout: (workoutId: string) => void;
  logSet: (exerciseId: string, set: SetLog) => void;
  submitRpe: (exerciseId: string, value: number) => void;
  nextExercise: () => void;
  swapExercise: (exerciseId: string, alt: { name: string; targetWeight: number; targetReps: number }) => void;
  lastCompletedSummary: { workoutId: string; loggedSets: Record<string, SetLog[]> } | null;
  completeWorkout: () => void;

  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      onboarding: { goal: null, experience: null, days: null, length: null, environment: null },
      onboardingComplete: false,
      setOnboarding: (patch) => set((s) => ({ onboarding: { ...s.onboarding, ...patch } })),
      completeOnboarding: () => set({ onboardingComplete: true }),

      session: emptySession(todaysWorkoutId()),
      startWorkout: (workoutId) => set({ session: emptySession(workoutId) }),
      logSet: (exerciseId, log) =>
        set((s) => {
          const current = s.session.loggedSets[exerciseId] ?? [];
          return {
            session: {
              ...s.session,
              loggedSets: { ...s.session.loggedSets, [exerciseId]: [...current, log] },
            },
          };
        }),
      submitRpe: (exerciseId, value) =>
        set((s) => ({
          session: { ...s.session, rpeValues: { ...s.session.rpeValues, [exerciseId]: value } },
        })),
      nextExercise: () =>
        set((s) => ({ session: { ...s.session, exerciseIdx: s.session.exerciseIdx + 1 } })),
      swapExercise: (exerciseId, alt) =>
        set((s) => ({
          session: { ...s.session, overrides: { ...s.session.overrides, [exerciseId]: alt } },
        })),
      lastCompletedSummary: null,
      completeWorkout: () => {
        const s = get().session;
        set({ lastCompletedSummary: { workoutId: s.workoutId, loggedSets: s.loggedSets } });
        supabase.auth.getUser().then(({ data }) => {
          if (!data.user) return;
          supabase.from("workout_sessions").insert({
            user_id: data.user.id,
            workout_id: s.workoutId,
            logged_sets: s.loggedSets,
          });
        });
      },

      messages: [{ role: "assistant", text: "Hey Charlie. What can I help with?" }],
      addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
    }),
    { name: "project-trainer-store" }
  )
);

export function currentWorkoutExercises(workoutId: string) {
  return WORKOUTS[workoutId]?.exercises ?? [];
}
