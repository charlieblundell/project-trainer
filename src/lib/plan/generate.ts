import {
  EXERCISES_BY_ID,
  availableExercises,
  type BodyPart,
  type Equipment,
  type ExerciseDef,
  type Level,
  type MovementPattern,
} from "@/lib/exercises";
import type { OnboardingData, Weekday } from "@/lib/types";
import type {
  Caution,
  GeneratorProfile,
  NotesReading,
  Plan,
  PlannedExercise,
  PlannedSession,
  Region,
} from "./types";
import {
  MUSCLE_GROUPS,
  isLowPriority,
  primaryGroup,
  setsByGroup,
  weeklyTarget,
  type MuscleGroup,
} from "./volume";

/* ------------------------------------------------------------------ *
 * Session templates
 *
 * A template is an ordered list of movement patterns. Order is priority:
 * the biggest movements sit at the front, and when someone's session is
 * short we trim from the back rather than dropping a main lift.
 * ------------------------------------------------------------------ */

type Template = {
  name: string;
  focus: string;
  region: Region;
  slots: MovementPattern[];
  /**
   * The muscles this session is responsible for. A muscle trained by one
   * session a week (Push/Pull/Legs) has to get its whole weekly volume there;
   * one trained by three (full body) gets a third of it each time.
   */
  trains: MuscleGroup[];
  /** Keeps a "Steady Cardio" day from prescribing intervals, and vice versa. */
  conditioningStyle?: "steady" | "interval";
};

const LOWER_MUSCLES = new Set([
  "quads", "glutes", "hamstrings", "calves", "hip flexors", "hips", "ankles", "shins",
]);
const CORE_MUSCLES = new Set(["core", "obliques", "lower back", "spine", "thoracic spine"]);

/** Which half of the body a movement belongs to, read from its primary muscle. */
export function regionOf(ex: ExerciseDef): Region {
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
    trains: MUSCLE_GROUPS,
    slots: ["squat", "horizontal_push", "horizontal_pull", "hinge", "core", "isolation"],
  },
  fullB: {
    name: "Full Body B",
    focus: "Full Body",
    region: "full",
    trains: MUSCLE_GROUPS,
    slots: ["hinge", "vertical_push", "vertical_pull", "lunge", "core", "isolation"],
  },
  fullC: {
    name: "Full Body C",
    focus: "Full Body",
    region: "full",
    trains: MUSCLE_GROUPS,
    slots: ["squat", "horizontal_push", "horizontal_pull", "isolation", "core", "isolation"],
  },
  upperA: {
    name: "Upper A",
    focus: "Upper Body",
    region: "upper",
    trains: ["chest", "back", "shoulders", "biceps", "triceps"],
    slots: ["horizontal_push", "vertical_pull", "vertical_push", "horizontal_pull", "isolation", "isolation"],
  },
  upperB: {
    name: "Upper B",
    focus: "Upper Body",
    region: "upper",
    trains: ["chest", "back", "shoulders", "biceps", "triceps"],
    slots: ["vertical_push", "horizontal_pull", "horizontal_push", "vertical_pull", "isolation", "isolation"],
  },
  lowerA: {
    name: "Lower A",
    focus: "Lower Body",
    region: "lower",
    trains: ["quads", "hamstrings", "glutes", "calves"],
    slots: ["squat", "hinge", "lunge", "isolation", "core"],
  },
  lowerB: {
    name: "Lower B",
    focus: "Lower Body",
    region: "lower",
    trains: ["quads", "hamstrings", "glutes", "calves"],
    slots: ["hinge", "squat", "lunge", "isolation", "core"],
  },
  push: {
    name: "Push",
    focus: "Chest, Shoulders & Triceps",
    region: "upper",
    trains: ["chest", "shoulders", "triceps"],
    slots: ["horizontal_push", "vertical_push", "horizontal_push", "isolation", "isolation"],
  },
  pull: {
    name: "Pull",
    focus: "Back & Biceps",
    region: "upper",
    trains: ["back", "biceps"],
    slots: ["vertical_pull", "horizontal_pull", "horizontal_pull", "isolation", "isolation"],
  },
  legs: {
    name: "Legs",
    focus: "Legs",
    region: "lower",
    trains: ["quads", "hamstrings", "glutes", "calves"],
    slots: ["squat", "hinge", "lunge", "isolation", "core"],
  },
  intervals: {
    name: "Intervals",
    focus: "Conditioning",
    region: "full",
    trains: [],
    conditioningStyle: "interval",
    slots: ["conditioning", "core"],
  },
  steady: {
    name: "Steady Cardio",
    focus: "Conditioning",
    region: "full",
    trains: [],
    conditioningStyle: "steady",
    slots: ["conditioning", "mobility"],
  },
  healthA: {
    name: "Strength A",
    focus: "Strength & Mobility",
    region: "full",
    trains: MUSCLE_GROUPS,
    slots: ["squat", "horizontal_push", "horizontal_pull", "core", "mobility"],
  },
  healthB: {
    name: "Strength B",
    focus: "Strength & Mobility",
    region: "full",
    trains: MUSCLE_GROUPS,
    slots: ["hinge", "vertical_push", "lunge", "core", "mobility"],
  },
};

/** Which sessions make up a week, given how often they train and what for. */
function splitFor(days: number, goal: string, level: Level): Template[] {
  if (goal === "General health") {
    // Strength on at least two days a week is the guideline for every adult,
    // so two days means two strength sessions, not one and a walk.
    if (days <= 2) return [T.healthA, T.healthB].slice(0, Math.max(days, 1));
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
  /*
   * Fat loss and general fitness used to swap the last strength day for
   * conditioning — and in Push/Pull/Legs the last day is Legs, so those plans
   * had no leg training at all. The app's own evidence is that resistance
   * training is what protects muscle in a deficit. The lifting stays whole;
   * conditioning is added as a finisher instead (see FINISHER_GOALS).
   */
  return strength[days] ?? strength[3];
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
  /*
   * Two minutes on main lifts: the library's rest finding is that rushing the
   * rest on a heavy compound costs reps on the next set, and those reps are
   * the training. Isolation work stays short, where systemic fatigue isn't
   * what limits the set.
   */
  "Build muscle": {
    compound: { sets: 4, repMin: 6, repMax: 10, restSeconds: 120 },
    isolation: { sets: 3, repMin: 10, repMax: 15, restSeconds: 60 },
  },
  /*
   * The same as building muscle, on purpose. High reps and short rest "for
   * fat loss" is exactly the myth the evidence library argues against: keeping
   * the heavy work is what holds on to muscle while eating less.
   */
  "Lose fat": {
    compound: { sets: 4, repMin: 6, repMax: 10, restSeconds: 120 },
    isolation: { sets: 3, repMin: 10, repMax: 15, restSeconds: 60 },
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

/** The sets, reps and rest a movement gets for a goal. Shared with the plan editor. */
export function prescribe(exercise: ExerciseDef, goal: string): PlannedExercise {
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

/*
 * Words that change the whole plan rather than one joint. Matched on word
 * boundaries so "fallen behind at work" doesn't read as a fall risk but
 * "I've had a couple of falls" does.
 */
const CAUTION_HINTS: Record<Caution, RegExp> = {
  balance: /\b(balance|unsteady|wobbly|dizz\w*|vertigo|falls?|fell|falling)\b/,
  bone: /\b(osteopor\w*|osteopenia|bone density|brittle bones?|fragile bones?)\b/,
};

/** Balance, bones: the cautions someone's own notes mention. */
export function parseCautions(text: string | null): Caution[] {
  if (!text?.trim()) return [];
  const lower = text.toLowerCase();
  return (Object.keys(CAUTION_HINTS) as Caution[]).filter((c) => CAUTION_HINTS[c].test(lower));
}

/**
 * The age from which balance work is part of every week. WHO's guideline for
 * older adults asks for balance and strength on three or more days a week,
 * to prevent falls.
 */
export const OLDER_ADULT_AGE = 65;

/** What a plan has to allow for: their notes, the coach's reading of them, and their age. */
export function readNotes(profile: GeneratorProfile): NotesReading {
  const avoiding = new Set(parseConsiderations(profile.considerations));
  const cautions = new Set(parseCautions(profile.considerations));
  for (const part of profile.notesReading?.avoiding ?? []) avoiding.add(part);
  for (const caution of profile.notesReading?.cautions ?? []) cautions.add(caution);
  if ((profile.age ?? 0) >= OLDER_ADULT_AGE) cautions.add("balance");
  return {
    avoiding: [...avoiding],
    cautions: (["balance", "bone"] as const).filter((c) => cautions.has(c)),
  };
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
  /**
   * Movements from the plan being rebuilt. Preferred wherever they still fit,
   * and allowed above the experience ceiling, since progression may have moved
   * someone up to a harder variation they've earned.
   */
  keep: Set<string>;
  /**
   * Sets each muscle is still short of this session's share of its weekly
   * target. A slot prefers movements that close the biggest gap, which is what
   * turns a Legs day's hinge slot into Romanian deadlifts when hamstrings have
   * nothing and glutes already have some.
   */
  needs: Map<MuscleGroup, number>;
};

const STEADY_IDS = new Set([
  "steady_walk", "incline_walk", "steady_run", "steady_bike", "steady_row",
  "elliptical", "swim", "stair_climb", "seated_march",
]);

/**
 * Core work that curls or twists the spine under load. Left out for anyone
 * whose notes mention their bones: it's the standard precaution with
 * osteoporosis, and planks, bird dogs and Pallof presses train the same
 * muscles without it. A judgement call, labelled as one on the Why screen.
 */
export const SPINE_FLEXION_IDS = new Set([
  "cable_crunch",
  "bicycle_crunch",
  "seated_torso_twist",
  "hanging_knee_raise",
  "hanging_leg_raise",
]);

/** Different movements in one session for anyone with a caution, before spare time goes into sets. */
const MAX_MOVEMENTS_WHEN_NEW = 7;

/** Balance exercises, added to every session for anyone with a caution. */
export const BALANCE_IDS = new Set(["standing_balance", "tandem_stance"]);

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
  const group = primaryGroup(ex);
  const shortBy = group ? ctx.needs.get(group) ?? 0 : 0;
  if (shortBy > 0) {
    // A low-priority muscle gets a nudge, not the full pull: a Legs day that's
    // short on hamstrings should reach for leg curls before calf raises.
    const weight = group && isLowPriority(group) ? 0.35 : 1;
    s += (18 + Math.min(shortBy, 10) * 2) * weight;
  }
  // (c) Main lifts for someone past their first months are the ones that load
  // heaviest and progress longest, which is a barbell. Without this a
  // kettlebell swing could win a trained lifter's hinge slot on an alphabetical
  // tiebreak.
  if (slotIndex < 2 && ctx.level >= 2 && ex.compound && ex.equipment.includes("barbell")) s += 15;
  if (ctx.keep.has(ex.id)) s += 45;
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
  ctx: SelectionContext,
  trains: MuscleGroup[] = []
): SlotResult {
  // Accessory slots have to belong to the half of the body being trained,
  // or an upper day ends up prescribing calf raises.
  const regionMatters = pattern === "isolation" || pattern === "core" || pattern === "mobility";

  const candidates = ctx.pool.filter((ex) => {
    if (ex.pattern !== pattern) return false;
    // Balance work is added on its own terms (see BALANCE_IDS), not as core work.
    if (BALANCE_IDS.has(ex.id)) return false;
    if (ex.level > ctx.level && !ctx.keep.has(ex.id)) return false;
    if (ctx.usedThisSession.has(ex.id)) return false;
    // "Upper" isn't specific enough for a split: curls are upper body, and they
    // don't belong on a Push day. An accessory whose main muscle the session
    // isn't responsible for goes elsewhere in the week.
    if (regionMatters && trains.length > 0) {
      const group = primaryGroup(ex);
      if (group && !trains.includes(group)) return false;
    }
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

export function estimateMinutes(exercises: PlannedExercise[]): number {
  return Math.round(exercises.reduce((sum, ex) => sum + estimateSeconds(ex), 0) / 60);
}

/* ------------------------------------------------------------------ *
 * Generator
 * ------------------------------------------------------------------ */

/** Goals where conditioning is added on top of the lifting, never in place of it. */
const FINISHER_GOALS = new Set(["Lose fat", "Improve fitness"]);

/**
 * A short conditioning block to end a lifting session with. Within their
 * experience, like everything else: a beginner's plan once ended every
 * session with ten minutes of skipping. With a balance or bone caution it's
 * low-impact only, and a steady walk or bike counts, since nobody unsteady on
 * their feet should be finishing with jumps.
 */
function pickFinisher(
  pool: ExerciseDef[],
  avoiding: Set<BodyPart>,
  used: Set<string>,
  level: Level,
  gentle: boolean
): ExerciseDef | undefined {
  const within = pool.filter(
    (ex) =>
      ex.pattern === "conditioning" &&
      (!gentle || !!ex.lowImpact) &&
      ex.level <= level &&
      !used.has(ex.id) &&
      !touchesAvoided(ex, avoiding)
  );
  // Intervals where they're within reach; otherwise a steady effort, which
  // every interval option in the library is harder than.
  const intervals = within.filter((ex) => !STEADY_IDS.has(ex.id));
  return (
    (intervals.length > 0 ? intervals : within)
      // Gentlest first: this ends a lifting session, it doesn't replace one.
      .sort(
        (a, b) =>
          Number(!!b.lowImpact) - Number(!!a.lowImpact) || a.level - b.level || a.id.localeCompare(b.id)
      )[0]
  );
}

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

/** Everything they can actually do: owned equipment, minus what they ruled out. */
function poolFor(profile: GeneratorProfile): ExerciseDef[] {
  const disliked = new Set(profile.dislikedExercises);
  return availableExercises(profile.equipment as Equipment[]).filter((ex) => !disliked.has(ex.id));
}

/** The generator only needs the training half of what onboarding collected. */
export function profileFromOnboarding(o: OnboardingData): GeneratorProfile {
  return {
    goal: o.goal,
    experience: o.experience,
    days: o.days,
    length: o.length,
    equipment: o.equipment,
    likedExercises: o.likedExercises,
    dislikedExercises: o.dislikedExercises,
    trainingDays: o.trainingDays,
    considerations: o.considerations,
    age: o.age,
  };
}

export function generatePlan(profile: GeneratorProfile, options: { keep?: Iterable<string> } = {}): Plan {
  const keep = new Set(options.keep ?? []);
  const goal = profile.goal ?? "Build muscle";
  const level = experienceToLevel(profile.experience);
  const days = profile.days ?? 3;
  let sessionMinutes = profile.length ?? 45;
  const { avoiding, cautions } = readNotes(profile);
  // Balance or bones: no jumping, gentle finishers, balance work every session.
  const gentle = cautions.length > 0;
  /*
   * How many different movements a session can hold before spare time goes
   * into more sets instead, for anyone the plan is careful with. A 70-year-old
   * beginner was being handed twelve exercises a session at two sets each:
   * twelve things to learn, and a session that's mostly walking between
   * machines. It only limits the top-up toward the upper end of each range:
   * reaching every muscle's minimum still adds whatever movement it takes, or
   * arms would go untrained for want of a curl. Balance work comes on top.
   *
   * Not for every beginner: a younger one uses the spare time on more work,
   * which the cap would leave unspent.
   */
  const capWhenNew = gentle ? MAX_MOVEMENTS_WHEN_NEW : Infinity;
  let maxMovements = Infinity;
  const notes: string[] = [];

  const pool = poolFor(profile).filter((ex) => !cautions.includes("bone") || !SPINE_FLEXION_IDS.has(ex.id));
  const avoidingSet = new Set(avoiding);

  const preferLowImpact = goal === "General health" || (profile.age ?? 0) >= 60 || gentle;

  const templates = splitFor(days, goal, level);
  const weekdays =
    profile.trainingDays.length === templates.length
      ? profile.trainingDays
      : FALLBACK_DAYS.slice(0, templates.length);

  const usedThisWeek = new Set<string>();
  const sessions: PlannedSession[] = [];
  const missingEquipmentFor = new Set<MovementPattern>();
  const droppedForInjury = new Set<MovementPattern>();

  /*
   * How many sessions in the week train each muscle, so each session carries
   * its share of that muscle's weekly target rather than all of it or none.
   * Push/Pull/Legs puts a muscle's whole week on one day; full body splits it
   * three ways.
   */
  const sessionsTraining = Object.fromEntries(
    MUSCLE_GROUPS.map((g) => [g, templates.filter((t) => t.trains.includes(g)).length])
  ) as Record<MuscleGroup, number>;

  const shareOf = (group: MuscleGroup, bound: "min" | "max"): number => {
    const count = sessionsTraining[group];
    return count ? Math.ceil(weeklyTarget(goal, level, group)[bound] / count) : 0;
  };

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
      keep,
      needs: new Map(),
    };

    const chosen: PlannedExercise[] = [];

    /** What each of this session's muscles is still short of, against a bound. */
    const shortfall = (bound: "min" | "max") => {
      const have = setsByGroup(chosen);
      const gaps = new Map<MuscleGroup, number>();
      for (const group of template.trains) {
        const gap = shareOf(group, bound) - have[group];
        if (gap > 0) gaps.set(group, gap);
      }
      return gaps;
    };

    const take = (exercise: ExerciseDef, planned: PlannedExercise) => {
      usedThisSession.add(exercise.id);
      usedThisWeek.add(exercise.id);
      chosen.push(planned);
    };

    // 1. The template's own slots: main lifts first, in priority order.
    for (const [slotIndex, pattern] of template.slots.entries()) {
      ctx.needs = shortfall("min");
      const result = selectForSlot(pattern, slotIndex, template.region, ctx, template.trains);
      if (result.kind === "no_equipment") {
        missingEquipmentFor.add(pattern);
        continue;
      }
      if (result.kind === "all_avoided") {
        droppedForInjury.add(pattern);
        continue;
      }
      take(result.exercise, prescribe(result.exercise, goal));
    }

    /**
     * Closes the biggest gap it can within the time they have: a new movement
     * for that muscle if one fits, otherwise another set of one already here.
     * Returns false when that muscle can't be helped in the time left.
     */
    const addFor = (group: MuscleGroup): boolean => {
      const fits = (next: PlannedExercise[]) => estimateMinutes(next) <= sessionMinutes;

      const candidates = pool
        .filter(
          (ex) =>
            primaryGroup(ex) === group &&
            ex.unit !== "time" &&
            ex.unit !== "distance" &&
            ex.pattern !== "mobility" &&
            !usedThisSession.has(ex.id) &&
            (ex.level <= level || keep.has(ex.id)) &&
            !touchesAvoided(ex, avoidingSet)
        )
        // Filling is accessory work, so isolation movements come first: a second
        // heavy compound late in a session is more fatigue than it's worth.
        .sort(
          (a, b) =>
            Number(b.pattern === "isolation") - Number(a.pattern === "isolation") ||
            score(b, chosen.length, ctx) - score(a, chosen.length, ctx) ||
            a.id.localeCompare(b.id)
        );

      const forGroup = chosen.filter((planned) => {
        const def = EXERCISES_BY_ID[planned.exerciseId];
        return def && def.pattern !== "mobility" && primaryGroup(def) === group;
      });
      const compoundsFor = forGroup.filter((planned) => EXERCISES_BY_ID[planned.exerciseId]?.compound).length;

      /*
       * A movement with a harder version this person can already do is a
       * stepping stone, not an accessory: scapular pull-ups are how you get to
       * a pull-up, not something to add after a trained lifter's rows.
       */
      const owned = new Set<string>([...profile.equipment, "bodyweight"]);
      const isRegression = (ex: ExerciseDef) => {
        const harder = ex.harder ? EXERCISES_BY_ID[ex.harder] : undefined;
        return !!harder && harder.level <= level && harder.equipment.every((kit) => owned.has(kit));
      };

      for (const exercise of candidates) {
        if (chosen.length >= maxMovements) break;
        // Two heavy presses for chest is a session; a fourth "to fill time" is
        // fatigue dressed up as volume. Extra sets on what's there do it better.
        if (exercise.compound && compoundsFor >= 2) continue;
        // Two movements for one muscle gives it variety; a third is the same
        // stimulus again. Past two, the next step is another set, below.
        if (forGroup.length >= 2) break;
        if (isRegression(exercise)) continue;
        const planned = prescribe(exercise, goal);
        if (fits([...chosen, planned])) {
          take(exercise, planned);
          return true;
        }
      }

      // Nothing new fits: one more set of something already training it.
      const MAX_SETS = 5;
      for (let at = chosen.length - 1; at >= 0; at -= 1) {
        const planned = chosen[at];
        const def = EXERCISES_BY_ID[planned.exerciseId];
        // A drill isn't training the muscle, so more of it doesn't close the gap.
        if (!def || def.pattern === "mobility" || primaryGroup(def) !== group || planned.sets >= MAX_SETS) continue;
        const trial = chosen.map((e, j) => (j === at ? { ...e, sets: e.sets + 1 } : e));
        if (fits(trial)) {
          chosen[at] = trial[at];
          return true;
        }
      }
      return false;
    };

    const fillToward = (bound: "min" | "max") => {
      const stuck = new Set<MuscleGroup>();
      for (let guard = 0; guard < 40; guard += 1) {
        ctx.needs = shortfall(bound);
        const next = [...ctx.needs.entries()]
          .filter(([group]) => !stuck.has(group))
          // Biggest gap first, but calves wait until everything else is served.
          .sort(
            ([a, gapA], [b, gapB]) =>
              Number(isLowPriority(a)) - Number(isLowPriority(b)) || gapB - gapA
          )[0];
        if (!next) return;
        if (!addFor(next[0])) stuck.add(next[0]);
      }
    };

    // Over time: a finisher is the extra, so it goes first; then accessory sets
    // come down to two; then accessories go. The first two slots, the main
    // lifts, are never touched.
    const PROTECTED = 2;
    const trimTo = (budget: number, keepFinisher: boolean) => {
      for (
        let guard = 0;
        guard < 60 && estimateMinutes(chosen) > budget && chosen.length > PROTECTED;
        guard += 1
      ) {
        const timed = chosen.findIndex(
          (e, j) => j >= PROTECTED && (e.unit === "time" || e.unit === "distance")
        );
        if (timed >= 0 && template.trains.length > 0 && !keepFinisher) {
          chosen.splice(timed, 1);
          continue;
        }
        const reducible = chosen
          .map((e, j) => ({ e, j }))
          .filter(({ e, j }) => j >= PROTECTED && e.sets > 2 && e.unit !== "time" && e.unit !== "distance")
          .pop();
        if (reducible) {
          chosen[reducible.j] = { ...reducible.e, sets: reducible.e.sets - 1 };
          continue;
        }
        const lastLift = chosen.map((e, j) => ({ e, j })).filter(({ e, j }) => j >= PROTECTED && e.unit !== "time" && e.unit !== "distance").pop();
        if (!lastLift) break;
        chosen.splice(lastLift.j, 1);
      }
    };

    // 2. Reach every muscle's minimum, in the time available. A goal that wants
    //    conditioning has that time held back first, or the lifting would use
    //    every minute and the conditioning would never happen.
    const FINISHER_MINUTES = 10;
    const wantsFinisher =
      FINISHER_GOALS.has(goal) && template.trains.length > 0 && sessionMinutes >= 30;
    const fullBudget = sessionMinutes;
    if (wantsFinisher) sessionMinutes = fullBudget - FINISHER_MINUTES;
    if (template.trains.length > 0) fillToward("min");
    sessionMinutes = fullBudget;

    // 3. Conditioning for the goals that want it. The main lifts can fill a
    //    session on their own, so the lifting is trimmed to leave the room;
    //    otherwise "plus conditioning" would only ever happen on long sessions.
    if (wantsFinisher) trimTo(fullBudget - FINISHER_MINUTES, false);
    if (FINISHER_GOALS.has(goal) && template.trains.length > 0) {
      const spare = sessionMinutes - estimateMinutes(chosen);
      const finisher =
        wantsFinisher && spare >= 8 ? pickFinisher(pool, avoidingSet, usedThisSession, level, gentle) : undefined;
      if (finisher) {
        take(finisher, {
          ...prescribe(finisher, goal),
          sets: 1,
          seconds: Math.max(6, Math.min(15, spare - 2)) * 60,
          restSeconds: 0,
        });
      }
    }

    // 4. Time left over goes toward the top of each muscle's range.
    maxMovements = capWhenNew;
    if (template.trains.length > 0) fillToward("max");
    maxMovements = Infinity;

    trimTo(sessionMinutes, wantsFinisher);

    /*
     * Calves come last in every queue, which on a full hour meant they came
     * nowhere: a trained lifter's Legs day had none at all. People notice
     * when they're missing, and a few sets cost little, so they get a small
     * floor even if it takes a set from another accessory to make the room.
     */
    const CALF_FLOOR_WEEKLY = 3;
    if (template.trains.includes("calves") && sessionsTraining.calves > 0) {
      const floor = Math.ceil(CALF_FLOOR_WEEKLY / sessionsTraining.calves);
      const have = setsByGroup(chosen).calves;
      if (have < floor) {
        const calf = pool
          .filter(
            (ex) =>
              primaryGroup(ex) === "calves" &&
              ex.unit !== "time" &&
              ex.unit !== "distance" &&
              !usedThisSession.has(ex.id) &&
              ex.level <= level &&
              !touchesAvoided(ex, avoidingSet)
          )
          .sort((a, b) => score(b, chosen.length, ctx) - score(a, chosen.length, ctx) || a.id.localeCompare(b.id))[0];

        if (calf) {
          const planned = { ...prescribe(calf, goal), sets: Math.max(2, Math.min(3, floor - have)) };
          // Make room from the accessory carrying the most sets, never a main lift.
          for (let guard = 0; guard < 12 && estimateMinutes([...chosen, planned]) > sessionMinutes; guard += 1) {
            const donor = chosen
              .map((e, j) => ({ e, j }))
              .filter(({ e, j }) => j >= PROTECTED && e.sets > 2 && e.unit !== "time" && e.unit !== "distance")
              .sort((a, b) => b.e.sets - a.e.sets)[0];
            if (!donor) {
              // Nothing left to take a set from: a conditioning finisher can give
              // up a couple of minutes, down to six, rather than calves going to zero.
              const finisherAt = chosen.findIndex((e) => e.unit === "time" && (e.seconds ?? 0) > 360);
              if (finisherAt < 0) break;
              const f = chosen[finisherAt];
              chosen[finisherAt] = { ...f, seconds: Math.max(360, (f.seconds ?? 0) - 120) };
              continue;
            }
            chosen[donor.j] = { ...donor.e, sets: donor.e.sets - 1 };
          }
          if (estimateMinutes([...chosen, planned]) <= sessionMinutes) {
            // Before any conditioning finisher: that ends the session, calf raises don't.
            usedThisSession.add(calf.id);
            usedThisWeek.add(calf.id);
            const finisherAt = chosen.findIndex((e) => e.unit === "time" || e.unit === "distance");
            if (finisherAt >= PROTECTED) chosen.splice(finisherAt, 0, planned);
            else chosen.push(planned);
          }
        }
      }
    }

    /*
     * Balance work in every session for anyone with a balance or bone caution,
     * which includes everyone 65 and over: in older adults, balance and
     * functional exercise cut the rate of falls by about a quarter. It's short,
     * and it goes straight after the main lifts, while they're fresh, rather
     * than at the end when their legs are tired.
     */
    if (gentle && !chosen.some((e) => BALANCE_IDS.has(e.exerciseId))) {
      const balance = pool
        .filter((ex) => BALANCE_IDS.has(ex.id) && !touchesAvoided(ex, avoidingSet))
        .sort((a, b) => a.id.localeCompare(b.id))[0];
      if (balance) {
        const planned: PlannedExercise = {
          ...prescribe(balance, goal),
          sets: 2,
          seconds: 30,
          restSeconds: 30,
        };
        // Room comes from accessory sets first, then a finisher's minutes.
        for (let guard = 0; guard < 12 && estimateMinutes([...chosen, planned]) > sessionMinutes; guard += 1) {
          const donor = chosen
            .map((e, j) => ({ e, j }))
            .filter(({ e, j }) => j >= PROTECTED && e.sets > 2 && e.unit !== "time" && e.unit !== "distance")
            .sort((a, b) => b.e.sets - a.e.sets)[0];
          if (donor) {
            chosen[donor.j] = { ...donor.e, sets: donor.e.sets - 1 };
            continue;
          }
          const timed = chosen.findIndex(
            (e) => (e.unit === "time" || e.unit === "distance") && (e.seconds ?? 0) > 360
          );
          if (timed < 0) break;
          const t = chosen[timed];
          chosen[timed] = { ...t, seconds: Math.max(360, (t.seconds ?? 0) - 120) };
        }
        usedThisSession.add(balance.id);
        usedThisWeek.add(balance.id);
        // A couple of minutes over beats leaving it out: it's the point of the caution.
        chosen.splice(Math.min(PROTECTED, chosen.length), 0, planned);
      }
    }

    sessions.push({
      id: `${template.name.toLowerCase().replace(/\s+/g, "-")}-${i}`,
      name: template.name,
      focus: template.focus,
      weekday: weekdays[i] ?? FALLBACK_DAYS[i],
      estMinutes: estimateMinutes(chosen),
      region: template.region,
      exercises: chosen,
    });
  });

  // Say so when the time they gave can't hold the week's volume, rather than
  // quietly handing them less than the plan is meant to deliver.
  const weekly = setsByGroup(sessions.flatMap((s) => s.exercises));
  const shortOf = MUSCLE_GROUPS.filter(
    (g) => sessionsTraining[g] > 0 && !isLowPriority(g) && weekly[g] < weeklyTarget(goal, level, g).min
  );
  if (shortOf.length > 0) {
    notes.push(
      `Your sessions don't have room for the full weekly volume on ${shortOf.join(", ")}. Longer sessions or another training day would close the gap.`
    );
  }

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

  if (gentle) {
    const fromNotes = new Set([
      ...parseCautions(profile.considerations),
      ...(profile.notesReading?.cautions ?? []),
    ]);
    const why = cautions.includes("bone")
      ? "Because of what you said about your bones"
      : fromNotes.has("balance")
        ? "Because of what you said about your balance"
        : "From 65, balance matters as much as strength, so";
    notes.push(
      `${why}${why.endsWith("so") ? "" : ","} every session has a short balance exercise and nothing involves jumping. Keep a counter or chair within reach for it.`
    );
  }
  if (cautions.includes("bone")) {
    notes.push("Lifting is good for bone, but check with your doctor before loading heavily, and build the weights up slowly.");
    notes.push("Nothing in your plan curls or twists your spine under load, like crunches, so your core work is planks and holds instead.");
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
    daysPerWeek: days,
    refreshes: 0,
    retired: [],
    sessions,
    avoiding,
    cautions,
    ...(profile.notesReading ? { notesReading: profile.notesReading } : {}),
    notes,
  };
}

/* ------------------------------------------------------------------ *
 * Refreshing an ongoing plan
 * ------------------------------------------------------------------ */

const ACCESSORY_PATTERNS = new Set<MovementPattern>(["isolation", "core", "mobility"]);

/** How many swapped-out movements to remember before they can come back around. */
const RETIRED_MEMORY = 24;

export type Refresh = { plan: Plan; swapped: { from: string; to: string }[] };

/**
 * Re-picks the accessory work and leaves the main lifts alone.
 *
 * The plan has no end date, so the thing that eventually kills it isn't the
 * calendar running out — it's boredom. Compounds are where the weight climbs,
 * and swapping those throws away every calibrated target, so they stay. The
 * isolation, core and mobility slots are where variety is free.
 */
export function refreshAccessories(plan: Plan, profile: GeneratorProfile): Refresh {
  const cautions = plan.cautions ?? readNotes(profile).cautions;
  const pool = poolFor(profile).filter((ex) => !cautions.includes("bone") || !SPINE_FLEXION_IDS.has(ex.id));
  const level = experienceToLevel(profile.experience);
  const liked = new Set(profile.likedExercises);
  const avoiding = new Set(plan.avoiding);
  const preferLowImpact = plan.goal === "General health" || (profile.age ?? 0) >= 60;
  const swapped: { from: string; to: string }[] = [];
  const justRetired: string[] = [];

  // Seeded with everything the plan already uses, so Thursday's refresh doesn't
  // hand back a movement that's already sitting in Tuesday's session.
  const usedThisWeek = new Set<string>();
  for (const session of plan.sessions) {
    for (const ex of session.exercises) usedThisWeek.add(ex.exerciseId);
  }

  const sessions = plan.sessions.map((session) => {
    // Includes the exercise being replaced, which is what forces a new pick.
    const usedThisSession = new Set(session.exercises.map((e) => e.exerciseId));

    const exercises = session.exercises.map((planned, slotIndex) => {
      const def = EXERCISES_BY_ID[planned.exerciseId];
      // Balance work is there for a reason, not for variety: a refresh would turn it into crunches.
      if (!def || !ACCESSORY_PATTERNS.has(def.pattern) || BALANCE_IDS.has(def.id)) return planned;

      const base = {
        pool,
        liked,
        level,
        preferLowImpact,
        avoiding,
        usedThisWeek,
        keep: new Set<string>(),
        // A refresh swaps one accessory for another in the same slot, so the
        // week's volume doesn't move and there's nothing to steer toward.
        needs: new Map<MuscleGroup, number>(),
      };

      // Two passes: first ruling out what's been retired recently, then, if
      // that leaves nothing, settling for anything but what's there now. A
      // narrow category shouldn't mean the button quietly does nothing.
      let result = selectForSlot(def.pattern, slotIndex, session.region, {
        ...base,
        usedThisSession: new Set([...usedThisSession, ...plan.retired]),
      });
      if (result.kind !== "picked") {
        result = selectForSlot(def.pattern, slotIndex, session.region, {
          ...base,
          usedThisSession,
        });
      }

      // Nothing else fits the slot — the same movement beats an empty one.
      if (result.kind !== "picked") return planned;

      usedThisSession.add(result.exercise.id);
      usedThisWeek.add(result.exercise.id);
      justRetired.push(def.id);
      swapped.push({ from: def.name, to: result.exercise.name });
      return prescribe(result.exercise, plan.goal);
    });

    return { ...session, exercises, estMinutes: estimateMinutes(exercises) };
  });

  return {
    plan: {
      ...plan,
      sessions,
      refreshes: plan.refreshes + 1,
      retired: [...justRetired, ...plan.retired].slice(0, RETIRED_MEMORY),
    },
    swapped,
  };
}

/* ------------------------------------------------------------------ *
 * Rebuilding after a settings change
 * ------------------------------------------------------------------ */

/** Epley estimate, so a weight moved to a different rep range stays about as hard. */
function convertWeight(kg: number, fromReps: number, toReps: number): number {
  const oneRepMax = kg * (1 + fromReps / 30);
  return Math.round((oneRepMax / (1 + toReps / 30)) * 2) / 2;
}

function repMidpoint(ex: PlannedExercise): number {
  return ((ex.repMin ?? 8) + (ex.repMax ?? 12)) / 2;
}

/** How far someone has got with a movement, to pick between two copies of it. */
function progressValue(ex: PlannedExercise): number {
  if (ex.unit === "weight_reps") return ex.targetWeightKg ?? -1;
  if (ex.unit === "reps") return ex.repMax ?? 0;
  return ex.seconds ?? 0;
}

/**
 * Builds a fresh plan from changed settings without throwing away progress.
 * Movements already in the plan are preferred wherever they still fit, and
 * those that stay keep their calibrated weight, reps or duration. A weight
 * moved to a new rep range is converted so it stays about as hard.
 */
export function rebuildPlan(
  current: Plan,
  profile: GeneratorProfile,
  options: {
    /**
     * Keep today's exercises wherever they still fit. Right when someone edits
     * their settings: they asked for a different schedule, not new movements.
     * Wrong when the rules themselves have improved, because the old choices
     * are exactly what the new rules are meant to replace.
     */
    preferCurrent?: boolean;
  } = {}
): Plan {
  const { preferCurrent = true } = options;
  const previous = new Map<string, PlannedExercise>();
  for (const session of current.sessions) {
    for (const ex of session.exercises) {
      const seen = previous.get(ex.exerciseId);
      if (!seen || progressValue(ex) > progressValue(seen)) previous.set(ex.exerciseId, ex);
    }
  }

  // Their notes haven't been re-read, so the last reading of them still stands.
  const withReading =
    profile.notesReading || !current.notesReading ? profile : { ...profile, notesReading: current.notesReading };
  const fresh = generatePlan(withReading, preferCurrent ? { keep: previous.keys() } : {});

  const sessions = fresh.sessions.map((session) => {
    const exercises = session.exercises.map((planned): PlannedExercise => {
      const before = previous.get(planned.exerciseId);
      if (!before) return planned;

      if (planned.unit === "weight_reps") {
        if (before.targetWeightKg == null) return planned;
        const sameRange = before.repMin === planned.repMin && before.repMax === planned.repMax;
        return {
          ...planned,
          targetWeightKg: sameRange
            ? before.targetWeightKg
            : convertWeight(before.targetWeightKg, repMidpoint(before), repMidpoint(planned)),
        };
      }

      // Bodyweight reps and cardio durations reflect what they can do, whatever the goal.
      if (planned.unit === "reps") {
        return {
          ...planned,
          repMin: before.repMin ?? planned.repMin,
          repMax: before.repMax ?? planned.repMax,
          streak: before.streak,
          // Weight held on a calf raise or a pull-up is progress like any other,
          // and a rebuild used to quietly reset it to bodyweight.
          targetWeightKg: before.targetWeightKg ?? planned.targetWeightKg,
        };
      }
      return { ...planned, seconds: before.seconds ?? planned.seconds };
    });

    return { ...session, exercises, estMinutes: estimateMinutes(exercises) };
  });

  return { ...fresh, sessions, refreshes: current.refreshes, retired: current.retired };
}

/** Convenience for screens that need the exercise definition alongside the plan. */
export function definitionFor(planned: PlannedExercise): ExerciseDef | undefined {
  return EXERCISES_BY_ID[planned.exerciseId];
}
