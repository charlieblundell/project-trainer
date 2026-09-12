import type { User } from "@supabase/supabase-js";

/**
 * A first name to greet someone by, or null when we genuinely don't know one.
 *
 * Signing in with Google hands us a real name. Signing in with an email
 * doesn't: the part before the @ is an address, not a name, and greeting
 * someone as "Cblundell38+test" is worse than not greeting them by name at
 * all. So an address that doesn't read like a name gets no name.
 */
export function displayName(user: User | null): string | null {
  if (!user) return null;

  const fullName = user.user_metadata?.full_name ?? user.user_metadata?.name;
  if (typeof fullName === "string" && fullName.trim()) return fullName.trim().split(" ")[0];

  const emailName = user.email?.split("@")[0] ?? "";
  // Letters only, and long enough to be a name rather than initials.
  if (!/^[a-z]{2,}$/i.test(emailName)) return null;

  return emailName.charAt(0).toUpperCase() + emailName.slice(1);
}
