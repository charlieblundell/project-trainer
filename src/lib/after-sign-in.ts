import { supabase } from "@/lib/supabase";

/**
 * Where someone goes once they're signed in, however they signed in: straight
 * home if they've finished setup, otherwise to the setup questions. Sending
 * everyone to setup once replaced returning users' plans.
 */
export async function destinationAfterSignIn(userId: string): Promise<"/home" | "/onboarding"> {
  const { data } = await supabase.from("profiles").select("goal").eq("id", userId).maybeSingle();
  return data?.goal ? "/home" : "/onboarding";
}
