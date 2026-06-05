"use client";

import {
  Activity,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  HeartPulse,
  Moon,
  Pencil,
  RotateCcw,
  Sparkles,
  Timer,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LogWorkoutModal } from "@/components/log-workout-modal";
import { StravaMappingModal } from "@/components/strava-mapping-modal";
import { WeeklyWorkloadSummary } from "@/components/weekly-workload-summary";
import {
  getLoggedWorkoutForDay,
  getSplitDefinition,
  isBaselineComplete,
  loggedSessionCount,
  requiredSessionCount,
  type DayOfWeek,
  type LoggedWorkout,
  type Program,
} from "@/lib/program";
import { useProgram } from "@/program-context";
import { cn } from "@/lib/utils";

interface ActiveSession {
  dayOfWeek: DayOfWeek;
  workoutType: string;
  existing?: LoggedWorkout;
}

export function BaselineWeekView({ program }: { program: Program }) {
  const { logWorkout, generateMesocycle, resetProgram, syncStrava, stravaSyncStatus } =
    useProgram();
  const definition = getSplitDefinition(program.splitType);
  const requiredSessions = requiredSessionCount(program.weeklyCycle);
  const loggedCount = loggedSessionCount(program);
  const complete = isBaselineComplete(program);
  const percent = requiredSessions === 0 ? 0 : Math.round((loggedCount / requiredSessions) * 100);

  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [isMappingOpen, setIsMappingOpen] = useState(false);

  const isSyncing = stravaSyncStatus === "syncing";
  const handleSyncStrava = async () => {
    await syncStrava();
    setIsMappingOpen(true);
  };

  return (
    <div className="grid gap-4">
      <section className="grid min-w-0 gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Card className="relative overflow-hidden">
          <div className="absolute right-[-4rem] top-[-4rem] h-40 w-40 rounded-full bg-lime-300/20 blur-3xl" />
          <CardHeader className="relative">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge tone="amber">Collecting Baseline Week</Badge>
              <Badge tone="zinc">{definition.label}</Badge>
              <Badge tone="zinc">{program.mesocycleLengthWeeks} week mesocycle</Badge>
            </div>
            <h2 className="break-words text-3xl font-black leading-tight tracking-tight sm:text-5xl">
              {program.name}
            </h2>
            <p className="mt-4 max-w-2xl text-base text-zinc-600 dark:text-zinc-300">
              Log each scheduled workout in your weekly cycle. Your first completed week becomes the
              baseline, the source of truth we use to generate the rest of the mesocycle.
            </p>
          </CardHeader>
        </Card>

        <Card className="bg-lime-300 text-zinc-950">
          <CardHeader>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-700">
              Baseline progress
            </p>
            <h2 className="text-5xl font-black tracking-tight">
              {loggedCount} / {requiredSessions}
            </h2>
            <p className="text-sm font-medium text-zinc-700">sessions logged</p>
          </CardHeader>
          <Progress value={percent} className="bg-zinc-950/15" />
          <p className="mt-4 text-sm font-semibold text-zinc-700">
            {complete
              ? "Baseline week complete. Ready to generate your mesocycle."
              : `${requiredSessions - loggedCount} session${
                  requiredSessions - loggedCount === 1 ? "" : "s"
                } left to log.`}
          </p>
        </Card>
      </section>

      <section className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <CardTitle>Baseline Week</CardTitle>
                <CardDescription>
                  Log the real workout you performed for each scheduled day.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full sm:w-auto"
                disabled={loggedCount === 0 || isSyncing}
                onClick={handleSyncStrava}
              >
                <Activity className="h-4 w-4" />
                {isSyncing ? "Syncing..." : "Sync Strava Activities"}
              </Button>
            </div>
            {stravaSyncStatus === "error" && (
              <p className="mt-2 text-xs font-semibold text-red-500">
                Could not sync Strava. Please try again.
              </p>
            )}
          </CardHeader>
          <div className="space-y-2">
            {program.weeklyCycle.days.map((day) => {
              if (day.workoutType === null) {
                return (
                  <div
                    key={day.dayOfWeek}
                    className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-500 dark:border-white/10 dark:bg-black/20 dark:text-zinc-400"
                  >
                    <Moon className="h-5 w-5" />
                    <span className="text-sm font-semibold">{day.dayOfWeek}</span>
                    <span className="ml-auto text-sm">Rest</span>
                  </div>
                );
              }

              const workoutType = day.workoutType;
              const logged = getLoggedWorkoutForDay(program, day.dayOfWeek);
              return (
                <div
                  key={day.dayOfWeek}
                  className={cn(
                    "rounded-2xl border p-4 transition",
                    logged
                      ? "border-lime-400/50 bg-lime-300/10 dark:border-lime-300/30"
                      : "border-zinc-200 bg-white/70 dark:border-white/10 dark:bg-black/20",
                  )}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      {logged ? (
                        <CheckCircle2 className="h-5 w-5 text-lime-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-zinc-400" />
                      )}
                      <div className="min-w-0">
                        <p className="break-words text-sm font-bold">
                          {day.dayOfWeek} - {workoutType}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {logged
                            ? `${logged.templateName ?? "Complete"} - ${logged.exercises.length} exercise${
                                logged.exercises.length === 1 ? "" : "s"
                              }`
                            : "Pending"}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant={logged ? "ghost" : "secondary"}
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() =>
                        setActiveSession({
                          dayOfWeek: day.dayOfWeek,
                          workoutType,
                          existing: logged,
                        })
                      }
                    >
                      {logged ? (
                        <>
                          <Pencil className="h-4 w-4" /> Edit
                        </>
                      ) : (
                        <>
                          <Dumbbell className="h-4 w-4" /> Log workout
                        </>
                      )}
                    </Button>
                  </div>

                  {logged && logged.exercises.length > 0 && (
                    <ul className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
                      {logged.exercises.slice(0, 3).map((exercise) => (
                        <li key={exercise.name} className="flex min-w-0 justify-between gap-2">
                          <span className="truncate">{exercise.name}</span>
                          <span className="shrink-0 text-zinc-400">
                            {exercise.sets} x {exercise.repRangeMin}-{exercise.repRangeMax}
                            {exercise.weight > 0 ? ` | ${exercise.weight}kg` : ""}
                          </span>
                        </li>
                      ))}
                      {logged.exercises.length > 3 && (
                        <li className="text-xs text-zinc-400">
                          + {logged.exercises.length - 3} more
                        </li>
                      )}
                    </ul>
                  )}

                  {logged && <WorkoutPhysiology workout={logged} />}
                </div>
              );
            })}
          </div>
        </Card>

        <div className="grid content-start gap-4">
          <WeeklyWorkloadSummary weeklyCycle={program.weeklyCycle} />

          {complete && (
            <Card className="border-lime-400/40 bg-lime-300/10">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-1 h-6 w-6 text-lime-500" />
                <div>
                  <CardTitle>Baseline Week Complete</CardTitle>
                  <CardDescription>
                    Generate the remaining {program.mesocycleLengthWeeks - 1} weeks using your
                    progression settings.
                  </CardDescription>
                </div>
              </div>
              <Button type="button" className="mt-4 w-full" onClick={generateMesocycle}>
                <Sparkles className="h-4 w-4" /> Generate Mesocycle
              </Button>
            </Card>
          )}
        </div>
      </section>

      <section className="flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={resetProgram}>
          <RotateCcw className="h-4 w-4" /> Discard plan
        </Button>
      </section>

      {activeSession && (
        <LogWorkoutModal
          open
          onClose={() => setActiveSession(null)}
          dayOfWeek={activeSession.dayOfWeek}
          workoutType={activeSession.workoutType}
          existing={activeSession.existing}
          onSave={logWorkout}
          substitutionMemory={program.substitutionMemory}
        />
      )}

      <StravaMappingModal
        open={isMappingOpen}
        onClose={() => setIsMappingOpen(false)}
        program={program}
      />
    </div>
  );
}

function WorkoutPhysiology({ workout }: { workout: LoggedWorkout }) {
  const enriched = workout.enrichmentStatus === "enriched";
  const calories = workout.stravaData?.calories;
  const distanceKm = workout.stravaData?.distanceKm;
  const hasPhysiology =
    workout.heartRate !== undefined ||
    workout.effort !== undefined ||
    workout.durationMinutes !== undefined ||
    calories !== undefined ||
    distanceKm !== undefined;

  if (!hasPhysiology && !enriched) {
    return null;
  }

  return (
    <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-white/10">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
        {workout.heartRate && (
          <span className="inline-flex items-center gap-1">
            <HeartPulse className="h-3.5 w-3.5 text-rose-400" />
            {workout.heartRate.avg} bpm
            {workout.heartRate.max ? ` (max ${workout.heartRate.max})` : ""}
          </span>
        )}
        {workout.effort !== undefined && (
          <span className="inline-flex items-center gap-1">
            <Activity className="h-3.5 w-3.5 text-amber-400" />
            Effort {workout.effort}/10
          </span>
        )}
        {workout.durationMinutes !== undefined && (
          <span className="inline-flex items-center gap-1">
            <Timer className="h-3.5 w-3.5 text-sky-400" />
            {workout.durationMinutes} min
          </span>
        )}
        {calories !== undefined && (
          <span className="inline-flex items-center gap-1">
            <Flame className="h-3.5 w-3.5 text-orange-400" />
            {calories} kcal
          </span>
        )}
        {distanceKm !== undefined && (
          <span className="inline-flex items-center gap-1">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            {distanceKm} km
          </span>
        )}
      </div>
      <div className="mt-2">
        <Badge tone={enriched ? "lime" : "zinc"}>
          {enriched ? "Enriched with Strava" : "Manual"}
        </Badge>
      </div>
    </div>
  );
}
