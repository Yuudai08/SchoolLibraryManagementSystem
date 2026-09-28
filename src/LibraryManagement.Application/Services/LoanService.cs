using LibraryManagement.Application.Configuration;
using LibraryManagement.Application.DTOs.Common;
using LibraryManagement.Application.DTOs.Loans;
using LibraryManagement.Application.Exceptions;
using LibraryManagement.Application.Interfaces.QueryServices;
using LibraryManagement.Application.Interfaces.Repositories;
using LibraryManagement.Application.Interfaces.Services;
using LibraryManagement.Domain.Entities;
using LibraryManagement.Domain.Enums;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace LibraryManagement.Application.Services;

public class LoanService(
    ILoanRepository loanRepository,
    IBookRepository bookRepository,
    IStudentRepository studentRepository,
    IFineRepository fineRepository,
    ILoanQueryService loanQueryService,
    IUnitOfWork unitOfWork,
    IOptions<LibrarySettings> settings,
    ILogger<LoanService> logger,
    TimeProvider? timeProvider = null) : ILoanService
{
    private readonly LibrarySettings _settings = settings.Value;
    private readonly TimeProvider _timeProvider = timeProvider ?? TimeProvider.System;

    public async Task<LoanResponse> BorrowAsync(CreateLoanRequest request, CancellationToken cancellationToken = default)
    {
        await unitOfWork.BeginTransactionAsync(cancellationToken);

        try
        {
            // 1. Check student exists and is active
            var student = await studentRepository.GetByIdAsync(request.StudentId, cancellationToken)
                ?? throw new NotFoundException("Student", request.StudentId);

            if (!student.CanBorrow())
            {
                throw new BadRequestException("Student is inactive and cannot borrow books.");
            }

            // 2. Check active loan limit
            var activeLoansCount = await loanRepository.GetActiveLoansCountAsync(request.StudentId, cancellationToken);
            if (activeLoansCount >= _settings.MaxActiveLoans)
            {
                throw new BadRequestException($"Student has reached the maximum number of active loans ({_settings.MaxActiveLoans}).");
            }

            // 3. Check for duplicate active loan for the same book
            if (await loanRepository.HasActiveLoanForBookAsync(request.StudentId, request.BookId, cancellationToken))
            {
                throw new ConflictException("Student already has an active loan for this book.");
            }

            // 4. Check book availability
            var book = await bookRepository.GetByIdAsync(request.BookId, cancellationToken)
                ?? throw new NotFoundException("Book", request.BookId);

            if (!book.HasAvailableCopies())
            {
                throw new ConflictException("Book is currently unavailable. No copies available.");
            }

            var now = _timeProvider.GetUtcNow().UtcDateTime;

            // 5. Decrease available copies
            book.DecrementAvailableCopies();
            book.UpdatedAt = now;
            await bookRepository.UpdateAsync(book, cancellationToken);

            // 6. Create loan
            var loan = new Loan
            {
                BookId = request.BookId,
                StudentId = request.StudentId,
                BorrowedDate = now,
                DueDate = request.DueDate,
                Status = LoanStatus.Borrowed,
                CreatedAt = now
            };

            await loanRepository.CreateAsync(loan, cancellationToken);
            await unitOfWork.CommitTransactionAsync(cancellationToken);

            logger.LogInformation(
                "Loan created: Student {StudentName} borrowed {BookTitle} (LoanId: {LoanId})",
                student.FullName, book.Title, loan.LoanId);

            // Return fresh data from query service
            var activeLoans = await loanQueryService.GetActiveLoansByStudentAsync(request.StudentId, cancellationToken);
            return activeLoans.FirstOrDefault(l => l.LoanId == loan.LoanId)
                ?? new LoanResponse
                {
                    LoanId = loan.LoanId,
                    BookId = book.BookId,
                    BookTitle = book.Title,
                    BookAuthor = book.Author,
                    StudentId = student.StudentId,
                    StudentName = student.FullName,
                    StudentNumber = student.StudentNumber,
                    BorrowedDate = loan.BorrowedDate,
                    DueDate = loan.DueDate,
                    Status = LoanStatus.Borrowed.ToString()
                };
        }
        catch
        {
            await unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }
    }

    public async Task<ReturnLoanResponse> ReturnAsync(int loanId, CancellationToken cancellationToken = default)
    {
        await unitOfWork.BeginTransactionAsync(cancellationToken);

        try
        {
            // 1. Find active loan
            var loan = await loanRepository.GetByIdAsync(loanId, cancellationToken)
                ?? throw new NotFoundException("Loan", loanId);

            if (loan.Status == LoanStatus.Returned)
            {
                throw new ConflictException("This loan has already been returned.");
            }

            var returnDate = _timeProvider.GetUtcNow().UtcDateTime;

            // 2. Calculate fine
            var fineAmount = Fine.Calculate(loan.DueDate, returnDate, _settings.FinePerDay);
            var overdueDays = returnDate.Date > loan.DueDate.Date
                ? (returnDate.Date - loan.DueDate.Date).Days
                : 0;

            // 3. Update loan as returned
            loan.ReturnedDate = returnDate;
            loan.Status = LoanStatus.Returned;
            loan.UpdatedAt = returnDate;
            await loanRepository.UpdateAsync(loan, cancellationToken);

            // 4. Increase available copies
            var book = await bookRepository.GetByIdAsync(loan.BookId, cancellationToken)
                ?? throw new NotFoundException("Book", loan.BookId);

            book.IncrementAvailableCopies();
            book.UpdatedAt = returnDate;
            await bookRepository.UpdateAsync(book, cancellationToken);

            // 5. Create fine if overdue
            if (fineAmount > 0)
            {
                var fine = new Fine
                {
                    LoanId = loanId,
                    Amount = fineAmount,
                    IsPaid = false,
                    CreatedAt = returnDate
                };

                await fineRepository.CreateAsync(fine, cancellationToken);
                logger.LogInformation("Fine created: Rs. {Amount} for Loan {LoanId}", fineAmount, loanId);
            }

            await unitOfWork.CommitTransactionAsync(cancellationToken);

            logger.LogInformation("Book returned: LoanId {LoanId}, OverdueDays: {OverdueDays}, Fine: Rs. {Fine}",
                loanId, overdueDays, fineAmount);

            return new ReturnLoanResponse
            {
                LoanId = loanId,
                ReturnedDate = returnDate,
                OverdueDays = overdueDays,
                FineAmount = fineAmount
            };
        }
        catch
        {
            await unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }
    }

    public async Task<LoanResponse?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var loans = await loanQueryService.GetLoansAsync(
            new LoanSearchParams { Page = 1, PageSize = 1 }, cancellationToken);
        return loans.Items.FirstOrDefault(l => l.LoanId == id);
    }

    public async Task<PagedResult<LoanResponse>> GetLoansAsync(LoanSearchParams searchParams, CancellationToken cancellationToken = default)
    {
        return await loanQueryService.GetLoansAsync(searchParams, cancellationToken);
    }

    public async Task<PagedResult<LoanResponse>> GetOverdueLoansAsync(int page = 1, int pageSize = 20, CancellationToken cancellationToken = default)
    {
        return await loanQueryService.GetOverdueLoansAsync(page, pageSize, cancellationToken);
    }

    public async Task<List<LoanResponse>> GetActiveLoansByStudentAsync(int studentId, CancellationToken cancellationToken = default)
    {
        return await loanQueryService.GetActiveLoansByStudentAsync(studentId, cancellationToken);
    }
}
