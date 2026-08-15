using MersTassel.Application.Common;
using MersTassel.Application.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace MersTassel.Infrastructure.Storage;

public class FileStorageOptions
{
    /// <summary>Absolute path to the web root that serves <c>/uploads</c>.</summary>
    public string WebRootPath { get; set; } = string.Empty;

    public long MaxBytes { get; set; } = 10 * 1024 * 1024;
    public string PublicPrefix { get; set; } = "/uploads";
}

/// <summary>
/// Saves uploads to <c>wwwroot/uploads/{entity}/{yyyy}/{MM}/{guid}.{ext}</c>.
///
/// Content is validated by magic bytes rather than by the supplied file name, because an
/// attacker controls the name and extension but not the first bytes of the payload. Stored
/// names are GUIDs, so the original name can never traverse the path or collide.
/// </summary>
public class LocalFileStorageService(
    IOptions<FileStorageOptions> options,
    ILogger<LocalFileStorageService> logger) : IFileStorageService
{
    private readonly FileStorageOptions _options = options.Value;

    private static readonly Dictionary<string, string> ExtensionByType = new(StringComparer.OrdinalIgnoreCase)
    {
        ["image/jpeg"] = ".jpg",
        ["image/png"] = ".png",
        ["image/webp"] = ".webp",
    };

    public void Validate(Stream content, string originalFileName, long length)
    {
        if (length <= 0)
            throw new ValidationException("file", "The uploaded file is empty.");

        if (length > _options.MaxBytes)
            throw new ValidationException("file",
                $"File is larger than the {_options.MaxBytes / (1024 * 1024)} MB limit.");

        var detected = DetectContentType(content);
        if (detected is null)
            throw new ValidationException("file", "Only JPEG, PNG and WebP images are accepted.");
    }

    public async Task<string> SaveAsync(Stream content, string originalFileName, string entity, CancellationToken ct = default)
    {
        var detected = DetectContentType(content)
            ?? throw new ValidationException("file", "Only JPEG, PNG and WebP images are accepted.");

        var extension = ExtensionByType[detected];
        var now = DateTimeOffset.UtcNow;
        var safeEntity = SanitizeSegment(entity);

        var relativeDir = Path.Combine("uploads", safeEntity, now.ToString("yyyy"), now.ToString("MM"));
        var absoluteDir = Path.Combine(_options.WebRootPath, relativeDir);
        Directory.CreateDirectory(absoluteDir);

        var fileName = $"{Guid.NewGuid():N}{extension}";
        var absolutePath = Path.Combine(absoluteDir, fileName);

        content.Position = 0;
        await using (var target = File.Create(absolutePath))
        {
            await content.CopyToAsync(target, ct);
        }

        // Always forward slashes: this string becomes a URL, not a filesystem path.
        var publicPath = $"{_options.PublicPrefix}/{safeEntity}/{now:yyyy}/{now:MM}/{fileName}";
        logger.LogInformation("Stored upload {Path} ({Bytes} bytes)", publicPath, content.Length);
        return publicPath;
    }

    public Task DeleteAsync(string? relativePath, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(relativePath)) return Task.CompletedTask;

        var absolute = ResolveAbsolute(relativePath);
        if (absolute is null) return Task.CompletedTask;

        try
        {
            if (File.Exists(absolute)) File.Delete(absolute);
        }
        catch (IOException ex)
        {
            // A stale file on disk is a smaller problem than failing the admin's request.
            logger.LogWarning(ex, "Could not delete upload {Path}", relativePath);
        }

        return Task.CompletedTask;
    }

    /// <summary>
    /// Maps a public path back to disk, refusing anything that escapes the uploads root.
    /// Returns null when the path is outside the managed directory.
    /// </summary>
    private string? ResolveAbsolute(string relativePath)
    {
        var trimmed = relativePath.TrimStart('/');
        if (!trimmed.StartsWith("uploads/", StringComparison.OrdinalIgnoreCase)) return null;

        var uploadsRoot = Path.GetFullPath(Path.Combine(_options.WebRootPath, "uploads"));
        var candidate = Path.GetFullPath(Path.Combine(_options.WebRootPath, trimmed.Replace('/', Path.DirectorySeparatorChar)));

        return candidate.StartsWith(uploadsRoot + Path.DirectorySeparatorChar, StringComparison.Ordinal)
            ? candidate
            : null;
    }

    private static string SanitizeSegment(string value)
    {
        var cleaned = new string(value.Where(c => char.IsLetterOrDigit(c) || c is '-' or '_').ToArray());
        return string.IsNullOrWhiteSpace(cleaned) ? "misc" : cleaned.ToLowerInvariant();
    }

    /// <summary>Sniffs the leading bytes. Returns null when the payload is not a supported image.</summary>
    public static string? DetectContentType(Stream stream)
    {
        if (!stream.CanSeek) return null;

        var origin = stream.Position;
        Span<byte> header = stackalloc byte[12];
        stream.Position = 0;
        var read = stream.Read(header);
        stream.Position = origin;

        if (read < 12) return null;

        // JPEG: FF D8 FF
        if (header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF)
            return "image/jpeg";

        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if (header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47 &&
            header[4] == 0x0D && header[5] == 0x0A && header[6] == 0x1A && header[7] == 0x0A)
            return "image/png";

        // WebP: "RIFF" .... "WEBP"
        if (header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46 &&
            header[8] == 0x57 && header[9] == 0x45 && header[10] == 0x42 && header[11] == 0x50)
            return "image/webp";

        return null;
    }
}
