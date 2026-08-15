using FluentValidation;
using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using MersTassel.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MersTassel.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/categories")]
[Authorize(Roles = RoleNames.Admin)]
[Tags("Admin · Catalog")]
public class AdminCategoriesController(
    ICategoryService categories,
    IValidator<CategoryWriteRequest> validator) : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CategoryDto>>>> List(CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<CategoryDto>>.Ok(await categories.ListAsync(ct)));

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<CategoryDto>>> Create(
        [FromForm] CategoryWriteRequest request, [FromForm] IFormFile? image, CancellationToken ct)
    {
        await ValidateAsync(validator, request, ct);

        using var upload = FormFileAdapter.Open(image);
        var category = await categories.CreateAsync(request, upload.Single, ct);

        return StatusCode(StatusCodes.Status201Created, ApiResponse<CategoryDto>.Ok(category, "Category created."));
    }

    [HttpPut("{id:int}")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<CategoryDto>>> Update(
        int id, [FromForm] CategoryWriteRequest request, [FromForm] IFormFile? image, CancellationToken ct)
    {
        await ValidateAsync(validator, request, ct);

        using var upload = FormFileAdapter.Open(image);
        return Ok(ApiResponse<CategoryDto>.Ok(await categories.UpdateAsync(id, request, upload.Single, ct), "Category updated."));
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult<ApiResponse<object?>>> Delete(int id, CancellationToken ct)
    {
        await categories.DeleteAsync(id, ct);
        return Ok(ApiResponse.Ok("Category removed."));
    }
}

[ApiController]
[Route("api/v1/admin/orders")]
[Authorize(Roles = RoleNames.Admin)]
[Tags("Admin · Orders")]
public class AdminOrdersController(
    IOrderService orders,
    IValidator<UpdateOrderStatusRequest> validator) : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<OrderDto>>>> List(
        [FromQuery] string? status,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default) =>
        Ok(ApiResponse<PagedResult<OrderDto>>.Ok(await orders.ListAsync(new OrderQuery
        {
            Status = status,
            Search = search,
            Page = page,
            PageSize = pageSize,
        }, ct)));

    /// <summary>
    /// Moves an order through its lifecycle. Cancelling or refunding returns the reserved
    /// stock to the catalog.
    /// </summary>
    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<ApiResponse<OrderDto>>> UpdateStatus(
        int id, UpdateOrderStatusRequest request, CancellationToken ct)
    {
        await ValidateAsync(validator, request, ct);
        return Ok(ApiResponse<OrderDto>.Ok(await orders.UpdateStatusAsync(id, request.Status, ct), "Order updated."));
    }
}

[ApiController]
[Route("api/v1/admin/users")]
[Authorize(Roles = RoleNames.Admin)]
[Tags("Admin · People")]
public class AdminUsersController(
    IUserAdminService users,
    IValidator<UpdateUserRoleRequest> validator) : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<AdminUserDto>>>> List(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default) =>
        Ok(ApiResponse<PagedResult<AdminUserDto>>.Ok(await users.ListAsync(search, page, pageSize, ct)));

    [HttpPatch("{id}/role")]
    public async Task<ActionResult<ApiResponse<AdminUserDto>>> UpdateRole(
        string id, UpdateUserRoleRequest request, CancellationToken ct)
    {
        await ValidateAsync(validator, request, ct);
        return Ok(ApiResponse<AdminUserDto>.Ok(await users.UpdateRoleAsync(id, request.Role, ct), "Role updated."));
    }
}

[ApiController]
[Route("api/v1/admin/settings")]
[Authorize(Roles = RoleNames.Admin)]
[Tags("Admin · Settings")]
public class AdminSettingsController(
    ISiteSettingsService settings,
    IValidator<SiteSettingsDto> validator) : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<SiteSettingsDto>>> Get(CancellationToken ct) =>
        Ok(ApiResponse<SiteSettingsDto>.Ok(await settings.GetAsync(ct)));

    /// <summary>Updates site chrome. Omitted image fields keep their current file.</summary>
    [HttpPut]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(30 * 1024 * 1024)]
    public async Task<ActionResult<ApiResponse<SiteSettingsDto>>> Update(
        [FromForm] SiteSettingsDto request,
        [FromForm] IFormFile? logo,
        [FromForm] IFormFile? hero,
        CancellationToken ct)
    {
        await ValidateAsync(validator, request, ct);

        using var logoUpload = FormFileAdapter.Open(logo);
        using var heroUpload = FormFileAdapter.Open(hero);

        var updated = await settings.UpdateAsync(request, logoUpload.Single, heroUpload.Single, ct);
        return Ok(ApiResponse<SiteSettingsDto>.Ok(updated, "Settings saved."));
    }
}

[ApiController]
[Route("api/v1/admin/dashboard")]
[Authorize(Roles = RoleNames.Admin)]
[Tags("Admin · Dashboard")]
public class AdminDashboardController(IDashboardService dashboard) : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<DashboardDto>>> Get(CancellationToken ct) =>
        Ok(ApiResponse<DashboardDto>.Ok(await dashboard.GetAsync(ct)));
}
