using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using LibraryManagement.Application.Configuration;
using LibraryManagement.Application.Interfaces.Auth;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace LibraryManagement.Infrastructure.Auth;

public class JwtTokenGenerator(
    IOptions<JwtSettings> jwtSettings,
    TimeProvider? timeProvider = null) : IJwtTokenGenerator
{
    private readonly JwtSettings _jwtSettings = jwtSettings.Value;
    private readonly TimeProvider _timeProvider = timeProvider ?? TimeProvider.System;

    public string GenerateToken(int userId, string email, string fullName)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_jwtSettings.SecretKey);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(JwtRegisteredClaimNames.Email, email),
            new(JwtRegisteredClaimNames.Name, fullName),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Name, fullName),
            new(ClaimTypes.Role, "Librarian")
        };

        var now = _timeProvider.GetUtcNow().UtcDateTime;

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            NotBefore = now,
            IssuedAt = now,
            Expires = GetExpiration(),
            Issuer = _jwtSettings.Issuer,
            Audience = _jwtSettings.Audience,
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public DateTime GetExpiration()
    {
        return _timeProvider.GetUtcNow().UtcDateTime.AddMinutes(_jwtSettings.ExpiryInMinutes);
    }
}
