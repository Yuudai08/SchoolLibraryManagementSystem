namespace LibraryManagement.Application.DTOs.Dashboard;

public record DashboardSummaryResponse
{
    public int TotalBooks { get; init; }
    public int TotalCopies { get; init; }
    public int AvailableCopies { get; init; }
    public int BorrowedCopies { get; init; }
    public int TotalStudents { get; init; }
    public int ActiveLoans { get; init; }
    public int OverdueLoans { get; init; }
    public decimal UnpaidFines { get; init; }
}

public record RecentLoanResponse
{
    public string StudentName { get; init; } = string.Empty;
    public string BookTitle { get; init; } = string.Empty;
    public DateTime BorrowedDate { get; init; }
    public DateTime DueDate { get; init; }
}

public record PopularBookResponse
{
    public int BookId { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Author { get; init; } = string.Empty;
    public int TotalLoans { get; init; }
}
