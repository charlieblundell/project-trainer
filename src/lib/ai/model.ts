import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

/*
 * One way of calling the model for every feature that uses it, so they share
 * a model, the refusal fallback, and the same plain-words errors when
 * something goes wrong.
 */

const anthropic = new Anthropic();

const MODEL = "claude-opus-5";

/**
 * If the model declines a request on policy grounds, the API re-runs it on a
 * fallback model inside the same call rather than the person getting nothing.
 */
const FALLBACK = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };

type Ask = {
  system: string;
  messages: Anthropic.Beta.BetaMessageParam[];
  maxTokens: number;
};

/** A written answer, or null if the whole chain declined. */
export async function askText({ system, messages, maxTokens }: Ask): Promise<string | null> {
  const response = await anthropic.beta.messages.create({
    ...FALLBACK,
    model: MODEL,
    max_tokens: maxTokens,
    system,
    output_config: { effort: "low" },
    messages,
  });
  if (response.stop_reason === "refusal") return null;
  const text = response.content.find((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")?.text;
  return text?.trim() || null;
}

/**
 * A written answer, plus any tool the model chose to call alongside it. The
 * tools here are proposals the app checks and shows, never actions taken, so
 * there's no loop: the call is read, not run.
 */
export async function askWithTools({
  system,
  messages,
  maxTokens,
  tools,
}: Ask & { tools: Anthropic.Beta.BetaTool[] }): Promise<{ text: string | null; calls: { name: string; input: unknown }[] } | null> {
  const response = await anthropic.beta.messages.create({
    ...FALLBACK,
    model: MODEL,
    max_tokens: maxTokens,
    system,
    output_config: { effort: "low" },
    tools,
    messages,
  });
  if (response.stop_reason === "refusal") return null;
  const text = response.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  const calls = response.content
    .filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use")
    .map((b) => ({ name: b.name, input: b.input }));
  return { text: text || null, calls };
}

/**
 * An answer in a fixed shape, or null if it declined or didn't fit. The
 * schema constrains the model; the caller still validates every field,
 * because what comes back is only trusted as far as the code checks it.
 */
export async function askJson<T>({ system, messages, maxTokens, schema }: Ask & { schema: Record<string, unknown> }): Promise<T | null> {
  const response = await anthropic.beta.messages.create({
    ...FALLBACK,
    model: MODEL,
    max_tokens: maxTokens,
    system,
    output_config: { effort: "low", format: { type: "json_schema", schema } },
    messages,
  });
  if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") return null;
  const text = response.content.find((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")?.text;
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/** What to tell the browser when the model couldn't be reached at all. */
export function modelErrorResponse(err: unknown, what = "Your coach"): NextResponse {
  console.error("Model call failed:", err);
  if (err instanceof Anthropic.AuthenticationError) {
    return NextResponse.json({ error: "Coach is misconfigured (bad API key)." }, { status: 500 });
  }
  if (err instanceof Anthropic.RateLimitError) {
    return NextResponse.json({ error: "Coach is busy right now — try again in a moment." }, { status: 429 });
  }
  // Includes the monthly spend cap being reached on the Anthropic account.
  if (err instanceof Anthropic.APIError) {
    return NextResponse.json(
      { error: `${what} isn't available right now. Try again later — the rest of the app works as normal.` },
      { status: 502 }
    );
  }
  return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
}
