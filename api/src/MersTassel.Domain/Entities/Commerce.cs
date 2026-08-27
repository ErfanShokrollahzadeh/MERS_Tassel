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
    public TradeInRequest? TradeIn { get; set; }
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
    public decimal TradeInCredit { get; set; }
    public decimal WalletCredit { get; set; }
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
    public DateTimeOffset? DeliveredAt { get; set; }

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    public ICollection<InventoryReservation> Reservations { get; set; } = new List<InventoryReservation>();
    public TradeInRequest? TradeIn { get; set; }
}

/// <summary>A currency-specific customer store-credit account backed by an immutable ledger.</summary>
public class StoreWallet
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public AppUser User { get; set; } = null!;
    public string Currency { get; set; } = "USD";
    public decimal Balance { get; set; }
    public string ConcurrencyStamp { get; set; } = Guid.NewGuid().ToString("N");
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public ICollection<StoreWalletTransaction> Transactions { get; set; } = new List<StoreWalletTransaction>();
}

/// <summary>Append-only wallet movement; Amount is positive for credit and negative for debit.</summary>
public class StoreWalletTransaction
{
    public int Id { get; set; }
    public int WalletId { get; set; }
    public StoreWallet Wallet { get; set; } = null!;
    public WalletTransactionType Type { get; set; }
    public decimal Amount { get; set; }
    public decimal BalanceAfter { get; set; }
    public string Description { get; set; } = string.Empty;
    public string ReferenceType { get; set; } = string.Empty;
    public string ReferenceId { get; set; } = string.Empty;
    public string IdempotencyKey { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

/// <summary>
/// A request to exchange one unit from a delivered order for a current catalog variant.
/// Values are snapshotted server-side so later price edits cannot change the agreement.
/// </summary>
public class ExchangeRequest : SoftDeletableEntity
{
    public string UserId { get; set; } = string.Empty;
    public AppUser User { get; set; } = null!;
    public int OrderItemId { get; set; }
    public OrderItem OrderItem { get; set; } = null!;
    public int NewProductVariantId { get; set; }
    public ProductVariant NewProductVariant { get; set; } = null!;
    public decimal OldProductValue { get; set; }
    public decimal NewProductValue { get; set; }
    public decimal Difference { get; set; }
    public decimal WalletCredit { get; set; }
    public decimal AmountDue { get; set; }
    public string Currency { get; set; } = "USD";
    public bool InvoiceIntact { get; set; }
    public bool PackagingIntact { get; set; }
    public string? CustomerNote { get; set; }
    public string? AdminNote { get; set; }
    public ExchangeRequestStatus Status { get; set; } = ExchangeRequestStatus.PendingVerification;
    public DateTimeOffset? ReviewedAt { get; set; }
    public int? WalletTransactionId { get; set; }
    public StoreWalletTransaction? WalletTransaction { get; set; }
    public int? SettlementOrderId { get; set; }
    public Order? SettlementOrder { get; set; }
}

/// <summary>
/// A provisional credit request. The estimate reduces the checkout amount immediately, but
/// remains pending until the atelier physically inspects the submitted item.
/// </summary>
public class TradeInRequest : SoftDeletableEntity
{
    public string? UserId { get; set; }
    public AppUser? User { get; set; }

    public int? CartId { get; set; }
    public Cart? Cart { get; set; }

    public int? OrderId { get; set; }
    public Order? Order { get; set; }

    public string Category { get; set; } = string.Empty;
    public string BrandModel { get; set; } = string.Empty;
    public TradeInCondition Condition { get; set; }
    public string ImagePath { get; set; } = string.Empty;
    public string? TargetProductSlug { get; set; }
    public string? TargetProductName { get; set; }
    public decimal? TargetProductPrice { get; set; }
    public decimal EstimatedCredit { get; set; }
    public string Currency { get; set; } = "USD";
    public TradeInHandoffMethod HandoffMethod { get; set; }
    public TradeInStatus Status { get; set; } = TradeInStatus.PendingVerification;
    public string? AdminNote { get; set; }
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
