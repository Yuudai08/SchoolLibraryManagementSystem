using LibraryManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LibraryManagement.Infrastructure.Data.Configurations;

public class BookConfiguration : IEntityTypeConfiguration<Book>
{
    public void Configure(EntityTypeBuilder<Book> builder)
    {
        builder.ToTable("Books", t =>
        {
            t.HasCheckConstraint("CK_Books_AvailableCopies_NonNegative", "[AvailableCopies] >= 0");
            t.HasCheckConstraint("CK_Books_AvailableCopies_Max", "[AvailableCopies] <= [TotalCopies]");
            t.HasCheckConstraint("CK_Books_TotalCopies_NonNegative", "[TotalCopies] >= 0");
        });

        builder.HasKey(b => b.BookId);

        builder.Property(b => b.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(b => b.Author)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(b => b.ISBN)
            .HasMaxLength(20);

        builder.Property(b => b.Publisher)
            .HasMaxLength(100);

        builder.Property(b => b.Description)
            .HasMaxLength(4000);

        builder.Property(b => b.TotalCopies)
            .IsRequired();

        builder.Property(b => b.AvailableCopies)
            .IsRequired();

        builder.Property(b => b.CreatedAt)
            .IsRequired();

        builder.Property(b => b.RowVersion)
            .IsRowVersion();

        // Unique index on non-null ISBN
        builder.HasIndex(b => b.ISBN)
            .IsUnique()
            .HasFilter("[ISBN] IS NOT NULL");

        // Indexes for frequent queries
        builder.HasIndex(b => b.Title);
        builder.HasIndex(b => b.Author);
        builder.HasIndex(b => b.CategoryId);

        // Relationships
        builder.HasOne(b => b.Category)
            .WithMany(c => c.Books)
            .HasForeignKey(b => b.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
