import { test, expect } from "./signed-in";

/*
 * "How your plan is built": reachable from the plan, short enough to take in
 * at a glance, honest about which rules are research and which are judgement,
 * and every citation still one tap from the finding it names.
 */

test("the plan explains itself at a glance, research and judgement both", async ({ signedIn }) => {
  const { page } = signedIn;
  await page.goto("/plan");
  await page.getByRole("link", { name: /how your plan is built/i }).click();

  await expect(page.getByRole("heading", { name: "How your plan is built", level: 1 })).toBeVisible();
  await expect(page.getByRole("region", { name: "Based on research" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Our judgement" })).toBeVisible();

  // A list of short rows, not paragraphs: the explanations wait behind a tap.
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
  await expect(sheet).toBeVisible();
  await expect(sheet.getByText(/top of the rep range/i)).toBeVisible();

  await sheet.getByRole("link", { name: /read the/i }).click();
  await expect(page).toHaveURL(/\/evidence\?ids=failure-not-required,effort-gauged-by-reps-left/);
});

test("a judgement call says it's ours, in its own sheet", async ({ signedIn }) => {
  const { page } = signedIn;
  await page.goto("/plan/why");

  await page.getByRole("button", { name: "Calves always get a few sets" }).click();
  const sheet = page.getByRole("dialog", { name: "Calves always get a few sets" });
  await expect(sheet.getByText("Our judgement", { exact: true })).toBeVisible();
  await expect(sheet.getByRole("link", { name: /read the/i })).toHaveCount(0);
});

test("the weekly sets open to every muscle against its aim", async ({ signedIn }) => {
  const { page } = signedIn;
  await page.goto("/plan/why");

  await page.getByRole("button", { name: /your weekly sets/i }).click();
  const sheet = page.getByRole("dialog", { name: "Your weekly sets" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("listitem").first()).toBeVisible();
});
