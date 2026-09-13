import { test, expect } from "./signed-in";

/*
 * Small things that decide whether the app feels effortless: a one-answer
 * question answers itself, the next workout is the first thing on Home, and a
 * disabled button says what it's waiting for.
 */

test("a one-answer setup question moves on by itself", async ({ signedIn }) => {
  const { page } = signedIn;
  await page.goto("/onboarding");
  await expect(page.getByText("1 of", { exact: false })).toBeVisible();

  await page.getByRole("button", { name: "Build muscle" }).click();
  await expect(page.getByText(/^2 of \d+$/)).toBeVisible();
});

test("Home leads with the next workout and what's in it", async ({ signedIn }) => {
  const { page } = signedIn;
  await page.goto("/home");

  const next = page.getByRole("region", { name: "Your next workout" });
  await expect(next).toBeVisible();
  await expect(next.getByText("Push", { exact: true })).toBeVisible();
  await expect(next.getByRole("list", { name: "Exercises" }).getByRole("listitem")).toHaveCount(2);
  await expect(page.getByRole("listitem", { name: /Saturday: Legs planned/ })).toBeVisible();
});

test("the Plan tab keeps rest days to a single line", async ({ signedIn }) => {
  const { page } = signedIn;
  await page.goto("/plan");

  const week = page.getByRole("region", { name: "This week" });
  // Two sessions to tap into; five rest days that aren't buttons at all.
  await expect(week.getByRole("button")).toHaveCount(2);
  await expect(week.getByText("Rest", { exact: true })).toHaveCount(5);
});
