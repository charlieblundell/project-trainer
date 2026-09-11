/**
 * Who gets in. Pure and shared by the browser and the server, so the lock
 * screen and the server's own check can never disagree about the rules —
 * though only the server's check is trusted.
 */

export type SubscriptionStatus =
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused";

export type PlanInterval = "month" | "year";

export type Billing = {
  trialEndsAt: string;
  status: SubscriptionStatus | null;
  interval: PlanInterval | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

/** The columns a client is allowed to read. No Stripe ids leave the server. */
export const BILLING_COLUMNS =
  "trial_ends_at, subscription_status, plan_interval, current_period_end, cancel_at_period_end";

export type BillingRow = {
  trial_ends_at: string;
  subscription_status: string | null;
  plan_interval: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
};

export function billingFromRow(row: BillingRow): Billing {
  return {
    trialEndsAt: row.trial_ends_at,
    status: (row.subscription_status as SubscriptionStatus | null) ?? null,
    interval: row.plan_interval === "month" || row.plan_interval === "year" ? row.plan_interval : null,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end ?? false,
  };
}

/**
 * Statuses that keep access. `past_due` is included deliberately: Stripe is
 * still retrying the card, and locking someone out mid-programme over an
 * expired card they don't know about yet is worse than a few days' grace.
 * It becomes `unpaid` or `canceled` if the retries run out.
 */
const PAID: ReadonlySet<SubscriptionStatus> = new Set(["active", "trialing", "past_due"]);

const DAY_MS = 24 * 60 * 60 * 1000;

export function isSubscribed(billing: Billing): boolean {
  return billing.status !== null && PAID.has(billing.status);
}

export function inTrial(billing: Billing, now = new Date()): boolean {
  return new Date(billing.trialEndsAt).getTime() > now.getTime();
}

export function hasAccess(billing: Billing, now = new Date()): boolean {
  return isSubscribed(billing) || inTrial(billing, now);
}

/** Rounded up, so the last afternoon of a trial still reads as "1 day left". */
export function trialDaysLeft(billing: Billing, now = new Date()): number {
  const remaining = new Date(billing.trialEndsAt).getTime() - now.getTime();
  return Math.max(0, Math.ceil(remaining / DAY_MS));
}
