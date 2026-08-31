using FluentValidation;
using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using MersTassel.Domain.Entities;
using MersTassel.Infrastructure.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ValidationException = MersTassel.Application.Common.ValidationException;

namespace MersTassel.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
[Tags("Auth")]
public class AuthController(
    UserManager<AppUser> userManager,
    ITokenService tokens,
    ICurrentUser currentUser,
    IValidator<RegisterRequest> registerValidator,
    IValidator<LoginRequest> loginValidator,
    IValidator<ForgotPasswordRequest> forgotPasswordValidator,
    IValidator<ResetPasswordRequest> resetPasswordValidator,
    IValidator<UpdateProfileRequest> profileValidator,
    IAuthEmailSender authEmailSender,
    ILogger<AuthController> logger) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<AuthSessionDto>>> Register(RegisterRequest request, CancellationToken ct)
    {
        await ValidateAsync(registerValidator, request, ct);

        var email = request.Email.Trim().ToLowerInvariant();
        if (await userManager.FindByEmailAsync(email) is not null)
            throw new ValidationException(nameof(request.Email), "An account with this email already exists.");

        var user = new AppUser
        {
            UserName = email,
            Email = email,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            var errors = result.Errors
                .GroupBy(e => e.Code.Contains("Password") ? nameof(request.Password) : nameof(request.Email))
                .ToDictionary(g => g.Key, g => g.Select(e => e.Description).ToArray());
            throw new ValidationException("Registration could not be completed.", errors);
        }

        await userManager.AddToRoleAsync(user, RoleNames.Customer);
        var session = await tokens.IssueAsync(user, ct);

        return StatusCode(StatusCodes.Status201Created, ApiResponse<AuthSessionDto>.Ok(session, "Welcome to MERS Tassel."));
    }

    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<AuthSessionDto>>> Login(LoginRequest request, CancellationToken ct)
    {
        await ValidateAsync(loginValidator, request, ct);

        var user = await userManager.FindByEmailAsync(request.Email.Trim().ToLowerInvariant());

        // One message for both "no such account" and "wrong password", so the endpoint cannot
        // be used to enumerate which emails are registered.
        if (user is null || user.IsDelete)
        {
            logger.LogInformation("Failed login for an unknown address.");
            return Unauthorized(ApiResponse<AuthSessionDto>.Fail("Invalid email or password.", code: "invalid_credentials"));
        }

        if (await userManager.IsLockedOutAsync(user))
        {
            return StatusCode(StatusCodes.Status423Locked,
                ApiResponse<AuthSessionDto>.Fail("Too many attempts. Try again in a few minutes.", code: "locked_out"));
        }

        if (!await userManager.CheckPasswordAsync(user, request.Password))
        {
            await userManager.AccessFailedAsync(user);
            return Unauthorized(ApiResponse<AuthSessionDto>.Fail("Invalid email or password.", code: "invalid_credentials"));
        }

        await userManager.ResetAccessFailedCountAsync(user);
        return Ok(ApiResponse<AuthSessionDto>.Ok(await tokens.IssueAsync(user, ct)));
    }

    [HttpPost("forgot-password")]
    public async Task<ActionResult<ApiResponse<object?>>> ForgotPassword(ForgotPasswordRequest request, CancellationToken ct)
    {
        await ValidateAsync(forgotPasswordValidator, request, ct);

        var email = request.Email.Trim().ToLowerInvariant();
        var user = await userManager.FindByEmailAsync(email);
        if (user is not null && !user.IsDelete)
        {
            try
            {
                var token = await userManager.GeneratePasswordResetTokenAsync(user);
                await authEmailSender.SendPasswordResetAsync(email, token, ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception exception)
            {
                // Delivery state must not change the public response: doing so would reveal
                // whether an address belongs to an active account.
                logger.LogError(exception, "Password reset email delivery failed.");
            }
        }

        return Ok(ApiResponse.Ok("If an account matches this email, reset instructions have been sent."));
    }

    [HttpPost("reset-password")]
    public async Task<ActionResult<ApiResponse<object?>>> ResetPassword(ResetPasswordRequest request, CancellationToken ct)
    {
        await ValidateAsync(resetPasswordValidator, request, ct);

        var user = await userManager.FindByEmailAsync(request.Email.Trim().ToLowerInvariant());
        if (user is null || user.IsDelete)
            throw new ValidationException(nameof(request.Email), "This password reset link is invalid.");

        var result = await userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
        if (!result.Succeeded)
        {
            throw new ValidationException("Password could not be reset.",
                new Dictionary<string, string[]>
                {
                    ["newPassword"] = result.Errors.Select(error => error.Description).ToArray(),
                });
        }

        return Ok(ApiResponse.Ok("Password reset successfully."));
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<ApiResponse<AuthSessionDto>>> Refresh(RefreshRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Refresh))
            throw new ValidationException(nameof(request.Refresh), "A refresh token is required.");

        return Ok(ApiResponse<AuthSessionDto>.Ok(await tokens.RotateAsync(request.Refresh, ct)));
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<object?>>> Logout(RefreshRequest request, CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(request.Refresh))
            await tokens.RevokeAsync(request.Refresh, ct);

        return Ok(ApiResponse.Ok("Signed out."));
    }

    [HttpGet("profile")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<UserDto>>> Profile()
    {
        var user = await RequireUserAsync();
        var roles = await userManager.GetRolesAsync(user);
        return Ok(ApiResponse<UserDto>.Ok(TokenService.ToDto(user, roles)));
    }

    [HttpPut("profile")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<UserDto>>> UpdateProfile(UpdateProfileRequest request, CancellationToken ct)
    {
        await ValidateAsync(profileValidator, request, ct);

        var user = await RequireUserAsync();
        user.FirstName = request.FirstName.Trim();
        user.LastName = request.LastName.Trim();
        await userManager.UpdateAsync(user);

        var roles = await userManager.GetRolesAsync(user);
        return Ok(ApiResponse<UserDto>.Ok(TokenService.ToDto(user, roles), "Profile updated."));
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<object?>>> ChangePassword(ChangePasswordRequest request)
    {
        var user = await RequireUserAsync();
        var result = await userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);

        if (!result.Succeeded)
        {
            throw new ValidationException("Password could not be changed.",
                new Dictionary<string, string[]>
                {
                    ["password"] = result.Errors.Select(e => e.Description).ToArray(),
                });
        }

        return Ok(ApiResponse.Ok("Password changed."));
    }

    private async Task<AppUser> RequireUserAsync()
    {
        var id = currentUser.UserId ?? throw new NotFoundException("Account not found.");
        return await userManager.FindByIdAsync(id) ?? throw new NotFoundException("Account not found.");
    }

    private static async Task ValidateAsync<T>(IValidator<T> validator, T instance, CancellationToken ct)
    {
        var result = await validator.ValidateAsync(instance, ct);
        if (result.IsValid) return;

        throw new ValidationException("Please correct the highlighted fields.",
            result.Errors
                .GroupBy(e => char.ToLowerInvariant(e.PropertyName[0]) + e.PropertyName[1..])
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray()));
    }
}
