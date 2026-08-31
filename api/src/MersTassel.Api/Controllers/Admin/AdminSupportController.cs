using FluentValidation;
using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using MersTassel.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MersTassel.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/support")]
[Authorize(Roles = $"{RoleNames.Admin},{RoleNames.Staff}")]
[Tags("Admin · Support")]
public class AdminSupportController(
    ISupportTicketService tickets,
    ICurrentUser currentUser,
    IValidator<AddSupportTicketMessageRequest> messageValidator,
    IValidator<UpdateSupportTicketRequest> updateValidator) : ApiControllerBase
{
    private string UserId => currentUser.UserId ?? throw new ForbiddenException("Support workspace access is required.");

    [HttpGet("tickets")]
    public async Task<ActionResult<ApiResponse<PagedResult<SupportTicketSummaryDto>>>> List(
        [FromQuery] string? status,
        [FromQuery] string? priority,
        [FromQuery] string? assignment,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 30,
        CancellationToken ct = default) =>
        Ok(ApiResponse<PagedResult<SupportTicketSummaryDto>>.Ok(await tickets.ListForStaffAsync(new SupportTicketQuery
        {
            Status = status,
            Priority = priority,
            Assignment = assignment,
            Search = search,
            Page = page,
            PageSize = pageSize,
        }, UserId, ct)));

    [HttpGet("tickets/{id:int}")]
    public async Task<ActionResult<ApiResponse<SupportTicketDetailDto>>> Get(int id, CancellationToken ct) =>
        Ok(ApiResponse<SupportTicketDetailDto>.Ok(await tickets.GetForStaffAsync(id, UserId, ct)));

    [HttpPatch("tickets/{id:int}")]
    public async Task<ActionResult<ApiResponse<SupportTicketDetailDto>>> Update(
        int id, UpdateSupportTicketRequest request, CancellationToken ct)
    {
        await ValidateAsync(updateValidator, request, ct);
        return Ok(ApiResponse<SupportTicketDetailDto>.Ok(
            await tickets.UpdateAsync(id, UserId, request, ct), "Ticket updated."));
    }

    [HttpPost("tickets/{id:int}/messages")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(52 * 1024 * 1024)]
    public async Task<ActionResult<ApiResponse<SupportTicketDetailDto>>> Reply(
        int id,
        [FromForm] AddSupportTicketMessageRequest request,
        [FromForm] IFormFileCollection? attachments,
        CancellationToken ct)
    {
        await ValidateAsync(messageValidator, request, ct);
        using var uploads = FormFileAdapter.Open(attachments);
        return Ok(ApiResponse<SupportTicketDetailDto>.Ok(
            await tickets.AddStaffMessageAsync(id, UserId, request, uploads.Files, ct),
            request.IsInternal ? "Internal note added." : "Reply sent."));
    }

    [HttpGet("agents")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<SupportAgentDto>>>> Agents(CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<SupportAgentDto>>.Ok(await tickets.ListAgentsAsync(ct)));
}
