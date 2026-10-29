import { test, expect, samplePlan, TEST_USER } from "./signed-in";

/*
 * Two places the app now explains itself: why an exercise has its numbers,
 * and what a settings change will do to the plan before it's saved.
 */

// Push day in the sample plan.
const TUESDAY = new Date("2026-09-15T09:00:00");

test("an exercise explains its sets, reps, effort and rest, with the evidence", async ({ signedIn }) => {
  const { page } = signedIn;
  await page.clock.install({ time: TUESDAY });
  await page.evaluate(
    (s) => localStorage.setItem("project-trainer-store", JSON.stringify(s)),
    {
      state: {
        ownerId: TEST_USER.id,
        plan: samplePlan(),
        session: {
          workoutId: "s1",
          exerciseIdx: 0,
          loggedSets: {},
          rpeValues: {},
          overrides: {},
          readiness: "skipped",
          warmedUp: true,
          startedAt: new Date("2026-09-15T08:30:00").toISOString(),
          finishedAt: null,
        },
      },
      version: 3,
    }
  );

  await page.goto("/train");
  await page.getByRole("button", { name: "Why these numbers?" }).click();

  const sheet = page.getByRole("dialog", { name: /Why these numbers/ });
  for (const label of ["Sets", "Reps", "Effort", "Rest"]) {
    await expect(sheet.getByText(label, { exact: true })).toBeVisible();
  }
  // Each reason leads to the research, labelled with how strong and settled it is.
  await expect(sheet.getByRole("link", { name: /evidence/ }).first()).toBeVisible();
  await expect(sheet.getByText(/Studies agree|Most studies agree/).first()).toBeVisible();
});

test("settings puts the plan first and says what each part changes", async ({ signedIn }) => {
  const { page } = signedIn;
  await page.goto("/settings");

  const plan = page.getByRole("region", { name: "Your plan" });
  await expect(plan.getByRole("link", { name: /Where you train and equipment/ })).toBeVisible();
  await expect(plan.getByRole("link", { name: /Days and session length/ })).toBeVisible();

  await plan.getByRole("link", { name: /Days and session length/ }).click();
  await expect(page.getByText("These set how your week is split", { exact: false })).toBeVisible();
});

test("changing the session length shows what changes before saving", async ({ signedIn }) => {
  const { page } = signedIn;
  await page.goto("/settings/schedule");

  // The test profile trains for 45 minutes.
  await page.getByRole("button", { name: "60 min" }).click();

  await expect(page.getByText("If you save, your plan changes like this")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save and update my plan" })).toBeEnabled();
});
