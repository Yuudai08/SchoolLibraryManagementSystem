namespace LibraryManagement.Domain.Entities;

public class Book
{
    public int BookId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string? ISBN { get; set; }
    public string? Publisher { get; set; }
    public int? PublicationYear { get; set; }
    public int CategoryId { get; set; }
    public string? Description { get; set; }
    public int TotalCopies { get; set; }
    public int AvailableCopies { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public byte[] RowVersion { get; set; } = [];

    // Navigation
    public Category Category { get; set; } = null!;
    public ICollection<Loan> Loans { get; set; } = new List<Loan>();

    // Domain methods
    public bool HasAvailableCopies() => AvailableCopies > 0;

    public void DecrementAvailableCopies()
    {
        if (AvailableCopies <= 0)
            throw new InvalidOperationException("No available copies to borrow.");

        AvailableCopies--;
    }

    public void IncrementAvailableCopies()
    {
        if (AvailableCopies >= TotalCopies)
            throw new InvalidOperationException("Available copies cannot exceed total copies.");

        AvailableCopies++;
    }
}
