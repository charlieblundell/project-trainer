import { NextRequest, NextResponse } from "next/server";
import { adminSupabase, appUrl, stripe, userFromRequest } from "@/lib/billing/server";

/**
 * Sends a subscriber to Stripe's own billing portal to change plan, update
 * their card, see invoices or cancel. Stripe hosts all of it, so none of that
 * sensitive UI lives in this app.
 */
export async function POST(req: NextRequest) {
  const user = await userFromRequest(req.headers.get("authorization"));
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const base = appUrl(req.nextUrl.origin);
  if (!base) {
    console.error("Billing is not configured: missing APP_URL.");
    return NextResponse.json({ error: "Payments aren't set up yet." }, { status: 503 });
  }

  try {
    const { data: row } = await adminSupabase()
      .from("billing")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const customerId = row?.stripe_customer_id as string | undefined;
    if (!customerId) {
      return NextResponse.json({ error: "You don't have a subscription to manage yet." }, { status: 404 });
    }

    const session = await stripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${base}/settings`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Billing portal error:", err);
    return NextResponse.json(
      { error: "Couldn't open billing — try again in a moment." },
      { status: 502 }
    );
  }
}
