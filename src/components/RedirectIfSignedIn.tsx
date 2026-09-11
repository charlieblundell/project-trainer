"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth";

/**
 * Someone already signed in has no reason to see the sign-up or marketing
 * pages again — opening the site should take them straight back in.
 */
export function RedirectIfSignedIn({ to }: { to: string }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);

  useEffect(() => {
    if (initialized && user) router.replace(to);
  }, [initialized, user, router, to]);

  return null;
}
