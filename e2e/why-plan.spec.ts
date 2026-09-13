import { test, expect } from "./signed-in";

/*
 * "Why your plan looks like this": reachable from the plan, honest about
 * which rules are research and which are judgement, and every citation opens
 * the finding it names.
 */

test("the plan explains itself, research and judgement both", async ({ signedIn }) => {
  const { page } = signedIn;
  await page.goto("/plan");
  await page.getByRole("link", { name: /why your plan looks like this/i }).click();

  await expect(page.getByRole("heading", { name: "Why your plan looks like this", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: /from the research/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /our judgement/i })).toBeVisible();

  // The judgement calls are in the same list, labelled, not hidden.
  await expect(page.getByText("Our judgement", { exact: true }).first()).toBeVisible();

  // The volume rule speaks about this plan, not plans in general.
  await expect(page.getByText(/Your plan:/).first()).toBeVisible();
});

test("a citation opens the finding it names", async ({ signedIn }) => {
  const { page } = signedIn;
  await page.goto("/plan/why");

  const volume = page.getByRole("article", { name: "Every muscle gets a weekly set target" });
  await volume.getByRole("link", { name: /the research/i }).click();

  await expect(page).toHaveURL(/\/evidence\?ids=volume-dose-response,count-indirect-sets-as-half/);
  // Linked findings open first, already expanded.
  await expect(page.getByText(/counted as half a set/i).first()).toBeVisible();
});
