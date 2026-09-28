using System.Diagnostics;
using FluentValidation;
using LibraryManagement.Application.Exceptions;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LibraryManagement.API.Middleware;

public class GlobalExceptionHandler(
    IProblemDetailsService problemDetailsService,
    ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var (statusCode, title, logLevel) = exception switch
        {
            ValidationException => (StatusCodes.Status400BadRequest, "Validation Error", LogLevel.Warning),
            NotFoundException => (StatusCodes.Status404NotFound, "Resource Not Found", LogLevel.Warning),
            ConflictException => (StatusCodes.Status409Conflict, "Conflict", LogLevel.Warning),
            DbUpdateConcurrencyException => (StatusCodes.Status409Conflict, "Concurrency Conflict", LogLevel.Warning),
            BadRequestException => (StatusCodes.Status400BadRequest, "Bad Request", LogLevel.Warning),
            UnauthorizedException => (StatusCodes.Status401Unauthorized, "Unauthorized", LogLevel.Warning),
            _ => (StatusCodes.Status500InternalServerError, "Internal Server Error", LogLevel.Error)
        };

        if (logLevel == LogLevel.Error)
        {
            logger.LogError(exception, "Unhandled exception occurred: {Message}", exception.Message);
        }
        else
        {
            logger.LogWarning("Request failed with {StatusCode} ({Title}): {Message}", statusCode, title, exception.Message);
        }

        ProblemDetails problemDetails;

        if (exception is ValidationException validationEx)
        {
            var errors = validationEx.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(e => e.ErrorMessage).ToArray()
                );

            problemDetails = new HttpValidationProblemDetails(errors)
            {
                Status = statusCode,
                Title = title,
                Detail = "One or more validation errors occurred.",
                Instance = httpContext.Request.Path
            };
        }
        else
        {
            var detail = statusCode == StatusCodes.Status500InternalServerError
                ? "An unexpected error occurred. Please try again later."
                : exception.Message;

            problemDetails = new ProblemDetails
            {
                Status = statusCode,
                Title = title,
                Detail = detail,
                Instance = httpContext.Request.Path
            };
        }

        problemDetails.Extensions["traceId"] = Activity.Current?.Id ?? httpContext.TraceIdentifier;
        problemDetails.Extensions["success"] = false;
        problemDetails.Extensions["message"] = problemDetails.Detail;

        httpContext.Response.StatusCode = statusCode;

        return await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = problemDetails,
            Exception = exception
        });
    }
}
