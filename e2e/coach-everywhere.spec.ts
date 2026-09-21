import { test as base } from "@playwright/test";
import { test, expect, samplePlan, TEST_USER, plantSession, stubSupabase } from "./signed-in";

/*
 * The coach outside its own tab: a question ready to ask from wherever it
 * comes up, a note after each workout, and a read on the month on Progress.
 * The model is never called; each note comes from a stubbed endpoint.
 */

// Push day in the sample plan.
const TUESDAY = new Date("2026-09-15T09:00:00");

test("a session on the Plan tab opens the coach with a question ready", async ({ signedIn }) => {
  const { page } = signedIn;
  await page.clock.install({ time: TUESDAY });
  await page.goto("/plan");

  await page.getByRole("region", { name: "This week" }).getByRole("button").first().click();
  await page.getByRole("link", { name: "Ask the coach about Push" }).click();

  await expect(page).toHaveURL(/\/coach$/);
  await expect(page.getByLabel("Message your coach")).toHaveValue(/my Push session/);
  // Waiting to be sent, not sent for them.
  await expect(page.getByText("What's my Push session for", { exact: false })).toHaveCount(0);
});

test("finishing a workout brings a note from the coach", async ({ signedIn }) => {
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
    }
  );

  const sent: string[] = [];
  await page.route("**/api/debrief", (route) => {
    sent.push(route.request().postData() ?? "");
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ debrief: "Eight clean reps at 60 kg on bench. Next time, keep the same bar path." }),
    });
  });

  await page.goto("/train");
  await page.getByRole("button", { name: "Finish workout now" }).click();
  await page.getByRole("button", { name: "Save and finish" }).click();

  const note = page.getByRole("region", { name: "From your coach" });
  await expect(note).toContainText("Eight clean reps at 60 kg");
  expect(sent).toHaveLength(1);
  expect(JSON.parse(sent[0])).toMatchObject({ session: "Push", exercises: [{ sets: [{ w: 60, r: 8 }] }] });
  await expect(note.getByRole("link", { name: "Ask a follow-up" })).toBeVisible();
});

test("Progress opens with the coach's read on the month", async ({ signedIn }) => {
  const { page } = signedIn;
  await page.clock.install({ time: TUESDAY });

  await page.route("**/rest/v1/workout_sessions*", (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          workout_id: "s1",
          logged_sets: { bench_press: [{ w: 60, r: 8 }] },
          rpe: {},
          completed_at: "2026-09-09T09:00:00.000Z",
        },
      ]),
    });
  });
  await page.route("**/api/week-summary", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ summary: "One Push session in the last week, with bench at 60 kg for 8." }),
    })
  );

  await page.goto("/progress");
  await expect(page.getByRole("region", { name: "Your month, from your coach" })).toContainText("bench at 60 kg");
});

const newAccount = base.extend({
  page: async ({ page }, use) => {
    await stubSupabase(page, null, { newAccount: true });
    await plantSession(page);
    await use(page);
  },
});

newAccount("the coach points someone without a plan to building one", async ({ page }) => {
  await page.goto("/coach");
  await expect(page.getByRole("link", { name: "Build my plan" })).toHaveAttribute("href", "/onboarding");
});
