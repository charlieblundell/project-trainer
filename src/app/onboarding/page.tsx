"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, Check } from "lucide-react";
import { clsx } from "@/lib/clsx";
import { useAppStore } from "@/lib/store";
import {
  EQUIPMENT_BY_ENVIRONMENT,
  availableExercises,
  searchExercises,
  type Equipment,
} from "@/lib/exercises";
import type { Weekday } from "@/lib/types";
import { CLEARED_HEALTH_FIELDS } from "@/lib/health-consent";
import {
  EquipmentPicker,
  ExercisePicker,
  NumberField,
  SexPicker,
  SingleSelect,
  WeekdayPicker,
  optionsFor,
  patchFor,
  toggleWeekday,
  valueFor,
} from "@/components/ProfileFields";

type StepKind = "single" | "multi" | "exercises" | "weekdays" | "consent" | "about" | "text";

/** Screens that collect health information, shown only with consent. */
const HEALTH_STEPS = new Set(["about", "considerations"]);

type Step = {
  key: string;
  kind: StepKind;
  question: string;
  hint?: string;
  optional?: boolean;
};

const STEPS: Step[] = [
  { key: "goal", kind: "single", question: "What's your main goal?" },
  { key: "experience", kind: "single", question: "How experienced are you?" },
  { key: "days", kind: "single", question: "How often can you train?" },
  { key: "length", kind: "single", question: "How long do you usually have?" },
  { key: "environment", kind: "single", question: "Where do you train?" },
  {
    key: "equipment",
    kind: "multi",
    question: "What equipment do you have?",
    hint: "Pick everything you can get to. We'll only program what you can actually do.",
  },
  {
    key: "likedExercises",
    kind: "exercises",
    question: "Anything you love doing?",
    hint: "We'll build these in more often. Skip if you don't mind.",
    optional: true,
  },
  {
    key: "dislikedExercises",
    kind: "exercises",
    question: "Anything you'd rather avoid?",
    hint: "These won't appear in your plan.",
    optional: true,
  },
  {
    key: "trainingDays",
    kind: "weekdays",
    question: "Which days work for you?",
  },
  {
    // Health information is sensitive information under the Privacy Act, so
    // permission is asked for before any of it is collected.
    key: "healthConsent",
    kind: "consent",
    question: "Can we use your health details?",
  },
  {
    key: "about",
    kind: "about",
    question: "A bit about you",
    hint: "Used to scale bodyweight movements and set sensible starting loads. All optional.",
    optional: true,
  },
  {
    key: "considerations",
    kind: "text",
    question: "Anything we should know?",
    hint: "Old injuries, sore joints, anything you're working around. We'll program conservatively.",
    optional: true,
  },
];

export default function Onboarding() {
  const router = useRouter();
  const onboarding = useAppStore((s) => s.onboarding);
  const setOnboarding = useAppStore((s) => s.setOnboarding);
  const [step, setStep] = useState(0);
  const [query, setQuery] = useState("");

  // Declining consent removes the health screens. The consent screen comes
  // before them, so its position is the same either way.
  const steps =
    onboarding.healthConsent === false ? STEPS.filter((s) => !HEALTH_STEPS.has(s.key)) : STEPS;
  const current = steps[step];

  const equipmentOptions: Equipment[] =
    EQUIPMENT_BY_ENVIRONMENT[onboarding.environment ?? "Mixed"] ??
    EQUIPMENT_BY_ENVIRONMENT.Mixed;

  const exercisePool = useMemo(
    () => availableExercises(onboarding.equipment as Equipment[]),
    [onboarding.equipment]
  );

  const searchResults = useMemo(
    () => searchExercises(query, exercisePool).slice(0, 40),
    [query, exercisePool]
  );

  function toggleInArray(key: "equipment" | "likedExercises" | "dislikedExercises", value: string) {
    const list = onboarding[key];
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    setOnboarding({ [key]: next });
  }

  function toggleDay(day: Weekday) {
    setOnboarding({ trainingDays: toggleWeekday(onboarding.trainingDays, day) });
  }

  function canContinue(): boolean {
    if (current.optional) return true;
    switch (current.key) {
      case "goal":
        return !!onboarding.goal;
      case "experience":
        return !!onboarding.experience;
      case "days":
        return !!onboarding.days;
      case "length":
        return !!onboarding.length;
      case "environment":
        return !!onboarding.environment;
      case "equipment":
        return onboarding.equipment.length > 0;
      case "trainingDays":
        return onboarding.trainingDays.length === (onboarding.days ?? 0);
      case "healthConsent":
        return onboarding.healthConsent !== null;
      default:
        return true;
    }
  }

  function next() {
    setQuery("");
    if (step < steps.length - 1) setStep(step + 1);
    else router.push("/generating");
  }

  function back() {
    setQuery("");
    if (step === 0) router.push("/signup");
    else setStep(step - 1);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col px-6 py-10">
      <button onClick={back} className="mb-6 w-fit text-muted" aria-label="Back">
        <ChevronLeft size={20} />
      </button>

      <div className="mb-8 flex gap-1" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={steps.length}>
        {steps.map((_, i) => (
          <div
            key={i}
            className={clsx(
              "h-1.5 rounded-full transition-all",
              i === step ? "w-4" : "w-1.5",
              i <= step ? "bg-ink" : "bg-line"
            )}
          />
        ))}
      </div>

      {/* Deliberately no exit animation: with AnimatePresence mode="wait" an
          interrupted exit leaves the previous screen mounted while `step` moves
          on, stranding the user on a screen whose Continue button validates the
          next one. Animating only the incoming screen can't wedge. */}
      <div key={step} className="flex-1">
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          <h1 className="mb-2 font-display text-2xl font-bold text-ink">{current.question}</h1>
          {current.hint && <p className="mb-5 text-sm leading-relaxed text-muted">{current.hint}</p>}
          {!current.hint && <div className="mb-5" />}

          {current.kind === "single" && (
            <SingleSelect
              options={optionsFor(current.key)}
              value={valueFor(current.key, onboarding)}
              onSelect={(opt) => setOnboarding(patchFor(current.key, opt, onboarding))}
            />
          )}

          {current.kind === "multi" && (
            <EquipmentPicker
              options={equipmentOptions}
              selected={onboarding.equipment}
              onToggle={(eq) => toggleInArray("equipment", eq)}
            />
          )}

          {current.kind === "exercises" && (
            <ExercisePicker
              query={query}
              setQuery={setQuery}
              results={searchResults}
              selected={
                current.key === "likedExercises"
                  ? onboarding.likedExercises
                  : onboarding.dislikedExercises
              }
              onToggle={(id) =>
                toggleInArray(
                  current.key === "likedExercises" ? "likedExercises" : "dislikedExercises",
                  id
                )
              }
            />
          )}

          {current.kind === "weekdays" && (
            <WeekdayPicker
              selected={onboarding.trainingDays}
              days={onboarding.days ?? 0}
              onToggle={toggleDay}
            />
          )}

          {current.kind === "consent" && (
            <div>
              <div className="mb-5 flex flex-col gap-3 text-sm leading-relaxed text-ink">
                <p>
                  The next two questions ask for your bodyweight, height, age, sex and any injuries, and
                  before workouts you can optionally tell us how you slept and whether anything hurts.
                  These count as health information under Australian privacy law, so we need your
                  permission before collecting them.
                </p>
                <p className="text-muted">
                  We only use them to make your plan safer and better suited to you — for example,
                  keeping exercises away from a sore knee. Never for marketing, and never sold.
                  It&apos;s optional, and you can stop sharing them at any time in Settings.
                </p>
              </div>

              <div role="radiogroup" aria-label="Health details consent" className="flex flex-col gap-2.5">
                {[
                  { value: true, label: "Yes, use my health details" },
                  { value: false, label: "No, skip these questions" },
                ].map((option) => {
                  const selected = onboarding.healthConsent === option.value;
                  return (
                    <button
                      key={option.label}
                      role="radio"
                      aria-checked={selected}
                      onClick={() =>
                        setOnboarding(
                          option.value
                            ? { healthConsent: true }
                            : // Clear anything entered before changing their mind.
                              { healthConsent: false, ...CLEARED_HEALTH_FIELDS }
                        )
                      }
                      className={clsx(
                        "flex items-center justify-between rounded-2xl border px-4 py-3.5 text-left text-sm font-medium",
                        selected ? "border-ink bg-ink text-background" : "border-line bg-surface text-ink"
                      )}
                    >
                      {option.label}
                      <span
                        className={clsx(
                          "flex h-5 w-5 items-center justify-center rounded-full border",
                          selected ? "border-background bg-background" : "border-line"
                        )}
                      >
                        {selected && <Check size={13} className="text-ink" />}
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="mt-4 text-xs leading-relaxed text-muted">
                More detail in our{" "}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          )}

          {current.kind === "about" && (
            <div className="flex flex-col gap-4">
              <NumberField
                label="Bodyweight"
                unit="kg"
                value={onboarding.bodyweightKg}
                onChange={(v) => setOnboarding({ bodyweightKg: v })}
              />
              <NumberField
                label="Age"
                unit="years"
                value={onboarding.age}
                onChange={(v) => setOnboarding({ age: v })}
              />
              <NumberField
                label="Height"
                unit="cm"
                value={onboarding.heightCm}
                onChange={(v) => setOnboarding({ heightCm: v })}
              />
              <SexPicker value={onboarding.sex} onChange={(sex) => setOnboarding({ sex })} />
            </div>
          )}

          {current.kind === "text" && (
            <textarea
              value={onboarding.considerations ?? ""}
              onChange={(e) => setOnboarding({ considerations: e.target.value })}
              rows={5}
              placeholder="e.g. dodgy left shoulder, so overhead pressing hurts"
              className="w-full resize-none rounded-2xl border border-line bg-surface px-4 py-3 text-sm leading-relaxed"
            />
          )}
        </motion.div>
      </div>

      {/* Sticky so the CTA stays reachable on the longer screens (equipment, exercises). */}
      <div className="sticky bottom-0 -mx-6 mt-8 bg-background px-6 pb-2 pt-4">
        <button
          disabled={!canContinue()}
          onClick={next}
          className="w-full rounded-2xl bg-ink py-4 text-[15px] font-semibold text-background transition disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
        >
          {step === steps.length - 1 ? "Build my plan" : continueLabel(current, onboarding)}
        </button>
      </div>
    </div>
  );
}

function continueLabel(step: Step, onboarding: ReturnType<typeof useAppStore.getState>["onboarding"]) {
  if (!step.optional) return "Continue";
  const empty =
    (step.key === "likedExercises" && onboarding.likedExercises.length === 0) ||
    (step.key === "dislikedExercises" && onboarding.dislikedExercises.length === 0) ||
    (step.key === "considerations" && !onboarding.considerations) ||
    (step.key === "about" &&
      !onboarding.bodyweightKg &&
      !onboarding.age &&
      !onboarding.heightCm &&
      !onboarding.sex);
  return empty ? "Skip" : "Continue";
}
