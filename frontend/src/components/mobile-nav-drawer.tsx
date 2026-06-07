"use client";

import { Menu, X } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { AppView } from "@/nav-context";
import { cn } from "@/lib/utils";

export function MobileNavTrigger({
  open,
  onOpen,
  currentLabel,
}: {
  open: boolean;
  onOpen: () => void;
  currentLabel: string;
}) {
  return (
    <div className="flex w-full items-center justify-between gap-3 md:hidden">
      <Button
        type="button"
        variant="secondary"
        size="icon"
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
        aria-label="Open navigation menu"
        onClick={onOpen}
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </Button>
      <p className="min-w-0 flex-1 truncate text-center text-sm font-semibold">{currentLabel}</p>
      <div className="h-11 w-11 shrink-0" aria-hidden="true" />
    </div>
  );
}

export function MobileNavDrawer({
  open,
  onClose,
  tabs,
  view,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  tabs: { id: AppView; label: string }[];
  view: AppView;
  onSelect: (view: AppView) => void;
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
    <div className="fixed inset-0 z-50 md:hidden" role="presentation">
      <button
        type="button"
        aria-label="Close navigation menu"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <nav
        id="mobile-nav-drawer"
        aria-label="Program views"
        className="absolute inset-y-0 right-0 flex w-[min(100%,20rem)] flex-col border-l border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-900"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4 dark:border-white/10">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            Navigation
          </p>
          <Button type="button" variant="ghost" size="icon" aria-label="Close menu" onClick={onClose}>
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
        <ul className="flex flex-col gap-1 p-3">
          {tabs.map((tab) => {
            const selected = view === tab.id;
            return (
              <li key={tab.id}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => {
                    onSelect(tab.id);
                    onClose();
                  }}
                  className={cn(
                    "flex min-h-12 w-full touch-manipulation items-center rounded-2xl px-4 text-left text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300",
                    selected
                      ? "bg-lime-300 text-zinc-950"
                      : "text-zinc-700 hover:bg-zinc-950/5 dark:text-zinc-200 dark:hover:bg-white/10",
                  )}
                >
                  {tab.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
