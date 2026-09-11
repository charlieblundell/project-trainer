import { NextRequest, NextResponse } from "next/server";
import { stripe, syncSubscription } from "@/lib/billing/server";

/**
 * The only thing allowed to decide someone has paid.
 *
 * Every request is verified against Stripe's signature before anything is
 * read from it — without that check, anyone could POST a fake "payment
 * succeeded" event here and unlock the app for free.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  // Verification needs the exact bytes Stripe signed, so the body is read as
  // raw text and never parsed as JSON first.
  const payload = await req.text();

  const event = (() => {
    try {
      return stripe().webhooks.constructEvent(payload, signature, secret);
    } catch (err) {
      console.error("Stripe webhook signature check failed:", (err as Error).message);
      return null;
    }
  })();
  if (!event) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode === "subscription" && session.subscription) {
          const id =
            typeof session.subscription === "string" ? session.subscription : session.subscription.id;
          await syncSubscription(id, session.client_reference_id);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object.id);
        break;
      default:
        // Only the events above are subscribed to in Stripe; anything else is ignored.
        break;
    }
  } catch (err) {
    // A 500 tells Stripe to retry, which is what we want if the database
    // write failed. Syncing is idempotent, so a retry is always safe.
    console.error(`Stripe webhook ${event.type} failed:`, err);
    return NextResponse.json({ error: "Processing failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
