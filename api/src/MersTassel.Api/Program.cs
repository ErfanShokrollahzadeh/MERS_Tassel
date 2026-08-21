using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using FluentValidation;
using MersTassel.Api.Middleware;
using MersTassel.Application.Interfaces;
using MersTassel.Application.Validation;
using MersTassel.Infrastructure;
using MersTassel.Infrastructure.Auth;
using MersTassel.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

// The runtime image uses the application itself as its healthcheck client. This avoids adding
// curl (and an operating-system package manager layer) to the final production image.
if (args.Length == 1 && args[0] == "--healthcheck")
{
    try
    {
        using var healthClient = new HttpClient { Timeout = TimeSpan.FromSeconds(3) };
        using var response = await healthClient.GetAsync("http://127.0.0.1:8080/health");
        if (!response.IsSuccessStatusCode) Environment.ExitCode = 1;
    }
    catch
    {
        Environment.ExitCode = 1;
    }

    return;
}

var builder = WebApplication.CreateBuilder(args);

// Docker secrets are mounted as files. Key-per-file translates a double underscore in a
// filename (for example Jwt__SigningKey) into the normal configuration path
// (Jwt:SigningKey), keeping production credentials out of the image and compose metadata.
builder.Configuration.AddKeyPerFile("/run/secrets", optional: true);

var dataProtectionKeysPath = builder.Configuration["DataProtection:KeysPath"];
if (!string.IsNullOrWhiteSpace(dataProtectionKeysPath))
{
    Directory.CreateDirectory(dataProtectionKeysPath);
    builder.Services.AddDataProtection()
        .PersistKeysToFileSystem(new DirectoryInfo(dataProtectionKeysPath))
        .SetApplicationName("MersTassel.Api");
}

var webRootPath = Path.Combine(builder.Environment.ContentRootPath, "wwwroot");
Directory.CreateDirectory(Path.Combine(webRootPath, "uploads"));

builder.Services.AddControllers().AddJsonOptions(options =>
{
    // camelCase to match the TypeScript client; enums travel as their lowercase names.
    options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});

// [ApiController]'s automatic ModelState filter would answer first, with PascalCase keys and
// its own body shape — a second error contract the client would have to parse. Suppressing it
// makes FluentValidation the single validation path, so one response reports every bad field
// instead of only the ones that failed binding.
builder.Services.Configure<ApiBehaviorOptions>(options => options.SuppressModelStateInvalidFilter = true);

builder.Services.AddInfrastructure(builder.Configuration, webRootPath);
builder.Services.AddValidatorsFromAssemblyContaining<RegisterRequestValidator>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUser, CurrentUser>();

// The API is not published directly in production; only the Caddy container can reach it.
// Trust one forwarding hop so HTTPS redirects, generated URLs and IP rate limits see the
// original Vercel/browser request rather than Caddy's internal container address.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.ForwardLimit = 1;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

// ── Authentication ──────────────────────────────────────────────────────────
// Token issuance (TokenService) and token validation (JwtBearer) must never disagree about
// the signing key. Both resolve the same IOptions<JwtOptions> instance from DI rather than
// reading configuration independently, so a key supplied by any provider reaches both sides.
builder.Services.PostConfigure<JwtOptions>(options =>
{
    if (!string.IsNullOrWhiteSpace(options.SigningKey)) return;

    if (!builder.Environment.IsDevelopment())
    {
        throw new InvalidOperationException(
            "Jwt:SigningKey must be configured outside Development. Set it via environment variable or user-secrets.");
    }

    // Development convenience only: a restart invalidates existing tokens, which is
    // acceptable locally and never in production — hence the hard failure above.
    options.SigningKey = "dev-only-signing-key-not-for-production-use-0123456789abcdef";
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();

builder.Services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
    .Configure<IOptions<JwtOptions>>((bearer, jwt) =>
    {
        var options = jwt.Value;
        bearer.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = options.Issuer,
            ValidAudience = options.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(options.SigningKey)),
            ClockSkew = TimeSpan.FromSeconds(30),
            RoleClaimType = ClaimTypes.Role,
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("contact-form", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 5,
            Window = TimeSpan.FromMinutes(10),
            QueueLimit = 0,
            AutoReplenishment = true,
        }));
});

// ── CORS ────────────────────────────────────────────────────────────────────
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:3000", "http://127.0.0.1:3000"];

builder.Services.AddCors(options => options.AddPolicy("storefront", policy => policy
    .WithOrigins(allowedOrigins)
    .AllowAnyHeader()
    .AllowAnyMethod()
    .AllowCredentials()));

// ── Swagger ─────────────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "MERS Tassel API",
        Version = "v1",
        Description = "Catalog, media, auth, cart, orders and site settings for the MERS Tassel storefront and atelier workspace.",
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Paste the access token returned by /api/v1/auth/login.",
    });

    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = []
    });
});

var app = builder.Build();

app.UseForwardedHeaders();

app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "MERS Tassel API v1");
        options.DocumentTitle = "MERS Tassel API";
    });
}

// Uploaded filenames are GUIDs and never reused, so they can be cached indefinitely.
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        if (ctx.Context.Request.Path.StartsWithSegments("/uploads"))
            ctx.Context.Response.Headers.CacheControl = "public,max-age=31536000,immutable";
    },
});

app.UseCors("storefront");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.MapGet("/health", () => Results.Ok(new { status = "ok", time = DateTimeOffset.UtcNow }))
   .WithTags("Diagnostics");

// ── Migrate + seed ──────────────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
    var seedAssets = Path.Combine(builder.Environment.ContentRootPath, "..", "..", "seed-assets");
    await seeder.RunAsync(webRootPath, Path.GetFullPath(seedAssets));
}

app.Run();

/// <summary>Reads the caller's identity off the validated JWT.</summary>
internal class CurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    private ClaimsPrincipal? Principal => accessor.HttpContext?.User;

    public string? UserId => Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
    public string? Email => Principal?.FindFirstValue(ClaimTypes.Email);
    public bool IsAdmin => Principal?.IsInRole("Admin") ?? false;
    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated ?? false;
}

/// <summary>Exposed so the integration tests can drive the real pipeline via WebApplicationFactory.</summary>
public partial class Program;
