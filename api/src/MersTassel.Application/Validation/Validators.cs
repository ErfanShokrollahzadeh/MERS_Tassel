using FluentValidation;
using MersTassel.Application.DTOs;

namespace MersTassel.Application.Validation;

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(254);
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(80);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(80);
        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(8).WithMessage("Password must be at least 8 characters.")
            .MaximumLength(128)
            .Matches("[A-Za-z]").WithMessage("Password must contain a letter.")
            .Matches("[0-9]").WithMessage("Password must contain a digit.");
    }
}

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public class ForgotPasswordRequestValidator : AbstractValidator<ForgotPasswordRequest>
{
    public ForgotPasswordRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(254);
    }
}

public class ResetPasswordRequestValidator : AbstractValidator<ResetPasswordRequest>
{
    public ResetPasswordRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(254);
        RuleFor(x => x.Token).NotEmpty();
        RuleFor(x => x.NewPassword)
            .NotEmpty()
            .MinimumLength(8).WithMessage("Password must be at least 8 characters.")
            .MaximumLength(128)
            .Matches("[a-z]").WithMessage("Password must contain a lowercase letter.")
            .Matches("[0-9]").WithMessage("Password must contain a digit.");
    }
}

public class NewsletterSubscribeRequestValidator : AbstractValidator<NewsletterSubscribeRequest>
{
    public NewsletterSubscribeRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(254);
        RuleFor(x => x.Locale).Must(value => value is "en" or "tr").WithMessage("Locale must be 'en' or 'tr'.");
        RuleFor(x => x.Source).Must(value => value is "home" or "footer").WithMessage("Source must be 'home' or 'footer'.");
    }
}

public class ContactMessageRequestValidator : AbstractValidator<ContactMessageRequest>
{
    private static readonly string[] Topics = ["product", "order", "repairs", "press"];

    public ContactMessageRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(254);
        RuleFor(x => x.Topic).Must(value => Topics.Contains(value))
            .WithMessage("Choose a valid contact topic.");
        RuleFor(x => x.Message).NotEmpty().MinimumLength(10).MaximumLength(4000);
        RuleFor(x => x.Locale).Must(value => value is "en" or "tr")
            .WithMessage("Locale must be 'en' or 'tr'.");
    }
}

public class CreateSupportTicketRequestValidator : AbstractValidator<CreateSupportTicketRequest>
{
    private static readonly string[] Categories =
        ["order", "product", "shipping", "return", "repair", "account", "other"];

    public CreateSupportTicketRequestValidator()
    {
        RuleFor(x => x.Subject).NotEmpty().MinimumLength(4).MaximumLength(160);
        RuleFor(x => x.Category).NotEmpty()
            .Must(value => Categories.Contains(value.Trim().ToLowerInvariant()))
            .WithMessage("Choose a valid support category.");
        RuleFor(x => x.Message).NotEmpty().MinimumLength(10).MaximumLength(4000);
        RuleFor(x => x.OrderNumber).MaximumLength(40);
    }
}

public class AddSupportTicketMessageRequestValidator : AbstractValidator<AddSupportTicketMessageRequest>
{
    public AddSupportTicketMessageRequestValidator()
    {
        RuleFor(x => x.Body).NotEmpty().MinimumLength(2).MaximumLength(4000);
    }
}

public class UpdateSupportTicketRequestValidator : AbstractValidator<UpdateSupportTicketRequest>
{
    private static readonly string[] Statuses = ["open", "in_progress", "waiting_for_customer", "resolved", "closed"];
    private static readonly string[] Priorities = ["low", "normal", "high", "urgent"];

    public UpdateSupportTicketRequestValidator()
    {
        RuleFor(x => x.Status).NotEmpty().Must(value => Statuses.Contains(value.Trim().ToLowerInvariant()))
            .WithMessage("Choose a valid ticket status.");
        RuleFor(x => x.Priority).NotEmpty().Must(value => Priorities.Contains(value.Trim().ToLowerInvariant()))
            .WithMessage("Choose a valid ticket priority.");
        RuleFor(x => x.AssignedToUserId).MaximumLength(450);
    }
}

public class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequest>
{
    public UpdateProfileRequestValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(80);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(80);
    }
}

public class ProductWriteRequestValidator : AbstractValidator<ProductWriteRequest>
{
    public ProductWriteRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.CategoryId).GreaterThan(0).WithMessage("Choose a category.");
        RuleFor(x => x.Description).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.Price).GreaterThan(0).WithMessage("Price must be greater than zero.");
        RuleFor(x => x.CompareAtPrice)
            .GreaterThan(x => x.Price)
            .When(x => x.CompareAtPrice.HasValue)
            .WithMessage("Compare-at price must be higher than the selling price.");
        RuleFor(x => x.Currency).NotEmpty().Length(3);
        RuleFor(x => x.SeoTitle).MaximumLength(70);
        RuleFor(x => x.MetaDescription).MaximumLength(170);
        RuleFor(x => x.Slug)
            .Matches("^[a-z0-9]+(?:-[a-z0-9]+)*$")
            .When(x => !string.IsNullOrWhiteSpace(x.Slug))
            .WithMessage("Slug may contain lowercase letters, numbers and single hyphens only.");
    }
}

public class ProductModelWriteRequestValidator : AbstractValidator<ProductModelWriteRequest>
{
    public ProductModelWriteRequestValidator()
    {
        RuleFor(x => x.Alt).NotEmpty().MaximumLength(240);
        RuleFor(x => x.Placement).Must(value => value is "floor" or "wall")
            .WithMessage("Placement must be 'floor' or 'wall'.");
        RuleFor(x => x.SupportedPlacements)
            .Must(value => value.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
                .All(placement => placement is "floor" or "wall"))
            .WithMessage("Supported placements may contain only 'floor' and 'wall'.");
        RuleFor(x => x.ScaleMode).Equal("fixed")
            .WithMessage("AR models must use fixed scale for accurate dimensions.");
        RuleFor(x => x.WidthMm).GreaterThan(0).LessThanOrEqualTo(5000);
        RuleFor(x => x.HeightMm).GreaterThan(0).LessThanOrEqualTo(5000);
        RuleFor(x => x.DepthMm).GreaterThan(0).LessThanOrEqualTo(5000);
    }
}

public class CategoryWriteRequestValidator : AbstractValidator<CategoryWriteRequest>
{
    public CategoryWriteRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Description).MaximumLength(1000);
        RuleFor(x => x.Slug)
            .Matches("^[a-z0-9]+(?:-[a-z0-9]+)*$")
            .When(x => !string.IsNullOrWhiteSpace(x.Slug))
            .WithMessage("Slug may contain lowercase letters, numbers and single hyphens only.");
    }
}

public class AddCartItemRequestValidator : AbstractValidator<AddCartItemRequest>
{
    public AddCartItemRequestValidator()
    {
        RuleFor(x => x.ProductSlug).NotEmpty();
        RuleFor(x => x.Quantity).InclusiveBetween(1, 10);
    }
}

public class TradeInEstimateRequestValidator : AbstractValidator<TradeInEstimateRequest>
{
    private static readonly string[] Categories = ["jewelry", "accessories", "leather", "textiles", "other"];
    private static readonly string[] Conditions = ["like_new", "good", "fair"];

    public TradeInEstimateRequestValidator()
    {
        RuleFor(x => x.Category).Must(value => Categories.Contains(value?.Trim().ToLowerInvariant()))
            .WithMessage("Choose a valid item category.");
        RuleFor(x => x.Condition).Must(value => Conditions.Contains(value?.Trim().ToLowerInvariant()))
            .WithMessage("Choose a valid item condition.");
        RuleFor(x => x.TargetProductSlug).MaximumLength(200);
        RuleFor(x => x.TargetProductPrice).GreaterThan(0).When(x => x.TargetProductPrice.HasValue);
    }
}

public class ApplyTradeInRequestValidator : AbstractValidator<ApplyTradeInRequest>
{
    public ApplyTradeInRequestValidator()
    {
        Include(new TradeInEstimateRequestValidator());
        RuleFor(x => x.BrandModel).NotEmpty().MaximumLength(160);
        RuleFor(x => x.HandoffMethod).Must(value => value is "pickup" or "drop_off")
            .WithMessage("Choose pickup or drop-off.");
    }
}

public class UpdateTradeInStatusRequestValidator : AbstractValidator<UpdateTradeInStatusRequest>
{
    public UpdateTradeInStatusRequestValidator()
    {
        RuleFor(x => x.Status).Must(value => value is "pending_verification" or "approved" or "rejected" or "cancelled")
            .WithMessage("Choose a valid trade-in status.");
        RuleFor(x => x.AdminNote).MaximumLength(1000);
    }
}

public class AddGiftBoxRequestValidator : AbstractValidator<AddGiftBoxRequest>
{
    public AddGiftBoxRequestValidator()
    {
        RuleFor(x => x.Items)
            .Cascade(CascadeMode.Stop)
            .NotNull()
            .Must(items => items.Count is >= 2 and <= 6)
            .WithMessage("Choose between 2 and 6 pieces for a Kavanoz box.")
            .Must(items => items.Select(item => item.ProductSlug).Distinct(StringComparer.OrdinalIgnoreCase).Count() == items.Count)
            .WithMessage("Each Kavanoz piece may only be selected once.");

        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(x => x.ProductSlug).NotEmpty().MaximumLength(200);
            item.RuleFor(x => x.Color).MaximumLength(80);
        });

        RuleFor(x => x.GiftMessage).MaximumLength(500);
        RuleFor(x => x.PackagingNotes).MaximumLength(500);
    }
}

public class AddSurpriseBoxRequestValidator : AbstractValidator<AddSurpriseBoxRequest>
{
    private static readonly string[] Recipients =
        ["girlfriend", "boyfriend", "partner", "friend", "sister", "brother", "mother", "father"];

    private static readonly string[] Vibes =
        ["cute", "elegant", "minimalist", "casual", "jewelry-heavy", "accessories"];

    public AddSurpriseBoxRequestValidator()
    {
        RuleFor(x => x.Recipient)
            .Must(value => Recipients.Contains(value, StringComparer.OrdinalIgnoreCase))
            .WithMessage("Choose a valid recipient.");

        RuleFor(x => x.Budget)
            .Must(value => value is 30 or 50 or 100)
            .WithMessage("Choose a supported Surprise Box budget.");

        RuleFor(x => x.Vibes)
            .Cascade(CascadeMode.Stop)
            .NotNull()
            .Must(values => values.Count is >= 1 and <= 4)
            .WithMessage("Choose between 1 and 4 gift vibes.")
            .Must(values => values.Distinct(StringComparer.OrdinalIgnoreCase).Count() == values.Count)
            .WithMessage("Each gift vibe may only be selected once.")
            .Must(values => values.All(value => Vibes.Contains(value, StringComparer.OrdinalIgnoreCase)))
            .WithMessage("Choose only supported gift vibes.");

        RuleFor(x => x.GiftMessage).MaximumLength(500);
        RuleFor(x => x.SpecialInstructions).MaximumLength(350);
    }
}

public class UpdateCartItemRequestValidator : AbstractValidator<UpdateCartItemRequest>
{
    public UpdateCartItemRequestValidator()
    {
        RuleFor(x => x.Quantity).InclusiveBetween(0, 10);
    }
}

public class CheckoutRequestValidator : AbstractValidator<CheckoutRequest>
{
    public CheckoutRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Delivery).Must(v => v is "standard" or "express")
            .WithMessage("Delivery must be 'standard' or 'express'.");
    }
}

public class ValidateCouponRequestValidator : AbstractValidator<ValidateCouponRequest>
{
    public ValidateCouponRequestValidator()
    {
        RuleFor(x => x.Code).NotEmpty().MaximumLength(40);
        RuleFor(x => x.Subtotal).GreaterThanOrEqualTo(0);
    }
}

public class CouponWriteRequestValidator : AbstractValidator<CouponWriteRequest>
{
    public CouponWriteRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Code)
            .NotEmpty()
            .MaximumLength(40)
            .Matches("^[A-Za-z0-9_-]+$")
            .WithMessage("Codes may contain letters, numbers, dashes and underscores only.");
        RuleFor(x => x.DiscountType)
            .Must(value => value is "percentage" or "fixed_amount")
            .WithMessage("Discount type must be 'percentage' or 'fixed_amount'.");
        RuleFor(x => x.Value).GreaterThan(0);
        RuleFor(x => x.Value)
            .LessThanOrEqualTo(100)
            .When(x => x.DiscountType == "percentage")
            .WithMessage("Percentage discounts cannot exceed 100%.");
        RuleFor(x => x.MinimumSpend).GreaterThanOrEqualTo(0);
        RuleFor(x => x.UsageLimit).GreaterThan(0).When(x => x.UsageLimit.HasValue);
        RuleFor(x => x.ExpiresAt)
            .GreaterThan(x => x.StartsAt)
            .When(x => x.StartsAt.HasValue && x.ExpiresAt.HasValue)
            .WithMessage("Expiry must be after the start date.");
    }
}

public class SiteSettingsDtoValidator : AbstractValidator<SiteSettingsDto>
{
    public SiteSettingsDtoValidator()
    {
        RuleFor(x => x.SiteName).NotEmpty().MaximumLength(120);
        RuleFor(x => x.ContactEmail).EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.ContactEmail));
        RuleFor(x => x.HeroHeadline).MaximumLength(200);
        RuleFor(x => x.InstagramUrl).Must(BeAUrl).When(x => !string.IsNullOrWhiteSpace(x.InstagramUrl))
            .WithMessage("Instagram URL must be a valid absolute URL.");
        RuleFor(x => x.TiktokUrl).Must(BeAUrl).When(x => !string.IsNullOrWhiteSpace(x.TiktokUrl))
            .WithMessage("TikTok URL must be a valid absolute URL.");
        RuleFor(x => x.WhatsappPhone).MaximumLength(60);
        RuleFor(x => x.PinterestUrl).Must(BeAUrl).When(x => !string.IsNullOrWhiteSpace(x.PinterestUrl))
            .WithMessage("Pinterest URL must be a valid absolute URL.");
    }

    private static bool BeAUrl(string? value) =>
        Uri.TryCreate(value, UriKind.Absolute, out var uri) && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
}

public class UpdateOrderStatusRequestValidator : AbstractValidator<UpdateOrderStatusRequest>
{
    private static readonly string[] Allowed =
        ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"];

    public UpdateOrderStatusRequestValidator()
    {
        RuleFor(x => x.Status)
            .NotEmpty()
            .Must(v => Allowed.Contains(v.ToLowerInvariant()))
            .WithMessage($"Status must be one of: {string.Join(", ", Allowed)}.");
    }
}

public class CreateExchangeRequestValidator : AbstractValidator<CreateExchangeRequest>
{
    public CreateExchangeRequestValidator()
    {
        RuleFor(x => x.OrderItemId).GreaterThan(0);
        RuleFor(x => x.NewProductVariantId).GreaterThan(0);
        RuleFor(x => x.InvoiceIntact).Equal(true)
            .WithMessage("Keep the original invoice or receipt for an exchange.");
        RuleFor(x => x.PackagingIntact).Equal(true)
            .WithMessage("The original product box and packaging must be intact for an exchange.");
        RuleFor(x => x.CustomerNote).MaximumLength(1000);
    }
}

public class UpdateExchangeStatusRequestValidator : AbstractValidator<UpdateExchangeStatusRequest>
{
    private static readonly string[] Allowed = ["approved", "rejected", "cancelled", "completed"];

    public UpdateExchangeStatusRequestValidator()
    {
        RuleFor(x => x.Status).NotEmpty().Must(value => Allowed.Contains(value.ToLowerInvariant()))
            .WithMessage($"Status must be one of: {string.Join(", ", Allowed)}.");
        RuleFor(x => x.AdminNote).MaximumLength(1000);
    }
}

public class UpdateUserRoleRequestValidator : AbstractValidator<UpdateUserRoleRequest>
{
    private static readonly string[] Allowed = ["Admin", "Staff", "Customer"];

    public UpdateUserRoleRequestValidator()
    {
        RuleFor(x => x.Role)
            .NotEmpty()
            .Must(v => Allowed.Contains(v, StringComparer.OrdinalIgnoreCase))
            .WithMessage($"Role must be one of: {string.Join(", ", Allowed)}.");
    }
}

public class PopupWriteRequestValidator : AbstractValidator<PopupWriteRequest>
{
<<<<<<< ours
    private static readonly string[] AllowedTypes = ["promotional", "newsletter", "announcement", "support_care", "custom"];
    private static readonly string[] AllowedPlacements = ["center_modal", "bottom_bar", "slide_in_bottom_right", "slide_in_bottom_left"];
    private static readonly string[] AllowedTriggers = ["delay", "scroll_depth", "exit_intent", "immediate"];
    private static readonly string[] AllowedAudiences = ["all", "guests_only", "registered_only"];
    private static readonly string[] AllowedDevices = ["all", "desktop", "mobile"];

    public PopupWriteRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Type)
            .NotEmpty()
            .Must(t => AllowedTypes.Contains(t.ToLowerInvariant()))
            .WithMessage($"Type must be one of: {string.Join(", ", AllowedTypes)}.");

        RuleFor(x => x.Placement)
            .NotEmpty()
            .Must(p => AllowedPlacements.Contains(p.ToLowerInvariant()))
            .WithMessage($"Placement must be one of: {string.Join(", ", AllowedPlacements)}.");

        RuleFor(x => x.TriggerType)
            .NotEmpty()
            .Must(t => AllowedTriggers.Contains(t.ToLowerInvariant()))
            .WithMessage($"TriggerType must be one of: {string.Join(", ", AllowedTriggers)}.");

        RuleFor(x => x.TriggerValue)
            .GreaterThanOrEqualTo(0)
            .WithMessage("TriggerValue must be 0 or greater.");

        RuleFor(x => x.TargetAudience)
            .NotEmpty()
            .Must(a => AllowedAudiences.Contains(a.ToLowerInvariant()))
            .WithMessage($"TargetAudience must be one of: {string.Join(", ", AllowedAudiences)}.");

        RuleFor(x => x.DeviceTarget)
            .NotEmpty()
            .Must(d => AllowedDevices.Contains(d.ToLowerInvariant()))
            .WithMessage($"DeviceTarget must be one of: {string.Join(", ", AllowedDevices)}.");

        RuleFor(x => x.CooldownDays).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.TitleTr).MaximumLength(200);
        RuleFor(x => x.Badge).MaximumLength(80);
        RuleFor(x => x.BadgeTr).MaximumLength(80);
        RuleFor(x => x.Description).MaximumLength(2000);
        RuleFor(x => x.DescriptionTr).MaximumLength(2000);
        RuleFor(x => x.PrimaryCtaText).MaximumLength(80);
        RuleFor(x => x.PrimaryCtaTextTr).MaximumLength(80);
        RuleFor(x => x.PrimaryCtaUrl).MaximumLength(500);
        RuleFor(x => x.SecondaryCtaText).MaximumLength(80);
        RuleFor(x => x.SecondaryCtaTextTr).MaximumLength(80);
        RuleFor(x => x.CouponCode).MaximumLength(40);
        RuleFor(x => x.TargetPages).MaximumLength(1000);

        RuleFor(x => x)
            .Must(x => !x.StartsAt.HasValue || !x.ExpiresAt.HasValue || x.ExpiresAt > x.StartsAt)
            .WithMessage("ExpiresAt must be later than StartsAt.");
    }
}

public class TrackPopupEventRequestValidator : AbstractValidator<TrackPopupEventRequest>
{
    private static readonly string[] AllowedEvents = ["impression", "click", "conversion"];

    public TrackPopupEventRequestValidator()
    {
        RuleFor(x => x.EventType)
            .NotEmpty()
            .Must(e => AllowedEvents.Contains(e.ToLowerInvariant()))
            .WithMessage($"EventType must be one of: {string.Join(", ", AllowedEvents)}.");
    }
}

=======
    public PopupWriteRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(160);
        RuleFor(x => x.Title).NotEmpty().MaximumLength(240);
        RuleFor(x => x.DeviceTarget).Must(x => x is "all" or "desktop" or "mobile");
        RuleFor(x => x.TriggerValue).InclusiveBetween(0, 100).When(x => x.TriggerType == MersTassel.Domain.Enums.PopupTriggerType.ScrollDepth);
        RuleFor(x => x.TriggerValue).GreaterThanOrEqualTo(0);
        RuleFor(x => x.CooldownDays).InclusiveBetween(0, 365);
        RuleFor(x => x.ExpiresAt).GreaterThan(x => x.StartsAt).When(x => x.StartsAt.HasValue && x.ExpiresAt.HasValue);
        RuleFor(x => x.PrimaryCtaUrl).MaximumLength(500);
    }
}
>>>>>>> theirs
