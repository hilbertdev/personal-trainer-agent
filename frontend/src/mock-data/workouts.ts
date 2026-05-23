import type {
  CompletedWorkout,
  WorkoutAnalysis,
  WorkoutDay,
  WorkoutProgress,
  WorkoutSummary,
  WorkoutWeek,
} from "@/lib/api";

const currentWeekWorkouts: WorkoutDay[] = [
  {
    date: "2026-05-18",
    workoutType: "Push",
    intensity: "High",
    durationMinutes: 58,
    notes: "Heavy horizontal press focus with controlled back-off volume.",
    isRestDay: false,
    totalSets: 17,
    trainedMuscleGroups: ["Chest", "Shoulders", "Triceps"],
    exercises: [
      {
        name: "Barbell Bench Press",
        sets: 4,
        reps: "5-7",
        rirOrRpe: "RPE 8",
        muscleGroups: ["Chest", "Triceps"],
      },
      {
        name: "Incline Dumbbell Press",
        sets: 4,
        reps: "8-10",
        rirOrRpe: "2 RIR",
        muscleGroups: ["Chest", "Shoulders"],
      },
      {
        name: "Cable Lateral Raise",
        sets: 5,
        reps: "12-15",
        rirOrRpe: "1 RIR",
        muscleGroups: ["Shoulders"],
      },
      {
        name: "Rope Pressdown",
        sets: 4,
        reps: "10-12",
        rirOrRpe: "1 RIR",
        muscleGroups: ["Triceps"],
      },
    ],
  },
  {
    date: "2026-05-19",
    workoutType: "Pull",
    intensity: "Moderate",
    durationMinutes: 52,
    notes: "Back density and elbow-friendly biceps work after push day.",
    isRestDay: false,
    totalSets: 15,
    trainedMuscleGroups: ["Back", "Rear Delts", "Biceps"],
    exercises: [
      {
        name: "Weighted Pull-up",
        sets: 4,
        reps: "4-6",
        rirOrRpe: "RPE 8",
        muscleGroups: ["Back", "Biceps"],
      },
      {
        name: "Chest-Supported Row",
        sets: 4,
        reps: "8-10",
        rirOrRpe: "2 RIR",
        muscleGroups: ["Back"],
      },
      {
        name: "Reverse Pec Deck",
        sets: 3,
        reps: "15-20",
        rirOrRpe: "1 RIR",
        muscleGroups: ["Rear Delts"],
      },
      {
        name: "Incline Curl",
        sets: 4,
        reps: "10-12",
        rirOrRpe: "1 RIR",
        muscleGroups: ["Biceps"],
      },
    ],
  },
  {
    date: "2026-05-20",
    workoutType: "Rest",
    intensity: "Low",
    durationMinutes: 25,
    notes: "Recovery walk, hip mobility, and extra sleep target.",
    isRestDay: true,
    totalSets: 0,
    trainedMuscleGroups: [],
    exercises: [],
  },
  {
    date: "2026-05-21",
    workoutType: "Legs",
    intensity: "High",
    durationMinutes: 64,
    notes: "Quad emphasis with hamstring accessories capped before fatigue spikes.",
    isRestDay: false,
    totalSets: 18,
    trainedMuscleGroups: ["Quads", "Hamstrings", "Glutes", "Calves"],
    exercises: [
      {
        name: "Back Squat",
        sets: 4,
        reps: "4-6",
        rirOrRpe: "RPE 8",
        muscleGroups: ["Quads", "Glutes"],
      },
      {
        name: "Romanian Deadlift",
        sets: 4,
        reps: "6-8",
        rirOrRpe: "2 RIR",
        muscleGroups: ["Hamstrings", "Glutes"],
      },
      {
        name: "Leg Press",
        sets: 4,
        reps: "10-12",
        rirOrRpe: "1 RIR",
        muscleGroups: ["Quads"],
      },
      {
        name: "Seated Calf Raise",
        sets: 6,
        reps: "12-15",
        rirOrRpe: "1 RIR",
        muscleGroups: ["Calves"],
      },
    ],
  },
  {
    date: "2026-05-22",
    workoutType: "Upper",
    intensity: "Moderate",
    durationMinutes: 49,
    notes: "Pump-focused upper session to add volume without another high-stress day.",
    isRestDay: false,
    totalSets: 16,
    trainedMuscleGroups: ["Chest", "Back", "Shoulders", "Arms"],
    exercises: [
      {
        name: "Machine Chest Press",
        sets: 4,
        reps: "8-12",
        rirOrRpe: "2 RIR",
        muscleGroups: ["Chest", "Triceps"],
      },
      {
        name: "Lat Pulldown",
        sets: 4,
        reps: "10-12",
        rirOrRpe: "2 RIR",
        muscleGroups: ["Back"],
      },
      {
        name: "Cable Fly",
        sets: 4,
        reps: "12-15",
        rirOrRpe: "1 RIR",
        muscleGroups: ["Chest"],
      },
      {
        name: "EZ-Bar Curl",
        sets: 4,
        reps: "10-12",
        rirOrRpe: "1 RIR",
        muscleGroups: ["Biceps"],
      },
    ],
  },
  {
    date: "2026-05-23",
    workoutType: "Cardio",
    intensity: "Low",
    durationMinutes: 35,
    notes: "Zone 2 ride to maintain conditioning and support recovery.",
    isRestDay: false,
    totalSets: 0,
    trainedMuscleGroups: ["Cardio"],
    exercises: [
      {
        name: "Stationary Bike",
        sets: 1,
        reps: "35 minutes",
        rirOrRpe: "Zone 2",
        muscleGroups: ["Cardio"],
      },
    ],
  },
  {
    date: "2026-05-24",
    workoutType: "Rest",
    intensity: "Low",
    durationMinutes: 20,
    notes: "Optional mobility circuit and readiness check before next microcycle.",
    isRestDay: true,
    totalSets: 0,
    trainedMuscleGroups: [],
    exercises: [],
  },
];

const projectedWeeks = [
  {
    weekNumber: 1,
    workouts: currentWeekWorkouts,
  },
  {
    weekNumber: 2,
    workouts: shiftWorkouts(currentWeekWorkouts, 7, "Add one set to priority chest and quad accessories."),
  },
  {
    weekNumber: 3,
    workouts: shiftWorkouts(currentWeekWorkouts, 14, "Hold volume steady and push final set intensity when recovery is green."),
  },
  {
    weekNumber: 4,
    workouts: shiftWorkouts(currentWeekWorkouts, 21, "Deload compounds by 10% and keep isolation work two reps from failure."),
  },
];

export const mockWorkoutWeek: WorkoutWeek = {
  summary: summarizeWorkouts(currentWeekWorkouts),
  workouts: currentWeekWorkouts,
};

export const mockWorkoutAnalysis: WorkoutAnalysis = {
  summary: mockWorkoutWeek.summary,
  fatigueAnalysis: {
    totalFatigueScore: 68,
    estimatedFatigue: "MODERATE",
    warnings: ["Two high-intensity days are close together; keep recovery work non-negotiable."],
    recommendedRestDays: ["2026-05-20", "2026-05-24"],
  },
  projectedWeeks,
  recommendations: [
    "Keep the next heavy push session at RPE 8 until sleep quality is stable for two nights.",
    "Add 5-10 minutes of easy cycling after leg day to reduce next-day soreness.",
    "Prioritize protein at breakfast on training days to support the higher weekly set count.",
  ],
  warnings: ["Avoid adding another high-intensity lower session this week."],
};

export const mockInitialProgress: WorkoutProgress = {
  completedCount: 2,
  lastCompletedWorkoutDate: "2026-05-19",
  completedWorkouts: [
    completedWorkoutFor(currentWeekWorkouts[0], "2026-05-18T17:42:00.000Z"),
    completedWorkoutFor(currentWeekWorkouts[1], "2026-05-19T18:05:00.000Z"),
  ],
};

export const mockDashboardData = {
  userProfile: {
    id: "demo-user-01",
    name: "Jordan Lee",
    plan: "Hypertrophy Beta",
    goal: "Build lean mass while keeping fatigue moderate",
    avatarInitials: "JL",
    trainingAge: "Intermediate",
  },
  chartSeries: [
    { label: "Mon", plannedSets: 17, completedSets: 17, fatigue: 76 },
    { label: "Tue", plannedSets: 15, completedSets: 15, fatigue: 64 },
    { label: "Wed", plannedSets: 0, completedSets: 0, fatigue: 38 },
    { label: "Thu", plannedSets: 18, completedSets: 0, fatigue: 72 },
    { label: "Fri", plannedSets: 16, completedSets: 0, fatigue: 59 },
    { label: "Sat", plannedSets: 0, completedSets: 0, fatigue: 31 },
    { label: "Sun", plannedSets: 0, completedSets: 0, fatigue: 24 },
  ],
  analytics: {
    weeklyAdherence: 40,
    projectedVolumeChange: 8,
    readinessScore: 82,
    averageSessionMinutes: 52,
  },
  activityFeed: [
    {
      id: "activity-01",
      title: "Push session logged",
      description: "Bench top set moved cleanly at RPE 8.",
      timestamp: "2026-05-18T17:42:00.000Z",
    },
    {
      id: "activity-02",
      title: "Pull session completed",
      description: "Back volume completed with no elbow irritation.",
      timestamp: "2026-05-19T18:05:00.000Z",
    },
    {
      id: "activity-03",
      title: "Recovery reminder",
      description: "Mobility and walk scheduled before heavy legs.",
      timestamp: "2026-05-20T08:30:00.000Z",
    },
  ],
  tableRows: [
    { muscleGroup: "Chest", plannedSets: 12, targetRange: "10-16", status: "On track" },
    { muscleGroup: "Back", plannedSets: 12, targetRange: "12-18", status: "On track" },
    { muscleGroup: "Quads", plannedSets: 8, targetRange: "8-14", status: "Minimum met" },
    { muscleGroup: "Calves", plannedSets: 6, targetRange: "6-10", status: "On track" },
  ],
  formDefaults: {
    preferredTrainingDays: ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
    sessionLengthMinutes: 60,
    equipment: ["Barbell", "Dumbbells", "Cable stack", "Machines"],
    injuryNotes: "Keep shoulder pressing neutral-grip when possible.",
  },
};

export function summarizeWorkouts(workouts: WorkoutDay[]): WorkoutSummary {
  const trainingWorkouts = workouts.filter((workout) => !workout.isRestDay);
  const weekStart = workouts[0]?.date ?? null;
  const weekEnd = workouts.at(-1)?.date ?? null;

  return {
    weekStart,
    weekEnd,
    trackedDays: workouts.length,
    trainingDays: trainingWorkouts.length,
    restDays: workouts.length - trainingWorkouts.length,
    highIntensityDays: workouts.filter((workout) => workout.intensity === "High").length,
    totalSets: workouts.reduce((total, workout) => total + workout.totalSets, 0),
    totalDurationMinutes: workouts.reduce((total, workout) => total + workout.durationMinutes, 0),
    setsByMuscleGroup: workouts.reduce<Record<string, number>>((groups, workout) => {
      workout.exercises.forEach((exercise) => {
        exercise.muscleGroups.forEach((group) => {
          groups[group] = (groups[group] ?? 0) + exercise.sets;
        });
      });
      return groups;
    }, {}),
    workoutsByType: workouts.reduce<Record<string, number>>((types, workout) => {
      types[workout.workoutType] = (types[workout.workoutType] ?? 0) + 1;
      return types;
    }, {}),
  };
}

export function completedWorkoutFor(workout: WorkoutDay, completedAt = new Date().toISOString()): CompletedWorkout {
  return {
    id: `${workout.date}-${workout.workoutType}`.toLowerCase(),
    workoutDate: workout.date,
    workoutType: workout.workoutType,
    completedAt,
    notes: workout.notes,
  };
}

function shiftWorkouts(workouts: WorkoutDay[], daysToAdd: number, noteSuffix: string) {
  return workouts.map((workout) => ({
    ...workout,
    date: shiftDate(workout.date, daysToAdd),
    notes: workout.isRestDay ? workout.notes : `${workout.notes} ${noteSuffix}`,
    exercises: workout.exercises.map((exercise) => ({ ...exercise })),
    trainedMuscleGroups: [...workout.trainedMuscleGroups],
  }));
}

function shiftDate(date: string, daysToAdd: number) {
  const value = new Date(`${date}T00:00:00`);
  value.setDate(value.getDate() + daysToAdd);
  return value.toISOString().slice(0, 10);
}
