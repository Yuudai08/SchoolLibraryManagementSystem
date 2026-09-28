using LibraryManagement.Application.Interfaces.Repositories;
using LibraryManagement.Domain.Entities;
using LibraryManagement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LibraryManagement.Infrastructure.Repositories;

public class StudentRepository(LibraryDbContext context) : IStudentRepository
{
    public async Task<Student?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await context.Students
            .FirstOrDefaultAsync(s => s.StudentId == id, cancellationToken);
    }

    public async Task<Student> CreateAsync(Student student, CancellationToken cancellationToken = default)
    {
        await context.Students.AddAsync(student, cancellationToken);
        return student;
    }

    public Task UpdateAsync(Student student, CancellationToken cancellationToken = default)
    {
        context.Students.Update(student);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(Student student, CancellationToken cancellationToken = default)
    {
        context.Students.Remove(student);
        return Task.CompletedTask;
    }

    public async Task<bool> ExistsByStudentNumberAsync(string studentNumber, int? excludeId = null, CancellationToken cancellationToken = default)
    {
        return await context.Students
            .AnyAsync(s => s.StudentNumber == studentNumber && (!excludeId.HasValue || s.StudentId != excludeId.Value), cancellationToken);
    }

    public async Task<bool> ExistsByEmailAsync(string email, int? excludeId = null, CancellationToken cancellationToken = default)
    {
        return await context.Students
            .AnyAsync(s => s.Email == email && (!excludeId.HasValue || s.StudentId != excludeId.Value), cancellationToken);
    }

    public async Task<bool> HasLoansAsync(int studentId, CancellationToken cancellationToken = default)
    {
        return await context.Loans
            .AnyAsync(l => l.StudentId == studentId, cancellationToken);
    }
}
