namespace Training.Domain.Entities;

public sealed record Mesocycle(
    Guid Id,
    string Name,
    DateOnly StartDate,
    int DurationWeeks,
    IReadOnlyList<WeeklyPlan> WeeklyPlans)
{
    public DateOnly EndDate => StartDate.AddDays(DurationWeeks * 7 - 1);
}
