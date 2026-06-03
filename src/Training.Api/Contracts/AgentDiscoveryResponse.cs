namespace Training.Api.Contracts;

public sealed record AgentDiscoveryResponse(
    string Name,
    string Version,
    string Purpose,
    IReadOnlyList<string> DataSources,
    IReadOnlyList<AgentEndpointResponse> Endpoints);
