namespace Training.Domain.ValueObjects;

public sealed record RepRange
{
    public RepRange(int min, int max)
    {
        if (min < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(min), "Minimum reps cannot be negative.");
        }

        if (max < min)
        {
            throw new ArgumentOutOfRangeException(nameof(max), "Maximum reps must be greater than or equal to minimum reps.");
        }

        Min = min;
        Max = max;
    }

    public int Min { get; }

    public int Max { get; }
}
