using Training.Api.Contracts;
using Training.Domain.Enums;

namespace Training.Api.IntegrationTests;

internal static class TestRequestFactory
{
    public static ImportProgramRequest CreateImportProgramRequest(
        Guid athleteId,
        DateOnly? workoutDate = null)
    {
        var startDate = workoutDate ?? new DateOnly(2026, 1, 5);

        return new ImportProgramRequest(
            "Integration Program",
            athleteId,
            startDate,
            null,
            [
                new ImportMesocycleRequest(
                    "Meso 1",
                    startDate,
                    4,
                    [
                        new ImportWeeklyPlanRequest(
                            1,
                            [
                                new ImportWorkoutTemplateRequest(
                                    "Upper 1",
                                    startDate.DayOfWeek,
                                    [
                                        new ExerciseTemplateRequest(
                                            "Bench Press",
                                            null,
                                            4,
                                            6,
                                            8,
                                            null,
                                            null,
                                            null,
                                            null,
                                            null,
                                            ExerciseCategory.Strength,
                                            null)
                                    ],
                                    "Push",
                                    "Baseline")
                            ])
                    ])
            ]);
    }
}
