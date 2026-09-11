"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LogoMark } from "@/components/Wordmark";

export default function AuthCallback() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      // The Supabase client exchanges the sign-in code in the URL by itself as
      // it starts up, and getSession waits for that to finish. The explicit
      // exchange is only a fallback if that didn't happen.
      let {
        data: { session },
      } = await supabase.auth.getSession();

      const code = new URL(window.location.href).searchParams.get("code");
      if (!session && code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) session = data.session;
      }

      if (cancelled) return;
      if (!session) {
        setFailed(true);
        return;
      }

      // Only a brand-new account is sent to the setup questions. Sending
      // everyone there meant a returning user who went through them again
      // replaced their plan and lost every calibrated weight.
      const { data: profile } = await supabase
        .from("profiles")
        .select("goal")
        .eq("id", session.user.id)
        .maybeSingle();

      if (cancelled) return;
      router.replace(profile?.goal ? "/home" : "/onboarding");
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (failed) {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-10">
        <h1 className="mb-2 font-display text-2xl font-bold text-ink">That sign-in link didn&apos;t work.</h1>
        <p className="mb-6 text-sm leading-relaxed text-muted">
          Sign-in links only work once, for a limited time, and in the same browser you asked for them from. Request
          a fresh one and open it on this device.
        </p>
        <Link
          href="/signup"
          className="w-full rounded-2xl bg-ink py-4 text-center text-[15px] font-semibold text-background"
        >
          Get a new sign-in link
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-6 py-10 text-center">
      <LogoMark size={40} />
      <p className="mt-4 text-sm text-muted">Signing you in...</p>
    </div>
  );
}
