using LibraryManagement.Application.Interfaces.Repositories;
using LibraryManagement.Domain.Entities;
using LibraryManagement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LibraryManagement.Infrastructure.Repositories;

public class FineRepository(LibraryDbContext context) : IFineRepository
{
    public async Task<Fine?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await context.Fines
            .Include(f => f.Loan)
                .ThenInclude(l => l.Book)
            .Include(f => f.Loan)
                .ThenInclude(l => l.Student)
            .FirstOrDefaultAsync(f => f.FineId == id, cancellationToken);
    }

    public async Task<Fine?> GetByLoanIdAsync(int loanId, CancellationToken cancellationToken = default)
    {
        return await context.Fines
            .Include(f => f.Loan)
                .ThenInclude(l => l.Book)
            .Include(f => f.Loan)
                .ThenInclude(l => l.Student)
            .FirstOrDefaultAsync(f => f.LoanId == loanId, cancellationToken);
    }

    public async Task<Fine> CreateAsync(Fine fine, CancellationToken cancellationToken = default)
    {
        await context.Fines.AddAsync(fine, cancellationToken);
        return fine;
    }

    public Task UpdateAsync(Fine fine, CancellationToken cancellationToken = default)
    {
        context.Fines.Update(fine);
        return Task.CompletedTask;
    }
}
