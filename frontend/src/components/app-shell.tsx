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
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#bef264_0,#f4f4f5_35%,#e4e4e7_75%)] px-4 py-5 text-zinc-950 dark:bg-[radial-gradient(circle_at_top_left,#4d7c0f_0,#18181b_35%,#030712_75%)] dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="flex items-center justify-between gap-4">
          <div>
            <Badge tone="lime">Phase 1 beta</Badge>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
              Personal Trainer Agent
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" onClick={openWizard}>
              <Plus className="h-4 w-4" /> Create Workout Plan
            </Button>
            <ThemeToggle />
          </div>
        </header>
        {tabs.length > 1 && (
          <nav className="flex gap-1 self-start rounded-full border border-zinc-200 bg-white/70 p-1 dark:border-white/10 dark:bg-black/20">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setView(tab.id)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-semibold transition",
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
