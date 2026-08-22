using MersTassel.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MersTassel.Infrastructure.Data;

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> b)
    {
        b.ToTable("Categories");
        b.Property(x => x.Name).HasMaxLength(100).IsRequired();
        b.Property(x => x.NameTr).HasMaxLength(100);
        b.Property(x => x.Slug).HasMaxLength(100).IsRequired();
        b.Property(x => x.Description).HasMaxLength(1000);
        b.Property(x => x.ImagePath).HasMaxLength(400);

        b.HasIndex(x => x.Slug).IsUnique();
        b.HasIndex(x => x.IsDelete);
    }
}

public class NewsletterSubscriberConfiguration : IEntityTypeConfiguration<NewsletterSubscriber>
{
    public void Configure(EntityTypeBuilder<NewsletterSubscriber> b)
    {
        b.ToTable("NewsletterSubscribers");
        b.Property(x => x.Email).HasMaxLength(254).IsRequired();
        b.Property(x => x.NormalizedEmail).HasMaxLength(254).IsRequired();
        b.Property(x => x.Locale).HasMaxLength(5).IsRequired();
        b.Property(x => x.Source).HasMaxLength(20).IsRequired();

        b.HasIndex(x => x.NormalizedEmail)
            .IsUnique()
            .HasFilter("\"isDelete\" = 0");
        b.HasIndex(x => x.IsDelete);
        b.HasIndex(x => x.CreatedAt);
    }
}

public class ContactMessageConfiguration : IEntityTypeConfiguration<ContactMessage>
{
    public void Configure(EntityTypeBuilder<ContactMessage> b)
    {
        b.ToTable("ContactMessages");
        b.Property(x => x.Name).HasMaxLength(120).IsRequired();
        b.Property(x => x.Email).HasMaxLength(254).IsRequired();
        b.Property(x => x.Topic).HasMaxLength(24).IsRequired();
        b.Property(x => x.Message).HasMaxLength(4000).IsRequired();
        b.Property(x => x.Locale).HasMaxLength(5).IsRequired();
        b.Property(x => x.DeliveryStatus).HasMaxLength(16).IsRequired();

        b.HasIndex(x => x.CreatedAt);
        b.HasIndex(x => x.DeliveryStatus);
        b.HasIndex(x => x.IsDelete);
    }
}

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> b)
    {
        b.ToTable("Products");
        b.Property(x => x.Name).HasMaxLength(200).IsRequired();
        b.Property(x => x.NameTr).HasMaxLength(200);
        b.Property(x => x.Slug).HasMaxLength(200).IsRequired();
        b.Property(x => x.Description).HasMaxLength(2000);
        b.Property(x => x.Story).HasMaxLength(4000);
        b.Property(x => x.Material).HasMaxLength(300);
        b.Property(x => x.Dimensions).HasMaxLength(300);
        b.Property(x => x.Currency).HasMaxLength(3).IsRequired();
        b.Property(x => x.Sku).HasMaxLength(64);
        b.Property(x => x.SeoTitle).HasMaxLength(70);
        b.Property(x => x.MetaDescription).HasMaxLength(170);

        b.HasIndex(x => x.Slug).IsUnique();
        b.HasIndex(x => x.CategoryId);
        b.HasIndex(x => x.IsDelete);
        b.HasIndex(x => x.IsFeatured);

        b.HasOne(x => x.Category)
            .WithMany(c => c.Products)
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class ProductVariantConfiguration : IEntityTypeConfiguration<ProductVariant>
{
    public void Configure(EntityTypeBuilder<ProductVariant> b)
    {
        b.ToTable("ProductVariants");
        b.Property(x => x.Title).HasMaxLength(120).IsRequired();
        b.Property(x => x.Sku).HasMaxLength(64).IsRequired();
        b.Property(x => x.Color).HasMaxLength(80);
        b.Property(x => x.ColorTr).HasMaxLength(80);
        b.Property(x => x.SwatchHex).HasMaxLength(9);

        b.HasIndex(x => x.Sku).IsUnique();
        b.HasIndex(x => x.ProductId);
        b.HasIndex(x => x.IsDelete);

        b.HasOne(x => x.Product)
            .WithMany(p => p.Variants)
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class ProductMediaConfiguration : IEntityTypeConfiguration<ProductMedia>
{
    public void Configure(EntityTypeBuilder<ProductMedia> b)
    {
        b.ToTable("ProductMedia");
        b.Property(x => x.ImagePath).HasMaxLength(400).IsRequired();
        b.Property(x => x.Alt).HasMaxLength(200);

        b.HasIndex(x => x.ProductId);
        b.HasIndex(x => x.IsDelete);

        b.HasOne(x => x.Product)
            .WithMany(p => p.Media)
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class CartConfiguration : IEntityTypeConfiguration<Cart>
{
    public void Configure(EntityTypeBuilder<Cart> b)
    {
        b.ToTable("Carts");
        b.Property(x => x.Email).HasMaxLength(254);
        b.Property(x => x.Currency).HasMaxLength(3);
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(16);

        b.HasIndex(x => x.UserId);

        // At most one open cart per user; converted/abandoned carts are unconstrained history.
        b.HasIndex(x => new { x.UserId, x.Status })
            .IsUnique()
            .HasFilter("\"Status\" = 'Open' AND \"isDelete\" = 0");

        b.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class CartItemConfiguration : IEntityTypeConfiguration<CartItem>
{
    public void Configure(EntityTypeBuilder<CartItem> b)
    {
        b.ToTable("CartItems");
        b.Property(x => x.GiftBoxKey).HasMaxLength(64);
        b.Property(x => x.GiftMessage).HasMaxLength(500);
        b.Property(x => x.PackagingNotes).HasMaxLength(500);
        b.HasIndex(x => x.CartId);
        b.HasIndex(x => x.GiftBoxKey);

        b.HasOne(x => x.Cart)
            .WithMany(c => c.Items)
            .HasForeignKey(x => x.CartId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasOne(x => x.Variant)
            .WithMany()
            .HasForeignKey(x => x.ProductVariantId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> b)
    {
        b.ToTable("Orders");
        b.Property(x => x.Number).HasMaxLength(24).IsRequired();
        b.Property(x => x.Email).HasMaxLength(254).IsRequired();
        b.Property(x => x.CustomerName).HasMaxLength(200);
        b.Property(x => x.Currency).HasMaxLength(3);
        b.Property(x => x.Channel).HasMaxLength(40);
        b.Property(x => x.IdempotencyKey).HasMaxLength(72);
        b.Property(x => x.StripeCheckoutSessionId).HasMaxLength(255);
        b.Property(x => x.StripePaymentIntentId).HasMaxLength(255);

        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(16);
        b.Property(x => x.PaymentStatus).HasConversion<string>().HasMaxLength(16);


        b.HasIndex(x => x.Number).IsUnique();
        b.HasIndex(x => x.UserId);
        b.HasIndex(x => x.Status);
        b.HasIndex(x => x.IsDelete);
        b.HasIndex(x => x.CreatedAt);
        b.HasIndex(x => x.StripeCheckoutSessionId).IsUnique().HasFilter("\"StripeCheckoutSessionId\" IS NOT NULL");
        b.HasIndex(x => x.IdempotencyKey).IsUnique().HasFilter("\"IdempotencyKey\" IS NOT NULL");

        b.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> b)
    {
        b.ToTable("OrderItems");
        b.Property(x => x.ProductName).HasMaxLength(200).IsRequired();
        b.Property(x => x.ProductSlug).HasMaxLength(200);
        b.Property(x => x.Sku).HasMaxLength(64);
        b.Property(x => x.Color).HasMaxLength(80);
        b.Property(x => x.ImagePath).HasMaxLength(400);
        b.Property(x => x.GiftBoxKey).HasMaxLength(64);
        b.Property(x => x.GiftMessage).HasMaxLength(500);
        b.Property(x => x.PackagingNotes).HasMaxLength(500);

        b.HasIndex(x => x.OrderId);
        b.HasIndex(x => x.GiftBoxKey);

        b.HasOne(x => x.Order)
            .WithMany(o => o.Items)
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        // Keep the snapshot readable even if the variant is later removed.
        b.HasOne(x => x.Variant)
            .WithMany()
            .HasForeignKey(x => x.ProductVariantId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class InventoryReservationConfiguration : IEntityTypeConfiguration<InventoryReservation>
{
    public void Configure(EntityTypeBuilder<InventoryReservation> b)
    {
        b.ToTable("InventoryReservations");
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(16);

        b.HasIndex(x => new { x.Status, x.ExpiresAt });
        b.HasIndex(x => x.OrderId);

        b.HasOne(x => x.Order)
            .WithMany(o => o.Reservations)
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasOne(x => x.Variant)
            .WithMany()
            .HasForeignKey(x => x.ProductVariantId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class ProcessedStripeEventConfiguration : IEntityTypeConfiguration<ProcessedStripeEvent>
{
    public void Configure(EntityTypeBuilder<ProcessedStripeEvent> b)
    {
        b.ToTable("ProcessedStripeEvents");
        b.Property(x => x.EventId).HasMaxLength(255).IsRequired();
        b.Property(x => x.EventType).HasMaxLength(120);
        b.HasIndex(x => x.EventId).IsUnique();
    }
}

public class SiteSettingsConfiguration : IEntityTypeConfiguration<SiteSettings>
{
    public void Configure(EntityTypeBuilder<SiteSettings> b)
    {
        b.ToTable("SiteSettings");
        b.Property(x => x.SiteName).HasMaxLength(120);
        b.Property(x => x.LogoPath).HasMaxLength(400);
        b.Property(x => x.HeroImagePath).HasMaxLength(400);
        b.Property(x => x.HeroEyebrow).HasMaxLength(120);
        b.Property(x => x.HeroHeadline).HasMaxLength(200);
        b.Property(x => x.HeroSubheadline).HasMaxLength(500);
        b.Property(x => x.ContactEmail).HasMaxLength(254);
        b.Property(x => x.ContactPhone).HasMaxLength(60);
        b.Property(x => x.ContactAddress).HasMaxLength(400);
        b.Property(x => x.InstagramUrl).HasMaxLength(300);
        b.Property(x => x.TiktokUrl).HasMaxLength(300);
        b.Property(x => x.WhatsappPhone).HasMaxLength(60);
        b.Property(x => x.PinterestUrl).HasMaxLength(300);
        b.Property(x => x.AboutHeadline).HasMaxLength(200);
        b.Property(x => x.AboutBody).HasMaxLength(4000);
    }
}

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> b)
    {
        b.ToTable("RefreshTokens");
        b.Property(x => x.TokenHash).HasMaxLength(88).IsRequired();
        b.Property(x => x.ReplacedByTokenHash).HasMaxLength(88);

        b.HasIndex(x => x.TokenHash).IsUnique();
        b.HasIndex(x => x.UserId);

        b.HasOne(x => x.User)
            .WithMany(u => u.RefreshTokens)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
