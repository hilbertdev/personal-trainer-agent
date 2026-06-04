"use client";

import { ActiveMesocycleView } from "@/components/active-mesocycle-view";
import { AppShell } from "@/components/app-shell";
import { BaselineWeekView } from "@/components/baseline-week-view";
import { BetaDashboard } from "@/components/beta-dashboard";
import { CreatePlanWizard } from "@/components/create-plan-wizard";
import { CurrentWorkoutPage } from "@/components/current-workout-page";
import { ProgramsPage } from "@/components/programs-page";
import { useNav } from "@/nav-context";
import { useProgram } from "@/program-context";

export function AppRouter() {
  const { activeProgram } = useProgram();
  const { view } = useNav();

  return (
    <>
      {!activeProgram && <BetaDashboard />}

      {activeProgram?.status === "collecting_baseline_week" && (
        <AppShell>
          <BaselineWeekView program={activeProgram} />
        </AppShell>
      )}

      {activeProgram?.status === "active_mesocycle" && (
        <AppShell>
          {view === "today" && <CurrentWorkoutPage />}
          {view === "plan" && <ActiveMesocycleView program={activeProgram} />}
          {view !== "today" && view !== "plan" && <ProgramsPage />}
        </AppShell>
      )}

      <CreatePlanWizard />
    </>
  );
}
