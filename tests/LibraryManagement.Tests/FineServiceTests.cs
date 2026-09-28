using FluentAssertions;
using LibraryManagement.Application.Exceptions;
using LibraryManagement.Application.Interfaces.QueryServices;
using LibraryManagement.Application.Interfaces.Repositories;
using LibraryManagement.Application.Services;
using LibraryManagement.Domain.Entities;
using LibraryManagement.Tests.Common;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace LibraryManagement.Tests;

public class FineServiceTests
{
    private readonly Mock<IFineRepository> _fineRepoMock = new();
    private readonly Mock<IFineQueryService> _fineQueryMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();
    private readonly Mock<ILogger<FineService>> _loggerMock = new();

    [Fact]
    public async Task PayFineAsync_WhenFineDoesNotExist_ThrowsNotFoundException()
    {
        _fineRepoMock.Setup(r => r.GetByIdAsync(99, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Fine?)null);

        var sut = new FineService(
            _fineRepoMock.Object,
            _fineQueryMock.Object,
            _unitOfWorkMock.Object,
            _loggerMock.Object);

        var act = () => sut.PayFineAsync(99);

        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage("*Fine*99*");
    }

    [Fact]
    public async Task PayFineAsync_WhenFineAlreadyPaid_ThrowsConflictException()
    {
        var fine = new Fine
        {
            FineId = 1,
            LoanId = 10,
            Amount = 25.0m,
            IsPaid = true,
            PaidDate = DateTime.UtcNow.AddDays(-1)
        };

        _fineRepoMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(fine);

        var sut = new FineService(
            _fineRepoMock.Object,
            _fineQueryMock.Object,
            _unitOfWorkMock.Object,
            _loggerMock.Object);

        var act = () => sut.PayFineAsync(1);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*already been paid*");
    }

    [Fact]
    public async Task PayFineAsync_WhenFineUnpaid_MarksAsPaidWithExactTimestampFromTimeProvider()
    {
        var fixedTime = new DateTimeOffset(2026, 10, 5, 16, 45, 0, TimeSpan.Zero);
        var fakeTime = new FakeTimeProvider(fixedTime);

        var fine = new Fine
        {
            FineId = 1,
            LoanId = 10,
            Amount = 50.0m,
            IsPaid = false,
            PaidDate = null
        };

        _fineRepoMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(fine);

        var sut = new FineService(
            _fineRepoMock.Object,
            _fineQueryMock.Object,
            _unitOfWorkMock.Object,
            _loggerMock.Object,
            fakeTime);

        await sut.PayFineAsync(1);

        fine.IsPaid.Should().BeTrue();
        fine.PaidDate.Should().Be(fixedTime.UtcDateTime);

        _fineRepoMock.Verify(r => r.UpdateAsync(fine, It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
