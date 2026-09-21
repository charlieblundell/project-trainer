"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth";

/**
 * Someone already signed in has no reason to see the sign-up or marketing
 * pages again — opening the site takes them straight back in. It also moves
 * people on the moment they sign in on the sign-up page, for example by
 * typing an emailed code.
 *
 * Everyone lands on Home, new accounts included: they see what the app looks
 * like before being asked twelve questions, and Home offers setup from there.
 */
export function RedirectIfSignedIn({ to = "/home" }: { to?: string }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);

  useEffect(() => {
    if (initialized && user) router.replace(to);
  }, [initialized, user, router, to]);

  return null;
}
