import { EXERCISES_BY_ID } from "@/lib/exercises";
import type { Weekday } from "@/lib/types";
import {
  LIMITS,
  addExercise,
  moveSession,
  removeExercise,
  replaceExercise,
  updateExercise,
  type ExercisePatch,
} from "./edit";
import { WEEKDAY_LABELS, WEEKDAY_ORDER, targetLabel } from "./helpers";
import type { Plan } from "./types";

/*
 * A change to the plan the coach suggests in chat.
 *
 * The coach never edits the plan itself. It proposes, the app shows the
 * proposal as a card, and only the person tapping Apply changes anything —
 * through the same edit functions the plan editor uses, so a coach's change
 * obeys the same limits as a hand-typed one. Everything here is checked
 * twice: on the server against the plan it was written for, and again on the
 * phone against the plan as it is when Apply is tapped.
 */

export type PlanChange =
  | { kind: "replace_exercise"; sessionId: string; exerciseId: string; toExerciseId: string }
  | { kind: "add_exercise"; sessionId: string; exerciseId: string }
  | { kind: "remove_exercise"; sessionId: string; exerciseId: string }
  | {
      kind: "update_exercise";
      sessionId: string;
      exerciseId: string;
      sets?: number;
      repMin?: number;
      repMax?: number;
      restSeconds?: number;
      targetWeightKg?: number;
    }
  | { kind: "move_session"; sessionId: string; weekday: Weekday };

export type ProposalState = "pending" | "applied" | "declined" | "undone";

export type PlanProposal = {
  /** One line saying what changes, in the coach's words. */
  summary: string;
  changes: PlanChange[];
  state: ProposalState;
  /** The plan before and after applying, kept so it can be undone. */
  before?: Plan;
  after?: Plan;
};

export const MAX_CHANGES = 8;
const KINDS = ["replace_exercise", "add_exercise", "remove_exercise", "update_exercise", "move_session"] as const;

/** The tool the coach is given, in the shape the API wants. */
export const PROPOSE_TOOL = {
  name: "propose_plan_change",
  description:
    "Propose a permanent change to the athlete's weekly training plan. The app shows it to them as a card with Apply and No thanks buttons; nothing changes unless they tap Apply, and they can undo it. Use it when they ask for a change to their plan, or say yes to one you suggested. Refer to sessions and exercises by the ids in the plan listing, and only use exercise ids from their available exercises. One proposal per reply, grouping every change that belongs together.",
  input_schema: {
    type: "object" as const,
    properties: {
      summary: {
        type: "string",
        description: "One short line saying what changes, e.g. 'Swap overhead press for landmine press on Push day'.",
      },
      changes: {
        type: "array",
        minItems: 1,
        maxItems: MAX_CHANGES,
        items: {
          type: "object",
          properties: {
            kind: { type: "string", enum: [...KINDS] },
            session_id: { type: "string" },
            exercise_id: {
              type: "string",
              description: "The exercise in the session to change or remove, or the new one to add.",
            },
            to_exercise_id: { type: "string", description: "For replace_exercise: the exercise to swap in." },
            weekday: { type: "string", enum: [...WEEKDAY_ORDER], description: "For move_session." },
            sets: { type: "integer" },
            rep_min: { type: "integer" },
            rep_max: { type: "integer" },
            rest_seconds: { type: "integer" },
            target_weight_kg: { type: "number" },
          },
          required: ["kind", "session_id"],
        },
      },
    },
    required: ["summary", "changes"],
  },
};

type RawChange = Record<string, unknown>;

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const num = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

/**
 * Checks what the coach proposed against the plan and what the person can
 * actually do. Returns null if any part of it doesn't fit: half a proposal
 * applied is worse than none.
 */
export function parseProposal(raw: unknown, plan: Plan, available: Set<string>): PlanProposal | null {
  const input = raw as { summary?: unknown; changes?: unknown };
  const summary = str(input?.summary)?.slice(0, 160);
  if (!summary || !Array.isArray(input.changes) || input.changes.length === 0) return null;
  if (input.changes.length > MAX_CHANGES) return null;

  const changes: PlanChange[] = [];
  for (const item of input.changes as RawChange[]) {
    const kind = item?.kind;
    const sessionId = str(item?.session_id);
    const session = plan.sessions.find((s) => s.id === sessionId);
    if (!sessionId || !session) return null;
    const inSession = (id: string | null) => !!id && session.exercises.some((e) => e.exerciseId === id);
    const exerciseId = str(item.exercise_id);

    switch (kind) {
      case "replace_exercise": {
        const toExerciseId = str(item.to_exercise_id);
        // Twice in one session would leave any later change unsure which one it meant.
        if (!inSession(exerciseId) || !toExerciseId || !available.has(toExerciseId) || inSession(toExerciseId)) return null;
        changes.push({ kind, sessionId, exerciseId: exerciseId!, toExerciseId });
        break;
      }
      case "add_exercise":
        if (!exerciseId || !available.has(exerciseId) || inSession(exerciseId)) return null;
        changes.push({ kind, sessionId, exerciseId });
        break;
      case "remove_exercise":
        if (!inSession(exerciseId)) return null;
        changes.push({ kind, sessionId, exerciseId: exerciseId! });
        break;
      case "update_exercise": {
        // Its exercise may be one added or swapped in earlier in the same proposal.
        const known = inSession(exerciseId) || changes.some((c) =>
          (c.kind === "add_exercise" && c.exerciseId === exerciseId) ||
          (c.kind === "replace_exercise" && c.toExerciseId === exerciseId)
        );
        if (!known) return null;
        const patch = {
          sets: within(num(item.sets), LIMITS.sets),
          repMin: within(num(item.rep_min), LIMITS.reps),
          repMax: within(num(item.rep_max), LIMITS.reps),
          restSeconds: within(num(item.rest_seconds), LIMITS.restSeconds),
          targetWeightKg: within(num(item.target_weight_kg), LIMITS.weightKg),
        };
        if (Object.values(patch).some((v) => v === null)) return null;
        if (Object.values(patch).every((v) => v === undefined)) return null;
        changes.push({ kind, sessionId, exerciseId: exerciseId!, ...(stripUndefined(patch) as ExerciseNumbers) });
        break;
      }
      case "move_session": {
        const weekday = item.weekday;
        if (!WEEKDAY_ORDER.includes(weekday as Weekday)) return null;
        changes.push({ kind, sessionId, weekday: weekday as Weekday });
        break;
      }
      default:
        return null;
    }
  }
  return { summary, changes, state: "pending" };
}

type ExerciseNumbers = Omit<Extract<PlanChange, { kind: "update_exercise" }>, "kind" | "sessionId" | "exerciseId">;

/** A number inside its limits, undefined when not given, null when given but out of range. */
function within(value: number | undefined, limits: { min: number; max: number }): number | undefined | null {
  if (value === undefined) return undefined;
  return value >= limits.min && value <= limits.max ? value : null;
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

/**
 * The plan with the changes made, or why it can't be: the plan may have moved
 * on since the coach wrote the proposal. Marks the plan as changed by hand,
 * as the editor does, since the person chose it.
 */
export function applyChanges(plan: Plan, changes: PlanChange[]): { plan: Plan } | { error: string } {
  let next = plan;
  for (const change of changes) {
    const session = next.sessions.find((s) => s.id === change.sessionId);
    if (!session) return { error: "That session isn't in your plan any more." };
    const index = "exerciseId" in change ? session.exercises.findIndex((e) => e.exerciseId === change.exerciseId) : -1;

    switch (change.kind) {
      case "replace_exercise":
        if (index < 0) return { error: `${nameOf(change.exerciseId)} isn't in ${session.name} any more.` };
        next = replaceExercise(next, session.id, index, change.toExerciseId);
        // A different movement starts by finding its own working weight: 80 kg
        // on a barbell bench isn't 80 kg of dumbbells.
        next = updateExercise(next, session.id, index, { targetWeightKg: null });
        break;
      case "add_exercise":
        next = addExercise(next, session.id, change.exerciseId);
        break;
      case "remove_exercise":
        if (index < 0) return { error: `${nameOf(change.exerciseId)} isn't in ${session.name} any more.` };
        next = removeExercise(next, session.id, index);
        break;
      case "update_exercise": {
        if (index < 0) return { error: `${nameOf(change.exerciseId)} isn't in ${session.name} any more.` };
        const patch: ExercisePatch = {};
        if (change.sets !== undefined) patch.sets = change.sets;
        if (change.repMin !== undefined) patch.repMin = change.repMin;
        if (change.repMax !== undefined) patch.repMax = change.repMax;
        if (change.restSeconds !== undefined) patch.restSeconds = change.restSeconds;
        if (change.targetWeightKg !== undefined) patch.targetWeightKg = change.targetWeightKg;
        next = updateExercise(next, session.id, index, patch);
        break;
      }
      case "move_session":
        next = moveSession(next, session.id, change.weekday);
        break;
    }
  }
  return { plan: { ...next, editedByHand: true } };
}

function nameOf(id: string): string {
  return EXERCISES_BY_ID[id]?.name ?? id;
}

/** Each change as a line a person can check before tapping Apply. */
export function describeChanges(plan: Plan, changes: PlanChange[]): string[] {
  const after = applyChanges(plan, changes);
  const result = "plan" in after ? after.plan : plan;
  return changes.map((change) => {
    const session = plan.sessions.find((s) => s.id === change.sessionId);
    const where = session ? `${session.name} (${WEEKDAY_LABELS[session.weekday]})` : "Your plan";
    switch (change.kind) {
      case "replace_exercise":
        return `${where}: ${nameOf(change.exerciseId)} → ${nameOf(change.toExerciseId)}`;
      case "add_exercise": {
        const added = result.sessions
          .find((s) => s.id === change.sessionId)
          ?.exercises.find((e) => e.exerciseId === change.exerciseId);
        return `${where}: add ${nameOf(change.exerciseId)}${added ? `, ${targetLabel(added)}` : ""}`;
      }
      case "remove_exercise":
        return `${where}: remove ${nameOf(change.exerciseId)}`;
      case "update_exercise": {
        const updated = result.sessions
          .find((s) => s.id === change.sessionId)
          ?.exercises.find((e) => e.exerciseId === change.exerciseId);
        return `${where}: ${nameOf(change.exerciseId)} → ${updated ? targetLabel(updated) : "new targets"}`;
      }
      case "move_session":
        return `${where} moves to ${WEEKDAY_LABELS[change.weekday]}`;
    }
  });
}

/** Whether the plan is still exactly what applying this proposal made it, so Undo is safe. */
export function canUndo(proposal: PlanProposal, current: Plan | null): boolean {
  if (proposal.state !== "applied" || !proposal.after || !proposal.before || !current) return false;
  return JSON.stringify(current.sessions) === JSON.stringify(proposal.after.sessions);
}

/** How a proposal reads in the history sent back to the coach, so it knows what came of it. */
export function proposalNote(proposal: PlanProposal): string {
  const outcome = {
    pending: "they haven't answered yet",
    applied: "they applied it",
    declined: "they said no thanks",
    undone: "they applied it, then undid it",
  }[proposal.state];
  return `[I proposed a plan change: ${proposal.summary}. Outcome: ${outcome}.]`;
}
