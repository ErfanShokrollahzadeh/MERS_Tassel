using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using MersTassel.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MersTassel.Api.Controllers.Admin;

[ApiController, Route("api/v1/admin/support/tickets"), Authorize(Roles = RoleNames.Admin + "," + RoleNames.Staff), Tags("Admin support")]
public class AdminSupportController(ISupportService support, ICurrentUser currentUser) : ControllerBase
{
    private string UserId => currentUser.UserId ?? throw new ForbiddenException("Sign in to manage support.");

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<SupportTicketDto>>>> List([FromQuery] SupportTicketQuery query, CancellationToken ct) => Ok(ApiResponse<PagedResult<SupportTicketDto>>.Ok(await support.ListAdminAsync(query, ct)));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<SupportTicketDto>>> Get(int id, CancellationToken ct) => Ok(ApiResponse<SupportTicketDto>.Ok(await support.GetAsync(id, UserId, true, ct)));

    [HttpPost("{id:int}/messages")]
    public async Task<ActionResult<ApiResponse<SupportTicketDto>>> Reply(int id, AddSupportMessageRequest request, CancellationToken ct) => Ok(ApiResponse<SupportTicketDto>.Ok(await support.AddMessageAsync(id, UserId, true, request, ct)));

    [HttpPatch("{id:int}")]
    public async Task<ActionResult<ApiResponse<SupportTicketDto>>> Update(int id, UpdateSupportTicketRequest request, CancellationToken ct) => Ok(ApiResponse<SupportTicketDto>.Ok(await support.UpdateAsync(id, request, ct)));
}
