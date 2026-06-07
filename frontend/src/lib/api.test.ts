import { afterEach, describe, expect, it, vi } from "vitest";
import { getProgress, RealApiService } from "@/lib/api";

describe("api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns progress data", async () => {
    const progress = await getProgress();
    expect(progress.completedCount).toBeGreaterThanOrEqual(0);
  });

  it("RealApiService fetches progress from backend", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          completedCount: 2,
          lastCompletedWorkoutDate: "2026-04-01",
          completedWorkouts: [],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const service = new RealApiService("https://example.test");
    const progress = await service.getProgress();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.test/api/progress",
      expect.objectContaining({ headers: { "Content-Type": "application/json" } }),
    );
    expect(progress.completedCount).toBe(2);
  });
});
