namespace MersTassel.Application.DTOs;

public class RegisterRequest
{
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class RefreshRequest
{
    public string Refresh { get; set; } = string.Empty;
}

public class UpdateProfileRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
}

public class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTimeOffset DateJoined { get; set; }

    /// <summary>Lower-cased primary role: <c>admin</c>, <c>staff</c> or <c>customer</c>.</summary>
    public string Role { get; set; } = "customer";
}

/// <summary>Login/register/refresh payload. Field names match what the client already persists.</summary>
public class AuthSessionDto
{
    public string Access { get; set; } = string.Empty;
    public string Refresh { get; set; } = string.Empty;
    public UserDto User { get; set; } = new();
    public DateTimeOffset AccessExpiresAt { get; set; }
}

public class AdminUserDto : UserDto
{
    public int OrderCount { get; set; }
    public decimal LifetimeSpend { get; set; }
    public DateTimeOffset? LastActiveAt { get; set; }
}

public class UpdateUserRoleRequest
{
    public string Role { get; set; } = string.Empty;
}
