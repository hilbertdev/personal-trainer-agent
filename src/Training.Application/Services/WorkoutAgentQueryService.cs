using Training.Application.Abstractions;

namespace Training.Application.Services;

public sealed class WorkoutAgentQueryService(
    IWorkoutRepository workoutRepository,
    IFatigueAnalyzer fatigueAnalyzer,
    IPhaseScheduler phaseScheduler) : IWorkoutAgentQueryService
{
    public Task<IReadOnlyList<Domain.Entities.WorkoutDay>> GetCurrentWeekAsync(
        CancellationToken cancellationToken = default)
    {
        return workoutRepository.GetCurrentWeekAsync(cancellationToken);
    }

    public async Task<WorkoutAgentAnalysis?> GetAnalysisAsync(CancellationToken cancellationToken = default)
    {
        var workouts = await workoutRepository.GetCurrentWeekAsync(cancellationToken);

        if (workouts.Count is 0)
        {
            return null;
        }

        var analysis = await fatigueAnalyzer.AnalyzeAsync(workouts, cancellationToken);
        return new WorkoutAgentAnalysis(workouts, analysis);
    }

    public async Task<WorkoutAgentProjection?> GetProjectionAsync(CancellationToken cancellationToken = default)
    {
        var workouts = await workoutRepository.GetCurrentWeekAsync(cancellationToken);

        if (workouts.Count is 0)
        {
            return null;
        }

        var analysis = await fatigueAnalyzer.AnalyzeAsync(workouts, cancellationToken);
        var plan = await phaseScheduler.ProjectAsync(workouts, analysis, cancellationToken);

        return new WorkoutAgentProjection(plan, analysis);
    }
}
