import { test, expect } from "@playwright/test";
import { plantSession, samplePlan, stubSupabase, TEST_USER } from "./signed-in";
import type { Plan } from "../src/lib/plan/types";

/*
 * A balance stand or a plank is held for seconds. Every timed exercise used to
 * be logged in minutes, so a 30-second hold asked for "1" minute and the plan
 * called it "2 x 1 min" — exactly the exercises an older person's plan is full of.
 */

const TUESDAY = new Date("2026-09-15T09:00:00");

function planWithHold(): Plan {
  const plan = samplePlan();
  const [push, ...rest] = plan.sessions;
  return {
    ...plan,
    sessions: [
      {
        ...push,
        exercises: [
          { exerciseId: "tandem_stance", unit: "time", sets: 2, seconds: 30, restSeconds: 30, targetWeightKg: null },
          ...push.exercises,
        ],
      },
      ...rest,
    ],
  };
}

test("a hold is logged in seconds, starting at its target", async ({ page }) => {
  const plan = planWithHold();
  await stubSupabase(page, plan);
  await plantSession(page);
  await page.clock.install({ time: TUESDAY });
  await page.goto("/");
  await page.evaluate(
    ({ plan, ownerId }) =>
      localStorage.setItem(
        "project-trainer-store",
        JSON.stringify({
          state: {
            ownerId,
            plan,
            session: {
              workoutId: "s1",
              exerciseIdx: 0,
              loggedSets: {},
              rpeValues: {},
              overrides: {},
              readiness: "skipped",
              warmedUp: true,
              startedAt: new Date("2026-09-15T08:55:00").toISOString(),
              finishedAt: null,
            },
          },
          version: 3,
        })
      ),
    { plan, ownerId: TEST_USER.id }
  );

  await page.goto("/home");
  await page.getByRole("button", { name: "Open workout" }).click();
  await expect(page).toHaveURL(/\/train$/);

  await expect(page.getByText("2 x 30 s")).toBeVisible();
  const box = page.getByRole("spinbutton", { name: "Seconds" });
  await expect(box).toHaveValue("30");

  await page.getByRole("button", { name: "Log it" }).click();
  await expect(page.getByRole("listitem", { name: "Set 1, done: 30 seconds" })).toBeVisible();
});
