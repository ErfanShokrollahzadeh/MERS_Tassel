using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using MersTassel.Domain.Entities;
using MersTassel.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MersTassel.Infrastructure.Services;

public class NewsletterService(AppDbContext db) : INewsletterService
{
    public async Task<NewsletterSubscriptionDto> SubscribeAsync(
        NewsletterSubscribeRequest request, CancellationToken ct = default)
    {
        var email = request.Email.Trim();
        var normalized = email.ToUpperInvariant();
        var existing = await db.NewsletterSubscribers
            .SingleOrDefaultAsync(subscriber => subscriber.NormalizedEmail == normalized, ct);

        if (existing is not null)
        {
            return ToDto(existing, alreadySubscribed: true);
        }

        var subscriber = new NewsletterSubscriber
        {
            Email = email,
            NormalizedEmail = normalized,
            Locale = request.Locale,
            Source = request.Source,
        };

        db.NewsletterSubscribers.Add(subscriber);
        try
        {
            await db.SaveChangesAsync(ct);
            return ToDto(subscriber, alreadySubscribed: false);
        }
        catch (DbUpdateException)
        {
            // Two tabs can submit the same address at nearly the same time. The unique index
            // is the final authority; turn that race into the same idempotent response as an
            // ordinary repeat submission rather than leaking a database error to the visitor.
            db.Entry(subscriber).State = EntityState.Detached;
            var concurrentlyCreated = await db.NewsletterSubscribers
                .SingleOrDefaultAsync(item => item.NormalizedEmail == normalized, ct);
            if (concurrentlyCreated is null) throw;
            return ToDto(concurrentlyCreated, alreadySubscribed: true);
        }
    }

    private static NewsletterSubscriptionDto ToDto(NewsletterSubscriber subscriber, bool alreadySubscribed) => new()
    {
        Email = subscriber.Email,
        AlreadySubscribed = alreadySubscribed,
        SubscribedAt = subscriber.CreatedAt,
    };
}
