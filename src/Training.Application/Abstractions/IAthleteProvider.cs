using Training.Application.Providers;

namespace Training.Application.Abstractions;

public interface IAthleteProvider
{
    Task<ProviderAthlete?> GetAthleteAsync(Guid athleteId, CancellationToken cancellationToken = default);
}
