using LibraryManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LibraryManagement.Infrastructure.Data.Configurations;

public class LoanConfiguration : IEntityTypeConfiguration<Loan>
{
    public void Configure(EntityTypeBuilder<Loan> builder)
    {
        builder.ToTable("Loans");

        builder.HasKey(l => l.LoanId);

        builder.Property(l => l.BorrowedDate)
            .IsRequired();

        builder.Property(l => l.DueDate)
            .IsRequired();

        builder.Property(l => l.Status)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(l => l.CreatedAt)
            .IsRequired();

        // Foreign keys
        builder.HasOne(l => l.Book)
            .WithMany(b => b.Loans)
            .HasForeignKey(l => l.BookId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(l => l.Student)
            .WithMany(s => s.Loans)
            .HasForeignKey(l => l.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(l => l.BookId);
        builder.HasIndex(l => l.StudentId);
        builder.HasIndex(l => l.Status);
        builder.HasIndex(l => new { l.StudentId, l.Status });
        builder.HasIndex(l => new { l.DueDate, l.Status });
    }
}
