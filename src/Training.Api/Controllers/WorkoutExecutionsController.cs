using Microsoft.AspNetCore.Mvc;
using Training.Api.Contracts;
using Training.Application.Abstractions;

namespace Training.Api.Controllers;

[ApiController]
[Route("api/workouts")]
public sealed class WorkoutExecutionsController(ITrainingProgramService trainingProgramService) : ControllerBase
{
    [HttpPost("{id:guid}/execute", Name = "RecordWorkoutExecution")]
    [ProducesResponseType(typeof(WorkoutExecutionResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WorkoutExecutionResponse>> Execute(
        Guid id,
        RecordWorkoutExecutionRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var execution = await trainingProgramService.RecordWorkoutExecutionAsync(
                id,
                TrainingProgramContractMapper.ToCommand(request),
                cancellationToken);

            return Created($"/api/programs/{execution.WorkoutTemplateId}/overview", TrainingProgramContractMapper.ToResponse(execution));
        }
        catch (InvalidOperationException exception)
        {
            return NotFoundProblem(exception.Message);
        }
    }

    [HttpPost("{id:guid}/substitute", Name = "SubstituteExercise")]
    [ProducesResponseType(typeof(ExerciseSubstitutionResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ExerciseSubstitutionResponse>> Substitute(
        Guid id,
        SubstituteExerciseRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var substitution = await trainingProgramService.SubstituteExerciseAsync(
                id,
                TrainingProgramContractMapper.ToCommand(request),
                cancellationToken);

            return Created($"/api/workouts/{id}/substitute", TrainingProgramContractMapper.ToResponse(substitution));
        }
        catch (InvalidOperationException exception)
        {
            return NotFoundProblem(exception.Message);
        }
    }

    [HttpGet("today", Name = "GetWorkoutForDay")]
    [ProducesResponseType(typeof(WorkoutForDayResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WorkoutForDayResponse>> GetToday(
        [FromQuery] Guid athleteId,
        [FromQuery] DateOnly? date,
        CancellationToken cancellationToken)
    {
        var workout = await trainingProgramService.GetWorkoutForDayAsync(
            athleteId,
            date ?? DateOnly.FromDateTime(DateTime.UtcNow.Date),
            cancellationToken);

        if (workout is null)
        {
            return NotFoundProblem("No planned workout was found for the requested athlete and date.");
        }

        return Ok(TrainingProgramContractMapper.ToResponse(workout));
    }

    private ObjectResult NotFoundProblem(string detail)
    {
        return Problem(
            title: "Workout resource was not found.",
            detail: detail,
            statusCode: StatusCodes.Status404NotFound,
            type: "https://httpstatuses.com/404");
    }
}
