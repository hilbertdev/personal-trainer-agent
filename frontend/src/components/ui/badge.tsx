import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "lime" | "amber" | "red" | "zinc";

const tones: Record<BadgeTone, string> = {
  lime: "border-lime-300/30 bg-lime-300/15 text-lime-200",
  amber: "border-amber-300/30 bg-amber-300/15 text-amber-100",
  red: "border-red-300/30 bg-red-300/15 text-red-100",
  zinc: "border-white/10 bg-white/10 text-zinc-200",
};

export function Badge({
  className,
  tone = "zinc",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
