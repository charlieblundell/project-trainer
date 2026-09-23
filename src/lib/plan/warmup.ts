import {
  EXERCISES_BY_ID,
  availableExercises,
  onTheFloor,
  type Equipment,
  type ExerciseDef,
  type Level,
} from "@/lib/exercises";
import type { Plan, PlannedSession, Region } from "./types";

/*
 * A short warm-up for the session about to be trained: a few mobility moves
 * for the joints that session actually uses, then one easy set of the first
 * lift. Worked out fresh each time rather than stored on the plan, so it
 * follows the session and the equipment someone has today.
 *
 * Long static stretching before lifting is deliberately not what this is —
 * see the evidence library's long-static-stretching-before-lifting finding.
 * These are short, movement-based, and capped at 30 seconds a side.
 */

export type WarmUpMove = {
  id: string;
  name: string;
  /** "8 reps each side", "30 seconds" — what to actually do. */
  dose: string;
  cue?: string;
};

export type WarmUp = {
  moves: WarmUpMove[];
  /** The easy set to do before the first working set, if the session starts with weights. */
  rampUp: string | null;
};

/** Joints and areas each half of the body wants moving before it's loaded. */
const WANTED: Record<Region, string[]> = {
  upper: ["shoulder", "chest", "thoracic", "lats", "neck", "front delt"],
  lower: ["hip", "ankle", "hamstring", "glute", "quad", "calf"],
  core: ["spine", "core", "thoracic", "hip"],
  full: ["hip", "shoulder", "thoracic", "ankle", "hamstring", "chest"],
};

const MAX_MOVES = 4;

function scoreMove(def: ExerciseDef, wanted: string[]): number {
  const text = `${def.muscles.join(" ")} ${def.loads.join(" ")}`.toLowerCase();
  let score = 0;
  for (const [i, word] of wanted.entries()) {
    // Earlier words in the list matter more: they're the joints under load.
    if (text.includes(word)) score += wanted.length - i;
  }
  // Something you move through beats something you hold still, before training.
  if (def.unit === "reps") score += 6;
  if (def.lowImpact) score += 1;
  return score;
}

/** At most one held stretch: the rest should be movement. */
const MAX_HELD = 1;

function doseFor(def: ExerciseDef): string {
  if (def.unit === "reps") {
    const eachSide = /each side|side to side|rotat/i.test(def.cues?.join(" ") ?? "");
    return eachSide ? "8 reps each side" : "8 slow reps";
  }
  return "30 seconds";
}

/**
 * The first exercise's easy set. Only for weighted work: there's nothing to
 * ramp up on a bodyweight or timed movement.
 */
function rampUpFor(session: PlannedSession): string | null {
  const first = session.exercises[0];
  if (!first || first.unit !== "weight_reps") return null;
  const name = EXERCISES_BY_ID[first.exerciseId]?.name ?? "your first exercise";
  if (first.targetWeightKg == null) {
    return `One easy set of ${name} with a light weight, to find today's starting load.`;
  }
  const light = Math.max(2.5, Math.round((first.targetWeightKg * 0.5) / 2.5) * 2.5);
  return `One easy set of ${name} at about ${light} kg, then straight into your working sets.`;
}

/**
 * Who the warm-up is for. Within their experience, like the session itself
 * (a beginner was being warmed up with the World's Greatest Stretch, a deep
 * lunge and twist), and low-impact moves only for anyone the plan is careful
 * with: 65 and over, or a balance or bone caution.
 */
export type WarmUpFor = { level?: Level; gentle?: boolean };

/** What to pass for a given plan. */
export function warmUpProfile(plan: Pick<Plan, "level" | "cautions"> | null): WarmUpFor {
  return { level: plan?.level, gentle: (plan?.cautions ?? []).length > 0 };
}

export function warmUpFor(session: PlannedSession, owned: Equipment[], who: WarmUpFor = {}): WarmUp {
  const wanted = WANTED[session.region] ?? WANTED.full;
  // A move the session already has as work isn't also the warm-up.
  const inSession = new Set(session.exercises.map((e) => e.exerciseId));
  const pool = availableExercises(owned).filter(
    (ex) =>
      ex.pattern === "mobility" &&
      !inSession.has(ex.id) &&
      (who.level === undefined || ex.level <= who.level) &&
      (!who.gentle || !!ex.lowImpact)
  );

  /*
   * Someone the plan is careful with warms up on their feet or in a chair
   * where it can: the warm-up shouldn't start by getting down on the floor.
   * Floor moves still fill in if there's nothing else.
   */
  const floorPenalty = (def: ExerciseDef) => (who.gentle && onTheFloor(def) ? 10 : 0);
  const ranked = pool
    .map((def) => ({ def, score: scoreMove(def, wanted) }))
    .filter((entry) => entry.score > 0)
    .map((entry) => ({ ...entry, score: entry.score - floorPenalty(entry.def) }))

    .sort((a, b) => b.score - a.score || a.def.id.localeCompare(b.def.id));

  const picked: ExerciseDef[] = [];
  let held = 0;
  for (const { def } of ranked) {
    if (picked.length >= MAX_MOVES) break;
    const isHeld = def.unit !== "reps";
    if (isHeld && held >= MAX_HELD) continue;
    if (isHeld) held += 1;
    picked.push(def);
  }

  const moves = picked.map((def) => ({
    id: def.id,
    name: def.name,
    dose: doseFor(def),
    cue: def.cues?.[0],
  }));

  return { moves, rampUp: rampUpFor(session) };
}
