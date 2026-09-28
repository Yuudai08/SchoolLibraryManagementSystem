namespace LibraryManagement.Application.DTOs.Categories;

public record CreateCategoryRequest
{
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
}

public record UpdateCategoryRequest
{
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
}

public record CategoryResponse
{
    public int CategoryId { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public int BookCount { get; init; }
}
