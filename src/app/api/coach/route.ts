import { NextRequest, NextResponse } from "next/server";
import { modelErrorResponse } from "@/lib/ai/model";
import { askCoach } from "@/lib/ai/coach";
import { displayName } from "@/lib/displayName";
import type { Plan } from "@/lib/plan/types";
import { authorize, loadPlanForUser, recordUsage } from "@/lib/ai/gate";

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

  try {
    const answer = await askCoach({
      name: displayName(user),
      profile,
      plan,
      recentSessions: recentSessions ?? [],
      messages,
    });
    if (!answer) {
      return NextResponse.json({ reply: "I can't help with that one — let's talk about your training instead." });
    }
    return NextResponse.json(answer);
  } catch (err) {
    return modelErrorResponse(err);
  }
}
