import { supabase } from "@/lib/supabase";
import type { WorkoutRecord } from "./types";

/** Every workout they've logged, oldest first. */
export async function loadHistory(userId: string): Promise<WorkoutRecord[]> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("workout_id, logged_sets, rpe, completed_at")
    .eq("user_id", userId)
    .order("completed_at", { ascending: true });

  if (error) {
    console.error("Failed to load history:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    workoutId: row.workout_id as string,
    completedAt: row.completed_at as string,
    loggedSets: (row.logged_sets ?? {}) as WorkoutRecord["loggedSets"],
    rpe: (row.rpe ?? {}) as WorkoutRecord["rpe"],
  }));
}
