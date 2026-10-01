using FluentAssertions;
using LibraryManagement.Application.DTOs.Books;
using LibraryManagement.Application.Exceptions;
using LibraryManagement.Application.Interfaces.QueryServices;
using LibraryManagement.Application.Interfaces.Repositories;
using LibraryManagement.Application.Services;
using LibraryManagement.Domain.Entities;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace LibraryManagement.Tests;

public class BookServiceTests
{
    private readonly Mock<IBookRepository> _bookRepoMock = new();
    private readonly Mock<ICategoryRepository> _categoryRepoMock = new();
    private readonly Mock<IBookQueryService> _bookQueryMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();
    private readonly Mock<ILogger<BookService>> _loggerMock = new();

    private readonly BookService _sut;

    public BookServiceTests()
    {
        _sut = new BookService(
            _bookRepoMock.Object,
            _categoryRepoMock.Object,
            _bookQueryMock.Object,
            _unitOfWorkMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task CreateAsync_WhenCategoryNotFound_ThrowsNotFoundException()
    {
        _categoryRepoMock.Setup(c => c.GetByIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Category?)null);

        var request = new CreateBookRequest
        {
            Title = "Test Book",
            Author = "Author",
            CategoryId = 99
        };

        var act = () => _sut.CreateAsync(request);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task CreateAsync_WhenIsbnExists_ThrowsConflictException()
    {
        _categoryRepoMock.Setup(c => c.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Category { CategoryId = 1, Name = "Tech" });

        _bookRepoMock.Setup(b => b.ExistsByIsbnAsync("1234567890", null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var request = new CreateBookRequest
        {
            Title = "Test Book",
            Author = "Author",
            ISBN = "1234567890",
            CategoryId = 1
        };

        var act = () => _sut.CreateAsync(request);

        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task CreateAsync_WhenValid_CreatesAndReturnsBook()
    {
        _categoryRepoMock.Setup(c => c.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Category { CategoryId = 1, Name = "Tech" });

        _bookRepoMock.Setup(b => b.ExistsByIsbnAsync("1234567890", null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _bookRepoMock.Setup(b => b.CreateAsync(It.IsAny<Book>(), It.IsAny<CancellationToken>()))
            .Callback<Book, CancellationToken>((b, _) => b.BookId = 10)
            .ReturnsAsync((Book b, CancellationToken _) => b);

        _bookQueryMock.Setup(q => q.GetBookDetailAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new BookResponse
            {
                BookId = 10,
                Title = "Test Book",
                Author = "Author",
                CategoryId = 1,
                CategoryName = "Tech"
            });

        var request = new CreateBookRequest
        {
            Title = "Test Book",
            Author = "Author",
            ISBN = "1234567890",
            CategoryId = 1,
            TotalCopies = 5,
            AvailableCopies = 5
        };

        var result = await _sut.CreateAsync(request);

        result.Should().NotBeNull();
        result.BookId.Should().Be(10);
        result.Title.Should().Be("Test Book");
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_WhenBookHasBorrowedCopies_ThrowsConflictException()
    {
        _bookRepoMock.Setup(b => b.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Book
            {
                BookId = 1,
                Title = "Borrowed Book",
                TotalCopies = 5,
                AvailableCopies = 3 // 2 copies borrowed!
            });

        var act = () => _sut.DeleteAsync(1);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*borrowed copies*");
    }

    [Fact]
    public async Task DeleteAsync_WhenBookHasLoanHistory_ThrowsConflictException()
    {
        _bookRepoMock.Setup(b => b.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Book
            {
                BookId = 1,
                Title = "Returned Book",
                TotalCopies = 5,
                AvailableCopies = 5 // all returned
            });

        _bookRepoMock.Setup(b => b.HasLoansAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var act = () => _sut.DeleteAsync(1);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*loan history*");
    }

    [Fact]
    public async Task DeleteAsync_WhenValid_DeletesSuccessfully()
    {
        var book = new Book
        {
            BookId = 1,
            Title = "Clean Book",
            TotalCopies = 3,
            AvailableCopies = 3
        };

        _bookRepoMock.Setup(b => b.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(book);

        _bookRepoMock.Setup(b => b.HasLoansAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        await _sut.DeleteAsync(1);

        _bookRepoMock.Verify(b => b.DeleteAsync(book, It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_WhenReducingTotalCopiesBelowBorrowedCopies_ThrowsConflictException()
    {
        var book = new Book
        {
            BookId = 1,
            Title = "Existing Book",
            TotalCopies = 5,
            AvailableCopies = 2 // 3 borrowed!
        };

        _bookRepoMock.Setup(b => b.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(book);
        _categoryRepoMock.Setup(c => c.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Category { CategoryId = 1, Name = "Tech" });

        var request = new UpdateBookRequest
        {
            Title = "Updated Book",
            Author = "Author",
            CategoryId = 1,
            TotalCopies = 2 // trying to reduce to 2 when 3 are borrowed
        };

        var act = () => _sut.UpdateAsync(1, request);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*3 copies are currently borrowed*");
    }

    [Fact]
    public async Task UpdateAsync_WhenTotalCopiesIncreased_CorrectlyAdjustsAvailableCopiesByDelta()
    {
        var book = new Book
        {
            BookId = 1,
            Title = "Existing Book",
            TotalCopies = 5,
            AvailableCopies = 3 // 2 borrowed
        };

        _bookRepoMock.Setup(b => b.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(book);
        _categoryRepoMock.Setup(c => c.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Category { CategoryId = 1, Name = "Tech" });
        _bookRepoMock.Setup(b => b.ExistsByIsbnAsync(It.IsAny<string>(), 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _bookQueryMock.Setup(q => q.GetBookDetailAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new BookResponse
            {
                BookId = 1,
                Title = "Updated Book",
                TotalCopies = 8,
                AvailableCopies = 6
            });

        var request = new UpdateBookRequest
        {
            Title = "Updated Book",
            Author = "Author",
            CategoryId = 1,
            TotalCopies = 8 // increased by 3 copies
        };

        var result = await _sut.UpdateAsync(1, request);

        book.TotalCopies.Should().Be(8);
        book.AvailableCopies.Should().Be(6); // 3 + 3 = 6 (2 still borrowed: 8 - 6 = 2)
        _bookRepoMock.Verify(b => b.UpdateAsync(book, It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public void CreateBookRequestValidator_WhenDescriptionExceeds4000Chars_ValidationFails()
    {
        var validator = new LibraryManagement.Application.Validators.CreateBookRequestValidator();
        var request = new CreateBookRequest
        {
            Title = "Valid Title",
            Author = "Valid Author",
            CategoryId = 1,
            TotalCopies = 5,
            AvailableCopies = 5,
            Description = new string('A', 4001)
        };

        var result = validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Description" && e.ErrorMessage.Contains("4,000 characters"));
    }

    [Fact]
    public void CreateBookRequestValidator_WhenDescriptionWithin4000Chars_ValidationSucceeds()
    {
        var validator = new LibraryManagement.Application.Validators.CreateBookRequestValidator();
        var request = new CreateBookRequest
        {
            Title = "The Metamorphosis",
            Author = "Franz Kafka",
            CategoryId = 6,
            ISBN = "978-1557427663",
            Publisher = "Classix Press",
            PublicationYear = 2009,
            TotalCopies = 14,
            AvailableCopies = 14,
            Description = new string('A', 1500)
        };

        var result = validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }
}
