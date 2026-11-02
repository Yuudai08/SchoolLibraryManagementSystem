using System.Text;
using LibraryManagement.Application.Configuration;
using LibraryManagement.Application.Interfaces.Auth;
using LibraryManagement.Application.Interfaces.QueryServices;
using LibraryManagement.Application.Interfaces.Repositories;
using LibraryManagement.Infrastructure.Auth;
using LibraryManagement.Infrastructure.Data;
using LibraryManagement.Infrastructure.Data.Seed;
using LibraryManagement.Infrastructure.Queries;
using LibraryManagement.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace LibraryManagement.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // 1. Database & EF Core
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

        services.AddDbContext<LibraryDbContext>(options =>
            options.UseSqlServer(connectionString)
                   .ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning)));

        // 2. Dapper connection factory
        services.AddSingleton<ISqlConnectionFactory, SqlConnectionFactory>();

        // 3. Unit of Work & EF Core Repositories
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<IBookRepository, BookRepository>();
        services.AddScoped<IStudentRepository, StudentRepository>();
        services.AddScoped<ILoanRepository, LoanRepository>();
        services.AddScoped<IFineRepository, FineRepository>();

        // 4. Dapper Query Services
        services.AddScoped<IBookQueryService, BookQueryService>();
        services.AddScoped<IDashboardQueryService, DashboardQueryService>();
        services.AddScoped<IReportQueryService, ReportQueryService>();
        services.AddScoped<ILoanQueryService, LoanQueryService>();
        services.AddScoped<IStudentQueryService, StudentQueryService>();
        services.AddScoped<IFineQueryService, FineQueryService>();

        // 5. Auth Infrastructure
        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();

        // 6. Data Seeder
        services.AddScoped<DataSeeder>();

        // 7. JWT Authentication Options & Validation
        services.AddOptions<JwtSettings>()
            .BindConfiguration(JwtSettings.SectionName)
            .Validate(settings => !string.IsNullOrWhiteSpace(settings.SecretKey) && settings.SecretKey.Length >= 32,
                "JwtSettings:SecretKey must be configured and at least 32 characters long.")
            .Validate(settings => !string.IsNullOrWhiteSpace(settings.Issuer), "JwtSettings:Issuer must be configured.")
            .Validate(settings => !string.IsNullOrWhiteSpace(settings.Audience), "JwtSettings:Audience must be configured.")
            .Validate(settings => settings.ExpiryInMinutes > 0, "JwtSettings:ExpiryInMinutes must be greater than 0.")
            .ValidateOnStart();

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer();

        services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
            .Configure<Microsoft.Extensions.Options.IOptions<JwtSettings>>((options, jwtSettingsOptions) =>
            {
                var jwt = jwtSettingsOptions.Value;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwt.Issuer,
                    ValidAudience = jwt.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SecretKey)),
                    ClockSkew = TimeSpan.Zero
                };
            });

        services.AddAuthorization();

        return services;
    }
}
