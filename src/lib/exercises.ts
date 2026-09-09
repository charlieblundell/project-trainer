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
  | "cardio";

export type MovementPattern =
  | "horizontal_push"
  | "vertical_push"
  | "horizontal_pull"
  | "vertical_pull"
  | "squat"
  | "hinge"
  | "lunge"
  | "core"
  | "isolation"
  | "cardio";

export type ExerciseDef = {
  id: string;
  name: string;
  /** Every item listed is required to perform the movement. */
  equipment: Equipment[];
  pattern: MovementPattern;
  muscles: string[];
  compound: boolean;
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
};

/** Which equipment options to offer, based on the answer to "where do you train". */
export const EQUIPMENT_BY_ENVIRONMENT: Record<string, Equipment[]> = {
  "Full gym": [
    "barbell",
    "dumbbell",
    "kettlebell",
    "cable",
    "machine",
    "squat_rack",
    "bench",
    "pullup_bar",
    "cardio",
  ],
  "Home gym": ["dumbbell", "kettlebell", "barbell", "bench", "pullup_bar", "bands", "bodyweight"],
  Home: ["dumbbell", "kettlebell", "bands", "pullup_bar", "bodyweight"],
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
    "bodyweight",
    "cardio",
  ],
};

export const EXERCISES: ExerciseDef[] = [
  // ---- horizontal push ----
  { id: "bench_press", name: "Barbell Bench Press", equipment: ["barbell", "bench"], pattern: "horizontal_push", muscles: ["Chest", "Triceps", "Front delts"], compound: true },
  { id: "incline_bench", name: "Incline Barbell Press", equipment: ["barbell", "bench"], pattern: "horizontal_push", muscles: ["Upper chest", "Triceps", "Front delts"], compound: true },
  { id: "db_bench", name: "Dumbbell Bench Press", equipment: ["dumbbell", "bench"], pattern: "horizontal_push", muscles: ["Chest", "Triceps", "Front delts"], compound: true },
  { id: "incline_db", name: "Incline Dumbbell Press", equipment: ["dumbbell", "bench"], pattern: "horizontal_push", muscles: ["Upper chest", "Front delts", "Triceps"], compound: true },
  { id: "db_floor_press", name: "Dumbbell Floor Press", equipment: ["dumbbell"], pattern: "horizontal_push", muscles: ["Chest", "Triceps"], compound: true },
  { id: "machine_chest_press", name: "Machine Chest Press", equipment: ["machine"], pattern: "horizontal_push", muscles: ["Chest", "Triceps"], compound: true },
  { id: "cable_fly", name: "Cable Fly", equipment: ["cable"], pattern: "isolation", muscles: ["Chest"], compound: false },
  { id: "pushup", name: "Push-up", equipment: ["bodyweight"], pattern: "horizontal_push", muscles: ["Chest", "Triceps", "Front delts"], compound: true },
  { id: "band_pushup", name: "Banded Push-up", equipment: ["bands", "bodyweight"], pattern: "horizontal_push", muscles: ["Chest", "Triceps"], compound: true },
  { id: "dip", name: "Dip", equipment: ["bodyweight"], pattern: "horizontal_push", muscles: ["Chest", "Triceps"], compound: true },

  // ---- vertical push ----
  { id: "overhead_press", name: "Barbell Overhead Press", equipment: ["barbell"], pattern: "vertical_push", muscles: ["Shoulders", "Triceps"], compound: true },
  { id: "db_shoulder_press", name: "Dumbbell Shoulder Press", equipment: ["dumbbell"], pattern: "vertical_push", muscles: ["Shoulders", "Triceps"], compound: true },
  { id: "machine_shoulder_press", name: "Machine Shoulder Press", equipment: ["machine"], pattern: "vertical_push", muscles: ["Shoulders", "Triceps"], compound: true },
  { id: "kb_press", name: "Kettlebell Overhead Press", equipment: ["kettlebell"], pattern: "vertical_push", muscles: ["Shoulders", "Triceps"], compound: true },
  { id: "pike_pushup", name: "Pike Push-up", equipment: ["bodyweight"], pattern: "vertical_push", muscles: ["Shoulders", "Triceps"], compound: true },
  { id: "band_overhead_press", name: "Band Overhead Press", equipment: ["bands"], pattern: "vertical_push", muscles: ["Shoulders", "Triceps"], compound: true },

  // ---- horizontal pull ----
  { id: "barbell_row", name: "Barbell Row", equipment: ["barbell"], pattern: "horizontal_pull", muscles: ["Lats", "Upper back", "Biceps"], compound: true },
  { id: "db_row", name: "Dumbbell Row", equipment: ["dumbbell"], pattern: "horizontal_pull", muscles: ["Lats", "Upper back", "Biceps"], compound: true },
  { id: "cable_row", name: "Seated Cable Row", equipment: ["cable"], pattern: "horizontal_pull", muscles: ["Lats", "Upper back", "Biceps"], compound: true },
  { id: "machine_row", name: "Machine Row", equipment: ["machine"], pattern: "horizontal_pull", muscles: ["Lats", "Upper back", "Biceps"], compound: true },
  { id: "inverted_row", name: "Inverted Row", equipment: ["bodyweight"], pattern: "horizontal_pull", muscles: ["Upper back", "Biceps"], compound: true },
  { id: "band_row", name: "Band Row", equipment: ["bands"], pattern: "horizontal_pull", muscles: ["Upper back", "Biceps"], compound: true },
  { id: "kb_row", name: "Kettlebell Row", equipment: ["kettlebell"], pattern: "horizontal_pull", muscles: ["Lats", "Upper back", "Biceps"], compound: true },

  // ---- vertical pull ----
  { id: "pullup", name: "Pull-up", equipment: ["pullup_bar"], pattern: "vertical_pull", muscles: ["Lats", "Biceps"], compound: true },
  { id: "chinup", name: "Chin-up", equipment: ["pullup_bar"], pattern: "vertical_pull", muscles: ["Lats", "Biceps"], compound: true },
  { id: "lat_pulldown", name: "Lat Pulldown", equipment: ["cable"], pattern: "vertical_pull", muscles: ["Lats", "Biceps"], compound: true },
  { id: "machine_pulldown", name: "Machine Pulldown", equipment: ["machine"], pattern: "vertical_pull", muscles: ["Lats", "Biceps"], compound: true },
  { id: "band_pulldown", name: "Band Pulldown", equipment: ["bands"], pattern: "vertical_pull", muscles: ["Lats", "Biceps"], compound: true },

  // ---- squat ----
  { id: "back_squat", name: "Back Squat", equipment: ["barbell", "squat_rack"], pattern: "squat", muscles: ["Quads", "Glutes"], compound: true },
  { id: "front_squat", name: "Front Squat", equipment: ["barbell", "squat_rack"], pattern: "squat", muscles: ["Quads", "Core"], compound: true },
  { id: "goblet_squat", name: "Goblet Squat", equipment: ["dumbbell"], pattern: "squat", muscles: ["Quads", "Glutes"], compound: true },
  { id: "kb_goblet_squat", name: "Kettlebell Goblet Squat", equipment: ["kettlebell"], pattern: "squat", muscles: ["Quads", "Glutes"], compound: true },
  { id: "leg_press", name: "Leg Press", equipment: ["machine"], pattern: "squat", muscles: ["Quads", "Glutes"], compound: true },
  { id: "hack_squat", name: "Hack Squat", equipment: ["machine"], pattern: "squat", muscles: ["Quads"], compound: true },
  { id: "bw_squat", name: "Bodyweight Squat", equipment: ["bodyweight"], pattern: "squat", muscles: ["Quads", "Glutes"], compound: true },

  // ---- hinge ----
  { id: "deadlift", name: "Deadlift", equipment: ["barbell"], pattern: "hinge", muscles: ["Hamstrings", "Glutes", "Back"], compound: true },
  { id: "rdl", name: "Romanian Deadlift", equipment: ["barbell"], pattern: "hinge", muscles: ["Hamstrings", "Glutes"], compound: true },
  { id: "db_rdl", name: "Dumbbell Romanian Deadlift", equipment: ["dumbbell"], pattern: "hinge", muscles: ["Hamstrings", "Glutes"], compound: true },
  { id: "kb_swing", name: "Kettlebell Swing", equipment: ["kettlebell"], pattern: "hinge", muscles: ["Hamstrings", "Glutes", "Core"], compound: true },
  { id: "hip_thrust", name: "Hip Thrust", equipment: ["barbell", "bench"], pattern: "hinge", muscles: ["Glutes", "Hamstrings"], compound: true },
  { id: "glute_bridge", name: "Glute Bridge", equipment: ["bodyweight"], pattern: "hinge", muscles: ["Glutes"], compound: true },
  { id: "back_extension", name: "Back Extension", equipment: ["bodyweight"], pattern: "hinge", muscles: ["Lower back", "Glutes"], compound: false },

  // ---- lunge ----
  { id: "walking_lunge", name: "Walking Lunge", equipment: ["dumbbell"], pattern: "lunge", muscles: ["Quads", "Glutes"], compound: true },
  { id: "reverse_lunge", name: "Reverse Lunge", equipment: ["bodyweight"], pattern: "lunge", muscles: ["Quads", "Glutes"], compound: true },
  { id: "split_squat", name: "Bulgarian Split Squat", equipment: ["dumbbell", "bench"], pattern: "lunge", muscles: ["Quads", "Glutes"], compound: true },
  { id: "step_up", name: "Step-up", equipment: ["dumbbell", "bench"], pattern: "lunge", muscles: ["Quads", "Glutes"], compound: true },

  // ---- core ----
  { id: "plank", name: "Plank", equipment: ["bodyweight"], pattern: "core", muscles: ["Core"], compound: false },
  { id: "hanging_leg_raise", name: "Hanging Leg Raise", equipment: ["pullup_bar"], pattern: "core", muscles: ["Core", "Hip flexors"], compound: false },
  { id: "cable_crunch", name: "Cable Crunch", equipment: ["cable"], pattern: "core", muscles: ["Core"], compound: false },
  { id: "dead_bug", name: "Dead Bug", equipment: ["bodyweight"], pattern: "core", muscles: ["Core"], compound: false },
  { id: "ab_wheel", name: "Ab Wheel Rollout", equipment: ["bodyweight"], pattern: "core", muscles: ["Core"], compound: false },

  // ---- isolation ----
  { id: "lateral_raise", name: "Lateral Raise", equipment: ["dumbbell"], pattern: "isolation", muscles: ["Side delts"], compound: false },
  { id: "cable_lateral_raise", name: "Cable Lateral Raise", equipment: ["cable"], pattern: "isolation", muscles: ["Side delts"], compound: false },
  { id: "band_lateral_raise", name: "Band Lateral Raise", equipment: ["bands"], pattern: "isolation", muscles: ["Side delts"], compound: false },
  { id: "face_pull", name: "Face Pull", equipment: ["cable"], pattern: "isolation", muscles: ["Rear delts", "Upper back"], compound: false },
  { id: "rear_delt_fly", name: "Rear Delt Fly", equipment: ["dumbbell"], pattern: "isolation", muscles: ["Rear delts"], compound: false },
  { id: "db_curl", name: "Dumbbell Curl", equipment: ["dumbbell"], pattern: "isolation", muscles: ["Biceps"], compound: false },
  { id: "hammer_curl", name: "Hammer Curl", equipment: ["dumbbell"], pattern: "isolation", muscles: ["Biceps", "Forearms"], compound: false },
  { id: "barbell_curl", name: "Barbell Curl", equipment: ["barbell"], pattern: "isolation", muscles: ["Biceps"], compound: false },
  { id: "band_curl", name: "Band Curl", equipment: ["bands"], pattern: "isolation", muscles: ["Biceps"], compound: false },
  { id: "triceps_pushdown", name: "Triceps Pushdown", equipment: ["cable"], pattern: "isolation", muscles: ["Triceps"], compound: false },
  { id: "overhead_extension", name: "Overhead Triceps Extension", equipment: ["dumbbell"], pattern: "isolation", muscles: ["Triceps"], compound: false },
  { id: "leg_curl", name: "Leg Curl", equipment: ["machine"], pattern: "isolation", muscles: ["Hamstrings"], compound: false },
  { id: "leg_extension", name: "Leg Extension", equipment: ["machine"], pattern: "isolation", muscles: ["Quads"], compound: false },
  { id: "calf_raise", name: "Calf Raise", equipment: ["bodyweight"], pattern: "isolation", muscles: ["Calves"], compound: false },
  { id: "db_calf_raise", name: "Dumbbell Calf Raise", equipment: ["dumbbell"], pattern: "isolation", muscles: ["Calves"], compound: false },

  // ---- cardio ----
  { id: "treadmill", name: "Treadmill Run", equipment: ["cardio"], pattern: "cardio", muscles: ["Full body"], compound: true },
  { id: "bike", name: "Stationary Bike", equipment: ["cardio"], pattern: "cardio", muscles: ["Legs"], compound: true },
  { id: "rower", name: "Rowing Machine", equipment: ["cardio"], pattern: "cardio", muscles: ["Full body"], compound: true },
  { id: "outdoor_run", name: "Outdoor Run", equipment: ["bodyweight"], pattern: "cardio", muscles: ["Full body"], compound: true },
  { id: "jump_rope", name: "Jump Rope", equipment: ["bodyweight"], pattern: "cardio", muscles: ["Full body", "Calves"], compound: true },
  { id: "incline_walk", name: "Incline Walk", equipment: ["cardio"], pattern: "cardio", muscles: ["Legs"], compound: true },
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
      ex.name.toLowerCase().includes(q) ||
      ex.muscles.some((m) => m.toLowerCase().includes(q))
  );
}
