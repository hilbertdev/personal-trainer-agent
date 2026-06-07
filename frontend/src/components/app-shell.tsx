"use client";

import { Plus } from "lucide-react";
import { type ReactNode, useState } from "react";
import { MobileNavDrawer, MobileNavTrigger } from "@/components/mobile-nav-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useNav, type AppView } from "@/nav-context";
import { useProgram } from "@/program-context";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const { openWizard, activeProgram } = useProgram();
  const { view, setView } = useNav();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const tabs: { id: AppView; label: string }[] = [{ id: "programs", label: "Programs" }];
  if (activeProgram?.status === "active_mesocycle") {
    tabs.push({ id: "today", label: "Today" });
    tabs.push({ id: "plan", label: "Plan" });
  }

  const currentTabLabel = tabs.find((tab) => tab.id === view)?.label ?? "Programs";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,#bef264_0,#f4f4f5_35%,#e4e4e7_75%)] px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-zinc-950 dark:bg-[radial-gradient(circle_at_top_left,#4d7c0f_0,#18181b_35%,#030712_75%)] dark:text-white sm:px-6 sm:py-5 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <Badge tone="lime">Phase 1 beta</Badge>
            <h1 className="mt-3 max-w-full break-words text-2xl font-black leading-none tracking-tight md:text-3xl lg:text-4xl xl:text-5xl">
              Personal Trainer Agent
            </h1>
          </div>
          <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto sm:justify-end">
            <Button type="button" size="sm" className="min-w-0 flex-1 sm:flex-none" onClick={openWizard}>
              <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="sm:hidden">Create Plan</span>
              <span className="hidden sm:inline">Create Workout Plan</span>
            </Button>
            <div className="shrink-0">
              <ThemeToggle />
            </div>
          </div>
        </header>
        {tabs.length > 1 && (
          <>
            <MobileNavTrigger
              open={mobileNavOpen}
              onOpen={() => setMobileNavOpen(true)}
              currentLabel={currentTabLabel}
            />
            <nav
              aria-label="Program views"
              role="tablist"
              className="hidden gap-1 self-start rounded-full border border-zinc-200 bg-white/70 p-1 dark:border-white/10 dark:bg-black/20 md:flex"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={view === tab.id}
                  onClick={() => setView(tab.id)}
                  className={cn(
                    "min-h-11 touch-manipulation rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300",
                    view === tab.id
                      ? "bg-lime-300 text-zinc-950"
                      : "text-zinc-600 hover:bg-zinc-950/5 dark:text-zinc-300 dark:hover:bg-white/10",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
            <MobileNavDrawer
              open={mobileNavOpen}
              onClose={() => setMobileNavOpen(false)}
              tabs={tabs}
              view={view}
              onSelect={setView}
            />
          </>
        )}
        <div className="min-w-0 w-full">{children}</div>
      </div>
    </main>
  );
}
