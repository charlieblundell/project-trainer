import type Anthropic from "@anthropic-ai/sdk";
import { askWithTools } from "@/lib/ai/model";
import {
  WEEKDAY_LABELS,
  WEEKDAY_ORDER,
  exerciseName,
  targetLabel,
  todayWeekday,
} from "@/lib/plan/helpers";
import type { Plan } from "@/lib/plan/types";
import { EQUIPMENT_LABELS, EXERCISES_BY_ID, availableExercises, type Equipment } from "@/lib/exercises";
import { PROPOSE_TOOL, parseProposal, type PlanProposal } from "@/lib/plan/proposal";
import { claimsIndex, detailFor, relevantFindings } from "@/lib/evidence";
import type { SetLog } from "@/lib/types";

/*
 * What the coach is told, and what comes back. Kept apart from the endpoint
 * so the same prompt can be tried against the real model with sample data
 * (scripts/try-coach.ts) without signing anyone in.
 */

/** A profile row as the database returns it. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ProfileRow = Record<string, any>;

export type CoachContext = {
  name: string | null;
  profile: ProfileRow | null;
  plan: Plan | null;
  recentSessions: { workout_id: string; logged_sets: Record<string, SetLog[]>; completed_at: string }[];
  messages: { role: "user" | "assistant"; text: string }[];
};

function namesFor(ids: string[] | null | undefined): string {
  if (!ids?.length) return "";
  return ids.map((id) => EXERCISES_BY_ID[id]?.name ?? id).join(", ");
}

/** The coach's reply, and a plan change it proposed if one fits their plan. */
export async function askCoach(ctx: CoachContext): Promise<{ reply: string; proposal: PlanProposal | null } | null> {
  const plan = ctx.plan;
  const planSessionsById = new Map((plan?.sessions ?? []).map((s) => [s.id, s]));

  const historySummary = ctx.recentSessions
    .map((s: { workout_id: string; logged_sets: Record<string, SetLog[]>; completed_at: string }) => {
      const name = planSessionsById.get(s.workout_id)?.name ?? s.workout_id;
      const setCount = Object.values(s.logged_sets ?? {}).reduce(
        (sum: number, arr: SetLog[]) => sum + arr.length,
        0
      );
      const date = new Date(s.completed_at).toLocaleDateString();
      return `- ${date}: ${name} (${setCount} sets logged)`;
    })
    .join("\n");

  const today = todayWeekday();

  const weekPlan = plan
    ? WEEKDAY_ORDER.map((day) => {
        const s = plan.sessions.find((x) => x.weekday === day);
        const suffix = day === today ? " (today)" : "";
        return s
          ? `- ${WEEKDAY_LABELS[day]}: ${s.name} — ${s.focus}, ~${s.estMinutes} min${suffix}`
          : `- ${WEEKDAY_LABELS[day]}: Rest${suffix}`;
      }).join("\n")
    : "No plan generated yet.";

  const todaySession = plan?.sessions.find((s) => s.weekday === today) ?? null;
  const todayDetail = todaySession
    ? todaySession.exercises
        .map((ex) => `- ${exerciseName(ex)}: ${targetLabel(ex)}`)
        .join("\n")
    : "Rest day.";

  /*
   * The plan in full, with the ids the coach needs to propose a change, and
   * the exercises their equipment allows. A change can only name what's here;
   * anything else is refused before it reaches them.
   */
  const available = availableExercises(((ctx.profile?.equipment ?? []) as Equipment[]).concat("bodyweight"));
  const availableIds = new Set(available.map((ex) => ex.id));
  const disliked = new Set<string>(ctx.profile?.disliked_exercises ?? []);
  const planForChanges = plan
    ? plan.sessions
        .map((s) =>
          [
            `- session_id ${s.id}: ${s.name} on ${WEEKDAY_LABELS[s.weekday]}`,
            ...s.exercises.map((ex) => `    - exercise_id ${ex.exerciseId}: ${exerciseName(ex)}, ${targetLabel(ex)}, rest ${ex.restSeconds}s`),
          ].join("\n")
        )
        .join("\n")
    : "No plan yet, so nothing to change.";
  const availableList = available
    .map((ex) => `${ex.id}: ${ex.name} (${ex.pattern.replace("_", " ")}, level ${ex.level}${disliked.has(ex.id) ? ", they dislike it" : ""})`)
    .join("\n");

  const planNotes = plan?.notes.length
    ? plan.notes.map((n) => `- ${n}`).join("\n")
    : "None.";

  // The last thing they said is what the retrieval should answer; earlier turns
  // drag in vocabulary from topics that have already moved on.
  const latestQuestion = [...ctx.messages].reverse().find((m) => m.role === "user")?.text ?? "";
  const relevant = relevantFindings(latestQuestion);

  const systemPrompt = [
    "You are the in-app AI coach for a fitness app called Your Personal Trainer.",
    "Answer in a warm, direct, conversational voice, 2-4 sentences unless asked for more detail.",
    "Use the athlete's real profile, plan and training history below rather than asking them to repeat information.",
    plan
      ? "The plan below is already built for them - when they ask what they are doing today, tell them what today's session is; do not offer to build one from scratch."
      : "They haven't built their plan yet. The app builds it from a few quick questions - the 'Build my plan' button on Home - so point them there rather than writing out a full program in chat. You can still answer general questions.",
    "",
    "CHANGING THEIR PLAN",
    "You can change their weekly plan with the propose_plan_change tool. The app shows your proposal as a card with Apply and No thanks; nothing changes unless they tap Apply, and they can undo it. Use it when they ask for a change or agree to one you suggested - don't wait to be asked twice, and don't describe a change in words when you could propose it.",
    "Say in a sentence why the change suits them, and let the card show the details. Keep to their equipment, level and injury notes, and prefer exercises they don't dislike. A swapped-in exercise starts by finding its working weight, so don't invent one unless they give you a number.",
    "A change to today's workout only, like skipping a set, isn't a plan change: just advise them.",
    "",
    "Never diagnose injuries or medical conditions. If they mention pain, injury, or a medical concern, respond conservatively: suggest modifying or stopping the movement and seeing a qualified professional, and do not prescribe treatment.",
    "",
    "EVIDENCE",
    "You have a library of findings below, each checked against a real published source.",
    "Rules for using it:",
    "- Never contradict a finding in the index. If the athlete believes something it contradicts, say so kindly and briefly.",
    "- When a claim in the library is directly relevant, use its wording rather than improvising physiology.",
    "- Name the source only when they ask why, or push back, or the claim would otherwise sound like an opinion. One source is plenty; do not litter answers with citations.",
    "- Only cite sources listed in the detail section below. Never invent an author, year, journal or study, and never cite a paper from memory. If you have no source for something, say it is general practice rather than dressing it up as evidence.",
    "- Respect the strength rating. 'limited' means say it's thinly evidenced; 'strong' can be stated plainly.",
    "- Where a finding has a 'what it doesn't say' line, don't let your answer overreach it.",
    "",
    "Findings index (claim, with evidence strength):",
    claimsIndex(),
    "",
    relevant.length > 0
      ? "Full detail on the findings most relevant to what they just asked:"
      : "No findings matched this question directly - answer from the plan and profile, and don't cite anything.",
    relevant.length > 0 ? detailFor(relevant) : null,
    "",
    "Athlete profile:",
    `- Name: ${ctx.name}`,
    `- Goal: ${ctx.profile?.goal ?? "not set yet"}`,
    `- Experience: ${ctx.profile?.experience ?? "not set yet"}`,
    `- Trains ${ctx.profile?.days ?? "an unknown number of"} days/week, ~${ctx.profile?.length ?? "an unknown"} min/session`,
    `- Trains at: ${ctx.profile?.environment ?? "not set yet"}`,
    `- Equipment available: ${
      ctx.profile?.equipment?.length
        ? ctx.profile.equipment.map((e: string) => EQUIPMENT_LABELS[e as Equipment] ?? e).join(", ")
        : "not specified"
    }`,
    `- Enjoys: ${namesFor(ctx.profile?.liked_exercises) || "nothing specified"}`,
    `- Wants to avoid: ${namesFor(ctx.profile?.disliked_exercises) || "nothing specified"}`,
    ctx.profile?.bodyweight_kg ? `- Bodyweight: ${ctx.profile.bodyweight_kg} kg` : null,
    ctx.profile?.age ? `- Age: ${ctx.profile.age}` : null,
    "",
    "Notes they gave about injuries or limitations (treat as constraints on programming, never as something to diagnose):",
    ctx.profile?.considerations?.trim() || "None given.",
    "",
    "This week's plan:",
    weekPlan,
    "",
    `Today's session (${todaySession?.name ?? "rest day"}):`,
    todayDetail,
    "",
    "Decisions the plan generator made and why (mention these if asked why something is or isn't in the plan):",
    planNotes,
    "",
    "Recent completed workouts:",
    historySummary || "No workouts logged yet.",
    "",
    "Their plan with ids, for proposing changes:",
    planForChanges,
    "",
    "Exercises their equipment allows (id: name):",
    plan ? availableList : "Not needed until they have a plan.",
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  const apiMessages: Anthropic.Beta.BetaMessageParam[] = ctx.messages.map((m) => ({
    role: m.role,
    content: m.text,
  }));

  const answer = await askWithTools({
    system: systemPrompt,
    messages: apiMessages,
    maxTokens: 1500,
    tools: plan ? [PROPOSE_TOOL] : [],
  });
  if (!answer) return null;

  // Only a proposal that fits their actual plan and equipment reaches them.
  const call = answer.calls.find((c) => c.name === PROPOSE_TOOL.name);
  const proposal = call && plan ? parseProposal(call.input, plan, availableIds) : null;
  if (call && !proposal) console.error("Coach proposed a change that didn't fit the plan:", JSON.stringify(call.input));

  const reply =
    answer.text ??
    (proposal ? "Here's the change. Tap Apply if it looks right." : "Sorry, I couldn't put together an answer just now.");
  return {
    reply:
      call && !proposal
        ? `${reply}\n\n(I tried to change your plan, but the change didn't fit it, so nothing was changed. Try asking again.)`
        : reply,
    proposal,
  };
}
