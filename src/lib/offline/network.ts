"use client";

import { useSyncExternalStore } from "react";

/**
 * Whether a failed request failed because there was no connection, rather
 * than because the server said no. Supabase doesn't throw on a dropped
 * connection; it hands back an error whose message is the browser's own
 * ("Failed to fetch" in Chrome, "Load failed" in Safari, "NetworkError" in
 * Firefox), with no status code.
 */
export function isNetworkError(error: { message?: string } | null | undefined): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  if (!error?.message) return false;
  return /failed to fetch|load failed|networkerror|network request failed|fetch failed/i.test(error.message);
}

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/** True while the phone says it has a connection. Server renders assume online. */
export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true
  );
}
