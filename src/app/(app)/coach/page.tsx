"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { History, Send, SquarePen, Trash2, X } from "lucide-react";
import { COACH_PROMPTS } from "@/lib/data";
import { chatUsed, useAppStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/analytics";
import { useOnline } from "@/lib/offline/network";
import { proposalNote, type PlanProposal } from "@/lib/plan/proposal";
import { ProposalCard } from "@/components/ProposalCard";
import type { Chat, ChatMessage } from "@/lib/types";

/** A stable empty list, so effects keyed on the messages don't run every render. */
const NO_MESSAGES: ChatMessage[] = [];

/** The server's limit on one message, which a proposal note mustn't push past. */
const MAX_MESSAGE_CHARS = 2000;

/** What the coach is sent: the words, plus what came of any change it proposed. */
function forTheCoach(messages: ChatMessage[]) {
  return messages.map((m) => ({
    role: m.role,
    text: (m.proposal ? `${m.text}\n\n${proposalNote(m.proposal)}` : m.text).slice(0, MAX_MESSAGE_CHARS),
  }));
}

function CoachBody() {
  const router = useRouter();
  const params = useSearchParams();
  const chats = useAppStore((s) => s.chats);
  const addMessage = useAppStore((s) => s.addMessage);
  const updateMessage = useAppStore((s) => s.updateMessage);
  const newChat = useAppStore((s) => s.newChat);
  const startDayIfNeeded = useAppStore((s) => s.startDayIfNeeded);
  const active = chats[chats.length - 1];
  const messages = active?.messages ?? NO_MESSAGES;
  // A question from an "Ask the coach" link elsewhere in the app.
  const [input, setInput] = useState(() => params.get("ask")?.slice(0, MAX_MESSAGE_CHARS) ?? "");
  const [loading, setLoading] = useState(false);
  const [showPast, setShowPast] = useState(false);
  // The coach's answers come from the server; there's nothing to ask it offline.
  const online = useOnline();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasPlan = useAppStore((s) => s.plan !== null);

  // A new day, a new chat: yesterday's is kept under Past chats.
  useEffect(() => startDayIfNeeded(), [startDayIfNeeded]);

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
    if (!online || loading) return;
    const nextMessages = forTheCoach([...messages, { role: "user", text }]);
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
      const data = (await res.json()) as { reply?: string; error?: string; proposal?: PlanProposal | null };
      addMessage({
        role: "assistant",
        text: data.reply ?? data.error ?? "Sorry, I couldn't put together an answer just now.",
        ...(data.proposal ? { proposal: data.proposal } : {}),
      });
    } catch {
      addMessage({ role: "assistant", text: "I couldn't reach the coach right now — try again in a moment." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col md:h-[calc(100vh-5rem)]">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-title2 font-bold text-ink">Your Coach</h1>
        {/* Not while an answer is on its way: it belongs to the chat it was asked in. */}
        <div className="-mr-2 flex">
          <button
            onClick={() => setShowPast(true)}
            disabled={loading}
            aria-label="Past chats"
            className="flex h-11 w-11 items-center justify-center rounded-full text-accent disabled:text-faint"
          >
            <History size={21} strokeWidth={2} />
          </button>
          <button
            onClick={newChat}
            disabled={loading || !active || !chatUsed(active)}
            aria-label="New chat"
            className="flex h-11 w-11 items-center justify-center rounded-full text-accent disabled:text-faint"
          >
            <SquarePen size={20} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto pb-4">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={`${active?.id}-${i}`}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 40 }}
              className={`flex flex-col gap-2 ${m.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-line rounded-[20px] px-4 py-2.5 text-body leading-relaxed ${
                  m.role === "user" ? "bg-accent text-accent-ink" : "bg-surface text-ink"
                }`}
              >
                {m.text}
              </div>
              {m.proposal && (
                <ProposalCard proposal={m.proposal} onChange={(proposal) => updateMessage(i, { proposal })} />
              )}
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
          maxLength={MAX_MESSAGE_CHARS}
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

      <AnimatePresence>{showPast && <PastChats onClose={() => setShowPast(false)} />}</AnimatePresence>
    </div>
  );
}

/** What a chat was about: its first question. */
function chatTitle(chat: Chat): string {
  const first = chat.messages.find((m) => m.role === "user")?.text ?? "New chat";
  return first.length > 60 ? `${first.slice(0, 57)}…` : first;
}

function chatDate(chat: Chat): string {
  const when = new Date(chat.updatedAt);
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (when.toDateString() === today.toDateString()) return "Today";
  if (when.toDateString() === yesterday.toDateString()) return "Yesterday";
  return when.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

/** Earlier chats, newest first, kept on this phone. */
function PastChats({ onClose }: { onClose: () => void }) {
  const chats = useAppStore((s) => s.chats);
  const openChat = useAppStore((s) => s.openChat);
  const deleteChat = useAppStore((s) => s.deleteChat);
  const deleteAllChats = useAppStore((s) => s.deleteAllChats);
  const [confirmAll, setConfirmAll] = useState(false);
  const active = chats[chats.length - 1];
  const past = chats.filter(chatUsed).reverse();

  return (
    <motion.div
      className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 md:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Past chats"
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-t-[24px] bg-background px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-2 md:rounded-[24px]"
        initial={{ y: 48 }}
        animate={{ y: 0 }}
        exit={{ y: 48 }}
        transition={{ type: "spring", stiffness: 420, damping: 38 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-2 h-[5px] w-9 rounded-full bg-fill-strong" aria-hidden />
        <div className="mb-1 flex items-start justify-between gap-3">
          <h2 className="pt-1 text-title2 font-bold text-ink">Past chats</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-muted"
          >
            <X size={20} />
          </button>
        </div>
        <p className="mb-4 text-footnote text-muted">A new chat starts each day. These stay on this phone only.</p>

        {past.length === 0 ? (
          <p className="rounded-[14px] bg-surface px-4 py-3.5 text-subhead text-muted">Nothing yet.</p>
        ) : (
          <ul className="overflow-hidden rounded-[14px] bg-surface">
            {past.map((chat, i) => (
              <li key={chat.id} className={`flex items-center ${i > 0 ? "border-t border-line/40" : ""}`}>
                <button
                  onClick={() => {
                    openChat(chat.id);
                    onClose();
                  }}
                  className="flex min-h-[56px] min-w-0 flex-1 flex-col justify-center px-4 py-2 text-left"
                >
                  <span className="truncate text-body text-ink">{chatTitle(chat)}</span>
                  <span className="text-footnote text-muted">
                    {chatDate(chat)}
                    {chat.id === active?.id ? " · open now" : ""}
                  </span>
                </button>
                <button
                  onClick={() => deleteChat(chat.id)}
                  aria-label={`Delete chat: ${chatTitle(chat)}`}
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center text-muted"
                >
                  <Trash2 size={17} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {past.length > 0 &&
          (confirmAll ? (
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setConfirmAll(false)}
                className="press min-h-[44px] flex-1 rounded-[12px] bg-fill text-body font-semibold text-ink"
              >
                Keep them
              </button>
              <button
                onClick={() => {
                  deleteAllChats();
                  onClose();
                }}
                className="press min-h-[44px] flex-1 rounded-[12px] bg-surface text-body font-semibold text-warning shadow-card"
              >
                Delete all
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmAll(true)}
              className="mt-4 min-h-[44px] w-full text-body text-warning"
            >
              Delete all chats
            </button>
          ))}
      </motion.div>
    </motion.div>
  );
}

export default function Coach() {
  return (
    <Suspense fallback={null}>
      <CoachBody />
    </Suspense>
  );
}
