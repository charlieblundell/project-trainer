"use client";

import { motion } from "framer-motion";
import {
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
import { GOALS, EXPERIENCE_OPTIONS, DAY_OPTIONS, LENGTH_OPTIONS, ENVIRONMENTS } from "@/lib/data";
import { EQUIPMENT_BY_ENVIRONMENT, EQUIPMENT_LABELS, type Equipment } from "@/lib/exercises";
import type { OnboardingData, Sex, Weekday } from "@/lib/types";

/*
 * The answer controls shared by first-time setup and by editing those answers
 * later in Settings, so both always offer the same choices and rules.
 */

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

/** A full gym has everything, so there's nothing to ask about. */
export const ASSUMED_COMPLETE = "Full gym";

export function isFullyEquipped(environment: string | null): boolean {
  return environment === ASSUMED_COMPLETE;
}

/** What someone starts with at a location: everything for a full gym, nothing anywhere else. */
export function equipmentFor(environment: string): Equipment[] {
  if (!isFullyEquipped(environment)) return [];
  return EQUIPMENT_BY_ENVIRONMENT[environment] ?? [];
}

export function optionsFor(key: string): string[] {
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

export function valueFor(key: string, o: OnboardingData): string | null {
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

/** The change picking an option makes, including clearing answers it no longer fits. */
export function patchFor(key: string, option: string, o: OnboardingData): Partial<OnboardingData> {
  if (key === "days") {
    const days = parseInt(option, 10);
    // A different day count invalidates the days already picked.
    return days === o.days ? {} : { days, trainingDays: [] };
  }
  if (key === "length") return { length: parseInt(option, 10) };
  if (key === "environment") {
    if (option === o.environment) return {};
    // Equipment options are derived from location, so a new location clears them —
    // except a full gym, which by definition has the lot.
    return { environment: option, equipment: equipmentFor(option) };
  }
  return { [key]: option };
}

/**
 * Toggles a training day, keeping the list in week order. Sessions are handed
 * out to days in list order, so this keeps the first session on the earliest day.
 */
export function toggleWeekday(list: Weekday[], day: Weekday): Weekday[] {
  const next = list.includes(day) ? list.filter((d) => d !== day) : [...list, day];
  const order = WEEKDAYS.map((d) => d.id);
  return next.sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

export function SingleSelect({
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
              "flex items-center gap-3 rounded-[20px] border px-4 py-3.5 text-left text-subhead font-medium",
              selected ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface text-ink"
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

export function EquipmentPicker({
  options,
  selected,
  onToggle,
}: {
  options: Equipment[];
  selected: string[];
  onToggle: (equipment: Equipment) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {options.map((eq, i) => {
        const isSelected = selected.includes(eq);
        return (
          <motion.button
            key={eq}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onToggle(eq)}
            aria-pressed={isSelected}
            className={clsx(
              "flex items-center justify-between rounded-[20px] border px-4 py-3.5 text-left text-subhead font-medium",
              isSelected ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface text-ink"
            )}
          >
            {EQUIPMENT_LABELS[eq]}
            <span
              className={clsx(
                "flex h-5 w-5 items-center justify-center rounded-full border",
                isSelected ? "border-background bg-background" : "border-line"
              )}
            >
              {isSelected && <Check size={13} className="text-ink" />}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

export function WeekdayPicker({
  selected,
  days,
  onToggle,
}: {
  selected: Weekday[];
  days: number;
  onToggle: (day: Weekday) => void;
}) {
  return (
    <div>
      <div className="flex justify-between gap-1.5">
        {WEEKDAYS.map((d) => {
          const isSelected = selected.includes(d.id);
          return (
            <motion.button
              key={d.id}
              whileTap={{ scale: 0.92 }}
              onClick={() => onToggle(d.id)}
              aria-pressed={isSelected}
              aria-label={d.id}
              className={clsx(
                "flex h-11 w-11 items-center justify-center rounded-full border text-subhead font-semibold",
                isSelected ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface text-muted"
              )}
            >
              {d.label}
            </motion.button>
          );
        })}
      </div>
      <p className="mt-4 text-subhead text-muted">
        {selected.length} of {days} days picked
        {selected.length === days && " — that's the lot."}
      </p>
    </div>
  );
}

export function ExercisePicker({
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
          className="w-full rounded-[20px] bg-surface py-3 pl-10 pr-4 text-subhead"
        />
      </div>

      {selected.length > 0 && (
        <p className="mb-3 text-footnote font-semibold text-accent">{selected.length} selected</p>
      )}

      <div className="max-h-[46vh] overflow-y-auto rounded-[20px] border border-line">
        {results.length === 0 && (
          <p className="px-4 py-5 text-subhead text-muted">
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
                <span className="block text-subhead text-ink">{ex.name}</span>
                <span className="block text-footnote text-muted">{ex.muscles.join(", ")}</span>
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

export function NumberField({
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
      <span className="text-subhead text-ink">{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          className="tabular w-24 rounded-[12px] bg-surface px-3 py-2.5 text-right text-subhead"
        />
        <span className="w-10 text-footnote text-muted">{unit}</span>
      </span>
    </label>
  );
}

export function SexPicker({ value, onChange }: { value: Sex | null; onChange: (sex: Sex | null) => void }) {
  return (
    <div>
      <div className="mb-2 text-footnote font-semibold text-muted">SEX</div>
      <div className="flex flex-wrap gap-2">
        {SEX_OPTIONS.map((opt) => {
          const selected = value === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onChange(selected ? null : opt.id)}
              aria-pressed={selected}
              className={clsx(
                "rounded-full border px-3.5 py-2 text-subhead font-medium",
                selected ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface text-ink"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
