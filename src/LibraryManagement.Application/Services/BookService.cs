using LibraryManagement.Application.DTOs.Books;
using LibraryManagement.Application.DTOs.Common;
using LibraryManagement.Application.Exceptions;
using LibraryManagement.Application.Interfaces.QueryServices;
using LibraryManagement.Application.Interfaces.Repositories;
using LibraryManagement.Application.Interfaces.Services;
using LibraryManagement.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace LibraryManagement.Application.Services;

public class BookService(
    IBookRepository bookRepository,
    ICategoryRepository categoryRepository,
    IBookQueryService bookQueryService,
    IUnitOfWork unitOfWork,
    ILogger<BookService> logger,
    TimeProvider? timeProvider = null) : IBookService
{
    private readonly TimeProvider _timeProvider = timeProvider ?? TimeProvider.System;

    public async Task<BookResponse> CreateAsync(CreateBookRequest request, CancellationToken cancellationToken = default)
    {
        var category = await categoryRepository.GetByIdAsync(request.CategoryId, cancellationToken)
            ?? throw new NotFoundException("Category", request.CategoryId);

        if (!string.IsNullOrEmpty(request.ISBN) &&
            await bookRepository.ExistsByIsbnAsync(request.ISBN, cancellationToken: cancellationToken))
        {
            throw new ConflictException($"A book with ISBN '{request.ISBN}' already exists.");
        }

        var book = new Book
        {
            Title = request.Title,
            Author = request.Author,
            ISBN = request.ISBN,
            Publisher = request.Publisher,
            PublicationYear = request.PublicationYear,
            CategoryId = request.CategoryId,
            Description = request.Description,
            TotalCopies = request.TotalCopies,
            AvailableCopies = request.AvailableCopies,
            CreatedAt = _timeProvider.GetUtcNow().UtcDateTime
        };

        await bookRepository.CreateAsync(book, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Book created: {Title} (ID: {BookId})", book.Title, book.BookId);

        return await bookQueryService.GetBookDetailAsync(book.BookId, cancellationToken)
            ?? throw new NotFoundException("Book", book.BookId);
    }

    public async Task<BookResponse> UpdateAsync(int id, UpdateBookRequest request, CancellationToken cancellationToken = default)
    {
        var book = await bookRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Book", id);

        var category = await categoryRepository.GetByIdAsync(request.CategoryId, cancellationToken)
            ?? throw new NotFoundException("Category", request.CategoryId);

        if (!string.IsNullOrEmpty(request.ISBN) &&
            await bookRepository.ExistsByIsbnAsync(request.ISBN, excludeId: id, cancellationToken: cancellationToken))
        {
            throw new ConflictException($"A book with ISBN '{request.ISBN}' already exists.");
        }

        // Handle copy changes: ensure total copies cannot be reduced below currently borrowed copies
        var borrowedCopies = book.TotalCopies - book.AvailableCopies;
        if (request.TotalCopies < borrowedCopies)
        {
            throw new ConflictException($"Cannot reduce total copies to {request.TotalCopies}. {borrowedCopies} copies are currently borrowed.");
        }

        var totalDelta = request.TotalCopies - book.TotalCopies;

        book.Title = request.Title;
        book.Author = request.Author;
        book.ISBN = request.ISBN;
        book.Publisher = request.Publisher;
        book.PublicationYear = request.PublicationYear;
        book.CategoryId = request.CategoryId;
        book.Description = request.Description;
        book.TotalCopies = request.TotalCopies;
        book.AvailableCopies += totalDelta;
        book.UpdatedAt = _timeProvider.GetUtcNow().UtcDateTime;

        await bookRepository.UpdateAsync(book, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Book updated: {Title} (ID: {BookId})", book.Title, book.BookId);

        return await bookQueryService.GetBookDetailAsync(book.BookId, cancellationToken)
            ?? throw new NotFoundException("Book", book.BookId);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var book = await bookRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Book", id);

        if (book.TotalCopies != book.AvailableCopies)
        {
            throw new ConflictException("Cannot delete a book that has borrowed copies.");
        }

        if (await bookRepository.HasLoansAsync(id, cancellationToken))
        {
            throw new ConflictException("Cannot delete a book that has loan history. Archive the book instead.");
        }

        await bookRepository.DeleteAsync(book, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Book deleted: {Title} (ID: {BookId})", book.Title, id);
    }

    public async Task<BookResponse?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await bookQueryService.GetBookDetailAsync(id, cancellationToken);
    }

    public async Task<PagedResult<BookListResponse>> SearchAsync(BookSearchParams searchParams, CancellationToken cancellationToken = default)
    {
        return await bookQueryService.SearchBooksAsync(searchParams, cancellationToken);
    }
}
