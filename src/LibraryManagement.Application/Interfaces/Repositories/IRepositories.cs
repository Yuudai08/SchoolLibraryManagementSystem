using LibraryManagement.Domain.Entities;

namespace LibraryManagement.Application.Interfaces.Repositories;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
}

public interface ICategoryRepository
{
    Task<Category?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<List<Category>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Category> CreateAsync(Category category, CancellationToken cancellationToken = default);
    Task UpdateAsync(Category category, CancellationToken cancellationToken = default);
    Task DeleteAsync(Category category, CancellationToken cancellationToken = default);
    Task<bool> ExistsByNameAsync(string name, int? excludeId = null, CancellationToken cancellationToken = default);
    Task<bool> HasBooksAsync(int categoryId, CancellationToken cancellationToken = default);
}

public interface IBookRepository
{
    Task<Book?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Book> CreateAsync(Book book, CancellationToken cancellationToken = default);
    Task UpdateAsync(Book book, CancellationToken cancellationToken = default);
    Task DeleteAsync(Book book, CancellationToken cancellationToken = default);
    Task<bool> ExistsByIsbnAsync(string isbn, int? excludeId = null, CancellationToken cancellationToken = default);
    Task<bool> HasLoansAsync(int bookId, CancellationToken cancellationToken = default);
}

public interface IStudentRepository
{
    Task<Student?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Student> CreateAsync(Student student, CancellationToken cancellationToken = default);
    Task UpdateAsync(Student student, CancellationToken cancellationToken = default);
    Task DeleteAsync(Student student, CancellationToken cancellationToken = default);
    Task<bool> ExistsByStudentNumberAsync(string studentNumber, int? excludeId = null, CancellationToken cancellationToken = default);
    Task<bool> ExistsByEmailAsync(string email, int? excludeId = null, CancellationToken cancellationToken = default);
    Task<bool> HasLoansAsync(int studentId, CancellationToken cancellationToken = default);
}

public interface ILoanRepository
{
    Task<Loan?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Loan> CreateAsync(Loan loan, CancellationToken cancellationToken = default);
    Task UpdateAsync(Loan loan, CancellationToken cancellationToken = default);
    Task<int> GetActiveLoansCountAsync(int studentId, CancellationToken cancellationToken = default);
    Task<bool> HasActiveLoanForBookAsync(int studentId, int bookId, CancellationToken cancellationToken = default);
}

public interface IFineRepository
{
    Task<Fine?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Fine> CreateAsync(Fine fine, CancellationToken cancellationToken = default);
    Task UpdateAsync(Fine fine, CancellationToken cancellationToken = default);
}

public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task BeginTransactionAsync(CancellationToken cancellationToken = default);
    Task CommitTransactionAsync(CancellationToken cancellationToken = default);
    Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
}
