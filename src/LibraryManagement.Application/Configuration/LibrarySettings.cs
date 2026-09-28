namespace LibraryManagement.Application.Configuration;

public class LibrarySettings
{
    public const string SectionName = "LibrarySettings";

    public int MaxActiveLoans { get; set; } = 5;
    public decimal FinePerDay { get; set; } = 5.0m;
    public int DefaultLoanDays { get; set; } = 14;
}
