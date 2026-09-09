import type { Workout, PlanDay } from "./types";

export const GOALS = [
  "Build muscle",
  "Lose fat",
  "Get stronger",
  "Improve fitness",
  "Improve endurance",
  "General health",
];

export const EXPERIENCE_OPTIONS = [
  "I'm new to training",
  "I've been training a while",
  "I've trained consistently for years",
];

export const DAY_OPTIONS = [2, 3, 4, 5, 6];
export const LENGTH_OPTIONS = [20, 30, 45, 60, 90];
export const ENVIRONMENTS = ["Full gym", "Home gym", "Home", "Outdoor", "Mixed"];

export const GENERATING_STEPS = [
  "Understanding your goal",
  "Analysing your schedule",
  "Selecting exercises",
  "Building your progression",
  "Optimising your workouts",
];

export const WORKOUTS: Record<string, Workout> = {
  upperA: {
    id: "upperA",
    name: "Upper A",
    displayName: "Upper Body",
    estMinutes: 52,
    exercises: [
      {
        id: "bench",
        name: "Bench Press",
        targetWeight: 62.5,
        targetReps: 8,
        sets: 3,
        previous: [{ w: 60, r: 8 }, { w: 60, r: 8 }, { w: 60, r: 8 }],
        muscles: ["Chest", "Triceps", "Front shoulders"],
        tips: [
          "Keep shoulder blades pulled together and down.",
          "Lower the bar to mid-chest with control.",
          "Drive through your feet, not just your arms.",
        ],
        alternatives: [
          { name: "Dumbbell Bench Press", targetWeight: 24, targetReps: 8 },
          { name: "Machine Chest Press", targetWeight: 50, targetReps: 8 },
          { name: "Push-ups", targetWeight: 0, targetReps: 15 },
        ],
      },
      {
        id: "incline",
        name: "Incline DB Press",
        targetWeight: 24,
        targetReps: 10,
        sets: 3,
        previous: [{ w: 22, r: 10 }, { w: 22, r: 10 }, { w: 22, r: 9 }],
        muscles: ["Upper chest", "Front shoulders", "Triceps"],
        tips: [
          "Set the bench to a 30-45 degree incline.",
          "Keep wrists stacked over elbows.",
          "Don't flare elbows past 75 degrees.",
        ],
        alternatives: [
          { name: "Incline Barbell Press", targetWeight: 40, targetReps: 8 },
          { name: "Low-to-High Cable Fly", targetWeight: 12, targetReps: 12 },
        ],
      },
      {
        id: "pulldown",
        name: "Lat Pulldown",
        targetWeight: 60,
        targetReps: 10,
        sets: 3,
        previous: [{ w: 57.5, r: 10 }, { w: 57.5, r: 10 }, { w: 57.5, r: 10 }],
        muscles: ["Lats", "Biceps", "Rear shoulders"],
        tips: [
          "Lead with your elbows, not your hands.",
          "Avoid leaning back excessively.",
          "Pause briefly at the bottom of each rep.",
        ],
        alternatives: [
          { name: "Assisted Pull-ups", targetWeight: 0, targetReps: 8 },
          { name: "Seated Cable Row", targetWeight: 55, targetReps: 10 },
        ],
      },
      {
        id: "lateral",
        name: "Lateral Raise",
        targetWeight: 10,
        targetReps: 12,
        sets: 3,
        previous: [{ w: 9, r: 12 }, { w: 9, r: 12 }, { w: 9, r: 11 }],
        muscles: ["Side shoulders"],
        tips: [
          "Lead with your elbows, not your hands.",
          "Stop at shoulder height, don't shrug.",
          "Keep a slight bend in the elbow throughout.",
        ],
        alternatives: [
          { name: "Cable Lateral Raise", targetWeight: 7, targetReps: 12 },
          { name: "Machine Lateral Raise", targetWeight: 15, targetReps: 12 },
        ],
      },
      {
        id: "triceps",
        name: "Triceps Pushdown",
        targetWeight: 25,
        targetReps: 12,
        sets: 3,
        previous: [{ w: 22.5, r: 12 }, { w: 22.5, r: 12 }, { w: 22.5, r: 12 }],
        muscles: ["Triceps"],
        tips: [
          "Keep elbows pinned to your sides.",
          "Extend fully without locking out aggressively.",
          "Control the eccentric, don't let the bar snap back.",
        ],
        alternatives: [
          { name: "Overhead Rope Extension", targetWeight: 20, targetReps: 12 },
          { name: "Close-Grip Bench Press", targetWeight: 40, targetReps: 10 },
        ],
      },
    ],
  },
  lowerA: {
    id: "lowerA",
    name: "Lower A",
    displayName: "Lower Body",
    estMinutes: 58,
    exercises: [
      { id: "squat", name: "Back Squat", targetWeight: 100, targetReps: 5, sets: 3, previous: [{ w: 97.5, r: 5 }, { w: 97.5, r: 5 }, { w: 97.5, r: 5 }] },
      { id: "rdl", name: "Romanian Deadlift", targetWeight: 80, targetReps: 10, sets: 3, previous: [{ w: 77.5, r: 10 }, { w: 77.5, r: 10 }, { w: 77.5, r: 10 }] },
      { id: "legpress", name: "Leg Press", targetWeight: 120, targetReps: 10, sets: 3, previous: [{ w: 115, r: 10 }, { w: 115, r: 10 }, { w: 115, r: 10 }] },
      { id: "calf", name: "Calf Raise", targetWeight: 60, targetReps: 15, sets: 3, previous: [{ w: 55, r: 15 }, { w: 55, r: 15 }, { w: 55, r: 15 }] },
    ],
  },
  upperB: {
    id: "upperB",
    name: "Upper B",
    displayName: "Upper Body",
    estMinutes: 50,
    exercises: [
      { id: "pullup", name: "Pull-ups", targetWeight: 0, targetReps: 8, sets: 3, previous: [{ w: 0, r: 7 }, { w: 0, r: 7 }, { w: 0, r: 6 }] },
      { id: "row", name: "Barbell Row", targetWeight: 70, targetReps: 8, sets: 3, previous: [{ w: 67.5, r: 8 }, { w: 67.5, r: 8 }, { w: 67.5, r: 8 }] },
      { id: "facepull", name: "Face Pull", targetWeight: 15, targetReps: 15, sets: 3, previous: [{ w: 12.5, r: 15 }, { w: 12.5, r: 15 }, { w: 12.5, r: 15 }] },
      { id: "curl", name: "EZ-Bar Curl", targetWeight: 25, targetReps: 10, sets: 3, previous: [{ w: 22.5, r: 10 }, { w: 22.5, r: 10 }, { w: 22.5, r: 10 }] },
    ],
  },
  lowerB: {
    id: "lowerB",
    name: "Lower B",
    displayName: "Lower Body",
    estMinutes: 56,
    exercises: [
      { id: "deadlift", name: "Deadlift", targetWeight: 120, targetReps: 5, sets: 3, previous: [{ w: 115, r: 5 }, { w: 115, r: 5 }, { w: 115, r: 5 }] },
      { id: "splitsquat", name: "Bulgarian Split Squat", targetWeight: 20, targetReps: 10, sets: 3, previous: [{ w: 18, r: 10 }, { w: 18, r: 10 }, { w: 18, r: 10 }] },
      { id: "legcurl", name: "Leg Curl", targetWeight: 45, targetReps: 12, sets: 3, previous: [{ w: 40, r: 12 }, { w: 40, r: 12 }, { w: 40, r: 12 }] },
    ],
  },
};

export const PLAN_WEEK: PlanDay[] = [
  { day: "Monday", label: "Upper A", minutes: 55, today: true, workoutId: "upperA" },
  { day: "Tuesday", label: "Lower A", minutes: 60, workoutId: "lowerA" },
  { day: "Wednesday", label: "Rest", minutes: null },
  { day: "Thursday", label: "Upper B", minutes: 55, workoutId: "upperB" },
  { day: "Friday", label: "Lower B", minutes: 60, workoutId: "lowerB" },
  { day: "Saturday", label: "Optional cardio", minutes: 30 },
  { day: "Sunday", label: "Rest", minutes: null },
];

export const STRENGTH_HISTORY: Record<string, number[]> = {
  "Bench Press": [50, 52.5, 55, 57.5, 60, 60, 62.5],
  Squat: [80, 85, 87.5, 90, 95, 97.5, 100],
  "Pull-ups (reps)": [6, 7, 8, 9, 10, 11, 12],
};

export const PERSONAL_RECORDS = [
  { name: "Bench Press", value: "65 kg x 8" },
  { name: "Squat", value: "100 kg x 5" },
  { name: "Pull-ups", value: "12 reps" },
];

export const COACH_PROMPTS = [
  "What am I doing today?",
  "I only have 30 minutes.",
  "Can I swap squats for leg press?",
  "Why did my bench weight go up?",
  "I missed a workout last week.",
];

export function todaysWorkoutId(): string {
  const today = PLAN_WEEK.find((d) => d.today);
  return today?.workoutId ?? "upperA";
}
