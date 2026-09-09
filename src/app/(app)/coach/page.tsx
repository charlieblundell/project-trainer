"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send } from "lucide-react";
import { COACH_PROMPTS } from "@/lib/data";
import { useAppStore } from "@/lib/store";
import { fakeCoachReply } from "@/lib/fakeCoach";

export default function Coach() {
  const messages = useAppStore((s) => s.messages);
  const addMessage = useAppStore((s) => s.addMessage);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function send(text: string) {
    addMessage({ role: "user", text });
    setInput("");
    setLoading(true);
    setTimeout(() => {
      addMessage({ role: "assistant", text: fakeCoachReply(text) });
      setLoading(false);
    }, 600);
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col md:h-[calc(100vh-5rem)]">
      <h1 className="mb-4 font-display text-xl font-bold text-ink">Your Coach</h1>

      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto pb-4">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 40 }}
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "self-end bg-ink text-background"
                  : "self-start border border-line bg-surface text-ink"
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
            className="flex items-center gap-1 self-start rounded-2xl border border-line bg-surface px-4 py-3"
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

      {messages.length <= 1 && (
        <div className="mb-3.5 flex flex-wrap gap-2">
          {COACH_PROMPTS.map((p, i) => (
            <motion.button
              key={p}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => send(p)}
              className="rounded-full border border-line bg-surface px-3.5 py-2 text-xs text-ink"
            >
              {p}
            </motion.button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.trim()) send(input.trim());
          }}
          placeholder="Ask your coach..."
          className="flex-1 rounded-full border border-line px-4 py-3 text-sm"
        />
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => input.trim() && send(input.trim())}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-ink"
        >
          <Send size={17} className="text-background" />
        </motion.button>
      </div>
    </div>
  );
}
