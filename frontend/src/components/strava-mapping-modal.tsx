"use client";

import { ArrowRight, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { LoggedWorkout, Program, StravaActivity } from "@/lib/program";
import { useProgram } from "@/program-context";
import { cn } from "@/lib/utils";

export function StravaMappingModal({
  open,
  onClose,
  program,
}: {
  open: boolean;
  onClose: () => void;
  program: Program;
}) {
  const { stravaActivities, pendingMappings, setMapping, confirmMappings } = useProgram();

  const loggedWorkouts = program.baselineWeek.loggedWorkouts;
  const activityFor = (workoutId: string): string => {
    return pendingMappings.find((mapping) => mapping.workoutId === workoutId)?.activityId ?? "";
  };

  const usedActivityIds = new Set(pendingMappings.map((mapping) => mapping.activityId));
  const canConfirm = pendingMappings.length > 0;

  const handleConfirm = () => {
    confirmMappings();
    onClose();
  };

  const footer = (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {pendingMappings.length} workout{pendingMappings.length === 1 ? "" : "s"} mapped
      </p>
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" disabled={!canConfirm} onClick={handleConfirm}>
          <Link2 className="h-4 w-4" /> Confirm Mapping
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Match your logged workouts with Strava activities"
      description="Strava enriches each workout with heart rate, duration, and calories. Your lifting data stays untouched."
      footer={footer}
    >
      {loggedWorkouts.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Log at least one workout before mapping Strava activities.
        </p>
      ) : stravaActivities.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No Strava activities synced yet.
        </p>
      ) : (
        <div className="space-y-3">
          {loggedWorkouts.map((workout) => (
            <WorkoutMappingRow
              key={workout.id}
              workout={workout}
              activities={stravaActivities}
              selectedActivityId={activityFor(workout.id)}
              usedActivityIds={usedActivityIds}
              onSelect={(activityId) => setMapping(workout.id, activityId)}
            />
          ))}
        </div>
      )}
    </Modal>
  );
}

function WorkoutMappingRow({
  workout,
  activities,
  selectedActivityId,
  usedActivityIds,
  onSelect,
}: {
  workout: LoggedWorkout;
  activities: StravaActivity[];
  selectedActivityId: string;
  usedActivityIds: Set<string>;
  onSelect: (activityId: string | null) => void;
}) {
  const isMapped = selectedActivityId.length > 0;

  return (
    <div
      className={cn(
        "grid items-center gap-3 rounded-3xl border p-4 sm:grid-cols-[1fr_auto_1.2fr]",
        isMapped
          ? "border-lime-400/50 bg-lime-300/10 dark:border-lime-300/30"
          : "border-zinc-200 bg-white/70 dark:border-white/10 dark:bg-white/5",
      )}
    >
      <div>
        <p className="text-sm font-bold">
          {workout.dayOfWeek} - {workout.workoutType}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {workout.exercises.length} exercise{workout.exercises.length === 1 ? "" : "s"}
          {workout.enrichmentStatus === "enriched" ? " - already enriched" : ""}
        </p>
      </div>

      <ArrowRight className="hidden h-4 w-4 text-zinc-400 sm:block" />

      <select
        value={selectedActivityId}
        onChange={(event) => onSelect(event.target.value || null)}
        className="w-full rounded-2xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-lime-400 focus:ring-2 focus:ring-lime-300 dark:border-white/15 dark:bg-zinc-900 dark:text-white"
      >
        <option value="">No activity</option>
        {activities.map((activity) => {
          const takenByOther = usedActivityIds.has(activity.activityId) &&
            activity.activityId !== selectedActivityId;
          return (
            <option key={activity.activityId} value={activity.activityId} disabled={takenByOther}>
              {activity.name} - {activity.durationMinutes} min
              {takenByOther ? " (mapped)" : ""}
            </option>
          );
        })}
      </select>
    </div>
  );
}
