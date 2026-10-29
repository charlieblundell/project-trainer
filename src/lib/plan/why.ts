import { EXERCISES_BY_ID, type Level } from "@/lib/exercises";
import { isLightLoad } from "./generate";
import { primaryGroup, setsByGroup, weeklyTarget } from "./volume";
import type { Plan, PlannedExercise } from "./types";

/*
 * Why one exercise has the numbers it has.
 *
 * The plan rules explain how a whole week is built; this is the same reasoning
 * pointed at the one movement on screen, with this person's numbers in it:
 * how many sets their chest gets this week and what the research says to aim
 * for, why the reps sit where they do for their goal, why the rest is as long
 * as it is. Every line names the findings behind it, and a line that's a
 * judgement call says so rather than borrowing a citation.
 *
 * Keep this in step with prescribe() in generate.ts and with rules.ts.
 */

export type Reason = {
  /** "Sets", "Reps", "Effort", "Rest" */
  label: string;
  /** What they're doing: "4 sets", "6–10 reps", "2 min". */
  value: string;
  why: string;
  /** Evidence library ids. Empty means it's our judgement, and `why` says so. */
  findings: string[];
};

export type WhyContext = { plan: Plan; goal: string; level: Level };

const MUSCLE_GOALS = new Set(["Build muscle", "Lose fat"]);

const round = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

function restLabel(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  const minutes = seconds / 60;
  return Number.isInteger(minutes) ? `${minutes} min` : `${round(minutes)} min`;
}

export function whyTheseNumbers(planned: PlannedExercise, { plan, goal, level }: WhyContext): Reason[] {
  const def = EXERCISES_BY_ID[planned.exerciseId];
  // Timed work, cardio and mobility aren't prescribed by these rules.
  if (!def || planned.unit === "time" || planned.unit === "distance" || def.pattern === "mobility") return [];

  const reasons: Reason[] = [];
  const group = primaryGroup(def);
  const light = isLightLoad(def);

  /* Sets: what this exercise adds to the muscle's week, against the target. */
  if (group) {
    const week = setsByGroup(plan.sessions.flatMap((s) => s.exercises))[group];
    const aim = weeklyTarget(goal, level, group);
    const standing =
      week < aim.min
        ? `That's under the ${aim.min}–${aim.max} the plan aims for, usually because the sessions ran out of time.`
        : week > aim.max
          ? `That's above the usual ${aim.min}–${aim.max}, which is fine while you're recovering well.`
          : `That's inside the ${aim.min}–${aim.max} the plan aims for.`;
    const findings = ["volume-dose-response", "count-indirect-sets-as-half"];
    if (level === 1) findings.push("beginners-start-small");
    reasons.push({
      label: "Sets",
      value: `${planned.sets} sets`,
      why:
        `Hard sets per muscle per week are what best predicts growth. With this, your week has ${round(week)} sets for your ${group}, counting exercises that only help them as half a set. ${standing}` +
        (level === 1 ? " New lifters start lower and build up: it's easier to recover from and still makes real progress." : ""),
      findings,
    });
  }

  /* Reps: set by the goal, and by how heavy the equipment can go. */
  if (planned.repMin != null && planned.repMax != null) {
    const value = planned.repMin === planned.repMax ? `${planned.repMax} reps` : `${planned.repMin}–${planned.repMax} reps`;
    if (light) {
      reasons.push({
        label: "Reps",
        value,
        why: "Light loads build about as much muscle as heavy ones when the set ends close to your limit. A band can't make six reps hard, so this works in higher reps instead.",
        findings: ["load-range-hypertrophy"],
      });
    } else if (goal === "Get stronger") {
      reasons.push({
        label: "Reps",
        value,
        why: "Strength, unlike size, depends on lifting heavy, so strength work stays in low reps. Higher-rep sets build muscle but not the skill of moving a heavy weight.",
        findings: ["load-for-strength", "goal-changes-prescription"],
      });
    } else if (MUSCLE_GOALS.has(goal)) {
      reasons.push({
        label: "Reps",
        value,
        why:
          "Muscle grows about as well from light and heavy weights when sets are hard, so the exact range is a practical choice: heavy enough to progress, light enough not to grind." +
          (goal === "Lose fat" ? " It's the same as a muscle-building plan on purpose: lifting properly is what holds on to muscle while you eat less." : ""),
        findings:
          goal === "Lose fat"
            ? ["load-range-hypertrophy", "slow-fat-loss-protects-muscle"]
            : ["load-range-hypertrophy", "goal-changes-prescription"],
      });
    } else {
      reasons.push({
        label: "Reps",
        value,
        why: "Moderate to higher reps keep the weights manageable and the sessions moving, which suits your goal. Any load builds strength and muscle when sets are hard; the exact range here is our judgement.",
        findings: ["load-range-hypertrophy"],
      });
    }
  }

  /* Effort: the same for everyone, and it's what the effort rating is for. */
  reasons.push({
    label: "Effort",
    value: "1–3 reps left",
    why: "Finish each set with a rep or two still in you. Going all the way to failure adds little growth and costs a lot of fatigue. Your effort rating after the exercise tells the plan when to add weight.",
    findings: ["failure-not-required", "effort-gauged-by-reps-left"],
  });

  /* Rest: long for heavy compounds; for growth, past a minute, up to about ninety seconds. */
  const rest = planned.restSeconds;
  if (rest > 0) {
    const value = restLabel(rest);
    if (def.compound && rest >= 120 && !light) {
      reasons.push({
        label: "Rest",
        value,
        why: "Rushing the rest on a heavy lift costs reps on the next set, and those reps are the training. Two to three minutes keeps them.",
        findings: ["rest-between-sets"],
      });
    } else if (rest === 60 && (MUSCLE_GOALS.has(goal) || goal === "Get stronger")) {
      reasons.push({
        label: "Rest",
        value,
        why: "For growth, resting about ninety seconds helps a little more than a minute. Your sessions are under an hour, though, and the extra time would cost whole sets, which matter more. So smaller exercises rest a minute.",
        findings: ["rest-between-sets", "volume-dose-response"],
      });
    } else if (rest >= 60) {
      reasons.push({
        label: "Rest",
        value,
        why: "For muscle growth, resting more than a minute helps a little, and the benefit levels off at about ninety seconds. Smaller exercises don't need the long rest a heavy lift does.",
        findings: ["rest-between-sets"],
      });
    } else {
      reasons.push({
        label: "Rest",
        value,
        why: "Short rests keep the session moving and your heart rate up, which suits your goal. It's a trade-off we chose: for building muscle, resting at least a minute works better.",
        findings: ["rest-between-sets"],
      });
    }
  }

  return reasons;
}
