import { supabase } from "@/lib/supabase";

/**
 * Who's signed in, from the session already held in the browser, falling back
 * to asking the server.
 *
 * `getUser()` alone makes a network request, so a dropped connection at the
 * wrong moment looks exactly like being signed out — and the screens that ask
 * respond to that by sending someone back to sign in, losing what they were
 * part-way through. The stored session is the better first answer.
 */
export async function signedInUser(): Promise<{ id: string; email?: string } | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const fromSession = sessionData.session?.user;
  if (fromSession) return { id: fromSession.id, email: fromSession.email };

  const { data } = await supabase.auth.getUser();
  return data.user ? { id: data.user.id, email: data.user.email } : null;
}
