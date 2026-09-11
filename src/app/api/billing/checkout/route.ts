import { NextRequest, NextResponse } from "next/server";
import { adminSupabase, appUrl, priceIdFor, stripe, userFromRequest } from "@/lib/billing/server";
import { billingFromRow, isSubscribed, type BillingRow } from "@/lib/billing/entitlement";

/** Starts a Stripe Checkout session and hands back the URL to send the person to. */
export async function POST(req: NextRequest) {
  const user = await userFromRequest(req.headers.get("authorization"));
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let interval: unknown;
  try {
    interval = ((await req.json()) as { interval?: unknown })?.interval;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  // Only the two plans we sell. The price id comes from our environment,
  // never from the request, so nobody can check out at a price they chose.
  if (interval !== "month" && interval !== "year") {
    return NextResponse.json({ error: "Choose monthly or yearly." }, { status: 400 });
  }

  const price = priceIdFor(interval);
  const base = appUrl(req.nextUrl.origin);
  if (!price || !base) {
    console.error("Billing is not configured: missing Stripe price id or APP_URL.");
    return NextResponse.json({ error: "Payments aren't set up yet." }, { status: 503 });
  }

  try {
    const admin = adminSupabase();
    const { data: row, error } = await admin
      .from("billing")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error || !row) throw new Error(error?.message ?? `No billing row for ${user.id}.`);

    if (isSubscribed(billingFromRow(row as BillingRow))) {
      return NextResponse.json(
        { error: "You already have a subscription — you can manage it from Settings." },
        { status: 409 }
      );
    }

    let customerId = row.stripe_customer_id as string | null;
    if (!customerId) {
      const customer = await stripe().customers.create({
        email: user.email ?? undefined,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      const { error: saveError } = await admin
        .from("billing")
        .update({ stripe_customer_id: customerId })
        .eq("user_id", user.id);
      if (saveError) throw new Error(saveError.message);
    }

    const session = await stripe().checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price, quantity: 1 }],
      // Carried onto the subscription itself, so every later webhook can find
      // the person it belongs to without trusting anything in the event.
      subscription_data: { metadata: { user_id: user.id } },
      allow_promotion_codes: true,
      locale: "en-GB",
      success_url: `${base}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/upgrade`,
    });

    if (!session.url) throw new Error("Stripe returned a session with no URL.");
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: "Couldn't start checkout — try again in a moment." },
      { status: 502 }
    );
  }
}
