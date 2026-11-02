using LibraryManagement.Application.Interfaces.Repositories;
using LibraryManagement.Domain.Entities;
using LibraryManagement.Domain.Enums;
using LibraryManagement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LibraryManagement.Infrastructure.Repositories;

public class LoanRepository(LibraryDbContext context) : ILoanRepository
{
    public async Task<Loan?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await context.Loans
            .Include(l => l.Book)
            .Include(l => l.Student)
            .Include(l => l.Fine)
            .FirstOrDefaultAsync(l => l.LoanId == id, cancellationToken);
    }

    public async Task<Loan> CreateAsync(Loan loan, CancellationToken cancellationToken = default)
    {
        await context.Loans.AddAsync(loan, cancellationToken);
        return loan;
    }

    public Task UpdateAsync(Loan loan, CancellationToken cancellationToken = default)
    {
        context.Update(loan);
        return Task.CompletedTask;
    }

    public async Task<int> GetActiveLoansCountAsync(int studentId, CancellationToken cancellationToken = default)
    {
        return await context.Loans
            .CountAsync(l => l.StudentId == studentId && (l.Status == LoanStatus.Borrowed || l.Status == LoanStatus.Overdue), cancellationToken);
    }

    public async Task<bool> HasActiveLoanForBookAsync(int studentId, int bookId, CancellationToken cancellationToken = default)
    {
        return await context.Loans
            .AnyAsync(l => l.StudentId == studentId && l.BookId == bookId && (l.Status == LoanStatus.Borrowed || l.Status == LoanStatus.Overdue), cancellationToken);
    }

    public async Task<List<Loan>> GetActiveOverdueLoansAsync(DateTime asOfDate, CancellationToken cancellationToken = default)
    {
        return await context.Loans
            .Include(l => l.Fine)
            .Include(l => l.Book)
            .Include(l => l.Student)
            .Where(l => l.ReturnedDate == null && l.DueDate < asOfDate)
            .ToListAsync(cancellationToken);
    }
}
