using LibraryManagement.Application.DTOs.Common;
using LibraryManagement.Application.DTOs.Fines;
using LibraryManagement.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LibraryManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FinesController(IFineService fineService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<FineResponse>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<FineResponse>>>> GetFines(
        [FromQuery] bool? unpaidOnly,
        CancellationToken cancellationToken)
    {
        var result = await fineService.GetAllAsync(unpaidOnly, cancellationToken);
        return Ok(ApiResponse<List<FineResponse>>.Ok(result));
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<FineResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<FineResponse>>> GetFineById(
        int id,
        CancellationToken cancellationToken)
    {
        var fine = await fineService.GetByIdAsync(id, cancellationToken);
        if (fine == null)
        {
            return NotFound(ApiResponse<FineResponse>.Fail($"Fine with ID '{id}' was not found."));
        }

        return Ok(ApiResponse<FineResponse>.Ok(fine));
    }

    [HttpPost("{id:int}/pay")]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<string>>> PayFine(
        int id,
        CancellationToken cancellationToken)
    {
        await fineService.PayFineAsync(id, cancellationToken);
        return Ok(ApiResponse<string>.Ok("Fine paid successfully."));
    }
}
