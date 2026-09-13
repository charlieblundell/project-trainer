import { sessionById } from "@/lib/plan/helpers";
import type { Plan } from "@/lib/plan/types";
import type { WorkoutRecord } from "@/lib/progress/types";

const DAY_MS = 24 * 60 * 60 * 1000;

/** "Morning, Sam" fits on one line where "Good morning, Sam" wraps. */
export function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 5) return "Up late";
  if (h < 12) return "Morning";
  if (h < 18) return "Afternoon";
  return "Evening";
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * One line under the greeting that remembers the last workout, the way a
 * coach who'd seen you would. Only ever says what the history shows; it
 * never scolds for a gap.
 */
export function homeNote(records: WorkoutRecord[], plan: Plan | null, now = new Date()): string | null {
  if (!plan) return null;
  if (records.length === 0) return "Your first session is ready when you are.";

  const last = records.reduce((a, b) => (a.completedAt > b.completedAt ? a : b));
  const when = new Date(last.completedAt);
  const days = Math.round((startOfDay(now) - startOfDay(when)) / DAY_MS);
  const name = sessionById(plan, last.workoutId)?.name;
  const what = name ? `${name} ` : "";

  if (days <= 0) return `${name ?? "Today's session"} is logged. Nice work.`;
  if (days === 1) return `Nice work on yesterday's ${what}session.`;
  if (days < 7) {
    const weekday = when.toLocaleDateString(undefined, { weekday: "long" });
    return `Nice work on ${weekday}'s ${what}session.`;
  }
  return "Good to see you. Pick up wherever suits.";
}
