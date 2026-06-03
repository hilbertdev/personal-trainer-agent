namespace Training.Api.Contracts;

public sealed record AgentEndpointResponse(
    string OperationId,
    string Method,
    string Path,
    string Summary,
    string Description);
