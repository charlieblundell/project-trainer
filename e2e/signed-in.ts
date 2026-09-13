import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test as base, type Page } from "@playwright/test";
import type { Plan } from "../src/lib/plan/types";

/*
 * A signed-in browser, without a real account.
 *
 * Supabase is answered locally: the session comes from a token planted in
 * localStorage (supabase-js reads it straight back without a network call
 * while it's unexpired), and every table the app reads on startup is served
 * from here. That keeps the tests honest about the app while keeping real
 * credentials, a shared test user, and the network out of them.
 */

const USER_ID = "11111111-2222-3333-4444-555555555555";
const EMAIL = "test@example.com";

/** A week close enough to what the generator writes to exercise the real screens. */
export function samplePlan(): Plan {
  const exercise = (exerciseId: string, sets = 4) => ({
    exerciseId,
    sets,
    unit: "weight_reps" as const,
    repMin: 6,
    repMax: 10,
    restSeconds: 90,
    targetWeightKg: null,
  });

  return {
    createdAt: "2026-09-01T00:00:00.000Z",
    goal: "Build muscle",
    level: 2,
    daysPerWeek: 2,
    refreshes: 0,
    retired: [],
    avoiding: [],
    notes: [],
    sessions: [
      {
        id: "s1",
        name: "Push",
        focus: "Upper Body",
        weekday: "tue",
        estMinutes: 38,
        region: "upper",
        exercises: [exercise("bench_press"), exercise("kb_press")],
      },
      {
        id: "s2",
        name: "Legs",
        focus: "Lower Body",
        weekday: "sat",
        estMinutes: 38,
        region: "lower",
        exercises: [exercise("back_squat"), exercise("rdl")],
      },
    ],
  };
}

const PROFILE = {
  id: USER_ID,
  goal: "Build muscle",
  // Matches the sample plan, which is built at level 2. A profile that says less
  // than the plan is exactly what the improved-plan offer refuses to act on.
  experience: "I've been training a while",
  days: 2,
  length: 45,
  environment: "Full gym",
  // The app's own equipment ids. Near-misses like "dumbbells" or "rack" read as
  // equipment nobody has, and rebuild a barbell lifter onto bodyweight work.
  equipment: ["barbell", "dumbbell", "cable", "machine", "squat_rack", "bench", "pullup_bar", "bodyweight"],
  liked_exercises: [],
  disliked_exercises: [],
  training_days: ["tue", "sat"],
  bodyweight_kg: 80,
  age: 30,
  height_cm: 180,
  sex: "male",
  considerations: null,
  health_consent_at: "2026-09-01T00:00:00.000Z",
};

export const TEST_USER = {
  id: USER_ID,
  aud: "authenticated",
  role: "authenticated",
  email: EMAIL,
  app_metadata: { provider: "email" },
  user_metadata: {},
  created_at: "2026-09-01T00:00:00.000Z",
};

/**
 * Which Supabase project the app is pointed at, since that decides the
 * localStorage key the session has to be planted under. Next reads .env.local
 * for the browser; the test runner is a separate process that doesn't, so we
 * read it here rather than guessing and silently landing on the sign-in page.
 */
export function supabaseProjectRef(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const fromFile = fromEnv
    ? null
    : readFileSync(join(__dirname, "..", ".env.local"), "utf8")
        .split("\n")
        .find((line) => line.startsWith("NEXT_PUBLIC_SUPABASE_URL="))
        ?.split("=")[1];

  const url = (fromEnv ?? fromFile ?? "").trim().replace(/^["']|["']$/g, "");
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL not found in the environment or .env.local");
  return new URL(url).hostname.split(".")[0];
}

function json(body: unknown, headers: Record<string, string> = {}) {
  return { status: 200, contentType: "application/json", body: JSON.stringify(body), headers };
}

/**
 * Answers every Supabase call the app makes on the way into a signed-in
 * screen. Anything not listed gets an empty array rather than reaching the
 * network, so a new query shows up as an obvious empty state, never as a test
 * that quietly talked to production.
 */
export async function stubSupabase(page: Page, plan: Plan | null) {
  const saved: Plan[] = [];

  await page.route("**/auth/v1/**", (route) =>
    route.fulfill(json(route.request().url().includes("/user") ? TEST_USER : { user: TEST_USER }))
  );

  await page.route("**/rest/v1/**", (route) => {
    const url = new URL(route.request().url());
    const table = url.pathname.split("/rest/v1/")[1] ?? "";
    const method = route.request().method();

    if (method === "POST" && table.startsWith("plans")) {
      saved.push(JSON.parse(route.request().postData() ?? "{}").data);
      return route.fulfill({ status: 201, contentType: "application/json", body: "[]" });
    }

    if (table.startsWith("plans")) {
      const latest = saved[saved.length - 1] ?? plan;
      return route.fulfill(json(latest ? { data: latest } : null));
    }
    if (table.startsWith("profiles")) return route.fulfill(json(PROFILE));
    if (table.startsWith("billing")) return route.fulfill(json(null));
    if (table.startsWith("workout_sessions")) {
      // A HEAD count comes back in the range header, not the body.
      return route.fulfill(json([], { "content-range": "*/0" }));
    }

    return route.fulfill(json([]));
  });

  /** What the app has saved so far, so a test can assert the change actually left the browser. */
  return { saved };
}

type Fixtures = {
  /** A page already past the auth gate, with a plan to edit, and what it has saved. */
  signedIn: { page: Page; saved: Plan[] };
};

export const test = base.extend<Fixtures>({
  signedIn: async ({ page, baseURL }, use) => {
    const { saved } = await stubSupabase(page, samplePlan());

    const projectRef = supabaseProjectRef();

    await page.addInitScript(
      ({ ref, user }) => {
        const hour = 60 * 60;
        window.localStorage.setItem(
          `sb-${ref}-auth-token`,
          JSON.stringify({
            access_token: "test-access-token",
            refresh_token: "test-refresh-token",
            token_type: "bearer",
            expires_in: hour,
            expires_at: Math.floor(Date.now() / 1000) + hour,
            user,
          })
        );
      },
      { ref: projectRef, user: TEST_USER }
    );

    await page.goto(baseURL!);
    await use({ page, saved });
  },
});

export { expect } from "@playwright/test";
