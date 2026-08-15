using System.Globalization;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using MersTassel.Domain.Enums;
using MersTassel.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MersTassel.Infrastructure.Services;

/// <summary>
/// Every figure on the admin overview is computed from the orders and catalog tables. When
/// there is no trading history the numbers are genuinely zero rather than invented.
/// </summary>
public class DashboardService(AppDbContext db) : IDashboardService
{
    public async Task<DashboardDto> GetAsync(CancellationToken ct = default)
    {
        var now = DateTimeOffset.UtcNow;
        var windowStart = now.Date.AddDays(-6);
        var previousStart = now.Date.AddDays(-13);

        // Revenue counts paid orders only; pending ones are not money in the bank.
        var paid = db.Orders.Where(o => o.PaymentStatus == PaymentStatus.Paid);

        var current = await paid.Where(o => o.CreatedAt >= windowStart)
            .Select(o => new { o.Total, o.CreatedAt, o.UserId })
            .ToListAsync(ct);

        var previous = await paid
            .Where(o => o.CreatedAt >= previousStart && o.CreatedAt < windowStart)
            .Select(o => new { o.Total, o.UserId })
            .ToListAsync(ct);

        var currentRevenue = current.Sum(o => o.Total);
        var previousRevenue = previous.Sum(o => o.Total);
        var currentAov = current.Count == 0 ? 0 : currentRevenue / current.Count;
        var previousAov = previous.Count == 0 ? 0 : previousRevenue / previous.Count;

        var series = new List<RevenuePointDto>();
        for (var i = 0; i < 7; i++)
        {
            var day = windowStart.AddDays(i);
            var next = day.AddDays(1);
            var dayOrders = current.Where(o => o.CreatedAt >= day && o.CreatedAt < next).ToList();

            series.Add(new RevenuePointDto(
                day.ToString("ddd", CultureInfo.InvariantCulture),
                day.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                dayOrders.Sum(o => o.Total),
                dayOrders.Count));
        }

        var customerCount = await db.Users.CountAsync(ct);

        // "Returning" = customers with more than one paid order, over all customers who ever paid.
        var payingCustomers = await paid
            .Where(o => o.UserId != null)
            .GroupBy(o => o.UserId)
            .Select(g => new { UserId = g.Key, Orders = g.Count() })
            .ToListAsync(ct);

        var returningPct = payingCustomers.Count == 0
            ? 0m
            : Math.Round(payingCustomers.Count(c => c.Orders > 1) * 100m / payingCustomers.Count, 1);

        var variants = await db.ProductVariants
            .Where(v => v.IsActive)
            .Select(v => new { v.Stock, v.LowStockThreshold, v.ProductId, Price = v.PriceOverride ?? v.Product.Price })
            .ToListAsync(ct);

        var stockByProduct = variants.GroupBy(v => v.ProductId)
            .ToDictionary(g => g.Key, g => g.Sum(v => v.Stock));

        var recentOrders = await db.Orders
            .Include(o => o.Items)
            .OrderByDescending(o => o.CreatedAt)
            .Take(5)
            .AsSplitQuery()
            .ToListAsync(ct);

        // Money columns are stored as minor units via a value converter. Summing an expression
        // over them in SQL would aggregate the raw cents and skip the inverse conversion, so
        // the rows are materialized and totalled here where the decimals are already restored.
        var soldItems = await db.OrderItems
            .Where(i => i.Order.PaymentStatus == PaymentStatus.Paid)
            .Select(i => new { i.ProductSlug, i.ProductName, i.Quantity, i.UnitPrice })
            .ToListAsync(ct);

        var topProducts = soldItems
            .GroupBy(i => new { i.ProductSlug, i.ProductName })
            .Select(g => new
            {
                g.Key.ProductSlug,
                g.Key.ProductName,
                Units = g.Sum(i => i.Quantity),
                Revenue = g.Sum(i => i.UnitPrice * i.Quantity),
            })
            .OrderByDescending(g => g.Units)
            .Take(4)
            .ToList();

        var slugs = topProducts.Select(t => t.ProductSlug).ToList();
        var productLookup = await db.Products
            .Where(p => slugs.Contains(p.Slug))
            .Select(p => new
            {
                p.Id,
                p.Slug,
                p.Price,
                Image = p.Media.Where(m => !m.IsDelete).OrderBy(m => m.SortOrder).Select(m => m.ImagePath).FirstOrDefault(),
            })
            .ToListAsync(ct);

        return new DashboardDto
        {
            NetRevenue = currentRevenue,
            RevenueChangePct = PercentChange(previousRevenue, currentRevenue),
            OrderCount = current.Count,
            OrderChangePct = PercentChange(previous.Count, current.Count),
            AverageOrderValue = Math.Round(currentAov, 2),
            AovChangePct = PercentChange(previousAov, currentAov),
            CustomerCount = customerCount,
            ReturningCustomerPct = returningPct,

            ActiveProducts = await db.Products.CountAsync(p => p.IsActive, ct),
            LowStockCount = stockByProduct.Count(kv => kv.Value > 0 && kv.Value < 8),
            OutOfStockCount = stockByProduct.Count(kv => kv.Value == 0),
            InventoryValue = variants.Sum(v => v.Stock * v.Price),

            RevenueSeries = series,
            RecentOrders = recentOrders.Select(OrderService.ToDto).ToList(),
            TopProducts = topProducts.Select(t =>
            {
                var match = productLookup.FirstOrDefault(p => p.Slug == t.ProductSlug);
                return new TopProductDto
                {
                    Id = match?.Id ?? 0,
                    Name = t.ProductName,
                    Slug = t.ProductSlug,
                    Image = match?.Image,
                    UnitsSold = t.Units,
                    Revenue = t.Revenue,
                    Price = match?.Price ?? 0,
                };
            }).ToList(),
        };
    }

    /// <summary>
    /// Percent change guarded against a zero baseline, where the mathematical answer is
    /// undefined rather than infinite: no prior activity reports 0%, not a spurious spike.
    /// </summary>
    private static decimal PercentChange(decimal previous, decimal current)
    {
        if (previous == 0) return current == 0 ? 0 : 100;
        return Math.Round((current - previous) / previous * 100m, 1);
    }
}
