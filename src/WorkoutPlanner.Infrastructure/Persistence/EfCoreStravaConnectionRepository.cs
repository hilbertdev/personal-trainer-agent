using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using WorkoutPlanner.Domain.Entities;
using WorkoutPlanner.Domain.Interfaces;

namespace WorkoutPlanner.Infrastructure.Persistence;

public sealed class EfCoreStravaConnectionRepository : IStravaConnectionRepository
{
    private readonly StravaDbContext _dbContext;
    private readonly IDataProtector _tokenProtector;

    public EfCoreStravaConnectionRepository(
        StravaDbContext dbContext,
        IDataProtectionProvider dataProtectionProvider)
    {
        _dbContext = dbContext;
        _tokenProtector = dataProtectionProvider.CreateProtector("WorkoutPlanner.StravaTokens.v1");
    }

    public async Task<StravaConnection?> GetByAthleteIdAsync(
        long athleteId,
        CancellationToken cancellationToken = default)
    {
        var storedConnection = await _dbContext.StravaConnections
            .AsNoTracking()
            .SingleOrDefaultAsync(connection => connection.AthleteId == athleteId, cancellationToken);

        return storedConnection is null ? null : ToApplicationConnection(storedConnection);
    }

    public async Task<StravaConnection?> GetMostRecentAsync(CancellationToken cancellationToken = default)
    {
        var storedConnection = await _dbContext.StravaConnections
            .AsNoTracking()
            .OrderByDescending(connection => connection.UpdatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);

        return storedConnection is null ? null : ToApplicationConnection(storedConnection);
    }

    public async Task SaveAsync(StravaConnection connection, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var existingConnection = await _dbContext.StravaConnections
            .SingleOrDefaultAsync(stored => stored.AthleteId == connection.AthleteId, cancellationToken);

        if (existingConnection is null)
        {
            var storedConnection = ToStoredConnection(connection);
            storedConnection.Id = storedConnection.Id == Guid.Empty ? Guid.NewGuid() : storedConnection.Id;
            storedConnection.CreatedAtUtc = storedConnection.CreatedAtUtc == default ? now : EnsureUtc(storedConnection.CreatedAtUtc);
            storedConnection.UpdatedAtUtc = now;

            _dbContext.StravaConnections.Add(storedConnection);
        }
        else
        {
            existingConnection.AccessToken = _tokenProtector.Protect(connection.AccessToken);
            existingConnection.RefreshToken = _tokenProtector.Protect(connection.RefreshToken);
            existingConnection.ExpiresAtUtc = EnsureUtc(connection.ExpiresAtUtc);
            existingConnection.UpdatedAtUtc = now;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private StravaConnection ToStoredConnection(StravaConnection connection)
    {
        return new StravaConnection
        {
            Id = connection.Id,
            AthleteId = connection.AthleteId,
            AccessToken = _tokenProtector.Protect(connection.AccessToken),
            RefreshToken = _tokenProtector.Protect(connection.RefreshToken),
            ExpiresAtUtc = EnsureUtc(connection.ExpiresAtUtc),
            CreatedAtUtc = EnsureUtc(connection.CreatedAtUtc),
            UpdatedAtUtc = EnsureUtc(connection.UpdatedAtUtc)
        };
    }

    private StravaConnection ToApplicationConnection(StravaConnection storedConnection)
    {
        return new StravaConnection
        {
            Id = storedConnection.Id,
            AthleteId = storedConnection.AthleteId,
            AccessToken = _tokenProtector.Unprotect(storedConnection.AccessToken),
            RefreshToken = _tokenProtector.Unprotect(storedConnection.RefreshToken),
            ExpiresAtUtc = EnsureUtc(storedConnection.ExpiresAtUtc),
            CreatedAtUtc = EnsureUtc(storedConnection.CreatedAtUtc),
            UpdatedAtUtc = EnsureUtc(storedConnection.UpdatedAtUtc)
        };
    }

    private static DateTime EnsureUtc(DateTime value)
    {
        if (value == default)
        {
            return value;
        }

        return value.Kind == DateTimeKind.Utc
            ? value
            : DateTime.SpecifyKind(value, DateTimeKind.Utc);
    }
}
