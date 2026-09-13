import posthog, { type CaptureResult } from "posthog-js";

/*
 * Product analytics with PostHog, so the question "of the people who came
 * from a post, how many built a plan, trained twice and paid?" has an answer.
 *
 * What it may see is decided here rather than left to defaults:
 * - Named events only. Autocapture is off, so nothing typed into a box, and no
 *   button or heading text (which can include exercise names or injury notes),
 *   is ever collected. Session replay is off.
 * - People are linked by their random account id, never email or name.
 * - Addresses keep only the source tags; the sign-in callback carries one-time
 *   codes and tokens in its query and hash, and those never leave the browser.
 *
 * Without NEXT_PUBLIC_POSTHOG_KEY (local development, tests) every call here
 * does nothing.
 */

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const KEPT_PARAMS = ["ref", "utm_source", "utm_medium", "utm_campaign", "utm_content"];

/** Every event the app sends. Adding one is a deliberate change to this list. */
export type AppEvent =
  | "plan_built"
  | "workout_started"
  | "workout_completed"
  | "coach_asked"
  | "invite_shared"
  | "checkout_started";

type Props = Record<string, string | number | boolean>;

let started = false;

function cleanUrl(value: string): string {
  try {
    const url = new URL(value);
    const kept = new URLSearchParams();
    for (const key of KEPT_PARAMS) {
      const v = url.searchParams.get(key);
      if (v) kept.set(key, v.slice(0, 60));
    }
    url.search = kept.toString();
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

function cleanProps(props: Record<string, unknown> | undefined) {
  if (!props) return;
  for (const [key, value] of Object.entries(props)) {
    if (typeof value === "string" && /url|referrer/i.test(key) && /^https?:/i.test(value)) {
      props[key] = cleanUrl(value);
    }
  }
}

function withoutPrivateParts(event: CaptureResult | null): CaptureResult | null {
  if (!event) return event;
  cleanProps(event.properties);
  cleanProps(event.$set);
  cleanProps(event.$set_once);
  return event;
}

export function startAnalytics() {
  if (!KEY || started || typeof window === "undefined") return;
  started = true;
  try {
    posthog.init(KEY, {
      // Sent through this app's own address (see next.config.ts) so blockers
      // aimed at analytics domains don't hide whole groups of people.
      api_host: "/ingest",
      ui_host: "https://eu.posthog.com",
      defaults: "2026-08-30",
      person_profiles: "identified_only",
      persistence: "localStorage",
      autocapture: false,
      disable_session_recording: true,
      capture_pageview: "history_change",
      capture_pageleave: true,
      before_send: withoutPrivateParts,
    });
  } catch {
    // Analytics must never be the reason the app doesn't load.
  }
}

export function track(event: AppEvent, props?: Props) {
  if (!started) return;
  try {
    posthog.capture(event, props);
  } catch {}
}

/** Links this browser's events to the account. The id is Supabase's random uuid. */
export function identify(userId: string) {
  if (!started) return;
  try {
    if (posthog.get_distinct_id() !== userId) posthog.identify(userId);
  } catch {}
}

/** On sign-out, so the next person on a shared device starts fresh. */
export function forget() {
  if (!started) return;
  try {
    posthog.reset();
  } catch {}
}
