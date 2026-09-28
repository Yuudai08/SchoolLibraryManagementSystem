using FluentAssertions;
using LibraryManagement.Application.Configuration;
using LibraryManagement.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Xunit;

namespace LibraryManagement.Tests;

public class OptionsValidationTests
{
    [Fact]
    public void JwtSettings_WhenSecretKeyIsEmpty_ThrowsOptionsValidationException()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:SecretKey"] = "",
                ["JwtSettings:Issuer"] = "SchoolLibraryAPI",
                ["JwtSettings:Audience"] = "SchoolLibraryClient",
                ["JwtSettings:ExpiryInMinutes"] = "120"
            })
            .Build();

        var services = new ServiceCollection();
        services.AddOptions<JwtSettings>()
            .Bind(configuration.GetSection(JwtSettings.SectionName))
            .Validate(settings => !string.IsNullOrWhiteSpace(settings.SecretKey) && settings.SecretKey.Length >= 32,
                "JwtSettings:SecretKey must be configured and at least 32 characters long.")
            .Validate(settings => !string.IsNullOrWhiteSpace(settings.Issuer), "JwtSettings:Issuer must be configured.")
            .Validate(settings => !string.IsNullOrWhiteSpace(settings.Audience), "JwtSettings:Audience must be configured.")
            .Validate(settings => settings.ExpiryInMinutes > 0, "JwtSettings:ExpiryInMinutes must be greater than 0.");

        var provider = services.BuildServiceProvider();
        var act = () => provider.GetRequiredService<IOptions<JwtSettings>>().Value;

        act.Should().Throw<OptionsValidationException>()
            .WithMessage("*JwtSettings:SecretKey must be configured and at least 32 characters long*");
    }

    [Fact]
    public void JwtSettings_WhenSecretKeyIsShorterThan32Characters_ThrowsOptionsValidationException()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:SecretKey"] = "too-short-key",
                ["JwtSettings:Issuer"] = "SchoolLibraryAPI",
                ["JwtSettings:Audience"] = "SchoolLibraryClient",
                ["JwtSettings:ExpiryInMinutes"] = "120"
            })
            .Build();

        var services = new ServiceCollection();
        services.AddOptions<JwtSettings>()
            .Bind(configuration.GetSection(JwtSettings.SectionName))
            .Validate(settings => !string.IsNullOrWhiteSpace(settings.SecretKey) && settings.SecretKey.Length >= 32,
                "JwtSettings:SecretKey must be configured and at least 32 characters long.")
            .Validate(settings => !string.IsNullOrWhiteSpace(settings.Issuer), "JwtSettings:Issuer must be configured.")
            .Validate(settings => !string.IsNullOrWhiteSpace(settings.Audience), "JwtSettings:Audience must be configured.")
            .Validate(settings => settings.ExpiryInMinutes > 0, "JwtSettings:ExpiryInMinutes must be greater than 0.");

        var provider = services.BuildServiceProvider();
        var act = () => provider.GetRequiredService<IOptions<JwtSettings>>().Value;

        act.Should().Throw<OptionsValidationException>()
            .WithMessage("*JwtSettings:SecretKey must be configured and at least 32 characters long*");
    }

    [Fact]
    public void JwtSettings_WhenValid_ResolvesSuccessfully()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:SecretKey"] = "ThisIsAValid32PlusCharactersSecretKeyForJwtAuthentication!",
                ["JwtSettings:Issuer"] = "SchoolLibraryAPI",
                ["JwtSettings:Audience"] = "SchoolLibraryClient",
                ["JwtSettings:ExpiryInMinutes"] = "60"
            })
            .Build();

        var services = new ServiceCollection();
        services.AddOptions<JwtSettings>()
            .Bind(configuration.GetSection(JwtSettings.SectionName))
            .Validate(settings => !string.IsNullOrWhiteSpace(settings.SecretKey) && settings.SecretKey.Length >= 32,
                "JwtSettings:SecretKey must be configured and at least 32 characters long.")
            .Validate(settings => !string.IsNullOrWhiteSpace(settings.Issuer), "JwtSettings:Issuer must be configured.")
            .Validate(settings => !string.IsNullOrWhiteSpace(settings.Audience), "JwtSettings:Audience must be configured.")
            .Validate(settings => settings.ExpiryInMinutes > 0, "JwtSettings:ExpiryInMinutes must be greater than 0.");

        var provider = services.BuildServiceProvider();
        var options = provider.GetRequiredService<IOptions<JwtSettings>>().Value;

        options.SecretKey.Should().Be("ThisIsAValid32PlusCharactersSecretKeyForJwtAuthentication!");
        options.Issuer.Should().Be("SchoolLibraryAPI");
        options.Audience.Should().Be("SchoolLibraryClient");
        options.ExpiryInMinutes.Should().Be(60);
    }

    [Fact]
    public void LibrarySettings_WhenMaxActiveLoansZeroOrNegative_ThrowsOptionsValidationException()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["LibrarySettings:MaxActiveLoans"] = "0",
                ["LibrarySettings:FinePerDay"] = "5.0",
                ["LibrarySettings:DefaultLoanDays"] = "14"
            })
            .Build();

        var services = new ServiceCollection();
        services.AddOptions<LibrarySettings>()
            .Bind(configuration.GetSection(LibrarySettings.SectionName))
            .Validate(settings => settings.MaxActiveLoans > 0, "LibrarySettings:MaxActiveLoans must be greater than 0.")
            .Validate(settings => settings.FinePerDay >= 0, "LibrarySettings:FinePerDay cannot be negative.")
            .Validate(settings => settings.DefaultLoanDays > 0, "LibrarySettings:DefaultLoanDays must be greater than 0.");

        var provider = services.BuildServiceProvider();
        var act = () => provider.GetRequiredService<IOptions<LibrarySettings>>().Value;

        act.Should().Throw<OptionsValidationException>()
            .WithMessage("*LibrarySettings:MaxActiveLoans must be greater than 0*");
    }

    [Fact]
    public void LibrarySettings_WhenFinePerDayNegative_ThrowsOptionsValidationException()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["LibrarySettings:MaxActiveLoans"] = "5",
                ["LibrarySettings:FinePerDay"] = "-2.5",
                ["LibrarySettings:DefaultLoanDays"] = "14"
            })
            .Build();

        var services = new ServiceCollection();
        services.AddOptions<LibrarySettings>()
            .Bind(configuration.GetSection(LibrarySettings.SectionName))
            .Validate(settings => settings.MaxActiveLoans > 0, "LibrarySettings:MaxActiveLoans must be greater than 0.")
            .Validate(settings => settings.FinePerDay >= 0, "LibrarySettings:FinePerDay cannot be negative.")
            .Validate(settings => settings.DefaultLoanDays > 0, "LibrarySettings:DefaultLoanDays must be greater than 0.");

        var provider = services.BuildServiceProvider();
        var act = () => provider.GetRequiredService<IOptions<LibrarySettings>>().Value;

        act.Should().Throw<OptionsValidationException>()
            .WithMessage("*LibrarySettings:FinePerDay cannot be negative*");
    }
}
