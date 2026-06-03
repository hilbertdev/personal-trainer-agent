using Training.Domain.Entities;

namespace Training.Application.Abstractions;

public interface ITrainingLoadCalculator
{
    TrainingLoad Calculate(IReadOnlyList<Workout> workouts);
}
