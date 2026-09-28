using LibraryManagement.Application.DTOs.Dashboard;
using LibraryManagement.Application.DTOs.Reports;
using LibraryManagement.Application.Interfaces.QueryServices;
using LibraryManagement.Application.Interfaces.Services;

namespace LibraryManagement.Application.Services;

public class ReportService(IReportQueryService reportQueryService) : IReportService
{
    public Task<List<InventoryReportItem>> GetInventoryReportAsync(CancellationToken cancellationToken = default)
        => reportQueryService.GetInventoryReportAsync(cancellationToken);

    public Task<List<BorrowingReportItem>> GetBorrowingReportAsync(CancellationToken cancellationToken = default)
        => reportQueryService.GetBorrowingReportAsync(cancellationToken);

    public Task<List<OverdueReportItem>> GetOverdueReportAsync(CancellationToken cancellationToken = default)
        => reportQueryService.GetOverdueReportAsync(cancellationToken);

    public Task<List<FineReportItem>> GetFineReportAsync(CancellationToken cancellationToken = default)
        => reportQueryService.GetFineReportAsync(cancellationToken);

    public Task<List<PopularBookResponse>> GetPopularBooksReportAsync(CancellationToken cancellationToken = default)
        => reportQueryService.GetPopularBooksReportAsync(20, cancellationToken);
}
