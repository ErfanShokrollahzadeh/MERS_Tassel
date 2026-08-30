using FluentValidation;
using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using MersTassel.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MersTassel.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/products")]
[Authorize(Roles = RoleNames.Admin)]
[Tags("Admin · Catalog")]
public class AdminProductsController(
    IProductService products,
    IValidator<ProductWriteRequest> validator,
    IValidator<ProductModelWriteRequest> modelValidator) : ApiControllerBase
{
    /// <summary>Admin listing — unlike the public route this includes deactivated products.</summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<ProductDto>>>> List(
        [FromQuery] string? category,
        [FromQuery] string? search,
        [FromQuery] string? sort,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await products.ListAsync(new ProductQuery
        {
            Category = category,
            Search = search,
            Sort = sort,
            Page = page,
            PageSize = pageSize,
            IncludeInactive = true,
        }, ct);

        return Ok(ApiResponse<PagedResult<ProductDto>>.Ok(result));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<ProductDto>>> Get(int id, CancellationToken ct) =>
        Ok(ApiResponse<ProductDto>.Ok(await products.GetByIdAsync(id, ct)));

    /// <summary>Creates a product, optionally with its first gallery images in the same request.</summary>
    [HttpPost]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(60 * 1024 * 1024)]
    public async Task<ActionResult<ApiResponse<ProductDto>>> Create(
        [FromForm] ProductWriteRequest request,
        [FromForm] IFormFileCollection? images,
        CancellationToken ct)
    {
        await ValidateAsync(validator, request, ct);

        using var uploads = FormFileAdapter.Open(images);
        var product = await products.CreateAsync(request, uploads.Files, ct);

        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<ProductDto>.Ok(product, $"{product.Name} published."));
    }

    /// <summary>
    /// Updates a product. Sending no files leaves the existing gallery untouched, so a
    /// text-only edit never has to re-upload images.
    /// </summary>
    [HttpPut("{id:int}")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(60 * 1024 * 1024)]
    public async Task<ActionResult<ApiResponse<ProductDto>>> Update(
        int id,
        [FromForm] ProductWriteRequest request,
        [FromForm] IFormFileCollection? images,
        CancellationToken ct)
    {
        await ValidateAsync(validator, request, ct);

        using var uploads = FormFileAdapter.Open(images);
        var product = await products.UpdateAsync(id, request, uploads.Files, ct);

        return Ok(ApiResponse<ProductDto>.Ok(product, $"{product.Name} updated."));
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult<ApiResponse<object?>>> Delete(int id, CancellationToken ct)
    {
        await products.DeleteAsync(id, ct);
        return Ok(ApiResponse.Ok("Product removed from the catalog."));
    }

    [HttpPost("{id:int}/media")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(60 * 1024 * 1024)]
    public async Task<ActionResult<ApiResponse<ProductDto>>> AddMedia(
        int id, [FromForm] IFormFileCollection images, CancellationToken ct)
    {
        using var uploads = FormFileAdapter.Open(images);
        return Ok(ApiResponse<ProductDto>.Ok(await products.AddMediaAsync(id, uploads.Files, ct), "Images added."));
    }

    [HttpDelete("{id:int}/media/{mediaId:int}")]
    public async Task<ActionResult<ApiResponse<ProductDto>>> RemoveMedia(int id, int mediaId, CancellationToken ct) =>
        Ok(ApiResponse<ProductDto>.Ok(await products.RemoveMediaAsync(id, mediaId, ct), "Image removed."));

    [HttpPut("{id:int}/media/reorder")]
    public async Task<ActionResult<ApiResponse<ProductDto>>> ReorderMedia(
        int id, MediaReorderRequest request, CancellationToken ct) =>
        Ok(ApiResponse<ProductDto>.Ok(await products.ReorderMediaAsync(id, request.MediaIds, ct)));

    [HttpPost("{id:int}/models")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(45 * 1024 * 1024)]
    public async Task<ActionResult<ApiResponse<ProductDto>>> AddModel(
        int id,
        [FromForm] ProductModelWriteRequest request,
        [FromForm] IFormFile glb,
        [FromForm] IFormFile? usdz,
        [FromForm] IFormFile? poster,
        CancellationToken ct)
    {
        await ValidateAsync(modelValidator, request, ct);
        if (glb is null || glb.Length == 0)
            throw new MersTassel.Application.Common.ValidationException("glb", "A GLB model is required.");

        using var glbUpload = FormFileAdapter.Open(glb);
        using var usdzUpload = FormFileAdapter.Open(usdz);
        using var posterUpload = FormFileAdapter.Open(poster);
        var saved = await products.AddModelAsync(id, request, glbUpload.Single!, usdzUpload.Single, posterUpload.Single, ct);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<ProductDto>.Ok(saved, "3D model saved."));
    }

    [HttpPut("{id:int}/models/{modelId:int}")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(45 * 1024 * 1024)]
    public async Task<ActionResult<ApiResponse<ProductDto>>> UpdateModel(
        int id,
        int modelId,
        [FromForm] ProductModelWriteRequest request,
        [FromForm] IFormFile? glb,
        [FromForm] IFormFile? usdz,
        [FromForm] IFormFile? poster,
        CancellationToken ct)
    {
        await ValidateAsync(modelValidator, request, ct);
        using var glbUpload = FormFileAdapter.Open(glb);
        using var usdzUpload = FormFileAdapter.Open(usdz);
        using var posterUpload = FormFileAdapter.Open(poster);
        var saved = await products.UpdateModelAsync(id, modelId, request, glbUpload.Single, usdzUpload.Single, posterUpload.Single, ct);
        return Ok(ApiResponse<ProductDto>.Ok(saved, "3D model updated."));
    }

    [HttpDelete("{id:int}/models/{modelId:int}")]
    public async Task<ActionResult<ApiResponse<ProductDto>>> RemoveModel(int id, int modelId, CancellationToken ct) =>
        Ok(ApiResponse<ProductDto>.Ok(await products.RemoveModelAsync(id, modelId, ct), "3D model removed."));
}

/// <summary>
/// Bridges ASP.NET's <see cref="IFormFile"/> to the Application layer's transport-agnostic
/// <see cref="UploadedFile"/>. Streams are buffered into memory so they remain seekable for
/// magic-byte sniffing, and disposed together when the request completes.
/// </summary>
internal sealed class FormFileAdapter : IDisposable
{
    private readonly List<MemoryStream> _streams = [];

    public IReadOnlyList<UploadedFile> Files { get; private set; } = [];

    public static FormFileAdapter Open(IEnumerable<IFormFile>? formFiles)
    {
        var adapter = new FormFileAdapter();
        if (formFiles is null) return adapter;

        var uploads = new List<UploadedFile>();
        foreach (var file in formFiles)
        {
            if (file.Length <= 0) continue;

            var buffer = new MemoryStream();
            file.CopyTo(buffer);
            buffer.Position = 0;

            adapter._streams.Add(buffer);
            uploads.Add(new UploadedFile(buffer, file.FileName, file.Length, file.ContentType));
        }

        adapter.Files = uploads;
        return adapter;
    }

    public static FormFileAdapter Open(IFormFile? formFile) =>
        Open(formFile is null ? null : new[] { formFile });

    public UploadedFile? Single => Files.Count > 0 ? Files[0] : null;

    public void Dispose()
    {
        foreach (var stream in _streams) stream.Dispose();
    }
}
