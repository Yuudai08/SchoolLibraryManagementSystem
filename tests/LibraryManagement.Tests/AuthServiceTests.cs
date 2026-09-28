using FluentAssertions;
using LibraryManagement.Application.DTOs.Auth;
using LibraryManagement.Application.Exceptions;
using LibraryManagement.Application.Interfaces.Auth;
using LibraryManagement.Application.Interfaces.Repositories;
using LibraryManagement.Application.Services;
using LibraryManagement.Domain.Entities;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace LibraryManagement.Tests;

public class AuthServiceTests
{
    private readonly Mock<IUserRepository> _userRepoMock = new();
    private readonly Mock<IJwtTokenGenerator> _jwtGenMock = new();
    private readonly Mock<IPasswordHasher> _passwordHasherMock = new();
    private readonly Mock<ILogger<AuthService>> _loggerMock = new();

    private readonly AuthService _sut;

    public AuthServiceTests()
    {
        _sut = new AuthService(
            _userRepoMock.Object,
            _jwtGenMock.Object,
            _passwordHasherMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task LoginAsync_WhenUserNotFound_ThrowsUnauthorizedException()
    {
        _userRepoMock.Setup(u => u.GetByEmailAsync("unknown@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        var request = new LoginRequest { Email = "unknown@example.com", Password = "password" };

        var act = () => _sut.LoginAsync(request);

        await act.Should().ThrowAsync<UnauthorizedException>()
            .WithMessage("*Invalid email or password*");
    }

    [Fact]
    public async Task LoginAsync_WhenPasswordInvalid_ThrowsUnauthorizedException()
    {
        var user = new User { Id = 1, Email = "librarian@example.com", PasswordHash = "hashed" };

        _userRepoMock.Setup(u => u.GetByEmailAsync("librarian@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _passwordHasherMock.Setup(p => p.Verify("wrong_pass", "hashed"))
            .Returns(false);

        var request = new LoginRequest { Email = "librarian@example.com", Password = "wrong_pass" };

        var act = () => _sut.LoginAsync(request);

        await act.Should().ThrowAsync<UnauthorizedException>()
            .WithMessage("*Invalid email or password*");
    }

    [Fact]
    public async Task LoginAsync_WhenCredentialsValid_ReturnsToken()
    {
        var user = new User { Id = 1, Email = "librarian@example.com", FullName = "Head Librarian", PasswordHash = "hashed" };
        var expiration = DateTime.UtcNow.AddHours(2);

        _userRepoMock.Setup(u => u.GetByEmailAsync("librarian@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _passwordHasherMock.Setup(p => p.Verify("Library@123", "hashed"))
            .Returns(true);

        _jwtGenMock.Setup(g => g.GenerateToken(1, "librarian@example.com", "Head Librarian"))
            .Returns("fake_jwt_token");

        _jwtGenMock.Setup(g => g.GetExpiration())
            .Returns(expiration);

        var request = new LoginRequest { Email = "librarian@example.com", Password = "Library@123" };

        var result = await _sut.LoginAsync(request);

        result.Should().NotBeNull();
        result.Token.Should().Be("fake_jwt_token");
        result.Email.Should().Be("librarian@example.com");
        result.FullName.Should().Be("Head Librarian");
        result.ExpiresAt.Should().Be(expiration);
    }
}
