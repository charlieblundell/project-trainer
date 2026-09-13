import { test, expect, samplePlan } from "./signed-in";

/*
 * Offering someone with an older plan the improved one.
 *
 * The signed-in fixture's plan is hand-written rather than built by the
 * current rules, so it's exactly the kind of plan that gets the offer.
 */

test("an older plan is offered the improvement, and nothing changes until they say so", async ({ signedIn }) => {
  const { page, saved } = signedIn;
  await page.goto("/home");

  const card = page.getByRole("region", { name: "Your plan has been improved" });
  await expect(card).toBeVisible();
  expect(saved.length).toBe(0);

  await card.getByRole("button", { name: "See what changes" }).click();
  const preview = page.getByRole("dialog", { name: "What changes" });
  await expect(preview).toBeVisible();
  await expect(preview.getByText(/^Adds/).first()).toBeVisible();

  // Opening the preview is not agreeing to it.
  expect(saved.length).toBe(0);

  await preview.getByRole("button", { name: "Update my plan" }).click();
  await expect(page.getByRole("status")).toContainText("Your plan is updated");
  expect(saved.length).toBeGreaterThan(0);
});

test("keeping the current plan means it", async ({ signedIn }) => {
  const { page, saved } = signedIn;
  await page.goto("/home");

  await page.getByRole("button", { name: "Keep my plan" }).click();
  await expect(page.getByRole("region", { name: "Your plan has been improved" })).toBeHidden();
  expect(saved.length).toBe(0);

  // And it stays gone on the next visit.
  await page.reload();
  await expect(page.getByRole("heading", { name: /^(morning|afternoon|evening|up late)/i })).toBeVisible();
  await expect(page.getByRole("region", { name: "Your plan has been improved" })).toBeHidden();
});

test("a plan someone edited by hand is never offered a rebuild", async ({ signedIn }) => {
  const { page } = signedIn;
  // Answered here rather than passed through: nothing in these tests may reach
  // the real database.
  await page.route("**/rest/v1/plans*", (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: { ...samplePlan(), editedByHand: true } }),
    });
  });

  await page.goto("/home");
  await expect(page.getByRole("heading", { name: /^(morning|afternoon|evening|up late)/i })).toBeVisible();
  await expect(page.getByRole("region", { name: "Your plan has been improved" })).toBeHidden();
});
