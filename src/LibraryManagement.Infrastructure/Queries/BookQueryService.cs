using Dapper;
using LibraryManagement.Application.DTOs.Books;
using LibraryManagement.Application.DTOs.Common;
using LibraryManagement.Application.Interfaces.QueryServices;
using LibraryManagement.Infrastructure.Data;

namespace LibraryManagement.Infrastructure.Queries;

public class BookQueryService(ISqlConnectionFactory connectionFactory) : IBookQueryService
{
    public async Task<PagedResult<BookListResponse>> SearchBooksAsync(
        BookSearchParams searchParams,
        CancellationToken cancellationToken = default)
    {
        using var connection = connectionFactory.CreateConnection();

        var whereClauses = new List<string>();
        var parameters = new DynamicParameters();

        if (!string.IsNullOrWhiteSpace(searchParams.Search))
        {
            var rawSearch = searchParams.Search.Trim();
            var terms = rawSearch.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

            if (terms.Length <= 1)
            {
                whereClauses.Add("(b.Title LIKE @SearchTerm OR b.Author LIKE @SearchTerm OR b.ISBN LIKE @SearchTerm)");
                parameters.Add("SearchTerm", $"%{rawSearch}%");
            }
            else
            {
                var multiWordClauses = new List<string>();
                for (int i = 0; i < terms.Length; i++)
                {
                    var paramName = $"Term{i}";
                    multiWordClauses.Add($"(b.Title LIKE @{paramName} OR b.Author LIKE @{paramName} OR b.ISBN LIKE @{paramName})");
                    parameters.Add(paramName, $"%{terms[i]}%");
                }

                parameters.Add("FullSearchTerm", $"%{rawSearch}%");
                whereClauses.Add($@"((b.Title LIKE @FullSearchTerm OR b.Author LIKE @FullSearchTerm) OR ({string.Join(" AND ", multiWordClauses)}))");
            }
        }

        if (searchParams.CategoryId.HasValue && searchParams.CategoryId.Value > 0)
        {
            whereClauses.Add("b.CategoryId = @CategoryId");
            parameters.Add("CategoryId", searchParams.CategoryId.Value);
        }

        var whereSql = whereClauses.Count > 0
            ? "WHERE " + string.Join(" AND ", whereClauses)
            : string.Empty;

        var countSql = $"SELECT COUNT(1) FROM Books b {whereSql}";

        var page = searchParams.Page < 1 ? 1 : searchParams.Page;
        var pageSize = searchParams.PageSize < 1 ? 20 : searchParams.PageSize;
        var offset = (page - 1) * pageSize;

        parameters.Add("Offset", offset);
        parameters.Add("PageSize", pageSize);

        var dataSql = $@"
            SELECT 
                b.BookId,
                b.Title,
                b.Author,
                b.ISBN,
                c.Name AS CategoryName,
                b.TotalCopies,
                b.AvailableCopies
            FROM Books b
            INNER JOIN Categories c ON b.CategoryId = c.CategoryId
            {whereSql}
            ORDER BY b.Title ASC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";

        var totalCount = await connection.ExecuteScalarAsync<int>(new CommandDefinition(countSql, parameters, cancellationToken: cancellationToken));
        var items = await connection.QueryAsync<BookListResponse>(new CommandDefinition(dataSql, parameters, cancellationToken: cancellationToken));

        return new PagedResult<BookListResponse>
        {
            Items = items.ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<BookResponse?> GetBookDetailAsync(int bookId, CancellationToken cancellationToken = default)
    {
        using var connection = connectionFactory.CreateConnection();

        const string sql = @"
            SELECT 
                b.BookId,
                b.Title,
                b.Author,
                b.ISBN,
                b.Publisher,
                b.PublicationYear,
                b.CategoryId,
                c.Name AS CategoryName,
                b.Description,
                b.TotalCopies,
                b.AvailableCopies,
                b.CreatedAt,
                b.UpdatedAt
            FROM Books b
            INNER JOIN Categories c ON b.CategoryId = c.CategoryId
            WHERE b.BookId = @BookId";

        return await connection.QueryFirstOrDefaultAsync<BookResponse>(
            new CommandDefinition(sql, new { BookId = bookId }, cancellationToken: cancellationToken));
    }
}
