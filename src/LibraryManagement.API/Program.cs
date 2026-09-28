using LibraryManagement.API.Middleware;
using LibraryManagement.Application;
using LibraryManagement.Application.Configuration;
using LibraryManagement.Infrastructure;
using LibraryManagement.Infrastructure.Data;
using LibraryManagement.Infrastructure.Data.Seed;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. Add Configuration Options & System Services
builder.Services.AddOptions<LibrarySettings>()
    .BindConfiguration(LibrarySettings.SectionName)
    .Validate(settings => settings.MaxActiveLoans > 0, "LibrarySettings:MaxActiveLoans must be greater than 0.")
    .Validate(settings => settings.FinePerDay >= 0, "LibrarySettings:FinePerDay cannot be negative.")
    .Validate(settings => settings.DefaultLoanDays > 0, "LibrarySettings:DefaultLoanDays must be greater than 0.")
    .ValidateOnStart();

builder.Services.AddSingleton(TimeProvider.System);

// 2. Add Clean Architecture Layers
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// 3. Add API Controllers, ProblemDetails & Global Exception Handler
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// 4. Configure Swagger with JWT Bearer Authentication
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "School Library Management API",
        Version = "v1",
        Description = "Clean Architecture REST API for School Library Management with EF Core, Dapper, and JWT Authentication."
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT token."
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// 5. Configure CORS for Frontend Development Server
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// 6. Global Exception Handling via IExceptionHandler
app.UseExceptionHandler();

// 7. Swagger Documentation
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "School Library Management API v1");
    });
}

// 8. Security & Routing Pipeline
app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// 9. Automatic Database Migration and Seed Data
try
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<LibraryDbContext>();
    await dbContext.Database.MigrateAsync();

    var seeder = scope.ServiceProvider.GetRequiredService<DataSeeder>();
    await seeder.SeedAsync();
}
catch (Exception ex)
{
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogWarning(ex, "Could not automatically migrate or seed database on startup. Make sure SQL Server is running.");
}

app.Run();
