import { test, expect, samplePlan } from "./signed-in";

/*
 * A workout finished with no connection used to fail its save and vanish.
 * Now it waits on the phone and sends itself when the connection is back.
 *
 * The service worker only runs in production builds, so this covers the
 * data side: queueing, telling the person, and syncing afterwards.
 */

const TUESDAY = new Date("2026-09-15T09:00:00");

test("a workout finished offline is kept, then synced when back online", async ({ signedIn }) => {
  const { page } = signedIn;
  await page.clock.install({ time: TUESDAY });

  // One exercise, one set, so the whole workout is a few taps.
  const plan = samplePlan();
  plan.sessions[0].exercises = [
    { exerciseId: "calf_raise", sets: 1, unit: "reps", repMin: 10, repMax: 12, restSeconds: 60, targetWeightKg: null },
  ];
  await page.route("**/rest/v1/plans*", (route) =>
    route.request().method() === "GET"
      ? route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: plan }) })
      : route.fallback()
  );

  // The connection drops for saves.
  let offline = true;
  const synced: string[] = [];
  await page.route("**/rest/v1/{workout_sessions,plans}*", (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    if (offline) return route.abort("internetdisconnected");
    synced.push(new URL(route.request().url()).pathname);
    return route.fulfill({ status: 201, contentType: "application/json", body: "[]" });
  });

  await page.goto("/home");
  await page.getByRole("button", { name: "Start workout" }).first().click();
  const present = (name: RegExp | string) =>
    page
      .getByRole("button", { name })
      .first()
      .waitFor({ state: "visible", timeout: 8000 })
      .then(() => true)
      .catch(() => false);
  if (await present("Well")) {
    for (const answer of ["Well", "Not sore", "None"]) await page.getByRole("button", { name: answer, exact: true }).click();
    await page.getByRole("button", { name: "Start workout" }).click();
  }
  if (await present(/done — start the workout/i)) {
    await page.getByRole("button", { name: /done — start the workout/i }).click();
  }

  await page.getByRole("button", { name: "Log set 1 of 1" }).click();
  await page.getByRole("button", { name: "Finish workout", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Workout complete" })).toBeVisible();
  await expect(page.getByText("Saved on this phone", { exact: false })).toBeVisible();

  const queued = await page.evaluate(() => JSON.parse(localStorage.getItem("trainer-outbox") ?? "[]"));
  expect(queued.map((item: { kind: string }) => item.kind).sort()).toEqual(["plan", "workout"]);
  // Stamped with when it was trained, not when it eventually syncs.
  expect(queued.find((item: { kind: string }) => item.kind === "workout").row.completed_at).toBeTruthy();

  // Back online: the queue sends itself and empties.
  offline = false;
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("trainer-outbox") ?? "[]").length)).toBe(0);
  expect(synced.some((path) => path.endsWith("/workout_sessions"))).toBe(true);
  expect(synced.some((path) => path.endsWith("/plans"))).toBe(true);
});

test("opening the app without a connection keeps the plan on the phone", async ({ signedIn }) => {
  const { page } = signedIn;
  await page.clock.install({ time: TUESDAY });
  await page.goto("/home");
  await expect(page.getByRole("region", { name: "Your next workout" })).toBeVisible();

  // Every read now fails as if the signal dropped, and the app is reopened.
  await page.route("**/rest/v1/**", (route) => route.abort("internetdisconnected"));
  await page.reload();

  await expect(page.getByRole("region", { name: "Your next workout" })).toBeVisible();
  await expect(page.getByText("You don't have a plan yet.")).toHaveCount(0);
});

test("the coach says it needs a connection", async ({ signedIn, context }) => {
  const { page } = signedIn;
  await page.goto("/coach");
  await expect(page.getByPlaceholder("Ask your coach...")).toBeVisible();
  await context.setOffline(true);
  await expect(page.getByText("The coach needs a connection.", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send" })).toBeDisabled();
  await expect(page.getByText("Offline · workouts still save on this phone")).toBeVisible();
  await context.setOffline(false);
});
