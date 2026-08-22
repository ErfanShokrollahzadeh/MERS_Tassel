using MersTassel.Application.Common;
using MersTassel.Application.DTOs;

namespace MersTassel.Application.Interfaces;

/// <summary>
/// Local disk storage for uploaded media. Implementations must validate content, not just
/// the file name, and must never delete a physical file before its database row is committed.
/// </summary>
public interface IFileStorageService
{
    /// <summary>
    /// Saves a validated upload under <c>wwwroot/uploads/{entity}/{yyyy}/{MM}/</c> and returns
    /// the relative public path (e.g. <c>/uploads/products/2026/08/{guid}.webp</c>).
    /// </summary>
    Task<string> SaveAsync(Stream content, string originalFileName, string entity, CancellationToken ct = default);

    /// <summary>Deletes the physical file for a relative path. Missing files are ignored.</summary>
    Task DeleteAsync(string? relativePath, CancellationToken ct = default);

    /// <summary>True when the stream's magic bytes and length pass validation.</summary>
    void Validate(Stream content, string originalFileName, long length);
}

public interface IProductService
{
    Task<PagedResult<ProductDto>> ListAsync(ProductQuery query, CancellationToken ct = default);
    Task<IReadOnlyList<ProductDto>> FeaturedAsync(int take, CancellationToken ct = default);
    Task<ProductDto> GetBySlugAsync(string slug, CancellationToken ct = default);
    Task<ProductDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IReadOnlyList<ProductDto>> RelatedAsync(string slug, int take, CancellationToken ct = default);

    Task<ProductDto> CreateAsync(ProductWriteRequest request, IReadOnlyList<UploadedFile> images, CancellationToken ct = default);
    Task<ProductDto> UpdateAsync(int id, ProductWriteRequest request, IReadOnlyList<UploadedFile> images, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);

    Task<ProductDto> AddMediaAsync(int productId, IReadOnlyList<UploadedFile> images, CancellationToken ct = default);
    Task<ProductDto> RemoveMediaAsync(int productId, int mediaId, CancellationToken ct = default);
    Task<ProductDto> ReorderMediaAsync(int productId, IReadOnlyList<int> mediaIds, CancellationToken ct = default);
}

public interface ICategoryService
{
    Task<IReadOnlyList<CategoryDto>> ListAsync(CancellationToken ct = default);
    Task<CategoryDto> CreateAsync(CategoryWriteRequest request, UploadedFile? image, CancellationToken ct = default);
    Task<CategoryDto> UpdateAsync(int id, CategoryWriteRequest request, UploadedFile? image, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}

public interface ICartService
{
    Task<CartDto> GetAsync(string userId, CancellationToken ct = default);
    Task<CartDto> AddItemAsync(string userId, AddCartItemRequest request, CancellationToken ct = default);
    Task<CartDto> AddGiftBoxAsync(string userId, AddGiftBoxRequest request, CancellationToken ct = default);
    Task<CartDto> UpdateItemAsync(string userId, int itemId, int quantity, CancellationToken ct = default);
    Task<CartDto> RemoveItemAsync(string userId, int itemId, CancellationToken ct = default);
    Task ClearAsync(string userId, CancellationToken ct = default);
}

public interface IOrderService
{
    Task<OrderDto> CheckoutAsync(string userId, CheckoutRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<OrderDto>> ListForUserAsync(string userId, CancellationToken ct = default);
    Task<OrderDto> GetByNumberAsync(string number, string? restrictToUserId, CancellationToken ct = default);
    Task<PagedResult<OrderDto>> ListAsync(OrderQuery query, CancellationToken ct = default);
    Task<OrderDto> UpdateStatusAsync(int id, string status, CancellationToken ct = default);
    Task<OrderDto> GetByStripeSessionAsync(string sessionId, string? restrictToUserId, CancellationToken ct = default);
}

public interface ISiteSettingsService
{
    Task<SiteSettingsDto> GetAsync(CancellationToken ct = default);
    Task<SiteSettingsDto> UpdateAsync(SiteSettingsDto request, UploadedFile? logo, UploadedFile? hero, CancellationToken ct = default);
}

public interface INewsletterService
{
    Task<NewsletterSubscriptionDto> SubscribeAsync(NewsletterSubscribeRequest request, CancellationToken ct = default);
}

public interface IContactMessageService
{
    Task<ContactMessageReceiptDto> SendAsync(ContactMessageRequest request, CancellationToken ct = default);
}

/// <summary>Email delivery boundary; the infrastructure implementation authenticates with SMTP.</summary>
public interface IContactEmailSender
{
    Task SendAsync(ContactMessageRequest request, int reference, CancellationToken ct = default);
}

public interface IDashboardService
{
    Task<DashboardDto> GetAsync(CancellationToken ct = default);
}

public interface IUserAdminService
{
    Task<PagedResult<AdminUserDto>> ListAsync(string? search, int page, int pageSize, CancellationToken ct = default);
    Task<AdminUserDto> UpdateRoleAsync(string userId, string role, CancellationToken ct = default);
}

/// <summary>
/// Payment gateway boundary. A disabled implementation is registered when Stripe keys are
/// absent so the API starts and fails loudly at the call site rather than at boot.
/// </summary>
public interface IPaymentService
{
    bool IsConfigured { get; }
    Task<CheckoutSessionDto> CreateCheckoutSessionAsync(int orderId, string locale, CancellationToken ct = default);
    Task HandleWebhookAsync(string payload, string signatureHeader, CancellationToken ct = default);
}

/// <summary>Transport-agnostic upload, so Application does not depend on ASP.NET's IFormFile.</summary>
public class UploadedFile(Stream content, string fileName, long length, string contentType)
{
    public Stream Content { get; } = content;
    public string FileName { get; } = fileName;
    public long Length { get; } = length;
    public string ContentType { get; } = contentType;
}

public interface ICurrentUser
{
    string? UserId { get; }
    string? Email { get; }
    bool IsAdmin { get; }
    bool IsAuthenticated { get; }
}
