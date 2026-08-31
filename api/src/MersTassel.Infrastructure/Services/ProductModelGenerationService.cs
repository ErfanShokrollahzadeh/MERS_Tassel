using System.Security.Cryptography;
using System.Text.Json;
using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using MersTassel.Domain.Entities;
using MersTassel.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MersTassel.Infrastructure.Services;

public sealed class ProductModelGenerationService(
    AppDbContext db,
    IModelGenerationStorageService storage,
    IProductService products,
    ILogger<ProductModelGenerationService> logger) : IProductModelGenerationService
{
    public async Task<CreateModelGenerationJobResult> CreateAsync(int productId, string userId, CreateModelGenerationJobRequest request, CancellationToken ct = default)
    {
        var product = await db.Products.Include(x => x.Variants).FirstOrDefaultAsync(x => x.Id == productId, ct)
            ?? throw new NotFoundException($"No product found with id {productId}.");
        if (request.VariantId.HasValue && product.Variants.All(x => x.Id != request.VariantId || x.IsDelete))
            throw new ValidationException("variantId", "That finish does not belong to this product.");
        if (!string.Equals(request.Provider, "meshy", StringComparison.OrdinalIgnoreCase))
            throw new ValidationException("provider", "The selected model-generation provider is not supported.");

        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
        var expires = DateTimeOffset.UtcNow.AddMinutes(20);
        var job = new ProductModelGenerationJob
        {
            ProductId = productId,
            VariantId = request.VariantId,
            RequestedByUserId = userId,
            Provider = "meshy",
            CaptureTokenHash = Hash(token),
            CaptureTokenExpiresAt = expires,
        };
        db.ProductModelGenerationJobs.Add(job);
        await db.SaveChangesAsync(ct);
        job.Product = product;
        logger.LogInformation("Admin {UserId} created model capture job {JobId} for product {ProductId}", userId, job.Id, productId);
        return new(ToDto(job), token, expires);
    }

    public async Task<IReadOnlyList<ModelGenerationJobDto>> ListAsync(int productId, CancellationToken ct = default)
    {
        var jobs = await db.ProductModelGenerationJobs.AsNoTracking().Include(x => x.Product)
            .Where(x => x.ProductId == productId).OrderByDescending(x => x.CreatedAt).ToListAsync(ct);
        return jobs.Select(ToDto).ToList();
    }

    public async Task<ModelGenerationJobDto> GetAsync(int jobId, CancellationToken ct = default) =>
        ToDto(await FindAsync(jobId, ct));

    public async Task<ModelCaptureSessionDto> GetCaptureSessionAsync(int jobId, string token, CancellationToken ct = default)
    {
        var job = await db.ProductModelGenerationJobs.AsNoTracking().Include(x => x.Product).ThenInclude(x => x.Media)
            .FirstOrDefaultAsync(x => x.Id == jobId, ct) ?? throw new NotFoundException("Capture session not found.");
        ValidateToken(job, token);
        return new ModelCaptureSessionDto
        {
            JobId = job.Id,
            ProductId = job.ProductId,
            ProductName = job.Product.Name,
            ProductImage = job.Product.Media.Where(x => !x.IsDelete).OrderBy(x => x.SortOrder).Select(x => x.ImagePath).FirstOrDefault(),
            ExpiresAt = job.CaptureTokenExpiresAt,
            IsUsed = job.CaptureTokenUsedAt.HasValue,
        };
    }

    public async Task<ModelGenerationJobDto> UploadCaptureAsync(int jobId, ModelCaptureUploadRequest request, IReadOnlyList<UploadedFile> images, CancellationToken ct = default)
    {
        var job = await FindAsync(jobId, ct);
        ValidateToken(job, request.Token);
        ValidateCapture(request, images);
        var paths = new List<string>();
        try
        {
            foreach (var image in images)
                paths.Add(await storage.SaveCaptureAsync(image.Content, image.FileName, image.Length, ct));
            job.CapturePathsJson = JsonSerializer.Serialize(paths);
            job.CalibrationReferenceMm = request.CalibrationReferenceMm;
            job.WidthMm = request.WidthMm;
            job.HeightMm = request.HeightMm;
            job.DepthMm = request.DepthMm;
            var defaultPlacement = request.DefaultPlacement.Trim().ToLowerInvariant();
            job.SupportedPlacements = NormalizePlacements(request.SupportedPlacements, defaultPlacement);
            job.DefaultPlacement = defaultPlacement;
            job.CaptureTokenUsedAt = DateTimeOffset.UtcNow;
            job.Status = ProductModelGenerationStatuses.Queued;
            job.Stage = "Queued for private reconstruction";
            job.ProgressPercent = 5;
            await db.SaveChangesAsync(ct);
            return ToDto(job);
        }
        catch
        {
            foreach (var path in paths) await storage.DeleteAsync(path, ct);
            throw;
        }
    }

    public async Task<ModelGenerationJobDto> RetryAsync(int jobId, CancellationToken ct = default)
    {
        var job = await FindAsync(jobId, ct);
        if (job.Status != ProductModelGenerationStatuses.Failed)
            throw new ConflictException("Only a failed model-generation job can be retried.");
        job.Status = ProductModelGenerationStatuses.Queued;
        job.Stage = "Retry queued";
        job.ProgressPercent = 5;
        job.ProviderJobId = null;
        job.FailureCode = null;
        job.FailureMessage = null;
        await db.SaveChangesAsync(ct);
        return ToDto(job);
    }

    public async Task<ModelGenerationJobDto> CancelAsync(int jobId, CancellationToken ct = default)
    {
        var job = await FindAsync(jobId, ct);
        if (job.Status is ProductModelGenerationStatuses.Approved or ProductModelGenerationStatuses.Cancelled)
            throw new ConflictException("This job can no longer be cancelled.");
        job.Status = ProductModelGenerationStatuses.Cancelled;
        job.Stage = "Cancelled";
        await db.SaveChangesAsync(ct);
        return ToDto(job);
    }

    public async Task<ModelGenerationJobDto> RejectAsync(int jobId, string userId, ModelGenerationRejectRequest request, CancellationToken ct = default)
    {
        var job = await FindAsync(jobId, ct);
        if (job.Status != ProductModelGenerationStatuses.AwaitingReview)
            throw new ConflictException("Only a completed draft can be rejected.");
        if (string.IsNullOrWhiteSpace(request.Reason)) throw new ValidationException("reason", "Explain why the draft was rejected.");
        job.Status = ProductModelGenerationStatuses.Failed;
        job.Stage = "Rejected during human review";
        job.FailureCode = "review_rejected";
        job.FailureMessage = request.Reason.Trim();
        job.ReviewedByUserId = userId;
        job.ReviewedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return ToDto(job);
    }

    public async Task<ModelGenerationJobDto> ApproveAsync(int jobId, string userId, ModelGenerationReviewRequest request, CancellationToken ct = default)
    {
        var job = await FindAsync(jobId, ct);
        if (job.Status != ProductModelGenerationStatuses.AwaitingReview || string.IsNullOrWhiteSpace(job.DraftGlbPath))
            throw new ConflictException("Only a validated draft awaiting review can be approved.");
        if (!request.ScaleVerified) throw new ValidationException("scaleVerified", "Verify the physical scale against the real product before publishing.");

        await using var glb = await storage.OpenReadAsync(job.DraftGlbPath, ct);
        await using var poster = string.IsNullOrWhiteSpace(job.DraftPosterPath) ? null : await storage.OpenReadAsync(job.DraftPosterPath, ct);
        var write = new ProductModelWriteRequest
        {
            VariantId = job.VariantId,
            Alt = $"{job.Product.Name} interactive 3D model",
            Placement = job.DefaultPlacement,
            SupportedPlacements = job.SupportedPlacements,
            ScaleMode = "fixed",
            WidthMm = job.WidthMm,
            HeightMm = job.HeightMm,
            DepthMm = job.DepthMm,
        };
        var glbUpload = new UploadedFile(glb, "approved.glb", glb.Length, "model/gltf-binary");
        var posterUpload = poster is null ? null : new UploadedFile(poster, "poster.jpg", poster.Length, "image/jpeg");
        var product = await products.GetByIdAsync(job.ProductId, ct);
        var existing = product.ModelAssets.FirstOrDefault(x => x.VariantId == job.VariantId);
        ProductDto published;
        if (existing is null) published = await products.AddModelAsync(job.ProductId, write, glbUpload, null, posterUpload, ct);
        else published = await products.UpdateModelAsync(job.ProductId, existing.Id, write, glbUpload, null, posterUpload, ct);

        job.Status = ProductModelGenerationStatuses.Approved;
        job.Stage = "Published after human scale review";
        job.ProgressPercent = 100;
        job.ReviewedByUserId = userId;
        job.ReviewedAt = DateTimeOffset.UtcNow;
        job.ApprovedModelAssetId = published.ModelAssets.First(x => x.VariantId == job.VariantId).Id;
        await db.SaveChangesAsync(ct);
        logger.LogInformation("Admin {UserId} approved generation job {JobId} as model asset {AssetId}", userId, job.Id, job.ApprovedModelAssetId);
        return ToDto(job);
    }

    private async Task<ProductModelGenerationJob> FindAsync(int id, CancellationToken ct) =>
        await db.ProductModelGenerationJobs.Include(x => x.Product).FirstOrDefaultAsync(x => x.Id == id, ct)
        ?? throw new NotFoundException("Model-generation job not found.");

    private static void ValidateCapture(ModelCaptureUploadRequest request, IReadOnlyList<UploadedFile> images)
    {
        if (images.Count is < 4 or > 12) throw new ValidationException("images", "Capture 4 to 12 sharp views of the product.");
        if (request.CalibrationReferenceMm <= 0 || request.CalibrationReferenceMm > 5000)
            throw new ValidationException("calibrationReferenceMm", "Enter a calibration reference between 1 and 5000 millimetres.");
        if (request.WidthMm <= 0 || request.HeightMm <= 0 || request.DepthMm <= 0 ||
            request.WidthMm > 5000 || request.HeightMm > 5000 || request.DepthMm > 5000)
            throw new ValidationException("dimensions", "Enter width, height and depth between 1 and 5000 millimetres.");
        if (string.IsNullOrWhiteSpace(request.DefaultPlacement) || request.DefaultPlacement.Trim().ToLowerInvariant() is not ("floor" or "wall"))
            throw new ValidationException("defaultPlacement", "Choose a valid default placement.");
    }

    private static string NormalizePlacements(string value, string defaultPlacement)
    {
        var values = value.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries).Select(x => x.ToLowerInvariant()).Distinct().OrderBy(x => x).ToArray();
        var normalizedDefault = defaultPlacement.Trim().ToLowerInvariant();
        if (values.Length == 0 || values.Any(x => x is not ("floor" or "wall")) || !values.Contains(normalizedDefault))
            throw new ValidationException("supportedPlacements", "Choose floor, wall, or both and include the default placement.");
        return string.Join(',', values);
    }

    private static void ValidateToken(ProductModelGenerationJob job, string token)
    {
        if (job.Status != ProductModelGenerationStatuses.DraftCapture)
            throw new ConflictException("This capture session is no longer open. Create a new capture from the product editor.");
        if (job.CaptureTokenUsedAt.HasValue) throw new ConflictException("This single-use capture link has already been submitted.");
        if (job.CaptureTokenExpiresAt <= DateTimeOffset.UtcNow) throw new ForbiddenException("This capture link has expired. Create a new job from the product editor.");
        if (string.IsNullOrWhiteSpace(token)) throw new ForbiddenException("This capture link is invalid.");
        try
        {
            var expected = Convert.FromHexString(job.CaptureTokenHash);
            var actual = Convert.FromHexString(Hash(token));
            if (!CryptographicOperations.FixedTimeEquals(expected, actual)) throw new ForbiddenException("This capture link is invalid.");
        }
        catch (FormatException)
        {
            // Treat a damaged/legacy hash exactly like a bad token. Never leak storage details
            // or turn an invalid capture link into a 500 response.
            throw new ForbiddenException("This capture link is invalid.");
        }
    }

    private static string Hash(string token) => Convert.ToHexString(SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(token))).ToLowerInvariant();

    internal static ModelGenerationJobDto ToDto(ProductModelGenerationJob x) => new()
    {
        Id = x.Id, ProductId = x.ProductId, ProductName = x.Product?.Name ?? string.Empty, VariantId = x.VariantId,
        Provider = x.Provider, Status = x.Status, ProgressPercent = x.ProgressPercent, Stage = x.Stage,
        WidthMm = x.WidthMm, HeightMm = x.HeightMm, DepthMm = x.DepthMm,
        CaptureCount = CountCaptures(x.CapturePathsJson),
        SupportedPlacements = x.SupportedPlacements.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries),
        DefaultPlacement = x.DefaultPlacement, ValidationReportJson = x.ValidationReportJson,
        FailureCode = x.FailureCode, FailureMessage = x.FailureMessage,
        CanRetry = x.Status == ProductModelGenerationStatuses.Failed,
        CanApprove = x.Status == ProductModelGenerationStatuses.AwaitingReview,
        CreatedAt = x.CreatedAt, CompletedAt = x.CompletedAt,
    };

    private static int CountCaptures(string? json)
    {
        try { return JsonSerializer.Deserialize<List<string>>(json ?? "[]")?.Count ?? 0; }
        catch (JsonException) { return 0; }
    }

}
