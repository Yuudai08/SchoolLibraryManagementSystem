using FluentValidation;
using LibraryManagement.Application.DTOs.Common;
using LibraryManagement.Application.DTOs.Loans;
using LibraryManagement.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LibraryManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LoansController(
    ILoanService loanService,
    IValidator<CreateLoanRequest> createValidator) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<LoanResponse>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<PagedResult<LoanResponse>>>> GetLoans(
        [FromQuery] LoanSearchParams searchParams,
        CancellationToken cancellationToken)
    {
        var result = await loanService.GetLoansAsync(searchParams, cancellationToken);
        return Ok(ApiResponse<PagedResult<LoanResponse>>.Ok(result));
    }

    [HttpGet("overdue")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<LoanResponse>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<PagedResult<LoanResponse>>>> GetOverdueLoans(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await loanService.GetOverdueLoansAsync(page, pageSize, cancellationToken);
        return Ok(ApiResponse<PagedResult<LoanResponse>>.Ok(result));
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<LoanResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<LoanResponse>>> GetLoanById(
        int id,
        CancellationToken cancellationToken)
    {
        var loan = await loanService.GetByIdAsync(id, cancellationToken);
        if (loan == null)
        {
            return NotFound(ApiResponse<LoanResponse>.Fail($"Loan with ID '{id}' was not found."));
        }

        return Ok(ApiResponse<LoanResponse>.Ok(loan));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<LoanResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<LoanResponse>>> BorrowBook(
        [FromBody] CreateLoanRequest request,
        CancellationToken cancellationToken)
    {
        var validationResult = await createValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            throw new ValidationException(validationResult.Errors);
        }

        var result = await loanService.BorrowAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetLoanById), new { id = result.LoanId }, ApiResponse<LoanResponse>.Ok(result, "Book borrowed successfully."));
    }

    [HttpPost("{id:int}/return")]
    [ProducesResponseType(typeof(ApiResponse<ReturnLoanResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<ReturnLoanResponse>>> ReturnBook(
        int id,
        CancellationToken cancellationToken)
    {
        var result = await loanService.ReturnAsync(id, cancellationToken);
        var message = result.HasFine
            ? $"Book returned with an overdue fine of Rs. {result.FineAmount:F2} ({result.OverdueDays} days overdue)."
            : "Book returned successfully on time.";

        return Ok(ApiResponse<ReturnLoanResponse>.Ok(result, message));
    }
}
