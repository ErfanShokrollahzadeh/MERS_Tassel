using FluentValidation;
using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MersTassel.Api.Controllers;

[ApiController]
[Route("api/v1/contact")]
[Tags("Contact")]
public class ContactController(
    IContactMessageService contact,
    IValidator<ContactMessageRequest> validator) : ApiControllerBase
{
    [HttpPost("messages")]
    [EnableRateLimiting("contact-form")]
    public async Task<ActionResult<ApiResponse<ContactMessageReceiptDto>>> Send(
        ContactMessageRequest request, CancellationToken ct)
    {
        await ValidateAsync(validator, request, ct);
        var receipt = await contact.SendAsync(request, ct);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<ContactMessageReceiptDto>.Ok(receipt, "Your note was delivered."));
    }
}
