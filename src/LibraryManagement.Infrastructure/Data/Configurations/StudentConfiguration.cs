using LibraryManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LibraryManagement.Infrastructure.Data.Configurations;

public class StudentConfiguration : IEntityTypeConfiguration<Student>
{
    public void Configure(EntityTypeBuilder<Student> builder)
    {
        builder.ToTable("Students");

        builder.HasKey(s => s.StudentId);

        builder.Property(s => s.StudentNumber)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(s => s.FirstName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(s => s.LastName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(s => s.Email)
            .HasMaxLength(100);

        builder.Property(s => s.Phone)
            .HasMaxLength(20);

        builder.Property(s => s.Department)
            .HasMaxLength(100);

        builder.Property(s => s.IsActive)
            .IsRequired();

        builder.Property(s => s.CreatedAt)
            .IsRequired();

        // Unique indexes
        builder.HasIndex(s => s.StudentNumber)
            .IsUnique();

        builder.HasIndex(s => s.Email)
            .IsUnique()
            .HasFilter("[Email] IS NOT NULL");

        // Indexes for search
        builder.HasIndex(s => s.LastName);
        builder.HasIndex(s => s.Department);
    }
}
