"use client";

import { CalendarDays, ChevronRight, Dumbbell, Moon, Pencil, RotateCcw } from "lucide-react";
import { useState } from "react";
import { LogWorkoutModal } from "@/components/log-workout-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  getSplitDefinition,
  type DayOfWeek,
  type LoggedWorkout,
  type MesocycleWeek,
  type Program,
} from "@/lib/program";
import { useProgram } from "@/program-context";
import { cn } from "@/lib/utils";

interface EditTarget {
  weekNumber: number;
  dayOfWeek: DayOfWeek;
  workoutType: string;
  workout: LoggedWorkout | null;
}

// JS getDay(): 0 = Sunday .. 6 = Saturday.
const JS_DAY_TO_DAY_OF_WEEK: DayOfWeek[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function getTodayDayOfWeek(): DayOfWeek {
  return JS_DAY_TO_DAY_OF_WEEK[new Date().getDay()];
}

export function ActiveMesocycleView({ program }: { program: Program }) {
  const { advanceWeek, resetProgram, updateMesocycleWorkout } = useProgram();
  const definition = getSplitDefinition(program.splitType);
  const mesocycle = program.mesocycle;

  const [selectedWeek, setSelectedWeek] = useState(mesocycle?.currentWeek ?? 1);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  if (!mesocycle) {
    return null;
  }

  const currentWeek = mesocycle.currentWeek;
  const activeWeek =
    mesocycle.weeks.find((week) => week.weekNumber === selectedWeek) ?? mesocycle.weeks[0];
  const progressPercent = Math.round((currentWeek / mesocycle.lengthWeeks) * 100);
  const isFinalWeek = currentWeek >= mesocycle.lengthWeeks;
  const sessionsPerWeek = countSessions(mesocycle.weeks[0]);

  const today = getTodayDayOfWeek();
  const currentWeekData = mesocycle.weeks.find((week) => week.weekNumber === currentWeek);
  const todaysEntry = currentWeekData?.days.find((day) => day.dayOfWeek === today);
  const todaysWorkout = todaysEntry?.workout ?? null;
  const todaysType = todaysEntry?.workoutType ?? null;

  return (
    <div className="grid gap-4">
      <section className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
        <Card className="relative overflow-hidden">
          <div className="absolute right-[-4rem] top-[-4rem] h-40 w-40 rounded-full bg-lime-300/20 blur-3xl" />
          <CardHeader className="relative">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge tone="lime">Active Mesocycle</Badge>
              <Badge tone="zinc">{definition.label}</Badge>
            </div>
            <h2 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
              {program.name}
            </h2>
            <p className="mt-4 max-w-2xl text-base text-zinc-600 dark:text-zinc-300">
              Week {currentWeek} of {mesocycle.lengthWeeks}. Remaining weeks were generated from your
              baseline week using your progression settings.
            </p>
          </CardHeader>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Current week" value={`${currentWeek} / ${mesocycle.lengthWeeks}`} />
            <Stat label="Sessions / week" value={sessionsPerWeek} />
            <Stat label="Today's workout" value={todaysType ?? "Rest"} />
          </div>
        </Card>

        <Card className="bg-lime-300 text-zinc-950">
          <CardHeader>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-700">
              Program progress
            </p>
            <h2 className="text-5xl font-black tracking-tight">{progressPercent}%</h2>
            <p className="text-sm font-medium text-zinc-700">of the mesocycle complete</p>
          </CardHeader>
          <Progress value={progressPercent} className="bg-zinc-950/15" />
          <Button
            type="button"
            variant="secondary"
            className="mt-5 w-full bg-zinc-950/10 text-zinc-950 hover:bg-zinc-950/15"
            disabled={isFinalWeek}
            onClick={() => {
              advanceWeek();
              setSelectedWeek((week) => Math.min(week + 1, mesocycle.lengthWeeks));
            }}
          >
            {isFinalWeek ? "Final week reached" : "Advance to next week"}
            {!isFinalWeek && <ChevronRight className="h-4 w-4" />}
          </Button>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Today's Workout</CardTitle>
                <CardDescription>
                  {today} - Week {currentWeek}
                  {todaysType ? ` - ${todaysType} Day` : ""}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {todaysWorkout && todaysType && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setEditTarget({
                        weekNumber: currentWeek,
                        dayOfWeek: today,
                        workoutType: todaysType,
                        workout: todaysWorkout,
                      })
                    }
                  >
                    <Pencil className="h-4 w-4" /> Edit
                  </Button>
                )}
                {todaysWorkout ? (
                  <Dumbbell className="h-6 w-6 text-lime-300" />
                ) : (
                  <Moon className="h-6 w-6 text-zinc-400" />
                )}
              </div>
            </div>
          </CardHeader>
          {todaysWorkout ? (
            <WorkoutExerciseGrid workout={todaysWorkout} />
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Rest day - no workout scheduled for today.
            </p>
          )}
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Mesocycle plan</CardTitle>
                <CardDescription>
                  Generated weeks with placeholder progression applied.
                </CardDescription>
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {mesocycle.weeks.map((week) => (
                  <Button
                    key={week.weekNumber}
                    type="button"
                    size="sm"
                    variant={week.weekNumber === selectedWeek ? "default" : "secondary"}
                    onClick={() => setSelectedWeek(week.weekNumber)}
                    title={
                      [week.blockName, week.isDeload ? "Deload" : null].filter(Boolean).join(" - ") ||
                      undefined
                    }
                  >
                    Week {week.weekNumber}
                    {week.isBaseline ? " *" : ""}
                    {week.isDeload ? " ↓" : ""}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>

          {(activeWeek.blockName || activeWeek.isBaseline || activeWeek.isDeload) && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {activeWeek.blockName && <Badge tone="zinc">{activeWeek.blockName}</Badge>}
              {activeWeek.isBaseline && <Badge tone="lime">Baseline week</Badge>}
              {activeWeek.isDeload && <Badge tone="amber">Deload - train lighter, cap RPE</Badge>}
            </div>
          )}

          {activeWeek.isBaseline && !activeWeek.blockName && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-lime-300/40 bg-lime-300/10 px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300">
              <CalendarDays className="h-4 w-4 text-lime-500" />
              Baseline week - the source of truth for the whole mesocycle.
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {activeWeek.days
              .filter((day) => day.workoutType !== null)
              .map((day) => {
                const isToday = day.dayOfWeek === today && activeWeek.weekNumber === currentWeek;
                return (
                  <div
                    key={day.dayOfWeek}
                    className={cn(
                      "rounded-3xl border p-4",
                      isToday
                        ? "border-lime-400/50 bg-lime-300/10"
                        : "border-zinc-200 bg-zinc-100 dark:border-white/10 dark:bg-black/20",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold">
                          {day.dayOfWeek} - {day.workoutType} Day
                        </h3>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {day.workout?.exercises.length ?? 0} exercises
                        </p>
                      </div>
                      {day.workoutType && (
                        <button
                          type="button"
                          aria-label={`Edit ${day.dayOfWeek} workout`}
                          onClick={() =>
                            setEditTarget({
                              weekNumber: activeWeek.weekNumber,
                              dayOfWeek: day.dayOfWeek,
                              workoutType: day.workoutType as string,
                              workout: day.workout,
                            })
                          }
                          className="shrink-0 rounded-full p-2 text-zinc-400 transition hover:bg-zinc-950/10 dark:hover:bg-white/10"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {day.workout && <WorkoutExerciseGrid workout={day.workout} compact />}
                  </div>
                );
              })}
          </div>
        </Card>
      </section>

      <section className="flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={resetProgram}>
          <RotateCcw className="h-4 w-4" /> End program
        </Button>
      </section>

      {editTarget && (
        <LogWorkoutModal
          open
          onClose={() => setEditTarget(null)}
          dayOfWeek={editTarget.dayOfWeek}
          workoutType={editTarget.workoutType}
          existing={editTarget.workout ?? undefined}
          substitutionMemory={program.substitutionMemory}
          onSave={(workout) => updateMesocycleWorkout(editTarget.weekNumber, workout)}
        />
      )}
    </div>
  );
}

function countSessions(week: MesocycleWeek | undefined): number {
  if (!week) {
    return 0;
  }
  return week.days.filter((day) => day.workoutType !== null).length;
}

function WorkoutExerciseGrid({
  workout,
  compact = false,
}: {
  workout: LoggedWorkout;
  compact?: boolean;
}) {
  return (
    <div className={cn("gap-2", compact ? "mt-3 space-y-2" : "grid sm:grid-cols-2")}>
      {workout.exercises.map((exercise) => (
        <div
          key={exercise.name}
          className={cn(
            "rounded-2xl",
            compact ? "bg-white/60 p-2 dark:bg-white/[0.04]" : "bg-zinc-100 p-3 dark:bg-white/[0.06]",
          )}
        >
          <p className={cn("font-semibold", compact ? "text-sm" : "")}>{exercise.name}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {exercise.sets} x {exercise.repRangeMin}-{exercise.repRangeMax}
            {exercise.weight > 0 ? ` | ${exercise.weight}kg` : ""} | RPE {exercise.rpe}
          </p>
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white/70 p-4 dark:border-white/10 dark:bg-black/20">
      <p className="text-2xl font-black">{value}</p>
      <p className="text-sm text-zinc-400">{label}</p>
    </div>
  );
}
