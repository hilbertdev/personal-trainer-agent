namespace PersonalTrainer.Application.Services.Interfaces;

public interface ICurrentOrganization
{
    Guid Id { get; }
    bool IsAuthenticated { get; }
}

public interface ICurrentUser
{
    Guid Id { get; }
    string Email { get; }
    bool IsAuthenticated { get; }
}
