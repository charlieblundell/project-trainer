import { supabase } from "@/lib/supabase";
import { isNetworkError } from "@/lib/offline/network";
import { dropQueuedPlans, queuePlan } from "@/lib/offline/outbox";
import { normalizePlan } from "./normalize";
import type { Plan } from "./types";

/**
 * Saves a new version of the plan. Without a connection it's queued on the
 * phone and sent later, so this only throws when the server refuses it.
 */
export async function savePlan(userId: string, plan: Plan): Promise<void> {
  const { error } = await supabase.from("plans").insert({ user_id: userId, data: plan });
  if (!error) {
    dropQueuedPlans(userId);
    return;
  }
  if (isNetworkError(error)) {
    queuePlan(userId, plan);
    return;
  }
  // Losing this silently would leave someone staring at an empty plan screen.
  console.error("Failed to save plan:", error.message);
  throw new Error(error.message);
}

/**
 * The most recently generated plan, or null if they have none yet. Throws
 * when it can't be read, so a missing connection is never mistaken for
 * "no plan" and the copy on the phone isn't wiped.
 */
export async function loadPlan(userId: string): Promise<Plan | null> {
  const { data, error } = await supabase
    .from("plans")
    .select("data")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data?.data) return null;
  return normalizePlan(data.data as Plan);
}
