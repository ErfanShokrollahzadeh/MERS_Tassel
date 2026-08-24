using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using MersTassel.Domain.Enums;
using MersTassel.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Stripe;
using Stripe.Checkout;

namespace MersTassel.Infrastructure.Payments;

public class StripeOptions
{
    public string SecretKey { get; set; } = string.Empty;
    public string WebhookSecret { get; set; } = string.Empty;
    public string Currency { get; set; } = "usd";
    public string FrontendUrl { get; set; } = "http://localhost:3000";
}

/// <summary>
/// Registered when Stripe keys are absent. The API still boots and every other route works;
/// only payment calls fail, and they fail with an explicit, machine-readable reason rather
/// than a misleading success or an opaque 500.
/// </summary>
public class DisabledPaymentService : IPaymentService
{
    public bool IsConfigured => false;

    public Task<CheckoutSessionDto> CreateCheckoutSessionAsync(int orderId, string locale, CancellationToken ct = default) =>
        throw new NotConfiguredException("payments_not_configured",
            "Online payments are not configured on this deployment. Configure a payment provider to enable hosted checkout.");

    public Task HandleWebhookAsync(string payload, string signatureHeader, CancellationToken ct = default) =>
        throw new NotConfiguredException("payments_not_configured", "Stripe webhooks are not configured on this deployment.");
}

public class StripePaymentService(
    AppDbContext db,
    IOptions<StripeOptions> options,
    ILogger<StripePaymentService> logger) : IPaymentService
{
    private readonly StripeOptions _options = options.Value;

    public bool IsConfigured => true;

    public async Task<CheckoutSessionDto> CreateCheckoutSessionAsync(int orderId, string locale, CancellationToken ct = default)
    {
        var order = await db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == orderId, ct)
            ?? throw new NotFoundException($"No order found with id {orderId}.");

        if (order.PaymentStatus == PaymentStatus.Paid)
            throw new ValidationException("order", "This order has already been paid.");

        var lineItems = order.Items.Select(item => new SessionLineItemOptions
        {
            Quantity = item.Quantity,
            PriceData = new SessionLineItemPriceDataOptions
            {
                // Stripe works in minor units; rounding here rather than trusting a float.
                UnitAmount = (long)Math.Round(item.UnitPrice * 100m, MidpointRounding.AwayFromZero),
                Currency = order.Currency.ToLowerInvariant(),
                ProductData = new SessionLineItemPriceDataProductDataOptions
                {
                    Name = item.ProductName,
                    Description = string.IsNullOrWhiteSpace(item.Color) ? null : item.Color,
                },
            },
        }).ToList();

        if (order.ShippingTotal > 0)
        {
            lineItems.Add(new SessionLineItemOptions
            {
                Quantity = 1,
                PriceData = new SessionLineItemPriceDataOptions
                {
                    UnitAmount = (long)Math.Round(order.ShippingTotal * 100m, MidpointRounding.AwayFromZero),
                    Currency = order.Currency.ToLowerInvariant(),
                    ProductData = new SessionLineItemPriceDataProductDataOptions { Name = "Delivery" },
                },
            });
        }

        var service = new SessionService(new StripeClient(_options.SecretKey));
        var session = await service.CreateAsync(new SessionCreateOptions
        {
            Mode = "payment",
            CustomerEmail = order.Email,
            ClientReferenceId = order.Number,
            LineItems = lineItems,
            Locale = locale == "tr" ? "tr" : "en",
            SuccessUrl = $"{_options.FrontendUrl}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
            CancelUrl = $"{_options.FrontendUrl}/checkout/cancel",
            Metadata = new Dictionary<string, string> { ["order_number"] = order.Number },
        }, cancellationToken: ct);

        order.StripeCheckoutSessionId = session.Id;
        await db.SaveChangesAsync(ct);

        return new CheckoutSessionDto
        {
            CheckoutUrl = session.Url,
            SessionId = session.Id,
            OrderNumber = order.Number,
        };
    }

    public async Task HandleWebhookAsync(string payload, string signatureHeader, CancellationToken ct = default)
    {
        Event stripeEvent;
        try
        {
            stripeEvent = EventUtility.ConstructEvent(payload, signatureHeader, _options.WebhookSecret);
        }
        catch (StripeException ex)
        {
            // An unverifiable payload is not trustworthy input; never act on it.
            logger.LogWarning(ex, "Rejected Stripe webhook with an invalid signature");
            throw new ValidationException("signature", "Webhook signature verification failed.");
        }

        // Stripe retries on non-2xx, so the same event id can arrive repeatedly.
        if (await db.ProcessedStripeEvents.AnyAsync(e => e.EventId == stripeEvent.Id, ct))
        {
            logger.LogInformation("Skipping already-processed Stripe event {EventId}", stripeEvent.Id);
            return;
        }

        if (stripeEvent.Data.Object is Session session)
        {
            switch (stripeEvent.Type)
            {
                case "checkout.session.completed":
                case "checkout.session.async_payment_succeeded":
                    await FulfillAsync(session, ct);
                    break;

                case "checkout.session.async_payment_failed":
                case "checkout.session.expired":
                    await ReleaseAsync(session, ct);
                    break;
            }
        }

        db.ProcessedStripeEvents.Add(new Domain.Entities.ProcessedStripeEvent
        {
            EventId = stripeEvent.Id,
            EventType = stripeEvent.Type,
        });

        await db.SaveChangesAsync(ct);
    }

    private async Task FulfillAsync(Session session, CancellationToken ct)
    {
        var order = await FindOrderAsync(session, ct);
        if (order is null) return;

        order.PaymentStatus = PaymentStatus.Paid;
        order.Status = OrderStatus.Processing;
        order.PaidAt = DateTimeOffset.UtcNow;
        order.StripePaymentIntentId = session.PaymentIntentId ?? string.Empty;

        // Stock already left the shelf at checkout; converting just closes the reservation.
        foreach (var reservation in order.Reservations.Where(r => r.Status == ReservationStatus.Active))
            reservation.Status = ReservationStatus.Converted;

        logger.LogInformation("Order {Number} marked paid", order.Number);
    }

    private async Task ReleaseAsync(Session session, CancellationToken ct)
    {
        var order = await FindOrderAsync(session, ct);
        if (order is null) return;

        order.PaymentStatus = PaymentStatus.Failed;
        order.Status = OrderStatus.Cancelled;

        var active = order.Reservations.Where(r => r.Status == ReservationStatus.Active).ToList();
        var variantIds = active.Select(r => r.ProductVariantId).ToList();
        var variants = await db.ProductVariants.IgnoreQueryFilters()
            .Where(v => variantIds.Contains(v.Id))
            .ToDictionaryAsync(v => v.Id, ct);

        foreach (var reservation in active)
        {
            if (variants.TryGetValue(reservation.ProductVariantId, out var variant))
                variant.Stock += reservation.Quantity;

            reservation.Status = ReservationStatus.Released;
        }

        logger.LogInformation("Order {Number} payment failed; released {Count} reservation(s)", order.Number, active.Count);
    }

    private Task<Domain.Entities.Order?> FindOrderAsync(Session session, CancellationToken ct)
    {
        var number = session.ClientReferenceId
            ?? (session.Metadata is not null && session.Metadata.TryGetValue("order_number", out var fromMeta) ? fromMeta : null);

        return db.Orders
            .Include(o => o.Reservations)
            .FirstOrDefaultAsync(o => o.StripeCheckoutSessionId == session.Id || (number != null && o.Number == number), ct);
    }
}
