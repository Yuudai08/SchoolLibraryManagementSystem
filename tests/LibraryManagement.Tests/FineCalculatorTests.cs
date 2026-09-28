using FluentAssertions;
using LibraryManagement.Domain.Entities;
using Xunit;

namespace LibraryManagement.Tests;

public class FineCalculatorTests
{
    private const decimal FineRate = 5.0m;

    [Fact]
    public void Calculate_WhenReturnedOnDueDate_ReturnsZero()
    {
        var dueDate = new DateTime(2026, 1, 15);
        var returnDate = new DateTime(2026, 1, 15);

        var fine = Fine.Calculate(dueDate, returnDate, FineRate);

        fine.Should().Be(0);
    }

    [Fact]
    public void Calculate_WhenReturnedBeforeDueDate_ReturnsZero()
    {
        var dueDate = new DateTime(2026, 1, 15);
        var returnDate = new DateTime(2026, 1, 10);

        var fine = Fine.Calculate(dueDate, returnDate, FineRate);

        fine.Should().Be(0);
    }

    [Fact]
    public void Calculate_WhenReturnedAfterDueDate_CalculatesCorrectFine()
    {
        var dueDate = new DateTime(2026, 1, 10);
        var returnDate = new DateTime(2026, 1, 15); // 5 days overdue

        var fine = Fine.Calculate(dueDate, returnDate, FineRate);

        fine.Should().Be(25.0m);
    }

    [Fact]
    public void Calculate_WithLargeOverduePeriod_CalculatesCorrectly()
    {
        var dueDate = new DateTime(2026, 1, 1);
        var returnDate = new DateTime(2026, 1, 31); // 30 days overdue

        var fine = Fine.Calculate(dueDate, returnDate, FineRate);

        fine.Should().Be(150.0m);
    }

    [Fact]
    public void CalculateCurrentFine_WithFakeTimeProvider_CalculatesFineDeterministically()
    {
        var dueDate = new DateTime(2026, 10, 10);
        var fakeTime = new LibraryManagement.Tests.Common.FakeTimeProvider(new DateTimeOffset(2026, 10, 14, 15, 0, 0, TimeSpan.Zero));

        var fine = Fine.CalculateCurrentFine(dueDate, FineRate, fakeTime);

        // 4 days overdue * 5.0 = 20.0
        fine.Should().Be(20.0m);
    }

    [Fact]
    public void CalculateCurrentFine_WhenNotOverdue_ReturnsZero()
    {
        var dueDate = new DateTime(2026, 10, 20);
        var fakeTime = new LibraryManagement.Tests.Common.FakeTimeProvider(new DateTimeOffset(2026, 10, 14, 15, 0, 0, TimeSpan.Zero));

        var fine = Fine.CalculateCurrentFine(dueDate, FineRate, fakeTime);

        fine.Should().Be(0);
    }
}
