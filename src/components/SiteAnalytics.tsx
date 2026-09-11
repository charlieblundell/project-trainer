"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

/** Where a visit came from: a shared invite link, or a tagged post. Nothing personal. */
const KEPT_PARAMS = ["ref", "utm_source", "utm_medium", "utm_campaign"];

/**
 * Anonymous page-view counts from Vercel. Page addresses are sent with only the
 * source tags above: the sign-in callback carries one-time codes and tokens in
 * its query string and hash, and analytics has no business seeing them.
 */
function withoutPrivateParts(event: BeforeSendEvent): BeforeSendEvent {
  const url = new URL(event.url);
  const kept = new URLSearchParams();
  for (const key of KEPT_PARAMS) {
    const value = url.searchParams.get(key);
    if (value) kept.set(key, value.slice(0, 60));
  }
  url.search = kept.toString();
  url.hash = "";
  return { ...event, url: url.toString() };
}

export function SiteAnalytics() {
  return <Analytics beforeSend={withoutPrivateParts} />;
}
