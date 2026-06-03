using Training.Application.Programs;
using Training.Domain.Entities;

namespace Training.Application.Abstractions;

public interface ITrainingProgramService
{
    Task<TrainingProgram> CreateTrainingProgramAsync(
        CreateTrainingProgramCommand command,
        CancellationToken cancellationToken = default);

    Task<Mesocycle> AddMesocycleAsync(
        Guid programId,
        AddMesocycleCommand command,
        CancellationToken cancellationToken = default);

    Task<WeeklyPlan> AddWeeklyPlanAsync(
        Guid programId,
        AddWeeklyPlanCommand command,
        CancellationToken cancellationToken = default);

    Task<WorkoutTemplate> AddWorkoutTemplateAsync(
        Guid programId,
        AddWorkoutTemplateCommand command,
        CancellationToken cancellationToken = default);

    Task<WorkoutExecution> RecordWorkoutExecutionAsync(
        Guid workoutTemplateId,
        RecordWorkoutExecutionCommand command,
        CancellationToken cancellationToken = default);

    Task<ExerciseSubstitution> SubstituteExerciseAsync(
        Guid workoutTemplateId,
        SubstituteExerciseCommand command,
        CancellationToken cancellationToken = default);

    Task<WorkoutForDayResult?> GetWorkoutForDayAsync(
        Guid athleteId,
        DateOnly date,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<WorkoutExecution>> SyncStravaActivitiesAsync(
        SyncStravaActivitiesCommand command,
        CancellationToken cancellationToken = default);

    Task<TrainingProgramOverview?> GetProgramOverviewAsync(
        Guid programId,
        CancellationToken cancellationToken = default);
}
