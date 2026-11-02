using Dapper;
using LibraryManagement.Application.DTOs.Fines;
using LibraryManagement.Application.Interfaces.QueryServices;
using LibraryManagement.Infrastructure.Data;

namespace LibraryManagement.Infrastructure.Queries;

public class FineQueryService(ISqlConnectionFactory connectionFactory) : IFineQueryService
{
    public async Task<List<FineResponse>> GetAllFinesAsync(bool? unpaidOnly = null, CancellationToken cancellationToken = default)
    {
        using var connection = connectionFactory.CreateConnection();

        var whereClause = unpaidOnly.HasValue && unpaidOnly.Value ? "WHERE f.IsPaid = 0" : string.Empty;

        var sql = $@"
            SELECT 
                f.FineId,
                f.LoanId,
                b.Title AS BookTitle,
                (s.FirstName + ' ' + s.LastName) AS StudentName,
                s.StudentNumber,
                f.Amount,
                f.IsPaid,
                f.PaidDate,
                l.DueDate,
                f.CreatedAt
            FROM Fines f
            INNER JOIN Loans l ON f.LoanId = l.LoanId
            INNER JOIN Students s ON l.StudentId = s.StudentId
            INNER JOIN Books b ON l.BookId = b.BookId
            {whereClause}
            ORDER BY f.CreatedAt DESC";

        var results = await connection.QueryAsync<FineResponse>(
            new CommandDefinition(sql, cancellationToken: cancellationToken));

        return results.ToList();
    }

    public async Task<FineResponse?> GetFineByIdAsync(int fineId, CancellationToken cancellationToken = default)
    {
        using var connection = connectionFactory.CreateConnection();

        const string sql = @"
            SELECT 
                f.FineId,
                f.LoanId,
                b.Title AS BookTitle,
                (s.FirstName + ' ' + s.LastName) AS StudentName,
                s.StudentNumber,
                f.Amount,
                f.IsPaid,
                f.PaidDate,
                l.DueDate,
                f.CreatedAt
            FROM Fines f
            INNER JOIN Loans l ON f.LoanId = l.LoanId
            INNER JOIN Students s ON l.StudentId = s.StudentId
            INNER JOIN Books b ON l.BookId = b.BookId
            WHERE f.FineId = @FineId";

        return await connection.QueryFirstOrDefaultAsync<FineResponse>(
            new CommandDefinition(sql, new { FineId = fineId }, cancellationToken: cancellationToken));
    }
}
