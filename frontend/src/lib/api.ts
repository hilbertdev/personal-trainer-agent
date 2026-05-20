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

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
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

export function getSampleWorkout() {
  return apiFetch<WorkoutWeek>("/api/workouts/sample");
}

export function analyzeWorkout(workouts: WorkoutDay[]) {
  return apiFetch<WorkoutAnalysis>("/api/workouts/analyze", {
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

export function getProgress() {
  return apiFetch<WorkoutProgress>("/api/progress");
}

export function recordCompletedWorkout(workout: WorkoutDay) {
  return apiFetch<WorkoutProgress>("/api/progress", {
    method: "POST",
    body: JSON.stringify({
      workoutDate: workout.date,
      workoutType: workout.workoutType,
      notes: workout.notes,
    }),
  });
}
