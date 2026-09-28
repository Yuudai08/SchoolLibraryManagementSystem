using LibraryManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LibraryManagement.Infrastructure.Data.Configurations;

public class FineConfiguration : IEntityTypeConfiguration<Fine>
{
    public void Configure(EntityTypeBuilder<Fine> builder)
    {
        builder.ToTable("Fines");

        builder.HasKey(f => f.FineId);

        builder.Property(f => f.Amount)
            .IsRequired()
            .HasPrecision(18, 2);

        builder.Property(f => f.IsPaid)
            .IsRequired();

        builder.Property(f => f.CreatedAt)
            .IsRequired();

        // 1:1 relationship with Loan
        builder.HasOne(f => f.Loan)
            .WithOne(l => l.Fine)
            .HasForeignKey<Fine>(f => f.LoanId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(f => f.LoanId)
            .IsUnique();

        builder.HasIndex(f => f.IsPaid);
    }
}
