using Training.Domain.Entities;

namespace Training.Application.Programs;

public sealed record WorkoutForDayResult(
    DateOnly Date,
    WorkoutTemplate WorkoutTemplate,
    IReadOnlyDictionary<Guid, IReadOnlyList<ExerciseSubstitution>> SubstitutionsByExerciseTemplateId);
