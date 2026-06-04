"use client";

import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useProgram } from "@/program-context";

export function AppShell({ children }: { children: ReactNode }) {
  const { openWizard } = useProgram();

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
        {children}
      </div>
    </main>
  );
}
