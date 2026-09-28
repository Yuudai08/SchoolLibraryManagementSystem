using FluentValidation;
using LibraryManagement.Application.DTOs.Auth;
using LibraryManagement.Application.DTOs.Books;
using LibraryManagement.Application.DTOs.Categories;
using LibraryManagement.Application.DTOs.Loans;
using LibraryManagement.Application.DTOs.Students;

namespace LibraryManagement.Application.Validators;

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Invalid email format.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.");
    }
}

public class CreateBookRequestValidator : AbstractValidator<CreateBookRequest>
{
    public CreateBookRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters.");

        RuleFor(x => x.Author)
            .NotEmpty().WithMessage("Author is required.")
            .MaximumLength(200).WithMessage("Author must not exceed 200 characters.");

        RuleFor(x => x.ISBN)
            .MaximumLength(20).WithMessage("ISBN must not exceed 20 characters.")
            .When(x => !string.IsNullOrEmpty(x.ISBN));

        RuleFor(x => x.CategoryId)
            .GreaterThan(0).WithMessage("Category is required.");

        RuleFor(x => x.TotalCopies)
            .GreaterThanOrEqualTo(0).WithMessage("Total copies must be 0 or greater.");

        RuleFor(x => x.AvailableCopies)
            .GreaterThanOrEqualTo(0).WithMessage("Available copies must be 0 or greater.")
            .LessThanOrEqualTo(x => x.TotalCopies).WithMessage("Available copies cannot exceed total copies.");
    }
}

public class UpdateBookRequestValidator : AbstractValidator<UpdateBookRequest>
{
    public UpdateBookRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters.");

        RuleFor(x => x.Author)
            .NotEmpty().WithMessage("Author is required.")
            .MaximumLength(200).WithMessage("Author must not exceed 200 characters.");

        RuleFor(x => x.ISBN)
            .MaximumLength(20).WithMessage("ISBN must not exceed 20 characters.")
            .When(x => !string.IsNullOrEmpty(x.ISBN));

        RuleFor(x => x.CategoryId)
            .GreaterThan(0).WithMessage("Category is required.");

        RuleFor(x => x.TotalCopies)
            .GreaterThanOrEqualTo(0).WithMessage("Total copies must be 0 or greater.");

        RuleFor(x => x.AvailableCopies)
            .GreaterThanOrEqualTo(0).WithMessage("Available copies must be 0 or greater.")
            .LessThanOrEqualTo(x => x.TotalCopies).WithMessage("Available copies cannot exceed total copies.");
    }
}

public class CreateCategoryRequestValidator : AbstractValidator<CreateCategoryRequest>
{
    public CreateCategoryRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Category name is required.")
            .MaximumLength(100).WithMessage("Category name must not exceed 100 characters.");
    }
}

public class UpdateCategoryRequestValidator : AbstractValidator<UpdateCategoryRequest>
{
    public UpdateCategoryRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Category name is required.")
            .MaximumLength(100).WithMessage("Category name must not exceed 100 characters.");
    }
}

public class CreateStudentRequestValidator : AbstractValidator<CreateStudentRequest>
{
    public CreateStudentRequestValidator()
    {
        RuleFor(x => x.StudentNumber)
            .NotEmpty().WithMessage("Student number is required.")
            .MaximumLength(20).WithMessage("Student number must not exceed 20 characters.");

        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("First name is required.")
            .MaximumLength(100).WithMessage("First name must not exceed 100 characters.");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Last name is required.")
            .MaximumLength(100).WithMessage("Last name must not exceed 100 characters.");

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Invalid email format.")
            .When(x => !string.IsNullOrEmpty(x.Email));
    }
}

public class UpdateStudentRequestValidator : AbstractValidator<UpdateStudentRequest>
{
    public UpdateStudentRequestValidator()
    {
        RuleFor(x => x.StudentNumber)
            .NotEmpty().WithMessage("Student number is required.")
            .MaximumLength(20).WithMessage("Student number must not exceed 20 characters.");

        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("First name is required.")
            .MaximumLength(100).WithMessage("First name must not exceed 100 characters.");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Last name is required.")
            .MaximumLength(100).WithMessage("Last name must not exceed 100 characters.");

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Invalid email format.")
            .When(x => !string.IsNullOrEmpty(x.Email));
    }
}

public class CreateLoanRequestValidator : AbstractValidator<CreateLoanRequest>
{
    public CreateLoanRequestValidator(TimeProvider? timeProvider = null)
    {
        var provider = timeProvider ?? TimeProvider.System;

        RuleFor(x => x.BookId)
            .GreaterThan(0).WithMessage("Book is required.");

        RuleFor(x => x.StudentId)
            .GreaterThan(0).WithMessage("Student is required.");

        RuleFor(x => x.DueDate)
            .Must((_, dueDate) => dueDate.Date > provider.GetUtcNow().UtcDateTime.Date)
            .WithMessage("Due date must be in the future.");
    }
}
