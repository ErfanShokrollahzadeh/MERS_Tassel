using System.Security.Cryptography;
using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using MersTassel.Domain.Entities;
using MersTassel.Domain.Enums;
using MersTassel.Infrastructure.Auth;
using MersTassel.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace MersTassel.Infrastructure.Services;

public sealed class SupportTicketService(
    AppDbContext db,
    UserManager<AppUser> userManager,
    ISupportAttachmentStorage storage) : ISupportTicketService
{
    private const int MaxAttachments = 5;

    public async Task<SupportTicketDetailDto> CreateAsync(
        string userId,
        CreateSupportTicketRequest request,
        IReadOnlyList<UploadedFile> attachments,
        CancellationToken ct = default)
    {
        ValidateAttachments(attachments);
        var user = await db.Users.FirstOrDefaultAsync(x => x.Id == userId, ct)
            ?? throw new NotFoundException("Account not found.");

        Order? order = null;
        if (!string.IsNullOrWhiteSpace(request.OrderNumber))
        {
            var number = request.OrderNumber.Trim();
            order = await db.Orders.FirstOrDefaultAsync(x => x.Number == number && x.UserId == userId, ct)
                ?? throw new ValidationException("orderNumber", "Choose an order from your own order history.");
        }

        var now = DateTimeOffset.UtcNow;
        var ticket = new SupportTicket
        {
            Number = NewNumber(now),
            CustomerId = user.Id,
            Customer = user,
            CustomerName = FullName(user),
            CustomerEmail = user.Email ?? string.Empty,
            OrderId = order?.Id,
            Subject = request.Subject.Trim(),
            Category = ParseCategory(request.Category),
            Status = SupportTicketStatus.Open,
            Priority = SupportTicketPriority.Normal,
            LastMessageAt = now,
            LastCustomerReplyAt = now,
            CustomerReadAt = now,
        };
        var first = NewMessage(ticket, user, request.Message, isStaff: false, isInternal: false, now);
        ticket.Messages.Add(first);

        var saved = new List<string>();
        try
        {
            await AddAttachmentsAsync(first, attachments, saved, ct);
            db.SupportTickets.Add(ticket);
            await db.SaveChangesAsync(ct);
        }
        catch
        {
            await DeleteSavedAsync(saved);
            throw;
        }

        return await GetForCustomerAsync(ticket.Id, userId, ct);
    }

    public async Task<IReadOnlyList<SupportTicketSummaryDto>> ListForCustomerAsync(
        string userId, CancellationToken ct = default)
    {
        var tickets = await TicketGraph()
            .Where(x => x.CustomerId == userId)
            .OrderByDescending(x => x.LastMessageAt)
            .ToListAsync(ct);
        return tickets.Select(x => MapSummary(x, forStaff: false)).ToList();
    }

    public async Task<SupportTicketDetailDto> GetForCustomerAsync(
        int id, string userId, CancellationToken ct = default)
    {
        var ticket = await TicketGraph().FirstOrDefaultAsync(x => x.Id == id && x.CustomerId == userId, ct)
            ?? throw new NotFoundException("Ticket not found.");
        ticket.CustomerReadAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return MapDetail(ticket, forStaff: false, context: null);
    }

    public async Task<SupportTicketDetailDto> AddCustomerMessageAsync(
        int id,
        string userId,
        AddSupportTicketMessageRequest request,
        IReadOnlyList<UploadedFile> attachments,
        CancellationToken ct = default)
    {
        ValidateAttachments(attachments);
        var ticket = await db.SupportTickets.FirstOrDefaultAsync(x => x.Id == id && x.CustomerId == userId, ct)
            ?? throw new NotFoundException("Ticket not found.");
        if (ticket.Status == SupportTicketStatus.Closed)
            throw new ConflictException("This ticket is closed. Open a new ticket if you still need help.");

        var user = await db.Users.FirstAsync(x => x.Id == userId, ct);
        var now = DateTimeOffset.UtcNow;
        var message = NewMessage(ticket, user, request.Body, isStaff: false, isInternal: false, now);
        var saved = new List<string>();
        try
        {
            await AddAttachmentsAsync(message, attachments, saved, ct);
            db.SupportTicketMessages.Add(message);
            ticket.Status = SupportTicketStatus.InProgress;
            ticket.ResolvedAt = null;
            ticket.LastMessageAt = now;
            ticket.LastCustomerReplyAt = now;
            ticket.CustomerReadAt = now;
            ticket.StaffReadAt = null;
            await db.SaveChangesAsync(ct);
        }
        catch
        {
            await DeleteSavedAsync(saved);
            throw;
        }
        return await GetForCustomerAsync(id, userId, ct);
    }

    public async Task<PagedResult<SupportTicketSummaryDto>> ListForStaffAsync(
        SupportTicketQuery query, string staffUserId, CancellationToken ct = default)
    {
        var q = TicketGraph();
        if (!string.IsNullOrWhiteSpace(query.Status) && query.Status.Trim().ToLowerInvariant() != "all")
            q = q.Where(x => x.Status == ParseStatus(query.Status));
        if (!string.IsNullOrWhiteSpace(query.Priority) && query.Priority.Trim().ToLowerInvariant() != "all")
            q = q.Where(x => x.Priority == ParsePriority(query.Priority));
        if (!string.IsNullOrWhiteSpace(query.Assignment))
        {
            var assignment = query.Assignment.Trim();
            q = assignment.ToLowerInvariant() switch
            {
                "mine" => q.Where(x => x.AssignedToUserId == staffUserId),
                "unassigned" => q.Where(x => x.AssignedToUserId == null),
                "all" => q,
                _ => q.Where(x => x.AssignedToUserId == assignment),
            };
        }
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = $"%{query.Search.Trim()}%";
            q = q.Where(x => EF.Functions.Like(x.Number, term)
                || EF.Functions.Like(x.Subject, term)
                || EF.Functions.Like(x.CustomerName, term)
                || EF.Functions.Like(x.CustomerEmail, term));
        }

        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);
        var total = await q.CountAsync(ct);
        // Staff can see private notes, so staff ordering and timestamps must follow the latest
        // staff-visible message rather than the latest customer-visible conversation activity.
        var tickets = await q.OrderByDescending(x => x.Messages.Max(message => message.CreatedAt))
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<SupportTicketSummaryDto>(tickets.Select(x => MapSummary(x, true)).ToList(), page, pageSize, total);
    }

    public async Task<SupportTicketDetailDto> GetForStaffAsync(
        int id, string staffUserId, CancellationToken ct = default)
    {
        var ticket = await TicketGraph().FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("Ticket not found.");
        ticket.StaffReadAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return MapDetail(ticket, forStaff: true, await CustomerContextAsync(ticket.CustomerId, ct));
    }

    public async Task<SupportTicketDetailDto> AddStaffMessageAsync(
        int id,
        string staffUserId,
        AddSupportTicketMessageRequest request,
        IReadOnlyList<UploadedFile> attachments,
        CancellationToken ct = default)
    {
        ValidateAttachments(attachments);
        var ticket = await db.SupportTickets.FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("Ticket not found.");
        if (ticket.Status == SupportTicketStatus.Closed && !request.IsInternal)
            throw new ConflictException("Reopen the ticket before sending a customer reply.");

        var staff = await EnsureAgentAsync(staffUserId, ct);
        var now = DateTimeOffset.UtcNow;
        var message = NewMessage(ticket, staff, request.Body, isStaff: true, request.IsInternal, now);
        var saved = new List<string>();
        try
        {
            await AddAttachmentsAsync(message, attachments, saved, ct);
            db.SupportTicketMessages.Add(message);
            ticket.AssignedToUserId ??= staffUserId;
            ticket.StaffReadAt = now;
            if (!request.IsInternal)
            {
                ticket.Status = SupportTicketStatus.WaitingForCustomer;
                ticket.ResolvedAt = null;
                ticket.LastMessageAt = now;
                ticket.LastStaffReplyAt = now;
                ticket.CustomerReadAt = null;
            }
            await db.SaveChangesAsync(ct);
        }
        catch
        {
            await DeleteSavedAsync(saved);
            throw;
        }
        return await GetForStaffAsync(id, staffUserId, ct);
    }

    public async Task<SupportTicketDetailDto> UpdateAsync(
        int id,
        string staffUserId,
        UpdateSupportTicketRequest request,
        CancellationToken ct = default)
    {
        var ticket = await db.SupportTickets.FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("Ticket not found.");
        var status = ParseStatus(request.Status);
        var priority = ParsePriority(request.Priority);

        if (!string.IsNullOrWhiteSpace(request.AssignedToUserId))
            await EnsureAgentAsync(request.AssignedToUserId, ct);

        var now = DateTimeOffset.UtcNow;
        var previousStatus = ticket.Status;
        ticket.Status = status;
        ticket.Priority = priority;
        ticket.AssignedToUserId = string.IsNullOrWhiteSpace(request.AssignedToUserId) ? null : request.AssignedToUserId;
        ticket.ResolvedAt = status switch
        {
            SupportTicketStatus.Resolved => ticket.ResolvedAt ?? now,
            SupportTicketStatus.Closed when previousStatus == SupportTicketStatus.Resolved => ticket.ResolvedAt,
            _ => null,
        };
        ticket.ClosedAt = status == SupportTicketStatus.Closed ? ticket.ClosedAt ?? now : null;
        ticket.StaffReadAt = now;
        await db.SaveChangesAsync(ct);
        return await GetForStaffAsync(id, staffUserId, ct);
    }

    public async Task<IReadOnlyList<SupportAgentDto>> ListAgentsAsync(CancellationToken ct = default)
    {
        var admins = await userManager.GetUsersInRoleAsync(RoleNames.Admin);
        var staff = await userManager.GetUsersInRoleAsync(RoleNames.Staff);
        var agents = admins.Concat(staff).Where(x => !x.IsDelete).DistinctBy(x => x.Id).OrderBy(FullName).ToList();
        var ids = agents.Select(x => x.Id).ToList();
        var counts = await db.SupportTickets
            .Where(x => x.AssignedToUserId != null && ids.Contains(x.AssignedToUserId)
                && x.Status != SupportTicketStatus.Resolved && x.Status != SupportTicketStatus.Closed)
            .GroupBy(x => x.AssignedToUserId!)
            .Select(group => new { Id = group.Key, Count = group.Count() })
            .ToDictionaryAsync(x => x.Id, x => x.Count, ct);
        var adminIds = admins.Select(x => x.Id).ToHashSet();
        return agents.Select(x => new SupportAgentDto
        {
            Id = x.Id,
            Name = FullName(x),
            Email = x.Email ?? string.Empty,
            Role = adminIds.Contains(x.Id) ? "admin" : "staff",
            OpenTicketCount = counts.GetValueOrDefault(x.Id),
        }).ToList();
    }

    public async Task<SupportAttachmentDownload> OpenAttachmentAsync(
        int ticketId, int attachmentId, string userId, bool isSupportStaff, CancellationToken ct = default)
    {
        var attachment = await db.SupportTicketAttachments
            .Include(x => x.Message).ThenInclude(x => x.Ticket)
            .FirstOrDefaultAsync(x => x.Id == attachmentId && x.Message.TicketId == ticketId, ct)
            ?? throw new NotFoundException("Attachment not found.");
        if (!isSupportStaff && (attachment.Message.Ticket.CustomerId != userId || attachment.Message.IsInternal))
            throw new NotFoundException("Attachment not found.");
        return new SupportAttachmentDownload(
            await storage.OpenReadAsync(attachment.StoragePath, ct),
            attachment.ContentType,
            attachment.OriginalFileName);
    }

    private IQueryable<SupportTicket> TicketGraph() => db.SupportTickets
        .Include(x => x.Customer)
        .Include(x => x.AssignedToUser)
        .Include(x => x.Order)
        .Include(x => x.Messages).ThenInclude(x => x.Attachments);

    private async Task<SupportCustomerContextDto?> CustomerContextAsync(string? customerId, CancellationToken ct)
    {
        if (customerId is null) return null;
        var user = await db.Users.FirstOrDefaultAsync(x => x.Id == customerId, ct);
        if (user is null) return null;
        var orders = await db.Orders.Where(x => x.UserId == customerId)
            .OrderByDescending(x => x.CreatedAt).ToListAsync(ct);
        return new SupportCustomerContextDto
        {
            CustomerSince = user.CreatedAt,
            OrderCount = orders.Count,
            LifetimeSpend = orders.Where(x => x.PaymentStatus == PaymentStatus.Paid).Sum(x => x.Total),
            RecentOrders = orders.Take(3).Select(x => new SupportOrderContextDto
            {
                Number = x.Number,
                Status = OrderStatusName(x.Status),
                Total = x.Total,
                Currency = x.Currency,
                CreatedAt = x.CreatedAt,
            }).ToList(),
        };
    }

    private async Task<AppUser> EnsureAgentAsync(string userId, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(x => x.Id == userId, ct)
            ?? throw new ValidationException("assignedToUserId", "Choose a valid support agent.");
        var roles = await userManager.GetRolesAsync(user);
        if (!roles.Contains(RoleNames.Admin) && !roles.Contains(RoleNames.Staff))
            throw new ValidationException("assignedToUserId", "Tickets can only be assigned to admins or staff.");
        return user;
    }

    private async Task AddAttachmentsAsync(
        SupportTicketMessage message, IReadOnlyList<UploadedFile> files, List<string> saved, CancellationToken ct)
    {
        foreach (var file in files)
        {
            var stored = await storage.SaveAsync(file, ct);
            saved.Add(stored.StoragePath);
            var fileName = new string(Path.GetFileName(file.FileName).Where(character => !char.IsControl(character)).ToArray()).Trim();
            if (fileName.Length > 240) fileName = fileName[..240];
            message.Attachments.Add(new SupportTicketAttachment
            {
                StoragePath = stored.StoragePath,
                OriginalFileName = string.IsNullOrWhiteSpace(fileName) ? "attachment" : fileName,
                ContentType = stored.ContentType,
                Size = stored.Size,
            });
        }
    }

    private async Task DeleteSavedAsync(IEnumerable<string> paths)
    {
        foreach (var path in paths) await storage.DeleteAsync(path, CancellationToken.None);
    }

    private static void ValidateAttachments(IReadOnlyList<UploadedFile> files)
    {
        if (files.Count > MaxAttachments)
            throw new ValidationException("attachments", $"Attach no more than {MaxAttachments} files per message.");
    }

    private static SupportTicketMessage NewMessage(
        SupportTicket ticket, AppUser author, string body, bool isStaff, bool isInternal, DateTimeOffset now) => new()
    {
        Ticket = ticket,
        AuthorUserId = author.Id,
        AuthorName = FullName(author),
        IsStaff = isStaff,
        IsInternal = isInternal,
        Body = body.Trim(),
        CreatedAt = now,
    };

    private static SupportTicketSummaryDto MapSummary(SupportTicket ticket, bool forStaff)
    {
        var visible = ticket.Messages.Where(x => forStaff || !x.IsInternal).OrderBy(x => x.CreatedAt).ToList();
        var last = visible.LastOrDefault();
        return new SupportTicketSummaryDto
        {
            Id = ticket.Id,
            Number = ticket.Number,
            Subject = ticket.Subject,
            Category = CategoryName(ticket.Category),
            Status = StatusName(ticket.Status),
            Priority = PriorityName(ticket.Priority),
            CustomerName = ticket.CustomerName,
            CustomerEmail = ticket.CustomerEmail,
            AssignedToUserId = ticket.AssignedToUserId,
            AssignedToName = ticket.AssignedToUser is null ? null : FullName(ticket.AssignedToUser),
            OrderNumber = ticket.Order?.Number,
            Preview = last?.Body ?? string.Empty,
            MessageCount = visible.Count,
            IsUnread = forStaff
                ? ticket.LastCustomerReplyAt.HasValue && (!ticket.StaffReadAt.HasValue || ticket.StaffReadAt < ticket.LastCustomerReplyAt)
                : ticket.LastStaffReplyAt.HasValue && (!ticket.CustomerReadAt.HasValue || ticket.CustomerReadAt < ticket.LastStaffReplyAt),
            CreatedAt = ticket.CreatedAt,
            UpdatedAt = ticket.UpdatedAt,
            LastMessageAt = last?.CreatedAt ?? ticket.LastMessageAt,
        };
    }

    private static SupportTicketDetailDto MapDetail(
        SupportTicket ticket, bool forStaff, SupportCustomerContextDto? context)
    {
        var summary = MapSummary(ticket, forStaff);
        return new SupportTicketDetailDto
        {
            Id = summary.Id,
            Number = summary.Number,
            Subject = summary.Subject,
            Category = summary.Category,
            Status = summary.Status,
            Priority = summary.Priority,
            CustomerName = summary.CustomerName,
            CustomerEmail = summary.CustomerEmail,
            AssignedToUserId = summary.AssignedToUserId,
            AssignedToName = summary.AssignedToName,
            OrderNumber = summary.OrderNumber,
            Preview = summary.Preview,
            MessageCount = summary.MessageCount,
            IsUnread = false,
            CreatedAt = summary.CreatedAt,
            UpdatedAt = summary.UpdatedAt,
            LastMessageAt = summary.LastMessageAt,
            ResolvedAt = ticket.ResolvedAt,
            ClosedAt = ticket.ClosedAt,
            CustomerContext = context,
            Messages = ticket.Messages.Where(x => forStaff || !x.IsInternal).OrderBy(x => x.CreatedAt)
                .Select(x => new SupportTicketMessageDto
                {
                    Id = x.Id,
                    AuthorName = x.AuthorName,
                    IsStaff = x.IsStaff,
                    IsInternal = x.IsInternal,
                    Body = x.Body,
                    CreatedAt = x.CreatedAt,
                    Attachments = x.Attachments.Select(a => new SupportTicketAttachmentDto
                    {
                        Id = a.Id,
                        FileName = a.OriginalFileName,
                        ContentType = a.ContentType,
                        Size = a.Size,
                    }).ToList(),
                }).ToList(),
        };
    }

    private static string NewNumber(DateTimeOffset now) => $"MT-{now:yyMMdd}-{Convert.ToHexString(RandomNumberGenerator.GetBytes(5))}";
    private static string FullName(AppUser user) => $"{user.FirstName} {user.LastName}".Trim();
    private static SupportTicketCategory ParseCategory(string value) => value.Trim().ToLowerInvariant() switch
    {
        "order" => SupportTicketCategory.Order,
        "product" => SupportTicketCategory.Product,
        "shipping" => SupportTicketCategory.Shipping,
        "return" => SupportTicketCategory.Return,
        "repair" => SupportTicketCategory.Repair,
        "account" => SupportTicketCategory.Account,
        _ => SupportTicketCategory.Other,
    };
    private static SupportTicketStatus ParseStatus(string value) => value.Trim().ToLowerInvariant() switch
    {
        "open" => SupportTicketStatus.Open,
        "in_progress" => SupportTicketStatus.InProgress,
        "waiting_for_customer" => SupportTicketStatus.WaitingForCustomer,
        "resolved" => SupportTicketStatus.Resolved,
        "closed" => SupportTicketStatus.Closed,
        _ => throw new ValidationException("status", "Choose a valid ticket status."),
    };
    private static SupportTicketPriority ParsePriority(string value) => value.Trim().ToLowerInvariant() switch
    {
        "low" => SupportTicketPriority.Low,
        "normal" => SupportTicketPriority.Normal,
        "high" => SupportTicketPriority.High,
        "urgent" => SupportTicketPriority.Urgent,
        _ => throw new ValidationException("priority", "Choose a valid ticket priority."),
    };
    private static string CategoryName(SupportTicketCategory value) => value.ToString().ToLowerInvariant();
    private static string PriorityName(SupportTicketPriority value) => value.ToString().ToLowerInvariant();
    private static string StatusName(SupportTicketStatus value) => value switch
    {
        SupportTicketStatus.InProgress => "in_progress",
        SupportTicketStatus.WaitingForCustomer => "waiting_for_customer",
        _ => value.ToString().ToLowerInvariant(),
    };
    private static string OrderStatusName(OrderStatus value) => value.ToString().ToLowerInvariant();
}
