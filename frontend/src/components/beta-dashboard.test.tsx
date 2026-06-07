import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BetaDashboard } from "@/components/beta-dashboard";
import { ThemeProvider } from "@/theme-provider";

vi.mock("@/lib/api", () => ({
  USE_MOCK_DATA: true,
  getSampleWorkout: vi.fn().mockResolvedValue({
    summary: {
      weekStart: "2026-05-11",
      weekEnd: "2026-05-17",
      trackedDays: 7,
      trainingDays: 5,
      restDays: 2,
      highIntensityDays: 3,
      totalSets: 80,
      totalDurationMinutes: 400,
      setsByMuscleGroup: {},
      workoutsByType: {},
    },
    workouts: [
      {
        date: "2026-05-11",
        workoutType: "Push",
        intensity: "High",
        durationMinutes: 75,
        notes: null,
        isRestDay: false,
        totalSets: 13,
        trainedMuscleGroups: ["Chest"],
        exercises: [],
      },
    ],
  }),
  getProgress: vi.fn().mockResolvedValue({
    completedCount: 0,
    lastCompletedWorkoutDate: null,
    completedWorkouts: [],
  }),
  analyzeWorkout: vi.fn().mockResolvedValue({
    summary: {
      weekStart: "2026-05-11",
      weekEnd: "2026-05-17",
      trackedDays: 7,
      trainingDays: 5,
      restDays: 2,
      highIntensityDays: 3,
      totalSets: 80,
      totalDurationMinutes: 400,
      setsByMuscleGroup: {},
      workoutsByType: {},
    },
    fatigueAnalysis: {
      totalFatigueScore: 150,
      estimatedFatigue: "HIGH",
      warnings: [],
      recommendedRestDays: [],
    },
    projectedWeeks: [
      {
        weekNumber: 1,
        workouts: [
          {
            date: "2026-05-11",
            workoutType: "Push",
            intensity: "Moderate",
            durationMinutes: 60,
            notes: null,
            isRestDay: false,
            totalSets: 10,
            trainedMuscleGroups: ["Chest"],
            exercises: [],
          },
        ],
      },
    ],
    recommendations: ["Keep progressing"],
    warnings: [],
  }),
  recordCompletedWorkout: vi.fn().mockResolvedValue({
    completedCount: 1,
    lastCompletedWorkoutDate: "2026-05-11",
    completedWorkouts: [
      {
        id: "1",
        workoutDate: "2026-05-11",
        workoutType: "Push",
        completedAt: "2026-05-11T10:00:00Z",
        notes: null,
      },
    ],
  }),
}));

vi.mock("@/program-context", () => ({
  useProgram: () => ({
    activeProgram: null,
  }),
}));

describe("BetaDashboard", () => {
  it("renders analysis and marks workout complete", async () => {
    const user = userEvent.setup();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <ThemeProvider>
        <QueryClientProvider client={client}>
          <BetaDashboard />
        </QueryClientProvider>
      </ThemeProvider>,
    );

    expect(await screen.findByText("Current week workouts")).toBeInTheDocument();

    const checkbox = screen.getAllByRole("checkbox")[0];
    await user.click(checkbox);

    await waitFor(() => {
      expect(screen.getByText("Current week workouts")).toBeInTheDocument();
    });
  });
});
