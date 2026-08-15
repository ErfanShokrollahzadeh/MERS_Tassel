using Microsoft.AspNetCore.Identity;

namespace MersTassel.Domain.Entities;

/// <summary>Application user. Identity supplies hashing, lockout and the role join tables.</summary>
public class AppUser : IdentityUser
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public bool IsDelete { get; set; }

    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}

public class AppRole : IdentityRole
{
    public AppRole() { }
    public AppRole(string name) : base(name) { }
}

public static class RoleNames
{
    public const string Admin = "Admin";
    public const string Staff = "Staff";
    public const string Customer = "Customer";

    public static readonly string[] All = [Admin, Staff, Customer];
}

/// <summary>
/// A rotating refresh token. Only the SHA-256 hash is stored, so a database leak does not
/// hand out usable sessions. <see cref="ReplacedByTokenHash"/> lets reuse of an already
/// rotated token be detected and the whole chain revoked.
/// </summary>
public class RefreshToken
{
    public int Id { get; set; }

    public string UserId { get; set; } = string.Empty;
    public AppUser User { get; set; } = null!;

    public string TokenHash { get; set; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? RevokedAt { get; set; }
    public string? ReplacedByTokenHash { get; set; }

    public bool IsActive => RevokedAt is null && DateTimeOffset.UtcNow < ExpiresAt;
}
