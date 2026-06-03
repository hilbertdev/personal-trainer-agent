using Microsoft.AspNetCore.Mvc;
using Training.Api.Contracts;
using Training.Application.Abstractions;

namespace Training.Api.Controllers;

[ApiController]
[Route("api/agent/workouts")]
public sealed class AgentWorkoutsController(IWorkoutAgentQueryService agentQueryService) : ControllerBase
{
    [HttpGet("current-week", Name = "GetCurrentWorkoutWeek")]
    [ProducesResponseType(typeof(WorkoutWeekResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WorkoutWeekResponse>> GetCurrentWeek(CancellationToken cancellationToken)
    {
        var workouts = await agentQueryService.GetCurrentWeekAsync(cancellationToken);

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
        var result = await agentQueryService.GetAnalysisAsync(cancellationToken);

        if (result is null)
        {
            return NoWorkoutDataProblem();
        }

        var response = new WorkoutAnalysisResponse(
            WorkoutResponseMapper.ToSummaryResponse(result.Workouts),
            WorkoutResponseMapper.ToAnalysisResponse(result.Analysis));

        return Ok(response);
    }

    [HttpGet("projection", Name = "GetWorkoutProjection")]
    [ProducesResponseType(typeof(WorkoutProjectionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WorkoutProjectionResponse>> GetProjection(CancellationToken cancellationToken)
    {
        var result = await agentQueryService.GetProjectionAsync(cancellationToken);

        if (result is null)
        {
            return NoWorkoutDataProblem();
        }

        var response = new WorkoutProjectionResponse(
            WorkoutResponseMapper.ToSummaryResponse(result.Plan.Workouts),
            WorkoutResponseMapper.ToAnalysisResponse(result.Analysis),
            result.Plan.RecommendedRestDays,
            result.Plan.ProjectedWeeks
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
