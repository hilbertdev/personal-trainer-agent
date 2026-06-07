using Microsoft.AspNetCore.Mvc;
using Training.Api.Contracts;
using Training.Application.Abstractions;

namespace Training.Api.Controllers;

[ApiController]
[Route("api/programs")]
public sealed class TrainingProgramsController(ITrainingProgramService trainingProgramService) : ControllerBase
{
    [HttpPost(Name = "CreateTrainingProgram")]
    [ProducesResponseType(typeof(TrainingProgramResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<TrainingProgramResponse>> Create(
        CreateTrainingProgramRequest request,
        CancellationToken cancellationToken)
    {
        var program = await trainingProgramService.CreateTrainingProgramAsync(
            TrainingProgramContractMapper.ToCommand(request),
            cancellationToken);

        return CreatedAtAction(nameof(GetOverview), new { id = program.Id }, TrainingProgramContractMapper.ToResponse(program));
    }

    [HttpGet(Name = "ListTrainingPrograms")]
    [ProducesResponseType(typeof(IReadOnlyList<ProgramSummaryResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ProgramSummaryResponse>>> List(
        [FromQuery] Guid athleteId,
        CancellationToken cancellationToken)
    {
        var programs = await trainingProgramService.ListProgramsAsync(athleteId, cancellationToken);
        return Ok(programs.Select(TrainingProgramContractMapper.ToSummary).ToList());
    }

    [HttpPost("import", Name = "ImportTrainingProgram")]
    [ProducesResponseType(typeof(TrainingProgramResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<TrainingProgramResponse>> Import(
        ImportProgramRequest request,
        CancellationToken cancellationToken)
    {
        var program = await trainingProgramService.ImportProgramAsync(
            TrainingProgramContractMapper.ToCommand(request),
            cancellationToken);

        return CreatedAtAction(nameof(GetOverview), new { id = program.Id }, TrainingProgramContractMapper.ToResponse(program));
    }

    [HttpPost("{id:guid}/end", Name = "EndTrainingProgram")]
    [ProducesResponseType(typeof(TrainingProgramResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TrainingProgramResponse>> End(
        Guid id,
        EndProgramRequest? request,
        CancellationToken cancellationToken)
    {
        try
        {
            var endDate = request?.EndDate ?? DateOnly.FromDateTime(DateTime.UtcNow.Date);
            var program = await trainingProgramService.EndProgramAsync(id, endDate, cancellationToken);
            return Ok(TrainingProgramContractMapper.ToResponse(program));
        }
        catch (InvalidOperationException exception)
        {
            return NotFoundProblem(exception.Message);
        }
    }

    [HttpPost("{id:guid}/mesocycles", Name = "AddMesocycle")]
    [ProducesResponseType(typeof(MesocycleResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MesocycleResponse>> AddMesocycle(
        Guid id,
        AddMesocycleRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var mesocycle = await trainingProgramService.AddMesocycleAsync(
                id,
                TrainingProgramContractMapper.ToCommand(request),
                cancellationToken);

            return Created($"/api/programs/{id}/overview", TrainingProgramContractMapper.ToResponse(mesocycle));
        }
        catch (InvalidOperationException exception)
        {
            return NotFoundProblem(exception.Message);
        }
    }

    [HttpPost("{id:guid}/weekly-plans", Name = "AddWeeklyPlan")]
    [ProducesResponseType(typeof(WeeklyPlanResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WeeklyPlanResponse>> AddWeeklyPlan(
        Guid id,
        AddWeeklyPlanRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var weeklyPlan = await trainingProgramService.AddWeeklyPlanAsync(
                id,
                TrainingProgramContractMapper.ToCommand(request),
                cancellationToken);

            return Created($"/api/programs/{id}/overview", TrainingProgramContractMapper.ToResponse(weeklyPlan));
        }
        catch (InvalidOperationException exception)
        {
            return NotFoundProblem(exception.Message);
        }
    }

    [HttpPost("{id:guid}/workouts", Name = "AddWorkoutTemplate")]
    [ProducesResponseType(typeof(WorkoutTemplateResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WorkoutTemplateResponse>> AddWorkoutTemplate(
        Guid id,
        AddWorkoutTemplateRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var workoutTemplate = await trainingProgramService.AddWorkoutTemplateAsync(
                id,
                TrainingProgramContractMapper.ToCommand(request),
                cancellationToken);

            return Created($"/api/programs/{id}/overview", TrainingProgramContractMapper.ToResponse(workoutTemplate));
        }
        catch (InvalidOperationException exception)
        {
            return NotFoundProblem(exception.Message);
        }
    }

    [HttpGet("{id:guid}/overview", Name = "GetProgramOverview")]
    [ProducesResponseType(typeof(TrainingProgramOverviewResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TrainingProgramOverviewResponse>> GetOverview(
        Guid id,
        CancellationToken cancellationToken)
    {
        var overview = await trainingProgramService.GetProgramOverviewAsync(id, cancellationToken);

        if (overview is null)
        {
            return NotFoundProblem($"Training program '{id}' was not found.");
        }

        return Ok(TrainingProgramContractMapper.ToResponse(overview));
    }

    private ObjectResult NotFoundProblem(string detail)
    {
        return Problem(
            title: "Training program resource was not found.",
            detail: detail,
            statusCode: StatusCodes.Status404NotFound,
            type: "https://httpstatuses.com/404");
    }
}
