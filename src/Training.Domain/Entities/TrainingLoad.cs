namespace Training.Domain.Entities;

public sealed record TrainingLoad(
    double AcuteLoad,
    double ChronicLoad,
    double Monotony,
    double Strain);
