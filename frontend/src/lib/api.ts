import {
  completedWorkoutFor,
  mockInitialProgress,
  mockWorkoutAnalysis,
  mockWorkoutWeek,
  summarizeWorkouts,
} from "@/mock-data/workouts";

export type WorkoutType =
  | "Push"
  | "Pull"
  | "Legs"
  | "Upper"
  | "Lower"
  | "FullBody"
  | "Cardio"
  | "Rest";

export type IntensityLevel = "Low" | "Moderate" | "High";

export type Exercise = {
  name: string;
  sets: number;
  reps: string;
  rirOrRpe: string | null;
  muscleGroups: string[];
};

export type WorkoutDay = {
  date: string;
  workoutType: WorkoutType;
  intensity: IntensityLevel;
  durationMinutes: number;
  notes: string | null;
  isRestDay: boolean;
  totalSets: number;
  trainedMuscleGroups: string[];
  exercises: Exercise[];
};

export type WorkoutSummary = {
  weekStart: string | null;
  weekEnd: string | null;
  trackedDays: number;
  trainingDays: number;
  restDays: number;
  highIntensityDays: number;
  totalSets: number;
  totalDurationMinutes: number;
  setsByMuscleGroup: Record<string, number>;
  workoutsByType: Record<string, number>;
};

export type WorkoutWeek = {
  summary: WorkoutSummary;
  workouts: WorkoutDay[];
};

export type FatigueAnalysis = {
  totalFatigueScore: number;
  estimatedFatigue: "LOW" | "MODERATE" | "HIGH";
  warnings: string[];
  recommendedRestDays: string[];
};

export type ProjectedWeek = {
  weekNumber: number;
  workouts: WorkoutDay[];
};

export type WorkoutAnalysis = {
  summary: WorkoutSummary;
  fatigueAnalysis: FatigueAnalysis;
  projectedWeeks: ProjectedWeek[];
  recommendations: string[];
  warnings: string[];
};

export type CompletedWorkout = {
  id: string;
  workoutDate: string;
  workoutType: WorkoutType;
  completedAt: string;
  notes: string | null;
};

export type WorkoutProgress = {
  completedCount: number;
  lastCompletedWorkoutDate: string | null;
  completedWorkouts: CompletedWorkout[];
};

export type ApiService = {
  getSampleWorkout: () => Promise<WorkoutWeek>;
  analyzeWorkout: (workouts: WorkoutDay[]) => Promise<WorkoutAnalysis>;
  getProgress: () => Promise<WorkoutProgress>;
  recordCompletedWorkout: (workout: WorkoutDay) => Promise<WorkoutProgress>;
};

const API_URL =
  import.meta.env.VITE_API_URL ?? import.meta.env.NEXT_PUBLIC_API_URL ?? "";
export const USE_MOCK_DATA =
  (import.meta.env.VITE_USE_MOCK_DATA ?? import.meta.env.NEXT_PUBLIC_USE_MOCK_DATA) !== "false";

export class RealApiService implements ApiService {
  constructor(private readonly apiUrl: string) {}

  getSampleWorkout() {
    return this.apiFetch<WorkoutWeek>("/api/workouts/sample");
  }

  analyzeWorkout(workouts: WorkoutDay[]) {
    return this.apiFetch<WorkoutAnalysis>("/api/workouts/analyze", {
      method: "POST",
      body: JSON.stringify({
        workouts: workouts.map((workout) => ({
          date: workout.date,
          workoutType: workout.workoutType,
          exercises: workout.exercises,
          durationMinutes: workout.durationMinutes,
          intensity: workout.intensity,
          notes: workout.notes,
        })),
      }),
    });
  }

  getProgress() {
    return this.apiFetch<WorkoutProgress>("/api/progress");
  }

  recordCompletedWorkout(workout: WorkoutDay) {
    return this.apiFetch<WorkoutProgress>("/api/progress", {
      method: "POST",
      body: JSON.stringify({
        workoutDate: workout.date,
        workoutType: workout.workoutType,
        notes: workout.notes,
      }),
    });
  }

  private async apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.apiUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || `API request failed with ${response.status}`);
    }

    return response.json() as Promise<T>;
  }
}

export class MockApiService implements ApiService {
  private progress = clone(mockInitialProgress);

  async getSampleWorkout() {
    await mockDelay();
    return clone(mockWorkoutWeek);
  }

  async analyzeWorkout(workouts: WorkoutDay[]) {
    await mockDelay();
    const safeWorkouts = workouts.length > 0 ? workouts : mockWorkoutWeek.workouts;

    return clone({
      ...mockWorkoutAnalysis,
      summary: summarizeWorkouts(safeWorkouts),
    });
  }

  async getProgress() {
    await mockDelay();
    return clone(this.progress);
  }

  async recordCompletedWorkout(workout: WorkoutDay) {
    await mockDelay();

    if (!this.progress.completedWorkouts.some((completed) => completed.workoutDate === workout.date)) {
      this.progress.completedWorkouts = [
        ...this.progress.completedWorkouts,
        completedWorkoutFor(workout),
      ];
      this.progress.completedCount = this.progress.completedWorkouts.length;
      this.progress.lastCompletedWorkoutDate = workout.date;
    }

    return clone(this.progress);
  }
}

const mockApiService = new MockApiService();
const apiService: ApiService = USE_MOCK_DATA
  ? mockApiService
  : withMockFallback(new RealApiService(API_URL));

export function getSampleWorkout() {
  return apiService.getSampleWorkout();
}

export function analyzeWorkout(workouts: WorkoutDay[]) {
  return apiService.analyzeWorkout(workouts);
}

export function getProgress() {
  return apiService.getProgress();
}

export function recordCompletedWorkout(workout: WorkoutDay) {
  return apiService.recordCompletedWorkout(workout);
}

function withMockFallback(realApiService: ApiService): ApiService {
  return {
    getSampleWorkout: () =>
      realApiService.getSampleWorkout().catch(() => mockApiService.getSampleWorkout()),
    analyzeWorkout: (workouts) =>
      realApiService.analyzeWorkout(workouts).catch(() => mockApiService.analyzeWorkout(workouts)),
    getProgress: () => realApiService.getProgress().catch(() => mockApiService.getProgress()),
    recordCompletedWorkout: (workout) =>
      realApiService
        .recordCompletedWorkout(workout)
        .catch(() => mockApiService.recordCompletedWorkout(workout)),
  };
}

function mockDelay() {
  const delay = 200 + Math.floor(Math.random() * 301);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
