"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth";
import { destinationAfterSignIn } from "@/lib/after-sign-in";

/**
 * Someone already signed in has no reason to see the sign-up or marketing
 * pages again — opening the site takes them straight back in. It also moves
 * people on the moment they sign in on the sign-up page, for example by
 * typing an emailed code.
 */
export function RedirectIfSignedIn({ to }: { to?: string }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);

  useEffect(() => {
    if (!initialized || !user) return;
    let cancelled = false;
    (async () => {
      const destination = to ?? (await destinationAfterSignIn(user.id));
      if (!cancelled) router.replace(destination);
    })();
    return () => {
      cancelled = true;
    };
  }, [initialized, user, router, to]);

  return null;
}
