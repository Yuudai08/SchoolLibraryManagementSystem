using LibraryManagement.Application.DTOs.Fines;
using LibraryManagement.Application.Exceptions;
using LibraryManagement.Application.Interfaces.QueryServices;
using LibraryManagement.Application.Interfaces.Repositories;
using LibraryManagement.Application.Interfaces.Services;
using Microsoft.Extensions.Logging;

namespace LibraryManagement.Application.Services;

public class FineService(
    IFineRepository fineRepository,
    IFineQueryService fineQueryService,
    IUnitOfWork unitOfWork,
    ILogger<FineService> logger,
    TimeProvider? timeProvider = null) : IFineService
{
    private readonly TimeProvider _timeProvider = timeProvider ?? TimeProvider.System;

    public async Task<List<FineResponse>> GetAllAsync(bool? unpaidOnly = null, CancellationToken cancellationToken = default)
    {
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
