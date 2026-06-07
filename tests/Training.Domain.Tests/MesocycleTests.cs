using FluentAssertions;
using Training.Domain.Entities;

namespace Training.Domain.Tests;

public sealed class MesocycleTests
{
    [Theory]
    [InlineData(4, 27)]
    [InlineData(1, 6)]
    [InlineData(6, 41)]
    public void EndDate_CalculatesFromStartDateAndDuration(int durationWeeks, int expectedEndDayOffset)
    {
        var startDate = new DateOnly(2026, 3, 1);
        var mesocycle = new Mesocycle(Guid.NewGuid(), "Block 1", startDate, durationWeeks, []);

        mesocycle.EndDate.Should().Be(startDate.AddDays(expectedEndDayOffset));
    }
}
