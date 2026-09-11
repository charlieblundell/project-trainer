"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Check,
  Search,
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
import {
  EQUIPMENT_BY_ENVIRONMENT,
  EQUIPMENT_LABELS,
  availableExercises,
  searchExercises,
  type Equipment,
} from "@/lib/exercises";
import type { Weekday, Sex } from "@/lib/types";
import { CLEARED_HEALTH_FIELDS } from "@/lib/health-consent";

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

const WEEKDAYS: { id: Weekday; label: string }[] = [
  { id: "mon", label: "M" },
  { id: "tue", label: "T" },
  { id: "wed", label: "W" },
  { id: "thu", label: "T" },
  { id: "fri", label: "F" },
  { id: "sat", label: "S" },
  { id: "sun", label: "S" },
];

const SEX_OPTIONS: { id: Sex; label: string }[] = [
  { id: "female", label: "Female" },
  { id: "male", label: "Male" },
  { id: "prefer_not_to_say", label: "Prefer not to say" },
];

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
    const list = onboarding.trainingDays;
    const next = list.includes(day) ? list.filter((d) => d !== day) : [...list, day];
    setOnboarding({ trainingDays: next });
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
              options={optionsForSingle(current.key)}
              value={valueForSingle(current.key, onboarding)}
              onSelect={(opt) => selectSingle(current.key, opt, setOnboarding)}
            />
          )}

          {current.kind === "multi" && (
            <div className="flex flex-col gap-2.5">
              {equipmentOptions.map((eq, i) => {
                const selected = onboarding.equipment.includes(eq);
                return (
                  <motion.button
                    key={eq}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleInArray("equipment", eq)}
                    aria-pressed={selected}
                    className={clsx(
                      "flex items-center justify-between rounded-2xl border px-4 py-3.5 text-left text-sm font-medium",
                      selected ? "border-ink bg-ink text-background" : "border-line bg-surface text-ink"
                    )}
                  >
                    {EQUIPMENT_LABELS[eq]}
                    <span
                      className={clsx(
                        "flex h-5 w-5 items-center justify-center rounded-full border",
                        selected ? "border-background bg-background" : "border-line"
                      )}
                    >
                      {selected && <Check size={13} className="text-ink" />}
                    </span>
                  </motion.button>
                );
              })}
            </div>
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
            <div>
              <div className="flex justify-between gap-1.5">
                {WEEKDAYS.map((d) => {
                  const selected = onboarding.trainingDays.includes(d.id);
                  return (
                    <motion.button
                      key={d.id}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => toggleDay(d.id)}
                      aria-pressed={selected}
                      aria-label={d.id}
                      className={clsx(
                        "flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold",
                        selected
                          ? "border-ink bg-ink text-background"
                          : "border-line bg-surface text-muted"
                      )}
                    >
                      {d.label}
                    </motion.button>
                  );
                })}
              </div>
              <p className="mt-4 text-sm text-muted">
                {onboarding.trainingDays.length} of {onboarding.days ?? 0} days picked
                {onboarding.trainingDays.length === (onboarding.days ?? 0) && " — that's the lot."}
              </p>
            </div>
          )}

          {current.kind === "consent" && (
            <div>
              <div className="mb-5 flex flex-col gap-3 text-sm leading-relaxed text-ink">
                <p>
                  The next two questions ask for your bodyweight, height, age, sex and any injuries.
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
              <div>
                <div className="mb-2 text-xs font-semibold tracking-widest text-muted">SEX</div>
                <div className="flex flex-wrap gap-2">
                  {SEX_OPTIONS.map((opt) => {
                    const selected = onboarding.sex === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setOnboarding({ sex: selected ? null : opt.id })}
                        aria-pressed={selected}
                        className={clsx(
                          "rounded-full border px-3.5 py-2 text-sm font-medium",
                          selected
                            ? "border-ink bg-ink text-background"
                            : "border-line bg-surface text-ink"
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
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

function optionsForSingle(key: string): string[] {
  switch (key) {
    case "goal":
      return GOALS;
    case "experience":
      return EXPERIENCE_OPTIONS;
    case "days":
      return DAY_OPTIONS.map((d) => `${d} days`);
    case "length":
      return LENGTH_OPTIONS.map((l) => `${l} min`);
    case "environment":
      return ENVIRONMENTS;
    default:
      return [];
  }
}

function valueForSingle(key: string, o: ReturnType<typeof useAppStore.getState>["onboarding"]) {
  switch (key) {
    case "goal":
      return o.goal;
    case "experience":
      return o.experience;
    case "days":
      return o.days ? `${o.days} days` : null;
    case "length":
      return o.length ? `${o.length} min` : null;
    case "environment":
      return o.environment;
    default:
      return null;
  }
}

function selectSingle(
  key: string,
  option: string,
  setOnboarding: (patch: Partial<ReturnType<typeof useAppStore.getState>["onboarding"]>) => void
) {
  if (key === "days") {
    // Changing the day count invalidates a day selection that no longer fits.
    setOnboarding({ days: parseInt(option, 10), trainingDays: [] });
  } else if (key === "length") {
    setOnboarding({ length: parseInt(option, 10) });
  } else if (key === "environment") {
    // Equipment options are derived from location, so clear stale ticks.
    setOnboarding({ environment: option, equipment: [] });
  } else {
    setOnboarding({ [key]: option });
  }
}

function SingleSelect({
  options,
  value,
  onSelect,
}: {
  options: string[];
  value: string | null;
  onSelect: (option: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {options.map((opt, i) => {
        const selected = value === opt;
        const Icon = ICONS[opt];
        return (
          <motion.button
            key={opt}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(opt)}
            aria-pressed={selected}
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
  );
}

function ExercisePicker({
  query,
  setQuery,
  results,
  selected,
  onToggle,
}: {
  query: string;
  setQuery: (q: string) => void;
  results: { id: string; name: string; muscles: string[] }[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises"
          className="w-full rounded-2xl border border-line bg-surface py-3 pl-10 pr-4 text-sm"
        />
      </div>

      {selected.length > 0 && (
        <p className="mb-3 text-xs font-semibold text-accent">{selected.length} selected</p>
      )}

      <div className="max-h-[46vh] overflow-y-auto rounded-2xl border border-line">
        {results.length === 0 && (
          <p className="px-4 py-5 text-sm text-muted">
            Nothing matches that. Try a muscle group, like &ldquo;chest&rdquo;.
          </p>
        )}
        {results.map((ex) => {
          const isSelected = selected.includes(ex.id);
          return (
            <button
              key={ex.id}
              onClick={() => onToggle(ex.id)}
              aria-pressed={isSelected}
              className="flex w-full items-center justify-between border-b border-line bg-surface px-4 py-3 text-left last:border-b-0"
            >
              <span>
                <span className="block text-sm text-ink">{ex.name}</span>
                <span className="block text-xs text-muted">{ex.muscles.join(", ")}</span>
              </span>
              <span
                className={clsx(
                  "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border",
                  isSelected ? "border-accent bg-accent" : "border-line"
                )}
              >
                {isSelected && <Check size={13} className="text-accent-ink" />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NumberField({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4">
      <span className="text-sm text-ink">{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          className="tabular w-24 rounded-xl border border-line bg-surface px-3 py-2.5 text-right text-sm"
        />
        <span className="w-10 text-xs text-muted">{unit}</span>
      </span>
    </label>
  );
}
