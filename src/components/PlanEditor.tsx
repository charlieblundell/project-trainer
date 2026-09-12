"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronLeft, ChevronUp, Plus, Search, Trash2, X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { availableExercises, searchExercises, type Equipment } from "@/lib/exercises";
import { WEEKDAY_LABELS, WEEKDAY_ORDER, exerciseName } from "@/lib/plan/helpers";
import {
  LIMITS,
  addExercise,
  addSession,
  commitTyped,
  moveExercise,
  moveSession,
  removeExercise,
  removeSession,
  renameSession,
  updateExercise,
} from "@/lib/plan/edit";
import type { Plan, PlannedExercise, PlannedSession } from "@/lib/plan/types";
import { clsx } from "@/lib/clsx";

/**
 * Changing the plan itself: what's in each session, in what order, for how
 * many sets and reps, and on which day. Edits are kept in a draft until saved,
 * so a mis-tap on a phone doesn't rewrite someone's week.
 */
export function PlanEditor() {
  const router = useRouter();
  const plan = useAppStore((s) => s.plan);
  const updatePlan = useAppStore((s) => s.updatePlan);
  const equipment = useAppStore((s) => s.onboarding.equipment) as Equipment[];

  const [draft, setDraft] = useState<Plan | null>(plan);
  const [openId, setOpenId] = useState<string | null>(plan?.sessions[0]?.id ?? null);
  /*
   * The plan is fetched after the app shell renders, so opening this screen
   * directly — a refresh, a bookmark, a slow connection — can mount the editor
   * before the plan exists. Seeding the draft only at mount left those people
   * looking at "there's no plan to edit yet", with a button that would build
   * them a new one over the top of the plan they already had.
   */
  const [seededFrom, setSeededFrom] = useState(plan);
  if (plan !== seededFrom) {
    setSeededFrom(plan);
    setDraft(plan);
    setOpenId(plan?.sessions[0]?.id ?? null);
  }
  const [status, setStatus] = useState<"editing" | "saving" | "saved">("editing");
  const [error, setError] = useState<string | null>(null);

  if (!plan || !draft) {
    return (
      <div className="py-16 text-center">
        <p className="mb-4 text-sm text-muted">There&apos;s no plan to edit yet.</p>
        <button
          onClick={() => router.push("/onboarding")}
          className="rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-background"
        >
          Build my plan
        </button>
      </div>
    );
  }

  const changed = JSON.stringify(draft) !== JSON.stringify(plan);

  async function save() {
    if (!draft) return;
    setStatus("saving");
    setError(null);
    await updatePlan(draft);
    setStatus("saved");
    router.push("/plan");
  }

  return (
    <div>
      <button
        onClick={() => router.push("/plan")}
        className="mb-4 flex items-center gap-1 text-sm text-muted"
      >
        <ChevronLeft size={18} /> Your plan
      </button>

      <h1 className="mb-1 font-display text-2xl font-bold text-ink">Edit your week</h1>
      <p className="mb-5 text-sm leading-relaxed text-muted">
        Changes stick: this is the plan every future session comes from. Your logged workouts and
        personal bests stay as they are.
      </p>

      <div className="flex flex-col gap-2.5">
        {draft.sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            open={openId === session.id}
            equipment={equipment}
            takenDays={draft.sessions.filter((s) => s.id !== session.id).map((s) => s.weekday)}
            onToggle={() => setOpenId(openId === session.id ? null : session.id)}
            onChange={(change) => setDraft(change(draft))}
          />
        ))}
      </div>

      {draft.sessions.length === 0 && (
        <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
          No sessions yet. Add your first one below.
        </p>
      )}

      <button
        onClick={() => {
          const next = addSession(draft);
          setDraft(next);
          setOpenId(next.sessions[next.sessions.length - 1].id);
        }}
        className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-2xl border border-line py-3.5 text-sm font-semibold text-ink"
      >
        <Plus size={16} /> Add a session
      </button>

      {error && <p className="mt-4 text-sm text-warning">{error}</p>}

      <div className="sticky bottom-20 mt-6 md:bottom-4">
        <motion.button
          whileTap={changed ? { scale: 0.98 } : undefined}
          onClick={save}
          disabled={!changed || status === "saving"}
          className="w-full rounded-2xl bg-ink py-4 text-[15px] font-semibold text-background shadow-lg disabled:bg-line disabled:text-muted disabled:shadow-none"
        >
          {status === "saving" ? "Saving…" : changed ? "Save my plan" : "No changes yet"}
        </motion.button>
      </div>
    </div>
  );
}

function SessionCard({
  session,
  open,
  equipment,
  takenDays,
  onToggle,
  onChange,
}: {
  session: PlannedSession;
  open: boolean;
  equipment: Equipment[];
  takenDays: string[];
  onToggle: () => void;
  onChange: (change: (plan: Plan) => Plan) => void;
}) {
  const [adding, setAdding] = useState(false);

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface">
      <button onClick={onToggle} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left">
        <div>
          <div className="text-sm font-semibold text-ink">{session.name}</div>
          <div className="tabular text-xs text-muted">
            {WEEKDAY_LABELS[session.weekday]} · {session.exercises.length} exercise
            {session.exercises.length === 1 ? "" : "s"} · ~{session.estMinutes} min
          </div>
        </div>
        <ChevronDown size={18} className={clsx("flex-shrink-0 text-muted transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="border-t border-line px-4 pb-4 pt-3.5">
          <label className="text-xs font-semibold tracking-widest text-muted" htmlFor={`name-${session.id}`}>
            NAME
          </label>
          <input
            id={`name-${session.id}`}
            value={session.name}
            onChange={(e) => onChange((plan) => renameSession(plan, session.id, e.target.value))}
            className="mb-4 mt-1.5 w-full rounded-xl border border-line bg-background px-3 py-2.5 text-sm"
          />

          <div className="mb-1.5 text-xs font-semibold tracking-widest text-muted">DAY</div>
          <div className="mb-4 flex justify-between gap-1.5">
            {WEEKDAY_ORDER.map((day) => {
              const selected = session.weekday === day;
              const taken = takenDays.includes(day);
              return (
                <button
                  key={day}
                  onClick={() => onChange((plan) => moveSession(plan, session.id, day))}
                  aria-pressed={selected}
                  aria-label={`${WEEKDAY_LABELS[day]}${taken ? " (swaps with the session there)" : ""}`}
                  className={clsx(
                    "flex h-10 flex-1 items-center justify-center rounded-lg border text-xs font-semibold",
                    selected
                      ? "border-ink bg-ink text-background"
                      : taken
                        ? "border-line bg-background text-muted"
                        : "border-line bg-surface text-ink"
                  )}
                >
                  {WEEKDAY_LABELS[day].slice(0, 1)}
                </button>
              );
            })}
          </div>

          <div className="mb-1.5 text-xs font-semibold tracking-widest text-muted">EXERCISES</div>
          <div className="flex flex-col gap-2">
            {session.exercises.map((exercise, i) => (
              <ExerciseRow
                key={`${exercise.exerciseId}-${i}`}
                exercise={exercise}
                index={i}
                count={session.exercises.length}
                onChange={(change) => onChange(change)}
                sessionId={session.id}
              />
            ))}
          </div>

          {session.exercises.length === 0 && (
            <p className="py-3 text-sm text-muted">Nothing in this session yet.</p>
          )}

          <button
            onClick={() => setAdding(true)}
            className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-line py-2.5 text-sm font-semibold text-ink"
          >
            <Plus size={15} /> Add an exercise
          </button>

          <button
            onClick={() => onChange((plan) => removeSession(plan, session.id))}
            className="mt-2 flex w-full items-center justify-center gap-2 py-2.5 text-sm font-semibold text-warning"
          >
            <Trash2 size={15} /> Delete this session
          </button>

          <AnimatePresence>
            {adding && (
              <AddExercisePanel
                equipment={equipment}
                onClose={() => setAdding(false)}
                onPick={(exerciseId) => {
                  onChange((plan) => addExercise(plan, session.id, exerciseId));
                  setAdding(false);
                }}
              />
            )}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}

/**
 * A typed number that only takes effect once the person has finished with it.
 * While it has focus the box holds whatever they've typed, including nothing,
 * so clearing it to type a new figure works the way it looks like it should.
 * Tapping in selects what's there, so typing replaces rather than appends.
 *
 * Callers key this on the committed value, so a change made elsewhere — a rep
 * range correcting itself, say — remounts the box with the new figure rather
 * than being synced across by an effect.
 */
function NumberBox({
  label,
  value,
  limits,
  allowEmpty = false,
  onCommit,
}: {
  label: string;
  value: number | null;
  limits: { min: number; max: number };
  allowEmpty?: boolean;
  onCommit: (value: number | null) => void;
}) {
  const asText = (n: number | null) => (n == null ? "" : String(n));
  const [draft, setDraft] = useState(() => asText(value));

  function commit() {
    const next = commitTyped(draft, value, limits, allowEmpty);
    setDraft(asText(next));
    if (next !== value) onCommit(next);
  }

  return (
    <label className="flex-1">
      <span className="text-[11px] text-muted">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        enterKeyHint="done"
        min={limits.min}
        max={limits.max}
        value={draft}
        onFocus={(e) => e.target.select()}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="tabular mt-0.5 w-full rounded-lg border border-line bg-background px-2 py-2 text-sm"
      />
    </label>
  );
}

function ExerciseRow({
  exercise,
  index,
  count,
  sessionId,
  onChange,
}: {
  exercise: PlannedExercise;
  index: number;
  count: number;
  sessionId: string;
  onChange: (change: (plan: Plan) => Plan) => void;
}) {
  const timed = exercise.unit === "time" || exercise.unit === "distance";
  const weighted = exercise.unit === "weight_reps";
  const patch = (change: Parameters<typeof updateExercise>[3]) =>
    onChange((plan) => updateExercise(plan, sessionId, index, change));

  return (
    <div className="rounded-xl border border-line bg-background p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="text-sm font-semibold text-ink">{exerciseName(exercise)}</span>
        <div className="flex flex-shrink-0 gap-1">
          <button
            onClick={() => onChange((plan) => moveExercise(plan, sessionId, index, -1))}
            disabled={index === 0}
            aria-label="Move up"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-line text-muted disabled:opacity-30"
          >
            <ChevronUp size={14} />
          </button>
          <button
            onClick={() => onChange((plan) => moveExercise(plan, sessionId, index, 1))}
            disabled={index === count - 1}
            aria-label="Move down"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-line text-muted disabled:opacity-30"
          >
            <ChevronDown size={14} />
          </button>
          <button
            onClick={() => onChange((plan) => removeExercise(plan, sessionId, index))}
            aria-label={`Remove ${exerciseName(exercise)}`}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-line text-warning"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <NumberBox
          key={`sets-${exercise.sets}`}
          label="Sets"
          value={exercise.sets}
          limits={LIMITS.sets}
          onCommit={(sets) => sets != null && patch({ sets })}
        />
        {timed ? (
          <NumberBox
            key={`mins-${exercise.seconds}`}
            label="Minutes"
            value={Math.round((exercise.seconds ?? 0) / 60)}
            limits={LIMITS.minutes}
            onCommit={(minutes) => minutes != null && patch({ minutes })}
          />
        ) : (
          <>
            <NumberBox
              key={`repmin-${exercise.repMin}`}
              label="Reps from"
              value={exercise.repMin ?? null}
              limits={LIMITS.reps}
              onCommit={(repMin) => repMin != null && patch({ repMin })}
            />
            <NumberBox
              key={`repmax-${exercise.repMax}`}
              label="to"
              value={exercise.repMax ?? null}
              limits={LIMITS.reps}
              onCommit={(repMax) => repMax != null && patch({ repMax })}
            />
          </>
        )}
        <NumberBox
          key={`rest-${exercise.restSeconds}`}
          label="Rest (s)"
          value={exercise.restSeconds}
          limits={LIMITS.restSeconds}
          onCommit={(restSeconds) => restSeconds != null && patch({ restSeconds })}
        />
      </div>

      {weighted && (
        <div className="mt-2 flex items-end gap-2">
          <NumberBox
            key={`weight-${exercise.targetWeightKg}`}
            label="Target weight (kg)"
            value={exercise.targetWeightKg}
            limits={LIMITS.weightKg}
            allowEmpty
            onCommit={(targetWeightKg) => patch({ targetWeightKg })}
          />
          {exercise.targetWeightKg != null && (
            <button
              onClick={() => patch({ targetWeightKg: null })}
              className="mb-0.5 rounded-lg border border-line px-2.5 py-2 text-xs font-semibold text-muted"
            >
              Clear
            </button>
          )}
        </div>
      )}
      {weighted && exercise.targetWeightKg == null && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
          Left empty, you&apos;ll find a working weight on your next session.
        </p>
      )}
    </div>
  );
}

function AddExercisePanel({
  equipment,
  onPick,
  onClose,
}: {
  equipment: Equipment[];
  onPick: (exerciseId: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const pool = useMemo(() => availableExercises(equipment), [equipment]);
  const results = useMemo(() => searchExercises(query, pool).slice(0, 40), [query, pool]);

  return (
    <motion.div
      className="fixed inset-0 z-30 flex items-end justify-center bg-ink/45 md:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="max-h-[80%] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-surface p-5 md:rounded-3xl"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 38 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-ink">Add an exercise</h3>
          <button onClick={onClose} className="text-muted" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="relative mb-3">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercises"
            autoFocus
            className="w-full rounded-2xl border border-line bg-background py-3 pl-10 pr-4 text-sm"
          />
        </div>

        <p className="mb-3 text-xs leading-relaxed text-muted">
          Only what your equipment allows. Add kit in Settings to see more.
        </p>

        <div className="flex flex-col">
          {results.map((exercise) => (
            <button
              key={exercise.id}
              onClick={() => onPick(exercise.id)}
              className="flex items-center justify-between gap-3 border-b border-line py-3 text-left last:border-b-0"
            >
              <span>
                <span className="block text-sm text-ink">{exercise.name}</span>
                <span className="block text-xs text-muted">{exercise.muscles.join(", ")}</span>
              </span>
              <Plus size={16} className="flex-shrink-0 text-accent" />
            </button>
          ))}
          {results.length === 0 && (
            <p className="py-5 text-sm text-muted">Nothing matches that. Try a muscle group, like &ldquo;back&rdquo;.</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
