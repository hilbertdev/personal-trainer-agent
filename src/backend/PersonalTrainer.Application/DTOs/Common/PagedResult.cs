namespace PersonalTrainer.Application.DTOs.Common;

public record PagedRequest(int Page = 1, int PageSize = 25);

public record PagedResult<T>(
    IReadOnlyList<T> Items,
    int Total,
    int Page,
    int PageSize)
{
    public int TotalPages => (int)Math.Ceiling((double)Total / PageSize);
    public bool HasNextPage => Page < TotalPages;
}
