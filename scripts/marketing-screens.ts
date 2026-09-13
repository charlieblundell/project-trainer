/*
 * Retakes the phone screenshots the landing page is built from.
 *
 * They were taken by hand on a phone, which means the moment the app's design
 * changes the marketing shows a product that no longer exists — which is what
 * happened. This drives the real app in a real browser at iPhone resolution
 * instead, so the landing page can be brought back in line with one command.
 *
 * Needs the dev server running (npm run dev). Sign-in is stubbed exactly as
 * the tests stub it, so this never touches a real account.
 *
 * Run with: npm run screens
 */
import { chromium, type Page } from "@playwright/test";
import path from "node:path";
import { samplePlan, stubSupabase, supabaseProjectRef, TEST_USER } from "../e2e/signed-in";

/** iPhone 15 at 3x, which is what the landing page's Screen component expects. */
const VIEWPORT = { width: 390, height: 844 };
const SCALE = 3;
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = path.join(process.cwd(), "public", "screens");

async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  // Page transitions animate in; shoot the settled screen.
  await page.waitForTimeout(900);
  // The dev server's own overlay sits over the tab bar and is not the product.
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
}

/**
 * The tests' plan is deliberately small. A screenshot that says "1 / 2
 * exercises" undersells the thing, so the marketing plan is a real session.
 */
function marketingPlan() {
  const plan = samplePlan();
  const more = ["incline_db", "cable_fly", "triceps_pushdown", "lateral_raise"];
  const template = plan.sessions[0].exercises[0];
  plan.sessions[0].exercises = [
    plan.sessions[0].exercises[0],
    plan.sessions[0].exercises[1],
    ...more.map((exerciseId) => ({ ...template, exerciseId, sets: 3, repMin: 8, repMax: 12 })),
  ];
  return plan;
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: SCALE,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();
  await stubSupabase(page, marketingPlan());
  await page.addInitScript(
    ({ ref, user }) => {
      const hour = 60 * 60;
      window.localStorage.setItem(
        `sb-${ref}-auth-token`,
        JSON.stringify({
          access_token: "test-access-token",
          refresh_token: "test-refresh-token",
          token_type: "bearer",
          expires_in: hour,
          expires_at: Math.floor(Date.now() / 1000) + hour,
          user,
        })
      );
    },
    {
      ref: supabaseProjectRef(),
      // A name rather than "Test", since this ends up on the landing page.
      user: { ...TEST_USER, user_metadata: { full_name: "Alex Rivera" } },
    }
  );

  // The install card is a prompt, not the product, and it owns half the home
  // screen until it's dismissed.
  await page.addInitScript(() => {
    window.localStorage.setItem("install-prompt-dismissed-at", String(Date.now()));
  });

  await page.goto(BASE);
  await settle(page);

  for (const screen of ["home", "plan", "coach"]) {
    await page.goto(`${BASE}/${screen}`);
    await settle(page);
    await page.screenshot({ path: path.join(OUT, `${screen}.png`) });
    console.log(`  ${screen}.png`);
  }

  /*
   * Train needs a workout in progress, so walk in the way a person does:
   * start it, answer the check-in, skip past the warm-up.
   */
  await page.goto(`${BASE}/home`);
  await settle(page);
  await page.getByRole("button", { name: /start workout|start it early/i }).first().click();
  await settle(page);

  for (const answer of ["Well", "Not sore", "None"]) {
    const button = page.getByRole("button", { name: answer, exact: true });
    if (await button.count()) await button.first().click();
  }
  const begin = page.getByRole("button", { name: "Start workout" });
  if (await begin.count()) await begin.click();
  await settle(page);

  const skip = page.getByRole("button", { name: /skip the warm-up|done — start the workout/i });
  if (await skip.count()) await skip.first().click();
  await settle(page);

  await page.screenshot({ path: path.join(OUT, "train.png") });
  console.log("  train.png");

  await browser.close();
  console.log(`\nFour screens at ${VIEWPORT.width * SCALE}x${VIEWPORT.height * SCALE} in public/screens.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
