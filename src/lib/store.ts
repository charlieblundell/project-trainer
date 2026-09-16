import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OnboardingData, SetLog, ChatMessage } from "./types";
import { EMPTY_ONBOARDING } from "./types";
import { supabase } from "./supabase";
import type { Plan } from "./plan/types";
import { applyProgression, type Change } from "./plan/progress";
import { savePlan } from "./plan/storage";
import { track } from "./analytics";
import { signedInUser } from "./session";
import { isNetworkError } from "./offline/network";
import { flushOutbox, queueWorkout } from "./offline/outbox";
import { normalizePlan } from "./plan/normalize";
import { profileFromOnboarding, refreshAccessories } from "./plan/generate";
import type { Equipment } from "./exercises";
import type { Billing } from "./billing/entitlement";
import type { Readiness } from "./plan/readiness";

type TrainingSession = {
  /** Id of the session within the user's generated plan. */
  workoutId: string;
  exerciseIdx: number;
  loggedSets: Record<string, SetLog[]>;
  rpeValues: Record<string, number>;
  /** Swapped-in replacements, keyed by the planned exercise they replace. */
  overrides: Record<string, { exerciseId: string }>;
  /**
   * Pre-workout check-in answers, "skipped" if they chose not to answer, or
   * null/absent before they've been asked (older saved sessions lack it).
   */
  readiness?: Readiness | "skipped" | null;
  /** Whether the warm-up screen has been dealt with, done or skipped. */
  warmedUp?: boolean;
  /**
   * When it was started, or picked back up. An unfinished session from an
   * earlier day is left behind rather than holding the Train tab. Absent on
   * sessions saved before this was kept.
   */
  startedAt?: string | null;
  /** When the last set was logged and the workout saved; absent while it's still going. */
  finishedAt?: string | null;
};

function emptySession(workoutId: string): TrainingSession {
  return {
    workoutId,
    exerciseIdx: 0,
    loggedSets: {},
    rpeValues: {},
    overrides: {},
    readiness: null,
    warmedUp: false,
    startedAt: workoutId ? new Date().toISOString() : null,
    finishedAt: null,
  };
}

function sameDay(iso: string, now: Date): boolean {
  const d = new Date(iso);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

/** A late session that runs past midnight still counts as today's. */
const STILL_CURRENT_MS = 6 * 60 * 60 * 1000;

export type SessionStatus =
  /** Nothing open. */
  | "none"
  /** Open, and started today (or in the last few hours). */
  | "active"
  /** Finished today. */
  | "finished"
  /** Started on an earlier day and never finished, or finished on an earlier day. */
  | "stale";

/**
 * The one answer to "is a workout under way?", shared by Home and the Train
 * tab so they never disagree about it.
 */
export function sessionStatus(session: TrainingSession, now = new Date()): SessionStatus {
  if (!session.workoutId) return "none";
  if (session.finishedAt) return sameDay(session.finishedAt, now) ? "finished" : "stale";
  const started = session.startedAt;
  if (!started) return "stale";
  const current = sameDay(started, now) || now.getTime() - new Date(started).getTime() < STILL_CURRENT_MS;
  return current ? "active" : "stale";
}

export function sessionHasSets(session: TrainingSession): boolean {
  return Object.values(session.loggedSets).some((l) => l.length > 0);
}

type AppState = {
  onboarding: OnboardingData;
  onboardingComplete: boolean;
  setOnboarding: (patch: Partial<OnboardingData>) => void;
  completeOnboarding: () => void;

  session: TrainingSession;
  startWorkout: (workoutId: string) => void;
  /** Picks an unfinished session from an earlier day back up where it was left. */
  resumeWorkout: () => void;
  logSet: (exerciseId: string, set: SetLog) => void;
  submitRpe: (exerciseId: string, value: number) => void;
  nextExercise: () => void;
  swapExercise: (exerciseId: string, alt: { exerciseId: string }) => void;
  setReadiness: (readiness: Readiness | "skipped") => void;
  markWarmedUp: () => void;
  lastCompletedSummary: { workoutId: string; loggedSets: Record<string, SetLog[]> } | null;
  /** What progression did to the plan after the last session. */
  lastChanges: Change[];
  /** True when the last finished workout is waiting on the phone for a connection. */
  lastSaveQueued: boolean;
  completeWorkout: () => Promise<void>;
  /**
   * Marks the open session finished, so the Train tab shows a well done instead
   * of reopening the last exercise. Called from the completion screen rather
   * than completeWorkout, which would flash that view while the save runs.
   */
  markSessionFinished: () => void;

  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;

  plan: Plan | null;
  setPlan: (plan: Plan | null) => void;
  /**
   * Total workouts logged. The plan has no end date, so this — not weeks
   * remaining — is what there is to count. It belongs to the person rather
   * than to the plan, so rebuilding a plan doesn't reset it to zero.
   */
  sessionsLogged: number;
  setSessionsLogged: (count: number) => void;
  /**
   * Trial and subscription state, or null if it couldn't be read. Shown and
   * used for the lock screen only — the server makes its own decision.
   */
  billing: Billing | null;
  setBilling: (billing: Billing | null) => void;
  /** Saves a plan the person changed by hand, in the editor or while training. */
  updatePlan: (plan: Plan) => Promise<void>;
  /** Re-picks the accessory work, leaving the main lifts and their weights alone. */
  refreshPlan: () => Promise<void>;
  /** What the last refresh swapped, shown once and then dismissed. */
  lastRefresh: { from: string; to: string }[] | null;
  clearLastRefresh: () => void;

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
      startWorkout: (workoutId) => {
        // Tapping Start again on a workout that's already going (from Home, the
        // Plan tab, anywhere) used to wipe every set logged so far.
        const current = get().session;
        if (current.workoutId === workoutId && sessionStatus(current) === "active") return;
        track("workout_started");
        set({ session: emptySession(workoutId) });
      },
      resumeWorkout: () => set((s) => ({ session: { ...s.session, startedAt: new Date().toISOString() } })),
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
      setReadiness: (readiness) => set((s) => ({ session: { ...s.session, readiness } })),
      markWarmedUp: () => set((s) => ({ session: { ...s.session, warmedUp: true } })),
      lastCompletedSummary: null,
      lastChanges: [],
      lastSaveQueued: false,
      markSessionFinished: () =>
        set((s) => (s.session.finishedAt ? {} : { session: { ...s.session, finishedAt: new Date().toISOString() } })),
      completeWorkout: async () => {
        const s = get().session;
        const currentPlan = get().plan;
        const equipment = get().onboarding.equipment as Equipment[];

        set({ lastCompletedSummary: { workoutId: s.workoutId, loggedSets: s.loggedSets }, lastSaveQueued: false });
        track("workout_completed", { sets: Object.values(s.loggedSets).reduce((n, l) => n + l.length, 0) });

        // The session stored on the phone, not a server round trip: this has to
        // work in a gym with no signal.
        // Asking can fail offline with an expired token, which used to drop the
        // workout on the floor. The account this phone's data belongs to is
        // the right answer then.
        const user = await signedInUser().catch(() => null);
        const userId = user?.id ?? get().ownerId;
        if (!userId) return;

        // Supabase query builders are lazy — without awaiting, the insert is
        // built and never sent. This silently dropped every logged workout.
        // Check-in answers are health information: only kept with consent.
        const readiness =
          s.readiness && s.readiness !== "skipped" && get().onboarding.healthConsent === true
            ? s.readiness
            : null;

        const row = {
          user_id: userId,
          workout_id: s.workoutId,
          logged_sets: s.loggedSets,
          rpe: s.rpeValues,
          readiness,
          completed_at: new Date().toISOString(),
        };
        const { error } = await supabase
          .from("workout_sessions")
          .insert(row)
          .then(
            (r) => r,
            (e: Error) => ({ error: { message: e.message } })
          );
        if (!error) {
          set((prev) => ({ sessionsLogged: prev.sessionsLogged + 1 }));
          // A good moment to send anything older that was waiting.
          void flushOutbox();
        } else {
          // No signal, an expired sign-in, a server hiccup: whatever the reason,
          // keep it on the phone and keep trying rather than lose the workout.
          if (!isNetworkError(error)) console.warn("Workout save refused, queued to retry:", error.message);
          queueWorkout(row);
          set((prev) => ({ sessionsLogged: prev.sessionsLogged + 1, lastSaveQueued: true }));
        }

        // Feed the results back into the plan so next week's targets move.
        // Only exercises that were seen through (they have an effort rating)
        // count: one set of three before finishing early isn't a failed lift.
        if (currentPlan) {
          const finishedSets = Object.fromEntries(
            Object.entries(s.loggedSets).filter(([id]) => s.rpeValues[id] !== undefined)
          );
          const { plan: nextPlan, changes } = applyProgression(
            currentPlan,
            s.workoutId,
            finishedSets,
            s.rpeValues,
            equipment,
            readiness
          );
          set({ plan: nextPlan, lastChanges: changes });
          try {
            await savePlan(userId, nextPlan);
          } catch {
            // Already logged in savePlan; the in-memory plan still reflects it.
          }
        }
      },

      messages: [INITIAL_GREETING],
      addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

      plan: null,
      setPlan: (plan) => set({ plan: plan ? normalizePlan(plan) : null }),
      sessionsLogged: 0,
      setSessionsLogged: (count) => set({ sessionsLogged: count }),
      billing: null,
      setBilling: (billing) => set({ billing }),
      lastRefresh: null,
      clearLastRefresh: () => set({ lastRefresh: null }),
      updatePlan: async (plan) => {
        // What progression or a refresh last did no longer describes this plan.
        set({ plan: normalizePlan(plan), lastChanges: [], lastRefresh: null });

        const user = await signedInUser();
        if (!user) return;
        try {
          await savePlan(user.id, plan);
        } catch {
          // Already logged in savePlan; the in-memory plan still reflects it.
        }
      },
      refreshPlan: async () => {
        const currentPlan = get().plan;
        if (!currentPlan) return;

        const { plan: nextPlan, swapped } = refreshAccessories(
          currentPlan,
          profileFromOnboarding(get().onboarding)
        );
        set({ plan: nextPlan, lastRefresh: swapped });

        const user = await signedInUser();
        if (!user) return;
        try {
          await savePlan(user.id, nextPlan);
        } catch {
          // Already logged in savePlan; the in-memory plan still reflects it.
        }
      },

      ownerId: null,
      claimForUser: (userId) => {
        if (get().ownerId === userId) return;
        set({
          ownerId: userId,
          messages: [INITIAL_GREETING],
          session: emptySession(""),
          lastCompletedSummary: null,
          lastChanges: [],
          lastSaveQueued: false,
          lastRefresh: null,
          onboarding: EMPTY_ONBOARDING,
          onboardingComplete: false,
          plan: null,
          sessionsLogged: 0,
          billing: null,
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
          // A plan saved by an older build is missing fields the screens now
          // read, and it comes back from here before the database catches up.
          plan: state.plan ? normalizePlan(state.plan) : null,
        };
      },
    }
  )
);


