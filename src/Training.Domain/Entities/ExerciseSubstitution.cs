namespace Training.Domain.Entities;

public sealed record ExerciseSubstitution(
    Guid Id,
    Guid AthleteId,
    Guid? OriginalExerciseTemplateId,
    string OriginalExerciseName,
    string SubstitutedExerciseName,
    string Reason,
    IReadOnlyList<string> ContextTags,
    bool SuggestedByUser,
    int FrequencyUsed);
