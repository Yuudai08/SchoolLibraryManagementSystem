namespace LibraryManagement.Domain.Entities;

public class Student
{
    public int StudentId { get; set; }
    public string StudentNumber { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Department { get; set; }
    public int? Year { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation
    public ICollection<Loan> Loans { get; set; } = new List<Loan>();

    // Domain methods
    public string FullName => $"{FirstName} {LastName}";
    public bool CanBorrow() => IsActive;
}
