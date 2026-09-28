using LibraryManagement.Application.DTOs.Common;
using LibraryManagement.Application.DTOs.Dashboard;
using LibraryManagement.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LibraryManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController(IDashboardService dashboardService) : ControllerBase
{
    [HttpGet("summary")]
    [ProducesResponseType(typeof(ApiResponse<DashboardSummaryResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<DashboardSummaryResponse>>> GetSummary(CancellationToken cancellationToken)
    {
        var result = await dashboardService.GetSummaryAsync(cancellationToken);
        return Ok(ApiResponse<DashboardSummaryResponse>.Ok(result));
    }

    [HttpGet("recent-loans")]
    [ProducesResponseType(typeof(ApiResponse<List<RecentLoanResponse>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<RecentLoanResponse>>>> GetRecentLoans(CancellationToken cancellationToken)
    {
        var result = await dashboardService.GetRecentLoansAsync(cancellationToken);
        return Ok(ApiResponse<List<RecentLoanResponse>>.Ok(result));
    }

    [HttpGet("popular-books")]
    [ProducesResponseType(typeof(ApiResponse<List<PopularBookResponse>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<PopularBookResponse>>>> GetPopularBooks(CancellationToken cancellationToken)
    {
        var result = await dashboardService.GetPopularBooksAsync(cancellationToken);
        return Ok(ApiResponse<List<PopularBookResponse>>.Ok(result));
    }
}
