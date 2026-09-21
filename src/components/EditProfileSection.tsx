"use client";

import { type ReactNode, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth";
import {
  EQUIPMENT_BY_ENVIRONMENT,
  availableExercises,
  searchExercises,
  type Equipment,
} from "@/lib/exercises";
import type { OnboardingData } from "@/lib/types";
import { grantHealthConsent } from "@/lib/health-consent";
import { affectsPlan } from "@/lib/profile-changes";
import { ageProblem } from "@/lib/age";
import { saveProfileChanges } from "@/lib/profile-update";
import {
  EquipmentPicker,
  ExercisePicker,
  NumberField,
  SexPicker,
  SingleSelect,
  WeekdayPicker,
  isFullyEquipped,
  optionsFor,
  patchFor,
  toggleWeekday,
  valueFor,
} from "@/components/ProfileFields";

export type ProfileSection = "training" | "schedule" | "equipment" | "body";

const TITLES: Record<ProfileSection, string> = {
  training: "Goal and experience",
  schedule: "Training schedule",
  equipment: "Equipment and exercises",
  body: "Body and injury details",
};

function Label({ children }: { children: ReactNode }) {
  return <div className="mb-2 mt-6 text-footnote font-semibold text-muted first:mt-0">{children}</div>;
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/** Why the answers can't be saved yet, or null if they can. */
function missing(section: ProfileSection, o: OnboardingData): string | null {
  switch (section) {
    case "training":
      if (!o.goal || !o.experience) return "Choose a goal and experience level.";
      return ageProblem(o.age);
    case "schedule":
      if (!o.days || !o.length) return "Choose how often and how long you train.";
      return o.trainingDays.length === o.days
        ? null
        : `Pick ${o.days} days — you've picked ${o.trainingDays.length}.`;
    case "equipment":
      if (!o.environment) return "Choose where you train.";
      return o.equipment.length > 0 ? null : "Pick at least one piece of equipment.";
    case "body":
      return null;
  }
}

/** One group of setup answers, edited in Settings. */
export function EditProfileSection({ section }: { section: ProfileSection }) {
  const saved = useAppStore((s) => s.onboarding);
  // Waits for their answers to load, so the form doesn't start from blanks.
  if (!saved.goal) return null;
  return <Editor section={section} saved={saved} />;
}

function Editor({ section, saved }: { section: ProfileSection; saved: OnboardingData }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const plan = useAppStore((s) => s.plan);
  const setOnboarding = useAppStore((s) => s.setOnboarding);
  const setPlan = useAppStore((s) => s.setPlan);

  const [draft, setDraft] = useState<OnboardingData>(saved);
  const [status, setStatus] = useState<"editing" | "saving" | "saved">("editing");
  const [rebuilt, setRebuilt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [likedQuery, setLikedQuery] = useState("");
  const [avoidQuery, setAvoidQuery] = useState("");
  const [consentBusy, setConsentBusy] = useState(false);

  const pool = useMemo(() => availableExercises(draft.equipment as Equipment[]), [draft.equipment]);
  const likedResults = useMemo(() => searchExercises(likedQuery, pool).slice(0, 40), [likedQuery, pool]);
  const avoidResults = useMemo(() => searchExercises(avoidQuery, pool).slice(0, 40), [avoidQuery, pool]);

  const patch = (p: Partial<OnboardingData>) => setDraft((d) => ({ ...d, ...p }));
  const changed = JSON.stringify(draft) !== JSON.stringify(saved);
  const rebuilds = changed && !!plan && affectsPlan(saved, draft);
  const problem = missing(section, draft);

  async function save() {
    if (!user || problem) return;
    setStatus("saving");
    setError(null);
    const result = await saveProfileChanges(user.id, saved, draft, plan);
    if (!result.ok) {
      setStatus("editing");
      setError("That didn't save — check your connection and try again.");
      return;
    }

    setOnboarding(draft);
    if (result.rebuilt && result.plan) {
      setPlan(result.plan);
      const state = useAppStore.getState();
      // A workout left open from the old plan may point at a session that's gone.
      if (!result.plan.sessions.some((s) => s.id === state.session.workoutId)) state.startWorkout("");
      useAppStore.setState({ lastChanges: [], lastRefresh: null });
    }
    setRebuilt(result.rebuilt);
    setStatus("saved");
  }

  async function shareHealthDetails() {
    if (!user) return;
    setConsentBusy(true);
    setError(null);
    const ok = await grantHealthConsent(user.id);
    setConsentBusy(false);
    if (!ok) {
      setError("That didn't save — check your connection and try again.");
      return;
    }
    setOnboarding({ healthConsent: true });
    patch({ healthConsent: true });
  }

  if (status === "saved") {
    return (
      <div className="mx-auto max-w-sm">
        <h1 className="mb-2 text-title1 font-bold text-ink">
          {rebuilt ? "Saved, and your plan's updated." : "Saved."}
        </h1>
        <p className="mb-6 text-subhead leading-relaxed text-muted">
          {rebuilt
            ? "Your plan has been rebuilt around your changes. Your workout history and personal bests are all still here, and exercises that stayed in your plan kept their weights."
            : "Your changes are saved."}
        </p>
        {rebuilt && (
          <button
            onClick={() => router.push("/plan")}
            className="mb-2.5 min-h-[54px] w-full rounded-[14px] bg-accent text-body font-semibold text-accent-ink"
          >
            See my plan
          </button>
        )}
        <button
          onClick={() => router.push("/settings")}
          className={
            rebuilt
              ? "w-full py-3 text-subhead font-semibold text-muted hover:text-ink"
              : "min-h-[54px] w-full rounded-[14px] bg-accent text-body font-semibold text-accent-ink"
          }
        >
          Back to Settings
        </button>
      </div>
    );
  }

  const header = (
    <>
      <button
        onClick={() => router.push("/settings")}
        className="-ml-1 mb-2 flex min-h-[44px] items-center gap-0.5 text-body text-accent"
      >
        <ChevronLeft size={22} strokeWidth={2.2} /> Settings
      </button>
      <h1 className="mb-5 text-largetitle font-bold text-ink">{TITLES[section]}</h1>
    </>
  );

  if (section === "body" && draft.healthConsent !== true) {
    return (
      <div className="mx-auto max-w-sm">
        {header}
        <div className="mb-5 flex flex-col gap-3 text-subhead leading-relaxed text-ink">
          <p>
            Your bodyweight, height, sex and any injuries, and the optional check-in before workouts about sleep
            and soreness, count as health information under Australian privacy law. We need your permission before
            collecting them.
          </p>
          <p className="text-muted">
            We only use them to make your plan safer and better suited to you — for example, keeping exercises away
            from a sore knee. Never for marketing, and never sold. You can stop sharing them at any time in Settings.
          </p>
        </div>
        {error && <p className="mb-3 text-subhead text-warning">{error}</p>}
        <button
          onClick={shareHealthDetails}
          disabled={consentBusy}
          className="mb-2.5 min-h-[54px] w-full rounded-[14px] bg-accent text-body font-semibold text-accent-ink disabled:opacity-60"
        >
          {consentBusy ? "Saving…" : "Yes, use my health details"}
        </button>
        <button
          onClick={() => router.push("/settings")}
          className="min-h-[48px] w-full text-body text-accent"
        >
          Not now
        </button>
        <p className="mt-4 text-footnote leading-relaxed text-muted">
          More detail in our{" "}
          <Link href="/privacy" target="_blank" className="underline underline-offset-4">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm">
      {header}

      <div className="mb-8">
        {section === "training" && (
          <>
            <Label>Goal</Label>
            <SingleSelect
              options={optionsFor("goal")}
              value={valueFor("goal", draft)}
              onSelect={(opt) => patch(patchFor("goal", opt, draft))}
            />
            <Label>Experience</Label>
            <SingleSelect
              options={optionsFor("experience")}
              value={valueFor("experience", draft)}
              onSelect={(opt) => patch(patchFor("experience", opt, draft))}
            />
            <div className="mt-6">
              <NumberField label="Age" unit="years" value={draft.age} onChange={(v) => patch({ age: v })} />
            </div>
            <p className="mt-2 text-footnote leading-relaxed text-muted">
              Optional. From 65, your plan adds balance work, gentler warm-ups and nothing that jumps.
            </p>
          </>
        )}

        {section === "schedule" && (
          <>
            <Label>Sessions a week</Label>
            <SingleSelect
              options={optionsFor("days")}
              value={valueFor("days", draft)}
              onSelect={(opt) => patch(patchFor("days", opt, draft))}
            />
            <Label>Which days</Label>
            <WeekdayPicker
              selected={draft.trainingDays}
              days={draft.days ?? 0}
              onToggle={(day) => patch({ trainingDays: toggleWeekday(draft.trainingDays, day) })}
            />
            <Label>Session length</Label>
            <SingleSelect
              options={optionsFor("length")}
              value={valueFor("length", draft)}
              onSelect={(opt) => patch(patchFor("length", opt, draft))}
            />
          </>
        )}

        {section === "equipment" && (
          <>
            <Label>Where you train</Label>
            <SingleSelect
              options={optionsFor("environment")}
              value={valueFor("environment", draft)}
              onSelect={(opt) => patch(patchFor("environment", opt, draft))}
            />
            <Label>Equipment</Label>
            {isFullyEquipped(draft.environment) && (
              <p className="mb-3 text-subhead leading-relaxed text-muted">
                A full gym is assumed to have everything. Untick anything yours doesn&apos;t have.
              </p>
            )}
            <EquipmentPicker
              options={EQUIPMENT_BY_ENVIRONMENT[draft.environment ?? "Mixed"] ?? EQUIPMENT_BY_ENVIRONMENT.Mixed}
              selected={draft.equipment}
              onToggle={(eq) => patch({ equipment: toggle(draft.equipment, eq) })}
            />
            <Label>Exercises you love</Label>
            <ExercisePicker
              query={likedQuery}
              setQuery={setLikedQuery}
              results={likedResults}
              selected={draft.likedExercises}
              onToggle={(id) => patch({ likedExercises: toggle(draft.likedExercises, id) })}
            />
            <Label>Exercises to avoid</Label>
            <ExercisePicker
              query={avoidQuery}
              setQuery={setAvoidQuery}
              results={avoidResults}
              selected={draft.dislikedExercises}
              onToggle={(id) => patch({ dislikedExercises: toggle(draft.dislikedExercises, id) })}
            />
          </>
        )}

        {section === "body" && (
          <>
            <div className="flex flex-col gap-4">
              <NumberField label="Bodyweight" unit="kg" value={draft.bodyweightKg} onChange={(v) => patch({ bodyweightKg: v })} />
              <NumberField label="Height" unit="cm" value={draft.heightCm} onChange={(v) => patch({ heightCm: v })} />
              <SexPicker value={draft.sex} onChange={(sex) => patch({ sex })} />
            </div>
            <Label>Injuries or limitations</Label>
            <textarea
              value={draft.considerations ?? ""}
              onChange={(e) => patch({ considerations: e.target.value })}
              rows={5}
              placeholder="e.g. dodgy left shoulder, so overhead pressing hurts"
              className="w-full resize-none rounded-[20px] bg-surface shadow-card px-4 py-3 text-subhead leading-relaxed"
            />
          </>
        )}
      </div>

      {problem && changed && <p className="mb-3 text-subhead text-warning">{problem}</p>}
      {error && <p className="mb-3 text-subhead text-warning">{error}</p>}
      {rebuilds && !problem && (
        <p className="mb-3 text-footnote leading-relaxed text-muted">
          Saving rebuilds your plan around this. Your workout history and personal bests stay, and exercises that stay
          in your plan keep their weights.
        </p>
      )}
      <button
        onClick={save}
        disabled={!changed || !!problem || status === "saving"}
        className="min-h-[54px] w-full rounded-[14px] bg-accent text-body font-semibold text-accent-ink transition disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
      >
        {status === "saving" ? "Saving…" : rebuilds ? "Save and update my plan" : "Save changes"}
      </button>
    </div>
  );
}
