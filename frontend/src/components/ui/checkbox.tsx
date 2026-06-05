"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Checkbox({
  checked,
  onCheckedChange,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <CheckboxPrimitive.Root
      checked={checked}
      disabled={disabled}
      onCheckedChange={(value) => onCheckedChange(value === true)}
      className={cn(
        "flex h-6 w-6 touch-manipulation items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent dark:border-white/20 dark:bg-white/10",
        "data-[state=checked]:border-lime-300 data-[state=checked]:bg-lime-300",
      )}
    >
      <CheckboxPrimitive.Indicator>
        <Check className="h-4 w-4" aria-hidden="true" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
