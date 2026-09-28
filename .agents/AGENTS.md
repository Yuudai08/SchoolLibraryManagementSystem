# Developer & Agent Guidelines — School Library System

## Architecture Conventions

This solution strictly adheres to **Clean Architecture** patterns:

1. **Domain Layer (`src/LibraryManagement.Domain`)**:
   - Contains enterprise entities, value objects, and domain enums.
   - Must have **ZERO** external NuGet dependencies or references to other projects.
   - Business invariants (e.g. decrementing copies, validating student borrowing eligibility) should be encapsulated inside domain entities.

2. **Application Layer (`src/LibraryManagement.Application`)**:
   - Contains business interfaces, DTOs, application services, and FluentValidation validators.
   - Depends only on the Domain project.
   - Handled errors throw custom exceptions (`NotFoundException`, `ConflictException`, `ValidationException`).

3. **Infrastructure Layer (`src/LibraryManagement.Infrastructure`)**:
   - Implements database access, external services, and data seeding.
   - **EF Core vs Dapper usage rules**:
     - Use **EF Core** for transactional write operations (Create, Update, Delete, Unit of Work, Borrow/Return state transitions).
     - Use **Dapper** (`src/LibraryManagement.Infrastructure/Queries/`) for read-heavy queries, reports, and search operations requiring high performance and custom SQL projection.

4. **API Layer (`src/LibraryManagement.API`)**:
   - Exposes RESTful controllers.
   - All protected endpoints must have `[Authorize]`.
   - Global exception handling is provided by `GlobalExceptionHandler` mapping domain/application exceptions to standardized `ProblemDetails` and `ApiResponse<T>`.

5. **Frontend (`frontend/`)**:
   - React 19 + TypeScript + Vite.
   - Use **Tailwind CSS** utility classes for styling.
   - Use **TanStack Query (`@tanstack/react-query`)** for all server-state fetching and mutations. Never write manual `useEffect` API fetching loops.
   - Always invalidate relevant query keys (`books`, `students`, `studentActiveLoans`, `dashboardSummary`, `fines`, `loans`) upon mutations.

---

## Directory Organization

```
d:\SchoolLibrary\
├── src/
│   ├── LibraryManagement.Domain/
│   │   ├── Entities/                 # Core domain entities
│   │   ├── Enums/                    # Enums (e.g. LoanStatus)
│   │   └── Exceptions/               # Domain-specific exceptions
│   ├── LibraryManagement.Application/
│   │   ├── DTOs/                     # Data Transfer Objects organized by domain
│   │   ├── Interfaces/               # Service, repository, and query service interfaces
│   │   ├── Services/                 # Application business logic
│   │   └── Validators/               # FluentValidation validators
│   ├── LibraryManagement.Infrastructure/
│   │   ├── Data/                     # DbContext and Fluent API configurations
│   │   ├── Repositories/             # EF Core repository implementations
│   │   ├── Queries/                  # Dapper query service implementations
│   │   └── Seed/                     # Database seed initializers
│   └── LibraryManagement.API/
│       ├── Controllers/              # ASP.NET Core API controllers
│       └── Middleware/               # Exception handlers and custom middleware
├── tests/
│   └── LibraryManagement.Tests/      # xUnit unit and integration tests
└── frontend/
    └── src/
        ├── api/                      # Axios client and API services
        ├── components/               # Layout, common, and domain components
        ├── contexts/                 # AuthContext and state providers
        ├── hooks/                    # Reusable custom hooks
        ├── pages/                    # Route pages (circulation, books, students, etc.)
        ├── types/                    # TypeScript interfaces matching API DTOs
        └── utils/                    # Formatters and CSV export utility
```

---

## Testing Standards

- All new application and domain services must include unit tests under `tests/LibraryManagement.Tests/`.
- Use **xUnit**, **Moq** for dependency mocking, and **FluentAssertions** for expressive assertions.
- Database-dependent repository tests should use the EF Core InMemory provider or mock repositories.
- Run `dotnet test` before submitting changes to ensure all tests pass.
