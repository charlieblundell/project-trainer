"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

/**
 * Anonymous page-view counts from Vercel. Page addresses are sent without
 * their query string or hash, because the sign-in callback carries one-time
 * codes and tokens there, and analytics has no business seeing them.
 */
function withoutQueryOrHash(event: BeforeSendEvent): BeforeSendEvent {
  const url = new URL(event.url);
  url.search = "";
  url.hash = "";
  return { ...event, url: url.toString() };
}

export function SiteAnalytics() {
  return <Analytics beforeSend={withoutQueryOrHash} />;
}
