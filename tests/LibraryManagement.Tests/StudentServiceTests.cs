using FluentAssertions;
using LibraryManagement.Application.DTOs.Students;
using LibraryManagement.Application.Exceptions;
using LibraryManagement.Application.Interfaces.QueryServices;
using LibraryManagement.Application.Interfaces.Repositories;
using LibraryManagement.Application.Services;
using LibraryManagement.Domain.Entities;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace LibraryManagement.Tests;

public class StudentServiceTests
{
    private readonly Mock<IStudentRepository> _studentRepoMock = new();
    private readonly Mock<IStudentQueryService> _studentQueryMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();
    private readonly Mock<ILogger<StudentService>> _loggerMock = new();

    private readonly StudentService _sut;

    public StudentServiceTests()
    {
        _sut = new StudentService(
            _studentRepoMock.Object,
            _studentQueryMock.Object,
            _unitOfWorkMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task CreateAsync_WhenStudentNumberExists_ThrowsConflictException()
    {
        _studentRepoMock.Setup(s => s.ExistsByStudentNumberAsync("STU001", null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var request = new CreateStudentRequest
        {
            StudentNumber = "STU001",
            FirstName = "John",
            LastName = "Doe"
        };

        var act = () => _sut.CreateAsync(request);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*STU001*already exists*");
    }

    [Fact]
    public async Task CreateAsync_WhenEmailExists_ThrowsConflictException()
    {
        _studentRepoMock.Setup(s => s.ExistsByStudentNumberAsync("STU001", null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _studentRepoMock.Setup(s => s.ExistsByEmailAsync("john@school.edu", null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var request = new CreateStudentRequest
        {
            StudentNumber = "STU001",
            FirstName = "John",
            LastName = "Doe",
            Email = "john@school.edu"
        };

        var act = () => _sut.CreateAsync(request);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*john@school.edu*already exists*");
    }

    [Fact]
    public async Task CreateAsync_WhenValid_SavesStudentAndReturnsDetail()
    {
        _studentRepoMock.Setup(s => s.ExistsByStudentNumberAsync("STU001", null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _studentRepoMock.Setup(s => s.ExistsByEmailAsync("john@school.edu", null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _studentRepoMock.Setup(s => s.CreateAsync(It.IsAny<Student>(), It.IsAny<CancellationToken>()))
            .Callback<Student, CancellationToken>((s, _) => s.StudentId = 5)
            .ReturnsAsync((Student s, CancellationToken _) => s);

        _studentQueryMock.Setup(q => q.GetStudentDetailAsync(5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new StudentResponse
            {
                StudentId = 5,
                StudentNumber = "STU001",
                FirstName = "John",
                LastName = "Doe",
                Email = "john@school.edu",
                IsActive = true
            });

        var request = new CreateStudentRequest
        {
            StudentNumber = "STU001",
            FirstName = "John",
            LastName = "Doe",
            Email = "john@school.edu"
        };

        var result = await _sut.CreateAsync(request);

        result.Should().NotBeNull();
        result.StudentId.Should().Be(5);
        result.StudentNumber.Should().Be("STU001");
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_WhenStudentHasLoans_ThrowsConflictException()
    {
        var student = new Student { StudentId = 1, FirstName = "Jane", LastName = "Doe" };
        _studentRepoMock.Setup(s => s.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(student);
        _studentRepoMock.Setup(s => s.HasLoansAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var act = () => _sut.DeleteAsync(1);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*loan records*Deactivate*");
    }

    [Fact]
    public async Task DeleteAsync_WhenStudentHasNoLoans_DeletesSuccessfully()
    {
        var student = new Student { StudentId = 1, FirstName = "Jane", LastName = "Doe" };
        _studentRepoMock.Setup(s => s.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(student);
        _studentRepoMock.Setup(s => s.HasLoansAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        await _sut.DeleteAsync(1);

        _studentRepoMock.Verify(s => s.DeleteAsync(student, It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SearchAsync_DelegatesToStudentQueryService()
    {
        var searchParams = new StudentSearchParams { Search = "Bisesh Pandey", Page = 1, PageSize = 10 };
        var expectedResult = new LibraryManagement.Application.DTOs.Common.PagedResult<StudentListResponse>
        {
            Items = new List<StudentListResponse>
            {
                new() { StudentId = 9, StudentNumber = "STU-2024-009", FirstName = "Bisesh", LastName = "Pandey" }
            },
            TotalCount = 1,
            Page = 1,
            PageSize = 10
        };

        _studentQueryMock.Setup(q => q.SearchStudentsAsync(searchParams, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResult);

        var result = await _sut.SearchAsync(searchParams);

        result.Should().BeEquivalentTo(expectedResult);
        _studentQueryMock.Verify(q => q.SearchStudentsAsync(searchParams, It.IsAny<CancellationToken>()), Times.Once);
    }
}
