using LibraryManagement.Application.Configuration;
using LibraryManagement.Application.DTOs.Fines;
using LibraryManagement.Application.Exceptions;
using LibraryManagement.Application.Interfaces.QueryServices;
using LibraryManagement.Application.Interfaces.Repositories;
using LibraryManagement.Application.Interfaces.Services;
using LibraryManagement.Domain.Entities;
using LibraryManagement.Domain.Enums;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace LibraryManagement.Application.Services;

public class FineService(
    IFineRepository fineRepository,
    ILoanRepository loanRepository,
    IFineQueryService fineQueryService,
    IUnitOfWork unitOfWork,
    IOptions<LibrarySettings> settings,
    ILogger<FineService> logger,
    TimeProvider? timeProvider = null) : IFineService
{
    private readonly LibrarySettings _settings = settings.Value;
    private readonly TimeProvider _timeProvider = timeProvider ?? TimeProvider.System;

    public async Task SyncOverdueFinesAsync(CancellationToken cancellationToken = default)
    {
        var now = _timeProvider.GetUtcNow().UtcDateTime;
        var overdueLoans = await loanRepository.GetActiveOverdueLoansAsync(now, cancellationToken);

        bool hasChanges = false;

        foreach (var loan in overdueLoans)
        {
            if (loan.Status != LoanStatus.Overdue)
            {
                loan.Status = LoanStatus.Overdue;
                loan.UpdatedAt = now;
                await loanRepository.UpdateAsync(loan, cancellationToken);
                hasChanges = true;
            }

            var overdueDays = (now.Date - loan.DueDate.Date).Days;
            var calculatedFine = overdueDays * _settings.FinePerDay;

            if (calculatedFine <= 0) continue;

            if (loan.Fine == null)
            {
                var newFine = new Fine
                {
                    LoanId = loan.LoanId,
                    Amount = calculatedFine,
                    IsPaid = false,
                    CreatedAt = loan.DueDate
                };
                await fineRepository.CreateAsync(newFine, cancellationToken);
                hasChanges = true;
            }
            else if (!loan.Fine.IsPaid && loan.Fine.Amount != calculatedFine)
            {
                loan.Fine.Amount = calculatedFine;
                await fineRepository.UpdateAsync(loan.Fine, cancellationToken);
                hasChanges = true;
            }
        }

        if (hasChanges)
        {
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<List<FineResponse>> GetAllAsync(bool? unpaidOnly = null, CancellationToken cancellationToken = default)
    {
        await SyncOverdueFinesAsync(cancellationToken);
        return await fineQueryService.GetAllFinesAsync(unpaidOnly, cancellationToken);
    }

    public async Task<FineResponse?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await fineQueryService.GetFineByIdAsync(id, cancellationToken);
    }

    public async Task PayFineAsync(int fineId, CancellationToken cancellationToken = default)
    {
        var fine = await fineRepository.GetByIdAsync(fineId, cancellationToken)
            ?? throw new NotFoundException("Fine", fineId);

        if (fine.IsPaid)
        {
            throw new ConflictException("This fine has already been paid.");
        }

        fine.IsPaid = true;
        fine.PaidDate = _timeProvider.GetUtcNow().UtcDateTime;

        await fineRepository.UpdateAsync(fine, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Fine paid: FineId {FineId}, Amount: Rs. {Amount}", fineId, fine.Amount);
    }
}
