using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using PersonalTrainer.Application.Exceptions;

namespace PersonalTrainer.Api.ExceptionHandling;

public class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var (status, title) = exception switch
        {
            NotFoundException => (StatusCodes.Status404NotFound, "Not found"),
            UnauthorizedException => (StatusCodes.Status401Unauthorized, "Unauthorized"),
            ValidationException => (StatusCodes.Status422UnprocessableEntity, "Validation failed"),
            _ => (StatusCodes.Status500InternalServerError, "An unexpected error occurred")
        };

        if (status >= StatusCodes.Status500InternalServerError)
        {
            logger.LogError(exception, "Unhandled exception");
        }
        else
        {
            logger.LogWarning(exception, "Handled exception: {Message}", exception.Message);
        }

        var problem = new ProblemDetails
        {
            Type = "https://tools.ietf.org/html/rfc7807",
            Title = title,
            Status = status,
            Detail = status >= StatusCodes.Status500InternalServerError
                ? "An unexpected error occurred."
                : exception.Message,
            Instance = httpContext.Request.Path
        };

        problem.Extensions["traceId"] = httpContext.TraceIdentifier;
        httpContext.Response.StatusCode = status;
        await httpContext.Response.WriteAsJsonAsync(problem, cancellationToken);
        return true;
    }
}
