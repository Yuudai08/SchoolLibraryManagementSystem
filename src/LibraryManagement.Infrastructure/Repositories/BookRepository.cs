using LibraryManagement.Application.Interfaces.Repositories;
using LibraryManagement.Domain.Entities;
using LibraryManagement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LibraryManagement.Infrastructure.Repositories;

public class BookRepository(LibraryDbContext context) : IBookRepository
{
    public async Task<Book?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await context.Books
            .Include(b => b.Category)
            .FirstOrDefaultAsync(b => b.BookId == id, cancellationToken);
    }

    public async Task<Book> CreateAsync(Book book, CancellationToken cancellationToken = default)
    {
        await context.Books.AddAsync(book, cancellationToken);
        return book;
    }

    public Task UpdateAsync(Book book, CancellationToken cancellationToken = default)
    {
        context.Books.Update(book);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(Book book, CancellationToken cancellationToken = default)
    {
        context.Books.Remove(book);
        return Task.CompletedTask;
    }

    public async Task<bool> ExistsByIsbnAsync(string isbn, int? excludeId = null, CancellationToken cancellationToken = default)
    {
        return await context.Books
            .AnyAsync(b => b.ISBN == isbn && (!excludeId.HasValue || b.BookId != excludeId.Value), cancellationToken);
    }

    public async Task<bool> HasLoansAsync(int bookId, CancellationToken cancellationToken = default)
    {
        return await context.Loans
            .AnyAsync(l => l.BookId == bookId, cancellationToken);
    }
}
