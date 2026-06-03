using Microsoft.AspNetCore.Mvc;
using Training.Api.Contracts;
using Training.Application.Abstractions;

namespace Training.Api.Controllers;

[ApiController]
[Route("api/strava")]
public sealed class StravaSyncController(ITrainingProgramService trainingProgramService) : ControllerBase
{
    [HttpPost("sync", Name = "SyncStravaActivities")]
    [ProducesResponseType(typeof(IReadOnlyList<WorkoutExecutionResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IReadOnlyList<WorkoutExecutionResponse>>> Sync(
        SyncStravaActivitiesRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var executions = await trainingProgramService.SyncStravaActivitiesAsync(
                TrainingProgramContractMapper.ToCommand(request),
                cancellationToken);

            return Ok(executions.Select(TrainingProgramContractMapper.ToResponse).ToList());
        }
        catch (InvalidOperationException exception)
        {
            return Problem(
                title: "Strava sync is not available.",
                detail: exception.Message,
                statusCode: StatusCodes.Status400BadRequest,
                type: "https://httpstatuses.com/400");
        }
    }
}
