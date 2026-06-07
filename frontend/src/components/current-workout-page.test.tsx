import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CurrentWorkoutPage } from "@/components/current-workout-page";

vi.mock("@/lib/training-api", () => ({
  getAthleteId: () => "11111111-1111-1111-1111-111111111111",
  getTodayWorkout: vi.fn(),
  listPrograms: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/program-context", () => ({
  useProgram: () => ({
    activeProgram: { name: "Test Program" },
  }),
}));

function renderWithQuery(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("CurrentWorkoutPage", () => {
  it("shows loading state while fetching", async () => {
    const { getTodayWorkout } = await import("@/lib/training-api");
    vi.mocked(getTodayWorkout).mockReturnValue(new Promise(() => undefined));

    renderWithQuery(<CurrentWorkoutPage />);

    expect(screen.getByText(/Loading today/i)).toBeInTheDocument();
  });

  it("shows rest day when no workout is scheduled", async () => {
    const { getTodayWorkout } = await import("@/lib/training-api");
    vi.mocked(getTodayWorkout).mockResolvedValue(null);

    renderWithQuery(<CurrentWorkoutPage />);

    expect(await screen.findByText("Rest day")).toBeInTheDocument();
  });
});
