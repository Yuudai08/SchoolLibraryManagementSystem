using FluentValidation;
using LibraryManagement.Application.DTOs.Common;
using LibraryManagement.Application.DTOs.Loans;
using LibraryManagement.Application.DTOs.Students;
using LibraryManagement.Application.Interfaces.QueryServices;
using LibraryManagement.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LibraryManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StudentsController(
    IStudentService studentService,
    ILoanQueryService loanQueryService,
    IValidator<CreateStudentRequest> createValidator,
    IValidator<UpdateStudentRequest> updateValidator) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<StudentListResponse>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<PagedResult<StudentListResponse>>>> GetStudents(
        [FromQuery] StudentSearchParams searchParams,
        CancellationToken cancellationToken)
    {
        var result = await studentService.SearchAsync(searchParams, cancellationToken);
        return Ok(ApiResponse<PagedResult<StudentListResponse>>.Ok(result));
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<StudentResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<StudentResponse>>> GetStudentById(
        int id,
        CancellationToken cancellationToken)
    {
        var student = await studentService.GetByIdAsync(id, cancellationToken);
        if (student == null)
        {
            return NotFound(ApiResponse<StudentResponse>.Fail($"Student with ID '{id}' was not found."));
        }

        return Ok(ApiResponse<StudentResponse>.Ok(student));
    }

    [HttpGet("{id:int}/loans")]
    [ProducesResponseType(typeof(ApiResponse<List<LoanResponse>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<LoanResponse>>>> GetActiveLoansByStudent(
        int id,
        CancellationToken cancellationToken)
    {
        var loans = await loanQueryService.GetActiveLoansByStudentAsync(id, cancellationToken);
        return Ok(ApiResponse<List<LoanResponse>>.Ok(loans));
    }

    [HttpGet("{id:int}/history")]
    [ProducesResponseType(typeof(ApiResponse<List<LoanResponse>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<LoanResponse>>>> GetLoanHistoryByStudent(
        int id,
        CancellationToken cancellationToken)
    {
        var history = await loanQueryService.GetLoanHistoryByStudentAsync(id, cancellationToken);
        return Ok(ApiResponse<List<LoanResponse>>.Ok(history));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<StudentResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<StudentResponse>>> CreateStudent(
        [FromBody] CreateStudentRequest request,
        CancellationToken cancellationToken)
    {
        var validationResult = await createValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            throw new ValidationException(validationResult.Errors);
        }

        var result = await studentService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetStudentById), new { id = result.StudentId }, ApiResponse<StudentResponse>.Ok(result, "Student created successfully."));
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<StudentResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<StudentResponse>>> UpdateStudent(
        int id,
        [FromBody] UpdateStudentRequest request,
        CancellationToken cancellationToken)
    {
        var validationResult = await updateValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            throw new ValidationException(validationResult.Errors);
        }

        var result = await studentService.UpdateAsync(id, request, cancellationToken);
        return Ok(ApiResponse<StudentResponse>.Ok(result, "Student updated successfully."));
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<string>>> DeleteStudent(
        int id,
        CancellationToken cancellationToken)
    {
        await studentService.DeleteAsync(id, cancellationToken);
        return Ok(ApiResponse<string>.Ok("Student deleted successfully."));
    }
}
