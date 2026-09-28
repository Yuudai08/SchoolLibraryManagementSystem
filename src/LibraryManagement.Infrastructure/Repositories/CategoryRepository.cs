using LibraryManagement.Application.Interfaces.Repositories;
using LibraryManagement.Domain.Entities;
using LibraryManagement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LibraryManagement.Infrastructure.Repositories;

public class CategoryRepository(LibraryDbContext context) : ICategoryRepository
{
    public async Task<Category?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await context.Categories
            .Include(c => c.Books)
            .FirstOrDefaultAsync(c => c.CategoryId == id, cancellationToken);
    }

    public async Task<List<Category>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await context.Categories
            .Include(c => c.Books)
            .OrderBy(c => c.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<Category> CreateAsync(Category category, CancellationToken cancellationToken = default)
    {
        await context.Categories.AddAsync(category, cancellationToken);
        return category;
    }

    public Task UpdateAsync(Category category, CancellationToken cancellationToken = default)
    {
        context.Categories.Update(category);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(Category category, CancellationToken cancellationToken = default)
    {
        context.Categories.Remove(category);
        return Task.CompletedTask;
    }

    public async Task<bool> ExistsByNameAsync(string name, int? excludeId = null, CancellationToken cancellationToken = default)
    {
        return await context.Categories
            .AnyAsync(c => c.Name == name && (!excludeId.HasValue || c.CategoryId != excludeId.Value), cancellationToken);
    }

    public async Task<bool> HasBooksAsync(int categoryId, CancellationToken cancellationToken = default)
    {
        return await context.Books
            .AnyAsync(b => b.CategoryId == categoryId, cancellationToken);
    }
}
