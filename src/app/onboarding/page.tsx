"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Dumbbell,
  Flame,
  Zap,
  Activity,
  Wind,
  HeartPulse,
  Sprout,
  TrendingUp,
  Trophy,
  Building2,
  Home,
  House,
  Trees,
  Shuffle,
  type LucideIcon,
} from "lucide-react";
import { clsx } from "@/lib/clsx";
import { useAppStore } from "@/lib/store";
import { GOALS, EXPERIENCE_OPTIONS, DAY_OPTIONS, LENGTH_OPTIONS, ENVIRONMENTS } from "@/lib/data";

type StepKey = "goal" | "experience" | "days" | "length" | "environment";

const ICONS: Record<string, LucideIcon> = {
  "Build muscle": Dumbbell,
  "Lose fat": Flame,
  "Get stronger": Zap,
  "Improve fitness": Activity,
  "Improve endurance": Wind,
  "General health": HeartPulse,
  "I'm new to training": Sprout,
  "I've been training a while": TrendingUp,
  "I've trained consistently for years": Trophy,
  "Full gym": Building2,
  "Home gym": Home,
  Home: House,
  Outdoor: Trees,
  Mixed: Shuffle,
};

export default function Onboarding() {
  const router = useRouter();
  const onboarding = useAppStore((s) => s.onboarding);
  const setOnboarding = useAppStore((s) => s.setOnboarding);
  const [step, setStep] = useState(0);

  const steps: { key: StepKey; question: string; options: string[]; value: string | null }[] = [
    { key: "goal", question: "What's your main goal?", options: GOALS, value: onboarding.goal },
    {
      key: "experience",
      question: "How experienced are you?",
      options: EXPERIENCE_OPTIONS,
      value: onboarding.experience,
    },
    {
      key: "days",
      question: "How often can you train?",
      options: DAY_OPTIONS.map((d) => `${d} days`),
      value: onboarding.days ? `${onboarding.days} days` : null,
    },
    {
      key: "length",
      question: "How long do you usually have?",
      options: LENGTH_OPTIONS.map((l) => `${l} min`),
      value: onboarding.length ? `${onboarding.length} min` : null,
    },
    {
      key: "environment",
      question: "Where do you train?",
      options: ENVIRONMENTS,
      value: onboarding.environment,
    },
  ];

  const current = steps[step];

  function select(option: string) {
    if (current.key === "days") setOnboarding({ days: parseInt(option, 10) });
    else if (current.key === "length") setOnboarding({ length: parseInt(option, 10) });
    else setOnboarding({ [current.key]: option });
  }

  function next() {
    if (step < steps.length - 1) setStep(step + 1);
    else router.push("/generating");
  }

  function back() {
    if (step === 0) router.push("/signup");
    else setStep(step - 1);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col px-6 py-10">
      <button onClick={back} className="mb-6 w-fit text-muted">
        <ChevronLeft size={20} />
      </button>

      <div className="mb-8 flex gap-1.5">
        {steps.map((_, i) => (
          <div
            key={i}
            className={clsx(
              "h-1.5 rounded-full transition-all",
              i === step ? "w-5 bg-ink" : "w-1.5",
              i <= step ? "bg-ink" : "bg-line"
            )}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.2 }}
        >
          <h1 className="mb-6 font-display text-2xl font-bold text-ink">{current.question}</h1>

          <div className="flex flex-col gap-2.5">
            {current.options.map((opt, i) => {
              const selected = current.value === opt;
              const Icon = ICONS[opt];
              return (
                <motion.button
                  key={opt}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => select(opt)}
                  className={clsx(
                    "flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm font-medium",
                    selected ? "border-ink bg-ink text-background" : "border-line bg-surface text-ink"
                  )}
                >
                  {Icon && (
                    <span
                      className={clsx(
                        "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
                        selected ? "bg-background/15" : "bg-accent-soft"
                      )}
                    >
                      <Icon size={16} className={selected ? "text-background" : "text-accent"} />
                    </span>
                  )}
                  {opt}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <button
        disabled={!current.value}
        onClick={next}
        className="mt-8 w-full rounded-2xl bg-ink py-4 text-[15px] font-semibold text-background transition disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
      >
        Continue
      </button>
    </div>
  );
}
