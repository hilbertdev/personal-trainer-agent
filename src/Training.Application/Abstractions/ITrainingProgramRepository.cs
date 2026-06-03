using Training.Domain.Entities;

namespace Training.Application.Abstractions;

public interface ITrainingProgramRepository
{
    Task<TrainingProgram> SaveProgramAsync(
        TrainingProgram program,
        CancellationToken cancellationToken = default);

    Task<Mesocycle> AddMesocycleAsync(
        Guid programId,
        Mesocycle mesocycle,
        CancellationToken cancellationToken = default);

    Task<WeeklyPlan> AddWeeklyPlanAsync(
        Guid mesocycleId,
        WeeklyPlan weeklyPlan,
        CancellationToken cancellationToken = default);

    Task<WorkoutTemplate> AddWorkoutTemplateAsync(
        Guid weeklyPlanId,
        WorkoutTemplate workoutTemplate,
        CancellationToken cancellationToken = default);

    Task<TrainingProgram?> GetProgramAsync(
        Guid programId,
        CancellationToken cancellationToken = default);

    Task<TrainingProgramOverview?> GetProgramOverviewAsync(
        Guid programId,
        CancellationToken cancellationToken = default);

    Task<WorkoutTemplate?> GetWorkoutTemplateAsync(
        Guid workoutTemplateId,
        CancellationToken cancellationToken = default);

    Task<WorkoutTemplate?> GetWorkoutTemplateForDayAsync(
        Guid athleteId,
        DateOnly date,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ExerciseSubstitution>> GetExerciseSubstitutionsAsync(
        Guid athleteId,
        Guid? originalExerciseTemplateId,
        string originalExerciseName,
        CancellationToken cancellationToken = default);

    Task<ExerciseSubstitution> UpsertExerciseSubstitutionAsync(
        ExerciseSubstitution substitution,
        CancellationToken cancellationToken = default);

    Task<WorkoutExecution> SaveWorkoutExecutionAsync(
        WorkoutExecution execution,
        CancellationToken cancellationToken = default);

    Task SaveTrainingLoadSummaryAsync(
        TrainingLoadSummary summary,
        CancellationToken cancellationToken = default);
}
