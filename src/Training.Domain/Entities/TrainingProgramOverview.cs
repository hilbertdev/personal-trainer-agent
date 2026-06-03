namespace Training.Domain.Entities;

public sealed record TrainingProgramOverview(
    TrainingProgram Program,
    IReadOnlyList<WorkoutExecution> WorkoutExecutions,
    IReadOnlyList<ExerciseSubstitution> Substitutions,
    IReadOnlyList<TrainingLoadSummary> TrainingLoadSummaries);
