"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="presentation"
      onClick={onClose}
    >
      <div
        className={cn(
          "relative flex max-h-[min(96dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)))] w-full max-w-2xl flex-col overflow-hidden rounded-t-[2rem] border border-zinc-200 bg-white text-zinc-950 shadow-2xl shadow-black/30 dark:border-white/10 dark:bg-zinc-900 dark:text-white sm:max-h-[92vh] sm:rounded-[2rem]",
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        aria-describedby={description ? "modal-description" : undefined}
        onClick={(event) => event.stopPropagation()}
      >
        {(title || description) && (
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-200 px-4 py-4 dark:border-white/10 sm:px-6 sm:py-5">
            <div className="min-w-0 space-y-1">
              {title && (
                <h2
                  id="modal-title"
                  className="break-words text-lg font-black tracking-tight sm:text-xl"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p id="modal-description" className="text-sm text-zinc-500 dark:text-zinc-400">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-950/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300 dark:text-zinc-400 dark:hover:bg-white/10"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
          {children}
        </div>
        {footer && (
          <div className="shrink-0 border-t border-zinc-200 px-4 py-4 dark:border-white/10 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
