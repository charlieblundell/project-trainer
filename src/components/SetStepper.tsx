"use client";

import { Minus, Plus } from "lucide-react";
import { clsx } from "@/lib/clsx";

/**
 * One number, set with a thumb.
 *
 * This is the control the whole app is used through: four times an exercise,
 * five exercises a session, standing up, one-handed, often with chalk or sweat
 * on the screen. Typing into a small box is the wrong input for that, so the
 * number is large and the two ways to change it are 48pt targets either side
 * of it. The number itself is still a real input, because sometimes you want
 * to jump from 20 to 65 rather than press a button eighteen times.
 */
export function SetStepper({
  label,
  value,
  onChange,
  step,
  min = 0,
  max,
  suffix,
}: {
  label: string;
  /** The text in the box — kept as text so a half-typed "6." survives. */
  value: string;
  onChange: (value: string) => void;
  step: number;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  const current = parseFloat(value);

  function nudge(by: number) {
    const from = Number.isFinite(current) ? current : min;
    const next = Math.round((from + by) * 100) / 100;
    const clamped = Math.min(max ?? Infinity, Math.max(min, next));
    onChange(String(clamped));
    if ("vibrate" in navigator) navigator.vibrate(8);
  }

  const canGoDown = !Number.isFinite(current) || current > min;
  const canGoUp = max === undefined || !Number.isFinite(current) || current < max;

  return (
    <div className="flex-1">
      <div className="mb-1.5 text-footnote font-medium text-muted">{label}</div>
      <div className="flex items-center gap-1.5">
        <StepButton label={`Decrease ${label}`} onPress={() => nudge(-step)} disabled={!canGoDown}>
          <Minus size={20} strokeWidth={2.4} />
        </StepButton>

        <div className="relative flex-1">
          <input
            type="number"
            inputMode="decimal"
            value={value}
            aria-label={label}
            onChange={(e) => onChange(e.target.value)}
            onFocus={(e) => e.target.select()}
            className={clsx(
              "tabular h-[56px] w-full rounded-[14px] bg-fill text-center text-title1 font-semibold text-ink",
              "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none",
              suffix && "pr-6"
            )}
          />
          {suffix && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-subhead text-muted">
              {suffix}
            </span>
          )}
        </div>

        <StepButton label={`Increase ${label}`} onPress={() => nudge(step)} disabled={!canGoUp}>
          <Plus size={20} strokeWidth={2.4} />
        </StepButton>
      </div>
    </div>
  );
}

function StepButton({
  label,
  onPress,
  disabled,
  children,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onPress}
      disabled={disabled}
      className="flex h-[56px] w-[52px] flex-shrink-0 items-center justify-center rounded-[14px] bg-fill text-ink transition-opacity active:opacity-50 disabled:opacity-25"
    >
      {children}
    </button>
  );
}
