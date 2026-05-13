using Microsoft.AspNetCore.Mvc;
using WorkoutPlanner.Api.Contracts;
using WorkoutPlanner.Domain.Interfaces;

namespace WorkoutPlanner.Api.Controllers;

[ApiController]
[Route("api/agent/workouts")]
public sealed class AgentWorkoutsController(
    IWorkoutRepository workoutRepository,
    IFatigueAnalyzer fatigueAnalyzer,
    IPhaseScheduler phaseScheduler) : ControllerBase
{
    [HttpGet("current-week", Name = "GetCurrentWorkoutWeek")]
    [ProducesResponseType(typeof(WorkoutWeekResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WorkoutWeekResponse>> GetCurrentWeek(CancellationToken cancellationToken)
    {
        var workouts = await workoutRepository.GetCurrentWeekAsync(cancellationToken);

        if (workouts.Count is 0)
        {
            return NoWorkoutDataProblem();
        }

        return Ok(WorkoutResponseMapper.ToWeekResponse(workouts));
    }

    [HttpGet("analysis", Name = "GetWorkoutAnalysis")]
    [ProducesResponseType(typeof(WorkoutAnalysisResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WorkoutAnalysisResponse>> GetAnalysis(CancellationToken cancellationToken)
    {
        var workouts = await workoutRepository.GetCurrentWeekAsync(cancellationToken);

        if (workouts.Count is 0)
        {
            return NoWorkoutDataProblem();
        }

        var analysis = await fatigueAnalyzer.AnalyzeAsync(workouts, cancellationToken);
        var response = new WorkoutAnalysisResponse(
            WorkoutResponseMapper.ToSummaryResponse(workouts),
            WorkoutResponseMapper.ToAnalysisResponse(analysis));

        return Ok(response);
    }

    [HttpGet("projection", Name = "GetWorkoutProjection")]
    [ProducesResponseType(typeof(WorkoutProjectionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WorkoutProjectionResponse>> GetProjection(CancellationToken cancellationToken)
    {
        var workouts = await workoutRepository.GetCurrentWeekAsync(cancellationToken);

        if (workouts.Count is 0)
        {
            return NoWorkoutDataProblem();
        }

        var analysis = await fatigueAnalyzer.AnalyzeAsync(workouts, cancellationToken);
        var plan = await phaseScheduler.ProjectAsync(workouts, analysis, cancellationToken);
        var response = new WorkoutProjectionResponse(
            WorkoutResponseMapper.ToSummaryResponse(plan.Workouts),
            WorkoutResponseMapper.ToAnalysisResponse(analysis),
            plan.RecommendedRestDays,
            plan.ProjectedWeeks
                .Select(WorkoutResponseMapper.ToProjectedWeekResponse)
                .ToList());

        return Ok(response);
    }

    private ObjectResult NoWorkoutDataProblem()
    {
        return Problem(
            title: "No workout data is available.",
            detail: "The current workout repository does not contain a week for agents to query.",
            statusCode: StatusCodes.Status404NotFound,
            type: "https://httpstatuses.com/404");
    }
}
