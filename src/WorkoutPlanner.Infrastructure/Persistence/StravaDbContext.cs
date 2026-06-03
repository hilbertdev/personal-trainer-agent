using Microsoft.EntityFrameworkCore;
using WorkoutPlanner.Domain.Entities;

namespace WorkoutPlanner.Infrastructure.Persistence;

public sealed class StravaDbContext(DbContextOptions<StravaDbContext> options) : DbContext(options)
{
    public DbSet<StravaConnection> StravaConnections => Set<StravaConnection>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new StravaConnectionConfiguration());
    }
}
