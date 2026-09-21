"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CalendarDays, Dumbbell, MessageCircle, Play, TrendingUp, type LucideIcon } from "lucide-react";
import { Rise } from "@/components/Rise";
import { sessionBackground, sessionStyle } from "@/lib/sessionStyle";

/*
 * Home before there's a plan. New accounts land here rather than straight in
 * the setup questions, so this is their first look at the app: an example of
 * the card they'll see each day, a line on what each tab is for, and the way
 * into setup at the top and bottom.
 */

const EXAMPLE = { name: "Push", region: "upper" as const };
const EXAMPLE_EXERCISES = ["Bench press", "Overhead press", "Incline dumbbell press", "+2 more"];

const TOUR: { icon: LucideIcon; colour: string; title: string; body: string }[] = [
  {
    icon: Dumbbell,
    colour: "#0068e0",
    title: "Train",
    body: "Log each set as you go. When you hit the top of your reps, the weight goes up next time.",
  },
  {
    icon: CalendarDays,
    colour: "#6d3fd6",
    title: "Plan",
    body: "Your week, built around your goal, your kit and your days. Move a day or swap anything you like.",
  },
  {
    icon: TrendingUp,
    colour: "#bf4010",
    title: "Progress",
    body: "Strength trends and personal bests, worked out from what you actually lift.",
  },
  {
    icon: MessageCircle,
    colour: "#1c7a34",
    title: "Coach",
    body: "Ask anything, any time. It knows your plan and your history, so you never repeat yourself.",
  },
];

export function Welcome() {
  const style = sessionStyle(EXAMPLE);
  const Icon = style.icon;

  return (
    <div>
      <Rise>
        <section className="mb-6 rounded-[20px] bg-surface p-5 shadow-card" aria-labelledby="welcome-title">
          <h2 id="welcome-title" className="mb-1 text-title3 font-bold text-ink">
            Welcome in. Let&apos;s build your week.
          </h2>
          <p className="mb-4 text-subhead leading-relaxed text-muted">
            A few quick questions about your goal, your time and your equipment. About two minutes, and you can
            change any of it later.
          </p>
          <BuildPlanLink />
        </section>
      </Rise>

      <Rise order={1}>
        <h2 className="mb-2 px-1 text-footnote font-semibold text-muted">What Home looks like once you&apos;re set up</h2>
        {/* An example, not a real session: nothing on it can be pressed. */}
        <div
          aria-label="Example of today's workout card"
          className="relative mb-6 overflow-hidden rounded-[24px] p-5 text-white shadow-[0_14px_30px_-14px_rgba(0,0,0,0.45)]"
          style={sessionBackground(style)}
        >
          <Icon
            aria-hidden
            size={150}
            strokeWidth={1.4}
            className="pointer-events-none absolute -right-6 -top-5 text-white/10"
          />
          <div className="relative">
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-footnote font-semibold text-white">
              <Icon size={13} strokeWidth={2.4} aria-hidden />
              Example · Today
            </span>
            <div className="text-title1 font-bold">Push day</div>
            <div className="tabular mb-4 text-subhead text-white">5 exercises · ~50 min</div>
            <ul className="mb-5 flex flex-wrap gap-1.5" aria-label="Exercises">
              {EXAMPLE_EXERCISES.map((n) => (
                <li key={n} className="rounded-full bg-black/15 px-2.5 py-1 text-footnote font-medium text-white">
                  {n}
                </li>
              ))}
            </ul>
            <div
              aria-hidden
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[16px] bg-white/90 text-body font-semibold text-ink"
            >
              <Play size={16} fill="currentColor" />
              Start workout
            </div>
          </div>
        </div>
      </Rise>

      <Rise order={2}>
        <h2 className="mb-2 px-1 text-footnote font-semibold text-muted">How it works</h2>
        <ol className="mb-6 overflow-hidden rounded-[20px] bg-surface shadow-card">
          {TOUR.map((item, i) => (
            <motion.li
              key={item.title}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.06 }}
              className="flex gap-3.5 border-b border-line p-4 last:border-b-0"
            >
              <span
                aria-hidden
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[11px] text-white"
                style={{ backgroundColor: item.colour }}
              >
                <item.icon size={21} strokeWidth={2.2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-headline font-semibold text-ink">{item.title}</span>
                <span className="block text-subhead leading-snug text-muted">{item.body}</span>
              </span>
            </motion.li>
          ))}
        </ol>
      </Rise>

      <Rise order={3}>
        <BuildPlanLink />
        <p className="mt-2 text-center text-footnote text-muted">
          Already have a program? You can type in your own week at the end.
        </p>
      </Rise>
    </div>
  );
}

function BuildPlanLink() {
  return (
    <Link
      href="/onboarding"
      className="press flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[16px] bg-accent text-body font-semibold text-accent-ink"
    >
      Build my plan
      <ArrowRight size={18} strokeWidth={2.4} aria-hidden />
    </Link>
  );
}
