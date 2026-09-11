import { NextRequest, NextResponse } from "next/server";
import { adminSupabase, stripe, userFromRequest } from "@/lib/billing/server";

/** Any subscription that could still take a payment. */
const CANCELLABLE = new Set(["active", "trialing", "past_due", "unpaid", "incomplete", "paused"]);

/**
 * Deletes the signed-in person's account and everything attached to it.
 *
 * The subscription is cancelled first, and nothing is deleted if that fails:
 * an account that's gone while its subscription keeps charging is the worst
 * possible outcome. Deleting the auth user then removes every row in every
 * table, because each one references auth.users with on delete cascade.
 *
 * Stripe's own record of past payments is deliberately kept — payment records
 * have to be retained for tax, as the Privacy Policy says.
 */
export async function POST(req: NextRequest) {
  const user = await userFromRequest(req.headers.get("authorization"));
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let confirm: unknown;
  try {
    confirm = ((await req.json()) as { confirm?: unknown })?.confirm;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  // A second guard against an accidental or scripted call, on top of the
  // signed-in check: the person has to have typed the word.
  if (confirm !== "DELETE") {
    return NextResponse.json({ error: "Type DELETE to confirm." }, { status: 400 });
  }

  try {
    const admin = adminSupabase();

    const { data: billing, error: billingError } = await admin
      .from("billing")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (billingError) throw new Error(billingError.message);

    const customerId = billing?.stripe_customer_id as string | undefined;
    if (customerId) {
      try {
        const subscriptions = await stripe().subscriptions.list({
          customer: customerId,
          status: "all",
          limit: 100,
        });
        for (const sub of subscriptions.data) {
          if (CANCELLABLE.has(sub.status)) await stripe().subscriptions.cancel(sub.id);
        }
      } catch (err) {
        console.error("Account deletion: failed to cancel subscription:", err);
        return NextResponse.json(
          {
            error:
              "We couldn't cancel your subscription, so nothing has been deleted. Try again in a moment, or email us.",
          },
          { status: 502 }
        );
      }
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error("Account deletion: failed to delete user:", deleteError.message);
      return NextResponse.json(
        {
          error: customerId
            ? "Your subscription has been cancelled, but your account couldn't be deleted. Try again in a moment, or email us."
            : "Your account couldn't be deleted. Try again in a moment, or email us.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("Account deletion error:", err);
    return NextResponse.json(
      { error: "Your account couldn't be deleted. Try again in a moment, or email us." },
      { status: 500 }
    );
  }
}
