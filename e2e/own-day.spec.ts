import { test, expect } from "./signed-in";

/*
 * A session starts on its own day. The sample plan has Push on Tuesday and
 * Legs on Saturday, so Monday is a rest day with Push next.
 */

const MONDAY = new Date("2026-09-14T09:00:00");
const TUESDAY = new Date("2026-09-15T09:00:00");

test("a rest day shows what's next without a way to start it", async ({ signedIn }) => {
  const { page } = signedIn;
  await page.clock.install({ time: MONDAY });
  await page.goto("/home");

  const next = page.getByRole("region", { name: "Your next workout" });
  await expect(next.getByText("Ready to start on Tuesday.")).toBeVisible();
  await expect(next.getByRole("button")).toHaveCount(0);

  await page.goto("/train");
  await expect(page.getByText("Rest day. Push is on Tuesday.")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Start/ })).toHaveCount(0);
});

test("the Plan tab only offers to start today's session", async ({ signedIn }) => {
  const { page } = signedIn;
  await page.clock.install({ time: TUESDAY });
  await page.goto("/plan");
  const week = page.getByRole("region", { name: "This week" });

  await week.getByRole("button", { name: /Legs/ }).click();
  await expect(page.getByText("You can start this on Saturday.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Start this workout" })).toHaveCount(0);
  await page.getByRole("button", { name: "Close" }).click();

  await week.getByRole("button", { name: /Push/ }).click();
  await expect(page.getByRole("button", { name: "Start this workout" })).toBeVisible();
});

test("on the session's day, Home still starts it", async ({ signedIn }) => {
  const { page } = signedIn;
  await page.clock.install({ time: TUESDAY });
  await page.goto("/home");
  await expect(
    page.getByRole("region", { name: "Your next workout" }).getByRole("button", { name: "Start workout" })
  ).toBeVisible();
});
