"use client";

import {
  ArrowRight,
  Check,
  CheckCircle2,
  Dumbbell,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  getAthleteId,
  recordExecution,
  type ExerciseExecutionPayload,
  type ExerciseTemplateDto,
  type WorkoutTemplateDto,
} from "@/lib/training-api";
import { useProgram } from "@/program-context";
import { cn } from "@/lib/utils";

type Stage = "exercises" | "saving" | "done";

interface PerformedSet {
  reps: number;
  weight: number;
}

interface SetDraft {
  reps: string;
  weight: string;
}

interface ExerciseDraft {
  exerciseName: string;
  sets: SetDraft[];
}

interface ExerciseResult {
  templateExerciseId: string;
  exerciseName: string;
  sets: PerformedSet[];
  substitutionReason: string | null;
}

export function LiveWorkoutView({
  workout,
  date,
  programName,
  onExit,
}: {
  workout: WorkoutTemplateDto;
  date: string;
  programName: string;
  onExit: () => void;
}) {
  const { syncStrava, stravaActivities, stravaSyncStatus, resetStravaSync } = useProgram();

  const [stage, setStage] = useState<Stage>("exercises");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [startedAt] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [linkedActivityId, setLinkedActivityId] = useState<string | null>(null);

  const exercises = workout.exercises;
  const total = exercises.length;
  const current = exercises[currentIndex];

  const [draft, setDraft] = useState<ExerciseDraft>(() => createDraft(workout, 0));

  const completedPercent = total > 0 ? Math.round((results.length / total) * 100) : 100;

  const updateSet = (index: number, field: keyof SetDraft, value: string) => {
    setDraft((current) => ({
      ...current,
      sets: current.sets.map((set, setIndex) =>
        setIndex === index ? { ...set, [field]: value } : set,
      ),
    }));
  };

  const addSet = () => {
    setDraft((current) => {
      const last = current.sets[current.sets.length - 1];
      return {
        ...current,
        sets: [...current.sets, last ? { ...last } : { reps: "0", weight: "0" }],
      };
    });
  };

  const removeSet = (index: number) => {
    setDraft((current) => ({
      ...current,
      sets:
        current.sets.length > 1
          ? current.sets.filter((_, setIndex) => setIndex !== index)
          : current.sets,
    }));
  };

  const completeExercise = () => {
    if (!current) {
      return;
    }
    const performedSets: PerformedSet[] = draft.sets.map((set) => ({
      reps: clampNumber(set.reps),
      weight: clampNumber(set.weight),
    }));
    const result: ExerciseResult = {
      templateExerciseId: current.id,
      exerciseName: draft.exerciseName.trim() || current.exerciseName,
      sets: performedSets,
      substitutionReason:
        draft.exerciseName.trim() &&
        draft.exerciseName.trim().toLowerCase() !== current.exerciseName.toLowerCase()
          ? "Swapped during workout"
          : null,
    };
    const nextResults = [...results, result];
    setResults(nextResults);

    if (currentIndex + 1 < total) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setDraft(createDraft(workout, nextIndex));
    } else {
      void finish(nextResults);
    }
  };

  const finish = async (finalResults: ExerciseResult[]) => {
    setStage("saving");
    setError(null);
    const durationMinutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
    const payloadExercises: ExerciseExecutionPayload[] = finalResults.map((result) => ({
      originalExerciseTemplateId: result.templateExerciseId,
      exerciseName: result.exerciseName,
      setsPerformed: result.sets.length,
      repsPerformed: averageReps(result.sets),
      weightUsed: averageWeight(result.sets),
      substitutionReason: result.substitutionReason,
      contextTags: [],
    }));
    const totalVolume = finalResults.reduce((sum, result) => sum + exerciseVolume(result.sets), 0);

    try {
      await recordExecution(workout.id, {
        athleteId: getAthleteId(),
        date,
        exercises: payloadExercises,
        durationMinutes,
        totalVolume: totalVolume > 0 ? totalVolume : null,
        notes: buildExecutionNotes(workout, finalResults),
      });
      setStage("done");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save workout.");
      setStage("exercises");
    }
  };

  const handleExit = () => {
    resetStravaSync();
    onExit();
  };

  if (stage === "done") {
    return (
      <WorkoutComplete
        programName={programName}
        completedCount={results.length}
        activities={stravaActivities}
        syncStatus={stravaSyncStatus}
        linkedActivityId={linkedActivityId}
        onSync={syncStrava}
        onLink={setLinkedActivityId}
        onDone={handleExit}
      />
    );
  }

  return (
    <div className="grid gap-4">
      <section className="flex items-center justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Badge tone="lime">Live workout</Badge>
            <Badge tone="zinc">{programName}</Badge>
          </div>
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
            {workout.workoutType ?? workout.name}
          </h2>
          {workout.description && (
            <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
              {workout.description}
            </p>
          )}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={handleExit}>
          <X className="h-4 w-4" /> Quit
        </Button>
      </section>

      <Card>
        <div className="mb-3 flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
          <span>
            Exercise {Math.min(currentIndex + 1, total)} of {total}
          </span>
          <span>{completedPercent}% complete</span>
        </div>
        <Progress value={completedPercent} />
      </Card>

      {current && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-2xl">{current.exerciseName}</CardTitle>
                <CardDescription>
                  Target: {current.targetSets} x {current.targetRepMin}-{current.targetRepMax}
                  {current.lastSetRpe ? ` - RPE ${current.lastSetRpe}` : ""}
                  {current.restTime ? ` - rest ${current.restTime}` : ""}
                </CardDescription>
              </div>
              <Dumbbell className="h-6 w-6 text-lime-400" />
            </div>
          </CardHeader>

          <ExerciseNotes exercise={current} />

          <div className="grid gap-3">
            <Field label="Exercise (edit to substitute)">
              <input
                type="text"
                value={draft.exerciseName}
                onChange={(event) => setDraft({ ...draft, exerciseName: event.target.value })}
                className={inputClass}
              />
            </Field>

            <div className="grid gap-2">
              <div className="grid grid-cols-[2.5rem_1fr_1fr_2.25rem] items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                <span>Set</span>
                <span>Reps</span>
                <span>Weight (kg)</span>
                <span className="sr-only">Remove</span>
              </div>
              {draft.sets.map((set, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[2.5rem_1fr_1fr_2.25rem] items-center gap-2"
                >
                  <span className="text-center text-sm font-bold text-zinc-500 dark:text-zinc-400">
                    {index + 1}
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={set.reps}
                    aria-label={`Set ${index + 1} reps`}
                    onChange={(event) => updateSet(index, "reps", event.target.value)}
                    className={inputClass}
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={set.weight}
                    aria-label={`Set ${index + 1} weight`}
                    onChange={(event) => updateSet(index, "weight", event.target.value)}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    aria-label={`Remove set ${index + 1}`}
                    disabled={draft.sets.length <= 1}
                    onClick={() => removeSet(index)}
                    className="flex h-9 w-9 items-center justify-center rounded-2xl text-zinc-400 transition hover:bg-zinc-950/10 disabled:opacity-30 dark:hover:bg-white/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <Button type="button" variant="secondary" size="sm" className="justify-self-start" onClick={addSet}>
                <Plus className="h-4 w-4" /> Add set
              </Button>
            </div>

            {current.substitutions.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <span>Swap:</span>
                {current.substitutions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setDraft({ ...draft, exerciseName: option.exerciseName })}
                    className="rounded-full border border-zinc-300 px-2.5 py-1 font-medium transition hover:bg-zinc-950/5 dark:border-white/15 dark:hover:bg-white/10"
                  >
                    {option.exerciseName}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-300">{error}</p>}

          <Button type="button" className="mt-5 w-full" onClick={completeExercise} disabled={stage === "saving"}>
            {stage === "saving" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : currentIndex + 1 < total ? (
              <>
                Complete exercise <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                Finish workout <Check className="h-4 w-4" />
              </>
            )}
          </Button>
        </Card>
      )}

      {results.length > 0 && (
        <Card>
          <CardTitle className="mb-3 text-base">Completed</CardTitle>
          <div className="space-y-2">
            {results.map((result, index) => (
              <div
                key={`${result.templateExerciseId}-${index}`}
                className="flex items-start justify-between gap-3 rounded-2xl bg-zinc-100 px-3 py-2 text-sm dark:bg-white/[0.06]"
              >
                <span className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-lime-500" /> {result.exerciseName}
                </span>
                <span className="text-right text-zinc-500 dark:text-zinc-400">
                  {formatSets(result.sets)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function ExerciseNotes({ exercise }: { exercise: ExerciseTemplateDto }) {
  const lines: string[] = [];
  if (exercise.warmupSets) {
    lines.push(`Warm-up: ${exercise.warmupSets}`);
  }
  if (exercise.earlySetRpe) {
    lines.push(`Early sets: RPE ${exercise.earlySetRpe}`);
  }
  if (exercise.lastSetIntensityTechnique) {
    lines.push(`Last set: ${exercise.lastSetIntensityTechnique}`);
  }
  if (exercise.notes) {
    lines.push(exercise.notes);
  }

  if (lines.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 flex gap-2 rounded-2xl border border-amber-500/30 bg-amber-100/60 px-3 py-2 text-sm text-amber-900 dark:border-amber-300/30 dark:bg-amber-300/10 dark:text-amber-100">
      <StickyNote className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="space-y-0.5">
        {lines.map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </div>
    </div>
  );
}

function WorkoutComplete({
  programName,
  completedCount,
  activities,
  syncStatus,
  linkedActivityId,
  onSync,
  onLink,
  onDone,
}: {
  programName: string;
  completedCount: number;
  activities: { activityId: string; name: string; durationMinutes: number; avgHeartRate?: number }[];
  syncStatus: "idle" | "syncing" | "synced" | "error";
  linkedActivityId: string | null;
  onSync: () => Promise<void>;
  onLink: (activityId: string | null) => void;
  onDone: () => void;
}) {
  return (
    <div className="grid gap-4">
      <Card className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-lime-500" />
        <CardTitle className="text-2xl">Workout complete</CardTitle>
        <CardDescription>
          Logged {completedCount} exercise{completedCount === 1 ? "" : "s"} for {programName}.
        </CardDescription>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sync with Strava for enrichment</CardTitle>
          <CardDescription>
            Pull in your recent Strava activities and link one to enrich this session with heart
            rate and duration.
          </CardDescription>
        </CardHeader>

        {syncStatus !== "synced" && (
          <Button
            type="button"
            onClick={() => void onSync()}
            disabled={syncStatus === "syncing"}
            className="w-full"
          >
            {syncStatus === "syncing" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {syncStatus === "error" ? "Retry Strava sync" : "Sync with Strava"}
          </Button>
        )}

        {syncStatus === "error" && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-300">
            Strava sync failed. Try again.
          </p>
        )}

        {syncStatus === "synced" && (
          <div className="space-y-2">
            {activities.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No Strava activities found to link.
              </p>
            ) : (
              activities.map((activity) => {
                const linked = linkedActivityId === activity.activityId;
                return (
                  <button
                    key={activity.activityId}
                    type="button"
                    onClick={() => onLink(linked ? null : activity.activityId)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-2xl border p-3 text-left transition",
                      linked
                        ? "border-lime-400/50 bg-lime-300/10 dark:border-lime-300/30"
                        : "border-zinc-200 bg-white/70 hover:bg-zinc-950/5 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10",
                    )}
                  >
                    <div>
                      <p className="text-sm font-bold">{activity.name}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {activity.durationMinutes} min
                        {activity.avgHeartRate ? ` - avg HR ${activity.avgHeartRate}` : ""}
                      </p>
                    </div>
                    {linked ? (
                      <Badge tone="lime">Linked</Badge>
                    ) : (
                      <Link2 className="h-4 w-4 text-zinc-400" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </Card>

      <Button type="button" variant="secondary" className="w-full" onClick={onDone}>
        Done
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-zinc-600 dark:text-zinc-300">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-2xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-lime-400 focus:ring-2 focus:ring-lime-300 dark:border-white/15 dark:bg-zinc-900 dark:text-white";

function createDraft(workout: WorkoutTemplateDto, index: number): ExerciseDraft {
  const exercise = workout.exercises[index];
  if (!exercise) {
    return { exerciseName: "", sets: [{ reps: "0", weight: "0" }] };
  }
  const midReps = Math.round((exercise.targetRepMin + exercise.targetRepMax) / 2);
  const setCount = Math.max(1, exercise.targetSets);
  return {
    exerciseName: exercise.exerciseName,
    sets: Array.from({ length: setCount }, () => ({ reps: String(midReps), weight: "0" })),
  };
}

function clampNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function exerciseVolume(sets: PerformedSet[]): number {
  return sets.reduce((sum, set) => sum + set.reps * set.weight, 0);
}

function averageReps(sets: PerformedSet[]): number {
  if (sets.length === 0) {
    return 0;
  }
  return Math.round(sets.reduce((sum, set) => sum + set.reps, 0) / sets.length);
}

function averageWeight(sets: PerformedSet[]): number {
  const weighted = sets.filter((set) => set.weight > 0);
  if (weighted.length === 0) {
    return 0;
  }
  const average = weighted.reduce((sum, set) => sum + set.weight, 0) / weighted.length;
  return Math.round(average * 100) / 100;
}

function formatSets(sets: PerformedSet[]): string {
  return sets
    .map((set) => (set.weight > 0 ? `${set.reps}x${set.weight}kg` : `${set.reps} reps`))
    .join(", ");
}

function buildExecutionNotes(workout: WorkoutTemplateDto, results: ExerciseResult[]): string {
  const header = `${workout.workoutType ?? workout.name} - logged live`;
  const lines = results.map((result) => `${result.exerciseName}: ${formatSets(result.sets)}`);
  return [header, ...lines].join("\n");
}
