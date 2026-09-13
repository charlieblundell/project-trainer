/*
 * The screen someone was on before this one, within the app.
 *
 * A Back button has to know this to be honest. Browser history can't say:
 * `history.length > 1` only means *something* is behind the current page, not
 * that it's the screen the button is labelled with — so "Settings" could take
 * someone Home. Recording each in-app screen as it's shown answers the actual
 * question, and a page opened fresh correctly has nothing recorded.
 *
 * Module state rather than a store: it only ever describes this browser tab's
 * last few moments, and it's right for it to reset when the app reloads.
 */

let current: string | null = null;
let previous: string | null = null;

/** Called as each screen is shown. Query-string changes on the same screen don't count. */
export function recordScreen(pathname: string): void {
  if (pathname === current) return;
  previous = current;
  current = pathname;
}

/** The in-app screen shown before this one, or null if this is the first. */
export function previousScreen(): string | null {
  return previous;
}
