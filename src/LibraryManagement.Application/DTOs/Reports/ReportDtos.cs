namespace LibraryManagement.Application.DTOs.Reports;

public record InventoryReportItem
{
    public string Title { get; init; } = string.Empty;
    public string Author { get; init; } = string.Empty;
    public string CategoryName { get; init; } = string.Empty;
    public int TotalCopies { get; init; }
    public int AvailableCopies { get; init; }
    public int BorrowedCopies => TotalCopies - AvailableCopies;
}

public record BorrowingReportItem
{
    public string StudentName { get; init; } = string.Empty;
    public string StudentNumber { get; init; } = string.Empty;
    public string BookTitle { get; init; } = string.Empty;
    public DateTime BorrowedDate { get; init; }
    public DateTime DueDate { get; init; }
    public DateTime? ReturnedDate { get; init; }
    public string Status { get; init; } = string.Empty;
}

public record OverdueReportItem
{
    public string StudentName { get; init; } = string.Empty;
    public string StudentNumber { get; init; } = string.Empty;
    public string BookTitle { get; init; } = string.Empty;
    public DateTime DueDate { get; init; }
    public int DaysOverdue { get; init; }
    public decimal CurrentFine { get; init; }
}

public record FineReportItem
{
    public string StudentName { get; init; } = string.Empty;
    public string StudentNumber { get; init; } = string.Empty;
    public string BookTitle { get; init; } = string.Empty;
    public decimal FineAmount { get; init; }
    public bool IsPaid { get; init; }
    public DateTime? PaidDate { get; init; }
}
