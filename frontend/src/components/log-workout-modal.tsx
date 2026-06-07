"use client";

import { HeartPulse, Plus, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { inputClassName, textareaClassName } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  buildQuickFillWorkout,
  createEmptyLoggedExercise,
  createId,
  hasDefaultTemplate,
  type DayOfWeek,
  type ExerciseSubstitutionOption,
  type LoggedExercise,
  type LoggedWorkout,
  type SubstitutionMemory,
} from "@/lib/program";

interface SessionDetails {
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  effort: number | null;
  durationMinutes: number | null;
  notes: string;
}

const EMPTY_SESSION_DETAILS: SessionDetails = {
  avgHeartRate: null,
  maxHeartRate: null,
  effort: null,
  durationMinutes: null,
  notes: "",
};

interface SubstitutionDraft {
  selectedName: string;
  customName: string;
  reason: string;
}

function sameExerciseName(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function upsertCustomSubstitution(
  options: ExerciseSubstitutionOption[] | undefined,
  customName: string,
  reason?: string,
): ExerciseSubstitutionOption[] {
  const next = [...(options ?? [])];
  const existingIndex = next.findIndex((option) => sameExerciseName(option.name, customName));

  if (existingIndex >= 0) {
    next[existingIndex] = {
      ...next[existingIndex],
      reason: reason ?? next[existingIndex].reason,
      frequencyUsed: (next[existingIndex].frequencyUsed ?? 0) + 1,
    };
    return next;
  }

  return [
    ...next,
    {
      name: customName,
      source: "custom",
      reason,
      frequencyUsed: 1,
    },
  ];
}

function sessionDetailsFrom(existing?: LoggedWorkout): SessionDetails {
  if (!existing) {
    return { ...EMPTY_SESSION_DETAILS };
  }
  return {
    avgHeartRate: existing.heartRate?.avg ?? null,
    maxHeartRate: existing.heartRate?.max ?? null,
    effort: existing.effort ?? null,
    durationMinutes: existing.durationMinutes ?? null,
    notes: existing.notes ?? "",
  };
}

export function LogWorkoutModal({
  open,
  onClose,
  dayOfWeek,
  workoutType,
  existing,
  onSave,
  substitutionMemory = {},
}: {
  open: boolean;
  onClose: () => void;
  dayOfWeek: DayOfWeek;
  workoutType: string;
  existing?: LoggedWorkout;
  onSave: (workout: LoggedWorkout) => void;
  substitutionMemory?: SubstitutionMemory;
}) {
  const [exercises, setExercises] = useState<LoggedExercise[]>([createEmptyLoggedExercise()]);
  const [session, setSession] = useState<SessionDetails>(() => sessionDetailsFrom(existing));
  const [openSubstitutionIndex, setOpenSubstitutionIndex] = useState<number | null>(null);
  const [substitutionDrafts, setSubstitutionDrafts] = useState<Record<number, SubstitutionDraft>>({});

  // Reset the form whenever a new session is opened.
  useEffect(() => {
    if (!open) {
      return;
    }
    setExercises(
      existing && existing.exercises.length > 0
        ? existing.exercises.map((exercise) => ({ ...exercise, muscleGroups: [...exercise.muscleGroups] }))
        : [createEmptyLoggedExercise()],
    );
    setSession(sessionDetailsFrom(existing));
    setOpenSubstitutionIndex(null);
    setSubstitutionDrafts({});
  }, [open, existing]);

  const updateSession = (patch: Partial<SessionDetails>) => {
    setSession((current) => ({ ...current, ...patch }));
  };

  const updateExercise = (index: number, patch: Partial<LoggedExercise>) => {
    setExercises((current) =>
      current.map((exercise, i) => (i === index ? { ...exercise, ...patch } : exercise)),
    );
  };

  const addExercise = () => {
    setExercises((current) => [...current, createEmptyLoggedExercise()]);
  };

  const removeExercise = (index: number) => {
    setExercises((current) =>
      current.length === 1 ? current : current.filter((_, i) => i !== index),
    );
  };

  const quickFill = () => {
    const quickFilledWorkout = buildQuickFillWorkout(dayOfWeek, workoutType, substitutionMemory);
    setExercises(quickFilledWorkout.exercises);
  };

  const updateSubstitutionDraft = (index: number, patch: Partial<SubstitutionDraft>) => {
    const emptyDraft: SubstitutionDraft = {
      selectedName: "",
      customName: "",
      reason: "",
    };

    setSubstitutionDrafts((current) => ({
      ...current,
      [index]: { ...emptyDraft, ...current[index], ...patch },
    }));
  };

  const applySubstitution = (index: number) => {
    const draft = substitutionDrafts[index];
    const customName = draft?.customName.trim() ?? "";
    const selectedName = draft?.selectedName.trim() ?? "";
    const chosenName = customName || selectedName;

    if (!chosenName) {
      return;
    }

    setExercises((current) =>
      current.map((exercise, exerciseIndex) => {
        if (exerciseIndex !== index) {
          return exercise;
        }

        const originalName = exercise.originalName ?? exercise.name;
        const reason = draft?.reason.trim() || undefined;
        return {
          ...exercise,
          name: chosenName,
          originalName,
          substitutionReason: reason,
          substitutions: customName
            ? upsertCustomSubstitution(exercise.substitutions, customName, reason)
            : exercise.substitutions,
        };
      }),
    );
    setOpenSubstitutionIndex(null);
  };

  const validExercises = exercises.filter((exercise) => exercise.name.trim().length > 0);
  const canSave = validExercises.length > 0;

  const handleSave = () => {
    if (!canSave) {
      return;
    }
    const heartRate =
      session.avgHeartRate !== null
        ? { avg: session.avgHeartRate, max: session.maxHeartRate ?? undefined }
        : undefined;
    const trimmedNotes = session.notes.trim();

    onSave({
      id: existing?.id ?? createId("workout"),
      dayOfWeek,
      workoutType,
      exercises: validExercises.map((exercise) => ({
        ...exercise,
        name: exercise.name.trim(),
      })),
      loggedAt: new Date().toISOString(),
      heartRate,
      effort: session.effort ?? undefined,
      durationMinutes: session.durationMinutes ?? undefined,
      notes: trimmedNotes.length > 0 ? trimmedNotes : undefined,
      sessionType: workoutType,
      // Preserve any prior Strava enrichment so re-editing a workout does not
      // silently discard mapped activity data.
      stravaData: existing?.stravaData,
      enrichmentStatus: existing?.enrichmentStatus,
    });
    onClose();
  };

  const footer = (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
      <Button type="button" variant="ghost" size="sm" className="w-full sm:w-auto" onClick={onClose}>
        Cancel
      </Button>
      <Button type="button" disabled={!canSave} className="w-full sm:w-auto" onClick={handleSave}>
        Save workout
      </Button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Log ${workoutType} workout`}
      description={`${dayOfWeek} - record the real workout you performed.`}
      footer={footer}
    >
      <div className="mb-4 flex justify-end">
        <Button type="button" variant="secondary" size="sm" onClick={quickFill}>
          <Sparkles className="h-4 w-4" />{" "}
          {hasDefaultTemplate(workoutType)
            ? `Quick-fill ${workoutType} template`
            : "Quick-fill from sample"}
        </Button>
      </div>

      <div className="mb-4 rounded-3xl border border-zinc-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center gap-2">
          <HeartPulse className="h-4 w-4 text-rose-400" />
          <p className="text-sm font-bold">Session details</p>
          <span className="text-xs text-zinc-400">optional</span>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <OptionalNumberField
            label="Avg HR (bpm)"
            value={session.avgHeartRate}
            min={0}
            step={1}
            onChange={(value) => updateSession({ avgHeartRate: value })}
          />
          <OptionalNumberField
            label="Max HR (bpm)"
            value={session.maxHeartRate}
            min={0}
            step={1}
            onChange={(value) => updateSession({ maxHeartRate: value })}
          />
          <OptionalNumberField
            label="Effort (1-10)"
            value={session.effort}
            min={1}
            max={10}
            step={1}
            onChange={(value) => updateSession({ effort: value })}
          />
          <OptionalNumberField
            label="Duration (min)"
            value={session.durationMinutes}
            min={0}
            step={1}
            onChange={(value) => updateSession({ durationMinutes: value })}
          />
        </div>
        <label className="mt-3 block">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Notes</span>
          <textarea
            value={session.notes}
            onChange={(event) => updateSession({ notes: event.target.value })}
            placeholder="How did the session feel?"
            rows={2}
            className={textareaClassName}
          />
        </label>
      </div>

      <div className="space-y-3">
        {exercises.map((exercise, index) => (
          <div
            key={index}
            className="rounded-3xl border border-zinc-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5"
          >
            <div className="flex items-center gap-2">
              <input
                value={exercise.name}
                onChange={(event) => updateExercise(index, { name: event.target.value })}
                placeholder="Exercise name (e.g. Bench Press)"
                className={inputClassName}
              />
              <button
                type="button"
                aria-label="Remove exercise"
                onClick={() => removeExercise(index)}
                disabled={exercises.length === 1}
                className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-950/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300 disabled:opacity-40 dark:hover:bg-white/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <NumberField
                label="Sets"
                value={exercise.sets}
                min={1}
                step={1}
                onChange={(value) => updateExercise(index, { sets: value })}
              />
              <NumberField
                label="Reps min"
                value={exercise.repRangeMin}
                min={1}
                step={1}
                onChange={(value) => updateExercise(index, { repRangeMin: value })}
              />
              <NumberField
                label="Reps max"
                value={exercise.repRangeMax}
                min={1}
                step={1}
                onChange={(value) => updateExercise(index, { repRangeMax: value })}
              />
              <NumberField
                label="Weight (kg)"
                value={exercise.weight}
                min={0}
                step={0.5}
                onChange={(value) => updateExercise(index, { weight: value })}
              />
              <NumberField
                label="RPE"
                value={exercise.rpe}
                min={1}
                max={10}
                step={0.5}
                onChange={(value) => updateExercise(index, { rpe: value })}
              />
            </div>

            {(exercise.warmupSets ||
              exercise.earlySetRpe ||
              exercise.lastSetRpe ||
              exercise.restTime ||
              exercise.lastSetIntensityTechnique ||
              exercise.notes) && (
              <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600 dark:border-white/10 dark:bg-black/20 dark:text-zinc-300">
                <div className="grid gap-2 sm:grid-cols-2">
                  {exercise.warmupSets && <PrescriptionItem label="Warmup Sets" value={exercise.warmupSets} />}
                  {exercise.earlySetRpe && <PrescriptionItem label="Early Set RPE" value={exercise.earlySetRpe} />}
                  {exercise.lastSetRpe && <PrescriptionItem label="Last Set RPE" value={exercise.lastSetRpe} />}
                  {exercise.restTime && <PrescriptionItem label="Rest Time" value={exercise.restTime} />}
                  {exercise.lastSetIntensityTechnique && (
                    <PrescriptionItem
                      label="Last Set Intensity Technique"
                      value={exercise.lastSetIntensityTechnique}
                    />
                  )}
                </div>
                {exercise.notes && (
                  <p className="mt-2 leading-relaxed">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-200">Notes: </span>
                    {exercise.notes}
                  </p>
                )}
              </div>
            )}

            <div className="mt-3">
              {exercise.originalName && !sameExerciseName(exercise.originalName, exercise.name) && (
                <p className="mb-2 rounded-2xl bg-lime-300/15 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200">
                  Substituted for {exercise.originalName}
                  {exercise.substitutionReason ? ` - ${exercise.substitutionReason}` : ""}
                </p>
              )}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setOpenSubstitutionIndex(openSubstitutionIndex === index ? null : index)}
              >
                Substitute Exercise
              </Button>

              {openSubstitutionIndex === index && (
                <div className="mt-3 rounded-2xl border border-lime-300/40 bg-lime-300/10 p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                    Choose substitution
                  </p>
                  {exercise.substitutions && exercise.substitutions.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {exercise.substitutions.map((option) => {
                        const draft = substitutionDrafts[index];
                        const selected = draft?.selectedName === option.name && !draft?.customName;
                        return (
                          <button
                            key={`${option.source}-${option.name}`}
                            type="button"
                            onClick={() =>
                              updateSubstitutionDraft(index, {
                                selectedName: option.name,
                                customName: "",
                              })
                            }
                            className={`min-h-11 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                              selected
                                ? "border-lime-400 bg-lime-300 text-zinc-950"
                                : "border-zinc-200 bg-white/80 text-zinc-600 hover:border-lime-300 dark:border-white/10 dark:bg-white/10 dark:text-zinc-200"
                            }`}
                          >
                            {option.name}
                            {option.source === "custom" ? " (saved)" : ""}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                      No saved substitutions yet. Add one below.
                    </p>
                  )}

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        Custom substitution
                      </span>
                      <input
                        value={substitutionDrafts[index]?.customName ?? ""}
                        onChange={(event) =>
                          updateSubstitutionDraft(index, {
                            customName: event.target.value,
                            selectedName: "",
                          })
                        }
                        placeholder="e.g. Hammer Strength Incline Press"
                        className={inputClassName}
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Reason</span>
                      <input
                        value={substitutionDrafts[index]?.reason ?? ""}
                        onChange={(event) => updateSubstitutionDraft(index, { reason: event.target.value })}
                        placeholder="e.g. Smith machine unavailable"
                        className={inputClassName}
                      />
                    </label>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      disabled={
                        !substitutionDrafts[index]?.selectedName.trim() &&
                        !substitutionDrafts[index]?.customName.trim()
                      }
                      onClick={() => applySubstitution(index)}
                    >
                      Save substitution
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="secondary" size="sm" className="mt-4 w-full" onClick={addExercise}>
        <Plus className="h-4 w-4" /> Add exercise
      </Button>
    </Modal>
  );
}

function OptionalNumberField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number | null;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number | null) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</span>
      <input
        type="number"
        value={value ?? ""}
        min={min}
        max={max}
        step={step}
        onChange={(event) => {
          const next = event.target.valueAsNumber;
          onChange(Number.isNaN(next) ? null : next);
        }}
        className={inputClassName}
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</span>
      <input
        type="number"
        value={Number.isNaN(value) ? "" : value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => {
          const next = event.target.valueAsNumber;
          onChange(Number.isNaN(next) ? 0 : next);
        }}
        className={inputClassName}
      />
    </label>
  );
}

function PrescriptionItem({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="font-semibold text-zinc-700 dark:text-zinc-200">{label}: </span>
      {value}
    </p>
  );
}
