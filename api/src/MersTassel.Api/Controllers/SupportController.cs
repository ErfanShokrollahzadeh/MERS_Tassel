using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MersTassel.Api.Controllers;

[ApiController, Route("api/v1/support/tickets"), Authorize, Tags("Customer support")]
public class SupportController(ISupportService support, ICurrentUser currentUser) : ControllerBase
{
    private string UserId => currentUser.UserId ?? throw new ForbiddenException("Sign in to contact support.");

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<SupportTicketDto>>>> Mine(CancellationToken ct) => Ok(ApiResponse<IReadOnlyList<SupportTicketDto>>.Ok(await support.ListMineAsync(UserId, ct)));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<SupportTicketDto>>> Get(int id, CancellationToken ct) => Ok(ApiResponse<SupportTicketDto>.Ok(await support.GetAsync(id, UserId, false, ct)));

    [HttpPost]
    public async Task<ActionResult<ApiResponse<SupportTicketDto>>> Create(CreateSupportTicketRequest request, CancellationToken ct) => StatusCode(201, ApiResponse<SupportTicketDto>.Ok(await support.CreateAsync(UserId, request, ct), "Your support request has been received."));

    [HttpPost("{id:int}/messages")]
    public async Task<ActionResult<ApiResponse<SupportTicketDto>>> Reply(int id, AddSupportMessageRequest request, CancellationToken ct) => Ok(ApiResponse<SupportTicketDto>.Ok(await support.AddMessageAsync(id, UserId, false, request with { IsInternal = false }, ct)));
}
