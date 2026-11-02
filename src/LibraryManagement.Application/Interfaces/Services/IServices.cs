using LibraryManagement.Application.DTOs.Auth;
using LibraryManagement.Application.DTOs.Books;
using LibraryManagement.Application.DTOs.Categories;
using LibraryManagement.Application.DTOs.Common;
using LibraryManagement.Application.DTOs.Dashboard;
using LibraryManagement.Application.DTOs.Fines;
using LibraryManagement.Application.DTOs.Loans;
using LibraryManagement.Application.DTOs.Reports;
using LibraryManagement.Application.DTOs.Students;

namespace LibraryManagement.Application.Interfaces.Services;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
}

public interface IBookService
{
    Task<BookResponse> CreateAsync(CreateBookRequest request, CancellationToken cancellationToken = default);
    Task<BookResponse> UpdateAsync(int id, UpdateBookRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
    Task<BookResponse?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<PagedResult<BookListResponse>> SearchAsync(BookSearchParams searchParams, CancellationToken cancellationToken = default);
}

public interface ICategoryService
{
    Task<CategoryResponse> CreateAsync(CreateCategoryRequest request, CancellationToken cancellationToken = default);
    Task<CategoryResponse> UpdateAsync(int id, UpdateCategoryRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
    Task<List<CategoryResponse>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<CategoryResponse?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
}

public interface IStudentService
{
    Task<StudentResponse> CreateAsync(CreateStudentRequest request, CancellationToken cancellationToken = default);
    Task<StudentResponse> UpdateAsync(int id, UpdateStudentRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
    Task<StudentResponse?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<PagedResult<StudentListResponse>> SearchAsync(StudentSearchParams searchParams, CancellationToken cancellationToken = default);
}

public interface ILoanService
{
    Task<LoanResponse> BorrowAsync(CreateLoanRequest request, CancellationToken cancellationToken = default);
    Task<ReturnLoanResponse> ReturnAsync(int loanId, CancellationToken cancellationToken = default);
    Task<LoanResponse?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<PagedResult<LoanResponse>> GetLoansAsync(LoanSearchParams searchParams, CancellationToken cancellationToken = default);
    Task<PagedResult<LoanResponse>> GetOverdueLoansAsync(int page = 1, int pageSize = 20, CancellationToken cancellationToken = default);
    Task<List<LoanResponse>> GetActiveLoansByStudentAsync(int studentId, CancellationToken cancellationToken = default);
}

public interface IFineService
{
    Task<List<FineResponse>> GetAllAsync(bool? unpaidOnly = null, CancellationToken cancellationToken = default);
    Task<FineResponse?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task PayFineAsync(int fineId, CancellationToken cancellationToken = default);
    Task SyncOverdueFinesAsync(CancellationToken cancellationToken = default);
}

public interface IDashboardService
{
    Task<DashboardSummaryResponse> GetSummaryAsync(CancellationToken cancellationToken = default);
    Task<List<RecentLoanResponse>> GetRecentLoansAsync(CancellationToken cancellationToken = default);
    Task<List<PopularBookResponse>> GetPopularBooksAsync(CancellationToken cancellationToken = default);
}

public interface IReportService
{
    Task<List<InventoryReportItem>> GetInventoryReportAsync(CancellationToken cancellationToken = default);
    Task<List<BorrowingReportItem>> GetBorrowingReportAsync(CancellationToken cancellationToken = default);
    Task<List<OverdueReportItem>> GetOverdueReportAsync(CancellationToken cancellationToken = default);
    Task<List<FineReportItem>> GetFineReportAsync(CancellationToken cancellationToken = default);
    Task<List<PopularBookResponse>> GetPopularBooksReportAsync(CancellationToken cancellationToken = default);
}
