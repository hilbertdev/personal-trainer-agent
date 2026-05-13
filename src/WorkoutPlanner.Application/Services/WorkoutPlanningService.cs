using WorkoutPlanner.Domain.Entities;
using WorkoutPlanner.Domain.Interfaces;

namespace WorkoutPlanner.Application.Services;

public sealed class WorkoutPlanningService(
    IWorkoutRepository workoutRepository,
    IFatigueAnalyzer fatigueAnalyzer,
    IPhaseScheduler phaseScheduler) : IWorkoutPlanningService
{
    public async Task<WorkoutPlanningResult> BuildPlanAsync(
        IReadOnlyList<WorkoutDay> workouts,
        CancellationToken cancellationToken = default)
    {
        await workoutRepository.SaveWeeklyPlanAsync(workouts, cancellationToken);

        var storedWorkouts = await workoutRepository.GetCurrentWeekAsync(cancellationToken);
        var analysis = await fatigueAnalyzer.AnalyzeAsync(storedWorkouts, cancellationToken);
        var plan = await phaseScheduler.ProjectAsync(storedWorkouts, analysis, cancellationToken);

        return new WorkoutPlanningResult(analysis, plan);
    }
}
