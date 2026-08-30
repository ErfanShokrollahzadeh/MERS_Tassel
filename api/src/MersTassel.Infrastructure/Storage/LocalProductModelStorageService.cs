using System.IO.Compression;
using System.Buffers.Binary;
using MersTassel.Application.Common;
using MersTassel.Application.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace MersTassel.Infrastructure.Storage;

/// <summary>Strict storage boundary for GLB/USDZ model files and their poster images.</summary>
public sealed class LocalProductModelStorageService(
    IOptions<FileStorageOptions> options,
    ILogger<LocalProductModelStorageService> logger) : IProductModelStorageService
{
    private readonly FileStorageOptions settings = options.Value;
    private const long MaxGlbBytes = 15 * 1024 * 1024;
    private const long MaxUsdzBytes = 25 * 1024 * 1024;
    private const long MaxUsdzExpandedBytes = 100 * 1024 * 1024;

    public void ValidateGlb(Stream content, string fileName, long length)
    {
        if (length <= 0 || length > MaxGlbBytes)
            throw new ValidationException("glb", "GLB files must be between 1 byte and 15 MB.");
        if (!content.CanSeek || content.Length != length)
            throw new ValidationException("glb", "The GLB upload could not be read safely.");

        Span<byte> header = stackalloc byte[12];
        content.Position = 0;
        if (content.Read(header) != header.Length ||
            header[0] != (byte)'g' || header[1] != (byte)'l' || header[2] != (byte)'T' || header[3] != (byte)'F')
            throw new ValidationException("glb", "Upload a valid glTF 2.0 binary (.glb) file.");

        var version = BinaryPrimitives.ReadUInt32LittleEndian(header[4..8]);
        var declaredLength = BinaryPrimitives.ReadUInt32LittleEndian(header[8..12]);
        if (version != 2 || declaredLength != length)
            throw new ValidationException("glb", "The GLB header is invalid or incomplete.");

        long offset = 12;
        Span<byte> chunkHeader = stackalloc byte[8];
        while (offset < declaredLength)
        {
            if (declaredLength - offset < chunkHeader.Length || content.Read(chunkHeader) != chunkHeader.Length)
                throw new ValidationException("glb", "The GLB contains a truncated chunk.");

            var chunkLength = BinaryPrimitives.ReadUInt32LittleEndian(chunkHeader[..4]);
            if (chunkLength > declaredLength - offset - 8)
                throw new ValidationException("glb", "The GLB chunk length is invalid.");

            content.Position += chunkLength;
            offset += 8 + chunkLength;
        }

        if (offset != declaredLength)
            throw new ValidationException("glb", "The GLB contains unexpected trailing data.");
        content.Position = 0;
    }

    public void ValidateUsdz(Stream content, string fileName, long length)
    {
        if (length <= 0 || length > MaxUsdzBytes)
            throw new ValidationException("usdz", "USDZ files must be between 1 byte and 25 MB.");
        if (!content.CanSeek || content.Length != length)
            throw new ValidationException("usdz", "The USDZ upload could not be read safely.");

        try
        {
            content.Position = 0;
            using var archive = new ZipArchive(content, ZipArchiveMode.Read, leaveOpen: true);
            if (archive.Entries.Count == 0)
                throw new ValidationException("usdz", "The USDZ archive is empty.");

            var expanded = 0L;
            var hasScene = false;
            foreach (var entry in archive.Entries)
            {
                var normalized = entry.FullName.Replace('\\', '/');
                var pathParts = normalized.TrimEnd('/').Split('/', StringSplitOptions.RemoveEmptyEntries);
                if (normalized.StartsWith('/') || pathParts.Any(part => part == ".."))
                    throw new ValidationException("usdz", "The USDZ archive contains an unsafe path.");
                if (normalized.EndsWith(".zip", StringComparison.OrdinalIgnoreCase) || normalized.EndsWith(".usdz", StringComparison.OrdinalIgnoreCase))
                    throw new ValidationException("usdz", "Nested archives are not allowed in USDZ uploads.");
                expanded += entry.Length;
                if (expanded > MaxUsdzExpandedBytes)
                    throw new ValidationException("usdz", "The USDZ archive expands beyond the safety limit.");
                if (entry.Name.EndsWith(".usdc", StringComparison.OrdinalIgnoreCase) ||
                    entry.Name.EndsWith(".usd", StringComparison.OrdinalIgnoreCase) ||
                    entry.Name.EndsWith(".usda", StringComparison.OrdinalIgnoreCase)) hasScene = true;
            }

            if (!hasScene)
                throw new ValidationException("usdz", "The USDZ archive does not contain a USD scene.");
        }
        catch (ValidationException) { throw; }
        catch (InvalidDataException)
        {
            throw new ValidationException("usdz", "Upload a valid USDZ archive exported for Apple Quick Look.");
        }
        finally { content.Position = 0; }
    }

    public Task<string> SaveGlbAsync(Stream content, CancellationToken ct = default) => SaveAsync(content, ".glb", ct);
    public Task<string> SaveUsdzAsync(Stream content, CancellationToken ct = default) => SaveAsync(content, ".usdz", ct);

    public async Task<string> SavePosterAsync(Stream content, string fileName, CancellationToken ct = default)
    {
        var detected = LocalFileStorageService.DetectContentType(content)
            ?? throw new ValidationException("poster", "Poster must be a JPEG, PNG or WebP image.");
        var extension = detected switch { "image/jpeg" => ".jpg", "image/png" => ".png", _ => ".webp" };
        return await SaveAsync(content, extension, ct);
    }

    public Task DeleteAsync(string? relativePath, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(relativePath)) return Task.CompletedTask;
        var trimmed = relativePath.TrimStart('/');
        if (!trimmed.StartsWith("uploads/product-models/", StringComparison.OrdinalIgnoreCase)) return Task.CompletedTask;
        var root = Path.GetFullPath(Path.Combine(settings.WebRootPath, "uploads", "product-models"));
        var path = Path.GetFullPath(Path.Combine(settings.WebRootPath, trimmed.Replace('/', Path.DirectorySeparatorChar)));
        if (!path.StartsWith(root + Path.DirectorySeparatorChar, StringComparison.Ordinal)) return Task.CompletedTask;
        try { if (File.Exists(path)) File.Delete(path); }
        catch (IOException ex) { logger.LogWarning(ex, "Could not delete model asset {Path}", relativePath); }
        return Task.CompletedTask;
    }

    private async Task<string> SaveAsync(Stream content, string extension, CancellationToken ct)
    {
        var now = DateTimeOffset.UtcNow;
        var relativeDir = Path.Combine("uploads", "product-models", now.ToString("yyyy"), now.ToString("MM"));
        var absoluteDir = Path.Combine(settings.WebRootPath, relativeDir);
        Directory.CreateDirectory(absoluteDir);
        var name = $"{Guid.NewGuid():N}{extension}";
        var absolutePath = Path.Combine(absoluteDir, name);
        content.Position = 0;
        await using (var target = File.Create(absolutePath)) await content.CopyToAsync(target, ct);
        var publicPath = $"{settings.PublicPrefix}/product-models/{now:yyyy}/{now:MM}/{name}";
        logger.LogInformation("Stored product model {Path} ({Bytes} bytes)", publicPath, content.Length);
        return publicPath;
    }
}
