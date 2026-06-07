using FluentAssertions;
using Training.Domain.ValueObjects;

namespace Training.Domain.Tests;

public sealed class RepRangeTests
{
    [Fact]
    public void Constructor_SetsValidRange()
    {
        var range = new RepRange(6, 10);

        range.Min.Should().Be(6);
        range.Max.Should().Be(10);
    }

    [Fact]
    public void Constructor_AllowsEqualMinAndMax()
    {
        var range = new RepRange(8, 8);

        range.Min.Should().Be(8);
        range.Max.Should().Be(8);
    }

    [Fact]
    public void Constructor_ThrowsWhenMinIsNegative()
    {
        var act = () => new RepRange(-1, 5);

        act.Should().Throw<ArgumentOutOfRangeException>()
            .WithParameterName("min");
    }

    [Fact]
    public void Constructor_ThrowsWhenMaxIsLessThanMin()
    {
        var act = () => new RepRange(8, 6);

        act.Should().Throw<ArgumentOutOfRangeException>()
            .WithParameterName("max");
    }
}
