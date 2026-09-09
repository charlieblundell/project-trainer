"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth";
import { useAppStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { LogoMark } from "@/components/Wordmark";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);
  const setOnboarding = useAppStore((s) => s.setOnboarding);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const [profileSynced, setProfileSynced] = useState(false);
  const syncedForUser = useRef<string | null>(null);

  useEffect(() => {
    if (!initialized) return;
    if (!user) {
      router.replace("/signup");
      return;
    }
    if (syncedForUser.current === user.id) return;
    syncedForUser.current = user.id;

    supabase
      .from("profiles")
      .select("goal, experience, days, length, environment")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.goal) {
          setOnboarding({
            goal: data.goal,
            experience: data.experience,
            days: data.days,
            length: data.length,
            environment: data.environment,
          });
          completeOnboarding();
        }
        setProfileSynced(true);
      });
  }, [initialized, user, router, setOnboarding, completeOnboarding]);

  if (!initialized || !user || !profileSynced) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LogoMark size={36} />
      </div>
    );
  }

  return <>{children}</>;
}
