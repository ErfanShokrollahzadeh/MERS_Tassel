using MersTassel.Application.Interfaces;
using MersTassel.Domain.Entities;
using MersTassel.Infrastructure.Auth;
using MersTassel.Infrastructure.Data;
using MersTassel.Infrastructure.Email;
using MersTassel.Infrastructure.Payments;
using MersTassel.Infrastructure.Services;
using MersTassel.Infrastructure.Storage;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

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
        services.AddDbContext<AppDbContext>((provider, options) =>
        {
            var currentConfiguration = provider.GetRequiredService<IConfiguration>();
            var databaseProvider = currentConfiguration["Database:Provider"]?.Trim().ToLowerInvariant()
                ?? "sqlite";

            if (databaseProvider is "postgres" or "postgresql" or "npgsql")
            {
                // Keep the local SQLite connection under "Default" and use a provider-specific
                // name for PostgreSQL. Otherwise the production provider would try to parse
                // "Data Source=merstassel.db" as an Npgsql connection string.
                var connectionString = currentConfiguration.GetConnectionString("PostgreSQL");
                if (string.IsNullOrWhiteSpace(connectionString))
                {
                    var database = currentConfiguration.GetSection("Database");
                    var password = database["Password"];
                    if (string.IsNullOrWhiteSpace(password))
                        throw new InvalidOperationException(
                            "Database:Password is required when Database:Provider is PostgreSQL.");

                    connectionString = new NpgsqlConnectionStringBuilder
                    {
                        Host = database["Host"] ?? "postgres",
                        Port = database.GetValue("Port", 5432),
                        Database = database["Name"] ?? "merstassel",
                        Username = database["Username"] ?? "merstassel",
                        Password = password,
                        Pooling = true,
                        MinPoolSize = 1,
                        MaxPoolSize = database.GetValue("MaxPoolSize", 50),
                        Timeout = 15,
                        CommandTimeout = 30,
                    }.ConnectionString;
                }

                options.UseNpgsql(connectionString, postgres => postgres
                    .MigrationsAssembly("MersTassel.PostgresMigrations")
                    .EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null));
                return;
            }

            if (databaseProvider != "sqlite")
                throw new InvalidOperationException(
                    $"Unsupported Database:Provider '{databaseProvider}'. Use 'Sqlite' or 'PostgreSQL'.");

            options.UseSqlite(currentConfiguration.GetConnectionString("Default")
                ?? "Data Source=merstassel.db");
        });

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
        services.Configure<EmailOptions>(configuration.GetSection("Email"));
        services.Configure<FileStorageOptions>(options =>
        {
            options.WebRootPath = webRootPath;
            options.MaxBytes = configuration.GetValue("Storage:MaxBytes", 10L * 1024 * 1024);
        });

        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IFileStorageService, LocalFileStorageService>();
        services.AddScoped<IProductModelStorageService, LocalProductModelStorageService>();
        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<ICartService, CartService>();
        services.AddScoped<ICouponService, CouponService>();
        services.AddScoped<ITradeInService, TradeInService>();
        services.AddScoped<IWalletService, WalletService>();
        services.AddScoped<IExchangeService, ExchangeService>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<ISiteSettingsService, SiteSettingsService>();
        services.AddScoped<INewsletterService, NewsletterService>();
        services.AddScoped<IContactEmailSender, SmtpContactEmailSender>();
        services.AddScoped<IContactMessageService, ContactMessageService>();
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
