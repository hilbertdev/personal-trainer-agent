import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "lime" | "amber" | "red" | "zinc";

const tones: Record<BadgeTone, string> = {
  lime:
    "border-lime-500/30 bg-lime-100 text-lime-900 dark:border-lime-300/30 dark:bg-lime-300/15 dark:text-lime-200",
  amber:
    "border-amber-500/30 bg-amber-100 text-amber-900 dark:border-amber-300/30 dark:bg-amber-300/15 dark:text-amber-100",
  red:
    "border-red-500/30 bg-red-100 text-red-900 dark:border-red-300/30 dark:bg-red-300/15 dark:text-red-100",
  zinc: "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-white/10 dark:bg-white/10 dark:text-zinc-200",
};

export function Badge({
  className,
  tone = "zinc",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-full border px-3 py-1 text-left text-xs font-semibold uppercase leading-tight tracking-[0.18em] sm:tracking-[0.2em]",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
