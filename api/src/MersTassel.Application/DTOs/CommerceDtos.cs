using MersTassel.Domain.Enums;

namespace MersTassel.Application.DTOs;

public class CartDto
{
    public int Id { get; set; }
    public string Currency { get; set; } = "USD";
    public IReadOnlyList<CartItemDto> Items { get; set; } = [];
    public decimal Subtotal { get; set; }
    public decimal DiscountTotal { get; set; }
    public decimal CouponDiscountTotal { get; set; }
    public decimal TradeInCredit { get; set; }
    public decimal TotalAfterDiscount { get; set; }
    public AppliedCouponDto? Coupon { get; set; }
    public TradeInDto? TradeIn { get; set; }
    public int Count { get; set; }
}

public class AppliedCouponDto
{
    public string Code { get; set; } = string.Empty;
    public string DiscountType { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public decimal MinimumSpend { get; set; }
    public decimal DiscountAmount { get; set; }
    public string Badge { get; set; } = string.Empty;
}

public class ValidateCouponRequest
{
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Client snapshot included in the request contract for diagnostics. The server always
    /// prices the signed-in customer's current cart and never trusts this amount.
    /// </summary>
    public decimal Subtotal { get; set; }
}

public class CouponDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string DiscountType { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public decimal MinimumSpend { get; set; }
    public bool IsActive { get; set; }
    public DateTimeOffset? StartsAt { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }
    public int? UsageLimit { get; set; }
    public int RedemptionCount { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public class CouponWriteRequest
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string DiscountType { get; set; } = "percentage";
    public decimal Value { get; set; }
    public decimal MinimumSpend { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset? StartsAt { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }
    public int? UsageLimit { get; set; }
}

public class CartItemDto
{
    public int Id { get; set; }
    public int VariantId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? ProductNameTr { get; set; }
    public string ProductSlug { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string? ColorTr { get; set; }
    public string? Image { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
    public string? GiftBoxKey { get; set; }
    public string? GiftMessage { get; set; }
    public string? PackagingNotes { get; set; }
    public string? SurpriseRecipient { get; set; }
    public IReadOnlyList<string> SurpriseVibes { get; set; } = [];
    public string? SurpriseInstructions { get; set; }

    /// <summary>Stock available for this variant, so the UI can cap the quantity stepper.</summary>
    public int AvailableStock { get; set; }
}

public class AddCartItemRequest
{
    public string ProductSlug { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public int Quantity { get; set; } = 1;
}

public class AddGiftBoxRequest
{
    public IReadOnlyList<GiftBoxItemRequest> Items { get; set; } = [];
    public string? GiftMessage { get; set; }
    public string? PackagingNotes { get; set; }
}

public class GiftBoxItemRequest
{
    public string ProductSlug { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
}

public class AddSurpriseBoxRequest
{
    public string Recipient { get; set; } = string.Empty;
    public int Budget { get; set; }
    public IReadOnlyList<string> Vibes { get; set; } = [];
    public string? GiftMessage { get; set; }
    public string? SpecialInstructions { get; set; }
}

public class UpdateCartItemRequest
{
    public int Quantity { get; set; }
}

public class CheckoutRequest
{
    public string Email { get; set; } = string.Empty;

    /// <summary><c>standard</c> or <c>express</c>.</summary>
    public string Delivery { get; set; } = "standard";

    public string Locale { get; set; } = "en";
    public bool UseWalletBalance { get; set; }
    public ShippingAddressDto? ShippingAddress { get; set; }
}

public class WalletDto
{
    public decimal Balance { get; set; }
    public string Currency { get; set; } = "USD";
    public IReadOnlyList<WalletTransactionDto> Transactions { get; set; } = [];
}

public class WalletTransactionDto
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal BalanceAfter { get; set; }
    public string Description { get; set; } = string.Empty;
    public string ReferenceType { get; set; } = string.Empty;
    public string ReferenceId { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
}

public class CreateExchangeRequest
{
    public int OrderItemId { get; set; }
    public int NewProductVariantId { get; set; }
    public bool InvoiceIntact { get; set; }
    public bool PackagingIntact { get; set; }
    public string? CustomerNote { get; set; }
}

public class UpdateExchangeStatusRequest
{
    public string Status { get; set; } = string.Empty;
    public string? AdminNote { get; set; }
}

public class ExchangeCheckoutRequest
{
    public string Email { get; set; } = string.Empty;
    public string Locale { get; set; } = "en";
    public bool UseWalletBalance { get; set; }
}

public class ExchangeRequestDto
{
    public int Id { get; set; }
    public int OrderItemId { get; set; }
    public string OriginalProductName { get; set; } = string.Empty;
    public int NewProductVariantId { get; set; }
    public string NewProductName { get; set; } = string.Empty;
    public string NewProductSlug { get; set; } = string.Empty;
    public string NewProductColor { get; set; } = string.Empty;
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
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? ReviewedAt { get; set; }
    public string? SettlementOrderNumber { get; set; }
}

public class TradeInEstimateRequest
{
    public string Category { get; set; } = string.Empty;
    public string Condition { get; set; } = string.Empty;
    public string? TargetProductSlug { get; set; }
    public decimal? TargetProductPrice { get; set; }
}

public class ApplyTradeInRequest : TradeInEstimateRequest
{
    public string BrandModel { get; set; } = string.Empty;
    public string HandoffMethod { get; set; } = string.Empty;
}

public class TradeInEstimateDto
{
    public decimal EstimatedCredit { get; set; }
    public string Currency { get; set; } = "USD";
    public decimal? EstimatedPriceAfterTradeIn { get; set; }
    public string Status { get; set; } = "estimate";
}

public class TradeInDto : TradeInEstimateDto
{
    public int Id { get; set; }
    public string Category { get; set; } = string.Empty;
    public string BrandModel { get; set; } = string.Empty;
    public string Condition { get; set; } = string.Empty;
    public string ImagePath { get; set; } = string.Empty;
    public string? TargetProductSlug { get; set; }
    public string? TargetProductName { get; set; }
    public decimal? TargetProductPrice { get; set; }
    public string HandoffMethod { get; set; } = string.Empty;
    public string? AdminNote { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public class UpdateTradeInStatusRequest
{
    public string Status { get; set; } = string.Empty;
    public string? AdminNote { get; set; }
}

public class ShippingAddressDto
{
    public string Line1 { get; set; } = string.Empty;
    public string? Line2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
}

public class OrderDto
{
    public int Id { get; set; }
    public string Number { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;

    /// <summary>Lower-cased enum name, matching the client's union types.</summary>
    public string Status { get; set; } = string.Empty;

    public string PaymentStatus { get; set; } = string.Empty;
    public string Currency { get; set; } = "USD";
    public decimal Subtotal { get; set; }
    public decimal DiscountTotal { get; set; }
    public decimal CouponDiscountTotal { get; set; }
    public decimal TradeInCredit { get; set; }
    public decimal WalletCredit { get; set; }
    public decimal ShippingTotal { get; set; }
    public decimal Total { get; set; }
    public string? CouponCode { get; set; }
    public string? CouponDiscountType { get; set; }
    public TradeInDto? TradeIn { get; set; }
    public string Channel { get; set; } = string.Empty;
    public IReadOnlyList<OrderItemDto> Items { get; set; } = [];
    public int ItemCount { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? PaidAt { get; set; }
    public DateTimeOffset? DeliveredAt { get; set; }
    public DateTimeOffset? ExchangeEligibleUntil { get; set; }
    public DateTimeOffset? ReturnEligibleUntil { get; set; }
}

public class OrderItemDto
{
    public int Id { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSlug { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string? Image { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
    public string? GiftBoxKey { get; set; }
    public string? GiftMessage { get; set; }
    public string? PackagingNotes { get; set; }
    public string? SurpriseRecipient { get; set; }
    public IReadOnlyList<string> SurpriseVibes { get; set; } = [];
    public string? SurpriseInstructions { get; set; }
}

public class UpdateOrderStatusRequest
{
    public string Status { get; set; } = string.Empty;
}

public class OrderQuery
{
    public string? Status { get; set; }
    public string? Search { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class CheckoutSessionDto
{
    public string CheckoutUrl { get; set; } = string.Empty;
    public string SessionId { get; set; } = string.Empty;
    public string OrderNumber { get; set; } = string.Empty;
}

public static class OrderStatusNames
{
    public static string ToApi(OrderStatus status) => status.ToString().ToLowerInvariant();
    public static string ToApi(PaymentStatus status) => status.ToString().ToLowerInvariant();

    public static bool TryParseOrderStatus(string? value, out OrderStatus status) =>
        Enum.TryParse(value, ignoreCase: true, out status);
}
