import type { PlanInterval } from "./entitlement";

/**
 * What the upgrade page shows. These are display strings only — the amount
 * actually charged comes from the Stripe price ids in the server's
 * environment, so if a price changes in Stripe it has to change here too.
 */
export const PLANS: Record<PlanInterval, { label: string; price: string; per: string; note?: string }> = {
  month: { label: "Monthly", price: "A$14.99", per: "a month" },
  year: { label: "Yearly", price: "A$149.99", per: "a year", note: "Two months free" },
};
