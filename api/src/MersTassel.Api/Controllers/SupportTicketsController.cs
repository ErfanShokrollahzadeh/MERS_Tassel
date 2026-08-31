using FluentValidation;
using MersTassel.Api.Controllers.Admin;
using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MersTassel.Api.Controllers;

[ApiController]
[Route("api/v1/tickets")]
[Authorize]
[Tags("Customer support")]
public class SupportTicketsController(
    ISupportTicketService tickets,
    ICurrentUser currentUser,
    IValidator<CreateSupportTicketRequest> createValidator,
    IValidator<AddSupportTicketMessageRequest> messageValidator) : ApiControllerBase
{
    private string UserId => currentUser.UserId ?? throw new ForbiddenException("Sign in to use customer support.");

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<SupportTicketSummaryDto>>>> List(CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<SupportTicketSummaryDto>>.Ok(await tickets.ListForCustomerAsync(UserId, ct)));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<SupportTicketDetailDto>>> Get(int id, CancellationToken ct) =>
        Ok(ApiResponse<SupportTicketDetailDto>.Ok(await tickets.GetForCustomerAsync(id, UserId, ct)));

    [HttpPost]
    [EnableRateLimiting("support-write")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(52 * 1024 * 1024)]
    public async Task<ActionResult<ApiResponse<SupportTicketDetailDto>>> Create(
        [FromForm] CreateSupportTicketRequest request,
        [FromForm] IFormFileCollection? attachments,
        CancellationToken ct)
    {
        await ValidateAsync(createValidator, request, ct);
        using var uploads = FormFileAdapter.Open(attachments);
        var ticket = await tickets.CreateAsync(UserId, request, uploads.Files, ct);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<SupportTicketDetailDto>.Ok(ticket, "Your support request is open."));
    }

    [HttpPost("{id:int}/messages")]
    [EnableRateLimiting("support-write")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(52 * 1024 * 1024)]
    public async Task<ActionResult<ApiResponse<SupportTicketDetailDto>>> Reply(
        int id,
        [FromForm] AddSupportTicketMessageRequest request,
        [FromForm] IFormFileCollection? attachments,
        CancellationToken ct)
    {
        request.IsInternal = false;
        await ValidateAsync(messageValidator, request, ct);
        using var uploads = FormFileAdapter.Open(attachments);
        return Ok(ApiResponse<SupportTicketDetailDto>.Ok(
            await tickets.AddCustomerMessageAsync(id, UserId, request, uploads.Files, ct), "Reply sent."));
    }

    [HttpGet("{ticketId:int}/attachments/{attachmentId:int}")]
    public async Task<IActionResult> Attachment(int ticketId, int attachmentId, CancellationToken ct)
    {
        var file = await tickets.OpenAttachmentAsync(
            ticketId, attachmentId, UserId, currentUser.IsSupportStaff, ct);
        return File(file.Content, file.ContentType, file.FileName, enableRangeProcessing: true);
    }
}
