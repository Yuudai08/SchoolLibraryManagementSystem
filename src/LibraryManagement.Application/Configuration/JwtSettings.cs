namespace LibraryManagement.Application.Configuration;

public class JwtSettings
{
    public const string SectionName = "JwtSettings";

    public string SecretKey { get; set; } = string.Empty;
    public string Issuer { get; set; } = "SchoolLibraryAPI";
    public string Audience { get; set; } = "SchoolLibraryClient";
    public int ExpiryInMinutes { get; set; } = 120;
}
