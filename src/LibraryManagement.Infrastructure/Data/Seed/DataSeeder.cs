using LibraryManagement.Application.Interfaces.Auth;
using LibraryManagement.Domain.Entities;
using LibraryManagement.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace LibraryManagement.Infrastructure.Data.Seed;

public class DataSeeder(
    LibraryDbContext context,
    IPasswordHasher passwordHasher,
    ILogger<DataSeeder> logger)
{
    private readonly LibraryDbContext _context = context;
    private readonly IPasswordHasher _passwordHasher = passwordHasher;
    private readonly ILogger<DataSeeder> _logger = logger;

    public async Task SeedAsync()
    {
        try
        {
            if (await _context.Users.AnyAsync())
            {
                _logger.LogInformation("Database already contains data. Skipping seed.");
                return;
            }

            _logger.LogInformation("Starting database seeding...");

            // 1. Seed Librarian User
            var librarian = new User
            {
                FullName = "System Librarian",
                Email = "librarian@example.com",
                PasswordHash = _passwordHasher.Hash("Library@123"),
                CreatedAt = DateTime.UtcNow
            };
            await _context.Users.AddAsync(librarian);

            // 2. Seed Categories
            var categories = new List<Category>
            {
                new() { Name = "Programming", Description = "Software engineering, languages, frameworks, and coding standards." },
                new() { Name = "Database", Description = "Relational and NoSQL databases, data modeling, and performance tuning." },
                new() { Name = "Networking", Description = "Computer networks, protocols, cloud infrastructure, and security." },
                new() { Name = "Science", Description = "Physics, chemistry, biology, and general scientific inquiry." },
                new() { Name = "Mathematics", Description = "Calculus, linear algebra, discrete mathematics, and statistics." },
                new() { Name = "Literature", Description = "Classic and contemporary world literature, essays, and novels." },
                new() { Name = "History", Description = "World history, civilization milestones, and historical biographies." }
            };
            await _context.Categories.AddRangeAsync(categories);
            await _context.SaveChangesAsync();

            // 3. Seed Books
            var books = new List<Book>
            {
                new()
                {
                    Title = "Clean Code: A Handbook of Agile Software Craftsmanship",
                    Author = "Robert C. Martin",
                    ISBN = "9780132350884",
                    Publisher = "Prentice Hall",
                    PublicationYear = 2008,
                    CategoryId = categories[0].CategoryId,
                    Description = "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees.",
                    TotalCopies = 5,
                    AvailableCopies = 4
                },
                new()
                {
                    Title = "Design Patterns: Elements of Reusable Object-Oriented Software",
                    Author = "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides",
                    ISBN = "9780201633610",
                    Publisher = "Addison-Wesley",
                    PublicationYear = 1994,
                    CategoryId = categories[0].CategoryId,
                    Description = "Captures a wealth of experience in design and software construction.",
                    TotalCopies = 4,
                    AvailableCopies = 3
                },
                new()
                {
                    Title = "C# in Depth: Fourth Edition",
                    Author = "Jon Skeet",
                    ISBN = "9781617294532",
                    Publisher = "Manning Publications",
                    PublicationYear = 2019,
                    CategoryId = categories[0].CategoryId,
                    Description = "Deep dive into C# language features and best practices.",
                    TotalCopies = 3,
                    AvailableCopies = 2
                },
                new()
                {
                    Title = "Designing Data-Intensive Applications",
                    Author = "Martin Kleppmann",
                    ISBN = "9781449373320",
                    Publisher = "O'Reilly Media",
                    PublicationYear = 2017,
                    CategoryId = categories[1].CategoryId,
                    Description = "The big ideas behind reliable, scalable, and maintainable systems.",
                    TotalCopies = 6,
                    AvailableCopies = 4
                },
                new()
                {
                    Title = "Database System Concepts (7th Edition)",
                    Author = "Abraham Silberschatz, Henry F. Korth, S. Sudarshan",
                    ISBN = "9780078022159",
                    Publisher = "McGraw-Hill",
                    PublicationYear = 2019,
                    CategoryId = categories[1].CategoryId,
                    Description = "Fundamental concepts of database management and relational model.",
                    TotalCopies = 4,
                    AvailableCopies = 3
                },
                new()
                {
                    Title = "Computer Networking: A Top-Down Approach (8th Edition)",
                    Author = "James Kurose, Keith Ross",
                    ISBN = "9780136681557",
                    Publisher = "Pearson",
                    PublicationYear = 2020,
                    CategoryId = categories[2].CategoryId,
                    Description = "Modern introduction to computer networking principles and the Internet.",
                    TotalCopies = 4,
                    AvailableCopies = 3
                },
                new()
                {
                    Title = "TCP/IP Illustrated, Volume 1",
                    Author = "W. Richard Stevens",
                    ISBN = "9780201633467",
                    Publisher = "Addison-Wesley",
                    PublicationYear = 2011,
                    CategoryId = categories[2].CategoryId,
                    Description = "Detailed exploration of TCP/IP protocol architecture.",
                    TotalCopies = 2,
                    AvailableCopies = 2
                },
                new()
                {
                    Title = "A Brief History of Time",
                    Author = "Stephen Hawking",
                    ISBN = "9780553380163",
                    Publisher = "Bantam Books",
                    PublicationYear = 1988,
                    CategoryId = categories[3].CategoryId,
                    Description = "Landmark volume in science writing by one of the great minds of our time.",
                    TotalCopies = 5,
                    AvailableCopies = 5
                },
                new()
                {
                    Title = "Linear Algebra Done Right (3rd Edition)",
                    Author = "Sheldon Axler",
                    ISBN = "9783319110790",
                    Publisher = "Springer",
                    PublicationYear = 2015,
                    CategoryId = categories[4].CategoryId,
                    Description = "Novel approach to linear algebra focusing on linear operators on finite-dimensional vector spaces.",
                    TotalCopies = 3,
                    AvailableCopies = 2
                },
                new()
                {
                    Title = "Calculus: Early Transcendentals (8th Edition)",
                    Author = "James Stewart",
                    ISBN = "9781285741550",
                    Publisher = "Cengage Learning",
                    PublicationYear = 2015,
                    CategoryId = categories[4].CategoryId,
                    Description = "Clear presentation, elegant problem sets, and mathematical precision.",
                    TotalCopies = 4,
                    AvailableCopies = 4
                },
                new()
                {
                    Title = "To Kill a Mockingbird",
                    Author = "Harper Lee",
                    ISBN = "9780061120084",
                    Publisher = "HarperCollins",
                    PublicationYear = 1960,
                    CategoryId = categories[5].CategoryId,
                    Description = "A gripping, heart-wrenching tale of coming-of-age in a South poisoned by virulent prejudice.",
                    TotalCopies = 3,
                    AvailableCopies = 3
                },
                new()
                {
                    Title = "Sapiens: A Brief History of Humankind",
                    Author = "Yuval Noah Harari",
                    ISBN = "9780062316097",
                    Publisher = "Harper",
                    PublicationYear = 2014,
                    CategoryId = categories[6].CategoryId,
                    Description = "Explores how biology and history have defined us and enhanced our understanding of what it means to be human.",
                    TotalCopies = 5,
                    AvailableCopies = 4
                }
            };
            await _context.Books.AddRangeAsync(books);
            await _context.SaveChangesAsync();

            // 4. Seed Students
            var students = new List<Student>
            {
                new() { StudentNumber = "STU-2024-001", FirstName = "Aarav", LastName = "Sharma", Email = "aarav.sharma@school.edu", Phone = "9841234567", Department = "Computer Engineering", Year = 3, IsActive = true },
                new() { StudentNumber = "STU-2024-002", FirstName = "Pooja", LastName = "Bhandari", Email = "pooja.bhandari@school.edu", Phone = "9842345678", Department = "Computer Science", Year = 2, IsActive = true },
                new() { StudentNumber = "STU-2024-003", FirstName = "Rohan", LastName = "Karki", Email = "rohan.karki@school.edu", Phone = "9843456789", Department = "Information Technology", Year = 4, IsActive = true },
                new() { StudentNumber = "STU-2024-004", FirstName = "Sita", LastName = "Adhikari", Email = "sita.adhikari@school.edu", Phone = "9844567890", Department = "Electrical Engineering", Year = 1, IsActive = true },
                new() { StudentNumber = "STU-2024-005", FirstName = "Bikash", LastName = "Thapa", Email = "bikash.thapa@school.edu", Phone = "9845678901", Department = "Civil Engineering", Year = 3, IsActive = true },
                new() { StudentNumber = "STU-2024-006", FirstName = "Anjali", LastName = "Shrestha", Email = "anjali.shrestha@school.edu", Phone = "9846789012", Department = "Mathematics", Year = 2, IsActive = true },
                new() { StudentNumber = "STU-2024-007", FirstName = "Kiran", LastName = "Ghimire", Email = "kiran.ghimire@school.edu", Phone = "9847890123", Department = "Physics", Year = 4, IsActive = false },
                new() { StudentNumber = "STU-2024-008", FirstName = "Dipendra", LastName = "Rana", Email = "dipendra.rana@school.edu", Phone = "9848901234", Department = "Computer Science", Year = 1, IsActive = true }
            };
            await _context.Students.AddRangeAsync(students);
            await _context.SaveChangesAsync();

            // 5. Seed Loans (mix of active, overdue, and returned)
            var now = DateTime.UtcNow;

            var loans = new List<Loan>
            {
                // Active on-time loans
                new()
                {
                    BookId = books[0].BookId,
                    StudentId = students[0].StudentId,
                    BorrowedDate = now.AddDays(-5),
                    DueDate = now.AddDays(9),
                    Status = LoanStatus.Borrowed
                },
                new()
                {
                    BookId = books[1].BookId,
                    StudentId = students[1].StudentId,
                    BorrowedDate = now.AddDays(-7),
                    DueDate = now.AddDays(7),
                    Status = LoanStatus.Borrowed
                },
                new()
                {
                    BookId = books[2].BookId,
                    StudentId = students[2].StudentId,
                    BorrowedDate = now.AddDays(-2),
                    DueDate = now.AddDays(12),
                    Status = LoanStatus.Borrowed
                },
                new()
                {
                    BookId = books[3].BookId,
                    StudentId = students[3].StudentId,
                    BorrowedDate = now.AddDays(-10),
                    DueDate = now.AddDays(4),
                    Status = LoanStatus.Borrowed
                },

                // Active overdue loans
                new()
                {
                    BookId = books[3].BookId,
                    StudentId = students[4].StudentId,
                    BorrowedDate = now.AddDays(-20),
                    DueDate = now.AddDays(-6),
                    Status = LoanStatus.Overdue
                },
                new()
                {
                    BookId = books[4].BookId,
                    StudentId = students[5].StudentId,
                    BorrowedDate = now.AddDays(-25),
                    DueDate = now.AddDays(-11),
                    Status = LoanStatus.Overdue
                },
                new()
                {
                    BookId = books[5].BookId,
                    StudentId = students[0].StudentId,
                    BorrowedDate = now.AddDays(-18),
                    DueDate = now.AddDays(-4),
                    Status = LoanStatus.Overdue
                },

                // Returned loans (on-time and late)
                new()
                {
                    BookId = books[8].BookId,
                    StudentId = students[1].StudentId,
                    BorrowedDate = now.AddDays(-30),
                    DueDate = now.AddDays(-16),
                    ReturnedDate = now.AddDays(-18),
                    Status = LoanStatus.Returned
                },
                new()
                {
                    BookId = books[11].BookId,
                    StudentId = students[2].StudentId,
                    BorrowedDate = now.AddDays(-40),
                    DueDate = now.AddDays(-26),
                    ReturnedDate = now.AddDays(-20), // 6 days late
                    Status = LoanStatus.Returned
                },
                new()
                {
                    BookId = books[0].BookId,
                    StudentId = students[7].StudentId,
                    BorrowedDate = now.AddDays(-50),
                    DueDate = now.AddDays(-36),
                    ReturnedDate = now.AddDays(-30), // 6 days late
                    Status = LoanStatus.Returned
                }
            };
            await _context.Loans.AddRangeAsync(loans);
            await _context.SaveChangesAsync();

            // 6. Seed Fines for overdue/late returned loans
            var fines = new List<Fine>
            {
                // Unpaid fine for active overdue loan (Student 4, 6 days overdue * Rs. 5 = Rs. 30)
                new()
                {
                    LoanId = loans[4].LoanId,
                    Amount = 30.0m,
                    IsPaid = false,
                    CreatedAt = now.AddDays(-6)
                },
                // Unpaid fine for active overdue loan (Student 5, 11 days overdue * Rs. 5 = Rs. 55)
                new()
                {
                    LoanId = loans[5].LoanId,
                    Amount = 55.0m,
                    IsPaid = false,
                    CreatedAt = now.AddDays(-11)
                },
                // Paid fine for returned loan (Student 2, 6 days late * Rs. 5 = Rs. 30)
                new()
                {
                    LoanId = loans[8].LoanId,
                    Amount = 30.0m,
                    IsPaid = true,
                    PaidDate = now.AddDays(-20),
                    CreatedAt = now.AddDays(-20)
                }
            };
            await _context.Fines.AddRangeAsync(fines);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Database seeded successfully with initial library data.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while seeding the database.");
            throw;
        }
    }
}
