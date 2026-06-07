"use client";

import { useQuery } from "@tanstack/react-query";
import { Dumbbell, Loader2, Moon, Play } from "lucide-react";
import { useState } from "react";
import { LiveWorkoutView } from "@/components/live-workout-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAthleteId, getTodayWorkout, listPrograms } from "@/lib/training-api";
import { useProgram } from "@/program-context";

export function CurrentWorkoutPage() {
  const { activeProgram } = useProgram();
  const athleteId = getAthleteId();
  const [isLive, setIsLive] = useState(false);

  const {
    data: today,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["training", "today"],
    queryFn: () => getTodayWorkout(athleteId),
  });

  const { data: programs } = useQuery({
    queryKey: ["training", "programs"],
    queryFn: () => listPrograms(athleteId),
  });

  const programName =
    programs?.find((program) => program.isActive)?.name ?? activeProgram?.name ?? "Your program";

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  if (isLive && today) {
    return (
      <LiveWorkoutView
        workout={today.workoutTemplate}
        date={today.date}
        programName={programName}
        onExit={() => setIsLive(false)}
      />
    );
  }

  return (
    <div className="grid gap-4">
      <section>
        <div className="mb-1 flex items-center gap-2">
          <Badge tone="lime">Current Workout</Badge>
          <Badge tone="zinc">{programName}</Badge>
        </div>
        <h2 className="text-2xl font-black tracking-tight md:text-3xl lg:text-4xl">{todayLabel}</h2>
      </section>

      <div aria-live="polite">
        {isLoading && (
          <Card className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />{" "}
            Loading today’s workout…
          </Card>
        )}

        {isError && (
          <Card className="text-sm text-red-600 dark:text-red-300">
            Could not load today’s workout. Check that the backend is running, then try again.
          </Card>
        )}
      </div>

      {!isLoading && !isError && !today && (
        <Card className="flex flex-col items-center gap-3 py-10 text-center">
          <Moon className="h-10 w-10 text-zinc-400" aria-hidden="true" />
          <CardTitle>Rest day</CardTitle>
          <CardDescription>No workout is scheduled for today. Enjoy your recovery.</CardDescription>
        </Card>
      )}

      {!isLoading && !isError && today && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="break-words text-2xl">
                  {today.workoutTemplate.workoutType ?? today.workoutTemplate.name}
                </CardTitle>
                <CardDescription>
                  {today.workoutTemplate.exercises.length} exercises
                  {today.workoutTemplate.description ? ` · ${today.workoutTemplate.description}` : ""}
                </CardDescription>
              </div>
              <Dumbbell className="h-6 w-6 shrink-0 text-lime-400" aria-hidden="true" />
            </div>
          </CardHeader>

          <div className="grid gap-2 sm:grid-cols-2">
            {today.workoutTemplate.exercises.map((exercise) => (
              <div
                key={exercise.id}
                className="min-w-0 rounded-2xl bg-zinc-100 p-3 dark:bg-white/[0.06]"
              >
                <p className="break-words font-semibold">{exercise.exerciseName}</p>
                <p className="text-sm tabular-nums text-zinc-500 dark:text-zinc-400">
                  {exercise.targetSets} × {exercise.targetRepMin}–{exercise.targetRepMax}
                  {exercise.lastSetRpe ? ` · RPE ${exercise.lastSetRpe}` : ""}
                </p>
              </div>
            ))}
          </div>

          <Button type="button" className="mt-5 w-full" onClick={() => setIsLive(true)}>
            <Play className="h-4 w-4" aria-hidden="true" /> Start Workout
          </Button>
        </Card>
      )}
    </div>
  );
}
