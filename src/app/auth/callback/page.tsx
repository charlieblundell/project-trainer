"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LogoMark } from "@/components/Wordmark";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    async function run() {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      if (code) {
        await supabase.auth.exchangeCodeForSession(window.location.href);
      }
      router.replace("/onboarding");
    }
    run();
  }, [router]);

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-6 py-10 text-center">
      <LogoMark size={40} />
      <p className="mt-4 text-sm text-muted">Signing you in...</p>
    </div>
  );
}
