namespace Training.Domain.Entities;

public sealed record ExerciseExecution(
    Guid Id,
    Guid? OriginalExerciseTemplateId,
    string ExerciseName,
    int SetsPerformed,
    int RepsPerformed,
    decimal WeightUsed,
    Guid? SubstitutionId,
    string? SubstitutionReason);
