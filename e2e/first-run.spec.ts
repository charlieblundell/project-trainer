import { test as base, expect } from "@playwright/test";
import { plantSession, stubSupabase } from "./signed-in";

/*
 * A brand-new account lands on Home, not in the setup questions: they see
 * what the app is before being asked about it, and setup is one tap away.
 */

const test = base.extend({
  page: async ({ page }, use) => {
    await stubSupabase(page, null, { newAccount: true });
    await plantSession(page);
    await use(page);
  },
});

test("signing in to a new account opens Home with a way into setup", async ({ page }) => {
  await page.goto("/signup");
  await expect(page).toHaveURL(/\/home$/);

  await expect(page.getByRole("heading", { name: /build your week/ })).toBeVisible();
  await expect(page.getByLabel("Example of today's workout card")).toBeVisible();
  await expect(page.getByRole("heading", { name: "How it works" })).toBeVisible();

  await page.getByRole("link", { name: "Build my plan" }).first().click();
  await expect(page).toHaveURL(/\/onboarding$/);

  // Backing out of the first question returns to Home, not the sign-up page.
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page).toHaveURL(/\/home$/);
});
