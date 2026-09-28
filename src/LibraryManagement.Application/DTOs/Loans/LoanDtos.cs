using LibraryManagement.Domain.Enums;

namespace LibraryManagement.Application.DTOs.Loans;

public record CreateLoanRequest
{
    public int BookId { get; init; }
    public int StudentId { get; init; }
    public DateTime DueDate { get; init; }
}

public record LoanResponse
{
    public int LoanId { get; init; }
    public int BookId { get; init; }
    public string BookTitle { get; init; } = string.Empty;
    public string BookAuthor { get; init; } = string.Empty;
    public int StudentId { get; init; }
    public string StudentName { get; init; } = string.Empty;
    public string StudentNumber { get; init; } = string.Empty;
    public DateTime BorrowedDate { get; init; }
    public DateTime DueDate { get; init; }
    public DateTime? ReturnedDate { get; init; }
    public string Status { get; init; } = string.Empty;
    public int? DaysOverdue { get; init; }
    public decimal? CurrentFine { get; init; }
}

public record ReturnLoanResponse
{
    public int LoanId { get; init; }
    public DateTime ReturnedDate { get; init; }
    public int OverdueDays { get; init; }
    public decimal FineAmount { get; init; }
    public bool HasFine => FineAmount > 0;
}

public record LoanSearchParams
{
    public int? StudentId { get; init; }
    public int? BookId { get; init; }
    public LoanStatus? Status { get; init; }
    public bool? OverdueOnly { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
}
