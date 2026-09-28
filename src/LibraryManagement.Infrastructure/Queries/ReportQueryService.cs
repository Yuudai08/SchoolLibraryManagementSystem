using Dapper;
using LibraryManagement.Application.Configuration;
using LibraryManagement.Application.DTOs.Dashboard;
using LibraryManagement.Application.DTOs.Reports;
using LibraryManagement.Application.Interfaces.QueryServices;
using LibraryManagement.Infrastructure.Data;
using Microsoft.Extensions.Options;

namespace LibraryManagement.Infrastructure.Queries;

public class ReportQueryService(ISqlConnectionFactory connectionFactory, IOptions<LibrarySettings> settings) : IReportQueryService
{
    private readonly LibrarySettings _settings = settings.Value;

    public async Task<List<InventoryReportItem>> GetInventoryReportAsync(CancellationToken cancellationToken = default)
    {
        using var connection = connectionFactory.CreateConnection();

        const string sql = @"
            SELECT 
                b.Title,
                b.Author,
                c.Name AS CategoryName,
                b.TotalCopies,
                b.AvailableCopies
            FROM Books b
            INNER JOIN Categories c ON b.CategoryId = c.CategoryId
            ORDER BY c.Name ASC, b.Title ASC";

        var results = await connection.QueryAsync<InventoryReportItem>(
            new CommandDefinition(sql, cancellationToken: cancellationToken));

        return results.ToList();
    }

    public async Task<List<BorrowingReportItem>> GetBorrowingReportAsync(CancellationToken cancellationToken = default)
    {
        using var connection = connectionFactory.CreateConnection();

        const string sql = @"
            SELECT 
                (s.FirstName + ' ' + s.LastName) AS StudentName,
                s.StudentNumber,
                b.Title AS BookTitle,
                l.BorrowedDate,
                l.DueDate,
                l.ReturnedDate,
                CASE l.Status 
                    WHEN 0 THEN 'Borrowed' 
                    WHEN 1 THEN 'Returned' 
                    WHEN 2 THEN 'Overdue' 
                    ELSE 'Unknown' 
                END AS Status
            FROM Loans l
            INNER JOIN Students s ON l.StudentId = s.StudentId
            INNER JOIN Books b ON l.BookId = b.BookId
            ORDER BY l.BorrowedDate DESC";

        var results = await connection.QueryAsync<BorrowingReportItem>(
            new CommandDefinition(sql, cancellationToken: cancellationToken));

        return results.ToList();
    }

    public async Task<List<OverdueReportItem>> GetOverdueReportAsync(CancellationToken cancellationToken = default)
    {
        using var connection = connectionFactory.CreateConnection();

        const string sql = @"
            SELECT 
                (s.FirstName + ' ' + s.LastName) AS StudentName,
                s.StudentNumber,
                b.Title AS BookTitle,
                l.DueDate,
                DATEDIFF(day, l.DueDate, GETUTCDATE()) AS DaysOverdue,
                (DATEDIFF(day, l.DueDate, GETUTCDATE()) * @FinePerDay) AS CurrentFine
            FROM Loans l
            INNER JOIN Students s ON l.StudentId = s.StudentId
            INNER JOIN Books b ON l.BookId = b.BookId
            WHERE (l.Status = 2 OR (l.Status = 0 AND l.DueDate < GETUTCDATE()))
              AND l.ReturnedDate IS NULL
            ORDER BY DaysOverdue DESC";

        var results = await connection.QueryAsync<OverdueReportItem>(
            new CommandDefinition(sql, new { FinePerDay = _settings.FinePerDay }, cancellationToken: cancellationToken));

        return results.ToList();
    }

    public async Task<List<FineReportItem>> GetFineReportAsync(CancellationToken cancellationToken = default)
    {
        using var connection = connectionFactory.CreateConnection();

        const string sql = @"
            SELECT 
                (s.FirstName + ' ' + s.LastName) AS StudentName,
                s.StudentNumber,
                b.Title AS BookTitle,
                f.Amount AS FineAmount,
                f.IsPaid,
                f.PaidDate
            FROM Fines f
            INNER JOIN Loans l ON f.LoanId = l.LoanId
            INNER JOIN Students s ON l.StudentId = s.StudentId
            INNER JOIN Books b ON l.BookId = b.BookId
            ORDER BY f.CreatedAt DESC";

        var results = await connection.QueryAsync<FineReportItem>(
            new CommandDefinition(sql, cancellationToken: cancellationToken));

        return results.ToList();
    }

    public async Task<List<PopularBookResponse>> GetPopularBooksReportAsync(int count = 20, CancellationToken cancellationToken = default)
    {
        using var connection = connectionFactory.CreateConnection();

        const string sql = @"
            SELECT TOP (@Count)
                b.BookId,
                b.Title,
                b.Author,
                COUNT(l.LoanId) AS TotalLoans
            FROM Books b
            LEFT JOIN Loans l ON b.BookId = l.BookId
            GROUP BY b.BookId, b.Title, b.Author
            ORDER BY TotalLoans DESC, b.Title ASC";

        var results = await connection.QueryAsync<PopularBookResponse>(
            new CommandDefinition(sql, new { Count = count }, cancellationToken: cancellationToken));

        return results.ToList();
    }
}
