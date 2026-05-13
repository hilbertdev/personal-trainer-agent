using Microsoft.AspNetCore.Mvc;
using WorkoutPlanner.Api.Contracts;

namespace WorkoutPlanner.Api.Controllers;

[ApiController]
[Route("api/agent")]
public sealed class AgentDiscoveryController : ControllerBase
{
    [HttpGet(Name = "GetAgentApiDiscovery")]
    [ProducesResponseType(typeof(AgentDiscoveryResponse), StatusCodes.Status200OK)]
    public ActionResult<AgentDiscoveryResponse> Get()
    {
        var response = new AgentDiscoveryResponse(
            "Workout Planner Agent API",
            "1.0",
            "Read-only JSON endpoints for agents to inspect the current workout week, fatigue analysis, and hypertrophy projection.",
            ["In-memory current workout week seeded from the application's sample workout data."],
            [
                new AgentEndpointResponse(
                    "getAgentApiDiscovery",
                    "GET",
                    "/api/agent",
                    "Discover agent-oriented workout query endpoints.",
                    "Returns operation ids, route paths, and descriptions so agents can choose the right workout query without guessing."),
                new AgentEndpointResponse(
                    "getCurrentWorkoutWeek",
                    "GET",
                    "/api/agent/workouts/current-week",
                    "Get the current workout week.",
                    "Returns ordered workout days, exercises, set volume, trained muscle groups, and a summary of the stored workout week."),
                new AgentEndpointResponse(
                    "getWorkoutAnalysis",
                    "GET",
                    "/api/agent/workouts/analysis",
                    "Analyze current workout fatigue and recovery needs.",
                    "Returns fatigue score, fatigue estimate, warnings, recommended rest days, and the same summary used for context."),
                new AgentEndpointResponse(
                    "getWorkoutProjection",
                    "GET",
                    "/api/agent/workouts/projection",
                    "Project the hypertrophy phase from the current week.",
                    "Returns the current analysis plus the projected four-week plan with inserted rest days.")
            ]);

        return Ok(response);
    }
}
