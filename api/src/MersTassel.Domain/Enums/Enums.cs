namespace MersTassel.Domain.Enums;

public enum OrderStatus
{
    Pending = 0,
    Processing = 1,
    Shipped = 2,
    Delivered = 3,
    Cancelled = 4,
    Refunded = 5,
}

public enum PaymentStatus
{
    Unpaid = 0,
    Paid = 1,
    Failed = 2,
    Refunded = 3,
}

public enum CartStatus
{
    Open = 0,
    Converted = 1,
    Abandoned = 2,
}

public enum ReservationStatus
{
    Active = 0,
    Converted = 1,
    Released = 2,
}

public enum CouponDiscountType
{
    Percentage = 0,
    FixedAmount = 1,
}

public enum TradeInCondition
{
    LikeNew = 0,
    Good = 1,
    Fair = 2,
}

public enum TradeInStatus
{
    Draft = 0,
    PendingVerification = 1,
    Approved = 2,
    Rejected = 3,
    Cancelled = 4,
}

public enum TradeInHandoffMethod
{
    Pickup = 0,
    DropOff = 1,
}
