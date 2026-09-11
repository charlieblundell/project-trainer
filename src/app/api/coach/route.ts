import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { displayName } from "@/lib/displayName";
import {
  WEEKDAY_LABELS,
  WEEKDAY_ORDER,
  exerciseName,
  targetLabel,
  todayWeekday,
} from "@/lib/plan/helpers";
import type { Plan } from "@/lib/plan/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { EQUIPMENT_LABELS, EXERCISES_BY_ID, type Equipment } from "@/lib/exercises";
import { claimsIndex, detailFor, relevantFindings } from "@/lib/evidence";
import type { SetLog } from "@/lib/types";

/** Reads the user's newest plan through their own token, so RLS still applies. */
async function loadPlanForUser(client: SupabaseClient, userId: string): Promise<Plan | null> {
  const { data } = await client
    .from("plans")
    .select("data")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.data as Plan) ?? null;
}

function namesFor(ids: string[] | null | undefined): string {
  if (!ids?.length) return "";
  return ids.map((id) => EXERCISES_BY_ID[id]?.name ?? id).join(", ");
}

const anthropic = new Anthropic();

type IncomingMessage = { role: "user" | "assistant"; text: string };

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const messages: IncomingMessage[] = Array.isArray(body?.messages) ? body.messages : [];
  if (messages.length === 0) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  const { data: recentSessions } = await supabase
    .from("workout_sessions")
    .select("workout_id, logged_sets, completed_at")
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false })
    .limit(5);

  const plan = await loadPlanForUser(supabase, user.id);
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
    "The plan below is already built for them - when they ask what they are doing today, tell them what today's session is; do not offer to build one from scratch.",
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

  const apiMessages: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.text,
  }));

  try {
    const response = await anthropic.messages.create({
      model: "claude-opus-5",
      max_tokens: 1024,
      system: systemPrompt,
      output_config: { effort: "low" },
      messages: apiMessages,
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json({
        reply: "I can't help with that one — let's talk about your training instead.",
      });
    }

    const textBlock = response.content.find((b) => b.type === "text");
    return NextResponse.json({
      reply: textBlock?.text ?? "Sorry, I couldn't put together an answer just now.",
    });
  } catch (err) {
    console.error("Coach API error:", err);
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: "Coach is misconfigured (bad API key)." }, { status: 500 });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "Coach is busy right now — try again in a moment." }, { status: 429 });
    }
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ error: "Coach service error." }, { status: 502 });
    }
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
