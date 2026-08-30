using System.Net.Http.Json;
using System.Text.Json;
using MersTassel.Application.Common;
using MersTassel.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace MersTassel.Infrastructure.Services;

public sealed class HttpModelGeometryProcessor(HttpClient http, IConfiguration configuration) : IModelGeometryProcessor
{
    private readonly string? baseUrl = configuration["ModelGeneration:ProcessorUrl"];
    public bool IsConfigured => !string.IsNullOrWhiteSpace(baseUrl);

    public async Task<ModelGeometryProcessingResult> NormalizeAsync(string privateGlbPath, decimal widthMm, decimal heightMm, decimal depthMm, string placement, CancellationToken ct = default)
    {
        if (!IsConfigured)
            throw new NotConfiguredException("model_processor_not_configured", "The true-scale 3D processor is not configured.");
        var outputPath = $"drafts/{DateTimeOffset.UtcNow:yyyy-MM}/{Guid.NewGuid():N}.glb";
        using var request = new HttpRequestMessage(HttpMethod.Post, new Uri(new Uri(baseUrl!.TrimEnd('/') + "/"), "v1/process"))
        {
            Content = JsonContent.Create(new { inputPath = privateGlbPath, outputPath, widthMm, heightMm, depthMm, placement }),
        };
        var internalKey = configuration["ModelGeneration:ProcessorKey"];
        if (!string.IsNullOrWhiteSpace(internalKey)) request.Headers.Add("X-Processor-Key", internalKey);
        using var response = await http.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode)
            throw new DeliveryException("model_processor_error", $"The true-scale processor failed ({(int)response.StatusCode}).");
        var payload = await response.Content.ReadFromJsonAsync<ProcessorResponse>(cancellationToken: ct)
            ?? throw new DeliveryException("model_processor_invalid_response", "The true-scale processor returned an unreadable response.");
        return new(payload.OutputPath, JsonSerializer.Serialize(payload.Validation));
    }

    private sealed class ProcessorResponse
    {
        public string OutputPath { get; set; } = string.Empty;
        public object? Validation { get; set; }
    }
}
