/**
 * Proves the payment endpoints refuse what they should, against a running dev
 * server. No Stripe account needed: webhook payloads are signed locally with a
 * throwaway secret, which is exactly what Stripe does with the real one.
 *
 * Start the server with the same secret, then run this:
 *   STRIPE_WEBHOOK_SECRET=whsec_local_check STRIPE_SECRET_KEY=sk_test_placeholder npx next dev -p 3100
 *   npm run check:webhook
 */
import Stripe from "stripe";

const BASE = process.env.CHECK_BASE_URL ?? "http://localhost:3100";
const SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "whsec_local_check";
const stripe = new Stripe("sk_test_placeholder");

let failures = 0;

function report(label: string, ok: boolean, detail: string) {
  if (!ok) failures += 1;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label.padEnd(52)} ${detail}`);
}

async function waitForServer() {
  for (let attempt = 0; attempt < 90; attempt++) {
    try {
      await fetch(BASE, { method: "HEAD" });
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error(`Server at ${BASE} never came up.`);
}

async function postWebhook(body: string, signature: string | null): Promise<number> {
  const res = await fetch(`${BASE}/api/stripe/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(signature ? { "Stripe-Signature": signature } : {}),
    },
    body,
  });
  return res.status;
}

async function main() {
  await waitForServer();

  // An event type the handler deliberately ignores, so a correct signature
  // gets a 200 without the handler reaching out to Stripe's API.
  const payload = JSON.stringify({
    id: "evt_local_check",
    object: "event",
    type: "customer.created",
    created: Math.floor(Date.now() / 1000),
    data: { object: { id: "cus_local_check", object: "customer" } },
  });

  const good = stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET });
  const forged = stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_attacker_guess" });

  console.log("\nWebhook signature\n");

  // The first request compiles the route, which can take a while in dev.
  let status = await postWebhook(payload, good);
  report("genuine signature is accepted", status === 200, `${status}`);

  status = await postWebhook(payload, forged);
  report("signature made with the wrong secret is rejected", status === 400, `${status}`);

  status = await postWebhook(payload, null);
  report("missing signature is rejected", status === 400, `${status}`);

  const tampered = payload.replace("customer.created", "customer.subscription.created");
  status = await postWebhook(tampered, good);
  report("body changed after signing is rejected", status === 400, `${status}`);

  console.log("\nSigned-out requests\n");

  for (const path of ["/api/billing/checkout", "/api/billing/portal", "/api/coach"]) {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interval: "month", messages: [{ role: "user", text: "hi" }] }),
    });
    report(`${path} refuses a request with no account`, res.status === 401, `${res.status}`);
  }

  console.log("\nSecurity headers\n");

  const home = await fetch(BASE);
  report(
    "clickjacking protection on pages",
    home.headers.get("x-frame-options") === "DENY" &&
      (home.headers.get("content-security-policy") ?? "").includes("frame-ancestors 'none'"),
    `${home.headers.get("x-frame-options")}`
  );
  report("nosniff on pages", home.headers.get("x-content-type-options") === "nosniff", `${home.headers.get("x-content-type-options")}`);

  console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} failure(s).\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
