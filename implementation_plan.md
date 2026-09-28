# Library Management System — Implementation Plan

## Overview

Build a full-stack Library Management System with ASP.NET Core Web API (Clean Architecture, EF Core + Dapper, SQL Server) backend and React + TypeScript (Vite) frontend. Single role: Librarian with JWT authentication.

---

## Phase 1 — Solution & Project Setup

### Backend Solution Structure

```
d:\SchoolLibrary\
├── SchoolLibrary.sln
├── README.md
├── .agents/AGENTS.md
├── src/
│   ├── LibraryManagement.Domain/          (.NET 10 Class Library)
│   ├── LibraryManagement.Application/     (.NET 10 Class Library)
│   ├── LibraryManagement.Infrastructure/  (.NET 10 Class Library)
│   └── LibraryManagement.API/             (.NET 10 Web API)
├── tests/
│   └── LibraryManagement.Tests/           (.NET 10 xUnit)
└── frontend/                              (React + Vite + TypeScript)
```

### Project Dependencies

```
Domain          → (no dependencies)
Application     → Domain
Infrastructure  → Application, Domain
API             → Application, Infrastructure
Tests           → Application, Domain, Infrastructure
```

### NuGet Packages

| Project | Packages |
|---------|----------|
| **Domain** | *(none)* |
| **Application** | FluentValidation |
| **Infrastructure** | Microsoft.EntityFrameworkCore.SqlServer, Dapper, Microsoft.AspNetCore.Authentication.JwtBearer, BCrypt.Net-Next |
| **API** | Swashbuckle.AspNetCore, Serilog (optional — or built-in logging) |
| **Tests** | xUnit, Moq, FluentAssertions, Microsoft.EntityFrameworkCore.InMemory |

### Frontend Packages

| Package | Purpose |
|---------|---------|
| react-router-dom | Client-side Routing |
| axios | HTTP client with JWT interceptor |
| @tanstack/react-query | Server state management, caching & background invalidation |
| tailwindcss, postcss, autoprefixer | Utility-first styling & responsive layout |
| lucide-react | Modern, consistent iconography |
| recharts | Interactive charts for reports and dashboard metrics |
| react-hot-toast | Toast notifications for alerts and mutation feedback |
| clsx, tailwind-merge | Conditional classnames utility |

---

## Phase 2 — Domain Layer

### [NEW] `src/LibraryManagement.Domain/Entities/User.cs`
Librarian entity: `Id`, `FullName`, `Email`, `PasswordHash`, `CreatedAt`

### [NEW] `src/LibraryManagement.Domain/Entities/Category.cs`
`CategoryId`, `Name`, `Description`, `Books` (navigation)

### [NEW] `src/LibraryManagement.Domain/Entities/Book.cs`
`BookId`, `Title`, `Author`, `ISBN`, `Publisher`, `PublicationYear`, `CategoryId`, `Description`, `TotalCopies`, `AvailableCopies`, `CreatedAt`, `UpdatedAt`, `Category` (navigation), `Loans` (navigation)

### [NEW] `src/LibraryManagement.Domain/Entities/Student.cs`
`StudentId`, `StudentNumber`, `FirstName`, `LastName`, `Email`, `Phone`, `Department`, `Year`, `IsActive`, `CreatedAt`, `UpdatedAt`, `Loans` (navigation)

### [NEW] `src/LibraryManagement.Domain/Entities/Loan.cs`
`LoanId`, `BookId`, `StudentId`, `BorrowedDate`, `DueDate`, `ReturnedDate`, `Status`, `CreatedAt`, `UpdatedAt`, `Book`, `Student`, `Fine` (navigation)

### [NEW] `src/LibraryManagement.Domain/Entities/Fine.cs`
`FineId`, `LoanId`, `Amount`, `IsPaid`, `PaidDate`, `CreatedAt`, `Loan` (navigation)

### [NEW] `src/LibraryManagement.Domain/Enums/LoanStatus.cs`
`Borrowed = 0`, `Returned = 1`, `Overdue = 2`

### Domain Business Rules
- `Book`: Method `HasAvailableCopies()`, `DecrementAvailableCopies()`, `IncrementAvailableCopies()` with guard clauses
- `Student`: Method `CanBorrow()` checks `IsActive`
- `Fine`: Static method `Calculate(DateTime dueDate, DateTime returnDate, decimal finePerDay)`

---

## Phase 3 — Infrastructure Layer (Database)

### [NEW] `src/LibraryManagement.Infrastructure/Data/LibraryDbContext.cs`
- DbSets for all entities
- `OnModelCreating` applies configurations

### Entity Configurations (Fluent API)
Each entity gets its own configuration file under `Data/Configurations/`:

| File | Key Constraints |
|------|----------------|
| `UserConfiguration.cs` | Email unique index |
| `CategoryConfiguration.cs` | Name unique index, max lengths |
| `BookConfiguration.cs` | ISBN unique (filtered for non-null), Title/Author indexes, CHECK constraint `AvailableCopies >= 0`, `AvailableCopies <= TotalCopies`, `TotalCopies >= 0` |
| `StudentConfiguration.cs` | StudentNumber unique, Email unique, indexes on StudentNumber/Email |
| `LoanConfiguration.cs` | FK to Book, FK to Student, indexes on StudentId/BookId/Status, composite index |
| `FineConfiguration.cs` | FK to Loan (1:1), Amount precision |

### [NEW] `src/LibraryManagement.Infrastructure/Data/Seed/DataSeeder.cs`
Seed data:
- 1 librarian (`librarian@example.com` / `Library@123`)
- 7 categories (Programming, Database, Networking, Science, Mathematics, Literature, History)
- ~12 books with varying availability
- ~8 students
- ~10 loans (active, returned, overdue mix)
- ~3 fines

### Dapper Query Services
Under `src/LibraryManagement.Infrastructure/Queries/`:

| File | Queries |
|------|---------|
| `BookQueryService.cs` | Search books with pagination, filter by category, book details with category name |
| `DashboardQueryService.cs` | Summary stats (single query with subqueries), recent loans, popular books |
| `ReportQueryService.cs` | Inventory report, borrowing report, overdue report, fine report, popular books |
| `LoanQueryService.cs` | Active loans by student, borrowing history, overdue loans |
| `StudentQueryService.cs` | Search students with active loan count |

### EF Core Repositories
Under `src/LibraryManagement.Infrastructure/Repositories/`:

| File | Operations |
|------|-----------|
| `BookRepository.cs` | CRUD operations |
| `CategoryRepository.cs` | CRUD, check if in use |
| `StudentRepository.cs` | CRUD |
| `LoanRepository.cs` | Create, update (return), find active loans |
| `FineRepository.cs` | Create, update (pay) |
| `UserRepository.cs` | Find by email |

---

## Phase 4 — Application Layer

### DTOs
Under `src/LibraryManagement.Application/DTOs/`:

**Auth:** `LoginRequest`, `LoginResponse`
**Books:** `CreateBookRequest`, `UpdateBookRequest`, `BookResponse`, `BookListResponse`, `BookSearchParams`
**Categories:** `CreateCategoryRequest`, `UpdateCategoryRequest`, `CategoryResponse`
**Students:** `CreateStudentRequest`, `UpdateStudentRequest`, `StudentResponse`, `StudentListResponse`
**Loans:** `CreateLoanRequest`, `LoanResponse`, `ReturnLoanResponse`
**Fines:** `FineResponse`
**Dashboard:** `DashboardSummaryResponse`, `RecentLoanResponse`, `PopularBookResponse`
**Reports:** `InventoryReportItem`, `BorrowingReportItem`, `OverdueReportItem`, `FineReportItem`
**Common:** `PagedResult<T>`, `ApiResponse<T>`, `ApiErrorResponse`

### Interfaces
Under `src/LibraryManagement.Application/Interfaces/`:

**Repositories (EF Core):**
- `IBookRepository`, `ICategoryRepository`, `IStudentRepository`, `ILoanRepository`, `IFineRepository`, `IUserRepository`

**Query Services (Dapper):**
- `IBookQueryService`, `IDashboardQueryService`, `IReportQueryService`, `ILoanQueryService`, `IStudentQueryService`

**Services:**
- `IAuthService`, `IBookService`, `ICategoryService`, `IStudentService`, `ILoanService`, `IFineService`, `IDashboardService`, `IReportService`

**Other:**
- `IJwtTokenGenerator`, `IPasswordHasher`

### Application Services
Under `src/LibraryManagement.Application/Services/`:

| Service | Key Methods |
|---------|-------------|
| `AuthService` | `LoginAsync(LoginRequest)` → validates, generates JWT |
| `BookService` | `CreateAsync`, `UpdateAsync`, `DeleteAsync`, `GetByIdAsync`, `SearchAsync` |
| `CategoryService` | CRUD with "in-use" check on delete |
| `StudentService` | CRUD, deactivate, get with history |
| `LoanService` | `BorrowAsync` (transactional — all 6 checks), `ReturnAsync` (transactional — fine calc) |
| `FineService` | `GetFinesAsync`, `PayFineAsync` |
| `DashboardService` | `GetSummaryAsync`, `GetRecentLoansAsync`, `GetPopularBooksAsync` |
| `ReportService` | All report methods |

### Fine Calculation Logic
Centralized in `src/LibraryManagement.Application/Services/FineCalculator.cs`:
- `CalculateFine(DateTime dueDate, DateTime returnDate, decimal finePerDay)` → `decimal`
- `CalculateCurrentFine(DateTime dueDate, decimal finePerDay)` → `decimal` (for active overdue)
- Configurable `FinePerDay` from `appsettings.json`

### Validators (FluentValidation)
Under `src/LibraryManagement.Application/Validators/`:
- `CreateBookRequestValidator`, `UpdateBookRequestValidator`
- `CreateStudentRequestValidator`, `UpdateStudentRequestValidator`
- `CreateCategoryRequestValidator`
- `CreateLoanRequestValidator`
- `LoginRequestValidator`

### Configuration
- `LibrarySettings` class: `MaxActiveLoans = 5`, `FinePerDay = 5.0m`, `DefaultLoanDays = 14`
- Bound from `appsettings.json` section `"LibrarySettings"`

---

## Phase 5 — API Layer

### Controllers
Under `src/LibraryManagement.API/Controllers/`:

| Controller | Endpoints |
|-----------|-----------|
| `AuthController` | `POST /api/auth/login` |
| `BooksController` | `GET/POST /api/books`, `GET/PUT/DELETE /api/books/{id}` |
| `CategoriesController` | Full CRUD `/api/categories` |
| `StudentsController` | Full CRUD `/api/students` |
| `LoansController` | `GET /api/loans`, `GET /api/loans/{id}`, `POST /api/loans`, `POST /api/loans/{id}/return` |
| `FinesController` | `GET /api/fines`, `GET /api/fines/{id}`, `POST /api/fines/{id}/pay` |
| `DashboardController` | `GET /api/dashboard/summary`, `/popular-books`, `/recent-loans` |
| `ReportsController` | `GET /api/reports/inventory`, `/borrowing`, `/overdue`, `/fines`, `/popular-books` |

All controllers except `AuthController` require `[Authorize]`.

### Middleware
- **`ExceptionHandlingMiddleware`**: Catches exceptions, maps to appropriate HTTP status codes, logs errors
- Custom exception types: `NotFoundException`, `ConflictException`, `ValidationException`

### Configuration
- JWT setup in `Program.cs` with `AddAuthentication().AddJwtBearer()`
- Swagger with JWT bearer auth support
- CORS for React dev server (`http://localhost:5173`)
- FluentValidation auto-registration
- DI registration of all services, repositories, query services

---

## Phase 6 — React Frontend

### Technical Decisions (Grill-Me Aligned)
- **Framework**: Vite + React 18/19 + TypeScript
- **Styling**: Tailwind CSS with custom slate theme tokens
- **Icons**: Lucide React
- **Server State & Caching**: TanStack Query (`@tanstack/react-query`) with automatic mutation revalidation
- **Routing**: React Router v6 with `ProtectedRoute` guards
- **Charts & Visuals**: Recharts for popular books distribution, fine collection trends, and category breakdown
- **Notifications**: `react-hot-toast` with styled toast alerts

### File Structure
```
frontend/
├── src/
│   ├── api/              (Axios client, interceptors, query client, endpoint services)
│   ├── components/
│   │   ├── layout/       (Sidebar, Header, Layout)
│   │   ├── common/       (Modal, ConfirmDialog, DataTable, Pagination, SearchInput, Badge, Button, Input, Select, Spinner)
│   │   └── circulation/  (StudentLookup, IssueBookModal, ReturnLoanModal)
│   ├── contexts/         (AuthContext)
│   ├── hooks/            (useAuth, useDebounce)
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── circulation/  (CirculationDesk.tsx — unified Borrow & Return desk)
│   │   ├── books/        (BookList.tsx, BookModal.tsx)
│   │   ├── students/     (StudentList.tsx, StudentModal.tsx, StudentDetail.tsx)
│   │   ├── loans/        (LoanList.tsx, OverdueLoans.tsx)
│   │   ├── fines/        (FineList.tsx)
│   │   ├── categories/   (CategoryList.tsx)
│   │   └── reports/      (ReportsDashboard.tsx with Recharts and CSV export)
│   ├── types/            (TypeScript interfaces mirroring API DTOs)
│   ├── utils/            (formatters: currency, date, CSV exporter)
│   ├── App.tsx
│   ├── index.css         (Tailwind directives & custom utilities)
│   └── main.tsx
```

### Key UI Features & Flows
- **Login page**: Clean centered card, standard manual credential entry, JWT token stored securely, redirect after login.
- **Session Handling**: Axios response interceptor intercepts 401 Unauthorized, clears session, and smoothly routes to `/login`.
- **Dashboard**: Stat cards with subtle gradients, recent loans activity table, popular books bar chart, quick circulation shortcut.
- **Unified Circulation Desk**: Central station for librarians. Search student by ID/Name/Number -> instantly displays active borrowed books, overdue days, and fine previews with a 1-click Return action; plus an "Issue Book" modal with real-time book search and copy availability checks.
- **Books Management**: Paginated table, real-time search, category dropdown filter, availability badge (`X / Y available`), Add/Edit modal, Delete confirmation.
- **Students Management**: Paginated table, search by student number/name/department, view active loan counts, Add/Edit modal, status toggle (Active/Inactive).
- **Loans & Overdue**: Filterable loan history (All, Borrowed, Returned, Overdue), dedicated Overdue tab with calculated fines.
- **Fines Collection**: Table of outstanding fines, student details, 1-click "Mark as Paid" action with receipt/confirmation toast.
- **Categories**: Category manager with book count indicator and protection against deleting categories in use.
- **Reports & Analytics Dashboard**: Tabbed analytics (Inventory, Borrowing, Overdue, Fines, Popular Books) featuring interactive Recharts (bar/pie), filterable tabular data, and one-click "Export to CSV" + browser print view.

### Design System
- **Theme**: Clean Modern Slate theme (fixed)
- **Sidebar**: Dark navy/slate (`bg-slate-900`) with indigo/sky active indicators and clean icons.
- **Content Canvas**: Clean light gray (`bg-slate-50`) with pure white elevated cards (`bg-white shadow-sm border border-slate-200/80`).
- **Typography**: Modern system/Inter sans typography with crisp hierarchy.
- **Color Accents**:
  - Emerald/Green for Available / Returned / Paid
  - Amber/Yellow for Active Borrowed
  - Rose/Red for Overdue / Unpaid Fine
  - Indigo/Primary for Interactive Actions & Highlights

---

## Phase 7 — Testing

### [NEW] `tests/LibraryManagement.Tests/`

| Test Class | Tests |
|-----------|-------|
| `BookServiceTests` | Create, update, invalid copies, search delegation |
| `StudentServiceTests` | Create, update, deactivated student can't borrow |
| `LoanServiceTests` | Successful borrow, unavailable book, max loans exceeded, duplicate active loan, available copies decrement |
| `ReturnServiceTests` | Successful return, copies increment, already returned rejection, fine calculation |
| `FineCalculatorTests` | Correct fine for various overdue periods, zero fine when on-time, edge cases |
| `AuthServiceTests` | Valid login, invalid password, missing credentials |

Using: xUnit + Moq + FluentAssertions + EF Core InMemory provider

---

## Phase 8 — README & AGENTS.md

### [NEW] `README.md`
- Project overview, architecture diagram, tech stack
- Prerequisites (Node.js, .NET 10 SDK, SQL Server)
- Setup instructions (backend + frontend)
- Default credentials
- API documentation link (Swagger)
- Project structure explanation

### [NEW] `.agents/AGENTS.md`
- Coding conventions and architecture rules
- Where to put new entities, services, DTOs
- Testing conventions
- EF Core vs Dapper usage guidelines

---

## Verification Plan

### Automated Tests
```bash
dotnet test tests/LibraryManagement.Tests/
```

### Manual Verification
1. Run backend: `dotnet run --project src/LibraryManagement.API/`
2. Verify Swagger UI loads at `/swagger`
3. Run frontend: `cd frontend && npm run dev`
4. Test login flow with seeded credentials
5. Test complete borrow → return → fine workflow
6. Verify dashboard statistics match seed data
7. Test all CRUD operations
8. Test search and pagination
9. Test validation error responses
10. Test overdue detection and fine calculation

### Build Verification
```bash
dotnet build SchoolLibrary.sln
cd frontend && npm run build
```

---

## Open Questions

> [!IMPORTANT]
> **SQL Server Connection**: Do you have a SQL Server instance running locally? I'll need the connection string details (server name, authentication method — Windows Auth or SQL Auth). A default like `Server=localhost;Database=SchoolLibraryDb;Trusted_Connection=True;TrustServerCertificate=True;` will be used unless you specify otherwise.

> [!IMPORTANT]
> **Port Configuration**: The API will default to `https://localhost:5001` and the React dev server to `http://localhost:5173`. Let me know if you need different ports.

> [!NOTE]
> **Currency**: The prompt uses "Rs." for fines. I'll use this throughout. Let me know if you prefer a different currency symbol.

---

## Execution Order

The implementation will proceed file-by-file in dependency order:

1. Solution & project scaffolding
2. Domain entities & enums
3. Infrastructure (DbContext, configs, migrations, seed data)
4. Application (interfaces, DTOs, validators, services)
5. API (controllers, middleware, DI config, Program.cs)
6. Run & verify backend with Swagger
7. Frontend scaffolding & design system
8. Frontend pages (Login → Dashboard → Books → Students → Loans → Fines → Categories → Reports)
9. Tests
10. README & AGENTS.md
