import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { WORKOUTS, PLAN_WEEK, todaysWorkoutId } from "@/lib/data";
import { displayName } from "@/lib/displayName";
import { EQUIPMENT_LABELS, EXERCISES_BY_ID, type Equipment } from "@/lib/exercises";
import type { SetLog } from "@/lib/types";

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

  const historySummary = (recentSessions ?? [])
    .map((s: { workout_id: string; logged_sets: Record<string, SetLog[]>; completed_at: string }) => {
      const workout = WORKOUTS[s.workout_id];
      const name = workout?.displayName ?? s.workout_id;
      const setCount = Object.values(s.logged_sets ?? {}).reduce(
        (sum: number, arr: SetLog[]) => sum + arr.length,
        0
      );
      const date = new Date(s.completed_at).toLocaleDateString();
      return `- ${date}: ${name} (${setCount} sets logged)`;
    })
    .join("\n");

  const weekPlan = PLAN_WEEK.map((d) => {
    const suffix = d.today ? " (today)" : "";
    const mins = d.minutes ? ` ~${d.minutes} min` : "";
    return `- ${d.day}: ${d.label}${mins}${suffix}`;
  }).join("\n");

  const todayWorkout = WORKOUTS[todaysWorkoutId()];
  const todayDetail = todayWorkout
    ? todayWorkout.exercises
        .map((ex) => {
          const target =
            ex.targetWeight > 0
              ? `${ex.targetWeight} kg x ${ex.targetReps}`
              : `${ex.targetReps} reps`;
          return `- ${ex.name}: ${ex.sets} sets of ${target}`;
        })
        .join("\n")
    : "No workout scheduled.";

  const systemPrompt = [
    "You are the in-app AI coach for a fitness app called Your Personal Trainer.",
    "Answer in a warm, direct, conversational voice, 2-4 sentences unless asked for more detail.",
    "Use the athlete's real profile, plan and training history below rather than asking them to repeat information.",
    "The plan below is already built for them - when they ask what they are doing today, tell them what today's session is; do not offer to build one from scratch.",
    "Never diagnose injuries or medical conditions. If they mention pain, injury, or a medical concern, respond conservatively: suggest modifying or stopping the movement and seeing a qualified professional, and do not prescribe treatment.",
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
    `Today's session (${todayWorkout?.name ?? "rest"}):`,
    todayDetail,
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
