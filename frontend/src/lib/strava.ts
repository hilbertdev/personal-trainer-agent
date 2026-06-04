import type { StravaActivity } from "@/lib/program";

/**
 * Provider-agnostic contract for fetching external activities. The mock and the
 * real backend both produce the same `StravaActivity[]` shape so the rest of the
 * app never needs to know where the data came from.
 */
export interface StravaService {
  syncActivities: () => Promise<StravaActivity[]>;
}

const API_URL = import.meta.env.VITE_API_URL ?? import.meta.env.NEXT_PUBLIC_API_URL ?? "";

/**
 * Strava-specific mock flag. Defaults to the shared mock flag so a single
 * `VITE_USE_MOCK_DATA=false` switches the whole app to the backend, while
 * `VITE_USE_MOCK_STRAVA` lets Strava be toggled independently when needed.
 */
const USE_MOCK_DATA =
  (import.meta.env.VITE_USE_MOCK_DATA ?? import.meta.env.NEXT_PUBLIC_USE_MOCK_DATA) !== "false";
export const USE_MOCK_STRAVA =
  (import.meta.env.VITE_USE_MOCK_STRAVA ?? String(USE_MOCK_DATA)) !== "false";

const MOCK_ACTIVITIES: StravaActivity[] = [
  {
    activityId: "strava-morning-gym",
    name: "Morning Gym Session",
    durationMinutes: 62,
    avgHeartRate: 152,
    maxHeartRate: 171,
    calories: 540,
    startedAt: "2026-05-11T07:15:00.000Z",
  },
  {
    activityId: "strava-evening-workout",
    name: "Evening Workout",
    durationMinutes: 48,
    avgHeartRate: 138,
    maxHeartRate: 159,
    calories: 410,
    startedAt: "2026-05-12T18:05:00.000Z",
  },
  {
    activityId: "strava-treadmill-weights",
    name: "Treadmill + Weights",
    durationMinutes: 70,
    avgHeartRate: 146,
    maxHeartRate: 168,
    calories: 620,
    distanceKm: 3.2,
    startedAt: "2026-05-13T17:40:00.000Z",
  },
];

export class MockStravaService implements StravaService {
  async syncActivities(): Promise<StravaActivity[]> {
    await mockDelay();
    return clone(MOCK_ACTIVITIES);
  }
}

/** Backend execution shape returned by `POST /api/strava/sync`. */
interface WorkoutExecutionResponse {
  id: string;
  date: string;
  durationMinutes: number;
  notes?: string | null;
  providerActivityId?: string | null;
}

export class RealStravaService implements StravaService {
  constructor(private readonly apiUrl: string) {}

  async syncActivities(): Promise<StravaActivity[]> {
    const athleteId = import.meta.env.VITE_ATHLETE_ID ?? import.meta.env.NEXT_PUBLIC_ATHLETE_ID;
    const to = new Date();
    const from = new Date(to);
    from.setDate(from.getDate() - 28);

    const response = await fetch(`${this.apiUrl}/api/strava/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        athleteId,
        from: from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10),
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || `Strava sync failed with ${response.status}`);
    }

    const executions = (await response.json()) as WorkoutExecutionResponse[];
    return executions.map((execution) => ({
      activityId: execution.providerActivityId ?? execution.id,
      name: execution.notes?.trim() || "Strava activity",
      durationMinutes: execution.durationMinutes,
      startedAt: execution.date,
    }));
  }
}

const mockStravaService = new MockStravaService();
const stravaService: StravaService = USE_MOCK_STRAVA
  ? mockStravaService
  : withMockFallback(new RealStravaService(API_URL));

export function syncStravaActivities(): Promise<StravaActivity[]> {
  return stravaService.syncActivities();
}

function withMockFallback(realStravaService: StravaService): StravaService {
  return {
    syncActivities: () =>
      realStravaService.syncActivities().catch(() => mockStravaService.syncActivities()),
  };
}

function mockDelay() {
  const delay = 300 + Math.floor(Math.random() * 401);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
