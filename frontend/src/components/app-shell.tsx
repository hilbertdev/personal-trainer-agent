"use client";

import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useNav, type AppView } from "@/nav-context";
import { useProgram } from "@/program-context";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const { openWizard, activeProgram } = useProgram();
  const { view, setView } = useNav();

  const tabs: { id: AppView; label: string }[] = [{ id: "programs", label: "Programs" }];
  if (activeProgram?.status === "active_mesocycle") {
    tabs.push({ id: "today", label: "Today" });
    tabs.push({ id: "plan", label: "Plan" });
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,#bef264_0,#f4f4f5_35%,#e4e4e7_75%)] px-3 py-4 text-zinc-950 dark:bg-[radial-gradient(circle_at_top_left,#4d7c0f_0,#18181b_35%,#030712_75%)] dark:text-white sm:px-6 sm:py-5 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <Badge tone="lime">Phase 1 beta</Badge>
            <h1 className="mt-3 max-w-full break-words text-4xl font-black leading-none tracking-tight sm:text-5xl">
              Personal Trainer Agent
            </h1>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto sm:justify-end">
            <Button type="button" size="sm" className="flex-1 sm:flex-none" onClick={openWizard}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Create Workout Plan
            </Button>
            <div className="shrink-0">
              <ThemeToggle />
            </div>
          </div>
        </header>
        {tabs.length > 1 && (
          <nav
            aria-label="Program views"
            role="tablist"
            className="flex gap-1 self-start rounded-full border border-zinc-200 bg-white/70 p-1 dark:border-white/10 dark:bg-black/20"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={view === tab.id}
                onClick={() => setView(tab.id)}
                className={cn(
                  "touch-manipulation rounded-full px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300",
                  view === tab.id
                    ? "bg-lime-300 text-zinc-950"
                    : "text-zinc-600 hover:bg-zinc-950/5 dark:text-zinc-300 dark:hover:bg-white/10",
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        )}
        {children}
      </div>
    </main>
  );
}
