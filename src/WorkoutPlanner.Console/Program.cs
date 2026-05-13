using Microsoft.Extensions.DependencyInjection;
using WorkoutPlanner.Application.Analysis;
using WorkoutPlanner.Application.Scheduling;
using WorkoutPlanner.Application.Services;
using WorkoutPlanner.ConsoleApp;
using WorkoutPlanner.Domain.Interfaces;
using WorkoutPlanner.Infrastructure.Persistence;

var services = new ServiceCollection();

services.AddSingleton<FatigueScoreCalculator>();
services.AddSingleton<RecoveryHeuristicAnalyzer>();
services.AddSingleton<IFatigueAnalyzer, FatigueAnalyzer>();
services.AddSingleton<IPhaseScheduler, HypertrophyPhaseScheduler>();
services.AddSingleton<IWorkoutRepository, InMemoryWorkoutRepository>();
services.AddSingleton<IWorkoutPlanningService, WorkoutPlanningService>();

using var serviceProvider = services.BuildServiceProvider();

var planningService = serviceProvider.GetRequiredService<IWorkoutPlanningService>();
var sampleWorkouts = SampleWorkoutDataFactory.Create();
var result = await planningService.BuildPlanAsync(sampleWorkouts);

ConsoleReportWriter.Print(result);
