using LibraryManagement.Application.DTOs.Common;
using LibraryManagement.Application.DTOs.Students;
using LibraryManagement.Application.Exceptions;
using LibraryManagement.Application.Interfaces.QueryServices;
using LibraryManagement.Application.Interfaces.Repositories;
using LibraryManagement.Application.Interfaces.Services;
using LibraryManagement.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace LibraryManagement.Application.Services;

public class StudentService(
    IStudentRepository studentRepository,
    IStudentQueryService studentQueryService,
    IUnitOfWork unitOfWork,
    ILogger<StudentService> logger,
    TimeProvider? timeProvider = null) : IStudentService
{
    private readonly TimeProvider _timeProvider = timeProvider ?? TimeProvider.System;
    public async Task<StudentResponse> CreateAsync(CreateStudentRequest request, CancellationToken cancellationToken = default)
    {
        if (await studentRepository.ExistsByStudentNumberAsync(request.StudentNumber, cancellationToken: cancellationToken))
        {
            throw new ConflictException($"A student with number '{request.StudentNumber}' already exists.");
        }

        if (!string.IsNullOrEmpty(request.Email) &&
            await studentRepository.ExistsByEmailAsync(request.Email, cancellationToken: cancellationToken))
        {
            throw new ConflictException($"A student with email '{request.Email}' already exists.");
        }

        var student = new Student
        {
            StudentNumber = request.StudentNumber,
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            Phone = request.Phone,
            Department = request.Department,
            Year = request.Year,
            IsActive = true,
            CreatedAt = _timeProvider.GetUtcNow().UtcDateTime
        };

        await studentRepository.CreateAsync(student, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Student created: {Name} (ID: {StudentId})", student.FullName, student.StudentId);

        return await studentQueryService.GetStudentDetailAsync(student.StudentId, cancellationToken)
            ?? throw new NotFoundException("Student", student.StudentId);
    }

    public async Task<StudentResponse> UpdateAsync(int id, UpdateStudentRequest request, CancellationToken cancellationToken = default)
    {
        var student = await studentRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Student", id);

        if (await studentRepository.ExistsByStudentNumberAsync(request.StudentNumber, excludeId: id, cancellationToken: cancellationToken))
        {
            throw new ConflictException($"A student with number '{request.StudentNumber}' already exists.");
        }

        if (!string.IsNullOrEmpty(request.Email) &&
            await studentRepository.ExistsByEmailAsync(request.Email, excludeId: id, cancellationToken: cancellationToken))
        {
            throw new ConflictException($"A student with email '{request.Email}' already exists.");
        }

        student.StudentNumber = request.StudentNumber;
        student.FirstName = request.FirstName;
        student.LastName = request.LastName;
        student.Email = request.Email;
        student.Phone = request.Phone;
        student.Department = request.Department;
        student.Year = request.Year;
        student.IsActive = request.IsActive;
        student.UpdatedAt = _timeProvider.GetUtcNow().UtcDateTime;

        await studentRepository.UpdateAsync(student, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Student updated: {Name} (ID: {StudentId})", student.FullName, id);

        return await studentQueryService.GetStudentDetailAsync(id, cancellationToken)
            ?? throw new NotFoundException("Student", id);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var student = await studentRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Student", id);

        if (await studentRepository.HasLoansAsync(id, cancellationToken))
        {
            throw new ConflictException("Cannot delete a student who has loan records. Deactivate the student instead.");
        }

        await studentRepository.DeleteAsync(student, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Student deleted: {Name} (ID: {StudentId})", student.FullName, id);
    }

    public async Task<StudentResponse?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await studentQueryService.GetStudentDetailAsync(id, cancellationToken);
    }

    public async Task<PagedResult<StudentListResponse>> SearchAsync(StudentSearchParams searchParams, CancellationToken cancellationToken = default)
    {
        return await studentQueryService.SearchStudentsAsync(searchParams, cancellationToken);
    }
}
