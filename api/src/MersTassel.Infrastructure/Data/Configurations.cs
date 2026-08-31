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

public class ProductModelAssetConfiguration : IEntityTypeConfiguration<ProductModelAsset>
{
    public void Configure(EntityTypeBuilder<ProductModelAsset> b)
    {
        b.ToTable("ProductModelAssets");
        b.Property(x => x.GlbPath).HasMaxLength(500).IsRequired();
        b.Property(x => x.UsdzPath).HasMaxLength(500);
        b.Property(x => x.PosterPath).HasMaxLength(500);
        b.Property(x => x.Alt).HasMaxLength(240).IsRequired();
        b.Property(x => x.Placement).HasMaxLength(16).IsRequired();
        b.Property(x => x.SupportedPlacements).HasMaxLength(30).IsRequired();
        b.Property(x => x.ScaleMode).HasMaxLength(16).IsRequired();
        b.Property(x => x.Status).HasMaxLength(20).IsRequired();
        b.Property(x => x.ValidationMessage).HasMaxLength(1000);
        b.Property(x => x.GlbBytes).IsRequired();
        // Include the soft-delete flag in the uniqueness key so an archived asset can be
        // replaced without a provider-specific filtered-index predicate.
        b.HasIndex(x => new { x.ProductId, x.VariantId, x.IsDelete }).IsUnique();
        b.HasIndex(x => x.Status);
        b.HasIndex(x => x.IsDelete);

        b.HasOne(x => x.Product)
            .WithMany(p => p.ModelAssets)
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasOne(x => x.Variant)
            .WithMany()
            .HasForeignKey(x => x.VariantId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class ProductModelGenerationJobConfiguration : IEntityTypeConfiguration<ProductModelGenerationJob>
{
    public void Configure(EntityTypeBuilder<ProductModelGenerationJob> b)
    {
        b.ToTable("ProductModelGenerationJobs");
        b.Property(x => x.RequestedByUserId).HasMaxLength(450).IsRequired();
        b.Property(x => x.ReviewedByUserId).HasMaxLength(450);
        b.Property(x => x.Provider).HasMaxLength(50).IsRequired();
        b.Property(x => x.ProviderJobId).HasMaxLength(200);
        b.Property(x => x.CaptureMethod).HasMaxLength(20).IsRequired();
        b.Property(x => x.CapturePathsJson).IsRequired();
        b.Property(x => x.SupportedPlacements).HasMaxLength(30).IsRequired();
        b.Property(x => x.DefaultPlacement).HasMaxLength(10).IsRequired();
        b.Property(x => x.Status).HasMaxLength(30).IsRequired();
        b.Property(x => x.Stage).HasMaxLength(120).IsRequired();
        b.Property(x => x.DraftGlbPath).HasMaxLength(500);
        b.Property(x => x.DraftPosterPath).HasMaxLength(500);
        b.Property(x => x.FailureCode).HasMaxLength(80);
        b.Property(x => x.FailureMessage).HasMaxLength(2000);
        b.Property(x => x.CaptureTokenHash).HasMaxLength(64).IsRequired();
        b.HasIndex(x => new { x.ProductId, x.Status });
        b.HasIndex(x => x.ProviderJobId);
        b.HasIndex(x => x.IsDelete);

        b.HasOne(x => x.Product).WithMany(x => x.ModelGenerationJobs)
            .HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne(x => x.Variant).WithMany().HasForeignKey(x => x.VariantId)
            .OnDelete(DeleteBehavior.SetNull);
        b.HasOne(x => x.RequestedByUser).WithMany().HasForeignKey(x => x.RequestedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.ReviewedByUser).WithMany().HasForeignKey(x => x.ReviewedByUserId)
            .OnDelete(DeleteBehavior.SetNull);
        b.HasOne(x => x.ApprovedModelAsset).WithMany().HasForeignKey(x => x.ApprovedModelAssetId)
            .OnDelete(DeleteBehavior.SetNull);
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

        b.HasOne(x => x.Coupon)
            .WithMany()
            .HasForeignKey(x => x.CouponId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class CouponConfiguration : IEntityTypeConfiguration<Coupon>
{
    public void Configure(EntityTypeBuilder<Coupon> b)
    {
        b.ToTable("Coupons");
        b.Property(x => x.Name).HasMaxLength(120).IsRequired();
        b.Property(x => x.Code).HasMaxLength(40).IsRequired();
        b.Property(x => x.NormalizedCode).HasMaxLength(40).IsRequired();
        b.Property(x => x.DiscountType).HasConversion<string>().HasMaxLength(20);

        b.HasIndex(x => x.NormalizedCode).IsUnique();
        b.HasIndex(x => x.IsActive);
        b.HasIndex(x => x.ExpiresAt);
        b.HasIndex(x => x.IsDelete);
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
        b.Property(x => x.CouponCode).HasMaxLength(40);
        b.Property(x => x.CouponDiscountType).HasMaxLength(20);


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

public class TradeInRequestConfiguration : IEntityTypeConfiguration<TradeInRequest>
{
    public void Configure(EntityTypeBuilder<TradeInRequest> b)
    {
        b.ToTable("TradeInRequests");
        b.Property(x => x.Category).HasMaxLength(40).IsRequired();
        b.Property(x => x.BrandModel).HasMaxLength(160).IsRequired();
        b.Property(x => x.ImagePath).HasMaxLength(400).IsRequired();
        b.Property(x => x.TargetProductSlug).HasMaxLength(200);
        b.Property(x => x.TargetProductName).HasMaxLength(200);
        b.Property(x => x.Currency).HasMaxLength(3).IsRequired();
        b.Property(x => x.AdminNote).HasMaxLength(1000);
        b.Property(x => x.Condition).HasConversion<string>().HasMaxLength(16);
        b.Property(x => x.HandoffMethod).HasConversion<string>().HasMaxLength(16);
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(24);

        b.HasIndex(x => x.CartId).IsUnique();
        b.HasIndex(x => x.OrderId).IsUnique();
        b.HasIndex(x => x.UserId);
        b.HasIndex(x => x.Status);
        b.HasIndex(x => x.CreatedAt);
        b.HasIndex(x => x.IsDelete);

        b.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        b.HasOne(x => x.Cart)
            .WithOne(x => x.TradeIn)
            .HasForeignKey<TradeInRequest>(x => x.CartId)
            .OnDelete(DeleteBehavior.SetNull);

        b.HasOne(x => x.Order)
            .WithOne(x => x.TradeIn)
            .HasForeignKey<TradeInRequest>(x => x.OrderId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class StoreWalletConfiguration : IEntityTypeConfiguration<StoreWallet>
{
    public void Configure(EntityTypeBuilder<StoreWallet> b)
    {
        b.ToTable("StoreWallets");
        b.Property(x => x.Currency).HasMaxLength(3).IsRequired();
        b.Property(x => x.ConcurrencyStamp).HasMaxLength(32).IsRequired().IsConcurrencyToken();
        b.HasIndex(x => new { x.UserId, x.Currency }).IsUnique();
        b.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class StoreWalletTransactionConfiguration : IEntityTypeConfiguration<StoreWalletTransaction>
{
    public void Configure(EntityTypeBuilder<StoreWalletTransaction> b)
    {
        b.ToTable("StoreWalletTransactions");
        b.Property(x => x.Type).HasConversion<string>().HasMaxLength(24);
        b.Property(x => x.Description).HasMaxLength(300).IsRequired();
        b.Property(x => x.ReferenceType).HasMaxLength(40).IsRequired();
        b.Property(x => x.ReferenceId).HasMaxLength(80).IsRequired();
        b.Property(x => x.IdempotencyKey).HasMaxLength(120).IsRequired();
        b.HasIndex(x => x.IdempotencyKey).IsUnique();
        b.HasIndex(x => new { x.WalletId, x.CreatedAt });
        b.HasOne(x => x.Wallet).WithMany(x => x.Transactions).HasForeignKey(x => x.WalletId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class ExchangeRequestConfiguration : IEntityTypeConfiguration<ExchangeRequest>
{
    public void Configure(EntityTypeBuilder<ExchangeRequest> b)
    {
        b.ToTable("ExchangeRequests");
        b.Property(x => x.Currency).HasMaxLength(3).IsRequired();
        b.Property(x => x.CustomerNote).HasMaxLength(1000);
        b.Property(x => x.AdminNote).HasMaxLength(1000);
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(24);
        b.HasIndex(x => x.UserId);
        b.HasIndex(x => x.OrderItemId);
        b.HasIndex(x => x.Status);
        b.HasIndex(x => x.IsDelete);
        b.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne(x => x.OrderItem).WithMany().HasForeignKey(x => x.OrderItemId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.NewProductVariant).WithMany().HasForeignKey(x => x.NewProductVariantId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.WalletTransaction).WithMany().HasForeignKey(x => x.WalletTransactionId).OnDelete(DeleteBehavior.SetNull);
        b.HasOne(x => x.SettlementOrder).WithMany().HasForeignKey(x => x.SettlementOrderId).OnDelete(DeleteBehavior.SetNull);
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

public class SupportTicketConfiguration : IEntityTypeConfiguration<SupportTicket>
{
    public void Configure(EntityTypeBuilder<SupportTicket> b)
    {
        b.ToTable("SupportTickets");
        b.Property(x => x.Number).HasMaxLength(24).IsRequired();
        b.Property(x => x.CustomerName).HasMaxLength(160).IsRequired();
        b.Property(x => x.CustomerEmail).HasMaxLength(254).IsRequired();
        b.Property(x => x.Subject).HasMaxLength(160).IsRequired();
        b.Property(x => x.Category).HasConversion<string>().HasMaxLength(24);
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(24);
        b.Property(x => x.Priority).HasConversion<string>().HasMaxLength(16);

        b.HasIndex(x => x.Number).IsUnique();
        b.HasIndex(x => new { x.Status, x.LastMessageAt });
        b.HasIndex(x => x.CustomerId);
        b.HasIndex(x => x.AssignedToUserId);
        b.HasIndex(x => x.OrderId);
        b.HasIndex(x => x.IsDelete);

        b.HasOne(x => x.Customer).WithMany().HasForeignKey(x => x.CustomerId).OnDelete(DeleteBehavior.SetNull);
        b.HasOne(x => x.AssignedToUser).WithMany().HasForeignKey(x => x.AssignedToUserId).OnDelete(DeleteBehavior.SetNull);
        b.HasOne(x => x.Order).WithMany().HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.SetNull);
    }
}

public class SupportTicketMessageConfiguration : IEntityTypeConfiguration<SupportTicketMessage>
{
    public void Configure(EntityTypeBuilder<SupportTicketMessage> b)
    {
        b.ToTable("SupportTicketMessages");
        b.Property(x => x.AuthorName).HasMaxLength(160).IsRequired();
        b.Property(x => x.Body).HasMaxLength(4000).IsRequired();
        b.HasIndex(x => new { x.TicketId, x.CreatedAt });
        b.HasIndex(x => x.AuthorUserId);
        b.HasOne(x => x.Ticket).WithMany(x => x.Messages).HasForeignKey(x => x.TicketId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne(x => x.AuthorUser).WithMany().HasForeignKey(x => x.AuthorUserId).OnDelete(DeleteBehavior.SetNull);
    }
}

public class SupportTicketAttachmentConfiguration : IEntityTypeConfiguration<SupportTicketAttachment>
{
    public void Configure(EntityTypeBuilder<SupportTicketAttachment> b)
    {
        b.ToTable("SupportTicketAttachments");
        b.Property(x => x.StoragePath).HasMaxLength(500).IsRequired();
        b.Property(x => x.OriginalFileName).HasMaxLength(240).IsRequired();
        b.Property(x => x.ContentType).HasMaxLength(100).IsRequired();
        b.HasIndex(x => x.MessageId);
        b.HasOne(x => x.Message).WithMany(x => x.Attachments).HasForeignKey(x => x.MessageId).OnDelete(DeleteBehavior.Cascade);
    }
}
