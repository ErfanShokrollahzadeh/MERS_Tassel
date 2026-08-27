using System.Linq.Expressions;
using MersTassel.Domain.Common;
using MersTassel.Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace MersTassel.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityDbContext<AppUser, AppRole, string>(options)
{
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
    public DbSet<ProductMedia> ProductMedia => Set<ProductMedia>();
    public DbSet<Cart> Carts => Set<Cart>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<Coupon> Coupons => Set<Coupon>();
    public DbSet<TradeInRequest> TradeInRequests => Set<TradeInRequest>();
    public DbSet<StoreWallet> StoreWallets => Set<StoreWallet>();
    public DbSet<StoreWalletTransaction> StoreWalletTransactions => Set<StoreWalletTransaction>();
    public DbSet<ExchangeRequest> ExchangeRequests => Set<ExchangeRequest>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<InventoryReservation> InventoryReservations => Set<InventoryReservation>();
    public DbSet<ProcessedStripeEvent> ProcessedStripeEvents => Set<ProcessedStripeEvent>();
    public DbSet<SiteSettings> SiteSettings => Set<SiteSettings>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<NewsletterSubscriber> NewsletterSubscribers => Set<NewsletterSubscriber>();
    public DbSet<ContactMessage> ContactMessages => Set<ContactMessage>();

    /// <summary>
    /// SQLite has no native date or decimal type, and EF refuses to translate ORDER BY or
    /// comparisons over its default TEXT mappings. Both converters below encode to integers
    /// that sort identically to the original values, so filtering, sorting and aggregation
    /// all run in SQL instead of being pulled into memory.
    /// </summary>
    protected override void ConfigureConventions(ModelConfigurationBuilder builder)
    {
        builder.Properties<DateTimeOffset>().HaveConversion<DateTimeOffsetToBinaryConverter>();
        builder.Properties<DateTimeOffset?>().HaveConversion<DateTimeOffsetToBinaryConverter>();

        // Money is stored as minor units (cents) — exact, unlike a float, and orderable.
        builder.Properties<decimal>().HaveConversion<MoneyToMinorUnitsConverter>();
        builder.Properties<decimal?>().HaveConversion<NullableMoneyToMinorUnitsConverter>();
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // SQLite represents booleans as 0/1 while PostgreSQL uses native FALSE/TRUE values.
        // Re-apply provider-specific filtered-index predicates after the shared entity
        // configurations so each migrations assembly emits valid SQL for its database.
        var activeRowPredicate = Database.IsNpgsql()
            ? "\"isDelete\" = FALSE"
            : "\"isDelete\" = 0";

        builder.Entity<NewsletterSubscriber>()
            .HasIndex(x => x.NormalizedEmail)
            .IsUnique()
            .HasFilter(activeRowPredicate);

        builder.Entity<Cart>()
            .HasIndex(x => new { x.UserId, x.Status })
            .IsUnique()
            .HasFilter($"\"Status\" = 'Open' AND {activeRowPredicate}");

        // Every soft-deletable entity gets `isDelete` as its column name and a global filter,
        // so ordinary queries never see deleted rows without each call site remembering to ask.
        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            if (!typeof(ISoftDeletable).IsAssignableFrom(entityType.ClrType)) continue;

            builder.Entity(entityType.ClrType)
                .Property(nameof(ISoftDeletable.IsDelete))
                .HasColumnName("isDelete");

            var parameter = Expression.Parameter(entityType.ClrType, "e");
            var filter = Expression.Lambda(
                Expression.Equal(
                    Expression.Property(parameter, nameof(ISoftDeletable.IsDelete)),
                    Expression.Constant(false)),
                parameter);

            builder.Entity(entityType.ClrType).HasQueryFilter(filter);
        }

        // AppUser carries the flag but is not a SoftDeletableEntity (Identity owns its base).
        builder.Entity<AppUser>().Property(u => u.IsDelete).HasColumnName("isDelete");
        builder.Entity<AppUser>().HasQueryFilter(u => !u.IsDelete);

        // RefreshToken has no soft-delete of its own, but it requires a user. Without a
        // matching filter EF warns that the required principal can be filtered away — and a
        // deactivated account's tokens should stop working anyway, so filter on the owner.
        builder.Entity<RefreshToken>().HasQueryFilter(t => !t.User.IsDelete);
    }

    public override int SaveChanges()
    {
        StampTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        StampTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void StampTimestamps()
    {
        foreach (var entry in ChangeTracker.Entries<SoftDeletableEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTimeOffset.UtcNow;
                    entry.Entity.UpdatedAt = DateTimeOffset.UtcNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTimeOffset.UtcNow;
                    break;
            }
        }
    }
}
