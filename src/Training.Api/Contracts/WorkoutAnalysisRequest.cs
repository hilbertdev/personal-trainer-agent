using Training.Domain.Enums;

namespace Training.Api.Contracts;

public sealed record WorkoutAnalysisRequest(IReadOnlyList<WorkoutDayRequest> Workouts);

public sealed record WorkoutDayRequest(
    DateOnly Date,
    WorkoutType WorkoutType,
    IReadOnlyList<ExerciseRequest> Exercises,
    int DurationMinutes,
    IntensityLevel Intensity,
    string? Notes);

public sealed record ExerciseRequest(
    string Name,
    int Sets,
    string Reps,
    string? RirOrRpe,
    IReadOnlyList<MuscleGroup> MuscleGroups);
