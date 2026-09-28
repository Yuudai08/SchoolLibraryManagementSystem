namespace LibraryManagement.Application.DTOs.Students;

public record CreateStudentRequest
{
    public string StudentNumber { get; init; } = string.Empty;
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string? Email { get; init; }
    public string? Phone { get; init; }
    public string? Department { get; init; }
    public int? Year { get; init; }
}

public record UpdateStudentRequest
{
    public string StudentNumber { get; init; } = string.Empty;
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string? Email { get; init; }
    public string? Phone { get; init; }
    public string? Department { get; init; }
    public int? Year { get; init; }
    public bool IsActive { get; init; } = true;
}

public record StudentResponse
{
    public int StudentId { get; init; }
    public string StudentNumber { get; init; } = string.Empty;
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}";
    public string? Email { get; init; }
    public string? Phone { get; init; }
    public string? Department { get; init; }
    public int? Year { get; init; }
    public bool IsActive { get; init; }
    public int ActiveLoanCount { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}

public record StudentListResponse
{
    public int StudentId { get; init; }
    public string StudentNumber { get; init; } = string.Empty;
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}";
    public string? Department { get; init; }
    public bool IsActive { get; init; }
    public int ActiveLoanCount { get; init; }
}

public record StudentSearchParams
{
    public string? Search { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
}
