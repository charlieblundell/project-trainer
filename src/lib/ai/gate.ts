import { NextResponse, type NextRequest } from "next/server";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { BILLING_COLUMNS, billingFromRow, hasAccess, type BillingRow } from "@/lib/billing/entitlement";

/*
 * Everything that calls the model goes through here first. The coach, the
 * notes reading, the workout debrief and the weekly summary all cost money,
 * so they share one set of checks and one allowance: a script can't get
 * around the coach's limit by calling a different endpoint.
 */

/** Stops a runaway script. Nobody makes eleven requests in a minute. */
const PER_MINUTE_LIMIT = 10;
/** A hard ceiling on what one account can cost in a day. */
const PER_DAY_LIMIT = 100;

export type Authorized = { ok: true; supabase: SupabaseClient; user: User };
export type Refused = { ok: false; response: NextResponse };

/**
 * Who's asking, through their own token so RLS still applies, and whether
 * they have access. Access is decided here, not in the browser: the lock
 * screen is a convenience; this is what protects the API bill.
 */
export async function authorize(req: NextRequest): Promise<Authorized | Refused> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return { ok: false, response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }

  const { data: billingRow } = await supabase.from("billing").select(BILLING_COLUMNS).eq("user_id", user.id).maybeSingle();
  if (!billingRow || !hasAccess(billingFromRow(billingRow as BillingRow))) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Your free trial has ended. Subscribe to keep training with your coach.",
          code: "subscription_required",
        },
        { status: 402 }
      ),
    };
  }

  return { ok: true, supabase, user };
}

/**
 * Counts this request against the shared allowance, or refuses it. Counted
 * before the model is called, so parallel requests can't all slip under the
 * limit at once.
 */
export async function recordUsage(supabase: SupabaseClient, userId: string): Promise<Refused | null> {
  const now = Date.now();
  const [{ count: lastMinute }, { count: lastDay }] = await Promise.all([
    supabase
      .from("coach_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", new Date(now - 60_000).toISOString()),
    supabase
      .from("coach_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", new Date(now - 86_400_000).toISOString()),
  ]);

  if ((lastMinute ?? 0) >= PER_MINUTE_LIMIT) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "That's a lot of questions at once — give it a minute and ask again." },
        { status: 429 }
      ),
    };
  }
  if ((lastDay ?? 0) >= PER_DAY_LIMIT) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "You've reached today's coach limit. It resets over the next 24 hours." },
        { status: 429 }
      ),
    };
  }

  const { error } = await supabase.from("coach_usage").insert({ user_id: userId });
  if (error) {
    // Failing closed: if usage can't be recorded, it can't be limited either.
    console.error("Failed to record coach usage:", error.message);
    return { ok: false, response: NextResponse.json({ error: "Coach is unavailable right now." }, { status: 503 }) };
  }
  return null;
}

/** Reads the user's newest plan through their own token. */
export async function loadPlanForUser<T = unknown>(client: SupabaseClient, userId: string): Promise<T | null> {
  const { data } = await client
    .from("plans")
    .select("data")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.data as T) ?? null;
}
