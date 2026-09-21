import { NextRequest, NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { askText, modelErrorResponse } from "@/lib/ai/model";
import { displayName } from "@/lib/displayName";
import {
  WEEKDAY_LABELS,
  WEEKDAY_ORDER,
  exerciseName,
  targetLabel,
  todayWeekday,
} from "@/lib/plan/helpers";
import type { Plan } from "@/lib/plan/types";
import { EQUIPMENT_LABELS, EXERCISES_BY_ID, type Equipment } from "@/lib/exercises";
import { claimsIndex, detailFor, relevantFindings } from "@/lib/evidence";
import { authorize, loadPlanForUser, recordUsage } from "@/lib/ai/gate";
import type { SetLog } from "@/lib/types";

function namesFor(ids: string[] | null | undefined): string {
  if (!ids?.length) return "";
  return ids.map((id) => EXERCISES_BY_ID[id]?.name ?? id).join(", ");
}

type IncomingMessage = { role: "user" | "assistant"; text: string };

/** Enough history for a real conversation; older turns stop being useful context. */
const MAX_MESSAGES = 20;
/** A long question fits easily; a pasted novel does not. */
const MAX_MESSAGE_CHARS = 2000;

/**
 * The browser sends whatever it likes, so nothing in the body is trusted:
 * unknown roles, non-string text, oversized text and oversized histories are
 * all rejected or trimmed here, before any of it reaches the model.
 */
function parseMessages(body: unknown): IncomingMessage[] | null {
  const raw = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(raw)) return null;

  const valid: IncomingMessage[] = [];
  for (const item of raw) {
    const role = (item as { role?: unknown })?.role;
    const text = (item as { text?: unknown })?.text;
    if (role !== "user" && role !== "assistant") return null;
    if (typeof text !== "string" || text.trim().length === 0) return null;
    if (text.length > MAX_MESSAGE_CHARS) return null;
    valid.push({ role, text });
  }

  const recent = valid.slice(-MAX_MESSAGES);
  // Trimming can leave the history opening on a coach reply; a conversation
  // sent to the model should start with something the person said.
  while (recent.length > 0 && recent[0].role === "assistant") recent.shift();
  if (recent.length === 0 || recent[recent.length - 1].role !== "user") return null;
  return recent;
}

export async function POST(req: NextRequest) {
  const auth = await authorize(req);
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const messages = parseMessages(body);
  if (!messages) {
    return NextResponse.json(
      { error: `Messages must be under ${MAX_MESSAGE_CHARS} characters.` },
      { status: 400 }
    );
  }

  const refused = await recordUsage(supabase, user.id);
  if (refused) return refused.response;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  const { data: recentSessions } = await supabase
    .from("workout_sessions")
    .select("workout_id, logged_sets, completed_at")
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false })
    .limit(5);

  const plan = await loadPlanForUser<Plan>(supabase, user.id);
  const planSessionsById = new Map((plan?.sessions ?? []).map((s) => [s.id, s]));

  const historySummary = (recentSessions ?? [])
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

  const planNotes = plan?.notes.length
    ? plan.notes.map((n) => `- ${n}`).join("\n")
    : "None.";

  // The last thing they said is what the retrieval should answer; earlier turns
  // drag in vocabulary from topics that have already moved on.
  const latestQuestion = [...messages].reverse().find((m) => m.role === "user")?.text ?? "";
  const relevant = relevantFindings(latestQuestion);

  const systemPrompt = [
    "You are the in-app AI coach for a fitness app called Your Personal Trainer.",
    "Answer in a warm, direct, conversational voice, 2-4 sentences unless asked for more detail.",
    "Use the athlete's real profile, plan and training history below rather than asking them to repeat information.",
    plan
      ? "The plan below is already built for them - when they ask what they are doing today, tell them what today's session is; do not offer to build one from scratch."
      : "They haven't built their plan yet. The app builds it from a few quick questions - the 'Build my plan' button on Home - so point them there rather than writing out a full program in chat. You can still answer general questions.",
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
    `- Name: ${displayName(user)}`,
    `- Goal: ${profile?.goal ?? "not set yet"}`,
    `- Experience: ${profile?.experience ?? "not set yet"}`,
    `- Trains ${profile?.days ?? "an unknown number of"} days/week, ~${profile?.length ?? "an unknown"} min/session`,
    `- Trains at: ${profile?.environment ?? "not set yet"}`,
    `- Equipment available: ${
      profile?.equipment?.length
        ? profile.equipment.map((e: string) => EQUIPMENT_LABELS[e as Equipment] ?? e).join(", ")
        : "not specified"
    }`,
    `- Enjoys: ${namesFor(profile?.liked_exercises) || "nothing specified"}`,
    `- Wants to avoid: ${namesFor(profile?.disliked_exercises) || "nothing specified"}`,
    profile?.bodyweight_kg ? `- Bodyweight: ${profile.bodyweight_kg} kg` : null,
    profile?.age ? `- Age: ${profile.age}` : null,
    "",
    "Notes they gave about injuries or limitations (treat as constraints on programming, never as something to diagnose):",
    profile?.considerations?.trim() || "None given.",
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
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  const apiMessages: Anthropic.Beta.BetaMessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.text,
  }));

  try {
    const reply = await askText({ system: systemPrompt, messages: apiMessages, maxTokens: 1024 });
    return NextResponse.json({
      reply: reply ?? "I can't help with that one — let's talk about your training instead.",
    });
  } catch (err) {
    return modelErrorResponse(err);
  }
}
