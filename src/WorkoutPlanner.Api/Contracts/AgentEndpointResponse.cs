namespace WorkoutPlanner.Api.Contracts;

public sealed record AgentEndpointResponse(
    string OperationId,
    string Method,
    string Path,
    string Summary,
    string Description);
