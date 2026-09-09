import type { BodyPart, Equipment, ExerciseDef, Level, MovementPattern } from "./types";
import { STRENGTH_EXERCISES } from "./strength";
import { BODYWEIGHT_EXERCISES } from "./bodyweight";
import { BAND_EXERCISES } from "./bands";
import { LOW_IMPACT_EXERCISES } from "./lowImpact";
import { CONDITIONING_EXERCISES } from "./conditioning";
import { MOBILITY_EXERCISES } from "./mobility";

export * from "./types";

export const EXERCISES: ExerciseDef[] = [
  ...STRENGTH_EXERCISES,
  ...BODYWEIGHT_EXERCISES,
  ...BAND_EXERCISES,
  ...LOW_IMPACT_EXERCISES,
  ...CONDITIONING_EXERCISES,
  ...MOBILITY_EXERCISES,
];

export const EXERCISES_BY_ID: Record<string, ExerciseDef> = Object.fromEntries(
  EXERCISES.map((e) => [e.id, e])
);

/** Exercises performable with the equipment the user actually has. */
export function availableExercises(owned: Equipment[]): ExerciseDef[] {
  const set = new Set<Equipment>(owned);
  // Anyone can do bodyweight work, whether or not they ticked the box.
  set.add("bodyweight");
  return EXERCISES.filter((ex) => ex.equipment.every((req) => set.has(req)));
}

export function searchExercises(query: string, pool: ExerciseDef[] = EXERCISES): ExerciseDef[] {
  const q = query.trim().toLowerCase();
  if (!q) return pool;
  return pool.filter(
    (ex) =>
      ex.name.toLowerCase().includes(q) || ex.muscles.some((m) => m.toLowerCase().includes(q))
  );
}

/**
 * Drops movements that load a body part the user has flagged as troublesome.
 * A programming filter, not medical advice — it just keeps sore shoulders away
 * from overhead pressing.
 */
export function excludingBodyParts(pool: ExerciseDef[], avoid: BodyPart[]): ExerciseDef[] {
  if (avoid.length === 0) return pool;
  const avoidSet = new Set(avoid);
  return pool.filter((ex) => !ex.loads.some((part) => avoidSet.has(part)));
}

export function byPattern(pool: ExerciseDef[], pattern: MovementPattern): ExerciseDef[] {
  return pool.filter((ex) => ex.pattern === pattern);
}

export function regressionOf(id: string): ExerciseDef | undefined {
  const easier = EXERCISES_BY_ID[id]?.easier;
  return easier ? EXERCISES_BY_ID[easier] : undefined;
}

export function progressionOf(id: string): ExerciseDef | undefined {
  const harder = EXERCISES_BY_ID[id]?.harder;
  return harder ? EXERCISES_BY_ID[harder] : undefined;
}

/**
 * Walks the easier/harder chain to the rung matching the target level, without
 * leaving the equipment the user has. Returns the closest reachable rung.
 */
export function atLevel(id: string, target: Level, owned: Equipment[]): ExerciseDef | undefined {
  const start = EXERCISES_BY_ID[id];
  if (!start) return undefined;

  const set = new Set<Equipment>(owned);
  set.add("bodyweight");
  const usable = (ex: ExerciseDef) => ex.equipment.every((req) => set.has(req));

  let current = start;
  const seen = new Set<string>([current.id]);

  while (current.level !== target) {
    const nextId = current.level < target ? current.harder : current.easier;
    if (!nextId || seen.has(nextId)) break;
    const next = EXERCISES_BY_ID[nextId];
    if (!next || !usable(next)) break;
    seen.add(nextId);
    current = next;
  }

  return usable(current) ? current : undefined;
}

/** Explicit substitutes first, then anything filling the same pattern. */
export function substitutesFor(id: string, owned: Equipment[]): ExerciseDef[] {
  const ex = EXERCISES_BY_ID[id];
  if (!ex) return [];
  const pool = availableExercises(owned);
  const explicit = (ex.substitutes ?? [])
    .map((subId) => EXERCISES_BY_ID[subId])
    .filter((sub): sub is ExerciseDef => !!sub && pool.includes(sub));

  const sameSlot = pool.filter(
    (candidate) =>
      candidate.id !== id &&
      candidate.pattern === ex.pattern &&
      !explicit.some((e) => e.id === candidate.id)
  );

  return [...explicit, ...sameSlot];
}

/**
 * Checks that every easier/harder/substitute id resolves. The library spans six
 * files that reference each other by id, so a typo would otherwise only surface
 * as a silently missing progression at runtime.
 */
export function findBrokenReferences(): string[] {
  const problems: string[] = [];
  const seenIds = new Set<string>();

  for (const ex of EXERCISES) {
    if (seenIds.has(ex.id)) problems.push(`duplicate id: ${ex.id}`);
    seenIds.add(ex.id);

    for (const [field, value] of [
      ["easier", ex.easier],
      ["harder", ex.harder],
    ] as const) {
      if (value && !EXERCISES_BY_ID[value]) {
        problems.push(`${ex.id}.${field} -> missing "${value}"`);
      }
    }

    for (const sub of ex.substitutes ?? []) {
      if (!EXERCISES_BY_ID[sub]) problems.push(`${ex.id}.substitutes -> missing "${sub}"`);
    }
  }

  return problems;
}
