using LibraryManagement.Application.DTOs.Categories;
using LibraryManagement.Application.Exceptions;
using LibraryManagement.Application.Interfaces.Repositories;
using LibraryManagement.Application.Interfaces.Services;
using LibraryManagement.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace LibraryManagement.Application.Services;

public class CategoryService(
    ICategoryRepository categoryRepository,
    IUnitOfWork unitOfWork,
    ILogger<CategoryService> logger) : ICategoryService
{
    public async Task<CategoryResponse> CreateAsync(CreateCategoryRequest request, CancellationToken cancellationToken = default)
    {
        if (await categoryRepository.ExistsByNameAsync(request.Name, cancellationToken: cancellationToken))
        {
            throw new ConflictException($"A category with name '{request.Name}' already exists.");
        }

        var category = new Category
        {
            Name = request.Name,
            Description = request.Description
        };

        await categoryRepository.CreateAsync(category, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Category created: {Name} (ID: {CategoryId})", category.Name, category.CategoryId);

        return MapToResponse(category);
    }

    public async Task<CategoryResponse> UpdateAsync(int id, UpdateCategoryRequest request, CancellationToken cancellationToken = default)
    {
        var category = await categoryRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Category", id);

        if (await categoryRepository.ExistsByNameAsync(request.Name, excludeId: id, cancellationToken: cancellationToken))
        {
            throw new ConflictException($"A category with name '{request.Name}' already exists.");
        }

        category.Name = request.Name;
        category.Description = request.Description;

        await categoryRepository.UpdateAsync(category, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Category updated: {Name} (ID: {CategoryId})", category.Name, id);

        return MapToResponse(category);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var category = await categoryRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Category", id);

        if (await categoryRepository.HasBooksAsync(id, cancellationToken))
        {
            throw new ConflictException("Cannot delete a category that has books. Reassign the books first.");
        }

        await categoryRepository.DeleteAsync(category, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Category deleted: {Name} (ID: {CategoryId})", category.Name, id);
    }

    public async Task<List<CategoryResponse>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var categories = await categoryRepository.GetAllAsync(cancellationToken);
        return categories.Select(MapToResponse).ToList();
    }

    public async Task<CategoryResponse?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var category = await categoryRepository.GetByIdAsync(id, cancellationToken);
        return category == null ? null : MapToResponse(category);
    }

    private static CategoryResponse MapToResponse(Category category)
    {
        return new CategoryResponse
        {
            CategoryId = category.CategoryId,
            Name = category.Name,
            Description = category.Description,
            BookCount = category.Books?.Count ?? 0
        };
    }
}
