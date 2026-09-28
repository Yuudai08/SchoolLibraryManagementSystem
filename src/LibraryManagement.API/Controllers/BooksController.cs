using FluentValidation;
using LibraryManagement.Application.DTOs.Books;
using LibraryManagement.Application.DTOs.Common;
using LibraryManagement.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LibraryManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BooksController(
    IBookService bookService,
    IValidator<CreateBookRequest> createValidator,
    IValidator<UpdateBookRequest> updateValidator) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<BookListResponse>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<PagedResult<BookListResponse>>>> GetBooks(
        [FromQuery] BookSearchParams searchParams,
        CancellationToken cancellationToken)
    {
        var result = await bookService.SearchAsync(searchParams, cancellationToken);
        return Ok(ApiResponse<PagedResult<BookListResponse>>.Ok(result));
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<BookResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<BookResponse>>> GetBookById(
        int id,
        CancellationToken cancellationToken)
    {
        var book = await bookService.GetByIdAsync(id, cancellationToken);
        if (book == null)
        {
            return NotFound(ApiResponse<BookResponse>.Fail($"Book with ID '{id}' was not found."));
        }

        return Ok(ApiResponse<BookResponse>.Ok(book));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<BookResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<BookResponse>>> CreateBook(
        [FromBody] CreateBookRequest request,
        CancellationToken cancellationToken)
    {
        var validationResult = await createValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            throw new ValidationException(validationResult.Errors);
        }

        var result = await bookService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetBookById), new { id = result.BookId }, ApiResponse<BookResponse>.Ok(result, "Book created successfully."));
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<BookResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<BookResponse>>> UpdateBook(
        int id,
        [FromBody] UpdateBookRequest request,
        CancellationToken cancellationToken)
    {
        var validationResult = await updateValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            throw new ValidationException(validationResult.Errors);
        }

        var result = await bookService.UpdateAsync(id, request, cancellationToken);
        return Ok(ApiResponse<BookResponse>.Ok(result, "Book updated successfully."));
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<string>>> DeleteBook(
        int id,
        CancellationToken cancellationToken)
    {
        await bookService.DeleteAsync(id, cancellationToken);
        return Ok(ApiResponse<string>.Ok("Book deleted successfully."));
    }
}
