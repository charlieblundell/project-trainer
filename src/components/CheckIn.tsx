"use client";

import { useState } from "react";
import { clsx } from "@/lib/clsx";
import { isLowReadiness, type Readiness } from "@/lib/plan/readiness";

type Question<K extends keyof Readiness> = {
  key: K;
  label: string;
  options: { value: Readiness[K]; label: string }[];
};

const QUESTIONS: [Question<"sleep">, Question<"soreness">, Question<"jointPain">] = [
  {
    key: "sleep",
    label: "How did you sleep?",
    options: [
      { value: "poor", label: "Badly" },
      { value: "ok", label: "OK" },
      { value: "good", label: "Well" },
    ],
  },
  {
    key: "soreness",
    label: "How sore are you?",
    options: [
      { value: "none", label: "Not sore" },
      { value: "some", label: "A bit" },
      { value: "lots", label: "Very" },
    ],
  },
  {
    key: "jointPain",
    label: "Any joint pain?",
    options: [
      { value: "none", label: "None" },
      { value: "mild", label: "Mild" },
      { value: "sharp", label: "Sharp" },
    ],
  },
];

/**
 * Three taps before a workout. Poor sleep or heavy soreness takes a set off
 * each exercise and stops a tough day lowering targets; sharp joint pain gets
 * a clear stop message, because pushing through it is how injuries get worse.
 */
export function CheckIn({
  sessionName,
  onDone,
}: {
  sessionName: string;
  onDone: (readiness: Readiness | "skipped") => void;
}) {
  const [answers, setAnswers] = useState<Partial<Readiness>>({});
  const complete = !!answers.sleep && !!answers.soreness && !!answers.jointPain;
  const readiness = complete ? (answers as Readiness) : null;

  return (
    <div className="mx-auto max-w-sm">
      <div className="mb-1 text-xs font-semibold tracking-widest text-muted">BEFORE {sessionName.toUpperCase()}</div>
      <h1 className="mb-2 font-display text-2xl font-bold text-ink">Quick check-in</h1>
      <p className="mb-6 text-sm leading-relaxed text-muted">
        Three taps, so today&apos;s session matches how you actually feel. Your answers are saved with this workout
        as health information.
      </p>

      <div className="mb-6 flex flex-col gap-5">
        {QUESTIONS.map((question) => (
          <fieldset key={question.key}>
            <legend className="mb-2 text-sm font-semibold text-ink">{question.label}</legend>
            <div className="grid grid-cols-3 gap-2">
              {question.options.map((option) => {
                const selected = answers[question.key] === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setAnswers((a) => ({ ...a, [question.key]: option.value }))}
                    className={clsx(
                      "rounded-md border py-3 text-sm font-semibold transition",
                      selected ? "border-ink bg-ink text-background" : "border-line bg-surface text-ink"
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      {readiness?.jointPain === "sharp" && (
        <div className="mb-4 rounded-md border border-warning/40 bg-warning-soft p-4 text-sm leading-relaxed text-ink">
          <p className="mb-1 font-semibold">Sharp pain is a reason to stop, not push through.</p>
          <p>
            Skip anything that brings it on, and if it&apos;s still there after a few days, see a physio or doctor.
            If it came on with chest pain, dizziness or trouble breathing, stop and get medical help now.
          </p>
        </div>
      )}

      {readiness && readiness.jointPain !== "sharp" && (
        <div className="mb-4 rounded-md bg-accent-soft p-4 text-sm leading-relaxed text-ink">
          {isLowReadiness(readiness) ? (
            <>
              <p className="mb-1 font-semibold">A lighter day, then.</p>
              <p>
                Each exercise has one fewer set today, and if it feels harder than usual your targets won&apos;t
                drop because of it.
              </p>
            </>
          ) : readiness.jointPain === "mild" ? (
            <p>
              Keep an eye on it. Mild discomfort that settles is usually fine, but stop any exercise that makes it
              sharper.
            </p>
          ) : (
            <p className="font-semibold">Good to go.</p>
          )}
        </div>
      )}

      <button
        onClick={() => readiness && onDone(readiness)}
        disabled={!readiness}
        className="w-full rounded-2xl bg-ink py-4 text-[15px] font-semibold text-background disabled:bg-line disabled:text-muted"
      >
        {readiness?.jointPain === "sharp" ? "Continue carefully" : "Start workout"}
      </button>
      <button
        onClick={() => onDone("skipped")}
        className="mt-2 w-full py-3 text-sm font-semibold text-muted hover:text-ink"
      >
        Skip check-in
      </button>
    </div>
  );
}
