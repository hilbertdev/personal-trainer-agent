"use client";

import { Plus, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  buildQuickFillWorkout,
  createEmptyLoggedExercise,
  createId,
  type DayOfWeek,
  type LoggedExercise,
  type LoggedWorkout,
} from "@/lib/program";

export function LogWorkoutModal({
  open,
  onClose,
  dayOfWeek,
  workoutType,
  existing,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  dayOfWeek: DayOfWeek;
  workoutType: string;
  existing?: LoggedWorkout;
  onSave: (workout: LoggedWorkout) => void;
}) {
  const [exercises, setExercises] = useState<LoggedExercise[]>([createEmptyLoggedExercise()]);

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
  }, [open, existing]);

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
    setExercises(buildQuickFillWorkout(dayOfWeek, workoutType).exercises);
  };

  const validExercises = exercises.filter((exercise) => exercise.name.trim().length > 0);
  const canSave = validExercises.length > 0;

  const handleSave = () => {
    if (!canSave) {
      return;
    }
    onSave({
      id: existing?.id ?? createId("workout"),
      dayOfWeek,
      workoutType,
      exercises: validExercises.map((exercise) => ({
        ...exercise,
        name: exercise.name.trim(),
      })),
      loggedAt: new Date().toISOString(),
    });
    onClose();
  };

  const footer = (
    <div className="flex items-center justify-between gap-3">
      <Button type="button" variant="ghost" size="sm" onClick={onClose}>
        Cancel
      </Button>
      <Button type="button" disabled={!canSave} onClick={handleSave}>
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
          <Sparkles className="h-4 w-4" /> Quick-fill from sample
        </Button>
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
                className="w-full rounded-2xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-lime-400 focus:ring-2 focus:ring-lime-300 dark:border-white/15 dark:bg-white/5 dark:text-white"
              />
              <button
                type="button"
                aria-label="Remove exercise"
                onClick={() => removeExercise(index)}
                disabled={exercises.length === 1}
                className="shrink-0 rounded-full p-2 text-zinc-400 transition hover:bg-zinc-950/10 disabled:opacity-40 dark:hover:bg-white/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
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
          </div>
        ))}
      </div>

      <Button type="button" variant="secondary" size="sm" className="mt-4 w-full" onClick={addExercise}>
        <Plus className="h-4 w-4" /> Add exercise
      </Button>
    </Modal>
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
        className="mt-1 w-full rounded-2xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-lime-400 focus:ring-2 focus:ring-lime-300 dark:border-white/15 dark:bg-white/5 dark:text-white"
      />
    </label>
  );
}
