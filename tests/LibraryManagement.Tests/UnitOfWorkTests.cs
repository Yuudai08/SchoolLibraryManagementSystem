using FluentAssertions;
using LibraryManagement.Application.Exceptions;
using LibraryManagement.Domain.Entities;
using LibraryManagement.Infrastructure.Data;
using LibraryManagement.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace LibraryManagement.Tests;

public class UnitOfWorkTests
{
    private static LibraryDbContext CreateDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<LibraryDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        return new LibraryDbContext(options);
    }

    [Fact]
    public async Task SaveChangesAsync_WhenSuccessful_PersistsChangesAndReturnsCount()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateDbContext(dbName);
        var uow = new UnitOfWork(context);

        var category = new Category { Name = "Fiction", Description = "Stories" };
        context.Categories.Add(category);

        var count = await uow.SaveChangesAsync();

        count.Should().Be(1);
        category.CategoryId.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task SaveChangesAsync_WhenConcurrencyConflictOccurs_ThrowsConflictException()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context1 = CreateDbContext(dbName);
        using var context2 = CreateDbContext(dbName);

        // Seed initial book
        var book = new Book
        {
            BookId = 1,
            Title = "Original Title",
            Author = "Author",
            TotalCopies = 5,
            AvailableCopies = 5
        };
        context1.Books.Add(book);
        await context1.SaveChangesAsync();

        // Both contexts fetch the book
        var bookInContext1 = await context1.Books.FindAsync(1);
        var bookInContext2 = await context2.Books.FindAsync(1);

        // User 1 deletes or concurrently updates the entity
        context1.Books.Remove(bookInContext1!);
        await context1.SaveChangesAsync();

        // User 2 tries to modify the entity that no longer matches store state
        bookInContext2!.Title = "Modified by User 2";
        var uow2 = new UnitOfWork(context2);

        var act = () => uow2.SaveChangesAsync();

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*concurrency conflict*");
    }
}
