using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using WorkoutPlanner.Infrastructure.Persistence;

#nullable disable

namespace WorkoutPlanner.Infrastructure.Migrations;

[DbContext(typeof(StravaDbContext))]
partial class StravaDbContextModelSnapshot : ModelSnapshot
{
    protected override void BuildModel(ModelBuilder modelBuilder)
    {
#pragma warning disable 612, 618
        modelBuilder.HasAnnotation("ProductVersion", "10.0.8");

        modelBuilder.Entity("WorkoutPlanner.Domain.Entities.StravaConnection", b =>
            {
                b.Property<Guid>("Id")
                    .ValueGeneratedNever()
                    .HasColumnType("TEXT");

                b.Property<string>("AccessToken")
                    .IsRequired()
                    .HasColumnType("TEXT");

                b.Property<long>("AthleteId")
                    .HasColumnType("INTEGER");

                b.Property<DateTime>("CreatedAtUtc")
                    .HasColumnType("TEXT");

                b.Property<DateTime>("ExpiresAtUtc")
                    .HasColumnType("TEXT");

                b.Property<string>("RefreshToken")
                    .IsRequired()
                    .HasColumnType("TEXT");

                b.Property<DateTime>("UpdatedAtUtc")
                    .HasColumnType("TEXT");

                b.HasKey("Id");

                b.HasIndex("AthleteId")
                    .IsUnique();

                b.ToTable("strava_connections", (string)null);
            });
#pragma warning restore 612, 618
    }
}
