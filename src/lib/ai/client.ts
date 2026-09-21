import { supabase } from "@/lib/supabase";
import type { NotesReading } from "@/lib/plan/types";

/*
 * The browser's side of the AI features that aren't the chat: each one is an
 * extra, never something a screen waits on for long. Offline, slow or refused,
 * they return null and the screen carries on without them.
 */

/** Calls one of the app's AI endpoints as the signed-in user. */
export async function callAi<T>(path: string, body: unknown, timeoutMs = 20_000): Promise<T | null> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

/**
 * The coach's reading of someone's injury and health notes, for the plan
 * builder. Kept short: the plan is being built while they watch, and the
 * builder's own keyword match covers the common cases without it.
 */
export async function readNotes(notes: string | null): Promise<NotesReading | undefined> {
  if (!notes?.trim()) return undefined;
  const result = await callAi<{ reading?: NotesReading }>("/api/read-notes", { notes }, 8_000);
  return result?.reading;
}

/** A link to the coach with a question ready to send, which they can edit first. */
export function askCoachHref(question: string): string {
  return `/coach?ask=${encodeURIComponent(question)}`;
}
