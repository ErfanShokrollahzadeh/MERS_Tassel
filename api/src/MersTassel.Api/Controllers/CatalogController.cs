using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace MersTassel.Api.Controllers;

[ApiController]
[Route("api/v1/products")]
[Tags("Catalog")]
public class ProductsController(IProductService products) : ControllerBase
{
    /// <summary>Paged, filterable public catalog. Only active products are returned.</summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<ProductDto>>>> List(
        [FromQuery] string? category,
        [FromQuery] string? search,
        [FromQuery] string? sort,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        CancellationToken ct = default)
    {
        var result = await products.ListAsync(new ProductQuery
        {
            Category = category,
            Search = search,
            Sort = sort,
            Page = page,
            PageSize = pageSize,
        }, ct);

        return Ok(ApiResponse<PagedResult<ProductDto>>.Ok(result));
    }

    [HttpGet("featured")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ProductDto>>>> Featured(
        [FromQuery] int take = 8, CancellationToken ct = default) =>
        Ok(ApiResponse<IReadOnlyList<ProductDto>>.Ok(await products.FeaturedAsync(Math.Clamp(take, 1, 24), ct)));

    [HttpGet("{slug}")]
    public async Task<ActionResult<ApiResponse<ProductDto>>> Get(string slug, CancellationToken ct) =>
        Ok(ApiResponse<ProductDto>.Ok(await products.GetBySlugAsync(slug, ct)));

    [HttpGet("{slug}/related")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ProductDto>>>> Related(
        string slug, [FromQuery] int take = 4, CancellationToken ct = default) =>
        Ok(ApiResponse<IReadOnlyList<ProductDto>>.Ok(await products.RelatedAsync(slug, Math.Clamp(take, 1, 12), ct)));
}

[ApiController]
[Route("api/v1/categories")]
[Tags("Catalog")]
public class CategoriesController(ICategoryService categories) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CategoryDto>>>> List(CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<CategoryDto>>.Ok(await categories.ListAsync(ct)));
}

[ApiController]
[Route("api/v1/settings")]
[Tags("Catalog")]
public class SettingsController(ISiteSettingsService settings) : ControllerBase
{
    /// <summary>Public storefront chrome: logo, hero copy, contact details.</summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<SiteSettingsDto>>> Get(CancellationToken ct) =>
        Ok(ApiResponse<SiteSettingsDto>.Ok(await settings.GetAsync(ct)));
}
