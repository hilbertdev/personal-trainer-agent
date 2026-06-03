using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using WorkoutPlanner.Infrastructure.Persistence;

#nullable disable

namespace WorkoutPlanner.Infrastructure.Migrations;

[DbContext(typeof(StravaDbContext))]
[Migration("20260603093600_AddStravaConnections")]
public partial class AddStravaConnections : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "strava_connections",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "TEXT", nullable: false),
                AthleteId = table.Column<long>(type: "INTEGER", nullable: false),
                AccessToken = table.Column<string>(type: "TEXT", nullable: false),
                RefreshToken = table.Column<string>(type: "TEXT", nullable: false),
                ExpiresAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                UpdatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_strava_connections", x => x.Id);
            });

        migrationBuilder.CreateIndex(
            name: "IX_strava_connections_AthleteId",
            table: "strava_connections",
            column: "AthleteId",
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "strava_connections");
    }
}
