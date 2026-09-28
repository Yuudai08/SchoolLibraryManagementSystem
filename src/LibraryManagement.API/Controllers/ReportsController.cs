using LibraryManagement.Application.DTOs.Common;
using LibraryManagement.Application.DTOs.Dashboard;
using LibraryManagement.Application.DTOs.Reports;
using LibraryManagement.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LibraryManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController(IReportService reportService) : ControllerBase
{
    [HttpGet("inventory")]
    [ProducesResponseType(typeof(ApiResponse<List<InventoryReportItem>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<InventoryReportItem>>>> GetInventoryReport(CancellationToken cancellationToken)
    {
        var result = await reportService.GetInventoryReportAsync(cancellationToken);
        return Ok(ApiResponse<List<InventoryReportItem>>.Ok(result));
    }

    [HttpGet("borrowing")]
    [ProducesResponseType(typeof(ApiResponse<List<BorrowingReportItem>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<BorrowingReportItem>>>> GetBorrowingReport(CancellationToken cancellationToken)
    {
        var result = await reportService.GetBorrowingReportAsync(cancellationToken);
        return Ok(ApiResponse<List<BorrowingReportItem>>.Ok(result));
    }

    [HttpGet("overdue")]
    [ProducesResponseType(typeof(ApiResponse<List<OverdueReportItem>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<OverdueReportItem>>>> GetOverdueReport(CancellationToken cancellationToken)
    {
        var result = await reportService.GetOverdueReportAsync(cancellationToken);
        return Ok(ApiResponse<List<OverdueReportItem>>.Ok(result));
    }

    [HttpGet("fines")]
    [ProducesResponseType(typeof(ApiResponse<List<FineReportItem>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<FineReportItem>>>> GetFineReport(CancellationToken cancellationToken)
    {
        var result = await reportService.GetFineReportAsync(cancellationToken);
        return Ok(ApiResponse<List<FineReportItem>>.Ok(result));
    }

    [HttpGet("popular-books")]
    [ProducesResponseType(typeof(ApiResponse<List<PopularBookResponse>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<PopularBookResponse>>>> GetPopularBooksReport(CancellationToken cancellationToken)
    {
        var result = await reportService.GetPopularBooksReportAsync(cancellationToken);
        return Ok(ApiResponse<List<PopularBookResponse>>.Ok(result));
    }
}
