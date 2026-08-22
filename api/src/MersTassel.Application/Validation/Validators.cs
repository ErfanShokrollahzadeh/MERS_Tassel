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
