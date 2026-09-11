"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogoMark } from "@/components/Wordmark";
import { useAuthStore } from "@/lib/auth";
import { useAppStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { BILLING_COLUMNS, billingFromRow, isSubscribed, type BillingRow } from "@/lib/billing/entitlement";

const POLL_MS = 2000;
const MAX_ATTEMPTS = 20;

/**
 * Stripe sends people here the moment they pay, but the payment is only
 * recorded when Stripe's webhook reaches the server — usually a second or two
 * later. The session id in the URL is ignored on purpose: arriving at this
 * page proves nothing, so it waits for the database to say they've paid.
 */
export default function BillingSuccess() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setBilling = useAppStore((s) => s.setBilling);
  const [state, setState] = useState<"waiting" | "done" | "slow">("waiting");

  useEffect(() => {
    if (!user) return;
    let attempts = 0;
    let cancelled = false;

    async function check() {
      if (cancelled) return;
      attempts += 1;
      const { data } = await supabase
        .from("billing")
        .select(BILLING_COLUMNS)
        .eq("user_id", user!.id)
        .maybeSingle();

      if (cancelled) return;
      if (data) {
        const billing = billingFromRow(data as BillingRow);
        if (isSubscribed(billing)) {
          setBilling(billing);
          setState("done");
          return;
        }
      }
      if (attempts >= MAX_ATTEMPTS) {
        setState("slow");
        return;
      }
      setTimeout(check, POLL_MS);
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [user, setBilling]);

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center py-16 text-center">
      <LogoMark size={40} />

      {state === "waiting" && (
        <>
          <h1 className="mb-2 mt-6 font-display text-2xl font-bold text-ink">Confirming your payment…</h1>
          <p className="text-sm leading-relaxed text-muted">This usually takes a few seconds.</p>
        </>
      )}

      {state === "done" && (
        <>
          <h1 className="mb-2 mt-6 font-display text-2xl font-bold text-ink">You&apos;re subscribed.</h1>
          <p className="mb-6 text-sm leading-relaxed text-muted">
            Thanks for backing this. Everything&apos;s unlocked — your plan is right where you left it.
          </p>
          <button
            onClick={() => router.push("/home")}
            className="w-full rounded-2xl bg-ink py-4 text-[15px] font-semibold text-background"
          >
            Back to training
          </button>
        </>
      )}

      {state === "slow" && (
        <>
          <h1 className="mb-2 mt-6 font-display text-2xl font-bold text-ink">Almost there.</h1>
          <p className="text-sm leading-relaxed text-muted">
            Your payment went through, but activating it is taking longer than usual. It normally
            finishes within a minute — refresh this page shortly. You won&apos;t be charged twice.
          </p>
        </>
      )}
    </div>
  );
}
