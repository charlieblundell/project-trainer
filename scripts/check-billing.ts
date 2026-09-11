/**
 * Who gets into the app, across every subscription state Stripe can report.
 * A mistake here either locks out someone who paid or gives the app away, so
 * each case is written down rather than trusted.
 * Run with: npm run check:billing
 */
import { hasAccess, trialDaysLeft, type Billing, type SubscriptionStatus } from "../src/lib/billing/entitlement";

const NOW = new Date("2026-09-11T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

function billing(trialOffsetDays: number, status: SubscriptionStatus | null): Billing {
  return {
    trialEndsAt: new Date(NOW.getTime() + trialOffsetDays * DAY).toISOString(),
    status,
    interval: status ? "month" : null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  };
}

const cases: [string, Billing, boolean][] = [
  ["new account, trial running", billing(10, null), true],
  ["trial ended, never subscribed", billing(-1, null), false],
  ["trial ended, active subscription", billing(-30, "active"), true],
  ["card failing, Stripe still retrying", billing(-30, "past_due"), true],
  ["retries exhausted", billing(-30, "unpaid"), false],
  ["cancelled after trial", billing(-30, "canceled"), false],
  ["first payment never completed", billing(-30, "incomplete"), false],
  ["first payment expired", billing(-30, "incomplete_expired"), false],
  ["paused", billing(-30, "paused"), false],
  ["cancelled a sub but our trial still running", billing(5, "canceled"), true],
];

let failures = 0;
console.log("\nAccess\n");
for (const [label, b, expected] of cases) {
  const actual = hasAccess(b, NOW);
  const ok = actual === expected;
  if (!ok) failures += 1;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label.padEnd(46)} ${actual ? "open" : "locked"}`);
}

const dayCases: [string, number, number][] = [
  ["13.5 days left reads as 14", 13.5, 14],
  ["last afternoon reads as 1", 0.2, 1],
  ["ended reads as 0", -2, 0],
];

console.log("\nTrial days left\n");
for (const [label, offset, expected] of dayCases) {
  const actual = trialDaysLeft(billing(offset, null), NOW);
  const ok = actual === expected;
  if (!ok) failures += 1;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label.padEnd(46)} ${actual}`);
}

console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} failure(s).\n`);
process.exit(failures === 0 ? 0 : 1);
