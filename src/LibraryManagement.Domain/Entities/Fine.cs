namespace LibraryManagement.Domain.Entities;

public class Fine
{
    public int FineId { get; set; }
    public int LoanId { get; set; }
    public decimal Amount { get; set; }
    public bool IsPaid { get; set; }
    public DateTime? PaidDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Loan Loan { get; set; } = null!;

    // Domain methods
    public static decimal Calculate(DateTime dueDate, DateTime returnDate, decimal finePerDay)
    {
        if (returnDate.Date <= dueDate.Date)
            return 0;

        var overdueDays = (returnDate.Date - dueDate.Date).Days;
        return overdueDays * finePerDay;
    }

    public static decimal CalculateCurrentFine(DateTime dueDate, decimal finePerDay, TimeProvider? timeProvider = null)
    {
        var now = (timeProvider ?? TimeProvider.System).GetUtcNow().UtcDateTime;
        return Calculate(dueDate, now, finePerDay);
    }
}
