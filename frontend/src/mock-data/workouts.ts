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
    date: "2026-05-11",
    workoutType: "Push",
    intensity: "High",
    durationMinutes: 75,
    notes: "Heavy push emphasis.",
    isRestDay: false,
    totalSets: 13,
    trainedMuscleGroups: ["Chest", "Shoulders", "Triceps"],
    exercises: [
      {
        name: "Barbell Bench Press",
        sets: 4,
        reps: "6-8",
        rirOrRpe: "RPE 8",
        muscleGroups: ["Chest", "Shoulders", "Triceps"],
      },
      {
        name: "Incline Dumbbell Press",
        sets: 3,
        reps: "8-10",
        rirOrRpe: "2 RIR",
        muscleGroups: ["Chest", "Shoulders", "Triceps"],
      },
      {
        name: "Seated Dumbbell Shoulder Press",
        sets: 3,
        reps: "8-10",
        rirOrRpe: "RPE 8",
        muscleGroups: ["Shoulders", "Triceps"],
      },
      {
        name: "Cable Triceps Pressdown",
        sets: 3,
        reps: "10-15",
        rirOrRpe: "1-2 RIR",
        muscleGroups: ["Triceps"],
      },
    ],
  },
  {
    date: "2026-05-12",
    workoutType: "Pull",
    intensity: "High",
    durationMinutes: 80,
    notes: "Dense back and biceps work.",
    isRestDay: false,
    totalSets: 14,
    trainedMuscleGroups: ["Back", "Biceps"],
    exercises: [
      {
        name: "Weighted Pull-up",
        sets: 4,
        reps: "5-8",
        rirOrRpe: "RPE 8",
        muscleGroups: ["Back", "Biceps"],
      },
      {
        name: "Barbell Row",
        sets: 4,
        reps: "6-10",
        rirOrRpe: "2 RIR",
        muscleGroups: ["Back", "Biceps"],
      },
      {
        name: "Lat Pulldown",
        sets: 3,
        reps: "10-12",
        rirOrRpe: "1-2 RIR",
        muscleGroups: ["Back", "Biceps"],
      },
      {
        name: "Incline Dumbbell Curl",
        sets: 3,
        reps: "10-12",
        rirOrRpe: "1 RIR",
        muscleGroups: ["Biceps"],
      },
    ],
  },
  {
    date: "2026-05-13",
    workoutType: "Legs",
    intensity: "High",
    durationMinutes: 95,
    notes: "High lower-body fatigue day.",
    isRestDay: false,
    totalSets: 18,
    trainedMuscleGroups: ["Back", "Calves", "Core", "Glutes", "Hamstrings", "Quads"],
    exercises: [
      {
        name: "Back Squat",
        sets: 4,
        reps: "5-8",
        rirOrRpe: "RPE 8.5",
        muscleGroups: ["Quads", "Glutes", "Core"],
      },
      {
        name: "Romanian Deadlift",
        sets: 4,
        reps: "6-10",
        rirOrRpe: "2 RIR",
        muscleGroups: ["Hamstrings", "Glutes", "Back"],
      },
      {
        name: "Leg Press",
        sets: 3,
        reps: "10-12",
        rirOrRpe: "1-2 RIR",
        muscleGroups: ["Quads", "Glutes"],
      },
      {
        name: "Seated Leg Curl",
        sets: 4,
        reps: "10-15",
        rirOrRpe: "1 RIR",
        muscleGroups: ["Hamstrings"],
      },
      {
        name: "Standing Calf Raise",
        sets: 3,
        reps: "12-15",
        rirOrRpe: "1 RIR",
        muscleGroups: ["Calves"],
      },
    ],
  },
  {
    date: "2026-05-14",
    workoutType: "Push",
    intensity: "Moderate",
    durationMinutes: 70,
    notes: "Volume-focused push session.",
    isRestDay: false,
    totalSets: 11,
    trainedMuscleGroups: ["Chest", "Shoulders", "Triceps"],
    exercises: [
      {
        name: "Incline Barbell Bench Press",
        sets: 3,
        reps: "8-10",
        rirOrRpe: "2 RIR",
        muscleGroups: ["Chest", "Shoulders", "Triceps"],
      },
      {
        name: "Machine Chest Press",
        sets: 3,
        reps: "8-12",
        rirOrRpe: "1-2 RIR",
        muscleGroups: ["Chest", "Triceps"],
      },
      {
        name: "Cable Lateral Raise",
        sets: 3,
        reps: "12-20",
        rirOrRpe: "1 RIR",
        muscleGroups: ["Shoulders"],
      },
      {
        name: "Overhead Cable Triceps Extension",
        sets: 2,
        reps: "12-15",
        rirOrRpe: "1 RIR",
        muscleGroups: ["Triceps"],
      },
    ],
  },
  {
    date: "2026-05-15",
    workoutType: "Pull",
    intensity: "High",
    durationMinutes: 85,
    notes: "Second heavy pull exposure.",
    isRestDay: false,
    totalSets: 13,
    trainedMuscleGroups: ["Back", "Biceps"],
    exercises: [
      {
        name: "Chest-Supported Row",
        sets: 4,
        reps: "8-10",
        rirOrRpe: "2 RIR",
        muscleGroups: ["Back", "Biceps"],
      },
      {
        name: "Neutral-Grip Pulldown",
        sets: 3,
        reps: "10-12",
        rirOrRpe: "1-2 RIR",
        muscleGroups: ["Back", "Biceps"],
      },
      {
        name: "Cable Row",
        sets: 3,
        reps: "10-12",
        rirOrRpe: "1 RIR",
        muscleGroups: ["Back", "Biceps"],
      },
      {
        name: "EZ-Bar Curl",
        sets: 3,
        reps: "8-12",
        rirOrRpe: "1 RIR",
        muscleGroups: ["Biceps"],
      },
    ],
  },
  {
    date: "2026-05-16",
    workoutType: "Legs",
    intensity: "Moderate",
    durationMinutes: 90,
    notes: "Second leg session within the same week.",
    isRestDay: false,
    totalSets: 16,
    trainedMuscleGroups: ["Calves", "Core", "Glutes", "Hamstrings", "Quads"],
    exercises: [
      {
        name: "Front Squat",
        sets: 4,
        reps: "6-8",
        rirOrRpe: "RPE 8",
        muscleGroups: ["Quads", "Glutes", "Core"],
      },
      {
        name: "Bulgarian Split Squat",
        sets: 3,
        reps: "8-10",
        rirOrRpe: "2 RIR",
        muscleGroups: ["Quads", "Glutes"],
      },
      {
        name: "Hip Thrust",
        sets: 3,
        reps: "8-12",
        rirOrRpe: "2 RIR",
        muscleGroups: ["Glutes", "Hamstrings"],
      },
      {
        name: "Lying Leg Curl",
        sets: 3,
        reps: "10-15",
        rirOrRpe: "1 RIR",
        muscleGroups: ["Hamstrings"],
      },
      {
        name: "Seated Calf Raise",
        sets: 3,
        reps: "12-15",
        rirOrRpe: "1 RIR",
        muscleGroups: ["Calves"],
      },
    ],
  },
  {
    date: "2026-05-17",
    workoutType: "Rest",
    intensity: "Low",
    durationMinutes: 0,
    notes: "Planned full rest day.",
    isRestDay: true,
    totalSets: 0,
    trainedMuscleGroups: [],
    exercises: [],
  },
];

const projectedWeeks = [
  {
    weekNumber: 1,
    workouts: buildProjectedWeek("2026-05-11", 1),
  },
  {
    weekNumber: 2,
    workouts: buildProjectedWeek("2026-05-18", 2),
  },
  {
    weekNumber: 3,
    workouts: buildProjectedWeek("2026-05-25", 3),
  },
  {
    weekNumber: 4,
    workouts: buildProjectedWeek("2026-06-01", 4),
  },
];

export const mockWorkoutWeek: WorkoutWeek = {
  summary: summarizeWorkouts(currentWeekWorkouts),
  workouts: currentWeekWorkouts,
};

export const mockWorkoutAnalysis: WorkoutAnalysis = {
  summary: mockWorkoutWeek.summary,
  fatigueAnalysis: {
    totalFatigueScore: 198,
    estimatedFatigue: "HIGH",
    warnings: [
      "4 consecutive training days detected",
      "6+ consecutive training days detected",
      "3 consecutive High intensity sessions detected",
      "High intensity sessions are clustered too closely",
      "Legs trained twice within 72h",
      "Back retrained before a full 48h recovery window",
      "Leg volume is concentrated enough to increase lower-body fatigue",
      "Weekly fatigue score is high",
    ],
    recommendedRestDays: ["2026-05-14", "2026-05-15", "2026-05-17"],
  },
  projectedWeeks,
  recommendations: [
    "Prioritize sleep, hydration, and at least one lower-intensity session this week.",
    "Recommended rest days: 2026-05-14, 2026-05-15, 2026-05-17.",
  ],
  warnings: [
    "4 consecutive training days detected",
    "6+ consecutive training days detected",
    "3 consecutive High intensity sessions detected",
    "High intensity sessions are clustered too closely",
    "Legs trained twice within 72h",
    "Back retrained before a full 48h recovery window",
    "Leg volume is concentrated enough to increase lower-body fatigue",
    "Weekly fatigue score is high",
  ],
};

export const mockInitialProgress: WorkoutProgress = {
  completedCount: 2,
  lastCompletedWorkoutDate: "2026-05-12",
  completedWorkouts: [
    completedWorkoutFor(currentWeekWorkouts[0], "2026-05-11T17:42:00.000Z"),
    completedWorkoutFor(currentWeekWorkouts[1], "2026-05-12T18:05:00.000Z"),
  ],
};

export const mockDashboardData = {
  userProfile: {
    id: "demo-user-01",
    name: "Jordan Lee",
    plan: "Push/Pull/Legs Hypertrophy Beta",
    goal: "Build lean mass while managing high weekly fatigue",
    avatarInitials: "JL",
    trainingAge: "Intermediate",
  },
  chartSeries: [
    { label: "Mon", plannedSets: 13, completedSets: 13, fatigue: 26 },
    { label: "Tue", plannedSets: 14, completedSets: 14, fatigue: 30 },
    { label: "Wed", plannedSets: 18, completedSets: 0, fatigue: 43 },
    { label: "Thu", plannedSets: 11, completedSets: 0, fatigue: 25 },
    { label: "Fri", plannedSets: 13, completedSets: 0, fatigue: 36 },
    { label: "Sat", plannedSets: 16, completedSets: 0, fatigue: 38 },
    { label: "Sun", plannedSets: 0, completedSets: 0, fatigue: 0 },
  ],
  analytics: {
    weeklyAdherence: 33,
    projectedVolumeChange: 0,
    readinessScore: 48,
    averageSessionMinutes: 83,
  },
  activityFeed: [
    {
      id: "activity-01",
      title: "Push session logged",
      description: "Heavy push emphasis completed with bench work at RPE 8.",
      timestamp: "2026-05-11T17:42:00.000Z",
    },
    {
      id: "activity-02",
      title: "Pull session completed",
      description: "Dense back and biceps work logged before lower-body fatigue day.",
      timestamp: "2026-05-12T18:05:00.000Z",
    },
    {
      id: "activity-03",
      title: "Recovery reminder",
      description: "Recommended rest days are queued for Thursday, Friday, and Sunday.",
      timestamp: "2026-05-13T08:30:00.000Z",
    },
  ],
  tableRows: [
    { muscleGroup: "Chest", plannedSets: 13, targetRange: "10-16", status: "On track" },
    { muscleGroup: "Back", plannedSets: 25, targetRange: "12-18", status: "High" },
    { muscleGroup: "Quads", plannedSets: 14, targetRange: "8-14", status: "Upper range" },
    { muscleGroup: "Calves", plannedSets: 6, targetRange: "6-10", status: "On track" },
  ],
  formDefaults: {
    preferredTrainingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    sessionLengthMinutes: 85,
    equipment: ["Barbell", "Dumbbells", "Cable stack", "Machines"],
    injuryNotes: "Protect recovery windows after the high-fatigue leg sessions.",
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

function buildProjectedWeek(weekStart: string, weekNumber: number) {
  const trainingTemplates = currentWeekWorkouts.filter((workout) => !workout.isRestDay);
  const schedule = [0, 1, 2, null, 3, 4, 5];

  return schedule.map((templateIndex, dayOffset) => {
    const date = shiftDate(weekStart, dayOffset);

    if (templateIndex === null) {
      return {
        date,
        workoutType: "Rest",
        intensity: "Low",
        durationMinutes: 0,
        notes: "Projected recovery day to manage fatigue.",
        isRestDay: true,
        totalSets: 0,
        trainedMuscleGroups: [],
        exercises: [],
      } satisfies WorkoutDay;
    }

    const template = trainingTemplates[templateIndex];

    return {
      ...template,
      date,
      notes: template.notes
        ? `${template.notes} Projected week ${weekNumber}.`
        : `Projected week ${weekNumber}: keep 1-3 reps in reserve on working sets.`,
      exercises: template.exercises.map((exercise) => ({
        ...exercise,
        muscleGroups: [...exercise.muscleGroups],
      })),
      trainedMuscleGroups: [...template.trainedMuscleGroups],
    };
  });
}

function shiftDate(date: string, daysToAdd: number) {
  const value = new Date(`${date}T00:00:00`);
  value.setDate(value.getDate() + daysToAdd);
  return value.toISOString().slice(0, 10);
}
