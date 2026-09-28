using Dapper;
using LibraryManagement.Application.DTOs.Common;
using LibraryManagement.Application.DTOs.Students;
using LibraryManagement.Application.Interfaces.QueryServices;
using LibraryManagement.Infrastructure.Data;

namespace LibraryManagement.Infrastructure.Queries;

public class StudentQueryService(ISqlConnectionFactory connectionFactory) : IStudentQueryService
{
    public async Task<PagedResult<StudentListResponse>> SearchStudentsAsync(
        StudentSearchParams searchParams,
        CancellationToken cancellationToken = default)
    {
        using var connection = connectionFactory.CreateConnection();

        var whereClauses = new List<string>();
        var parameters = new DynamicParameters();

        if (!string.IsNullOrWhiteSpace(searchParams.Search))
        {
            whereClauses.Add("(s.StudentNumber LIKE @SearchTerm OR s.FirstName LIKE @SearchTerm OR s.LastName LIKE @SearchTerm OR s.Department LIKE @SearchTerm)");
            parameters.Add("SearchTerm", $"%{searchParams.Search.Trim()}%");
        }

        var whereSql = whereClauses.Count > 0 ? "WHERE " + string.Join(" AND ", whereClauses) : string.Empty;

        var countSql = $"SELECT COUNT(1) FROM Students s {whereSql}";

        var page = searchParams.Page < 1 ? 1 : searchParams.Page;
        var pageSize = searchParams.PageSize < 1 ? 20 : searchParams.PageSize;
        var offset = (page - 1) * pageSize;

        parameters.Add("Offset", offset);
        parameters.Add("PageSize", pageSize);

        var dataSql = $@"
            SELECT 
                s.StudentId,
                s.StudentNumber,
                s.FirstName,
                s.LastName,
                s.Department,
                s.IsActive,
                (SELECT COUNT(1) FROM Loans l WHERE l.StudentId = s.StudentId AND l.Status IN (0, 2)) AS ActiveLoanCount
            FROM Students s
            {whereSql}
            ORDER BY s.StudentNumber ASC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";

        var totalCount = await connection.ExecuteScalarAsync<int>(new CommandDefinition(countSql, parameters, cancellationToken: cancellationToken));
        var items = await connection.QueryAsync<StudentListResponse>(new CommandDefinition(dataSql, parameters, cancellationToken: cancellationToken));

        return new PagedResult<StudentListResponse>
        {
            Items = items.ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<StudentResponse?> GetStudentDetailAsync(int studentId, CancellationToken cancellationToken = default)
    {
        using var connection = connectionFactory.CreateConnection();

        const string sql = @"
            SELECT 
                s.StudentId,
                s.StudentNumber,
                s.FirstName,
                s.LastName,
                s.Email,
                s.Phone,
                s.Department,
                s.Year,
                s.IsActive,
                s.CreatedAt,
                s.UpdatedAt,
                (SELECT COUNT(1) FROM Loans l WHERE l.StudentId = s.StudentId AND l.Status IN (0, 2)) AS ActiveLoanCount
            FROM Students s
            WHERE s.StudentId = @StudentId";

        return await connection.QueryFirstOrDefaultAsync<StudentResponse>(
            new CommandDefinition(sql, new { StudentId = studentId }, cancellationToken: cancellationToken));
    }
}
