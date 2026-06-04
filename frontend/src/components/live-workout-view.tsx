"use client";

import {
  ArrowRight,
  Check,
  CheckCircle2,
  Dumbbell,
  Link2,
  Loader2,
  RefreshCw,
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
  type WorkoutTemplateDto,
} from "@/lib/training-api";
import { useProgram } from "@/program-context";
import { cn } from "@/lib/utils";

type Stage = "exercises" | "saving" | "done";

interface ExerciseResult {
  templateExerciseId: string;
  exerciseName: string;
  setsPerformed: number;
  repsPerformed: number;
  weightUsed: number;
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

  const [draft, setDraft] = useState(() => createDraft(workout, 0));

  const completedPercent = total > 0 ? Math.round((results.length / total) * 100) : 100;

  const completeExercise = () => {
    if (!current) {
      return;
    }
    const result: ExerciseResult = {
      templateExerciseId: current.id,
      exerciseName: draft.exerciseName.trim() || current.exerciseName,
      setsPerformed: clampNumber(draft.sets),
      repsPerformed: clampNumber(draft.reps),
      weightUsed: clampNumber(draft.weight),
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
      setsPerformed: result.setsPerformed,
      repsPerformed: result.repsPerformed,
      weightUsed: result.weightUsed,
      substitutionReason: result.substitutionReason,
      contextTags: [],
    }));

    try {
      await recordExecution(workout.id, {
        athleteId: getAthleteId(),
        date,
        exercises: payloadExercises,
        durationMinutes,
        totalVolume: null,
        notes: `${workout.workoutType ?? workout.name} - logged live`,
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

          <div className="grid gap-3">
            <Field label="Exercise (edit to substitute)">
              <input
                type="text"
                value={draft.exerciseName}
                onChange={(event) => setDraft({ ...draft, exerciseName: event.target.value })}
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Sets">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={draft.sets}
                  onChange={(event) => setDraft({ ...draft, sets: event.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Reps">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={draft.reps}
                  onChange={(event) => setDraft({ ...draft, reps: event.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Weight (kg)">
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={draft.weight}
                  onChange={(event) => setDraft({ ...draft, weight: event.target.value })}
                  className={inputClass}
                />
              </Field>
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
                className="flex items-center justify-between rounded-2xl bg-zinc-100 px-3 py-2 text-sm dark:bg-white/[0.06]"
              >
                <span className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-lime-500" /> {result.exerciseName}
                </span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {result.setsPerformed} x {result.repsPerformed}
                  {result.weightUsed > 0 ? ` @ ${result.weightUsed}kg` : ""}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
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

function createDraft(workout: WorkoutTemplateDto, index: number) {
  const exercise = workout.exercises[index];
  if (!exercise) {
    return { exerciseName: "", sets: "0", reps: "0", weight: "0" };
  }
  const midReps = Math.round((exercise.targetRepMin + exercise.targetRepMax) / 2);
  return {
    exerciseName: exercise.exerciseName,
    sets: String(exercise.targetSets),
    reps: String(midReps),
    weight: "0",
  };
}

function clampNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}
