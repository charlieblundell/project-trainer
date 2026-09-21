"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { Send } from "lucide-react";
import { COACH_PROMPTS } from "@/lib/data";
import { useAppStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/analytics";
import { useOnline } from "@/lib/offline/network";

function CoachBody() {
  const router = useRouter();
  const params = useSearchParams();
  const messages = useAppStore((s) => s.messages);
  const addMessage = useAppStore((s) => s.addMessage);
  // A question from an "Ask the coach" link elsewhere in the app.
  const [input, setInput] = useState(() => params.get("ask")?.slice(0, 2000) ?? "");
  const [loading, setLoading] = useState(false);
  // The coach's answers come from the server; there's nothing to ask it offline.
  const online = useOnline();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasPlan = useAppStore((s) => s.plan !== null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /*
   * Arriving from an "Ask the coach" link elsewhere in the app: the question
   * is waiting in the box, to send as it is or to make their own. It isn't
   * sent for them, so nothing is asked they didn't mean to ask. Taken out of
   * the address afterwards, or a reload would put it back.
   */
  const arrivedWithQuestion = params.has("ask");
  useEffect(() => {
    if (!arrivedWithQuestion) return;
    router.replace("/coach", { scroll: false });
    inputRef.current?.focus();
  }, [arrivedWithQuestion, router]);

  async function send(text: string) {
    if (!online) return;
    const nextMessages = [...messages, { role: "user" as const, text }];
    addMessage({ role: "user", text });
    setInput("");
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    // That a question was asked, never what it said.
    track("coach_asked");
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();
      addMessage({
        role: "assistant",
        text: data.reply ?? data.error ?? "Sorry, I couldn't put together an answer just now.",
      });
    } catch {
      addMessage({ role: "assistant", text: "I couldn't reach the coach right now — try again in a moment." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col md:h-[calc(100vh-5rem)]">
      <h1 className="mb-4 text-title2 font-bold text-ink">Your Coach</h1>

      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto pb-4">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 40 }}
              className={`max-w-[85%] rounded-[20px] px-4 py-2.5 text-body leading-relaxed ${
                m.role === "user"
                  ? "self-end bg-accent text-accent-ink"
                  : "self-start bg-surface text-ink"
              }`}
            >
              {m.text}
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1 self-start rounded-[20px] bg-surface shadow-card px-4 py-3"
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-muted"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </motion.div>
        )}
        <div ref={scrollRef} />
      </div>

      {!online && (
        <p role="status" className="mb-3 rounded-[14px] bg-fill px-4 py-3 text-subhead text-ink">
          The coach needs a connection. Your plan and workouts still work offline.
        </p>
      )}

      {!hasPlan && (
        <p className="mb-3 rounded-[14px] bg-surface px-4 py-3 text-subhead text-ink shadow-card">
          Your coach knows your plan and history, so it&apos;s most useful once you have one.{" "}
          <Link href="/onboarding" className="font-semibold text-accent">
            Build my plan
          </Link>
        </p>
      )}

      {online && messages.length <= 1 && !input && (
        <div className="mb-3.5 flex flex-wrap gap-2">
          {COACH_PROMPTS.map((p, i) => (
            <motion.button
              key={p}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => send(p)}
              className="min-h-[44px] rounded-full bg-surface px-4 text-subhead text-accent"
            >
              {p}
            </motion.button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          ref={inputRef}
          aria-label="Message your coach"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.trim()) send(input.trim());
          }}
          placeholder={online ? "Ask your coach..." : "Offline"}
          disabled={!online}
          // Matches the server's limit, so the box stops you rather than an error does.
          maxLength={2000}
          className="min-h-[44px] flex-1 rounded-full bg-surface px-4 text-body"
        />
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => input.trim() && send(input.trim())}
          disabled={!online}
          aria-label="Send"
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-accent disabled:bg-fill-strong"
        >
          <Send size={17} className="text-accent-ink" />
        </motion.button>
      </div>
    </div>
  );
}

export default function Coach() {
  return (
    <Suspense fallback={null}>
      <CoachBody />
    </Suspense>
  );
}
