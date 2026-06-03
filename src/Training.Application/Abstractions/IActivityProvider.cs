using Training.Application.Providers;

namespace Training.Application.Abstractions;

public interface IActivityProvider
{
    Task<IReadOnlyList<ProviderActivity>> GetActivitiesAsync(
        Guid athleteId,
        DateOnly from,
        DateOnly to,
        CancellationToken cancellationToken = default);
}
