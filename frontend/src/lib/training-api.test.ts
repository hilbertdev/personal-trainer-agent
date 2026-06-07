import { afterEach, describe, expect, it, vi } from "vitest";
import { getAthleteId } from "@/lib/training-api";

describe("training-api", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    window.localStorage.clear();
  });

  it("returns configured athlete id from env", () => {
    vi.stubEnv("VITE_ATHLETE_ID", "22222222-2222-2222-2222-222222222222");

    expect(getAthleteId()).toBe("22222222-2222-2222-2222-222222222222");
  });

  it("persists generated athlete id in localStorage", () => {
    vi.stubEnv("VITE_ATHLETE_ID", "");

    const first = getAthleteId();
    const second = getAthleteId();

    expect(first).toBe(second);
    expect(window.localStorage.getItem("pta:athlete-id")).toBe(first);
  });
});
