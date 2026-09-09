import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OnboardingData, SetLog, ChatMessage } from "./types";
import { EMPTY_ONBOARDING } from "./types";
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

  ownerId: string | null;
  claimForUser: (userId: string) => void;
};

const INITIAL_GREETING: ChatMessage = {
  role: "assistant",
  text: "Hey. What can I help with?",
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      onboarding: EMPTY_ONBOARDING,
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

      messages: [INITIAL_GREETING],
      addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

      ownerId: null,
      claimForUser: (userId) => {
        if (get().ownerId === userId) return;
        set({
          ownerId: userId,
          messages: [INITIAL_GREETING],
          session: emptySession(todaysWorkoutId()),
          lastCompletedSummary: null,
          onboarding: EMPTY_ONBOARDING,
          onboardingComplete: false,
        });
      },
    }),
    {
      name: "project-trainer-store",
      version: 2,
      // A saved copy from an older build is missing whatever fields have been
      // added since. Backfilling defaults keeps existing browsers from
      // restoring a half-shaped object over the current one.
      migrate: (persisted) => {
        const state = (persisted ?? {}) as Partial<AppState>;
        return {
          ...state,
          onboarding: { ...EMPTY_ONBOARDING, ...(state.onboarding ?? {}) },
        } as AppState;
      },
      merge: (persisted, current) => {
        const state = (persisted ?? {}) as Partial<AppState>;
        return {
          ...current,
          ...state,
          onboarding: { ...EMPTY_ONBOARDING, ...(state.onboarding ?? {}) },
        };
      },
    }
  )
);

export function currentWorkoutExercises(workoutId: string) {
  return WORKOUTS[workoutId]?.exercises ?? [];
}
