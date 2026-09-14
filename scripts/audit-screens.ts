/*
 * Photographs every screen at phone size for a design audit — including the
 * first-time path (landing, sign-up, setup) and a workout in progress.
 * Sign-in is stubbed as in the tests. Needs `npm run dev`.
 *
 * Run with: npx tsx scripts/audit-screens.ts [outDir]
 */
import { chromium, type Page } from "@playwright/test";
import path from "node:path";
import { mkdirSync } from "node:fs";
import { samplePlan, stubSupabase, supabaseProjectRef, TEST_USER } from "../e2e/signed-in";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = process.argv[2] ?? path.join(process.cwd(), "audit");
mkdirSync(OUT, { recursive: true });

async function shot(page: Page, name: string, full = true) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(900);
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: full });
  console.log(" ", name);
}

async function signedInPage(browser: Awaited<ReturnType<typeof chromium.launch>>, withPlan: boolean) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await stubSupabase(page, withPlan ? samplePlan() : null);
  await page.addInitScript(({ ref, user }) => {
    const hour = 3600;
    localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify({ access_token: "t", refresh_token: "r", token_type: "bearer", expires_in: hour, expires_at: Math.floor(Date.now() / 1000) + hour, user }));
  }, { ref: supabaseProjectRef(), user: TEST_USER });
  return page;
}

async function main() {
  const browser = await chromium.launch();

  // Signed out: the front door.
  const anon = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
  for (const [name, url] of [["01-landing", "/"], ["02-signup", "/signup"]] as const) {
    await anon.goto(BASE + url); await shot(anon, name, name !== "01-landing");
  }

  // Signed in, no plan: setup.
  const fresh = await signedInPage(browser, false);
  await fresh.goto(BASE + "/onboarding");
  await shot(fresh, "03-onboarding-1");

  // Signed in with a plan.
  const page = await signedInPage(browser, true);
  const screens = ["home", "plan", "plan/why", "plan/edit", "progress", "coach", "settings", "settings/training", "evidence", "upgrade"];
  let i = 10;
  for (const s of screens) { await page.goto(`${BASE}/${s}`); await shot(page, `${i++}-${s.replace("/", "-")}`); }

  // A workout, walked into the way a person does.
  await page.goto(BASE + "/home"); await page.waitForTimeout(800);
  await page.getByRole("button", { name: "Start workout" }).first().click();
  await shot(page, "30-checkin", false);
  for (const a of ["Well", "Not sore", "None"]) { const b = page.getByRole("button", { name: a, exact: true }); if (await b.count()) await b.first().click(); }
  const begin = page.getByRole("button", { name: "Start workout" }); if (await begin.count()) await begin.click();
  await shot(page, "31-warmup", false);
  const skip = page.getByRole("button", { name: /skip the warm-up|done — start the workout/i }); if (await skip.count()) await skip.first().click();
  await shot(page, "32-train");
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
