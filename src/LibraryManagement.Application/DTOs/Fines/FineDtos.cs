namespace LibraryManagement.Application.DTOs.Fines;

public record FineResponse
{
    public int FineId { get; init; }
    public int LoanId { get; init; }
    public string BookTitle { get; init; } = string.Empty;
    public string StudentName { get; init; } = string.Empty;
    public string StudentNumber { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public bool IsPaid { get; init; }
    public DateTime? PaidDate { get; init; }
    public DateTime CreatedAt { get; init; }
}
