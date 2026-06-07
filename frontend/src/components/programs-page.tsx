"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Dumbbell, Loader2, Plus, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { endProgram, getAthleteId, listPrograms, type ProgramSummary } from "@/lib/training-api";
import { useNav } from "@/nav-context";
import { useProgram } from "@/program-context";

const PROGRAMS_QUERY_KEY = ["training", "programs"] as const;

export function ProgramsPage() {
  const { openWizard, activeProgram, resetProgram } = useProgram();
  const { setView } = useNav();
  const queryClient = useQueryClient();
  const athleteId = getAthleteId();
  const [endingId, setEndingId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: PROGRAMS_QUERY_KEY,
    queryFn: () => listPrograms(athleteId),
  });

  const programs = data ?? [];
  const active = programs.filter((program) => program.isActive);
  const archived = programs.filter((program) => !program.isActive);

  const handleEnd = async (program: ProgramSummary) => {
    const confirmed = window.confirm(
      `End “${program.name}”? It will be archived and removed from your active programs.`,
    );
    if (!confirmed) {
      return;
    }
    setEndingId(program.id);
    try {
      await endProgram(program.id);
      if (activeProgram?.id === program.id) {
        resetProgram();
      }
      await queryClient.invalidateQueries({ queryKey: PROGRAMS_QUERY_KEY });
    } finally {
      setEndingId(null);
    }
  };

  return (
    <div className="grid gap-4">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Programs</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Your active and archived training programs.
          </p>
        </div>
        <Button type="button" size="sm" onClick={openWizard}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Create Workout Plan
        </Button>
      </section>

      <div aria-live="polite">
        {isLoading && (
          <Card className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />{" "}
            Loading programs…
          </Card>
        )}

        {isError && (
          <Card className="text-sm text-red-600 dark:text-red-300">
            Could not load programs. Check that the backend is running, then try again.
          </Card>
        )}
      </div>

      {!isLoading && !isError && programs.length === 0 && (
        <Card className="flex flex-col items-start gap-3">
          <CardTitle>No programs yet</CardTitle>
          <CardDescription>
            Create your first workout plan to start training and tracking workouts.
          </CardDescription>
          <Button type="button" onClick={openWizard}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Create Workout Plan
          </Button>
        </Card>
      )}

      {active.length > 0 && (
        <section className="grid gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Active
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {active.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                onOpen={() => setView("today")}
                onEnd={() => handleEnd(program)}
                ending={endingId === program.id}
              />
            ))}
          </div>
        </section>
      )}

      {archived.length > 0 && (
        <section className="grid gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Archived
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {archived.map((program) => (
              <ProgramCard key={program.id} program={program} archived />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ProgramCard({
  program,
  archived = false,
  ending = false,
  onOpen,
  onEnd,
}: {
  program: ProgramSummary;
  archived?: boolean;
  ending?: boolean;
  onOpen?: () => void;
  onEnd?: () => void;
}) {
  const progressPercent =
    program.totalWeeks > 0
      ? Math.round((Math.min(program.currentWeek, program.totalWeeks) / program.totalWeeks) * 100)
      : 0;

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader className="mb-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <Badge tone={archived ? "zinc" : "lime"}>{archived ? "Archived" : "Active"}</Badge>
            </div>
            <CardTitle className="break-words text-2xl">{program.name}</CardTitle>
            <CardDescription className="mt-1 flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="tabular-nums">
                {formatDate(program.startDate)}
                {program.endDate ? ` – ${formatDate(program.endDate)}` : ""}
              </span>
            </CardDescription>
          </div>
          <Dumbbell className="h-6 w-6 shrink-0 text-lime-400" aria-hidden="true" />
        </div>
      </CardHeader>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Week" value={`${program.currentWeek} / ${program.totalWeeks}`} />
        <Stat label="Sessions / wk" value={program.sessionsPerWeek} />
        <Stat label="Progress" value={`${progressPercent}%`} />
      </div>

      {!archived && <Progress value={progressPercent} />}

      {!archived && (
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" onClick={onOpen} className="flex-1">
            Today’s Workout
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onEnd} disabled={ending}>
            {ending ? (
              <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            ) : (
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            )}
            {ending ? "Ending…" : "End Program"}
          </Button>
        </div>
      )}
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/70 p-3 dark:border-white/10 dark:bg-black/20">
      <p className="text-lg font-black tabular-nums">{value}</p>
      <p className="text-xs text-zinc-400">{label}</p>
    </div>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
