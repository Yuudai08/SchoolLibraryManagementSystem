namespace LibraryManagement.Application.Interfaces.Auth;

public interface IJwtTokenGenerator
{
    string GenerateToken(int userId, string email, string fullName);
    DateTime GetExpiration();
}

public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string password, string hash);
}
