using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Domain.Entities;

namespace MersTassel.Application.Interfaces;

public interface IProductModelStorageService
{
    void ValidateGlb(Stream content, string fileName, long length);
    void ValidateUsdz(Stream content, string fileName, long length);
    Task<string> SaveGlbAsync(Stream content, CancellationToken ct = default);
    Task<string> SaveUsdzAsync(Stream content, CancellationToken ct = default);
    Task<string> SavePosterAsync(Stream content, string fileName, CancellationToken ct = default);
    Task DeleteAsync(string? relativePath, CancellationToken ct = default);
}

public interface IModelGenerationStorageService
{
    Task<string> SaveCaptureAsync(Stream content, string fileName, long length, CancellationToken ct = default);
    Task<string> SaveDraftAsync(Stream content, string extension, CancellationToken ct = default);
    Task<Stream> OpenReadAsync(string privatePath, CancellationToken ct = default);
    Task DeleteAsync(string? privatePath, CancellationToken ct = default);
}

public interface IProductModelGenerationService
{
    Task<CreateModelGenerationJobResult> CreateAsync(int productId, string userId, CreateModelGenerationJobRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<ModelGenerationJobDto>> ListAsync(int productId, CancellationToken ct = default);
    Task<ModelGenerationJobDto> GetAsync(int jobId, CancellationToken ct = default);
    Task<ModelCaptureSessionDto> GetCaptureSessionAsync(int jobId, string token, CancellationToken ct = default);
    Task<ModelGenerationJobDto> UploadCaptureAsync(int jobId, ModelCaptureUploadRequest request, IReadOnlyList<UploadedFile> images, CancellationToken ct = default);
    Task<ModelGenerationJobDto> RetryAsync(int jobId, CancellationToken ct = default);
    Task<ModelGenerationJobDto> CancelAsync(int jobId, CancellationToken ct = default);
    Task<ModelGenerationJobDto> RejectAsync(int jobId, string userId, ModelGenerationRejectRequest request, CancellationToken ct = default);
    Task<ModelGenerationJobDto> ApproveAsync(int jobId, string userId, ModelGenerationReviewRequest request, CancellationToken ct = default);
}

public interface IProductModelGenerationProcessor
{
    Task ProcessNextAsync(CancellationToken ct = default);
}

public interface IModelGeometryProcessor
{
    bool IsConfigured { get; }
    Task<ModelGeometryProcessingResult> NormalizeAsync(string privateGlbPath, decimal widthMm, decimal heightMm, decimal depthMm, string placement, CancellationToken ct = default);
}

public record ModelGeometryProcessingResult(string OutputPath, string ValidationReportJson);

public interface IProductModelGenerationProvider
{
    bool IsConfigured { get; }
    Task<string> SubmitAsync(IReadOnlyList<Stream> images, CancellationToken ct = default);
    Task<ModelGenerationProviderProgress> GetProgressAsync(string providerJobId, CancellationToken ct = default);
    Task<GeneratedModelDownload> DownloadAsync(string providerJobId, CancellationToken ct = default);
    Task CancelAsync(string providerJobId, CancellationToken ct = default);
}

public record ModelGenerationProviderProgress(string Status, int ProgressPercent, string Stage, string? Error);
public record GeneratedModelDownload(Stream Glb, Stream? Poster);

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
    Task<ProductDto> AddModelAsync(int productId, ProductModelWriteRequest request, UploadedFile glb, UploadedFile? usdz, UploadedFile? poster, CancellationToken ct = default);
    Task<ProductDto> UpdateModelAsync(int productId, int modelId, ProductModelWriteRequest request, UploadedFile? glb, UploadedFile? usdz, UploadedFile? poster, CancellationToken ct = default);
    Task<ProductDto> RemoveModelAsync(int productId, int modelId, CancellationToken ct = default);
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
    Task<CartDto> AddSurpriseBoxAsync(string userId, AddSurpriseBoxRequest request, CancellationToken ct = default);
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

public interface ICouponService
{
    Task<CartDto> ValidateAsync(string userId, ValidateCouponRequest request, CancellationToken ct = default);
    Task<CartDto> RemoveAsync(string userId, CancellationToken ct = default);
    Task<IReadOnlyList<CouponDto>> ListAsync(CancellationToken ct = default);
    Task<CouponDto> CreateAsync(CouponWriteRequest request, CancellationToken ct = default);
    Task<CouponDto> UpdateAsync(int id, CouponWriteRequest request, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}

public interface ITradeInService
{
    Task<TradeInEstimateDto> EstimateAsync(TradeInEstimateRequest request, CancellationToken ct = default);
    Task<CartDto> ApplyAsync(string userId, ApplyTradeInRequest request, UploadedFile image, CancellationToken ct = default);
    Task<CartDto> RemoveAsync(string userId, CancellationToken ct = default);
    Task<TradeInDto> UpdateStatusAsync(int id, UpdateTradeInStatusRequest request, CancellationToken ct = default);
}

public interface IWalletService
{
    Task<WalletDto> GetAsync(string userId, string currency = "TRY", CancellationToken ct = default);
    Task<decimal> ApplyToOrderAsync(string userId, string currency, decimal maximumAmount, string orderNumber, CancellationToken ct = default);
    Task<StoreWalletTransaction?> CreditExchangeDifferenceAsync(ExchangeRequest exchange, CancellationToken ct = default);
    Task<StoreWalletTransaction?> CreditTradeInRemainderAsync(TradeInRequest tradeIn, CancellationToken ct = default);
    Task ReverseOrderDebitAsync(Order order, CancellationToken ct = default);
}

public interface IExchangeService
{
    Task<ExchangeRequestDto> CreateAsync(string userId, CreateExchangeRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<ExchangeRequestDto>> ListForUserAsync(string userId, CancellationToken ct = default);
    Task<IReadOnlyList<ExchangeRequestDto>> ListAllAsync(CancellationToken ct = default);
    Task<OrderDto> CreateSettlementOrderAsync(string userId, int exchangeId, ExchangeCheckoutRequest request, CancellationToken ct = default);
    Task<ExchangeRequestDto> UpdateStatusAsync(int id, UpdateExchangeStatusRequest request, CancellationToken ct = default);
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
/// Payment gateway boundary. A disabled implementation is registered when provider keys are
/// absent so the API starts and fails explicitly at the call site rather than at boot.
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
