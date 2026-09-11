import Stripe from "stripe";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { PlanInterval } from "./entitlement";

/*
 * Everything here holds or uses a secret: the Stripe secret key and the
 * Supabase service role key, which bypasses row level security entirely.
 * Import it from route handlers only, never from a component.
 */
if (typeof window !== "undefined") {
  throw new Error("lib/billing/server must never be imported in the browser.");
}

let stripeClient: Stripe | null = null;

/** Created on first use, so a build without payment keys still builds. */
export function stripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

/** Writes billing. Bypasses RLS, which is exactly why users never get it. */
export function adminSupabase(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set.");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** The signed-in user behind a request, checked with Supabase rather than trusted. */
export async function userFromRequest(authHeader: string | null): Promise<User | null> {
  if (!authHeader) return null;
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const {
    data: { user },
  } = await client.auth.getUser();
  return user;
}

export function priceIdFor(interval: PlanInterval): string | null {
  const id = interval === "year" ? process.env.STRIPE_PRICE_YEARLY : process.env.STRIPE_PRICE_MONTHLY;
  return id || null;
}

/**
 * Where Stripe sends people back to. Taken from configuration in production:
 * building it from the request's Host header would let a forged header point
 * the redirect somewhere else.
 */
export function appUrl(requestOrigin: string): string | null {
  const configured = process.env.APP_URL;
  if (configured) return configured.replace(/\/$/, "");
  return process.env.NODE_ENV === "production" ? null : requestOrigin;
}

const PAID_STATUSES = new Set(["active", "trialing", "past_due"]);

/**
 * Brings our billing row in line with a subscription as Stripe currently has
 * it. The subscription is fetched fresh rather than read from the webhook
 * event, because Stripe doesn't deliver events in order — this way it doesn't
 * matter which event arrives first, or how many times one arrives.
 */
export async function syncSubscription(subscriptionId: string, userIdHint?: string | null): Promise<void> {
  const sub = await stripe().subscriptions.retrieve(subscriptionId);
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const admin = adminSupabase();

  let userId: string | null = sub.metadata?.user_id || userIdHint || null;
  if (!userId) {
    const { data } = await admin
      .from("billing")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    userId = (data?.user_id as string | undefined) ?? null;
  }
  if (!userId) throw new Error(`No user found for subscription ${sub.id}.`);

  const { data: current } = await admin
    .from("billing")
    .select("stripe_subscription_id, subscription_status")
    .eq("user_id", userId)
    .maybeSingle();

  // Someone who cancelled and then resubscribed has two subscriptions. A late
  // event about the old, dead one must not overwrite the new, paid one.
  const staleEvent =
    current?.stripe_subscription_id &&
    current.stripe_subscription_id !== sub.id &&
    PAID_STATUSES.has(current.subscription_status as string) &&
    !PAID_STATUSES.has(sub.status);
  if (staleEvent) return;

  // Billing periods moved from the subscription to its items in recent API
  // versions; this app only ever sells one item per subscription.
  const item = sub.items.data[0];
  const interval = item?.price.recurring?.interval;

  const { error } = await admin
    .from("billing")
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      subscription_status: sub.status,
      price_id: item?.price.id ?? null,
      plan_interval: interval === "month" || interval === "year" ? interval : null,
      current_period_end: item?.current_period_end
        ? new Date(item.current_period_end * 1000).toISOString()
        : null,
      cancel_at_period_end: sub.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to save subscription ${sub.id}: ${error.message}`);
}
