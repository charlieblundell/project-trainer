import type { User } from "@supabase/supabase-js";

export function displayName(user: User | null): string {
  if (!user) return "there";
  const fullName = user.user_metadata?.full_name ?? user.user_metadata?.name;
  if (typeof fullName === "string" && fullName.trim()) return fullName.split(" ")[0];
  const emailName = user.email?.split("@")[0];
  if (!emailName) return "there";
  return emailName.charAt(0).toUpperCase() + emailName.slice(1);
}
