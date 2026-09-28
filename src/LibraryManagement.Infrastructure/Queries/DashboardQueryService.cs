using Dapper;
using LibraryManagement.Application.DTOs.Dashboard;
using LibraryManagement.Application.Interfaces.QueryServices;
using LibraryManagement.Infrastructure.Data;

namespace LibraryManagement.Infrastructure.Queries;

public class DashboardQueryService(ISqlConnectionFactory connectionFactory) : IDashboardQueryService
{
    public async Task<DashboardSummaryResponse> GetSummaryAsync(CancellationToken cancellationToken = default)
    {
        using var connection = connectionFactory.CreateConnection();

        const string sql = @"
            SELECT 
                (SELECT COUNT(1) FROM Books) AS TotalBooks,
                (SELECT ISNULL(SUM(TotalCopies), 0) FROM Books) AS TotalCopies,
                (SELECT ISNULL(SUM(AvailableCopies), 0) FROM Books) AS AvailableCopies,
                (SELECT ISNULL(SUM(TotalCopies - AvailableCopies), 0) FROM Books) AS BorrowedCopies,
                (SELECT COUNT(1) FROM Students WHERE IsActive = 1) AS TotalStudents,
                (SELECT COUNT(1) FROM Loans WHERE Status IN (0, 2)) AS ActiveLoans,
                (SELECT COUNT(1) FROM Loans WHERE Status = 2 OR (Status = 0 AND DueDate < GETUTCDATE())) AS OverdueLoans,
                (SELECT ISNULL(SUM(Amount), 0) FROM Fines WHERE IsPaid = 0) AS UnpaidFines";

        var result = await connection.QueryFirstOrDefaultAsync<DashboardSummaryResponse>(
            new CommandDefinition(sql, cancellationToken: cancellationToken));

        return result ?? new DashboardSummaryResponse();
    }

    public async Task<List<RecentLoanResponse>> GetRecentLoansAsync(int count = 10, CancellationToken cancellationToken = default)
    {
        using var connection = connectionFactory.CreateConnection();

        const string sql = @"
            SELECT TOP (@Count)
                (s.FirstName + ' ' + s.LastName) AS StudentName,
                b.Title AS BookTitle,
                l.BorrowedDate,
                l.DueDate
            FROM Loans l
            INNER JOIN Students s ON l.StudentId = s.StudentId
            INNER JOIN Books b ON l.BookId = b.BookId
            ORDER BY l.BorrowedDate DESC";

        var results = await connection.QueryAsync<RecentLoanResponse>(
            new CommandDefinition(sql, new { Count = count }, cancellationToken: cancellationToken));

        return results.ToList();
    }

    public async Task<List<PopularBookResponse>> GetPopularBooksAsync(int count = 10, CancellationToken cancellationToken = default)
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
