import { test, expect, PROFILE } from "./signed-in";

/*
 * Age is asked on its own, early in setup, rather than with the health
 * details: a plan for someone of 70 is built differently whether or not they
 * agree to share their injuries and bodyweight.
 */

test("setup asks for an age on its own, and checks it", async ({ signedIn }) => {
  const { page } = signedIn;
  await page.goto("/onboarding");

  await page.getByRole("button", { name: "Build muscle" }).click();
  await page.getByRole("button", { name: "I'm new to training" }).click();

  await expect(page.getByRole("heading", { name: "How old are you?" })).toBeVisible();
  const age = page.getByLabel("Age");
  const next = page.getByRole("button", { name: /^(Continue|Skip)$/ });

  // Optional: it can be skipped.
  await age.fill("");
  await expect(next).toHaveText("Skip");
  await expect(next).toBeEnabled();

  await age.fill("12");
  const tooYoung = page.getByText("You need to be 16 or older to use the app.");
  await expect(tooYoung).toBeVisible();
  await expect(next).toBeDisabled();

  await age.fill("70");
  await expect(tooYoung).toHaveCount(0);
  await expect(next).toHaveText("Continue");
  await next.click();
  await expect(page.getByRole("heading", { name: "How often can you train?" })).toBeVisible();
});

test("someone whose age the app doesn't know is asked for it on Home, once", async ({ signedIn }) => {
  const { page } = signedIn;
  // Set up before age was its own question, without sharing health details.
  await page.route("**/rest/v1/profiles*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ...PROFILE,
        age: null,
        bodyweight_kg: null,
        height_cm: null,
        sex: null,
        considerations: null,
        health_consent_at: null,
      }),
    })
  );

  await page.goto("/home");
  const card = page.getByRole("link", { name: /Add your age/ });
  await expect(card).toHaveAttribute("href", "/settings/training");

  await page.getByRole("button", { name: "Don't ask about my age" }).click();
  await expect(card).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(card).toHaveCount(0);
});
