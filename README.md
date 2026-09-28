# School Library Management System

A full-stack Library Management System built with **ASP.NET Core Web API (.NET 10)** following Clean Architecture principles (EF Core + Dapper, SQL Server) and a modern **React + TypeScript (Vite)** frontend with Tailwind CSS and TanStack Query.

---

## Architecture Overview

```
                            ┌─────────────────────────────────────────┐
                            │          React 19 + TypeScript          │
                            │   Vite + Tailwind CSS + TanStack Query  │
                            └────────────────────┬────────────────────┘
                                                 │ HTTP / JSON
                                                 ▼
                            ┌─────────────────────────────────────────┐
                            │         LibraryManagement.API           │
                            │      Controllers, JWT Auth, Swagger     │
                            └───────┬─────────────────────────┬───────┘
                                    │                         │
                                    ▼                         ▼
              ┌─────────────────────────────────┐   ┌─────────────────────────────────┐
              │  LibraryManagement.Application  │   │ LibraryManagement.Infrastructure│
              │  Services, DTOs, Validators     │   │ EF Core Repos, Dapper Queries,  │
              └─────────────────┬───────────────┘   │ SQL Server DbContext, Seeder    │
                                │                   └─────────────────┬───────────────┘
                                └─────────────────┬───────────────────┘
                                                  ▼
                                ┌─────────────────────────────────┐
                                │    LibraryManagement.Domain     │
                                │   Entities, Enums, Domain Rules │
                                └─────────────────────────────────┘
```

- **Domain Layer (`LibraryManagement.Domain`)**: Pure C# domain entities (`User`, `Book`, `Student`, `Category`, `Loan`, `Fine`), enums (`LoanStatus`), and business logic (stock tracking, active borrowing rules). Zero external dependencies.
- **Application Layer (`LibraryManagement.Application`)**: Service interfaces, DTOs, business services (`BookService`, `LoanService`, `FineService`, `AuthService`, etc.), and FluentValidation validators.
- **Infrastructure Layer (`LibraryManagement.Infrastructure`)**: EF Core DbContext with Fluent API mappings for relational integrity, Dapper query services for high-speed read queries and reports, and automatic database migration & seed data.
- **API Layer (`LibraryManagement.API`)**: ASP.NET Core REST API controllers with JWT authentication, global exception handling (`ProblemDetails`), Swagger/OpenAPI documentation, and CORS configuration.
- **Frontend (`frontend/`)**: React + TypeScript powered by Vite, Tailwind CSS (slate theme), TanStack Query for server state management and automatic query invalidation, and Lucide React icons.

---

## Tech Stack

### Backend
- **Runtime**: .NET 10 SDK
- **Framework**: ASP.NET Core Web API
- **ORM / Data Access**: Entity Framework Core 10 (SQL Server), Dapper
- **Validation**: FluentValidation
- **Authentication**: JWT Bearer Tokens (`Microsoft.AspNetCore.Authentication.JwtBearer`), BCrypt.Net-Next
- **Testing**: xUnit, Moq, FluentAssertions, EF Core InMemory Provider

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS (Clean Slate modern admin theme)
- **Data Fetching & Caching**: TanStack Query (`@tanstack/react-query`)
- **HTTP Client**: Axios with JWT request/response interceptors & auto 401 handling
- **Routing**: React Router v6
- **Charts**: Recharts (popular book rankings, statistics)
- **Notifications**: React Hot Toast
- **Icons**: Lucide React

---

## Default Credentials

The database seeder automatically initializes the library with a default administrator librarian:

| Field | Value |
|-------|-------|
| **Email** | `librarian@example.com` |
| **Password** | `Library@123` |

---

## Prerequisites

1. **.NET 10 SDK** installed (`dotnet --version`)
2. **Node.js** v18+ and **npm** (`node -v`, `npm -v`)
3. **Microsoft SQL Server** (LocalDB, SQL Server Express, or standard instance)

---

## Getting Started

### 1. Database Configuration

Update the connection string in `src/LibraryManagement.API/appsettings.json` if needed:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=SchoolLibraryDb;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

The application runs `dbContext.Database.MigrateAsync()` and seeds demo records (librarian account, categories, books, students, loans, and fines) on API startup.

### 2. Run the Backend API

```powershell
# From the repository root
dotnet run --project src/LibraryManagement.API/
```

- **Swagger Documentation**: `http://localhost:5171/swagger` (or `https://localhost:7165/swagger`)
- **API Base URL**: `http://localhost:5171`

### 3. Run the React Frontend

In a separate terminal:

```powershell
cd frontend
npm install
npm run dev
```

- **Frontend Application**: `http://localhost:5173`
- The Vite development server automatically proxies `/api` calls to `http://localhost:5171`.

---

## Running Tests

Execute the 50 automated domain, service, and infrastructure unit tests:

```powershell
dotnet test tests/LibraryManagement.Tests/
```

To build the frontend for production:

```powershell
cd frontend
npm run build
```

---

## Core Features

- **Unified Circulation Desk (`/circulation`)**: Instant student search, active loans overview, 1-click book check-in with overdue fine preview, and book checkout with stock checking.
- **Books Catalog (`/books`)**: Searchable, filterable catalog with live stock status badges (`X / Y available`), category filtering, and modal editing.
- **Student Management (`/students`)**: Student directory with active loan quotas (max 5), account status toggles, and borrowing history inspection.
- **Circulation Records (`/loans`)**: Full audit history across All, Borrowed, Overdue, and Returned states with late-penalty tracking.
- **Fines Collection (`/fines`)**: Unpaid and historical penalty records with 1-click collection receipts.
- **Interactive Reports & Analytics (`/reports`)**: Five analytical views (Inventory, Borrowing Activity, Overdue, Fines Revenue, Popular Books) with Recharts graphs, CSV exports, and printable views.
