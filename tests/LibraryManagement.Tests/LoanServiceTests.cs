using FluentAssertions;
using LibraryManagement.Application.Configuration;
using LibraryManagement.Application.DTOs.Loans;
using LibraryManagement.Application.Exceptions;
using LibraryManagement.Application.Interfaces.QueryServices;
using LibraryManagement.Application.Interfaces.Repositories;
using LibraryManagement.Application.Services;
using LibraryManagement.Domain.Entities;
using LibraryManagement.Domain.Enums;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace LibraryManagement.Tests;

public class LoanServiceTests
{
    private readonly Mock<ILoanRepository> _loanRepoMock = new();
    private readonly Mock<IBookRepository> _bookRepoMock = new();
    private readonly Mock<IStudentRepository> _studentRepoMock = new();
    private readonly Mock<IFineRepository> _fineRepoMock = new();
    private readonly Mock<ILoanQueryService> _loanQueryMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();
    private readonly Mock<ILogger<LoanService>> _loggerMock = new();
    private readonly IOptions<LibrarySettings> _settings = Options.Create(new LibrarySettings
    {
        MaxActiveLoans = 5,
        FinePerDay = 5.0m,
        DefaultLoanDays = 14
    });

    private readonly LoanService _sut;

    public LoanServiceTests()
    {
        _sut = new LoanService(
            _loanRepoMock.Object,
            _bookRepoMock.Object,
            _studentRepoMock.Object,
            _fineRepoMock.Object,
            _loanQueryMock.Object,
            _unitOfWorkMock.Object,
            _settings,
            _loggerMock.Object);
    }

    [Fact]
    public async Task BorrowAsync_WhenStudentInactive_ThrowsBadRequestException()
    {
        _studentRepoMock.Setup(s => s.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Student { StudentId = 1, IsActive = false, FirstName = "Jane", LastName = "Doe" });

        var request = new CreateLoanRequest { StudentId = 1, BookId = 1, DueDate = DateTime.UtcNow.AddDays(14) };

        var act = () => _sut.BorrowAsync(request);

        await act.Should().ThrowAsync<BadRequestException>()
            .WithMessage("*inactive*");
    }

    [Fact]
    public async Task BorrowAsync_WhenMaxActiveLoansExceeded_ThrowsBadRequestException()
    {
        _studentRepoMock.Setup(s => s.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Student { StudentId = 1, IsActive = true, FirstName = "Jane", LastName = "Doe" });

        _loanRepoMock.Setup(l => l.GetActiveLoansCountAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(5); // limit is 5

        var request = new CreateLoanRequest { StudentId = 1, BookId = 1, DueDate = DateTime.UtcNow.AddDays(14) };

        var act = () => _sut.BorrowAsync(request);

        await act.Should().ThrowAsync<BadRequestException>()
            .WithMessage("*maximum number of active loans*");
    }

    [Fact]
    public async Task BorrowAsync_WhenDuplicateActiveLoan_ThrowsConflictException()
    {
        _studentRepoMock.Setup(s => s.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Student { StudentId = 1, IsActive = true, FirstName = "Jane", LastName = "Doe" });

        _loanRepoMock.Setup(l => l.GetActiveLoansCountAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(2);

        _loanRepoMock.Setup(l => l.HasActiveLoanForBookAsync(1, 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true); // already has active loan for book 10

        var request = new CreateLoanRequest { StudentId = 1, BookId = 10, DueDate = DateTime.UtcNow.AddDays(14) };

        var act = () => _sut.BorrowAsync(request);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*already has an active loan for this book*");
    }

    [Fact]
    public async Task BorrowAsync_WhenNoCopiesAvailable_ThrowsConflictException()
    {
        _studentRepoMock.Setup(s => s.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Student { StudentId = 1, IsActive = true, FirstName = "Jane", LastName = "Doe" });

        _loanRepoMock.Setup(l => l.GetActiveLoansCountAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(2);

        _loanRepoMock.Setup(l => l.HasActiveLoanForBookAsync(1, 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _bookRepoMock.Setup(b => b.GetByIdAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Book
            {
                BookId = 10,
                Title = "Popular Book",
                TotalCopies = 3,
                AvailableCopies = 0 // OUT OF STOCK
            });

        var request = new CreateLoanRequest { StudentId = 1, BookId = 10, DueDate = DateTime.UtcNow.AddDays(14) };

        var act = () => _sut.BorrowAsync(request);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*No copies available*");
    }

    [Fact]
    public async Task BorrowAsync_WhenValid_DecrementsAvailableCopiesAndCommits()
    {
        var student = new Student { StudentId = 1, IsActive = true, FirstName = "Jane", LastName = "Doe" };
        var book = new Book { BookId = 10, Title = "Popular Book", TotalCopies = 3, AvailableCopies = 2 };

        _studentRepoMock.Setup(s => s.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(student);

        _loanRepoMock.Setup(l => l.GetActiveLoansCountAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _loanRepoMock.Setup(l => l.HasActiveLoanForBookAsync(1, 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _bookRepoMock.Setup(b => b.GetByIdAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(book);

        _loanRepoMock.Setup(l => l.CreateAsync(It.IsAny<Loan>(), It.IsAny<CancellationToken>()))
            .Callback<Loan, CancellationToken>((l, _) => l.LoanId = 77)
            .ReturnsAsync((Loan l, CancellationToken _) => l);

        _loanQueryMock.Setup(q => q.GetActiveLoansByStudentAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<LoanResponse>
            {
                new() { LoanId = 77, BookId = 10, StudentId = 1, Status = "Borrowed" }
            });

        var request = new CreateLoanRequest { StudentId = 1, BookId = 10, DueDate = DateTime.UtcNow.AddDays(14) };

        var result = await _sut.BorrowAsync(request);

        result.Should().NotBeNull();
        book.AvailableCopies.Should().Be(1); // decremented from 2 to 1
        _unitOfWorkMock.Verify(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ReturnAsync_WhenAlreadyReturned_ThrowsConflictException()
    {
        _loanRepoMock.Setup(l => l.GetByIdAsync(5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Loan { LoanId = 5, Status = LoanStatus.Returned });

        var act = () => _sut.ReturnAsync(5);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*already been returned*");
    }

    [Fact]
    public async Task ReturnAsync_WhenOverdue_IncrementsCopiesCreatesFineAndCommits()
    {
        var loan = new Loan
        {
            LoanId = 5,
            BookId = 10,
            StudentId = 1,
            BorrowedDate = DateTime.UtcNow.AddDays(-20),
            DueDate = DateTime.UtcNow.AddDays(-6), // 6 days overdue
            Status = LoanStatus.Borrowed
        };

        var book = new Book
        {
            BookId = 10,
            TotalCopies = 5,
            AvailableCopies = 2
        };

        _loanRepoMock.Setup(l => l.GetByIdAsync(5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(loan);

        _bookRepoMock.Setup(b => b.GetByIdAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(book);

        var result = await _sut.ReturnAsync(5);

        result.Should().NotBeNull();
        result.OverdueDays.Should().Be(6);
        result.FineAmount.Should().Be(30.0m); // 6 days * 5.0 = 30.0
        result.HasFine.Should().BeTrue();
        book.AvailableCopies.Should().Be(3); // incremented from 2 to 3
        loan.Status.Should().Be(LoanStatus.Returned);

        _fineRepoMock.Verify(f => f.CreateAsync(It.Is<Fine>(fine => fine.Amount == 30.0m && fine.LoanId == 5), It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ReturnAsync_WithFakeTimeProvider_CalculatesOverdueDaysAndFineDeterministically()
    {
        var fixedReturnTime = new DateTimeOffset(2026, 11, 20, 10, 0, 0, TimeSpan.Zero);
        var fakeTime = new LibraryManagement.Tests.Common.FakeTimeProvider(fixedReturnTime);

        var loanServiceWithFakeTime = new LoanService(
            _loanRepoMock.Object,
            _bookRepoMock.Object,
            _studentRepoMock.Object,
            _fineRepoMock.Object,
            _loanQueryMock.Object,
            _unitOfWorkMock.Object,
            _settings,
            _loggerMock.Object,
            fakeTime);

        var loan = new Loan
        {
            LoanId = 8,
            BookId = 20,
            StudentId = 2,
            BorrowedDate = fixedReturnTime.UtcDateTime.AddDays(-22),
            DueDate = fixedReturnTime.UtcDateTime.AddDays(-8), // 8 days overdue
            Status = LoanStatus.Borrowed
        };

        var book = new Book
        {
            BookId = 20,
            TotalCopies = 3,
            AvailableCopies = 1
        };

        _loanRepoMock.Setup(l => l.GetByIdAsync(8, It.IsAny<CancellationToken>()))
            .ReturnsAsync(loan);

        _bookRepoMock.Setup(b => b.GetByIdAsync(20, It.IsAny<CancellationToken>()))
            .ReturnsAsync(book);

        var result = await loanServiceWithFakeTime.ReturnAsync(8);

        result.Should().NotBeNull();
        result.OverdueDays.Should().Be(8);
        result.FineAmount.Should().Be(40.0m); // 8 days * 5.0 = 40.0
        result.HasFine.Should().BeTrue();
        loan.Status.Should().Be(LoanStatus.Returned);
        loan.ReturnedDate.Should().Be(fixedReturnTime.UtcDateTime);
        loan.UpdatedAt.Should().Be(fixedReturnTime.UtcDateTime);
        book.AvailableCopies.Should().Be(2);

        _fineRepoMock.Verify(f => f.CreateAsync(It.Is<Fine>(fine => fine.Amount == 40.0m && fine.LoanId == 8 && fine.CreatedAt == fixedReturnTime.UtcDateTime), It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
