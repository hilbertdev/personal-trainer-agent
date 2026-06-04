"use client";

import { ActiveMesocycleView } from "@/components/active-mesocycle-view";
import { AppShell } from "@/components/app-shell";
import { BaselineWeekView } from "@/components/baseline-week-view";
import { BetaDashboard } from "@/components/beta-dashboard";
import { CreatePlanWizard } from "@/components/create-plan-wizard";
import { useProgram } from "@/program-context";

export function AppRouter() {
  const { activeProgram } = useProgram();

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
          <ActiveMesocycleView program={activeProgram} />
        </AppShell>
      )}

      <CreatePlanWizard />
    </>
  );
}
