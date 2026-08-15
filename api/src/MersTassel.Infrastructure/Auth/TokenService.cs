using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Domain.Entities;
using MersTassel.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace MersTassel.Infrastructure.Auth;

public class JwtOptions
{
    public string Issuer { get; set; } = "MersTassel";
    public string Audience { get; set; } = "MersTasselClient";
    public string SigningKey { get; set; } = string.Empty;
    public int AccessTokenMinutes { get; set; } = 15;
    public int RefreshTokenDays { get; set; } = 7;
}

public interface ITokenService
{
    Task<AuthSessionDto> IssueAsync(AppUser user, CancellationToken ct = default);
    Task<AuthSessionDto> RotateAsync(string refreshToken, CancellationToken ct = default);
    Task RevokeAsync(string refreshToken, CancellationToken ct = default);
}

public class TokenService(
    AppDbContext db,
    UserManager<AppUser> userManager,
    IOptions<JwtOptions> options) : ITokenService
{
    private readonly JwtOptions _options = options.Value;

    public async Task<AuthSessionDto> IssueAsync(AppUser user, CancellationToken ct = default)
    {
        var roles = await userManager.GetRolesAsync(user);
        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(_options.AccessTokenMinutes);
        var access = BuildAccessToken(user, roles, expiresAt);

        var (raw, hash) = GenerateRefreshToken();
        db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = hash,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(_options.RefreshTokenDays),
        });

        await db.SaveChangesAsync(ct);

        return new AuthSessionDto
        {
            Access = access,
            Refresh = raw,
            AccessExpiresAt = expiresAt,
            User = ToDto(user, roles),
        };
    }

    public async Task<AuthSessionDto> RotateAsync(string refreshToken, CancellationToken ct = default)
    {
        var hash = Hash(refreshToken);
        var stored = await db.RefreshTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == hash, ct)
            ?? throw new ValidationException("refresh", "Refresh token is invalid or expired.");

        // A token presented after rotation means it leaked: revoke the whole chain for that user.
        if (stored.RevokedAt is not null)
        {
            await RevokeAllForUserAsync(stored.UserId, ct);
            throw new ValidationException("refresh", "Refresh token has already been used. Please sign in again.");
        }

        if (!stored.IsActive)
            throw new ValidationException("refresh", "Refresh token is invalid or expired.");

        var user = stored.User ?? throw new ValidationException("refresh", "Account no longer exists.");
        var roles = await userManager.GetRolesAsync(user);

        var (raw, newHash) = GenerateRefreshToken();
        stored.RevokedAt = DateTimeOffset.UtcNow;
        stored.ReplacedByTokenHash = newHash;

        db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = newHash,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(_options.RefreshTokenDays),
        });

        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(_options.AccessTokenMinutes);
        var access = BuildAccessToken(user, roles, expiresAt);

        await db.SaveChangesAsync(ct);

        return new AuthSessionDto
        {
            Access = access,
            Refresh = raw,
            AccessExpiresAt = expiresAt,
            User = ToDto(user, roles),
        };
    }

    public async Task RevokeAsync(string refreshToken, CancellationToken ct = default)
    {
        var hash = Hash(refreshToken);
        var stored = await db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct);
        if (stored is null || stored.RevokedAt is not null) return;

        stored.RevokedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    private async Task RevokeAllForUserAsync(string userId, CancellationToken ct)
    {
        var live = await db.RefreshTokens
            .Where(t => t.UserId == userId && t.RevokedAt == null)
            .ToListAsync(ct);

        foreach (var token in live) token.RevokedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    private string BuildAccessToken(AppUser user, IList<string> roles, DateTimeOffset expiresAt)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")),
            new(ClaimTypes.NameIdentifier, user.Id),
        };

        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.SigningKey));
        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            expires: expiresAt.UtcDateTime,
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>
    /// Returns the raw token for the client and its SHA-256 hash for storage. The database
    /// never holds a usable token.
    /// </summary>
    private static (string Raw, string Hash) GenerateRefreshToken()
    {
        var raw = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
        return (raw, Hash(raw));
    }

    private static string Hash(string value) =>
        Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(value)));

    public static UserDto ToDto(AppUser user, IList<string> roles) => new()
    {
        Id = user.Id,
        Email = user.Email ?? string.Empty,
        FirstName = user.FirstName,
        LastName = user.LastName,
        DateJoined = user.CreatedAt,
        Role = PrimaryRole(roles),
    };

    /// <summary>Highest-privilege role wins, so an admin is never displayed as a customer.</summary>
    public static string PrimaryRole(IList<string> roles)
    {
        if (roles.Contains(RoleNames.Admin)) return "admin";
        if (roles.Contains(RoleNames.Staff)) return "staff";
        return "customer";
    }
}
