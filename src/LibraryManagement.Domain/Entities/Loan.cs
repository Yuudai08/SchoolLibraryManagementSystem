using LibraryManagement.Domain.Enums;

namespace LibraryManagement.Domain.Entities;

public class Loan
{
    public int LoanId { get; set; }
    public int BookId { get; set; }
    public int StudentId { get; set; }
    public DateTime BorrowedDate { get; set; } = DateTime.UtcNow;
    public DateTime DueDate { get; set; }
    public DateTime? ReturnedDate { get; set; }
    public LoanStatus Status { get; set; } = LoanStatus.Borrowed;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation
    public Book Book { get; set; } = null!;
    public Student Student { get; set; } = null!;
    public Fine? Fine { get; set; }

    // Domain methods
    public bool IsActive => Status == LoanStatus.Borrowed || Status == LoanStatus.Overdue;

    public bool IsOverdue(DateTime currentDate) =>
        ReturnedDate == null && currentDate.Date > DueDate.Date;
}
