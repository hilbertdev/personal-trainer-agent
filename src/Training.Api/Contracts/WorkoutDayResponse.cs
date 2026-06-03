using Training.Domain.Enums;

namespace Training.Api.Contracts;

public sealed record WorkoutDayResponse(
    DateOnly Date,
    WorkoutType WorkoutType,
    IntensityLevel Intensity,
    int DurationMinutes,
    string? Notes,
    bool IsRestDay,
    int TotalSets,
    IReadOnlyList<MuscleGroup> TrainedMuscleGroups,
    IReadOnlyList<ExerciseResponse> Exercises);
