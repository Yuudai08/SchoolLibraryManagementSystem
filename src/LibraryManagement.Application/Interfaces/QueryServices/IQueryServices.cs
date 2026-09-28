using LibraryManagement.Application.DTOs.Books;
using LibraryManagement.Application.DTOs.Common;
using LibraryManagement.Application.DTOs.Dashboard;
using LibraryManagement.Application.DTOs.Fines;
using LibraryManagement.Application.DTOs.Loans;
using LibraryManagement.Application.DTOs.Reports;
using LibraryManagement.Application.DTOs.Students;

namespace LibraryManagement.Application.Interfaces.QueryServices;

/// <summary>
/// Dapper-based query service for book search and listing.
/// </summary>
public interface IBookQueryService
{
    Task<PagedResult<BookListResponse>> SearchBooksAsync(BookSearchParams searchParams, CancellationToken cancellationToken = default);
    Task<BookResponse?> GetBookDetailAsync(int bookId, CancellationToken cancellationToken = default);
}

/// <summary>
/// Dapper-based query service for dashboard statistics.
/// </summary>
public interface IDashboardQueryService
{
    Task<DashboardSummaryResponse> GetSummaryAsync(CancellationToken cancellationToken = default);
    Task<List<RecentLoanResponse>> GetRecentLoansAsync(int count = 10, CancellationToken cancellationToken = default);
    Task<List<PopularBookResponse>> GetPopularBooksAsync(int count = 10, CancellationToken cancellationToken = default);
}

/// <summary>
/// Dapper-based query service for reports.
/// </summary>
public interface IReportQueryService
{
    Task<List<InventoryReportItem>> GetInventoryReportAsync(CancellationToken cancellationToken = default);
    Task<List<BorrowingReportItem>> GetBorrowingReportAsync(CancellationToken cancellationToken = default);
    Task<List<OverdueReportItem>> GetOverdueReportAsync(CancellationToken cancellationToken = default);
    Task<List<FineReportItem>> GetFineReportAsync(CancellationToken cancellationToken = default);
    Task<List<PopularBookResponse>> GetPopularBooksReportAsync(int count = 20, CancellationToken cancellationToken = default);
}

/// <summary>
/// Dapper-based query service for loan listing and history.
/// </summary>
public interface ILoanQueryService
{
    Task<PagedResult<LoanResponse>> GetLoansAsync(LoanSearchParams searchParams, CancellationToken cancellationToken = default);
    Task<List<LoanResponse>> GetActiveLoansByStudentAsync(int studentId, CancellationToken cancellationToken = default);
    Task<List<LoanResponse>> GetLoanHistoryByStudentAsync(int studentId, CancellationToken cancellationToken = default);
    Task<PagedResult<LoanResponse>> GetOverdueLoansAsync(int page = 1, int pageSize = 20, CancellationToken cancellationToken = default);
}

/// <summary>
/// Dapper-based query service for student search and listing.
/// </summary>
public interface IStudentQueryService
{
    Task<PagedResult<StudentListResponse>> SearchStudentsAsync(StudentSearchParams searchParams, CancellationToken cancellationToken = default);
    Task<StudentResponse?> GetStudentDetailAsync(int studentId, CancellationToken cancellationToken = default);
}

/// <summary>
/// Dapper-based query service for fines.
/// </summary>
public interface IFineQueryService
{
    Task<List<FineResponse>> GetAllFinesAsync(bool? unpaidOnly = null, CancellationToken cancellationToken = default);
    Task<FineResponse?> GetFineByIdAsync(int fineId, CancellationToken cancellationToken = default);
}
