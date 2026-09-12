"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TypeMark } from "@/components/TypeMark";
import { marketingFontClasses } from "@/lib/fonts/marketing";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/lib/store";

export default function AccountDeleted() {
  useEffect(() => {
    // The account is already gone on the server. This clears what's left in
    // this browser: the sign-in session, and the saved plan, answers and
    // coach conversation.
    supabase.auth
      .signOut({ scope: "local" })
      .catch(() => {})
      .finally(() => useAppStore.persist.clearStorage());
  }, []);

  return (
    <div className={`${marketingFontClasses} font-marketing-body min-h-screen bg-background text-ink`}>
      <div className="mx-auto flex min-h-screen max-w-sm flex-col px-6 py-8">
        <TypeMark />
        <div className="flex flex-1 flex-col justify-center py-12">
          <h1 className="font-marketing-display text-[2.1rem] font-extrabold leading-[1.02] text-ink [font-stretch:88%] [text-wrap:balance]">
            Your account has been deleted.
          </h1>
          <div className="mb-8 mt-4 flex flex-col gap-3 text-[15px] leading-relaxed text-muted">
            <p>
              Your profile, plan, workouts, progress and health details have been deleted, and any subscription has
              been cancelled.
            </p>
            <p>
              Stripe keeps a record of past payments, because payment records have to be kept for tax. Nothing else
              is kept.
            </p>
          </div>
          <Link
            href="/"
            className="flex min-h-[54px] w-full items-center justify-center rounded-[14px] bg-accent text-[15px] font-semibold text-accent-ink"
          >
            Back to the homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
