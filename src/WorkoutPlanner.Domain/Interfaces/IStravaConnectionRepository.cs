using WorkoutPlanner.Domain.Entities;

namespace WorkoutPlanner.Domain.Interfaces;

public interface IStravaConnectionRepository
{
    Task<StravaConnection?> GetByAthleteIdAsync(long athleteId, CancellationToken cancellationToken = default);

    Task<StravaConnection?> GetMostRecentAsync(CancellationToken cancellationToken = default);

    Task SaveAsync(StravaConnection connection, CancellationToken cancellationToken = default);
}
