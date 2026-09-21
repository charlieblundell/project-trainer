/**
 * Why an age can't be used, or null if it can (or wasn't given). Asked in
 * setup and editable in Settings. The terms set 16 as the minimum age.
 */
export function ageProblem(age: number | null): string | null {
  if (age === null) return null;
  if (!Number.isInteger(age) || age > 110) return "That doesn't look like an age.";
  if (age < 16) return "You need to be 16 or older to use the app.";
  return null;
}
