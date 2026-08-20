using MersTassel.Application.Interfaces;
using MersTassel.Domain.Entities;
using MersTassel.Infrastructure.Auth;
using MersTassel.Infrastructure.Data;
using MersTassel.Infrastructure.Payments;
using MersTassel.Infrastructure.Services;
using MersTassel.Infrastructure.Storage;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace MersTassel.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration,
        string webRootPath)
    {
        // Resolved when the context is first built rather than here. Reading it now would
        // capture configuration as it stands while Program is still running, which silently
        // ignores any source added afterwards — WebApplicationFactory adds its overrides at
        // exactly that point, so the integration tests were pointed at their throwaway SQLite
        // file and ran against the checked-out database instead, carrying state between runs.
        services.AddDbContext<AppDbContext>((provider, options) => options.UseSqlite(
            provider.GetRequiredService<IConfiguration>().GetConnectionString("Default")
                ?? "Data Source=merstassel.db"));

        services.AddIdentityCore<AppUser>(options =>
            {
                options.User.RequireUniqueEmail = true;
                options.Password.RequireDigit = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireUppercase = false;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequiredLength = 8;
                options.Lockout.MaxFailedAccessAttempts = 8;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(10);
            })
            .AddRoles<AppRole>()
            .AddEntityFrameworkStores<AppDbContext>();

        services.Configure<JwtOptions>(configuration.GetSection("Jwt"));
        services.Configure<StripeOptions>(configuration.GetSection("Stripe"));
        services.Configure<FileStorageOptions>(options =>
        {
            options.WebRootPath = webRootPath;
            options.MaxBytes = configuration.GetValue("Storage:MaxBytes", 10L * 1024 * 1024);
        });

        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IFileStorageService, LocalFileStorageService>();
        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<ICartService, CartService>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<ISiteSettingsService, SiteSettingsService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IUserAdminService, UserAdminService>();
        services.AddScoped<DatabaseSeeder>();

        // Payments resolve to a disabled stub unless both Stripe secrets are present, so the
        // API boots in environments without keys and reports the gap at the call site.
        var stripeConfigured =
            !string.IsNullOrWhiteSpace(configuration["Stripe:SecretKey"]) &&
            !string.IsNullOrWhiteSpace(configuration["Stripe:WebhookSecret"]);

        if (stripeConfigured)
            services.AddScoped<IPaymentService, StripePaymentService>();
        else
            services.AddScoped<IPaymentService, DisabledPaymentService>();

        return services;
    }
}
