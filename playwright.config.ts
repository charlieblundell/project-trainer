import { defineConfig, devices } from "@playwright/test";

/*
 * End-to-end tests against a real browser.
 *
 * Two bugs reached real people — the plan editor's number boxes and the setup
 * screen sending people back to sign-in — because the signed-in screens were
 * only ever tested by hand. These run the same screens on every push.
 *
 * The tests sign in by stubbing Supabase rather than using a real account: no
 * credentials in the repo, no shared test user to keep alive, and the same
 * result every run. See e2e/signed-in.ts.
 */

const PORT = 3000;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",

  // The dev server compiles a route the first time it's asked for it, which on
  // a cold run is slower than the 5s default and reads as a phantom failure.
  expect: { timeout: 15_000 },

  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  /*
   * The bugs that got out were both on a phone, so that's the shape we test:
   * an iPhone viewport, touch input, mobile user agent. Chromium rather than
   * WebKit, because Chromium is the one browser build we install — swap in
   * `devices["iPhone 15"]` unchanged (and `npx playwright install webkit`) if
   * a Safari-specific problem ever needs pinning down.
   */
  projects: [{ name: "phone", use: { ...devices["iPhone 15"], browserName: "chromium" } }],

  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
