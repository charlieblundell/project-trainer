import { test, expect } from "./signed-in";

/*
 * "How your plan is built": easy to find, short enough to take in at a glance,
 * honest about which rules are research and which are judgement — and never
 * a dead end, since an installed app has no browser Back button to fall back on.
 */

test("it's the first thing on the Plan tab, not below the week", async ({ signedIn }) => {
  const { page } = signedIn;
  await page.goto("/plan");

  const entry = page.getByRole("link", { name: /built on research/i });
  await expect(entry).toBeVisible();
  // Above the first day of the week, where it's seen without scrolling.
  const entryTop = (await entry.boundingBox())!.y;
  const mondayTop = (await page.getByText("Monday", { exact: true }).first().boundingBox())!.y;
  expect(entryTop).toBeLessThan(mondayTop);

  await entry.click();
  await expect(page.getByRole("heading", { name: "How your plan is built", level: 1 })).toBeVisible();
  await expect(page.getByRole("region", { name: "Based on research" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Our judgement" })).toBeVisible();
  // A list of short rows: the explanations wait behind a tap.
  await expect(page.getByText(/strongest predictor of growth/i)).toBeHidden();
});

test("the screen stays short enough to read on a phone", async ({ signedIn }) => {
  const { page } = signedIn;
  await page.goto("/plan/why");
  await expect(page.getByRole("heading", { name: "How your plan is built", level: 1 })).toBeVisible();
  // It was 5.4 screens of text before it became a list.
  const screens = await page.evaluate(() => document.documentElement.scrollHeight / window.innerHeight);
  expect(screens).toBeLessThan(2.2);
});

test("a rule opens to its explanation and its research", async ({ signedIn }) => {
  const { page } = signedIn;
  await page.goto("/plan/why");

  await page.getByRole("button", { name: "When your weights go up" }).click();
  const sheet = page.getByRole("dialog", { name: "When your weights go up" });
  await expect(sheet.getByText(/top of the rep range/i)).toBeVisible();

  await sheet.getByRole("link", { name: /read the/i }).click();
  await expect(page).toHaveURL(/\/evidence\?ids=failure-not-required,effort-gauged-by-reps-left/);
});

test("Back from the research returns to the rule you were reading", async ({ signedIn }) => {
  const { page } = signedIn;
  await page.goto("/plan/why");

  await page.getByRole("button", { name: "When your weights go up" }).click();
  await page.getByRole("dialog", { name: "When your weights go up" }).getByRole("link", { name: /read the/i }).click();
  await expect(page).toHaveURL(/\/evidence/);

  await page.getByRole("button", { name: "Back" }).click();
  await expect(page).toHaveURL(/\/plan\/why\?rule=progress-not-failure/);
  await expect(page.getByRole("dialog", { name: "When your weights go up" })).toBeVisible();
});

test("the evidence screen opened fresh still has a way out", async ({ signedIn }) => {
  const { page } = signedIn;
  // A new tab, or the installed app reopened here: no history to go back through.
  await page.goto("/evidence?from=settings");

  const back = page.getByRole("button", { name: "Settings" });
  await expect(back).toBeVisible();
  await back.click();
  await expect(page).toHaveURL(/\/settings$/);
});

test("the session preview answers its question with the rule, not the whole library", async ({ signedIn }) => {
  const { page } = signedIn;
  await page.goto("/plan");

  await page.getByRole("button", { name: /push/i }).first().click();
  await page.getByRole("link", { name: "Why these sets and reps?" }).click();

  await expect(page).toHaveURL(/\/plan\/why\?rule=load-by-goal/);
  await expect(page.getByRole("dialog", { name: "Reps and weight for your goal" })).toBeVisible();
});

test("a judgement call says it's ours, in its own sheet", async ({ signedIn }) => {
  const { page } = signedIn;
  await page.goto("/plan/why?rule=calves");

  const sheet = page.getByRole("dialog", { name: "Calves always get a few sets" });
  await expect(sheet.getByText("Our judgement", { exact: true })).toBeVisible();
  await expect(sheet.getByRole("link", { name: /read the/i })).toHaveCount(0);
});

test("closing a sheet leaves the list, and the URL, as they were", async ({ signedIn }) => {
  const { page } = signedIn;
  await page.goto("/plan/why?week=1");

  const sheet = page.getByRole("dialog", { name: "Your weekly sets" });
  await expect(sheet.getByRole("listitem").first()).toBeVisible();

  await sheet.getByRole("button", { name: "Close" }).click();
  await expect(sheet).toBeHidden();
  await expect(page).toHaveURL(/\/plan\/why$/);
});
