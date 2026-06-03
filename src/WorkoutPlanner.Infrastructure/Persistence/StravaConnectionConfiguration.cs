using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WorkoutPlanner.Domain.Entities;

namespace WorkoutPlanner.Infrastructure.Persistence;

public sealed class StravaConnectionConfiguration : IEntityTypeConfiguration<StravaConnection>
{
    public void Configure(EntityTypeBuilder<StravaConnection> builder)
    {
        builder.ToTable("strava_connections");

        builder.HasKey(connection => connection.Id);

        builder.Property(connection => connection.Id)
            .ValueGeneratedNever();

        builder.Property(connection => connection.AthleteId)
            .IsRequired();

        builder.HasIndex(connection => connection.AthleteId)
            .IsUnique();

        builder.Property(connection => connection.AccessToken)
            .IsRequired();

        builder.Property(connection => connection.RefreshToken)
            .IsRequired();

        builder.Property(connection => connection.ExpiresAtUtc)
            .IsRequired();

        builder.Property(connection => connection.CreatedAtUtc)
            .IsRequired();

        builder.Property(connection => connection.UpdatedAtUtc)
            .IsRequired();
    }
}
