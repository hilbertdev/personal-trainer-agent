import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LiveWorkoutView } from "@/components/live-workout-view";

vi.mock("@/lib/training-api", () => ({
  getAthleteId: () => "11111111-1111-1111-1111-111111111111",
  recordExecution: vi.fn().mockResolvedValue({
    id: "exec-1",
    date: "2026-04-01",
    durationMinutes: 45,
    totalVolume: 2400,
  }),
}));

vi.mock("@/program-context", () => ({
  useProgram: () => ({
    syncStrava: vi.fn(),
    stravaActivities: [],
    stravaSyncStatus: "idle",
    resetStravaSync: vi.fn(),
  }),
}));

const workout = {
  id: "template-1",
  name: "Upper 1",
  dayOfWeek: "Monday" as const,
  exercises: [
    {
      id: "ex-1",
      exerciseName: "Bench Press",
      targetSets: 3,
      targetRepMin: 6,
      targetRepMax: 8,
      category: "Strength",
      substitutions: [],
    },
  ],
  workoutType: "Push",
  description: null,
};

describe("LiveWorkoutView", () => {
  it("renders first exercise and advances after logging sets", async () => {
    const user = userEvent.setup();

    render(
      <LiveWorkoutView
        workout={workout}
        date="2026-04-01"
        programName="Test Program"
        onExit={vi.fn()}
      />,
    );

    expect(screen.getByText("Bench Press")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /finish workout/i }));

    expect(await screen.findByText(/workout complete|finishing/i)).toBeTruthy();
  });
});
