using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using MersTassel.Domain.Entities;
using MersTassel.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MersTassel.Infrastructure.Services;

public class SupportService(AppDbContext db) : ISupportService
{
    private static readonly string[] Statuses = ["open", "pending_customer", "in_progress", "resolved", "closed"];
    private static readonly string[] Priorities = ["low", "normal", "high", "urgent"];

    public async Task<SupportTicketDto> CreateAsync(string userId, CreateSupportTicketRequest request, CancellationToken ct = default)
    {
        var subject = request.Subject?.Trim() ?? "";
        var body = request.Message?.Trim() ?? "";
        if (subject.Length is < 3 or > 200) throw new ValidationException("subject", "Subject must be between 3 and 200 characters.");
        if (body.Length is < 2 or > 8000) throw new ValidationException("message", "Message must be between 2 and 8000 characters.");
        if (!Priorities.Contains(request.Priority)) throw new ValidationException("priority", "Choose a valid priority.");
        if (request.OrderId is int orderId && !await db.Orders.AnyAsync(x => x.Id == orderId && x.UserId == userId, ct))
            throw new ValidationException("orderId", "That order does not belong to your account.");

        var ticket = new SupportTicket { Number = $"TK-{DateTime.UtcNow:yyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}", Subject = subject, Category = string.IsNullOrWhiteSpace(request.Category) ? "general" : request.Category.Trim().ToLowerInvariant()[..Math.Min(request.Category.Trim().Length, 30)], Priority = request.Priority, CustomerId = userId, OrderId = request.OrderId };
        ticket.Messages.Add(new SupportMessage { AuthorId = userId, Body = body });
        db.SupportTickets.Add(ticket);
        await db.SaveChangesAsync(ct);
        return await LoadAsync(ticket.Id, true, ct);
    }

    public async Task<IReadOnlyList<SupportTicketDto>> ListMineAsync(string userId, CancellationToken ct = default)
    {
        var rows = await BaseQuery().Where(x => x.CustomerId == userId).OrderByDescending(x => x.UpdatedAt).ToListAsync(ct);
        return rows.Select(x => Map(x, false)).ToList();
    }

    public async Task<SupportTicketDto> GetAsync(int id, string userId, bool isStaff, CancellationToken ct = default)
    {
        var ticket = await LoadAsync(id, isStaff, ct);
        if (!isStaff && ticket.CustomerId != userId) throw new NotFoundException("Ticket not found.");
        return ticket;
    }

    public async Task<SupportTicketDto> AddMessageAsync(int id, string userId, bool isStaff, AddSupportMessageRequest request, CancellationToken ct = default)
    {
        var ticket = await db.SupportTickets.Include(x => x.Messages).FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("Ticket not found.");
        if (!isStaff && ticket.CustomerId != userId) throw new NotFoundException("Ticket not found.");
        if (!isStaff && request.IsInternal) throw new ForbiddenException("Customers cannot create internal notes.");
        var body = request.Body?.Trim() ?? "";
        if (body.Length is < 1 or > 8000) throw new ValidationException("body", "Reply must be between 1 and 8000 characters.");
        if (ticket.Status == "closed") throw new ValidationException("status", "Closed tickets cannot receive replies.");
        db.SupportMessages.Add(new SupportMessage { TicketId = id, AuthorId = userId, Body = body, IsInternal = request.IsInternal });
        if (isStaff && !request.IsInternal) { ticket.FirstRespondedAt ??= DateTimeOffset.UtcNow; ticket.Status = "pending_customer"; }
        else if (!isStaff) ticket.Status = "open";
        ticket.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return await LoadAsync(id, isStaff, ct);
    }

    public async Task<PagedResult<SupportTicketDto>> ListAdminAsync(SupportTicketQuery query, CancellationToken ct = default)
    {
        var page = Math.Max(1, query.Page); var size = Math.Clamp(query.PageSize, 1, 100);
        var q = BaseQuery();
        if (!string.IsNullOrWhiteSpace(query.Status)) q = q.Where(x => x.Status == query.Status);
        if (!string.IsNullOrWhiteSpace(query.Priority)) q = q.Where(x => x.Priority == query.Priority);
        if (!string.IsNullOrWhiteSpace(query.Search)) { var s = query.Search.Trim(); q = q.Where(x => x.Number.Contains(s) || x.Subject.Contains(s) || x.Customer.Email!.Contains(s)); }
        var total = await q.CountAsync(ct);
        var rows = await q.OrderByDescending(x => x.UpdatedAt).Skip((page - 1) * size).Take(size).ToListAsync(ct);
        var items = rows.Select(x => Map(x, true)).ToList();
        return new(items, page, size, total);
    }

    public async Task<SupportTicketDto> UpdateAsync(int id, UpdateSupportTicketRequest request, CancellationToken ct = default)
    {
        var ticket = await db.SupportTickets.FindAsync([id], ct) ?? throw new NotFoundException("Ticket not found.");
        if (request.Status is not null) { if (!Statuses.Contains(request.Status)) throw new ValidationException("status", "Choose a valid status."); ticket.Status = request.Status; ticket.ResolvedAt = request.Status is "resolved" or "closed" ? DateTimeOffset.UtcNow : null; }
        if (request.Priority is not null) { if (!Priorities.Contains(request.Priority)) throw new ValidationException("priority", "Choose a valid priority."); ticket.Priority = request.Priority; }
        if (request.AssignedToId is not null) { if (request.AssignedToId.Length > 0 && !await db.Users.AnyAsync(x => x.Id == request.AssignedToId, ct)) throw new ValidationException("assignedToId", "Team member not found."); ticket.AssignedToId = request.AssignedToId.Length == 0 ? null : request.AssignedToId; }
        await db.SaveChangesAsync(ct);
        return await LoadAsync(id, true, ct);
    }

    private IQueryable<SupportTicket> BaseQuery() => db.SupportTickets.AsNoTracking().Include(x => x.Customer).Include(x => x.AssignedTo).Include(x => x.Order).Include(x => x.Messages).ThenInclude(x => x.Author);
    private async Task<SupportTicketDto> LoadAsync(int id, bool internalNotes, CancellationToken ct) => Map(await BaseQuery().FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("Ticket not found."), internalNotes);
    private static SupportTicketDto Map(SupportTicket x, bool internalNotes) => new() { Id=x.Id, Number=x.Number, Subject=x.Subject, Category=x.Category, Priority=x.Priority, Status=x.Status, CustomerId=x.CustomerId, CustomerName=$"{x.Customer.FirstName} {x.Customer.LastName}".Trim(), CustomerEmail=x.Customer.Email ?? "", OrderId=x.OrderId, OrderNumber=x.Order?.Number, AssignedToId=x.AssignedToId, AssignedToName=x.AssignedTo is null ? null : $"{x.AssignedTo.FirstName} {x.AssignedTo.LastName}".Trim(), CreatedAt=x.CreatedAt, UpdatedAt=x.UpdatedAt, FirstRespondedAt=x.FirstRespondedAt, ResolvedAt=x.ResolvedAt, Messages=x.Messages.Where(m => internalNotes || !m.IsInternal).OrderBy(m => m.CreatedAt).Select(m => new SupportMessageDto { Id=m.Id, AuthorId=m.AuthorId, AuthorName=$"{m.Author.FirstName} {m.Author.LastName}".Trim(), Body=m.Body, IsInternal=m.IsInternal, CreatedAt=m.CreatedAt }).ToList() };
}
