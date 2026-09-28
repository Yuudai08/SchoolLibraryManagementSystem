using FluentAssertions;
using FluentValidation;
using FluentValidation.Results;
using LibraryManagement.API.Middleware;
using LibraryManagement.Application.Exceptions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace LibraryManagement.Tests;

public class GlobalExceptionHandlerTests
{
    private readonly Mock<IProblemDetailsService> _problemDetailsMock = new();
    private readonly Mock<ILogger<GlobalExceptionHandler>> _loggerMock = new();
    private readonly GlobalExceptionHandler _sut;

    public GlobalExceptionHandlerTests()
    {
        _problemDetailsMock
            .Setup(p => p.TryWriteAsync(It.IsAny<ProblemDetailsContext>()))
            .ReturnsAsync(true);

        _sut = new GlobalExceptionHandler(_problemDetailsMock.Object, _loggerMock.Object);
    }

    [Fact]
    public async Task TryHandleAsync_WhenNotFoundException_Returns404ProblemDetails()
    {
        var httpContext = new DefaultHttpContext();
        var ex = new NotFoundException("Book", 42);

        ProblemDetails? capturedProblem = null;
        _problemDetailsMock
            .Setup(p => p.TryWriteAsync(It.IsAny<ProblemDetailsContext>()))
            .Callback<ProblemDetailsContext>(ctx => capturedProblem = ctx.ProblemDetails)
            .ReturnsAsync(true);

        var handled = await _sut.TryHandleAsync(httpContext, ex, CancellationToken.None);

        handled.Should().BeTrue();
        httpContext.Response.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        capturedProblem.Should().NotBeNull();
        capturedProblem!.Status.Should().Be(StatusCodes.Status404NotFound);
        capturedProblem.Title.Should().Be("Resource Not Found");
        capturedProblem.Detail.Should().Contain("Book with ID '42' was not found.");
    }

    [Fact]
    public async Task TryHandleAsync_WhenConflictException_Returns409ProblemDetails()
    {
        var httpContext = new DefaultHttpContext();
        var ex = new ConflictException("ISBN already exists.");

        ProblemDetails? capturedProblem = null;
        _problemDetailsMock
            .Setup(p => p.TryWriteAsync(It.IsAny<ProblemDetailsContext>()))
            .Callback<ProblemDetailsContext>(ctx => capturedProblem = ctx.ProblemDetails)
            .ReturnsAsync(true);

        var handled = await _sut.TryHandleAsync(httpContext, ex, CancellationToken.None);

        handled.Should().BeTrue();
        httpContext.Response.StatusCode.Should().Be(StatusCodes.Status409Conflict);
        capturedProblem.Should().NotBeNull();
        capturedProblem!.Status.Should().Be(StatusCodes.Status409Conflict);
        capturedProblem.Title.Should().Be("Conflict");
        capturedProblem.Detail.Should().Be("ISBN already exists.");
    }

    [Fact]
    public async Task TryHandleAsync_WhenValidationException_Returns400HttpValidationProblemDetails()
    {
        var httpContext = new DefaultHttpContext();
        var failures = new List<ValidationFailure>
        {
            new("Title", "Title is required."),
            new("TotalCopies", "Total copies must be 0 or greater.")
        };
        var ex = new ValidationException(failures);

        ProblemDetails? capturedProblem = null;
        _problemDetailsMock
            .Setup(p => p.TryWriteAsync(It.IsAny<ProblemDetailsContext>()))
            .Callback<ProblemDetailsContext>(ctx => capturedProblem = ctx.ProblemDetails)
            .ReturnsAsync(true);

        var handled = await _sut.TryHandleAsync(httpContext, ex, CancellationToken.None);

        handled.Should().BeTrue();
        httpContext.Response.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        capturedProblem.Should().BeOfType<HttpValidationProblemDetails>();
        var validationProblem = (HttpValidationProblemDetails)capturedProblem!;
        validationProblem.Errors.Should().ContainKey("Title");
        validationProblem.Errors["Title"].Should().Contain("Title is required.");
        validationProblem.Errors.Should().ContainKey("TotalCopies");
    }

    [Fact]
    public async Task TryHandleAsync_WhenUnexpectedException_Returns500WithSafeMessage()
    {
        var httpContext = new DefaultHttpContext();
        var ex = new InvalidOperationException("Sensitive database credentials or internal stack trace");

        ProblemDetails? capturedProblem = null;
        _problemDetailsMock
            .Setup(p => p.TryWriteAsync(It.IsAny<ProblemDetailsContext>()))
            .Callback<ProblemDetailsContext>(ctx => capturedProblem = ctx.ProblemDetails)
            .ReturnsAsync(true);

        var handled = await _sut.TryHandleAsync(httpContext, ex, CancellationToken.None);

        handled.Should().BeTrue();
        httpContext.Response.StatusCode.Should().Be(StatusCodes.Status500InternalServerError);
        capturedProblem.Should().NotBeNull();
        capturedProblem!.Status.Should().Be(StatusCodes.Status500InternalServerError);
        capturedProblem.Title.Should().Be("Internal Server Error");
        capturedProblem.Detail.Should().Be("An unexpected error occurred. Please try again later.");
        capturedProblem.Detail.Should().NotContain("Sensitive database credentials");
    }
}
