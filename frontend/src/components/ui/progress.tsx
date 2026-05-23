"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <ProgressPrimitive.Root
      className={cn("relative h-3 overflow-hidden rounded-full bg-zinc-950/10 dark:bg-white/10", className)}
    >
      <ProgressPrimitive.Indicator
        className="h-full rounded-full bg-lime-300 transition-all"
        style={{ transform: `translateX(-${100 - Math.min(value, 100)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
