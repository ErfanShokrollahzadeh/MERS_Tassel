using MersTassel.Application.Common;
using MersTassel.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace MersTassel.Infrastructure.Storage;

public sealed class ModelGenerationStorage(
    IConfiguration configuration,
    IFileStorageService imageStorage,
    IProductModelStorageService modelStorage,
    ILogger<ModelGenerationStorage> logger) : IModelGenerationStorageService
{
    private readonly string root = Path.GetFullPath(configuration["ModelGeneration:StoragePath"]
        ?? Path.Combine(AppContext.BaseDirectory, "model-data"));

    public async Task<string> SaveCaptureAsync(Stream content, string fileName, long length, CancellationToken ct = default)
    {
        imageStorage.Validate(content, fileName, length);
        var type = LocalFileStorageService.DetectContentType(content)!;
        var extension = type switch { "image/jpeg" => ".jpg", "image/png" => ".png", _ => ".webp" };
        return await SaveAsync(content, Path.Combine("captures", DateTimeOffset.UtcNow.ToString("yyyy-MM")), extension, ct);
    }

    public async Task<string> SaveDraftAsync(Stream content, string extension, CancellationToken ct = default)
    {
        extension = extension.ToLowerInvariant();
        if (extension == ".glb") modelStorage.ValidateGlb(content, "draft.glb", content.Length);
        else if (extension is not (".jpg" or ".jpeg" or ".png" or ".webp"))
            throw new ValidationException("draft", "Unsupported generated draft format.");
        return await SaveAsync(content, Path.Combine("drafts", DateTimeOffset.UtcNow.ToString("yyyy-MM")), extension, ct);
    }

    public Task<Stream> OpenReadAsync(string privatePath, CancellationToken ct = default)
    {
        var absolute = Resolve(privatePath);
        if (!File.Exists(absolute)) throw new NotFoundException("The private model-generation file is missing.");
        return Task.FromResult<Stream>(File.Open(absolute, FileMode.Open, FileAccess.Read, FileShare.Read));
    }

    public Task DeleteAsync(string? privatePath, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(privatePath)) return Task.CompletedTask;
        try { var absolute = Resolve(privatePath); if (File.Exists(absolute)) File.Delete(absolute); }
        catch (IOException ex) { logger.LogWarning(ex, "Could not delete private generation file {Path}", privatePath); }
        return Task.CompletedTask;
    }

    private async Task<string> SaveAsync(Stream content, string directory, string extension, CancellationToken ct)
    {
        var relative = Path.Combine(directory, $"{Guid.NewGuid():N}{extension}").Replace(Path.DirectorySeparatorChar, '/');
        var absolute = Resolve(relative);
        Directory.CreateDirectory(Path.GetDirectoryName(absolute)!);
        content.Position = 0;
        await using var target = File.Create(absolute);
        await content.CopyToAsync(target, ct);
        return relative;
    }

    private string Resolve(string relative)
    {
        Directory.CreateDirectory(root);
        if (Path.IsPathRooted(relative)) throw new ValidationException("path", "Invalid private storage path.");
        var absolute = Path.GetFullPath(Path.Combine(root, relative.Replace('/', Path.DirectorySeparatorChar)));
        if (!absolute.StartsWith(root + Path.DirectorySeparatorChar, StringComparison.Ordinal))
            throw new ValidationException("path", "Invalid private storage path.");
        return absolute;
    }
}
