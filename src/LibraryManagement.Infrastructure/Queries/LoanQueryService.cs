using Dapper;
using LibraryManagement.Application.Configuration;
using LibraryManagement.Application.DTOs.Common;
using LibraryManagement.Application.DTOs.Loans;
using LibraryManagement.Application.Interfaces.QueryServices;
using LibraryManagement.Infrastructure.Data;
using Microsoft.Extensions.Options;

namespace LibraryManagement.Infrastructure.Queries;

public class LoanQueryService(ISqlConnectionFactory connectionFactory, IOptions<LibrarySettings> settings) : ILoanQueryService
{
    private readonly LibrarySettings _settings = settings.Value;

    public async Task<PagedResult<LoanResponse>> GetLoansAsync(LoanSearchParams searchParams, CancellationToken cancellationToken = default)
    {
        using var connection = connectionFactory.CreateConnection();

        var whereClauses = new List<string>();
        var parameters = new DynamicParameters();

        if (searchParams.StudentId.HasValue && searchParams.StudentId.Value > 0)
        {
            whereClauses.Add("l.StudentId = @StudentId");
            parameters.Add("StudentId", searchParams.StudentId.Value);
        }

        if (searchParams.BookId.HasValue && searchParams.BookId.Value > 0)
        {
            whereClauses.Add("l.BookId = @BookId");
            parameters.Add("BookId", searchParams.BookId.Value);
        }

        if (searchParams.Status.HasValue)
        {
            whereClauses.Add("l.Status = @Status");
            parameters.Add("Status", (int)searchParams.Status.Value);
        }

        if (searchParams.OverdueOnly.HasValue && searchParams.OverdueOnly.Value)
        {
            whereClauses.Add("(l.Status = 2 OR (l.Status = 0 AND l.DueDate < GETUTCDATE())) AND l.ReturnedDate IS NULL");
        }

        var whereSql = whereClauses.Count > 0 ? "WHERE " + string.Join(" AND ", whereClauses) : string.Empty;

        var countSql = $"SELECT COUNT(1) FROM Loans l {whereSql}";

        var page = searchParams.Page < 1 ? 1 : searchParams.Page;
        var pageSize = searchParams.PageSize < 1 ? 20 : searchParams.PageSize;
        var offset = (page - 1) * pageSize;

        parameters.Add("Offset", offset);
        parameters.Add("PageSize", pageSize);
        parameters.Add("FinePerDay", _settings.FinePerDay);

        var dataSql = $@"
            SELECT 
                l.LoanId,
                l.BookId,
                b.Title AS BookTitle,
                b.Author AS BookAuthor,
                l.StudentId,
                (s.FirstName + ' ' + s.LastName) AS StudentName,
                s.StudentNumber,
                l.BorrowedDate,
                l.DueDate,
                l.ReturnedDate,
                CASE l.Status
                    WHEN 0 THEN 'Borrowed'
                    WHEN 1 THEN 'Returned'
                    WHEN 2 THEN 'Overdue'
                    ELSE 'Unknown'
                END AS Status,
                CASE 
                    WHEN l.ReturnedDate IS NULL AND GETUTCDATE() > l.DueDate 
                        THEN DATEDIFF(day, l.DueDate, GETUTCDATE())
                    ELSE NULL 
                END AS DaysOverdue,
                CASE 
                    WHEN l.ReturnedDate IS NULL AND GETUTCDATE() > l.DueDate 
                        THEN (DATEDIFF(day, l.DueDate, GETUTCDATE()) * @FinePerDay)
                    ELSE NULL 
                END AS CurrentFine
            FROM Loans l
            INNER JOIN Students s ON l.StudentId = s.StudentId
            INNER JOIN Books b ON l.BookId = b.BookId
            {whereSql}
            ORDER BY l.BorrowedDate DESC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";

        var totalCount = await connection.ExecuteScalarAsync<int>(new CommandDefinition(countSql, parameters, cancellationToken: cancellationToken));
        var items = await connection.QueryAsync<LoanResponse>(new CommandDefinition(dataSql, parameters, cancellationToken: cancellationToken));

        return new PagedResult<LoanResponse>
        {
            Items = items.ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<List<LoanResponse>> GetActiveLoansByStudentAsync(int studentId, CancellationToken cancellationToken = default)
    {
        using var connection = connectionFactory.CreateConnection();

        const string sql = @"
            SELECT 
                l.LoanId,
                l.BookId,
                b.Title AS BookTitle,
                b.Author AS BookAuthor,
                l.StudentId,
                (s.FirstName + ' ' + s.LastName) AS StudentName,
                s.StudentNumber,
                l.BorrowedDate,
                l.DueDate,
                l.ReturnedDate,
                CASE l.Status
                    WHEN 0 THEN 'Borrowed'
                    WHEN 1 THEN 'Returned'
                    WHEN 2 THEN 'Overdue'
                    ELSE 'Unknown'
                END AS Status,
                CASE 
                    WHEN l.ReturnedDate IS NULL AND GETUTCDATE() > l.DueDate 
                        THEN DATEDIFF(day, l.DueDate, GETUTCDATE())
                    ELSE NULL 
                END AS DaysOverdue,
                CASE 
                    WHEN l.ReturnedDate IS NULL AND GETUTCDATE() > l.DueDate 
                        THEN (DATEDIFF(day, l.DueDate, GETUTCDATE()) * @FinePerDay)
                    ELSE NULL 
                END AS CurrentFine
            FROM Loans l
            INNER JOIN Students s ON l.StudentId = s.StudentId
            INNER JOIN Books b ON l.BookId = b.BookId
            WHERE l.StudentId = @StudentId AND l.ReturnedDate IS NULL
            ORDER BY l.DueDate ASC";

        var items = await connection.QueryAsync<LoanResponse>(
            new CommandDefinition(sql, new { StudentId = studentId, FinePerDay = _settings.FinePerDay }, cancellationToken: cancellationToken));

        return items.ToList();
    }

    public async Task<List<LoanResponse>> GetLoanHistoryByStudentAsync(int studentId, CancellationToken cancellationToken = default)
    {
        using var connection = connectionFactory.CreateConnection();

        const string sql = @"
            SELECT 
                l.LoanId,
                l.BookId,
                b.Title AS BookTitle,
                b.Author AS BookAuthor,
                l.StudentId,
                (s.FirstName + ' ' + s.LastName) AS StudentName,
                s.StudentNumber,
                l.BorrowedDate,
                l.DueDate,
                l.ReturnedDate,
                CASE l.Status
                    WHEN 0 THEN 'Borrowed'
                    WHEN 1 THEN 'Returned'
                    WHEN 2 THEN 'Overdue'
                    ELSE 'Unknown'
                END AS Status,
                CASE 
                    WHEN l.ReturnedDate IS NOT NULL AND l.ReturnedDate > l.DueDate 
                        THEN DATEDIFF(day, l.DueDate, l.ReturnedDate)
                    WHEN l.ReturnedDate IS NULL AND GETUTCDATE() > l.DueDate 
                        THEN DATEDIFF(day, l.DueDate, GETUTCDATE())
                    ELSE NULL 
                END AS DaysOverdue,
                f.Amount AS CurrentFine
            FROM Loans l
            INNER JOIN Students s ON l.StudentId = s.StudentId
            INNER JOIN Books b ON l.BookId = b.BookId
            LEFT JOIN Fines f ON l.LoanId = f.LoanId
            WHERE l.StudentId = @StudentId
            ORDER BY l.BorrowedDate DESC";

        var items = await connection.QueryAsync<LoanResponse>(
            new CommandDefinition(sql, new { StudentId = studentId }, cancellationToken: cancellationToken));

        return items.ToList();
    }

    public async Task<PagedResult<LoanResponse>> GetOverdueLoansAsync(int page = 1, int pageSize = 20, CancellationToken cancellationToken = default)
    {
        return await GetLoansAsync(new LoanSearchParams
        {
            OverdueOnly = true,
            Page = page,
            PageSize = pageSize
        }, cancellationToken);
    }
}
