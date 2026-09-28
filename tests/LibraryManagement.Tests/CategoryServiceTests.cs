using FluentAssertions;
using LibraryManagement.Application.DTOs.Categories;
using LibraryManagement.Application.Exceptions;
using LibraryManagement.Application.Interfaces.Repositories;
using LibraryManagement.Application.Services;
using LibraryManagement.Domain.Entities;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace LibraryManagement.Tests;

public class CategoryServiceTests
{
    private readonly Mock<ICategoryRepository> _categoryRepoMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();
    private readonly Mock<ILogger<CategoryService>> _loggerMock = new();

    private readonly CategoryService _sut;

    public CategoryServiceTests()
    {
        _sut = new CategoryService(
            _categoryRepoMock.Object,
            _unitOfWorkMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task GetAllAsync_WhenCategoriesHaveBooks_CorrectlyPopulatesBookCount()
    {
        var category = new Category
        {
            CategoryId = 1,
            Name = "Science",
            Description = "Science books",
            Books = new List<Book>
            {
                new() { BookId = 1, Title = "Physics" },
                new() { BookId = 2, Title = "Chemistry" }
            }
        };

        _categoryRepoMock.Setup(c => c.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Category> { category });

        var results = await _sut.GetAllAsync();

        results.Should().HaveCount(1);
        results[0].BookCount.Should().Be(2);
        results[0].Name.Should().Be("Science");
    }

    [Fact]
    public async Task DeleteAsync_WhenCategoryHasBooks_ThrowsConflictException()
    {
        var category = new Category { CategoryId = 1, Name = "Tech" };
        _categoryRepoMock.Setup(c => c.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(category);
        _categoryRepoMock.Setup(c => c.HasBooksAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var act = () => _sut.DeleteAsync(1);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*Cannot delete a category that has books*");
    }

    [Fact]
    public async Task DeleteAsync_WhenCategoryHasNoBooks_DeletesSuccessfully()
    {
        var category = new Category { CategoryId = 1, Name = "Empty Category" };
        _categoryRepoMock.Setup(c => c.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(category);
        _categoryRepoMock.Setup(c => c.HasBooksAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        await _sut.DeleteAsync(1);

        _categoryRepoMock.Verify(c => c.DeleteAsync(category, It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_WhenNameExists_ThrowsConflictException()
    {
        _categoryRepoMock.Setup(c => c.ExistsByNameAsync("Tech", null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var request = new CreateCategoryRequest { Name = "Tech" };

        var act = () => _sut.CreateAsync(request);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*already exists*");
    }
}
