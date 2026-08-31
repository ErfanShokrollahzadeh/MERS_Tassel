using System.Globalization;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using MersTassel.Domain.Enums;
using MersTassel.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MersTassel.Infrastructure.Services;

public class MarketingService(AppDbContext db) : IMarketingService
{
    public async Task<MarketingDto> GetAsync(CancellationToken ct = default)
    {
        // Keep every query boundary as an explicitly UTC DateTimeOffset. DateTimeOffset.Date
        // returns an Unspecified DateTime; converting that value back on a non-UTC host applies
        // the machine's local offset, which PostgreSQL rejects for timestamptz parameters.
        var now = DateTimeOffset.UtcNow;
        var today = new DateTimeOffset(now.Year, now.Month, now.Day, 0, 0, 0, TimeSpan.Zero);
        var currentStart = today.AddDays(-29);
        var currentEnd = today.AddDays(1);
        var previousStart = currentStart.AddDays(-30);

        var paidOrders = await db.Orders
            .Where(o => o.PaymentStatus == PaymentStatus.Paid && o.CreatedAt >= previousStart && o.CreatedAt < currentEnd)
            .Select(o => new { o.UserId, o.Total, o.Channel, o.CreatedAt })
            .ToListAsync(ct);
        var carts = await db.Carts
            .Where(c => c.CreatedAt >= previousStart && c.CreatedAt < currentEnd)
            .Select(c => new { c.Id, c.UserId, c.CreatedAt, HasItems = c.Items.Any() })
            .ToListAsync(ct);

        var currentPaid = paidOrders.Where(o => o.CreatedAt >= currentStart).ToList();
        var previousPaid = paidOrders.Where(o => o.CreatedAt < currentStart).ToList();
        var currentCartUsers = carts.Where(c => c.CreatedAt >= currentStart).Select(c => c.UserId).Distinct().Count();
        var previousCartUsers = carts.Where(c => c.CreatedAt < currentStart).Select(c => c.UserId).Distinct().Count();
        var currentConversion = currentCartUsers == 0 ? 0m : Math.Round(currentPaid.Count * 100m / currentCartUsers, 1);
        var previousConversion = previousCartUsers == 0 ? 0m : Math.Round(previousPaid.Count * 100m / previousCartUsers, 1);
        var revenue = currentPaid.Sum(o => o.Total);

        var attribution = currentPaid
            .GroupBy(o => string.IsNullOrWhiteSpace(o.Channel) ? "unknown" : o.Channel)
            .Select(g => new ChannelAttributionDto(
                g.Key,
                g.Count(),
                g.Sum(o => o.Total),
                revenue == 0 ? 0 : Math.Round(g.Sum(o => o.Total) * 100m / revenue, 1)))
            .OrderByDescending(row => row.Revenue)
            .Take(5)
            .ToList();

        var currentCarts = carts.Where(c => c.CreatedAt >= currentStart).ToList();
        var checkoutCount = await db.Orders.CountAsync(o => o.CreatedAt >= currentStart && o.CreatedAt < currentEnd, ct);

        var cohortWeekStart = StartOfIsoWeek(today).AddDays(-21);
        var cohortOrders = await db.Orders
            .Where(o => o.PaymentStatus == PaymentStatus.Paid && o.UserId != null && o.CreatedAt < currentEnd)
            .Select(o => new { UserId = o.UserId!, o.CreatedAt })
            .ToListAsync(ct);
        var firstOrders = cohortOrders.GroupBy(o => o.UserId).ToDictionary(g => g.Key, g => g.Min(o => o.CreatedAt));
        var cohorts = new List<CohortRowDto>();
        for (var i = 0; i < 4; i++)
        {
            var week = cohortWeekStart.AddDays(i * 7);
            var nextWeek = week.AddDays(7);
            var members = firstOrders.Where(x => x.Value >= week && x.Value < nextWeek).Select(x => x.Key).ToHashSet();
            var retention = new List<decimal>();
            for (var relativeWeek = 0; relativeWeek < 4; relativeWeek++)
            {
                if (relativeWeek == 0)
                {
                    retention.Add(members.Count == 0 ? 0 : 100);
                    continue;
                }

                var retentionStart = week.AddDays(relativeWeek * 7);
                var retentionEnd = retentionStart.AddDays(7);
                var retained = cohortOrders.Where(o => members.Contains(o.UserId) && o.CreatedAt >= retentionStart && o.CreatedAt < retentionEnd)
                    .Select(o => o.UserId).Distinct().Count();
                retention.Add(members.Count == 0 ? 0 : Math.Round(retained * 100m / members.Count, 1));
            }
            cohorts.Add(new CohortRowDto($"{ISOWeek.GetYear(week.DateTime)}-W{ISOWeek.GetWeekOfYear(week.DateTime):00}", members.Count, retention));
        }

        var series = Enumerable.Range(0, 30).Select(offset =>
        {
            var day = currentStart.AddDays(offset);
            var dayOrders = currentPaid.Where(o => o.CreatedAt >= day && o.CreatedAt < day.AddDays(1)).ToList();
            return new RevenuePointDto(day.ToString("dd MMM", CultureInfo.InvariantCulture), day.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture), dayOrders.Sum(o => o.Total), dayOrders.Count);
        }).ToList();

        var sessions = currentPaid.Where(o => o.UserId != null).Select(o => o.UserId).Distinct().Count();
        var previousSessions = previousPaid.Where(o => o.UserId != null).Select(o => o.UserId).Distinct().Count();
        return new MarketingDto
        {
            TotalSessions = sessions,
            SessionsChangePct = PercentChange(previousSessions, sessions),
            ConversionRate = currentConversion,
            ConversionChangePct = PercentChange(previousConversion, currentConversion),
            Revenue = revenue,
            RevenueChangePct = PercentChange(previousPaid.Sum(o => o.Total), revenue),
            AcquisitionCost = 0,
            RoasMultiplier = 0,
            Attribution = attribution,
            Funnel =
            [
                new("Visitors", currentCarts.Select(c => c.UserId).Distinct().Count()),
                new("Add-to-cart", currentCarts.Count(c => c.HasItems)),
                new("Checkout", checkoutCount),
                new("Purchase", currentPaid.Count),
            ],
            Cohorts = cohorts,
            RevenueSeries = series,
        };
    }

    private static DateTimeOffset StartOfIsoWeek(DateTimeOffset date)
    {
        var utcDate = new DateTimeOffset(date.Year, date.Month, date.Day, 0, 0, 0, TimeSpan.Zero);
        return utcDate.AddDays(-((7 + (int)date.DayOfWeek - (int)DayOfWeek.Monday) % 7));
    }

    private static decimal PercentChange(decimal previous, decimal current)
    {
        if (previous == 0) return current == 0 ? 0 : 100;
        return Math.Round((current - previous) / previous * 100m, 1);
    }
}
