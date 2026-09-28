using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FluentAssertions;
using LibraryManagement.Application.Configuration;
using LibraryManagement.Infrastructure.Auth;
using LibraryManagement.Tests.Common;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Xunit;

namespace LibraryManagement.Tests;

public class JwtTokenGeneratorTests
{
    private readonly JwtSettings _settings = new()
    {
        SecretKey = "SuperSecretDevelopmentKeyForUnitTestingWithSufficientLength32Bytes!",
        Issuer = "SchoolLibraryTestAPI",
        Audience = "SchoolLibraryTestClient",
        ExpiryInMinutes = 90
    };

    [Fact]
    public void GetExpiration_ReturnsExactTimeFromTimeProvider()
    {
        var fixedTime = new DateTimeOffset(2026, 10, 1, 14, 30, 0, TimeSpan.Zero);
        var fakeTime = new FakeTimeProvider(fixedTime);
        var options = Options.Create(_settings);
        var generator = new JwtTokenGenerator(options, fakeTime);

        var expiration = generator.GetExpiration();

        expiration.Should().Be(fixedTime.UtcDateTime.AddMinutes(90));
    }

    [Fact]
    public void GenerateToken_ProducesValidJwtWithExpectedClaimsAndLifetime()
    {
        var fixedTime = new DateTimeOffset(2026, 10, 1, 10, 0, 0, TimeSpan.Zero);
        var fakeTime = new FakeTimeProvider(fixedTime);
        var options = Options.Create(_settings);
        var generator = new JwtTokenGenerator(options, fakeTime);

        var tokenString = generator.GenerateToken(42, "librarian@library.org", "Jane Librarian");

        tokenString.Should().NotBeNullOrWhiteSpace();

        // Validate token structure and claims
        var tokenHandler = new JwtSecurityTokenHandler();
        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = _settings.Issuer,
            ValidateAudience = true,
            ValidAudience = _settings.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.SecretKey)),
            ValidateLifetime = false // Checked explicitly below
        };

        var principal = tokenHandler.ValidateToken(tokenString, validationParameters, out var validatedToken);
        var jwtToken = validatedToken as JwtSecurityToken;

        jwtToken.Should().NotBeNull();
        jwtToken!.Issuer.Should().Be("SchoolLibraryTestAPI");
        jwtToken.Audiences.Should().Contain("SchoolLibraryTestClient");

        // Verify claims
        principal.FindFirst(ClaimTypes.NameIdentifier)?.Value.Should().Be("42");
        principal.FindFirst(ClaimTypes.Name)?.Value.Should().Be("Jane Librarian");
        principal.FindFirst(JwtRegisteredClaimNames.Email)?.Value.Should().Be("librarian@library.org");
        principal.FindFirst(ClaimTypes.Role)?.Value.Should().Be("Librarian");

        // Verify expiration
        jwtToken.ValidTo.Should().BeCloseTo(fixedTime.UtcDateTime.AddMinutes(90), TimeSpan.FromSeconds(1));
    }
}
