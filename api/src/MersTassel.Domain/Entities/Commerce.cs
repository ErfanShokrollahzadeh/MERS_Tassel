using MersTassel.Domain.Common;
using MersTassel.Domain.Enums;

namespace MersTassel.Domain.Entities;

public class Cart : SoftDeletableEntity
{
    public string UserId { get; set; } = string.Empty;
    public AppUser User { get; set; } = null!;

    public string Email { get; set; } = string.Empty;
    public CartStatus Status { get; set; } = CartStatus.Open;
    public string Currency { get; set; } = "USD";

    public int? CouponId { get; set; }
    public Coupon? Coupon { get; set; }

    public ICollection<CartItem> Items { get; set; } = new List<CartItem>();
}

public class Coupon : SoftDeletableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string NormalizedCode { get; set; } = string.Empty;
    public CouponDiscountType DiscountType { get; set; }
    public decimal Value { get; set; }
    public decimal MinimumSpend { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset? StartsAt { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }
    public int? UsageLimit { get; set; }
    public int RedemptionCount { get; set; }
}

public class CartItem : SoftDeletableEntity
{
    public int CartId { get; set; }
    public Cart Cart { get; set; } = null!;

    public int ProductVariantId { get; set; }
    public ProductVariant Variant { get; set; } = null!;

    public int Quantity { get; set; } = 1;

    /// <summary>
    /// Items created by the Kavanoz builder share a key so they remain a coherent gift box
    /// even when the shopper has ordinary products in the same cart.
    /// </summary>
    public string? GiftBoxKey { get; set; }
    public string? GiftMessage { get; set; }
    public string? PackagingNotes { get; set; }
}

public class Order : SoftDeletableEntity
{
    public string Number { get; set; } = string.Empty;

    /// <summary>Null once a customer account is removed; the order itself is retained.</summary>
    public string? UserId { get; set; }
    public AppUser? User { get; set; }

    public string Email { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;

    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Unpaid;

    public string Currency { get; set; } = "USD";
    public decimal Subtotal { get; set; }
    public decimal DiscountTotal { get; set; }
    public decimal ShippingTotal { get; set; }
    public decimal Total { get; set; }
    public string? CouponCode { get; set; }
    public string? CouponDiscountType { get; set; }

    /// <summary>Serialized shipping address; SQLite has no native JSON column type.</summary>
    public string ShippingAddressJson { get; set; } = "{}";

    public string Channel { get; set; } = "storefront";
    public string? IdempotencyKey { get; set; }

    public string? StripeCheckoutSessionId { get; set; }
    public string? StripePaymentIntentId { get; set; }
    public DateTimeOffset? PaidAt { get; set; }

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    public ICollection<InventoryReservation> Reservations { get; set; } = new List<InventoryReservation>();
}

/// <summary>
/// An immutable snapshot of what was bought. Name, SKU and price are copied at checkout so
/// later catalog edits never rewrite the historical record.
/// </summary>
public class OrderItem : SoftDeletableEntity
{
    public int OrderId { get; set; }
    public Order Order { get; set; } = null!;

    public int? ProductVariantId { get; set; }
    public ProductVariant? Variant { get; set; }

    public string ProductName { get; set; } = string.Empty;
    public string ProductSlug { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string? ImagePath { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }

    /// <summary>Immutable Kavanoz instructions copied from the cart at checkout.</summary>
    public string? GiftBoxKey { get; set; }
    public string? GiftMessage { get; set; }
    public string? PackagingNotes { get; set; }
}

public class InventoryReservation : SoftDeletableEntity
{
    public int OrderId { get; set; }
    public Order Order { get; set; } = null!;

    public int ProductVariantId { get; set; }
    public ProductVariant Variant { get; set; } = null!;

    public int Quantity { get; set; }
    public ReservationStatus Status { get; set; } = ReservationStatus.Active;
    public DateTimeOffset ExpiresAt { get; set; }
}

/// <summary>Webhook idempotency ledger — Stripe redelivers events, so each id is processed once.</summary>
public class ProcessedStripeEvent
{
    public int Id { get; set; }
    public string EventId { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public DateTimeOffset ProcessedAt { get; set; } = DateTimeOffset.UtcNow;
}
