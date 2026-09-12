import { test, expect } from "@playwright/test";

/*
 * The pages a stranger lands on. These are what search engines and shared
 * links reach, so a broken one costs signups rather than annoying a user who
 * already has the app.
 */

test("the landing page says what the app is and offers a way in", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /start free/i }).first()).toBeVisible();
});

test("a research page stands on its own, with the finding and its source", async ({ page }) => {
  await page.goto("/research");
  const firstFinding = page.locator("a[href^='/research/']").first();
  await expect(firstFinding).toBeVisible();
  await firstFinding.click();

  await expect(page.getByRole("link", { name: /doi|pubmed|source|paper/i }).first()).toBeVisible();
});

test("the signed-in app sends strangers to sign up", async ({ page }) => {
  await page.goto("/plan");
  await expect(page).toHaveURL(/\/signup/);
});
