namespace LibraryManagement.Application.DTOs.Books;

public record CreateBookRequest
{
    public string Title { get; init; } = string.Empty;
    public string Author { get; init; } = string.Empty;
    public string? ISBN { get; init; }
    public string? Publisher { get; init; }
    public int? PublicationYear { get; init; }
    public int CategoryId { get; init; }
    public string? Description { get; init; }
    public int TotalCopies { get; init; }
    public int AvailableCopies { get; init; }
}

public record UpdateBookRequest
{
    public string Title { get; init; } = string.Empty;
    public string Author { get; init; } = string.Empty;
    public string? ISBN { get; init; }
    public string? Publisher { get; init; }
    public int? PublicationYear { get; init; }
    public int CategoryId { get; init; }
    public string? Description { get; init; }
    public int TotalCopies { get; init; }
    public int AvailableCopies { get; init; }
}

public record BookResponse
{
    public int BookId { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Author { get; init; } = string.Empty;
    public string? ISBN { get; init; }
    public string? Publisher { get; init; }
    public int? PublicationYear { get; init; }
    public int CategoryId { get; init; }
    public string CategoryName { get; init; } = string.Empty;
    public string? Description { get; init; }
    public int TotalCopies { get; init; }
    public int AvailableCopies { get; init; }
    public int BorrowedCopies => TotalCopies - AvailableCopies;
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}

public record BookListResponse
{
    public int BookId { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Author { get; init; } = string.Empty;
    public string? ISBN { get; init; }
    public string CategoryName { get; init; } = string.Empty;
    public int TotalCopies { get; init; }
    public int AvailableCopies { get; init; }
    public int BorrowedCopies => TotalCopies - AvailableCopies;
}

public record BookSearchParams
{
    public string? Search { get; init; }
    public int? CategoryId { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
}
