using System.Text.Json;
using MersTassel.Application.Common;
using MersTassel.Application.Interfaces;
using MersTassel.Domain.Entities;
using MersTassel.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MersTassel.Infrastructure.Services;

public sealed class ProductModelGenerationProcessor(
    AppDbContext db,
    IModelGenerationStorageService storage,
    IProductModelGenerationProvider provider,
    IModelGeometryProcessor geometry,
    ILogger<ProductModelGenerationProcessor> logger) : IProductModelGenerationProcessor
{
    public async Task ProcessNextAsync(CancellationToken ct = default)
    {
        var job = await db.ProductModelGenerationJobs
            .Where(x => x.Status == ProductModelGenerationStatuses.Queued || x.Status == ProductModelGenerationStatuses.Reconstructing)
            .OrderBy(x => x.CreatedAt).FirstOrDefaultAsync(ct);
        if (job is null) return;
        try
        {
            if (job.Status == ProductModelGenerationStatuses.Queued) await SubmitAsync(job, ct);
            else await PollAsync(job, ct);
        }
        catch (Exception ex) when (ex is NotConfiguredException or DeliveryException or ValidationException or HttpRequestException or IOException)
        {
            job.Status = ProductModelGenerationStatuses.Failed;
            job.Stage = "Generation stopped safely";
            job.FailureCode = ex switch
            {
                NotConfiguredException e => e.Code,
                DeliveryException e => e.Code,
                ValidationException => "generated_asset_invalid",
                _ => "generation_pipeline_error",
            };
            job.FailureMessage = ex.Message;
            await db.SaveChangesAsync(ct);
            logger.LogWarning(ex, "Model generation job {JobId} failed at {Stage}", job.Id, job.Stage);
        }
    }

    private async Task SubmitAsync(ProductModelGenerationJob job, CancellationToken ct)
    {
        if (!provider.IsConfigured) throw new NotConfiguredException("model_generation_not_configured", "Add the Meshy API key before starting AI reconstruction.");
        var paths = JsonSerializer.Deserialize<List<string>>(job.CapturePathsJson) ?? [];
        if (paths.Count < 4) throw new ValidationException("images", "The capture package is incomplete.");
        var streams = new List<Stream>();
        try
        {
            foreach (var path in paths.Take(4)) streams.Add(await storage.OpenReadAsync(path, ct));
            job.ProviderJobId = await provider.SubmitAsync(streams, ct);
        }
        finally { foreach (var stream in streams) await stream.DisposeAsync(); }
        job.Status = ProductModelGenerationStatuses.Reconstructing;
        job.Stage = "AI reconstruction in progress";
        job.ProgressPercent = 10;
        job.StartedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    private async Task PollAsync(ProductModelGenerationJob job, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(job.ProviderJobId)) throw new DeliveryException("generation_job_missing", "The provider job id is missing.");
        var progress = await provider.GetProgressAsync(job.ProviderJobId, ct);
        if (progress.Status == "failed") throw new DeliveryException("generation_provider_failed", progress.Error ?? "AI reconstruction failed.");
        if (progress.Status != "succeeded")
        {
            job.Stage = progress.Stage;
            job.ProgressPercent = 10 + (int)Math.Round(progress.ProgressPercent * .6);
            await db.SaveChangesAsync(ct);
            return;
        }

        job.Status = ProductModelGenerationStatuses.Optimizing;
        job.Stage = "Calibrating true scale and surface origin";
        job.ProgressPercent = 78;
        await db.SaveChangesAsync(ct);

        var result = await provider.DownloadAsync(job.ProviderJobId, ct);
        await using var generatedGlb = result.Glb;
        var rawPath = await storage.SaveDraftAsync(generatedGlb, ".glb", ct);
        try
        {
            if (!geometry.IsConfigured) throw new NotConfiguredException("model_processor_not_configured", "Start the model-processor service before processing AI drafts.");
            var processed = await geometry.NormalizeAsync(rawPath, job.WidthMm, job.HeightMm, job.DepthMm, job.DefaultPlacement, ct);
            job.DraftGlbPath = processed.OutputPath;
            job.ValidationReportJson = processed.ValidationReportJson;
            if (result.Poster is not null)
            {
                await using var poster = result.Poster;
                job.DraftPosterPath = await storage.SaveDraftAsync(poster, ".jpg", ct);
            }
            job.Status = ProductModelGenerationStatuses.AwaitingReview;
            job.Stage = "Ready for human scale and visual review";
            job.ProgressPercent = 100;
            job.CompletedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(ct);
        }
        finally { await storage.DeleteAsync(rawPath, ct); }
    }
}
