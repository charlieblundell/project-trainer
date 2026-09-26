import { test as base, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { stubSupabase, test, TEST_USER } from "./signed-in";

/*
 * A password is optional: set in Settings, it lets another device sign in with
 * an email and password instead of waiting on an emailed code.
 */

test("setting a password from Settings saves it and marks the account", async ({ signedIn: { page } }) => {
  let sent: { password?: string; data?: { has_password?: boolean } } | null = null;
  await page.route("**/auth/v1/user**", (route) => {
    if (route.request().method() !== "PUT") return route.fallback();
    sent = JSON.parse(route.request().postData() ?? "{}");
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ...TEST_USER, user_metadata: { has_password: true } }),
    });
  });

  await page.goto("/settings");
  await page.getByRole("button", { name: "Set a password" }).click();

  const save = page.getByRole("button", { name: "Save password" });
  await page.getByLabel(/^Password/).fill("short");
  await expect(save).toBeDisabled();

  await page.getByLabel(/^Password/).fill("a-long-enough-password");
  await save.click();

  await expect(page.getByText(/Saved\. On another device/)).toBeVisible();
  await expect(page.getByText("Password set")).toBeVisible();
  expect(sent).toMatchObject({ password: "a-long-enough-password", data: { has_password: true } });
});

base("a wrong password on the sign-in page says what to do instead", async ({ page }) => {
  let body: { email?: string; password?: string } | null = null;
  await page.route("**/auth/v1/token**", (route) => {
    body = JSON.parse(route.request().postData() ?? "{}");
    return route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({ code: "invalid_credentials", error_code: "invalid_credentials", msg: "Invalid login credentials" }),
    });
  });

  await page.goto("/signup");
  await page.getByRole("button", { name: "Continue with email" }).click();
  await page.getByRole("button", { name: "I have a password" }).click();
  await page.getByLabel("Email address").fill("someone@example.com");
  await page.getByLabel("Password").fill("not-my-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  await expect(page.getByText(/don't match/)).toBeVisible();
  expect(body).toMatchObject({ email: "someone@example.com", password: "not-my-password" });

  // Switching back offers the emailed code again.
  await page.getByRole("button", { name: "Email me a code instead" }).click();
  await expect(page.getByRole("button", { name: "Email me a sign-in code" })).toBeVisible();
});

/** Signs in on /signup with an emailed code, as the given user. */
async function signInWithCode(page: Page, userMetadata: Record<string, unknown>) {
  await stubSupabase(page, null, { newAccount: true });
  const user = { ...TEST_USER, user_metadata: userMetadata };
  await page.route("**/auth/v1/verify**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: "test-access-token",
        refresh_token: "test-refresh-token",
        token_type: "bearer",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user,
      }),
    })
  );

  await page.goto("/signup");
  await page.getByRole("button", { name: "Continue with email" }).click();
  await page.getByLabel("Email address").fill(TEST_USER.email);
  await page.getByRole("button", { name: "Email me a sign-in code" }).click();
  await page.getByLabel("Sign-in code").fill("123456");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}

base("a new account has to create a password before going in", async ({ page }) => {
  let sent: { password?: string; data?: { has_password?: boolean } } | null = null;
  await signInWithCode(page, {});
  await page.route("**/auth/v1/user**", (route) => {
    if (route.request().method() !== "PUT") return route.fallback();
    sent = JSON.parse(route.request().postData() ?? "{}");
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ...TEST_USER, user_metadata: { has_password: true } }),
    });
  });

  await expect(page.getByText("Create a password")).toBeVisible();
  // Signed in, but held here rather than taken home.
  await expect(page).toHaveURL(/\/signup$/);
  await expect(page.getByRole("button", { name: "Cancel" })).toHaveCount(0);

  await page.getByLabel(/^Password/).fill("a-long-enough-password");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/\/home$/);
  expect(sent).toMatchObject({ password: "a-long-enough-password", data: { has_password: true } });
});

base("someone who already has a password goes straight home after a code", async ({ page }) => {
  await signInWithCode(page, { has_password: true });
  await expect(page).toHaveURL(/\/home$/);
});
