using Training.Domain.Entities;
using Training.Domain.Enums;
using static Training.Domain.Enums.IntensityLevel;
using static Training.Domain.Enums.MuscleGroup;
using static Training.Domain.Enums.WorkoutType;

namespace Training.Application.SampleData;

public static class SampleWorkoutDataFactory
{
    public static IReadOnlyList<WorkoutDay> Create()
    {
        var monday = new DateOnly(2026, 5, 11);

        return
        [
            new WorkoutDay(
                monday,
                Push,
                [
                    new Exercise("Barbell Bench Press", 4, "6-8", "RPE 8", [Chest, Shoulders, Triceps]),
                    new Exercise("Incline Dumbbell Press", 3, "8-10", "2 RIR", [Chest, Shoulders, Triceps]),
                    new Exercise("Seated Dumbbell Shoulder Press", 3, "8-10", "RPE 8", [Shoulders, Triceps]),
                    new Exercise("Cable Triceps Pressdown", 3, "10-15", "1-2 RIR", [Triceps])
                ],
                DurationMinutes: 75,
                High,
                "Heavy push emphasis."),

            new WorkoutDay(
                monday.AddDays(1),
                Pull,
                [
                    new Exercise("Weighted Pull-up", 4, "5-8", "RPE 8", [Back, Biceps]),
                    new Exercise("Barbell Row", 4, "6-10", "2 RIR", [Back, Biceps]),
                    new Exercise("Lat Pulldown", 3, "10-12", "1-2 RIR", [Back, Biceps]),
                    new Exercise("Incline Dumbbell Curl", 3, "10-12", "1 RIR", [Biceps])
                ],
                DurationMinutes: 80,
                High,
                "Dense back and biceps work."),

            new WorkoutDay(
                monday.AddDays(2),
                Legs,
                [
                    new Exercise("Back Squat", 4, "5-8", "RPE 8.5", [Quads, Glutes, Core]),
                    new Exercise("Romanian Deadlift", 4, "6-10", "2 RIR", [Hamstrings, Glutes, Back]),
                    new Exercise("Leg Press", 3, "10-12", "1-2 RIR", [Quads, Glutes]),
                    new Exercise("Seated Leg Curl", 4, "10-15", "1 RIR", [Hamstrings]),
                    new Exercise("Standing Calf Raise", 3, "12-15", "1 RIR", [Calves])
                ],
                DurationMinutes: 95,
                High,
                "High lower-body fatigue day."),

            new WorkoutDay(
                monday.AddDays(3),
                Push,
                [
                    new Exercise("Incline Barbell Bench Press", 3, "8-10", "2 RIR", [Chest, Shoulders, Triceps]),
                    new Exercise("Machine Chest Press", 3, "10-12", "1-2 RIR", [Chest, Triceps]),
                    new Exercise("Cable Lateral Raise", 3, "12-20", "1 RIR", [Shoulders]),
                    new Exercise("Overhead Cable Triceps Extension", 2, "12-15", "1 RIR", [Triceps])
                ],
                DurationMinutes: 70,
                Moderate,
                "Volume-focused push session."),

            new WorkoutDay(
                monday.AddDays(4),
                Pull,
                [
                    new Exercise("Chest-Supported Row", 4, "8-10", "2 RIR", [Back, Biceps]),
                    new Exercise("Neutral-Grip Pulldown", 3, "10-12", "1-2 RIR", [Back, Biceps]),
                    new Exercise("Cable Row", 3, "10-12", "1 RIR", [Back, Biceps]),
                    new Exercise("EZ-Bar Curl", 3, "8-12", "1 RIR", [Biceps])
                ],
                DurationMinutes: 85,
                High,
                "Second heavy pull exposure."),

            new WorkoutDay(
                monday.AddDays(5),
                Legs,
                [
                    new Exercise("Front Squat", 4, "6-8", "RPE 8", [Quads, Glutes, Core]),
                    new Exercise("Bulgarian Split Squat", 3, "8-10", "2 RIR", [Quads, Glutes]),
                    new Exercise("Hip Thrust", 3, "8-12", "2 RIR", [Glutes, Hamstrings]),
                    new Exercise("Lying Leg Curl", 3, "10-15", "1 RIR", [Hamstrings]),
                    new Exercise("Seated Calf Raise", 3, "12-15", "1 RIR", [Calves])
                ],
                DurationMinutes: 90,
                Moderate,
                "Second leg session within the same week."),

            new WorkoutDay(
                monday.AddDays(6),
                Rest,
                [],
                DurationMinutes: 0,
                Low,
                "Planned full rest day.")
        ];
    }
}
