using MersTassel.Application.DTOs;
using Microsoft.AspNetCore.Http;

namespace MersTassel.Application.Interfaces;

public interface IPopupService
{
    Task<IReadOnlyList<PopupDto>> GetActivePopupsAsync(string? path, string? device, bool isAuthenticated, CancellationToken ct);
    Task RecordEventAsync(int popupId, string eventType, CancellationToken ct);
    Task<IReadOnlyList<AdminPopupDto>> ListAdminAsync(CancellationToken ct);
    Task<AdminPopupDto> GetAdminByIdAsync(int id, CancellationToken ct);
    Task<AdminPopupDto> CreateAsync(PopupWriteRequest request, IFormFile? image, CancellationToken ct);
    Task<AdminPopupDto> UpdateAsync(int id, PopupWriteRequest request, IFormFile? image, CancellationToken ct);
    Task ToggleStatusAsync(int id, bool isActive, CancellationToken ct);
    Task DeleteAsync(int id, CancellationToken ct);
}
