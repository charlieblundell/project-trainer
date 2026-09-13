import { test, expect, samplePlan } from "./signed-in";

/*
 * Bodyweight movements that take added load.
 *
 * scripts/check-loadable.ts covers the rules; this covers the screen someone
 * actually stands in front of — that the box is offered, that it's optional,
 * and that leaving it empty still logs a set.
 */

/** The signed-in fixture's plan, with a calf raise as the first exercise. */
async function planWithCalfRaise(page: import("@playwright/test").Page) {
  const plan = samplePlan();
  plan.sessions[0].exercises = [
    {
      exerciseId: "calf_raise",
      sets: 3,
      unit: "reps",
      repMin: 10,
      repMax: 12,
      restSeconds: 60,
      targetWeightKg: null,
    },
    ...plan.sessions[0].exercises,
  ];
  // Registered after the fixture's handler, so this one answers first.
  await page.route("**/rest/v1/plans*", (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: plan }),
    });
  });
}

/** Walks from the plan into the first exercise of the session. */
async function startTraining(page: import("@playwright/test").Page) {
  await page.goto("/home");
  await page.getByRole("button", { name: /start workout|start it early/i }).first().click();

  /*
   * The check-in comes first, then the warm-up. isVisible() answers straight
   * away rather than waiting, so these have to wait for the screen to arrive
   * before deciding it isn't there.
   */
  const present = async (locator: ReturnType<typeof page.getByRole>) =>
    locator
      .first()
      .waitFor({ state: "visible", timeout: 8000 })
      .then(() => true)
      .catch(() => false);

  if (await present(page.getByRole("heading", { name: "Quick check-in" }))) {
    for (const answer of ["Well", "Not sore", "None"]) {
      await page.getByRole("button", { name: answer, exact: true }).click();
    }
    await page.getByRole("button", { name: "Start workout" }).click();
  }

  const past = page.getByRole("button", { name: /done — start the workout/i });
  if (await present(past)) await past.click();
}

test("a calf raise offers weight without demanding it", async ({ signedIn }) => {
  const { page } = signedIn;
  await planWithCalfRaise(page);
  await startTraining(page);

  await expect(page.getByRole("heading", { name: "Calf Raise" })).toBeVisible();

  // Offered, empty, and clearly not the whole load.
  const weight = page.getByRole("spinbutton", { name: /added weight/i });
  await expect(weight).toBeVisible();
  await expect(weight).toHaveValue("");

  // The set logs with the box left alone: this is still a bodyweight exercise.
  await page.getByRole("button", { name: /^log set$/i }).click();
  await expect(page.getByRole("listitem").first()).toContainText("12");
});

test("adding weight is remembered as added, not as the total", async ({ signedIn }) => {
  const { page, saved } = signedIn;
  await planWithCalfRaise(page);
  await startTraining(page);

  const weight = page.getByRole("spinbutton", { name: /added weight/i });
  await weight.click();
  await weight.fill("20");
  await page.getByRole("button", { name: /^log set$/i }).click();

  // The chip says what was added, with the sign that makes it unambiguous.
  await expect(page.getByRole("listitem").first()).toContainText("+20");
  expect(saved).toBeDefined();
});

test("a barbell lift still demands a weight", async ({ signedIn }) => {
  const { page } = signedIn;
  await startTraining(page);

  await expect(page.getByRole("heading", { name: "Barbell Bench Press" })).toBeVisible();
  await expect(page.getByRole("spinbutton", { name: "Weight" })).toBeVisible();
  // Nothing typed, so there's nothing to log yet.
  await expect(page.getByRole("button", { name: /^log set$/i })).toBeDisabled();
});
