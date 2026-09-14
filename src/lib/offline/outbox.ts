"use client";

import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Plan } from "@/lib/plan/types";
import type { WorkoutRecord } from "@/lib/progress/types";
import type { Readiness } from "@/lib/plan/readiness";
import { isNetworkError } from "./network";

/*
 * Saves that couldn't reach the server, kept on the phone until they can.
 *
 * A workout finished in a basement gym used to fail its insert and vanish.
 * Now a save that fails for want of a connection lands here, in order, and
 * is sent when the connection comes back (on the `online` event, when the app
 * comes to the front, and when it opens). A save the server *refuses* is
 * retried a few times and then dropped with an error in the console, so one
 * bad row can't block everything queued behind it.
 *
 * Each item belongs to the account that made it and is only ever sent while
 * that account is signed in.
 */

const KEY = "trainer-outbox";
const MAX_ATTEMPTS = 5;

type WorkoutRow = {
  user_id: string;
  workout_id: string;
  logged_sets: WorkoutRecord["loggedSets"];
  rpe: WorkoutRecord["rpe"];
  /** Check-in answers, only ever present with health consent. */
  readiness: Readiness | null;
  /** When it was actually trained, not when it finally synced. */
  completed_at: string;
};

export type OutboxItem =
  | { id: string; userId: string; kind: "workout"; row: WorkoutRow; attempts: number }
  | { id: string; userId: string; kind: "plan"; plan: Plan; attempts: number };

function read(): OutboxItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as OutboxItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: OutboxItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // Storage full or blocked: nothing more this layer can do.
  }
  useOutbox.setState({ pending: items.length });
}

/** How many saves are waiting, for the offline pill. */
export const useOutbox = create<{ pending: number }>(() => ({ pending: 0 }));

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function queueWorkout(row: WorkoutRow) {
  write([...read(), { id: newId(), userId: row.user_id, kind: "workout", row, attempts: 0 }]);
}

/** Only the newest plan matters, so a queued plan replaces any older one for the same account. */
export function queuePlan(userId: string, plan: Plan) {
  const others = read().filter((item) => !(item.kind === "plan" && item.userId === userId));
  write([...others, { id: newId(), userId, kind: "plan", plan, attempts: 0 }]);
}

/** A plan saved straight to the server makes any older queued plan out of date. */
export function dropQueuedPlans(userId: string) {
  const items = read();
  const kept = items.filter((item) => !(item.kind === "plan" && item.userId === userId));
  if (kept.length !== items.length) write(kept);
}

export function hasQueuedPlan(userId: string): boolean {
  return read().some((item) => item.kind === "plan" && item.userId === userId);
}

/** Workouts trained but not yet on the server, in the shape history uses. */
export function queuedWorkouts(userId: string): WorkoutRecord[] {
  return read()
    .filter((item): item is Extract<OutboxItem, { kind: "workout" }> => item.kind === "workout" && item.userId === userId)
    .map((item) => ({
      workoutId: item.row.workout_id,
      completedAt: item.row.completed_at,
      loggedSets: item.row.logged_sets,
      rpe: item.row.rpe,
    }));
}

let flushing: Promise<void> | null = null;
const listeners = new Set<() => void>();

/** Called after a flush sends anything, so screens showing history can reload it. */
export function onSynced(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

/** Sends what's waiting, oldest first. Safe to call often; runs one at a time. */
export function flushOutbox(): Promise<void> {
  flushing ??= (async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user.id;
      if (!userId) return;

      let sent = false;
      for (const item of read()) {
        if (item.userId !== userId) continue;

        const { error } =
          item.kind === "workout"
            ? await supabase.from("workout_sessions").insert(item.row)
            : await supabase.from("plans").insert({ user_id: item.userId, data: item.plan });

        if (!error) {
          write(read().filter((i) => i.id !== item.id));
          sent = true;
          continue;
        }
        // Still no connection: stop, and try again next time.
        if (isNetworkError(error)) break;

        console.error(`Queued ${item.kind} save refused:`, error.message);
        const attempts = item.attempts + 1;
        write(
          attempts >= MAX_ATTEMPTS
            ? read().filter((i) => i.id !== item.id)
            : read().map((i) => (i.id === item.id ? { ...i, attempts } : i))
        );
      }
      if (sent) listeners.forEach((listener) => listener());
    } finally {
      flushing = null;
    }
  })();
  return flushing;
}

let started = false;

/** Starts sending queued saves whenever a connection is likely. */
export function startOutbox() {
  if (started || typeof window === "undefined") return;
  started = true;
  useOutbox.setState({ pending: read().length });
  window.addEventListener("online", () => void flushOutbox());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && navigator.onLine) void flushOutbox();
  });
  if (navigator.onLine) void flushOutbox();
}
