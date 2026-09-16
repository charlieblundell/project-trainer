import { test, expect, samplePlan, TEST_USER } from "./signed-in";

/*
 * After a workout is finished, the Train tab used to reopen the last exercise
 * with every set ticked. For the rest of that day it says well done instead;
 * the next day it offers the next session.
 */

function seedFinishedSession(finishedAt: string) {
  return {
    state: {
      ownerId: TEST_USER.id,
      plan: samplePlan(),
      session: {
        workoutId: "s1",
        exerciseIdx: 1,
        loggedSets: {
          bench_press: [
            { w: 60, r: 8 },
            { w: 60, r: 8 },
            { w: 60, r: 7 },
          ],
          kb_press: [
            { w: 16, r: 10 },
            { w: 16, r: 9 },
          ],
        },
        rpeValues: {},
        overrides: {},
        readiness: "skipped",
        warmedUp: true,
        finishedAt,
      },
    },
    version: 3,
  };
}

test("the Train tab says well done after today's workout", async ({ signedIn }) => {
  const { page } = signedIn;
  const store = seedFinishedSession(new Date().toISOString());
  await page.evaluate((s) => localStorage.setItem("project-trainer-store", JSON.stringify(s)), store);

  await page.goto("/train");
  await expect(page.getByRole("heading", { name: "Good job!" })).toBeVisible();
  await expect(page.getByText("You finished Push today", { exact: false })).toBeVisible();
  await expect(page.getByText("sets", { exact: true })).toBeVisible();
  await expect(page.getByText("5", { exact: true })).toBeVisible();
  // Not the last exercise again.
  await expect(page.getByRole("button", { name: /log (this )?set/i })).toHaveCount(0);

  await page.getByRole("button", { name: "Back home" }).click();
  await expect(page).toHaveURL(/\/home$/);
});

test("a workout finished yesterday doesn't hold the Train tab", async ({ signedIn }) => {
  const { page } = signedIn;
  // Push was finished last Saturday; it's now Tuesday, which is Push day. (Past
  // dates only: the stubbed sign-in expires an hour after the real clock.)
  await page.clock.install({ time: new Date("2026-09-15T09:00:00") });
  const store = seedFinishedSession(new Date("2026-09-12T18:00:00").toISOString());
  await page.evaluate((s) => localStorage.setItem("project-trainer-store", JSON.stringify(s)), store);

  await page.goto("/train");
  await expect(page.getByRole("heading", { name: "Good job!" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Start Push" })).toBeVisible();
});

test("a workout left unfinished on an earlier day doesn't hold the Train tab", async ({ signedIn }) => {
  const { page } = signedIn;
  // Push was started last Saturday and never finished; it's now Tuesday.
  await page.clock.install({ time: new Date("2026-09-15T09:00:00") });
  const store = seedFinishedSession("");
  const state = store.state as Record<string, unknown> & { session: Record<string, unknown> };
  state.session.finishedAt = null;
  state.session.startedAt = new Date("2026-09-12T18:00:00").toISOString();
  await page.evaluate((s) => localStorage.setItem("project-trainer-store", JSON.stringify(s)), store);

  await page.goto("/train");
  await expect(page.getByRole("button", { name: /log (this )?set/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Start Push" })).toBeVisible();

  // The sets already logged aren't thrown away without asking.
  await page.getByRole("button", { name: "Finish Push instead" }).click();
  await expect(page.getByRole("button", { name: /log (this )?set/i })).toBeVisible();
});

test("reaching the completion screen is what marks the workout finished", async ({ signedIn }) => {
  const { page } = signedIn;
  const store = seedFinishedSession("");
  const state = store.state as Record<string, unknown> & { session: Record<string, unknown> };
  state.session.finishedAt = null;
  state.lastCompletedSummary = { workoutId: "s1", loggedSets: state.session.loggedSets };
  state.lastChanges = [];
  await page.evaluate((s) => localStorage.setItem("project-trainer-store", JSON.stringify(s)), store);

  await page.goto("/train/complete");
  await expect(page.getByRole("heading", { name: "Workout complete" })).toBeVisible();

  await page.getByRole("link", { name: "Train" }).first().click();
  await expect(page.getByRole("heading", { name: "Good job!" })).toBeVisible();
});
