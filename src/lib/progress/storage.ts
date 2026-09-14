import { supabase } from "@/lib/supabase";
import { queuedWorkouts } from "@/lib/offline/outbox";
import type { WorkoutRecord } from "./types";

/*
 * History is kept on the phone as well, so Home and Progress still show what
 * someone has done when there's no connection. Only what these screens read
 * is kept: which session, the sets and effort, and when.
 */
const CACHE_PREFIX = "trainer-history:";

function cached(userId: string): WorkoutRecord[] {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + userId);
    return raw ? (JSON.parse(raw) as WorkoutRecord[]) : [];
  } catch {
    return [];
  }
}

function remember(userId: string, records: WorkoutRecord[]) {
  try {
    localStorage.setItem(CACHE_PREFIX + userId, JSON.stringify(records));
  } catch {
    // Full or blocked storage just means no offline copy.
  }
}

/** Drops every account's history copy from this device, on sign-out. */
export function forgetCachedHistory() {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(CACHE_PREFIX)) localStorage.removeItem(key);
    }
  } catch {}
}

/**
 * Every workout they've logged, oldest first: the server's record, or the
 * phone's last copy without a connection, plus anything trained offline
 * that's still waiting to sync.
 */
export async function loadHistory(userId: string): Promise<WorkoutRecord[]> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("workout_id, logged_sets, rpe, completed_at")
    .eq("user_id", userId)
    .order("completed_at", { ascending: true });

  let records: WorkoutRecord[];
  if (error) {
    console.error("Failed to load history:", error.message);
    records = cached(userId);
  } else {
    records = (data ?? []).map((row) => ({
      workoutId: row.workout_id as string,
      completedAt: row.completed_at as string,
      loggedSets: (row.logged_sets ?? {}) as WorkoutRecord["loggedSets"],
      rpe: (row.rpe ?? {}) as WorkoutRecord["rpe"],
    }));
    remember(userId, records);
  }

  const waiting = queuedWorkouts(userId);
  if (waiting.length === 0) return records;
  return [...records, ...waiting].sort((a, b) => a.completedAt.localeCompare(b.completedAt));
}
