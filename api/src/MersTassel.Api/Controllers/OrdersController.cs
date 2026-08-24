using FluentValidation;
using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MersTassel.Api.Controllers;

[ApiController]
[Route("api/v1/orders")]
[Authorize]
[Tags("Orders")]
public class OrdersController(
    IOrderService orders,
    ICurrentUser currentUser,
    IValidator<CheckoutRequest> checkoutValidator) : ApiControllerBase
{
    private string UserId => currentUser.UserId ?? throw new ForbiddenException("Sign in to view your orders.");

    /// <summary>Converts the caller's open bag into an order and reserves the stock.</summary>
    [HttpPost("checkout")]
    public async Task<ActionResult<ApiResponse<OrderDto>>> Checkout(CheckoutRequest request, CancellationToken ct)
    {
        await ValidateAsync(checkoutValidator, request, ct);
        var order = await orders.CheckoutAsync(UserId, request, ct);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<OrderDto>.Ok(order));
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<OrderDto>>>> Mine(CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<OrderDto>>.Ok(await orders.ListForUserAsync(UserId, ct)));

    /// <summary>Admins may read any order; customers are restricted to their own.</summary>
    [HttpGet("{number}")]
    public async Task<ActionResult<ApiResponse<OrderDto>>> Get(string number, CancellationToken ct) =>
        Ok(ApiResponse<OrderDto>.Ok(
            await orders.GetByNumberAsync(number, currentUser.IsAdmin ? null : UserId, ct)));
}

[ApiController]
[Route("api/v1/payments")]
[Tags("Payments")]
public class PaymentsController(
    IPaymentService payments,
    IOrderService orders,
    ICurrentUser currentUser,
    ILogger<PaymentsController> logger) : ApiControllerBase
{
    private string UserId => currentUser.UserId ?? throw new ForbiddenException("Sign in to pay for an order.");

    /// <summary>
    /// Creates a hosted payment session for an order the caller owns. Amounts come from the
    /// stored order, never from the request body. The Stripe route remains as a compatibility
    /// alias while the provider-neutral route lets the storefront change gateways later.
    /// </summary>
    [HttpPost("checkout-session")]
    [HttpPost("stripe/checkout-session")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<CheckoutSessionDto>>> CreateSession(
        [FromBody] CreateCheckoutSessionRequest request, CancellationToken ct)
    {
        var order = await orders.GetByNumberAsync(request.OrderNumber, UserId, ct);
        var session = await payments.CreateCheckoutSessionAsync(order.Id, request.Locale ?? "en", ct);
        return Ok(ApiResponse<CheckoutSessionDto>.Ok(session));
    }

    [HttpGet("session/{sessionId}")]
    [HttpGet("stripe/session/{sessionId}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<OrderDto>>> SessionStatus(string sessionId, CancellationToken ct) =>
        Ok(ApiResponse<OrderDto>.Ok(
            await orders.GetByStripeSessionAsync(sessionId, currentUser.IsAdmin ? null : UserId, ct)));

    /// <summary>
    /// Stripe callback. Anonymous by necessity — authenticity comes from the signature header,
    /// which the payment service verifies before any state changes.
    /// </summary>
    [HttpPost("stripe/webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> Webhook(CancellationToken ct)
    {
        using var reader = new StreamReader(Request.Body);
        var payload = await reader.ReadToEndAsync(ct);
        var signature = Request.Headers["Stripe-Signature"].ToString();

        if (string.IsNullOrWhiteSpace(signature))
        {
            logger.LogWarning("Stripe webhook arrived without a signature header.");
            return BadRequest(ApiResponse<object?>.Fail("Missing Stripe-Signature header.", code: "missing_signature"));
        }

        await payments.HandleWebhookAsync(payload, signature, ct);
        return Ok(new { received = true });
    }
}

public class CreateCheckoutSessionRequest
{
    public string OrderNumber { get; set; } = string.Empty;
    public string? Locale { get; set; }
}
