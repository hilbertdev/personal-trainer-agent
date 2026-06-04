"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  Dumbbell,
  Flame,
  HeartPulse,
  Loader2,
  Plus,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  analyzeWorkout,
  getProgress,
  getSampleWorkout,
  recordCompletedWorkout,
  USE_MOCK_DATA,
  type ProjectedWeek,
  type WorkoutAnalysis,
  type WorkoutDay,
  type WorkoutProgress,
  type WorkoutWeek,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ThemeToggle } from "@/components/theme-toggle";
import { useProgram } from "@/program-context";
import { cn } from "@/lib/utils";

export function BetaDashboard() {
  const queryClient = useQueryClient();
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
  const [selectedProjectionWeek, setSelectedProjectionWeek] = useState(1);

  const sampleQuery = useQuery({
    queryKey: ["sample-workout"],
    queryFn: getSampleWorkout,
  });
  const progressQuery = useQuery({
    queryKey: ["progress"],
    queryFn: getProgress,
  });
  const analysisQuery = useQuery({
    queryKey: ["analysis", sampleQuery.data?.summary.weekStart],
    queryFn: () => analyzeWorkout(sampleQuery.data?.workouts ?? []),
    enabled: Boolean(sampleQuery.data?.workouts.length),
  });
  const completeWorkout = useMutation({
    mutationFn: recordCompletedWorkout,
    onSuccess: (progress) => {
      queryClient.setQueryData(["progress"], progress);
    },
  });

  const sample = sampleQuery.data;
  const analysis = analysisQuery.data;
  const progress = progressQuery.data;
  const completedDates = useMemo(
    () => new Set(progress?.completedWorkouts.map((workout) => workout.workoutDate)),
    [progress?.completedWorkouts],
  );
  const completionPercent = getCompletionPercent(sample, progress);

  if (sampleQuery.isLoading || progressQuery.isLoading || analysisQuery.isLoading) {
    return (
      <Shell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-lime-300" />
        </div>
      </Shell>
    );
  }

  if (sampleQuery.isError || progressQuery.isError || analysisQuery.isError || !sample || !analysis || !progress) {
    return (
      <Shell>
        <Card className="mx-auto max-w-2xl border-red-300/20 bg-red-950/30">
          <CardHeader>
            <Badge tone="red">Demo data unavailable</Badge>
            <CardTitle>Unable to load the local demo plan.</CardTitle>
            <CardDescription>
              Refresh the page to retry. The demo build does not require a backend API.
            </CardDescription>
          </CardHeader>
          <pre className="overflow-auto rounded-2xl bg-black/30 p-4 text-xs text-red-100">
            {String(
              sampleQuery.error ??
                progressQuery.error ??
                analysisQuery.error ??
                "Unknown API error",
            )}
          </pre>
        </Card>
      </Shell>
    );
  }

  const selectedWeek =
    analysis.projectedWeeks.find((week) => week.weekNumber === selectedProjectionWeek) ??
    analysis.projectedWeeks[0];

  return (
    <Shell>
      <section className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
        <Hero analysis={analysis} sample={sample} />
        <Card className="bg-lime-300 text-zinc-950">
          <CardHeader>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-700">
              This week
            </p>
            <h2 className="text-5xl font-black tracking-tight">
              {progress.completedCount}/{sample.summary.trainingDays}
            </h2>
            <p className="text-sm font-medium text-zinc-700">
              completed workouts logged in beta progress tracking.
            </p>
          </CardHeader>
          <Progress value={completionPercent} className="bg-zinc-950/15" />
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm font-semibold">
            <Metric label="Fatigue" value={analysis.fatigueAnalysis.estimatedFatigue} />
            <Metric label="Recovery" value={getRecoveryStatus(analysis)} />
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Recommendations</CardTitle>
              <CardDescription>Generated from the local demo planning dataset.</CardDescription>
              </div>
              <HeartPulse className="h-6 w-6 text-lime-300" />
            </div>
          </CardHeader>
          <div className="space-y-3">
            {analysis.recommendations.map((recommendation) => (
              <Recommendation key={recommendation}>{recommendation}</Recommendation>
            ))}
            {analysis.warnings.map((warning) => (
              <Recommendation key={warning} tone="warning">
                {warning}
              </Recommendation>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current week workouts</CardTitle>
            <CardDescription>
              Check off completed training days. Progress is stored locally for this demo session.
            </CardDescription>
          </CardHeader>
          <div className="space-y-3">
            {sample.workouts.map((workout) => (
              <WorkoutCard
                key={workout.date}
                completed={completedDates.has(workout.date)}
                expanded={expandedWorkout === workout.date}
                onExpandedChange={(open) => setExpandedWorkout(open ? workout.date : null)}
                onComplete={() => completeWorkout.mutate(workout)}
                saving={completeWorkout.isPending}
                workout={workout}
              />
            ))}
          </div>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Hypertrophy phase projection</CardTitle>
                <CardDescription>Four-week plan from the existing scheduler.</CardDescription>
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {analysis.projectedWeeks.map((week) => (
                  <Button
                    key={week.weekNumber}
                    type="button"
                    size="sm"
                    variant={week.weekNumber === selectedProjectionWeek ? "default" : "secondary"}
                    onClick={() => setSelectedProjectionWeek(week.weekNumber)}
                  >
                    Week {week.weekNumber}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <ProjectedWeekGrid week={selectedWeek} />
        </Card>
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const { openWizard } = useProgram();

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#bef264_0,#f4f4f5_35%,#e4e4e7_75%)] px-4 py-5 text-zinc-950 dark:bg-[radial-gradient(circle_at_top_left,#4d7c0f_0,#18181b_35%,#030712_75%)] dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="flex items-center justify-between gap-4">
          <div>
            <Badge tone="lime">Phase 1 beta</Badge>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
              Personal Trainer Agent
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" onClick={openWizard}>
              <Plus className="h-4 w-4" /> Create Workout Plan
            </Button>
            <ThemeToggle />
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}

function Hero({ analysis, sample }: { analysis: WorkoutAnalysis; sample: WorkoutWeek }) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute right-[-4rem] top-[-4rem] h-40 w-40 rounded-full bg-lime-300/20 blur-3xl" />
      <CardHeader className="relative">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Badge tone={getFatigueTone(analysis.fatigueAnalysis.estimatedFatigue)}>
            {analysis.fatigueAnalysis.estimatedFatigue} fatigue
          </Badge>
          <Badge tone="zinc">{sample.summary.trainingDays} training days</Badge>
          <Badge tone="zinc">{sample.summary.totalSets} sets</Badge>
        </div>
        <h2 className="max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
          {USE_MOCK_DATA
            ? "Launch-ready workout planning without a live backend dependency."
            : "Workout planning powered by your training API."}
        </h2>
        <p className="mt-4 max-w-2xl text-base text-zinc-600 dark:text-zinc-300 sm:text-lg">
          {USE_MOCK_DATA
            ? "The frontend is running against mock services that preserve the backend response shapes, so the demo remains fully navigable while the API is offline."
            : "Sample workouts, fatigue analysis, and progress are loaded from the ASP.NET API. If the API is unreachable, the dashboard falls back to the same mock data."}
        </p>
      </CardHeader>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat icon={Flame} label="Fatigue score" value={analysis.fatigueAnalysis.totalFatigueScore} />
        <Stat icon={Activity} label="Minutes planned" value={sample.summary.totalDurationMinutes} />
        <Stat icon={Sparkles} label="Projected weeks" value={analysis.projectedWeeks.length} />
      </div>
    </Card>
  );
}

function WorkoutCard({
  workout,
  completed,
  expanded,
  saving,
  onComplete,
  onExpandedChange,
}: {
  workout: WorkoutDay;
  completed: boolean;
  expanded: boolean;
  saving: boolean;
  onComplete: () => void;
  onExpandedChange: (open: boolean) => void;
}) {
  return (
    <Collapsible.Root open={expanded} onOpenChange={onExpandedChange}>
      <div className="rounded-3xl border border-zinc-200 bg-white/70 p-4 dark:border-white/10 dark:bg-black/20">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={completed || workout.isRestDay}
            disabled={completed || workout.isRestDay || saving}
            onCheckedChange={(checked) => {
              if (checked) {
                onComplete();
              }
            }}
          />
          <Collapsible.Trigger asChild>
            <button className="flex flex-1 items-center justify-between gap-3 text-left">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{formatDate(workout.date)}</p>
                <h3 className="text-lg font-bold">
                  {workout.workoutType} {workout.isRestDay ? "Recovery" : "Session"}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={workout.intensity === "High" ? "red" : workout.intensity === "Moderate" ? "amber" : "lime"}>
                  {workout.intensity}
                </Badge>
                <ChevronDown
                  className={cn("h-5 w-5 text-zinc-500 transition dark:text-zinc-400", expanded && "rotate-180")}
                />
              </div>
            </button>
          </Collapsible.Trigger>
        </div>
        <Collapsible.Content className="mt-4 space-y-3 border-t border-zinc-200 pt-4 dark:border-white/10">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">{workout.notes}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {workout.exercises.map((exercise) => (
              <div key={exercise.name} className="rounded-2xl bg-zinc-100 p-3 dark:bg-white/[0.06]">
                <p className="font-semibold">{exercise.name}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {exercise.sets} sets x {exercise.reps}
                  {exercise.rirOrRpe ? ` | ${exercise.rirOrRpe}` : ""}
                </p>
              </div>
            ))}
          </div>
        </Collapsible.Content>
      </div>
    </Collapsible.Root>
  );
}

function ProjectedWeekGrid({ week }: { week: ProjectedWeek }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {week.workouts.map((workout) => (
        <div key={`${week.weekNumber}-${workout.date}`} className="rounded-3xl bg-zinc-100 p-4 dark:bg-black/20">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{formatDate(workout.date)}</p>
          <h3 className="mt-1 font-bold">{workout.workoutType}</h3>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">{workout.notes}</p>
          <div className="mt-4 flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
            <span>{workout.totalSets} sets</span>
            <span>{workout.durationMinutes} min</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Recommendation({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "warning";
}) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-3xl border p-4 text-sm",
        tone === "warning"
          ? "border-amber-300/40 bg-amber-100 text-amber-950 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-50"
          : "border-zinc-200 bg-white/70 text-zinc-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-200",
      )}
    >
      {tone === "warning" ? (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
      ) : (
        <Dumbbell className="mt-0.5 h-4 w-4 shrink-0 text-lime-300" />
      )}
      <span>{children}</span>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-zinc-950/10 p-3">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-700">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Flame;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white/70 p-4 dark:border-white/10 dark:bg-black/20">
      <Icon className="mb-4 h-5 w-5 text-lime-300" />
      <p className="text-2xl font-black">{value}</p>
      <p className="text-sm text-zinc-400">{label}</p>
    </div>
  );
}

function getCompletionPercent(sample?: WorkoutWeek, progress?: WorkoutProgress) {
  if (!sample || !progress || sample.summary.trainingDays === 0) {
    return 0;
  }

  return Math.round((progress.completedCount / sample.summary.trainingDays) * 100);
}

function getRecoveryStatus(analysis: WorkoutAnalysis) {
  return analysis.fatigueAnalysis.estimatedFatigue === "HIGH" ? "Needs rest" : "On track";
}

function getFatigueTone(fatigue: WorkoutAnalysis["fatigueAnalysis"]["estimatedFatigue"]) {
  if (fatigue === "HIGH") {
    return "red";
  }

  if (fatigue === "MODERATE") {
    return "amber";
  }

  return "lime";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}
