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

public class UserAdminService(AppDbContext db, UserManager<AppUser> userManager) : IUserAdminService
{
    public async Task<PagedResult<AdminUserDto>> ListAsync(string? search, int page, int pageSize, CancellationToken ct = default)
    {
        var q = db.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            q = q.Where(u =>
                EF.Functions.Like(u.Email!, $"%{term}%") ||
                EF.Functions.Like(u.FirstName, $"%{term}%") ||
                EF.Functions.Like(u.LastName, $"%{term}%"));
        }

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var total = await q.CountAsync(ct);
        var users = await q
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var ids = users.Select(u => u.Id).ToList();

        // One query for the page's orders, grouped in memory: Total is stored as minor units
        // via a value converter, and a SQL SUM over it would bypass the inverse conversion.
        var paidOrders = await db.Orders
            .Where(o => o.UserId != null && ids.Contains(o.UserId) && o.PaymentStatus == PaymentStatus.Paid)
            .Select(o => new { UserId = o.UserId!, o.Total, o.CreatedAt })
            .ToListAsync(ct);

        var spend = paidOrders
            .GroupBy(o => o.UserId)
            .Select(g => new { UserId = g.Key, Total = g.Sum(o => o.Total), Count = g.Count(), Last = g.Max(o => o.CreatedAt) })
            .ToList();

        var items = new List<AdminUserDto>(users.Count);
        foreach (var user in users)
        {
            var roles = await userManager.GetRolesAsync(user);
            var stats = spend.FirstOrDefault(s => s.UserId == user.Id);

            items.Add(new AdminUserDto
            {
                Id = user.Id,
                Email = user.Email ?? string.Empty,
                FirstName = user.FirstName,
                LastName = user.LastName,
                DateJoined = user.CreatedAt,
                Role = TokenService.PrimaryRole(roles),
                OrderCount = stats?.Count ?? 0,
                LifetimeSpend = stats?.Total ?? 0,
                LastActiveAt = stats?.Last,
            });
        }

        return new PagedResult<AdminUserDto>(items, page, pageSize, total);
    }

    public async Task<AdminUserDto> UpdateRoleAsync(string userId, string role, CancellationToken ct = default)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new NotFoundException("Account not found.");

        var target = RoleNames.All.FirstOrDefault(r => string.Equals(r, role, StringComparison.OrdinalIgnoreCase))
            ?? throw new ValidationException("role", $"'{role}' is not a known role.");

        var current = await userManager.GetRolesAsync(user);

        // Refuse to remove the last admin — otherwise the workspace locks everyone out.
        if (current.Contains(RoleNames.Admin) && target != RoleNames.Admin)
        {
            var admins = await userManager.GetUsersInRoleAsync(RoleNames.Admin);
            if (admins.Count(a => !a.IsDelete) <= 1)
                throw new ConflictException("This is the only administrator. Promote someone else first.");
        }

        if (current.Count > 0) await userManager.RemoveFromRolesAsync(user, current);
        await userManager.AddToRoleAsync(user, target);

        var userOrders = await db.Orders
            .Where(o => o.UserId == userId && o.PaymentStatus == PaymentStatus.Paid)
            .Select(o => new { o.Total, o.CreatedAt })
            .ToListAsync(ct);

        var stats = userOrders.Count == 0
            ? null
            : new { Total = userOrders.Sum(o => o.Total), Count = userOrders.Count, Last = userOrders.Max(o => o.CreatedAt) };

        return new AdminUserDto
        {
            Id = user.Id,
            Email = user.Email ?? string.Empty,
            FirstName = user.FirstName,
            LastName = user.LastName,
            DateJoined = user.CreatedAt,
            Role = target.ToLowerInvariant(),
            OrderCount = stats?.Count ?? 0,
            LifetimeSpend = stats?.Total ?? 0,
            LastActiveAt = stats?.Last,
        };
    }
}
