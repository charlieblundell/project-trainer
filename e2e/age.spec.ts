import { test, expect } from "./signed-in";

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
