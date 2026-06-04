"use client";

import { getWeeklyWorkload, type WeeklyCycle } from "@/lib/program";

export function WeeklyWorkloadSummary({ weeklyCycle }: { weeklyCycle: WeeklyCycle }) {
  const workload = getWeeklyWorkload(weeklyCycle);
  const types = Object.keys(workload.frequencyByType);

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
        Weekly Training Frequency
      </p>
      <div className="mt-3 space-y-1.5">
        {types.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No sessions scheduled yet. Assign at least one workout day.
          </p>
        ) : (
          types.map((type) => (
            <div key={type} className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">{type}</span>
              <span className="font-semibold text-zinc-600 dark:text-zinc-300">
                {workload.frequencyByType[type]}
              </span>
            </div>
          ))
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-zinc-200 pt-3 dark:border-white/10">
        <div>
          <p className="text-2xl font-black">{workload.totalSessions}</p>
          <p className="text-xs uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400">
            Total Sessions
          </p>
        </div>
        <div>
          <p className="text-2xl font-black">{workload.restDays}</p>
          <p className="text-xs uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400">
            Rest Days
          </p>
        </div>
      </div>
    </div>
  );
}
