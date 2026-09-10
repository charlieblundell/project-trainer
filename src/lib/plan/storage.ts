import { supabase } from "@/lib/supabase";
import { normalizePlan } from "./normalize";
import type { Plan } from "./types";

export async function savePlan(userId: string, plan: Plan): Promise<void> {
  const { error } = await supabase.from("plans").insert({ user_id: userId, data: plan });
  if (error) {
    // Losing this silently would leave someone staring at an empty plan screen.
    console.error("Failed to save plan:", error.message);
    throw new Error(error.message);
  }
}

/** The most recently generated plan, or null if they have none yet. */
export async function loadPlan(userId: string): Promise<Plan | null> {
  const { data } = await supabase
    .from("plans")
    .select("data")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.data) return null;
  return normalizePlan(data.data as Plan);
}
