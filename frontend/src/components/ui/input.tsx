import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const inputClassName =
  "min-h-12 w-full rounded-2xl border border-zinc-300 bg-white px-3 py-2.5 text-base outline-none transition focus-visible:border-lime-400 focus-visible:ring-2 focus-visible:ring-lime-300 dark:border-white/15 dark:bg-zinc-900 dark:text-white sm:min-h-11 sm:px-3 sm:py-2 sm:text-sm";

export const selectClassName = inputClassName;

export const textareaClassName = cn(inputClassName, "resize-none");

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClassName, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(textareaClassName, className)} {...props} />;
}
