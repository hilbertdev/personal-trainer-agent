import { describe, expect, it } from "vitest";
import {
  createProgram,
  enrichWorkout,
  getDefaultWeeklyCycle,
  getWeeklyWorkload,
  isBaselineComplete,
  rememberWorkoutSubstitutions,
  type LoggedWorkout,
  type StravaActivity,
} from "@/lib/program";

function createTestProgram() {
  return createProgram({
    name: "Test Program",
    splitType: "PPL",
    weeklyCycle: getDefaultWeeklyCycle("PPL"),
    mesocycleLengthWeeks: 4,
    progression: {
      repProgression: 1,
      setProgressionEnabled: false,
      rpeProgression: 0.5,
    },
  });
}

function createLoggedWorkout(overrides: Partial<LoggedWorkout> = {}): LoggedWorkout {
  return {
    id: "workout-1",
    dayOfWeek: "Monday",
    workoutType: "Push",
    exercises: [
      {
        name: "Bench Press",
        sets: 4,
        repRangeMin: 6,
        repRangeMax: 8,
        weight: 100,
        rpe: 8,
        muscleGroups: ["Chest"],
      },
    ],
    loggedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("program helpers", () => {
  it("calculates weekly workload from cycle", () => {
    const workload = getWeeklyWorkload(getDefaultWeeklyCycle("PPL"));

    expect(workload.totalSessions).toBe(5);
    expect(workload.restDays).toBe(2);
    expect(workload.frequencyByType.Push).toBe(2);
  });

  it("detects baseline completion", () => {
    const program = createTestProgram();
    expect(isBaselineComplete(program)).toBe(false);

    const requiredSessions = 5;
    program.baselineWeek.loggedWorkouts = Array.from({ length: requiredSessions }, (_, index) =>
      createLoggedWorkout({ id: `workout-${index}`, dayOfWeek: "Monday" }),
    );

    expect(isBaselineComplete(program)).toBe(true);
  });

  it("remembers substitutions by exercise name", () => {
    const program = createTestProgram();
    const workout = createLoggedWorkout({
      exercises: [
        {
          name: "Dumbbell Bench Press",
          originalName: "Barbell Bench Press",
          sets: 3,
          repRangeMin: 8,
          repRangeMax: 10,
          weight: 80,
          rpe: 8,
          muscleGroups: ["Chest"],
          substitutionReason: "Bar taken",
        },
      ],
    });

    program.substitutionMemory = rememberWorkoutSubstitutions(program.substitutionMemory, workout);

    expect(program.substitutionMemory["barbell bench press"]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Dumbbell Bench Press",
          source: "custom",
        }),
      ]),
    );
  });

  it("enriches workout with Strava activity data", () => {
    const workout = createLoggedWorkout();
    const activity: StravaActivity = {
      activityId: "123",
      name: "Strength Session",
      durationMinutes: 55,
      avgHeartRate: 132,
      startedAt: "2026-04-01T10:00:00Z",
    };

    const enriched = enrichWorkout(workout, activity);

    expect(enriched.enrichmentStatus).toBe("enriched");
    expect(enriched.stravaData?.activityId).toBe("123");
    expect(enriched.durationMinutes).toBe(55);
  });
});
