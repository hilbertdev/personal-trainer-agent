namespace Training.Api.Contracts;

public sealed record WorkoutSummaryResponse(
    DateOnly? WeekStart,
    DateOnly? WeekEnd,
    int TrackedDays,
    int TrainingDays,
    int RestDays,
    int HighIntensityDays,
    int TotalSets,
    int TotalDurationMinutes,
    IReadOnlyDictionary<string, int> SetsByMuscleGroup,
    IReadOnlyDictionary<string, int> WorkoutsByType);
