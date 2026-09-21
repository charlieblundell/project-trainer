import { test, expect, samplePlan, TEST_USER } from "./signed-in";

/*
 * The coach changing the plan, and chats that start fresh each day. The model
 * is never called: the coach's reply, with its proposal, comes from a stub.
 */

const TUESDAY = new Date("2026-09-15T09:00:00");

test("a change the coach proposes is only made on Apply, and can be undone", async ({ signedIn }) => {
  const { page, saved } = signedIn;
  await page.clock.install({ time: TUESDAY });
  await page.route("**/api/coach", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        reply: "Dumbbells are kinder on a sore shoulder, so let's swap the bench press.",
        proposal: {
          summary: "Swap bench press for dumbbell bench press on Push day",
          changes: [{ kind: "replace_exercise", sessionId: "s1", exerciseId: "bench_press", toExerciseId: "db_bench" }],
          state: "pending",
        },
      }),
    })
  );

  await page.goto("/coach");
  await page.getByLabel("Message your coach").fill("My shoulder hates bench press");
  await page.getByRole("button", { name: "Send" }).click();

  const card = page.getByRole("group", { name: "Proposed change to your plan" });
  await expect(card).toContainText("Bench Press →");
  // Proposed, not made.
  expect(saved).toHaveLength(0);

  await card.getByRole("button", { name: "Apply" }).click();
  await expect(card).toContainText("Applied to your plan");
  await expect.poll(() => saved.length).toBe(1);
  const pushDay = saved[0].sessions.find((s) => s.id === "s1")!;
  expect(pushDay.exercises.map((e) => e.exerciseId)).toContain("db_bench");
  expect(pushDay.exercises.map((e) => e.exerciseId)).not.toContain("bench_press");

  await card.getByRole("button", { name: "Undo" }).click();
  await expect(card).toContainText("Undone");
  await expect.poll(() => saved.length).toBe(2);
  expect(saved[1].sessions.find((s) => s.id === "s1")!.exercises.map((e) => e.exerciseId)).toContain("bench_press");
});

test("No thanks leaves the plan alone", async ({ signedIn }) => {
  const { page, saved } = signedIn;
  await page.route("**/api/coach", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        reply: "We could move Legs to Sunday.",
        proposal: { summary: "Move Legs to Sunday", changes: [{ kind: "move_session", sessionId: "s2", weekday: "sun" }], state: "pending" },
      }),
    })
  );
  await page.goto("/coach");
  await page.getByLabel("Message your coach").fill("Saturdays are busy");
  await page.getByRole("button", { name: "Send" }).click();

  const card = page.getByRole("group", { name: "Proposed change to your plan" });
  await card.getByRole("button", { name: "No thanks" }).click();
  await expect(card).toContainText("Left your plan as it was");
  expect(saved).toHaveLength(0);
});

test("a new day starts a new chat, and yesterday's is under Past chats", async ({ signedIn }) => {
  const { page } = signedIn;
  await page.clock.install({ time: TUESDAY });
  const yesterday = new Date("2026-09-14T18:00:00").toISOString();
  await page.evaluate(
    (s) => localStorage.setItem("project-trainer-store", JSON.stringify(s)),
    {
      state: {
        ownerId: TEST_USER.id,
        plan: samplePlan(),
        chats: [
          {
            id: "chat-yesterday",
            startedAt: yesterday,
            updatedAt: yesterday,
            messages: [
              { role: "assistant", text: "Hey. What can I help with?" },
              { role: "user", text: "Can I swap squats for leg press?" },
              { role: "assistant", text: "Yes, leg press works your quads just as well." },
            ],
          },
        ],
      },
      version: 4,
    }
  );

  await page.goto("/coach");
  // Today's chat is fresh.
  await expect(page.getByText("Can I swap squats for leg press?")).toHaveCount(0);

  await page.getByRole("button", { name: "Past chats" }).click();
  const sheet = page.getByRole("dialog", { name: "Past chats" });
  await expect(sheet).toContainText("Yesterday");
  await sheet.getByRole("button", { name: /^Can I swap squats for leg press/ }).click();
  await expect(page.getByText("Yes, leg press works your quads just as well.")).toBeVisible();
});

test("a chat from before chats were kept as a list isn't lost", async ({ signedIn }) => {
  const { page } = signedIn;
  await page.evaluate(
    (s) => localStorage.setItem("project-trainer-store", JSON.stringify(s)),
    {
      state: {
        ownerId: TEST_USER.id,
        plan: samplePlan(),
        messages: [
          { role: "assistant", text: "Hey. What can I help with?" },
          { role: "user", text: "What am I doing today?" },
          { role: "assistant", text: "Push day, four exercises." },
        ],
      },
      version: 3,
    }
  );
  await page.goto("/coach");
  await expect(page.getByText("Push day, four exercises.")).toBeVisible();
});
