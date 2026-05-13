using System.Globalization;
using WorkoutPlanner.Domain.Entities;
using WorkoutPlanner.Domain.Enums;

namespace WorkoutPlanner.ConsoleApp;

public static class ConsoleReportWriter
{
    public static void Print(WorkoutPlanningResult result)
    {
        PrintHeader("WEEKLY ANALYSIS");

        var workouts = result.Plan.Workouts;
        var trainingDays = workouts.Count(workout => !workout.IsRestDay);
        var highIntensityDays = workouts.Count(workout => !workout.IsRestDay && workout.Intensity is IntensityLevel.High);

        System.Console.WriteLine($"Training Days: {trainingDays}");
        System.Console.WriteLine($"High Intensity Days: {highIntensityDays}");
        System.Console.WriteLine($"Total Fatigue Score: {result.Analysis.TotalFatigueScore}");
        System.Console.WriteLine($"Estimated Fatigue: {result.Analysis.EstimatedFatigue}");
        System.Console.WriteLine();

        PrintList("Warnings:", result.Analysis.Warnings);
        System.Console.WriteLine();
        PrintRestDays(result.Analysis.RecommendedRestDays);

        PrintHeader("PROJECTED 4-WEEK PHASE");

        foreach (var projectedWeek in result.Plan.ProjectedWeeks)
        {
            System.Console.WriteLine($"WEEK {projectedWeek.WeekNumber}");

            foreach (var workout in projectedWeek.Workouts)
            {
                System.Console.WriteLine($"{FormatDay(workout.Date)} - {FormatWorkoutType(workout.WorkoutType)}");
            }

            System.Console.WriteLine();
        }
    }

    private static void PrintHeader(string title)
    {
        System.Console.WriteLine("================================================");
        System.Console.WriteLine(title);
        System.Console.WriteLine("================================================");
        System.Console.WriteLine();
    }

    private static void PrintList(string title, IReadOnlyList<string> items)
    {
        System.Console.WriteLine(title);

        if (items.Count is 0)
        {
            System.Console.WriteLine("- None");
            return;
        }

        foreach (var item in items)
        {
            System.Console.WriteLine($"- {item}");
        }
    }

    private static void PrintRestDays(IReadOnlyList<DateOnly> restDays)
    {
        System.Console.WriteLine("Recommended Rest Days:");

        if (restDays.Count is 0)
        {
            System.Console.WriteLine("- None");
            System.Console.WriteLine();
            return;
        }

        foreach (var restDay in restDays)
        {
            System.Console.WriteLine($"- {FormatDay(restDay)}");
        }

        System.Console.WriteLine();
    }

    private static string FormatDay(DateOnly date)
    {
        return date.ToString("dddd", CultureInfo.InvariantCulture);
    }

    private static string FormatWorkoutType(WorkoutType workoutType)
    {
        return workoutType switch
        {
            WorkoutType.FullBody => "Full Body",
            _ => workoutType.ToString()
        };
    }
}
