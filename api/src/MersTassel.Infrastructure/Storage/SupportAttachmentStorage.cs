using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace MersTassel.Infrastructure.Storage;

/// <summary>
/// Private ticket attachment storage. Files never live below wwwroot; every read goes through
/// the authorized ticket endpoint. Content types are inferred from magic bytes and stored names
/// are generated, so an uploaded name cannot execute code, traverse directories, or collide.
/// </summary>
public sealed class SupportAttachmentStorage(
    IConfiguration configuration,
    ILogger<SupportAttachmentStorage> logger) : ISupportAttachmentStorage
{
    private const long MaxBytes = 10 * 1024 * 1024;
    private readonly string root = Path.GetFullPath(configuration["Support:StoragePath"]
        ?? Path.Combine(AppContext.BaseDirectory, "support-data"));

    public async Task<StoredSupportAttachment> SaveAsync(UploadedFile file, CancellationToken ct = default)
    {
        if (file.Length <= 0) throw new ValidationException("attachments", "An attached file is empty.");
        if (file.Length > MaxBytes) throw new ValidationException("attachments", "Each attachment must be 10 MB or smaller.");

        var detected = Detect(file.Content)
            ?? throw new ValidationException("attachments", "Attachments must be JPEG, PNG, WebP, or PDF files.");
        var (contentType, extension) = detected;
        var directory = DateTimeOffset.UtcNow.ToString("yyyy/MM");
        var relative = $"{directory}/{Guid.NewGuid():N}{extension}";
        var absolute = Resolve(relative);
        Directory.CreateDirectory(Path.GetDirectoryName(absolute)!);

        file.Content.Position = 0;
        await using var target = File.Create(absolute);
        await file.Content.CopyToAsync(target, ct);
        logger.LogInformation("Stored private support attachment {Path} ({Bytes} bytes)", relative, file.Length);
        return new StoredSupportAttachment(relative, contentType, file.Length);
    }

    public Task<Stream> OpenReadAsync(string privatePath, CancellationToken ct = default)
    {
        var absolute = Resolve(privatePath);
        if (!File.Exists(absolute)) throw new NotFoundException("The ticket attachment is no longer available.");
        return Task.FromResult<Stream>(File.Open(absolute, FileMode.Open, FileAccess.Read, FileShare.Read));
    }

    public Task DeleteAsync(string? privatePath, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(privatePath)) return Task.CompletedTask;
        try
        {
            var absolute = Resolve(privatePath);
            if (File.Exists(absolute)) File.Delete(absolute);
        }
        catch (IOException ex)
        {
            logger.LogWarning(ex, "Could not delete private support attachment {Path}", privatePath);
        }
        return Task.CompletedTask;
    }

    private string Resolve(string relative)
    {
        Directory.CreateDirectory(root);
        if (Path.IsPathRooted(relative)) throw new ValidationException("path", "Invalid private attachment path.");
        var absolute = Path.GetFullPath(Path.Combine(root, relative.Replace('/', Path.DirectorySeparatorChar)));
        if (!absolute.StartsWith(root + Path.DirectorySeparatorChar, StringComparison.Ordinal))
            throw new ValidationException("path", "Invalid private attachment path.");
        return absolute;
    }

    private static (string ContentType, string Extension)? Detect(Stream stream)
    {
        if (!stream.CanSeek) return null;
        var origin = stream.Position;
        Span<byte> header = stackalloc byte[12];
        stream.Position = 0;
        var read = stream.Read(header);
        stream.Position = origin;
        if (read < 4) return null;

        if (read >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF)
            return ("image/jpeg", ".jpg");
        if (read >= 8 && header[..8].SequenceEqual(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }))
            return ("image/png", ".png");
        if (read >= 12 && header[..4].SequenceEqual("RIFF"u8) && header[8..12].SequenceEqual("WEBP"u8))
            return ("image/webp", ".webp");
        if (header[..4].SequenceEqual("%PDF"u8))
            return ("application/pdf", ".pdf");
        return null;
    }
}
