import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OnboardingData, SetLog, ChatMessage } from "./types";
import { EMPTY_ONBOARDING } from "./types";
import { supabase } from "./supabase";
import type { Plan } from "./plan/types";
import { applyProgression, type Change } from "./plan/progress";
import { savePlan } from "./plan/storage";
import type { Equipment } from "./exercises";

type TrainingSession = {
  /** Id of the session within the user's generated plan. */
  workoutId: string;
  exerciseIdx: number;
  loggedSets: Record<string, SetLog[]>;
  rpeValues: Record<string, number>;
  /** Swapped-in replacements, keyed by the planned exercise they replace. */
  overrides: Record<string, { exerciseId: string }>;
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
  swapExercise: (exerciseId: string, alt: { exerciseId: string }) => void;
  lastCompletedSummary: { workoutId: string; loggedSets: Record<string, SetLog[]> } | null;
  /** What progression did to the plan after the last session. */
  lastChanges: Change[];
  completeWorkout: () => Promise<void>;

  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;

  plan: Plan | null;
  setPlan: (plan: Plan | null) => void;

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

      session: emptySession(""),
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
      lastChanges: [],
      completeWorkout: async () => {
        const s = get().session;
        const currentPlan = get().plan;
        const equipment = get().onboarding.equipment as Equipment[];

        set({ lastCompletedSummary: { workoutId: s.workoutId, loggedSets: s.loggedSets } });

        const { data } = await supabase.auth.getUser();
        if (!data.user) return;

        // Supabase query builders are lazy — without awaiting, the insert is
        // built and never sent. This silently dropped every logged workout.
        const { error } = await supabase.from("workout_sessions").insert({
          user_id: data.user.id,
          workout_id: s.workoutId,
          logged_sets: s.loggedSets,
          rpe: s.rpeValues,
        });
        if (error) console.error("Failed to save workout:", error.message);

        // Feed the results back into the plan so next week's targets move.
        if (currentPlan) {
          const { plan: nextPlan, changes } = applyProgression(
            currentPlan,
            s.workoutId,
            s.loggedSets,
            s.rpeValues,
            equipment
          );
          set({ plan: nextPlan, lastChanges: changes });
          try {
            await savePlan(data.user.id, nextPlan);
          } catch {
            // Already logged in savePlan; the in-memory plan still reflects it.
          }
        }
      },

      messages: [INITIAL_GREETING],
      addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

      plan: null,
      setPlan: (plan) => set({ plan }),

      ownerId: null,
      claimForUser: (userId) => {
        if (get().ownerId === userId) return;
        set({
          ownerId: userId,
          messages: [INITIAL_GREETING],
          session: emptySession(""),
          lastCompletedSummary: null,
          lastChanges: [],
          onboarding: EMPTY_ONBOARDING,
          onboardingComplete: false,
          plan: null,
        });
      },
    }),
    {
      name: "project-trainer-store",
      version: 3,
      // A saved copy from an older build is missing whatever fields have been
      // added since. Backfilling defaults keeps existing browsers from
      // restoring a half-shaped object over the current one.
      migrate: (persisted, from) => {
        const state = (persisted ?? {}) as Partial<AppState>;
        return {
          ...state,
          onboarding: { ...EMPTY_ONBOARDING, ...(state.onboarding ?? {}) },
          // v3 changed what a session points at (hardcoded workout -> generated
          // plan session) and the shape of a swap. An in-progress session from
          // before that can't be resumed, so drop it rather than half-render it.
          ...(from < 3 ? { session: emptySession(""), lastCompletedSummary: null } : {}),
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


