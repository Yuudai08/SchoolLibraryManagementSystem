using LibraryManagement.Application.DTOs.Auth;
using LibraryManagement.Application.Exceptions;
using LibraryManagement.Application.Interfaces.Auth;
using LibraryManagement.Application.Interfaces.Repositories;
using LibraryManagement.Application.Interfaces.Services;
using Microsoft.Extensions.Logging;

namespace LibraryManagement.Application.Services;

public class AuthService(
    IUserRepository userRepository,
    IJwtTokenGenerator jwtTokenGenerator,
    IPasswordHasher passwordHasher,
    ILogger<AuthService> logger) : IAuthService
{
    public async Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByEmailAsync(request.Email, cancellationToken);

        if (user == null || !passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            logger.LogWarning("Failed login attempt for email: {Email}", request.Email);
            throw new UnauthorizedException("Invalid email or password.");
        }

        var token = jwtTokenGenerator.GenerateToken(user.Id, user.Email, user.FullName);
        var expiresAt = jwtTokenGenerator.GetExpiration();

        logger.LogInformation("Librarian logged in: {Email}", user.Email);

        return new LoginResponse
        {
            Token = token,
            FullName = user.FullName,
            Email = user.Email,
            ExpiresAt = expiresAt
        };
    }
}
