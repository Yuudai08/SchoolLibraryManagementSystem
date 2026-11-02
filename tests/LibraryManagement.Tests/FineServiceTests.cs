using FluentAssertions;
using LibraryManagement.Application.Configuration;
using LibraryManagement.Application.Exceptions;
using LibraryManagement.Application.Interfaces.QueryServices;
using LibraryManagement.Application.Interfaces.Repositories;
using LibraryManagement.Application.Services;
using LibraryManagement.Domain.Entities;
using LibraryManagement.Domain.Enums;
using LibraryManagement.Tests.Common;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace LibraryManagement.Tests;

public class FineServiceTests
{
    private readonly Mock<IFineRepository> _fineRepoMock = new();
    private readonly Mock<ILoanRepository> _loanRepoMock = new();
    private readonly Mock<IFineQueryService> _fineQueryMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();
    private readonly Mock<ILogger<FineService>> _loggerMock = new();
    private readonly IOptions<LibrarySettings> _settings = Options.Create(new LibrarySettings
    {
        MaxActiveLoans = 5,
        FinePerDay = 5.0m,
        DefaultLoanDays = 14
    });

    [Fact]
    public async Task PayFineAsync_WhenFineDoesNotExist_ThrowsNotFoundException()
    {
        _fineRepoMock.Setup(r => r.GetByIdAsync(99, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Fine?)null);

        var sut = new FineService(
            _fineRepoMock.Object,
            _loanRepoMock.Object,
            _fineQueryMock.Object,
            _unitOfWorkMock.Object,
            _settings,
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
            _loanRepoMock.Object,
            _fineQueryMock.Object,
            _unitOfWorkMock.Object,
            _settings,
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
            _loanRepoMock.Object,
            _fineQueryMock.Object,
            _unitOfWorkMock.Object,
            _settings,
            _loggerMock.Object,
            fakeTime);

        await sut.PayFineAsync(1);

        fine.IsPaid.Should().BeTrue();
        fine.PaidDate.Should().Be(fixedTime.UtcDateTime);

        _fineRepoMock.Verify(r => r.UpdateAsync(fine, It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SyncOverdueFinesAsync_CreatesFinesForActiveOverdueLoansWithoutFine()
    {
        var fixedTime = new DateTimeOffset(2026, 10, 20, 10, 0, 0, TimeSpan.Zero);
        var fakeTime = new FakeTimeProvider(fixedTime);

        var overdueLoan = new Loan
        {
            LoanId = 12,
            DueDate = fixedTime.UtcDateTime.AddDays(-4), // 4 days overdue
            Status = LoanStatus.Borrowed,
            ReturnedDate = null,
            Fine = null
        };

        _loanRepoMock.Setup(r => r.GetActiveOverdueLoansAsync(fixedTime.UtcDateTime, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Loan> { overdueLoan });

        var sut = new FineService(
            _fineRepoMock.Object,
            _loanRepoMock.Object,
            _fineQueryMock.Object,
            _unitOfWorkMock.Object,
            _settings,
            _loggerMock.Object,
            fakeTime);

        await sut.SyncOverdueFinesAsync();

        overdueLoan.Status.Should().Be(LoanStatus.Overdue);
        _fineRepoMock.Verify(r => r.CreateAsync(It.Is<Fine>(f => f.LoanId == 12 && f.Amount == 20.0m && !f.IsPaid), It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
