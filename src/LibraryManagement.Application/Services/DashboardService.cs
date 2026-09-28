using LibraryManagement.Application.DTOs.Dashboard;
using LibraryManagement.Application.Interfaces.QueryServices;
using LibraryManagement.Application.Interfaces.Services;

namespace LibraryManagement.Application.Services;

public class DashboardService(IDashboardQueryService dashboardQueryService) : IDashboardService
{
    public Task<DashboardSummaryResponse> GetSummaryAsync(CancellationToken cancellationToken = default)
        => dashboardQueryService.GetSummaryAsync(cancellationToken);

    public Task<List<RecentLoanResponse>> GetRecentLoansAsync(CancellationToken cancellationToken = default)
        => dashboardQueryService.GetRecentLoansAsync(10, cancellationToken);

    public Task<List<PopularBookResponse>> GetPopularBooksAsync(CancellationToken cancellationToken = default)
        => dashboardQueryService.GetPopularBooksAsync(10, cancellationToken);
}
