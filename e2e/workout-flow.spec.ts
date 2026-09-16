import { test, expect, samplePlan, TEST_USER } from "./signed-in";

/*
 * Logging a workout used to have three ways to lose it: tapping Start again
 * wiped the sets, a workout only saved once every planned set was logged, and
 * a save the server refused was dropped. These cover the ways through now.
 */

// Push day in the sample plan.
const TUESDAY = new Date("2026-09-15T09:00:00");

function seedInProgress() {
  return {
    state: {
      ownerId: TEST_USER.id,
      plan: samplePlan(),
      session: {
        workoutId: "s1",
        exerciseIdx: 0,
        loggedSets: { bench_press: [{ w: 60, r: 8 }] },
        rpeValues: {},
        overrides: {},
        readiness: "skipped",
        warmedUp: true,
        startedAt: new Date("2026-09-15T08:30:00").toISOString(),
        finishedAt: null,
      },
    },
    version: 3,
  };
}

test("going home mid-workout and back carries on rather than starting over", async ({ signedIn }) => {
  const { page } = signedIn;
  await page.clock.install({ time: TUESDAY });
  await page.evaluate((s) => localStorage.setItem("project-trainer-store", JSON.stringify(s)), seedInProgress());

  await page.goto("/home");
  await expect(page.getByRole("button", { name: "Start workout" })).toHaveCount(0);
  await page.getByRole("button", { name: "Continue workout" }).click();

  await expect(page).toHaveURL(/\/train$/);
  // The set logged before is still there.
  await expect(page.getByRole("button", { name: "Log set 2 of 4" })).toBeVisible();
});

test("a workout can be finished early, and what was done is saved", async ({ signedIn }) => {
  const { page } = signedIn;
  await page.clock.install({ time: TUESDAY });
  await page.evaluate((s) => localStorage.setItem("project-trainer-store", JSON.stringify(s)), seedInProgress());

  const posted: unknown[] = [];
  await page.route("**/rest/v1/workout_sessions*", (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    posted.push(JSON.parse(route.request().postData() ?? "null"));
    return route.fulfill({ status: 201, contentType: "application/json", body: "[]" });
  });

  await page.goto("/train");
  await page.getByRole("button", { name: "Finish workout now" }).click();
  await page.getByRole("button", { name: "Save and finish" }).click();

  await expect(page.getByRole("heading", { name: "Workout complete" })).toBeVisible();
  expect(posted).toHaveLength(1);
  expect(JSON.stringify(posted[0])).toContain("bench_press");
});

test("skipping the last exercise finishes the workout", async ({ signedIn }) => {
  const { page } = signedIn;
  await page.clock.install({ time: TUESDAY });
  const store = seedInProgress();
  store.state.session.exerciseIdx = 1;
  (store.state.session.rpeValues as Record<string, number>).bench_press = 7;
  await page.evaluate((s) => localStorage.setItem("project-trainer-store", JSON.stringify(s)), store);

  await page.goto("/train");
  await page.getByRole("button", { name: "Skip this and finish workout" }).click();
  await expect(page.getByRole("heading", { name: "Workout complete" })).toBeVisible();
});

test("a save the server refuses is kept on the phone to retry", async ({ signedIn }) => {
  const { page } = signedIn;
  await page.clock.install({ time: TUESDAY });
  const store = seedInProgress();
  store.state.session.exerciseIdx = 1;
  store.state.session.loggedSets = {
    bench_press: [{ w: 60, r: 8 }],
    kb_press: [
      { w: 16, r: 10 },
      { w: 16, r: 10 },
      { w: 16, r: 10 },
      { w: 16, r: 10 },
    ],
  } as typeof store.state.session.loggedSets;
  await page.evaluate((s) => localStorage.setItem("project-trainer-store", JSON.stringify(s)), store);

  // An expired sign-in comes back as a refusal, not a network error.
  await page.route("**/rest/v1/workout_sessions*", (route) =>
    route.request().method() === "POST"
      ? route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ message: "JWT expired" }) })
      : route.fallback()
  );

  await page.goto("/train");
  // The last exercise's effort button says what it does.
  await page.getByRole("button", { name: "Finish workout", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Workout complete" })).toBeVisible();
  await expect(page.getByText("Saved on this phone", { exact: false })).toBeVisible();
  const queued = await page.evaluate(() => JSON.parse(localStorage.getItem("trainer-outbox") ?? "[]"));
  expect(queued.some((item: { kind: string }) => item.kind === "workout")).toBe(true);

  // And Home counts it as done today straight away.
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByText("Done today")).toBeVisible();
});
