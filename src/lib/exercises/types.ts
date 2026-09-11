export type Equipment =
  | "barbell"
  | "dumbbell"
  | "kettlebell"
  | "cable"
  | "machine"
  | "squat_rack"
  | "bench"
  | "pullup_bar"
  | "bands"
  | "bodyweight"
  | "cardio"
  | "chair"
  | "mat";

export type MovementPattern =
  | "horizontal_push"
  | "vertical_push"
  | "horizontal_pull"
  | "vertical_pull"
  | "squat"
  | "hinge"
  | "lunge"
  | "carry"
  | "core"
  | "isolation"
  | "plyometric"
  | "conditioning"
  | "mobility";

/**
 * Joints and structures a movement puts under meaningful load. Used to steer
 * selection away from areas a user has flagged as troublesome. These are
 * programming hints, not clinical advice — nothing here diagnoses anything.
 */
export type BodyPart =
  | "shoulder"
  | "elbow"
  | "wrist"
  | "spine"
  | "hip"
  | "knee"
  | "ankle"
  | "neck";

/**
 * 1 — anyone can attempt it on day one
 * 2 — needs some training history or baseline strength
 * 3 — advanced; assumes competence in the level-2 version
 */
export type Level = 1 | 2 | 3;

/** How a set is recorded, which decides what the logging screen asks for. */
export type LoggingUnit = "weight_reps" | "reps" | "time" | "distance";

export type ExerciseDef = {
  id: string;
  name: string;
  /** Every item listed is required to perform the movement. */
  equipment: Equipment[];
  pattern: MovementPattern;
  muscles: string[];
  compound: boolean;
  level: Level;
  unit: LoggingUnit;
  /** Joints under meaningful load — see BodyPart. */
  loads: BodyPart[];
  /** Id of an easier version of the same movement. */
  easier?: string;
  /** Id of a harder version of the same movement. */
  harder?: string;
  /** Ids that can fill the same slot in a session. */
  substitutes?: string[];
  /** Short coaching cues, shown on the exercise info panel. */
  cues?: string[];
  /** True for movements that are gentle on joints and suit deconditioned users. */
  lowImpact?: boolean;
};

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: "Barbell",
  dumbbell: "Dumbbells",
  kettlebell: "Kettlebells",
  cable: "Cable machine",
  machine: "Weight machines",
  squat_rack: "Squat rack",
  bench: "Bench",
  pullup_bar: "Pull-up bar",
  bands: "Resistance bands",
  bodyweight: "Bodyweight only",
  cardio: "Cardio machines",
  chair: "A sturdy chair",
  mat: "Exercise mat",
};

/** Which equipment options to offer, based on the answer to "where do you train". */
export const EQUIPMENT_BY_ENVIRONMENT: Record<string, Equipment[]> = {
  // Bands and a box or bench to step on are in every gym, and leaving them out
  // made a full gym offer fewer exercises than a spare room at home.
  "Full gym": [
    "barbell",
    "dumbbell",
    "kettlebell",
    "cable",
    "machine",
    "squat_rack",
    "bench",
    "pullup_bar",
    "bands",
    "cardio",
    "chair",
    "mat",
  ],
  // A kitted-out garage shouldn't offer less than a spare room: it has
  // somewhere to sit or step up on too.
  "Home gym": [
    "dumbbell",
    "kettlebell",
    "barbell",
    "bench",
    "pullup_bar",
    "bands",
    "chair",
    "mat",
    "bodyweight",
  ],
  Home: ["dumbbell", "kettlebell", "bands", "pullup_bar", "chair", "mat", "bodyweight"],
  Outdoor: ["bodyweight", "pullup_bar", "bands", "kettlebell"],
  Mixed: [
    "barbell",
    "dumbbell",
    "kettlebell",
    "cable",
    "machine",
    "squat_rack",
    "bench",
    "pullup_bar",
    "bands",
    "cardio",
    "chair",
    "mat",
    "bodyweight",
  ],
};
