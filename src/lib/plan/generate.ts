import {
  EXERCISES_BY_ID,
  availableExercises,
  type BodyPart,
  type Equipment,
  type ExerciseDef,
  type Level,
  type MovementPattern,
} from "@/lib/exercises";
import type { Weekday } from "@/lib/types";
import type { GeneratorProfile, Plan, PlannedExercise, PlannedSession } from "./types";

/* ------------------------------------------------------------------ *
 * Session templates
 *
 * A template is an ordered list of movement patterns. Order is priority:
 * the biggest movements sit at the front, and when someone's session is
 * short we trim from the back rather than dropping a main lift.
 * ------------------------------------------------------------------ */

type Region = "upper" | "lower" | "core" | "full";

type Template = {
  name: string;
  focus: string;
  region: Region;
  slots: MovementPattern[];
  /** Keeps a "Steady Cardio" day from prescribing intervals, and vice versa. */
  conditioningStyle?: "steady" | "interval";
};

const LOWER_MUSCLES = new Set([
  "quads", "glutes", "hamstrings", "calves", "hip flexors", "hips", "ankles", "shins",
]);
const CORE_MUSCLES = new Set(["core", "obliques", "lower back", "spine", "thoracic spine"]);

/** Which half of the body a movement belongs to, read from its primary muscle. */
function regionOf(ex: ExerciseDef): Region {
  const primary = (ex.muscles[0] ?? "").toLowerCase();
  if (primary === "full body") return "full";
  if (CORE_MUSCLES.has(primary)) return "core";
  if (LOWER_MUSCLES.has(primary)) return "lower";
  return "upper";
}

const T: Record<string, Template> = {
  fullA: {
    name: "Full Body A",
    focus: "Full Body",
    region: "full",
    slots: ["squat", "horizontal_push", "horizontal_pull", "hinge", "core", "isolation"],
  },
  fullB: {
    name: "Full Body B",
    focus: "Full Body",
    region: "full",
    slots: ["hinge", "vertical_push", "vertical_pull", "lunge", "core", "isolation"],
  },
  fullC: {
    name: "Full Body C",
    focus: "Full Body",
    region: "full",
    slots: ["squat", "horizontal_push", "horizontal_pull", "isolation", "core", "isolation"],
  },
  upperA: {
    name: "Upper A",
    focus: "Upper Body",
    region: "upper",
    slots: ["horizontal_push", "vertical_pull", "vertical_push", "horizontal_pull", "isolation", "isolation"],
  },
  upperB: {
    name: "Upper B",
    focus: "Upper Body",
    region: "upper",
    slots: ["vertical_push", "horizontal_pull", "horizontal_push", "vertical_pull", "isolation", "isolation"],
  },
  lowerA: {
    name: "Lower A",
    focus: "Lower Body",
    region: "lower",
    slots: ["squat", "hinge", "lunge", "isolation", "core"],
  },
  lowerB: {
    name: "Lower B",
    focus: "Lower Body",
    region: "lower",
    slots: ["hinge", "squat", "lunge", "isolation", "core"],
  },
  push: {
    name: "Push",
    focus: "Chest, Shoulders & Triceps",
    region: "upper",
    slots: ["horizontal_push", "vertical_push", "horizontal_push", "isolation", "isolation"],
  },
  pull: {
    name: "Pull",
    focus: "Back & Biceps",
    region: "upper",
    slots: ["vertical_pull", "horizontal_pull", "horizontal_pull", "isolation", "isolation"],
  },
  legs: {
    name: "Legs",
    focus: "Legs",
    region: "lower",
    slots: ["squat", "hinge", "lunge", "isolation", "core"],
  },
  intervals: {
    name: "Intervals",
    focus: "Conditioning",
    region: "full",
    conditioningStyle: "interval",
    slots: ["conditioning", "core"],
  },
  steady: {
    name: "Steady Cardio",
    focus: "Conditioning",
    region: "full",
    conditioningStyle: "steady",
    slots: ["conditioning", "mobility"],
  },
  healthA: {
    name: "Strength A",
    focus: "Strength & Mobility",
    region: "full",
    slots: ["squat", "horizontal_push", "horizontal_pull", "core", "mobility"],
  },
  healthB: {
    name: "Strength B",
    focus: "Strength & Mobility",
    region: "full",
    slots: ["hinge", "vertical_push", "lunge", "core", "mobility"],
  },
};

/** Which sessions make up a week, given how often they train and what for. */
function splitFor(days: number, goal: string, level: Level): Template[] {
  if (goal === "General health") {
    const rotation = [T.healthA, T.steady, T.healthB, T.steady, T.healthA, T.steady];
    return rotation.slice(0, days);
  }

  if (goal === "Improve endurance") {
    const rotation = [T.steady, T.intervals, T.fullA, T.steady, T.intervals, T.fullB];
    return rotation.slice(0, days);
  }

  const strength: Record<number, Template[]> = {
    2: [T.fullA, T.fullB],
    3: level === 1 ? [T.fullA, T.fullB, T.fullC] : [T.push, T.pull, T.legs],
    4: [T.upperA, T.lowerA, T.upperB, T.lowerB],
    5: [T.upperA, T.lowerA, T.push, T.pull, T.legs],
    6: [T.push, T.pull, T.legs, T.push, T.pull, T.legs],
  };
  const base = strength[days] ?? strength[3];

  // Fat loss and general fitness swap the last strength day for conditioning.
  if ((goal === "Lose fat" || goal === "Improve fitness") && days >= 3) {
    return [...base.slice(0, days - 1), T.intervals];
  }
  return base;
}

/* ------------------------------------------------------------------ *
 * Prescriptions
 * ------------------------------------------------------------------ */

type Prescription = { sets: number; repMin: number; repMax: number; restSeconds: number };

const PRESCRIPTIONS: Record<string, { compound: Prescription; isolation: Prescription }> = {
  "Get stronger": {
    compound: { sets: 4, repMin: 4, repMax: 6, restSeconds: 180 },
    isolation: { sets: 3, repMin: 8, repMax: 10, restSeconds: 90 },
  },
  "Build muscle": {
    compound: { sets: 4, repMin: 6, repMax: 10, restSeconds: 90 },
    isolation: { sets: 3, repMin: 10, repMax: 15, restSeconds: 60 },
  },
  "Lose fat": {
    compound: { sets: 3, repMin: 10, repMax: 12, restSeconds: 60 },
    isolation: { sets: 3, repMin: 12, repMax: 15, restSeconds: 45 },
  },
  "Improve fitness": {
    compound: { sets: 3, repMin: 10, repMax: 12, restSeconds: 60 },
    isolation: { sets: 2, repMin: 12, repMax: 15, restSeconds: 45 },
  },
  "Improve endurance": {
    compound: { sets: 2, repMin: 12, repMax: 15, restSeconds: 45 },
    isolation: { sets: 2, repMin: 15, repMax: 20, restSeconds: 45 },
  },
  "General health": {
    compound: { sets: 2, repMin: 10, repMax: 12, restSeconds: 75 },
    isolation: { sets: 2, repMin: 10, repMax: 12, restSeconds: 60 },
  },
};

function prescribe(exercise: ExerciseDef, goal: string): PlannedExercise {
  const table = PRESCRIPTIONS[goal] ?? PRESCRIPTIONS["Build muscle"];
  const base = exercise.compound ? table.compound : table.isolation;

  if (exercise.unit === "time") {
    const isCardio = exercise.pattern === "conditioning";
    const isMobility = exercise.pattern === "mobility";
    return {
      exerciseId: exercise.id,
      unit: "time",
      sets: isCardio ? 1 : isMobility ? 2 : 3,
      seconds: isCardio ? (goal === "Improve endurance" ? 1800 : 1200) : isMobility ? 30 : 40,
      restSeconds: isCardio ? 0 : 30,
      targetWeightKg: null,
    };
  }

  if (exercise.unit === "distance") {
    return {
      exerciseId: exercise.id,
      unit: "distance",
      sets: 1,
      seconds: goal === "Improve endurance" ? 1800 : 1200,
      restSeconds: 0,
      targetWeightKg: null,
    };
  }

  return {
    exerciseId: exercise.id,
    unit: exercise.unit,
    sets: base.sets,
    repMin: base.repMin,
    repMax: base.repMax,
    restSeconds: base.restSeconds,
    targetWeightKg: null,
  };
}

/* ------------------------------------------------------------------ *
 * Reading the user's own notes
 * ------------------------------------------------------------------ */

const BODY_PART_HINTS: Record<BodyPart, string[]> = {
  shoulder: ["shoulder", "rotator", "delt", "ac joint"],
  elbow: ["elbow", "tennis elbow", "golfer's elbow", "bicep tendon"],
  wrist: ["wrist", "carpal", "forearm"],
  spine: ["back", "spine", "lumbar", "disc", "sciatic", "sciatica"],
  hip: ["hip", "groin", "glute tear", "labrum"],
  knee: ["knee", "patella", "acl", "mcl", "meniscus"],
  ankle: ["ankle", "achilles", "calf strain", "plantar"],
  neck: ["neck", "cervical", "whiplash"],
};

/**
 * Crude keyword match over what the user typed, used only to steer exercise
 * selection away from a sore area. It is not a diagnosis and it is not a
 * substitute for reading the note â€” the coach still receives the raw text.
 */
export function parseConsiderations(text: string | null): BodyPart[] {
  if (!text?.trim()) return [];
  const lower = text.toLowerCase();
  const found: BodyPart[] = [];
  for (const [part, hints] of Object.entries(BODY_PART_HINTS) as [BodyPart, string[]][]) {
    if (hints.some((h) => lower.includes(h))) found.push(part);
  }
  return found;
}

export function experienceToLevel(experience: string | null): Level {
  if (experience === "I've trained consistently for years") return 3;
  if (experience === "I've been training a while") return 2;
  return 1;
}

/* ------------------------------------------------------------------ *
 * Selection
 * ------------------------------------------------------------------ */

type SelectionContext = {
  pool: ExerciseDef[];
  liked: Set<string>;
  level: Level;
  preferLowImpact: boolean;
  avoiding: Set<BodyPart>;
  conditioningStyle?: "steady" | "interval";
  usedThisWeek: Set<string>;
  usedThisSession: Set<string>;
};

const STEADY_IDS = new Set([
  "steady_walk", "incline_walk", "steady_run", "steady_bike", "steady_row",
  "elliptical", "swim", "stair_climb", "seated_march",
]);

export function touchesAvoided(ex: ExerciseDef, avoiding: Set<BodyPart>): boolean {
  return ex.loads.some((part) => avoiding.has(part));
}

function score(ex: ExerciseDef, slotIndex: number, ctx: SelectionContext): number {
  let s = 0;
  // A heavy penalty rather than exclusion: someone with a sore shoulder should
  // still get a back session, because removing every movement that involves the
  // joint leaves no program at all. Anything picked in spite of this is flagged.
  if (touchesAvoided(ex, ctx.avoiding)) s -= 200;
  if (ctx.conditioningStyle === "steady" && STEADY_IDS.has(ex.id)) s += 40;
  if (ctx.conditioningStyle === "interval" && !STEADY_IDS.has(ex.id)) s += 40;
  if (ctx.liked.has(ex.id)) s += 50;
  if (!ctx.usedThisWeek.has(ex.id)) s += 12;
  if (ex.compound && slotIndex < 2) s += 30;
  if (ctx.preferLowImpact && ex.lowImpact) s += 25;
  // A movement you can add weight to beats a bodyweight variation when both
  // are available: it keeps progressing long after reps stop being the limit.
  if (ex.unit === "weight_reps") s += 20;
  // Level acts as a ceiling, not a target — prefer the closest at or below.
  s -= (ctx.level - ex.level) * 6;
  return s;
}

type SlotResult =
  | { kind: "picked"; exercise: ExerciseDef }
  | { kind: "no_equipment" }
  | { kind: "all_avoided" };

function selectForSlot(
  pattern: MovementPattern,
  slotIndex: number,
  region: Region,
  ctx: SelectionContext
): SlotResult {
  // Accessory slots have to belong to the half of the body being trained,
  // or an upper day ends up prescribing calf raises.
  const regionMatters = pattern === "isolation" || pattern === "core" || pattern === "mobility";

  const candidates = ctx.pool.filter((ex) => {
    if (ex.pattern !== pattern) return false;
    if (ex.level > ctx.level) return false;
    if (ctx.usedThisSession.has(ex.id)) return false;
    if (!regionMatters || region === "full") return true;
    const exRegion = regionOf(ex);
    if (pattern === "core" || pattern === "mobility") return exRegion === "core" || exRegion === region;
    return exRegion === region;
  });

  if (candidates.length === 0) return { kind: "no_equipment" };

  // If literally everything for this pattern stresses a sore area, leave the
  // slot out. Prescribing the exact movement someone said hurts is worse than
  // a shorter session.
  const safe = candidates.filter((ex) => !touchesAvoided(ex, ctx.avoiding));
  if (safe.length === 0) return { kind: "all_avoided" };

  const best = safe.slice().sort((a, b) => {
    const diff = score(b, slotIndex, ctx) - score(a, slotIndex, ctx);
    // Stable tiebreak on id keeps the same profile producing the same plan.
    return diff !== 0 ? diff : a.id.localeCompare(b.id);
  })[0];

  return { kind: "picked", exercise: best };
}

/* ------------------------------------------------------------------ *
 * Time budgeting
 * ------------------------------------------------------------------ */

function estimateSeconds(ex: PlannedExercise): number {
  const setup = 45;
  if (ex.unit === "time" || ex.unit === "distance") {
    return setup + ex.sets * ((ex.seconds ?? 600) + ex.restSeconds);
  }
  const workPerSet = (ex.repMax ?? 10) * 3;
  return setup + ex.sets * (workPerSet + ex.restSeconds);
}

function estimateMinutes(exercises: PlannedExercise[]): number {
  return Math.round(exercises.reduce((sum, ex) => sum + estimateSeconds(ex), 0) / 60);
}

/* ------------------------------------------------------------------ *
 * Generator
 * ------------------------------------------------------------------ */

const FALLBACK_DAYS: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const PATTERN_LABELS: Record<string, string> = {
  horizontal_push: "chest pressing",
  vertical_push: "overhead pressing",
  horizontal_pull: "rowing",
  vertical_pull: "pull-ups and pulldowns",
  squat: "squatting",
  hinge: "hip hinges",
  lunge: "lunges",
  carry: "carries",
  core: "core work",
  isolation: "isolation work",
  plyometric: "jumping",
  conditioning: "cardio",
  mobility: "mobility work",
};

function describePattern(pattern: MovementPattern): string {
  return PATTERN_LABELS[pattern] ?? pattern;
}

export function generatePlan(profile: GeneratorProfile): Plan {
  const goal = profile.goal ?? "Build muscle";
  const level = experienceToLevel(profile.experience);
  const days = profile.days ?? 3;
  const sessionMinutes = profile.length ?? 45;
  const avoiding = parseConsiderations(profile.considerations);
  const notes: string[] = [];

  const equipment = profile.equipment as Equipment[];
  const disliked = new Set(profile.dislikedExercises);
  const pool = availableExercises(equipment).filter((ex) => !disliked.has(ex.id));
  const avoidingSet = new Set(avoiding);

  const preferLowImpact = goal === "General health" || (profile.age ?? 0) >= 60;

  const templates = splitFor(days, goal, level);
  const weekdays =
    profile.trainingDays.length === templates.length
      ? profile.trainingDays
      : FALLBACK_DAYS.slice(0, templates.length);

  const usedThisWeek = new Set<string>();
  const sessions: PlannedSession[] = [];
  const missingEquipmentFor = new Set<MovementPattern>();
  const droppedForInjury = new Set<MovementPattern>();

  templates.forEach((template, i) => {
    const usedThisSession = new Set<string>();
    const ctx: SelectionContext = {
      pool,
      liked: new Set(profile.likedExercises),
      level,
      preferLowImpact,
      avoiding: avoidingSet,
      conditioningStyle: template.conditioningStyle,
      usedThisWeek,
      usedThisSession,
    };

    const chosen: PlannedExercise[] = [];

    for (const [slotIndex, pattern] of template.slots.entries()) {
      const result = selectForSlot(pattern, slotIndex, template.region, ctx);
      if (result.kind === "no_equipment") {
        missingEquipmentFor.add(pattern);
        continue;
      }
      if (result.kind === "all_avoided") {
        droppedForInjury.add(pattern);
        continue;
      }
      usedThisSession.add(result.exercise.id);
      usedThisWeek.add(result.exercise.id);
      chosen.push(prescribe(result.exercise, goal));
    }

    // Trim from the back until the session fits the time they told us they have.
    while (chosen.length > 2 && estimateMinutes(chosen) > sessionMinutes) {
      chosen.pop();
    }

    sessions.push({
      id: `${template.name.toLowerCase().replace(/\s+/g, "-")}-${i}`,
      name: template.name,
      focus: template.focus,
      weekday: weekdays[i] ?? FALLBACK_DAYS[i],
      estMinutes: estimateMinutes(chosen),
      exercises: chosen,
    });
  });

  if (avoiding.length > 0) {
    const unavoidable = sessions
      .flatMap((s) => s.exercises)
      .map((e) => EXERCISES_BY_ID[e.exerciseId])
      .filter((def): def is ExerciseDef => !!def && touchesAvoided(def, avoidingSet));

    notes.push(`Steering away from anything that loads: ${avoiding.join(", ")}.`);

    if (droppedForInjury.size > 0) {
      notes.push(
        `Left out entirely: ${[...droppedForInjury].map(describePattern).join(", ")} — every option there would have loaded a sore area.`
      );
    }

    if (unavoidable.length > 0) {
      const names = [...new Set(unavoidable.map((d) => d.name))];
      notes.push(
        `${names.join(", ")} ${names.length === 1 ? "does" : "do"} involve that area but ${
          names.length === 1 ? "is" : "are"
        } usually well tolerated. Swap or skip if anything hurts.`
      );
    }
  }

  if (missingEquipmentFor.size > 0) {
    notes.push(
      `Your equipment doesn't cover ${[...missingEquipmentFor].map(describePattern).join(", ")}, so those slots were skipped.`
    );
  }

  if (profile.trainingDays.length > 0 && profile.trainingDays.length !== templates.length) {
    notes.push(
      `You picked ${profile.trainingDays.length} days but train ${days} times a week â€” sessions were spread evenly instead.`
    );
  }

  return {
    createdAt: new Date().toISOString(),
    goal,
    level,
    weeks: 8,
    daysPerWeek: days,
    sessions,
    avoiding,
    notes,
  };
}

/** Convenience for screens that need the exercise definition alongside the plan. */
export function definitionFor(planned: PlannedExercise): ExerciseDef | undefined {
  return EXERCISES_BY_ID[planned.exerciseId];
}
