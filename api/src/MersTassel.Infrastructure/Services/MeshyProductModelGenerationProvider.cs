using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using MersTassel.Application.Common;
using MersTassel.Application.Interfaces;
using MersTassel.Infrastructure.Storage;
using Microsoft.Extensions.Configuration;

namespace MersTassel.Infrastructure.Services;

public sealed class MeshyProductModelGenerationProvider(HttpClient http, IConfiguration configuration)
    : IProductModelGenerationProvider
{
    private readonly string? apiKey = configuration["ModelGeneration:MeshyApiKey"];
    public bool IsConfigured => !string.IsNullOrWhiteSpace(apiKey);

    public async Task<string> SubmitAsync(IReadOnlyList<Stream> images, CancellationToken ct = default)
    {
        EnsureConfigured();
        var urls = new List<string>();
        foreach (var image in images.Take(4))
        {
            image.Position = 0;
            // The capture page accepts JPEG, PNG and WebP. Preserve the detected MIME type in
            // the data URL so hosted reconstruction services decode the original bytes
            // correctly (camera captures are JPEG, while the file-picker fallback may not be).
            var mime = LocalFileStorageService.DetectContentType(image) ?? "image/jpeg";
            using var buffer = new MemoryStream();
            await image.CopyToAsync(buffer, ct);
            urls.Add($"data:{mime};base64,{Convert.ToBase64String(buffer.ToArray())}");
        }
        using var request = NewRequest(HttpMethod.Post, "multi-image-to-3d");
        request.Content = JsonContent.Create(new
        {
            image_urls = urls,
            ai_model = "latest",
            should_texture = true,
            enable_pbr = true,
            texture_resolution = "2k",
            should_remesh = true,
            target_polycount = 50000,
            target_formats = new[] { "glb" },
        });
        using var response = await http.SendAsync(request, ct);
        await EnsureSuccess(response, ct);
        var result = await response.Content.ReadFromJsonAsync<MeshySubmitResponse>(cancellationToken: ct);
        return result?.Result ?? throw new DeliveryException("generation_provider_invalid_response", "The 3D provider did not return a job id.");
    }

    public async Task<ModelGenerationProviderProgress> GetProgressAsync(string providerJobId, CancellationToken ct = default)
    {
        EnsureConfigured();
        using var response = await http.SendAsync(NewRequest(HttpMethod.Get, $"multi-image-to-3d/{Uri.EscapeDataString(providerJobId)}"), ct);
        await EnsureSuccess(response, ct);
        var result = await response.Content.ReadFromJsonAsync<MeshyTaskResponse>(cancellationToken: ct)
            ?? throw new DeliveryException("generation_provider_invalid_response", "The 3D provider returned an unreadable status.");
        var status = result.Status?.ToUpperInvariant() switch
        {
            "SUCCEEDED" => "succeeded",
            "FAILED" or "CANCELED" => "failed",
            _ => "processing",
        };
        return new(status, Math.Clamp(result.Progress, 0, 100), result.Status ?? "Processing", result.TaskError?.Message);
    }

    public async Task<GeneratedModelDownload> DownloadAsync(string providerJobId, CancellationToken ct = default)
    {
        using var response = await http.SendAsync(NewRequest(HttpMethod.Get, $"multi-image-to-3d/{Uri.EscapeDataString(providerJobId)}"), ct);
        await EnsureSuccess(response, ct);
        var result = await response.Content.ReadFromJsonAsync<MeshyTaskResponse>(cancellationToken: ct);
        if (string.IsNullOrWhiteSpace(result?.ModelUrls?.Glb))
            throw new DeliveryException("generation_result_missing", "The provider completed without a GLB result.");
        var glb = new MemoryStream(await http.GetByteArrayAsync(result.ModelUrls.Glb, ct), writable: false);
        MemoryStream? poster = null;
        if (!string.IsNullOrWhiteSpace(result.ThumbnailUrl))
            poster = new MemoryStream(await http.GetByteArrayAsync(result.ThumbnailUrl, ct), writable: false);
        return new(glb, poster);
    }

    public async Task CancelAsync(string providerJobId, CancellationToken ct = default)
    {
        if (!IsConfigured) return;
        using var response = await http.SendAsync(NewRequest(HttpMethod.Delete, $"multi-image-to-3d/{Uri.EscapeDataString(providerJobId)}"), ct);
        if (!response.IsSuccessStatusCode && response.StatusCode != System.Net.HttpStatusCode.NotFound)
            await EnsureSuccess(response, ct);
    }

    private HttpRequestMessage NewRequest(HttpMethod method, string path)
    {
        var baseUrl = configuration["ModelGeneration:MeshyBaseUrl"] ?? "https://api.meshy.ai/openapi/v1/";
        var request = new HttpRequestMessage(method, new Uri(new Uri(baseUrl.TrimEnd('/') + "/"), path));
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        return request;
    }

    private void EnsureConfigured()
    {
        if (!IsConfigured) throw new NotConfiguredException("model_generation_not_configured", "AI model generation is not configured. Add ModelGeneration:MeshyApiKey on the API server.");
    }

    private static async Task EnsureSuccess(HttpResponseMessage response, CancellationToken ct)
    {
        if (response.IsSuccessStatusCode) return;
        var body = await response.Content.ReadAsStringAsync(ct);
        throw new DeliveryException("generation_provider_error", $"The 3D provider rejected the request ({(int)response.StatusCode}). {body[..Math.Min(body.Length, 300)]}");
    }

    private sealed record MeshySubmitResponse([property: JsonPropertyName("result")] string Result);
    private sealed class MeshyTaskResponse
    {
        [JsonPropertyName("status")] public string? Status { get; set; }
        [JsonPropertyName("progress")] public int Progress { get; set; }
        [JsonPropertyName("model_urls")] public MeshyModelUrls? ModelUrls { get; set; }
        [JsonPropertyName("thumbnail_url")] public string? ThumbnailUrl { get; set; }
        [JsonPropertyName("task_error")] public MeshyTaskError? TaskError { get; set; }
    }
    private sealed class MeshyModelUrls { [JsonPropertyName("glb")] public string? Glb { get; set; } }
    private sealed class MeshyTaskError { [JsonPropertyName("message")] public string? Message { get; set; } }
}
