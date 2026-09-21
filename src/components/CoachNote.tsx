"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { AskCoachLink } from "@/components/AskCoachLink";
import { clsx } from "@/lib/clsx";

/**
 * A few lines from the coach, written for this moment. It's an extra: while
 * it's being written the card shows its shape, and if it can't be written
 * (offline, out of allowance, anything) the card simply isn't there.
 *
 * Kept on the device under `cacheKey`, so going back and forth doesn't ask
 * again, and so doesn't spend their allowance again.
 */
export function CoachNote({
  cacheKey,
  load,
  title = "From your coach",
  followUp,
  className,
}: {
  cacheKey: string;
  load: () => Promise<string | null>;
  title?: string;
  followUp?: string;
  className?: string;
}) {
  const [note, setNote] = useState<string | null | undefined>(() => cached(cacheKey));

  useEffect(() => {
    if (cached(cacheKey) !== undefined) return;
    let cancelled = false;
    // One request per note, however many times the effect runs: each costs allowance.
    let request = inflight.get(cacheKey);
    if (!request) {
      request = load().then((text) => {
        if (text) remember(cacheKey, text);
        return text;
      });
      inflight.set(cacheKey, request);
      request.finally(() => inflight.delete(cacheKey));
    }
    request.then((text) => {
      if (!cancelled) setNote(text);
    });
    return () => {
      cancelled = true;
    };
    // `load` is a fresh function each render; the key is what identifies the note.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  if (note === null) return null;

  return (
    <section
      aria-label={title}
      aria-busy={note === undefined}
      className={clsx("rounded-[20px] bg-surface p-4 shadow-card", className)}
    >
      <h2 className="mb-2 flex items-center gap-2 text-footnote font-semibold text-muted">
        <span
          aria-hidden
          className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-[#1c7a34] text-white"
        >
          <MessageCircle size={14} strokeWidth={2.4} />
        </span>
        {title}
      </h2>
      {note === undefined ? (
        <div className="flex flex-col gap-2 py-1" aria-hidden>
          {[92, 100, 64].map((w, i) => (
            <motion.div
              key={i}
              className="h-3.5 rounded-full bg-fill"
              style={{ width: `${w}%` }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      ) : (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="whitespace-pre-line text-subhead leading-relaxed text-ink"
        >
          {note}
        </motion.p>
      )}
      {note && followUp && <AskCoachLink className="mt-1" label="Ask a follow-up" question={followUp} />}
    </section>
  );
}

/**
 * Notes are kept on this device, a handful at a time, so reopening a screen
 * doesn't ask the coach (and spend their allowance) again.
 */
const STORE_KEY = "coach-notes";
const inflight = new Map<string, Promise<string | null>>();
const KEEP = 12;

function readAll(): [string, string][] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function cached(key: string): string | undefined {
  return readAll().find(([k]) => k === key)?.[1];
}

function remember(key: string, text: string) {
  try {
    const rest = readAll().filter(([k]) => k !== key);
    window.localStorage.setItem(STORE_KEY, JSON.stringify([[key, text], ...rest].slice(0, KEEP)));
  } catch {
    // Private mode or full storage: it'll just be written again next time.
  }
}
