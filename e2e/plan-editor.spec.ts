import { test, expect } from "./signed-in";

/*
 * The plan editor, driven the way a person drives it.
 *
 * A friend reported "doesn't let me change sets number": every keystroke was
 * being clamped, so clearing the box read as zero and snapped to the minimum.
 * scripts/check-plan-edit.ts covers the rule that fixed it; these cover the
 * box itself, which is where the bug actually lived.
 */

test.beforeEach(async ({ signedIn }) => {
  await signedIn.page.goto("/plan/edit");
  await expect(signedIn.page.getByRole("heading", { name: "Edit your week" })).toBeVisible();
});

/** The first exercise's boxes, in the order they're laid out. */
const boxes = (page: import("@playwright/test").Page) => ({
  sets: page.getByRole("spinbutton").nth(0),
  repMin: page.getByRole("spinbutton").nth(1),
  repMax: page.getByRole("spinbutton").nth(2),
  rest: page.getByRole("spinbutton").nth(3),
  weight: page.getByRole("spinbutton").nth(4),
});

test("clearing the box to type a new number doesn't fight you", async ({ signedIn }) => {
  const { sets } = boxes(signedIn.page);

  await sets.click();
  await sets.press("ControlOrMeta+a");
  await sets.press("Backspace");
  // An empty box has to survive while you're still typing.
  await expect(sets).toHaveValue("");

  // The bug: clearing read as zero and snapped to the minimum, so this landed
  // beside a 1 and came out as 13 rather than 3.
  await sets.pressSequentially("3");
  await sets.press("Enter");
  await expect(sets).toHaveValue("3");
});

test("typing a new number of sets sticks", async ({ signedIn }) => {
  const { sets } = boxes(signedIn.page);

  await sets.click();
  await sets.press("ControlOrMeta+a");
  await sets.fill("3");
  await sets.press("Enter");

  await expect(sets).toHaveValue("3");
  await expect(signedIn.page.getByRole("button", { name: "Save my plan" })).toBeEnabled();
});

test("walking away from a half-finished edit leaves the number alone", async ({ signedIn }) => {
  const { sets, rest } = boxes(signedIn.page);

  await sets.click();
  await sets.press("ControlOrMeta+a");
  await sets.press("Backspace");
  await rest.click(); // blur without typing anything

  await expect(sets).toHaveValue("4");
  await expect(signedIn.page.getByRole("button", { name: "No changes yet" })).toBeDisabled();
});

test("numbers outside the sane range are pulled back in", async ({ signedIn }) => {
  const { sets } = boxes(signedIn.page);

  await sets.click();
  await sets.fill("99");
  await sets.press("Enter");
  await expect(sets).toHaveValue("12");

  await sets.click();
  await sets.fill("0");
  await sets.press("Enter");
  await expect(sets).toHaveValue("1");
});

test("a rep range typed backwards is corrected, not stored backwards", async ({ signedIn }) => {
  const { repMin, repMax } = boxes(signedIn.page);

  await repMax.click();
  await repMax.fill("4"); // below the 6 in "reps from"
  await repMax.press("Enter");

  await expect(repMin).toHaveValue("4");
  await expect(repMax).toHaveValue("4");
});

test("the target weight can be cleared back to uncalibrated", async ({ signedIn }) => {
  const { weight } = boxes(signedIn.page);

  await weight.click();
  await weight.fill("62.5");
  await weight.press("Enter");
  await expect(weight).toHaveValue("62.5");

  await weight.click();
  await weight.press("ControlOrMeta+a");
  await weight.press("Backspace");
  await weight.press("Enter");
  await expect(weight).toHaveValue("");
});

test("an edit survives being saved and reloaded", async ({ signedIn }) => {
  const { page, saved } = signedIn;
  const { sets } = boxes(page);

  await sets.click();
  await sets.press("ControlOrMeta+a");
  await sets.fill("3");
  await sets.press("Enter");
  await page.getByRole("button", { name: "Save my plan" }).click();

  // Saving hands you back to the plan, and the change has left the browser.
  await expect(page).toHaveURL(/\/plan$/);
  expect(saved.at(-1)?.sessions[0].exercises[0].sets).toBe(3);

  await page.goto("/plan/edit");
  await expect(boxes(page).sets).toHaveValue("3");
});

test("opening the editor before the plan has arrived still shows the plan", async ({ signedIn }) => {
  const { page } = signedIn;

  /*
   * A device with nothing cached — a new phone, a cleared browser, a first
   * visit — where the plan can only come from the server, slowly. The editor
   * mounts before it lands. It used to seed itself with nothing and stay that
   * way, telling people they had no plan and offering to build one over the
   * top of the one they had.
   */
  await page.evaluate(() => window.localStorage.removeItem("project-trainer-store"));
  await page.route("**/rest/v1/plans*", async (route) => {
    await new Promise((done) => setTimeout(done, 1500));
    await route.fallback();
  });

  await page.goto("/plan/edit");
  await expect(page.getByRole("heading", { name: "Edit your week" })).toBeVisible();
  await expect(page.getByText("There's no plan to edit yet.")).toBeHidden();
  await expect(boxes(page).sets).toHaveValue("4");
});

test("reordering exercises changes what's trained first", async ({ signedIn }) => {
  const { page } = signedIn;
  const first = page.getByText("Barbell Bench Press");
  await expect(first).toBeVisible();

  await page.getByRole("button", { name: "Move down" }).first().click();

  const names = await page.locator("[class*='font-semibold']").allInnerTexts();
  expect(names.join(" ").indexOf("Bench")).toBeGreaterThan(names.join(" ").indexOf("Overhead"));
});
