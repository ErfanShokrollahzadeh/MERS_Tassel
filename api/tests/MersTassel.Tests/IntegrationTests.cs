using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Security.Cryptography;
using System.Collections.Concurrent;
using FluentAssertions;
using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using MersTassel.Infrastructure.Data;
using MersTassel.Domain.Entities;
using MersTassel.Domain.Enums;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace MersTassel.Tests;

/// <summary>
/// Boots the real application (middleware, auth, EF, seeding) against a throwaway SQLite
/// file, so these tests exercise the same pipeline production runs.
/// </summary>
public class ApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly string _dbPath = Path.Combine(Path.GetTempPath(), $"mt-test-{Guid.NewGuid():N}.db");
    private readonly string _supportPath = Path.Combine(Path.GetTempPath(), $"mt-support-{Guid.NewGuid():N}");
    public const string AdminEmail = "admin@merstassel.local";
    public static string AdminPassword { get; } = $"{Guid.NewGuid():N}aA1!";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Default"] = $"Data Source={_dbPath}",
                ["Seed:AdminEmail"] = AdminEmail,
                ["Seed:AdminPassword"] = AdminPassword,
                ["Jwt:SigningKey"] = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48)),
                ["Support:StoragePath"] = _supportPath,
                // Left blank on purpose: proves the API boots and degrades cleanly without Stripe.
                ["Stripe:SecretKey"] = "",
                ["Stripe:WebhookSecret"] = "",
            });
        });

        // Contact integration tests must exercise the complete endpoint/database flow without
        // sending real email. Production keeps the SMTP implementation registered by the app.
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<IContactEmailSender>();
            services.AddSingleton<RecordingContactEmailSender>();
            services.AddSingleton<IContactEmailSender>(provider =>
                provider.GetRequiredService<RecordingContactEmailSender>());
        });
    }

    public Task InitializeAsync() => Task.CompletedTask;

    async Task IAsyncLifetime.DisposeAsync()
    {
        await DisposeAsync();
        // Drop pooled handles before deleting the file, or SQLite keeps it locked.
        SqliteConnectionCleanup();
        if (File.Exists(_dbPath)) File.Delete(_dbPath);
        if (Directory.Exists(_supportPath)) Directory.Delete(_supportPath, recursive: true);
    }

    private static void SqliteConnectionCleanup() =>
        Microsoft.Data.Sqlite.SqliteConnection.ClearAllPools();
}

public class ApiIntegrationTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    private record Envelope<T>(bool Success, T? Data, string? Message, string? Code,
        Dictionary<string, string[]>? Errors);

    private async Task<HttpClient> AdminClientAsync()
    {
        var client = factory.CreateClient();
        var token = await LoginAsync(client, ApiFactory.AdminEmail, ApiFactory.AdminPassword);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    [Fact]
    public async Task Popup_workspace_loads_and_uses_the_string_enum_contract()
    {
        var client = await AdminClientAsync();

        using var create = new MultipartFormDataContent
        {
            { new StringContent("Welcome campaign"), "Name" },
            { new StringContent("promotional"), "Type" },
            { new StringContent("centerModal"), "Placement" },
            { new StringContent("scrollDepth"), "TriggerType" },
            { new StringContent("30"), "TriggerValue" },
            { new StringContent("all"), "TargetAudience" },
            { new StringContent("all"), "DeviceTarget" },
            { new StringContent("7"), "CooldownDays" },
            { new StringContent("true"), "IsActive" },
            { new StringContent("A little welcome"), "Title" },
        };

        var created = await client.PostAsync("/api/v1/admin/popups", create);
        created.StatusCode.Should().Be(HttpStatusCode.Created);

        var response = await client.GetAsync("/api/v1/admin/popups");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadAsStringAsync();
        json.Should().Contain("\"type\":\"promotional\"");
        json.Should().Contain("\"placement\":\"centerModal\"");
        json.Should().Contain("\"triggerType\":\"scrollDepth\"");
        json.Should().NotContain("\"type\":0");
    }

    private static async Task<string> LoginAsync(HttpClient client, string email, string password)
    {
        var response = await client.PostAsJsonAsync("/api/v1/auth/login", new { email, password });
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json);
        return body!.Data!.GetProperty("access").GetString()!;
    }

    [Fact]
    public async Task Admin_marketing_dashboard_returns_real_metrics()
    {
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var admin = await db.Users.SingleAsync(user => user.Email == ApiFactory.AdminEmail);
            var marketingWindowDate = DateTimeOffset.UtcNow.AddDays(-15);
            var cart = new Cart { UserId = admin.Id, Email = admin.Email! };
            var order = new Order
            {
                Number = $"TEST-{Guid.NewGuid():N}", UserId = admin.Id, Email = admin.Email!,
                CustomerName = "Admin", PaymentStatus = PaymentStatus.Paid, Total = 125m,
                Channel = "storefront",
            };
            db.Carts.Add(cart);
            db.Orders.Add(order);
            await db.SaveChangesAsync();
            cart.CreatedAt = marketingWindowDate;
            order.CreatedAt = marketingWindowDate;
            await db.SaveChangesAsync();
        }

        var client = await AdminClientAsync();
        var response = await client.GetAsync("/api/v1/admin/marketing");

        response.StatusCode.Should().Be(HttpStatusCode.OK, await response.Content.ReadAsStringAsync());
        var body = await response.Content.ReadFromJsonAsync<Envelope<MarketingDto>>(Json);
        body!.Success.Should().BeTrue();
        body.Data!.RevenueSeries.Should().HaveCount(30);
        body.Data.Revenue.Should().BeGreaterThanOrEqualTo(125m);
        body.Data.Funnel.Should().HaveCount(4);
        body.Data.Cohorts.Should().HaveCount(4);
    }

    // ── Catalog ────────────────────────────────────────────────────────────

    // These assertions stay independent of test execution order: other tests in this class
    // legitimately create products, so they check the seeded catalog is present rather than
    // pinning an exact table count.

    [Fact]
    public async Task Seeded_catalog_is_served_publicly()
    {
        var client = factory.CreateClient();
        var body = await client.GetFromJsonAsync<Envelope<JsonElement>>("/api/v1/products?pageSize=100", Json);

        body!.Success.Should().BeTrue();
        body.Data!.GetProperty("total").GetInt32().Should().BeGreaterThanOrEqualTo(25);

        var slugs = body.Data.GetProperty("items").EnumerateArray()
            .Select(i => i.GetProperty("slug").GetString()).ToList();

        slugs.Should().Contain([
            "lale-pearl-tassel",
            "sedef-moon-pendant",
            "nazar-chain-bracelet",
            "lal-pearl-hand-harness",
            "shahmaran-filigree-hand-chain",
            "miras-sculptural-arm-cuff",
            "masal-shepherd-hat-scarf-set",
            "bulut-chunky-infinity-scarf",
            "anadolu-botanical-bandana",
        ]);

        var seeded = body.Data.GetProperty("items").EnumerateArray()
            .First(i => i.GetProperty("slug").GetString() == "lale-pearl-tassel");

        seeded.GetProperty("image").GetString().Should().StartWith("/uploads/products/");
        seeded.GetProperty("price").GetProperty("currency").GetString().Should().Be("TRY");
    }

    [Fact]
    public async Task Catalog_filters_sorts_and_pages()
    {
        var client = factory.CreateClient();

        var necklaces = await client.GetFromJsonAsync<Envelope<JsonElement>>("/api/v1/products?category=necklaces", Json);
        necklaces!.Data!.GetProperty("items").EnumerateArray()
            .Select(i => i.GetProperty("slug").GetString())
            .Should().Contain(["lale-pearl-tassel", "sedef-moon-pendant", "halic-crystal-pendant", "ada-layered-chain"]);

        var cheapest = await client.GetFromJsonAsync<Envelope<JsonElement>>("/api/v1/products?sort=price-low&pageSize=5", Json);
        var prices = cheapest!.Data!.GetProperty("items").EnumerateArray()
            .Select(i => i.GetProperty("price").GetProperty("amount").GetDecimal()).ToList();

        prices.Should().BeInAscendingOrder("sort=price-low must order in SQL, not by insertion");

        var expensive = await client.GetFromJsonAsync<Envelope<JsonElement>>("/api/v1/products?sort=price-high&pageSize=5", Json);
        expensive!.Data!.GetProperty("items").EnumerateArray()
            .Select(i => i.GetProperty("price").GetProperty("amount").GetDecimal())
            .Should().BeInDescendingOrder();

        // Paging must partition the same result set without overlap.
        var page1 = await client.GetFromJsonAsync<Envelope<JsonElement>>("/api/v1/products?sort=name&page=1&pageSize=3", Json);
        var page2 = await client.GetFromJsonAsync<Envelope<JsonElement>>("/api/v1/products?sort=name&page=2&pageSize=3", Json);

        var ids1 = page1!.Data!.GetProperty("items").EnumerateArray().Select(i => i.GetProperty("id").GetInt32()).ToList();
        var ids2 = page2!.Data!.GetProperty("items").EnumerateArray().Select(i => i.GetProperty("id").GetInt32()).ToList();

        ids1.Should().HaveCount(3);
        ids1.Should().NotIntersectWith(ids2);

        var total = page1.Data.GetProperty("total").GetInt32();
        page1.Data.GetProperty("totalPages").GetInt32().Should().Be((int)Math.Ceiling(total / 3.0));

        var searched = await client.GetFromJsonAsync<Envelope<JsonElement>>("/api/v1/products?search=nazar", Json);
        searched!.Data!.GetProperty("items").EnumerateArray()
            .Select(i => i.GetProperty("slug").GetString())
            .Should().BeEquivalentTo(["nazar-chain-bracelet"]);
    }

    [Fact]
    public async Task Requested_categories_are_localized_illustrated_and_shoppable()
    {
        var client = factory.CreateClient();
        var body = await client.GetFromJsonAsync<Envelope<JsonElement>>("/api/v1/categories", Json);

        var categories = body!.Data!.EnumerateArray().ToDictionary(
            category => category.GetProperty("slug").GetString()!,
            category => category);

        string[] requested =
        [
            "rings", "necklaces", "bracelets", "anklets", "womens-handbags",
            "mens-wallets", "keychains", "prayer-beads", "earrings", "kids-mini-bags",
            "card-holders", "hand-harness-bracelets", "shahmaran-bracelets", "arm-cuffs",
            "shepherd-hat-scarf-sets", "infinity-scarves", "bandanas-headscarves",
        ];

        categories.Keys.Should().BeEquivalentTo(requested);
        foreach (var slug in requested)
        {
            categories[slug].GetProperty("nameTr").GetString().Should().NotBeNullOrWhiteSpace();
            categories[slug].GetProperty("image").GetString().Should().NotBeNullOrWhiteSpace();
            categories[slug].GetProperty("count").GetInt32().Should().BeGreaterThan(0);
        }
    }

    [Fact]
    public async Task Cute_keychain_collection_is_available_with_media_and_stock()
    {
        var client = factory.CreateClient();
        var body = await client.GetFromJsonAsync<Envelope<JsonElement>>(
            "/api/v1/products?category=keychains&pageSize=100", Json);

        var products = body!.Data!.GetProperty("items").EnumerateArray().ToDictionary(
            product => product.GetProperty("slug").GetString()!,
            product => product);

        string[] cuteKeychains =
        [
            "pofuduk-teddy-charm", "fiyonk-crochet-keychain",
            "jelly-bloom-beaded-charm", "cicekli-bunny-resin-charm",
        ];

        products.Keys.Should().Contain(cuteKeychains);
        foreach (var slug in cuteKeychains)
        {
            products[slug].GetProperty("nameTr").GetString().Should().NotBeNullOrWhiteSpace();
            products[slug].GetProperty("image").GetString().Should().StartWith("http");
            products[slug].GetProperty("stock").GetInt32().Should().BeGreaterThan(0);
        }
    }

    [Fact]
    public async Task Product_detail_carries_variants_media_and_turkish_copy()
    {
        var client = factory.CreateClient();
        var body = await client.GetFromJsonAsync<Envelope<JsonElement>>("/api/v1/products/lale-pearl-tassel", Json);

        var p = body!.Data!;
        p.GetProperty("nameTr").GetString().Should().NotBeNullOrWhiteSpace();
        p.GetProperty("storyTr").GetString().Should().NotBeNullOrWhiteSpace();
        p.GetProperty("images").GetArrayLength().Should().Be(3);
        p.GetProperty("variants").GetArrayLength().Should().Be(3);
        p.GetProperty("stock").GetInt32().Should().Be(12);
    }

    [Fact]
    public async Task Missing_product_returns_a_typed_404()
    {
        var client = factory.CreateClient();
        var response = await client.GetAsync("/api/v1/products/does-not-exist");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        var body = await response.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json);
        body!.Success.Should().BeFalse();
        body.Code.Should().Be("not_found");
    }

    // ── Auth ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Contact_message_is_validated_stored_and_delivered_to_the_email_boundary()
    {
        var client = factory.CreateClient();
        var customerEmail = $"contact-{Guid.NewGuid():N}@example.com";

        var response = await client.PostAsJsonAsync("/api/v1/contact/messages", new
        {
            name = "Ada Customer",
            email = customerEmail,
            topic = "order",
            message = "Could you tell me when my order will be dispatched?",
            locale = "en",
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await response.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json);
        var reference = body!.Data!.GetProperty("reference").GetInt32();

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var stored = await db.ContactMessages.SingleAsync(message => message.Id == reference);
        stored.Email.Should().Be(customerEmail);
        stored.DeliveryStatus.Should().Be("Sent");
        stored.SentAt.Should().NotBeNull();

        var mailer = factory.Services.GetRequiredService<RecordingContactEmailSender>();
        mailer.Deliveries.Should().Contain(delivery =>
            delivery.Reference == reference && delivery.Request.Email == customerEmail);
    }

    [Fact]
    public async Task Contact_message_rejects_invalid_fields_without_sending()
    {
        var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/v1/contact/messages", new
        {
            name = "",
            email = "not-an-email",
            topic = "unknown",
            message = "short",
            locale = "en",
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json);
        body!.Code.Should().Be("validation_failed");
        body.Errors.Should().ContainKeys("name", "email", "topic", "message");
    }

    [Fact]
    public async Task Contact_delivery_failure_is_recorded_and_never_returns_false_success()
    {
        var client = factory.CreateClient();
        var customerEmail = $"simulate-failure-{Guid.NewGuid():N}@example.com";
        var response = await client.PostAsJsonAsync("/api/v1/contact/messages", new
        {
            name = "Delivery Test",
            email = customerEmail,
            topic = "product",
            message = "This valid message simulates an unavailable email provider.",
            locale = "en",
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadGateway);
        var body = await response.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json);
        body!.Code.Should().Be("email_delivery_failed");

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var stored = await db.ContactMessages.SingleAsync(message => message.Email == customerEmail);
        stored.DeliveryStatus.Should().Be("Failed");
        stored.SentAt.Should().BeNull();
    }

    [Fact]
    public async Task Newsletter_subscription_is_validated_persisted_and_idempotent()
    {
        var client = factory.CreateClient();
        var email = $"notes-{Guid.NewGuid():N}@example.com";

        var created = await client.PostAsJsonAsync("/api/v1/newsletter/subscribe",
            new { email, locale = "tr", source = "home" });
        created.StatusCode.Should().Be(HttpStatusCode.Created);

        var first = await created.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json);
        first!.Data!.GetProperty("email").GetString().Should().Be(email);
        first.Data.GetProperty("alreadySubscribed").GetBoolean().Should().BeFalse();

        var duplicate = await client.PostAsJsonAsync("/api/v1/newsletter/subscribe",
            new { email = email.ToUpperInvariant(), locale = "en", source = "footer" });
        duplicate.StatusCode.Should().Be(HttpStatusCode.OK);

        var second = await duplicate.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json);
        second!.Data!.GetProperty("alreadySubscribed").GetBoolean().Should().BeTrue();

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        (await db.NewsletterSubscribers.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task Newsletter_rejects_invalid_email_and_untrusted_source()
    {
        var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/v1/newsletter/subscribe",
            new { email = "not-an-email", locale = "en", source = "unknown" });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json);
        body!.Code.Should().Be("validation_failed");
        body.Errors.Should().ContainKeys("email", "source");
    }

    [Fact]
    public async Task Register_login_refresh_and_profile_round_trip()
    {
        var client = factory.CreateClient();
        var email = $"user-{Guid.NewGuid():N}@example.com";

        var registered = await client.PostAsJsonAsync("/api/v1/auth/register",
            new { email, firstName = "Test", lastName = "Person", password = ApiFactory.AdminPassword });
        registered.StatusCode.Should().Be(HttpStatusCode.Created);

        var session = (await registered.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json))!.Data!;
        session.GetProperty("user").GetProperty("role").GetString().Should().Be("customer");

        var refresh = session.GetProperty("refresh").GetString();
        var rotated = await client.PostAsJsonAsync("/api/v1/auth/refresh", new { refresh });
        rotated.StatusCode.Should().Be(HttpStatusCode.OK);

        var rotatedSession = (await rotated.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json))!.Data!;
        var newAccess = rotatedSession.GetProperty("access").GetString();

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", newAccess);
        var profile = await client.GetFromJsonAsync<Envelope<JsonElement>>("/api/v1/auth/profile", Json);
        profile!.Data!.GetProperty("email").GetString().Should().Be(email);
    }

    [Fact]
    public async Task A_rotated_refresh_token_cannot_be_reused()
    {
        var client = factory.CreateClient();
        var email = $"rotate-{Guid.NewGuid():N}@example.com";

        var registered = await client.PostAsJsonAsync("/api/v1/auth/register",
            new { email, firstName = "Rot", lastName = "Ate", password = ApiFactory.AdminPassword });
        var session = (await registered.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json))!.Data!;
        var original = session.GetProperty("refresh").GetString();

        (await client.PostAsJsonAsync("/api/v1/auth/refresh", new { refresh = original }))
            .StatusCode.Should().Be(HttpStatusCode.OK);

        // Presenting the superseded token again must be refused, not silently honoured.
        var replay = await client.PostAsJsonAsync("/api/v1/auth/refresh", new { refresh = original });
        replay.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Wrong_password_is_rejected_without_revealing_whether_the_account_exists()
    {
        var client = factory.CreateClient();

        var wrongPassword = await client.PostAsJsonAsync("/api/v1/auth/login",
            new { email = ApiFactory.AdminEmail, password = "definitely-wrong" });
        var unknownAccount = await client.PostAsJsonAsync("/api/v1/auth/login",
            new { email = "nobody@example.com", password = "definitely-wrong" });

        wrongPassword.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        unknownAccount.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        var a = await wrongPassword.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json);
        var b = await unknownAccount.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json);
        a!.Message.Should().Be(b!.Message);
    }

    [Fact]
    public async Task Registration_reports_field_level_validation_errors()
    {
        var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/v1/auth/register",
            new { email = "not-an-email", firstName = "", lastName = "X", password = "short" });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json);

        body!.Code.Should().Be("validation_failed");
        body.Errors.Should().ContainKeys("email", "firstName", "password");
    }

    // ── Authorization ──────────────────────────────────────────────────────

    [Fact]
    public async Task Admin_routes_reject_anonymous_and_non_admin_callers()
    {
        var anonymous = factory.CreateClient();
        (await anonymous.GetAsync("/api/v1/admin/products")).StatusCode
            .Should().Be(HttpStatusCode.Unauthorized);

        var email = $"cust-{Guid.NewGuid():N}@example.com";
        await anonymous.PostAsJsonAsync("/api/v1/auth/register",
            new { email, firstName = "C", lastName = "U", password = ApiFactory.AdminPassword });

        var customer = factory.CreateClient();
        customer.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await LoginAsync(customer, email, ApiFactory.AdminPassword));

        (await customer.GetAsync("/api/v1/admin/products")).StatusCode
            .Should().Be(HttpStatusCode.Forbidden);

        var admin = await AdminClientAsync();
        (await admin.GetAsync("/api/v1/admin/products")).StatusCode
            .Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Ticket_conversation_enforces_ownership_internal_notes_and_private_attachments()
    {
        var email = $"support-{Guid.NewGuid():N}@example.com";
        var customer = factory.CreateClient();
        await customer.PostAsJsonAsync("/api/v1/auth/register",
            new { email, firstName = "Ada", lastName = "Customer", password = ApiFactory.AdminPassword });
        customer.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await LoginAsync(customer, email, ApiFactory.AdminPassword));

        using var create = new MultipartFormDataContent
        {
            { new StringContent("Delivery date for my order"), "Subject" },
            { new StringContent("shipping"), "Category" },
            { new StringContent("Could you confirm when my parcel will leave the atelier?"), "Message" },
        };
        var pdf = new ByteArrayContent(Encoding.ASCII.GetBytes("%PDF-1.7\nprivate support document"));
        pdf.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
        create.Add(pdf, "attachments", "receipt.pdf");

        var createdResponse = await customer.PostAsync("/api/v1/tickets", create);
        createdResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = (await createdResponse.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json))!.Data!;
        var ticketId = created.GetProperty("id").GetInt32();
        var attachmentId = created.GetProperty("messages")[0].GetProperty("attachments")[0].GetProperty("id").GetInt32();

        var strangerEmail = $"stranger-{Guid.NewGuid():N}@example.com";
        var stranger = factory.CreateClient();
        await stranger.PostAsJsonAsync("/api/v1/auth/register",
            new { email = strangerEmail, firstName = "Other", lastName = "Customer", password = ApiFactory.AdminPassword });
        stranger.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await LoginAsync(stranger, strangerEmail, ApiFactory.AdminPassword));
        (await stranger.GetAsync($"/api/v1/tickets/{ticketId}")).StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await stranger.GetAsync($"/api/v1/tickets/{ticketId}/attachments/{attachmentId}"))
            .StatusCode.Should().Be(HttpStatusCode.NotFound);

        var admin = await AdminClientAsync();
        var note = new MultipartFormDataContent
        {
            { new StringContent("Customer has a verified delivery address."), "Body" },
            { new StringContent("true"), "IsInternal" },
        };
        var noteResponse = await admin.PostAsync($"/api/v1/admin/support/tickets/{ticketId}/messages", note);
        noteResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var afterNote = (await noteResponse.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json))!.Data!;
        var privateNote = afterNote.GetProperty("messages").EnumerateArray()
            .Single(message => message.GetProperty("isInternal").GetBoolean());
        afterNote.GetProperty("preview").GetString().Should().Be("Customer has a verified delivery address.");
        afterNote.GetProperty("lastMessageAt").GetDateTimeOffset()
            .Should().Be(privateNote.GetProperty("createdAt").GetDateTimeOffset(),
                "staff timestamps must follow the latest staff-visible note");

        var agentPayload = await admin.GetFromJsonAsync<Envelope<JsonElement>>("/api/v1/admin/support/agents", Json);
        var adminId = agentPayload!.Data![0].GetProperty("id").GetString();
        var updated = await admin.PatchAsJsonAsync($"/api/v1/admin/support/tickets/{ticketId}", new
        {
            status = "in_progress",
            priority = "high",
            assignedToUserId = adminId,
        });
        updated.StatusCode.Should().Be(HttpStatusCode.OK);
        var updatedTicket = (await updated.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json))!.Data!;
        updatedTicket.GetProperty("priority").GetString().Should().Be("high");
        updatedTicket.GetProperty("assignedToUserId").GetString().Should().Be(adminId);

        var reply = new MultipartFormDataContent
        {
            { new StringContent("Your parcel is scheduled to leave tomorrow afternoon."), "Body" },
            { new StringContent("false"), "IsInternal" },
        };
        (await admin.PostAsync($"/api/v1/admin/support/tickets/{ticketId}/messages", reply))
            .StatusCode.Should().Be(HttpStatusCode.OK);

        var customerView = await customer.GetFromJsonAsync<Envelope<JsonElement>>($"/api/v1/tickets/{ticketId}", Json);
        customerView!.Data!.GetProperty("messages").GetArrayLength().Should().Be(2,
            "private staff notes must never leave the customer API");
        customerView.Data.GetProperty("status").GetString().Should().Be("waiting_for_customer");

        var download = await customer.GetAsync($"/api/v1/tickets/{ticketId}/attachments/{attachmentId}");
        download.StatusCode.Should().Be(HttpStatusCode.OK);
        download.Content.Headers.ContentType!.MediaType.Should().Be("application/pdf");

        var customerReply = new MultipartFormDataContent
        {
            { new StringContent("Thank you, I will watch for the tracking message."), "Body" },
        };
        var replied = await customer.PostAsync($"/api/v1/tickets/{ticketId}/messages", customerReply);
        var repliedBody = (await replied.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json))!.Data!;
        repliedBody.GetProperty("status").GetString().Should().Be("in_progress");

        (await admin.PatchAsJsonAsync($"/api/v1/admin/support/tickets/{ticketId}", new
        {
            status = "closed",
            priority = "high",
            assignedToUserId = adminId,
        })).StatusCode.Should().Be(HttpStatusCode.OK);
        using var afterClose = new MultipartFormDataContent
        {
            { new StringContent("I should not be able to append to a closed conversation."), "Body" },
        };
        (await customer.PostAsync($"/api/v1/tickets/{ticketId}/messages", afterClose))
            .StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Staff_role_can_use_support_workspace_but_not_administrator_apis()
    {
        var email = $"agent-{Guid.NewGuid():N}@example.com";
        var registration = factory.CreateClient();
        await registration.PostAsJsonAsync("/api/v1/auth/register",
            new { email, firstName = "Support", lastName = "Agent", password = ApiFactory.AdminPassword });

        var admin = await AdminClientAsync();
        var users = await admin.GetFromJsonAsync<Envelope<JsonElement>>(
            $"/api/v1/admin/users?search={Uri.EscapeDataString(email)}", Json);
        var id = users!.Data!.GetProperty("items")[0].GetProperty("id").GetString();
        (await admin.PatchAsJsonAsync($"/api/v1/admin/users/{id}/role", new { role = "Staff" }))
            .StatusCode.Should().Be(HttpStatusCode.OK);

        var staff = factory.CreateClient();
        staff.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await LoginAsync(staff, email, ApiFactory.AdminPassword));
        (await staff.GetAsync("/api/v1/admin/support/tickets")).StatusCode.Should().Be(HttpStatusCode.OK);
        (await staff.GetAsync("/api/v1/admin/support/agents")).StatusCode.Should().Be(HttpStatusCode.OK);
        (await staff.GetAsync("/api/v1/admin/products")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await staff.GetAsync("/api/v1/admin/users")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // ── Admin product lifecycle ────────────────────────────────────────────

    private static MultipartFormDataContent ProductForm(string name, decimal price, byte[]? image = null)
    {
        var form = new MultipartFormDataContent
        {
            { new StringContent(name), "Name" },
            { new StringContent("1"), "CategoryId" },
            { new StringContent("Created by the integration test."), "Description" },
            { new StringContent("A story."), "Story" },
            { new StringContent("Silk"), "Material" },
            { new StringContent("10 cm"), "Dimensions" },
            { new StringContent(price.ToString(System.Globalization.CultureInfo.InvariantCulture)), "Price" },
            { new StringContent("TRY"), "Currency" },
            { new StringContent("true"), "IsActive" },
            { new StringContent("""[{"title":"Gold","color":"Gold","stock":5}]"""), "VariantsJson" },
        };

        if (image is not null)
        {
            var file = new ByteArrayContent(image);
            file.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
            form.Add(file, "images", "piece.jpg");
        }

        return form;
    }

    private static byte[] JpegBytes()
    {
        var bytes = new byte[128];
        bytes[0] = 0xFF; bytes[1] = 0xD8; bytes[2] = 0xFF;
        return bytes;
    }

    [Fact]
    public async Task Admin_can_create_a_product_with_an_image()
    {
        var admin = await AdminClientAsync();

        var response = await admin.PostAsync("/api/v1/admin/products",
            ProductForm($"Created {Guid.NewGuid():N}", 210.25m, JpegBytes()));

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var product = (await response.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json))!.Data!;

        product.GetProperty("image").GetString().Should().StartWith("/uploads/products/");
        product.GetProperty("price").GetProperty("amount").GetDecimal().Should().Be(210.25m);
        product.GetProperty("stock").GetInt32().Should().Be(5);
        product.GetProperty("colors").EnumerateArray().Select(c => c.GetString()).Should().Contain("Gold");
    }

    [Fact]
    public async Task Updating_without_a_file_keeps_the_existing_image()
    {
        var admin = await AdminClientAsync();

        var created = await admin.PostAsync("/api/v1/admin/products",
            ProductForm($"Keep image {Guid.NewGuid():N}", 100m, JpegBytes()));
        var product = (await created.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json))!.Data!;

        var id = product.GetProperty("id").GetInt32();
        var originalImage = product.GetProperty("image").GetString();

        var updated = await admin.PutAsync($"/api/v1/admin/products/{id}",
            ProductForm("Renamed but same photo", 111m));
        updated.StatusCode.Should().Be(HttpStatusCode.OK);

        var after = (await updated.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json))!.Data!;
        after.GetProperty("image").GetString().Should().Be(originalImage);
        after.GetProperty("price").GetProperty("amount").GetDecimal().Should().Be(111m);
    }

    [Fact]
    public async Task A_disguised_non_image_upload_is_rejected()
    {
        var admin = await AdminClientAsync();
        var notAnImage = Encoding.UTF8.GetBytes("<?php echo 'nope'; ?>");

        var response = await admin.PostAsync("/api/v1/admin/products",
            ProductForm($"Bad upload {Guid.NewGuid():N}", 50m, notAnImage));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json);
        body!.Message.Should().Contain("JPEG, PNG and WebP");
    }

    [Fact]
    public async Task Invalid_product_fields_are_reported_per_field()
    {
        var admin = await AdminClientAsync();

        var form = new MultipartFormDataContent
        {
            { new StringContent(""), "Name" },
            { new StringContent("0"), "CategoryId" },
            { new StringContent(""), "Description" },
            { new StringContent("-5"), "Price" },
            { new StringContent("TRY"), "Currency" },
        };

        var response = await admin.PostAsync("/api/v1/admin/products", form);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json);
        body!.Errors.Should().ContainKeys("name", "categoryId", "description", "price");
    }

    [Fact]
    public async Task Deleting_a_product_hides_it_publicly_but_keeps_the_row()
    {
        var admin = await AdminClientAsync();

        var created = await admin.PostAsync("/api/v1/admin/products",
            ProductForm($"Soft delete {Guid.NewGuid():N}", 77m, JpegBytes()));
        var product = (await created.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json))!.Data!;
        var id = product.GetProperty("id").GetInt32();
        var slug = product.GetProperty("slug").GetString();

        (await admin.DeleteAsync($"/api/v1/admin/products/{id}")).StatusCode.Should().Be(HttpStatusCode.OK);

        var publicClient = factory.CreateClient();
        (await publicClient.GetAsync($"/api/v1/products/{slug}")).StatusCode
            .Should().Be(HttpStatusCode.NotFound);

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // The row survives — order history references it — but the filter hides it.
        var stillThere = await db.Products.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.Id == id);
        stillThere.Should().NotBeNull();
        stillThere!.IsDelete.Should().BeTrue();

        (await db.Products.AnyAsync(p => p.Id == id)).Should().BeFalse();
    }

    // ── Cart and orders ────────────────────────────────────────────────────

    [Fact]
    public async Task Trade_in_is_estimated_applied_snapshotted_and_admin_verified()
    {
        var anonymous = factory.CreateClient();
        var estimate = await anonymous.PostAsJsonAsync("/api/v1/trade-ins/estimate", new
        {
            category = "jewelry",
            condition = "good",
            targetProductSlug = "sedef-moon-pendant",
            targetProductPrice = 100m,
        });
        estimate.StatusCode.Should().Be(HttpStatusCode.OK);
        var estimateBody = (await estimate.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json))!.Data!;
        estimateBody.GetProperty("estimatedCredit").GetDecimal().Should().BeGreaterThan(0m);

        var email = $"trade-{Guid.NewGuid():N}@example.com";
        var registered = await anonymous.PostAsJsonAsync("/api/v1/auth/register",
            new { email, firstName = "Trade", lastName = "Customer", password = ApiFactory.AdminPassword });
        var session = (await registered.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json))!.Data!;

        var customer = factory.CreateClient();
        customer.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer", session.GetProperty("access").GetString());

        (await customer.PostAsJsonAsync("/api/v1/cart/items",
            new { productSlug = "sedef-moon-pendant", color = "", quantity = 1 }))
            .StatusCode.Should().Be(HttpStatusCode.OK);

        using var form = new MultipartFormDataContent
        {
            { new StringContent("jewelry"), "category" },
            { new StringContent("good"), "condition" },
            { new StringContent("Vintage pearl necklace"), "brandModel" },
            { new StringContent("drop_off"), "handoffMethod" },
            { new StringContent("sedef-moon-pendant"), "targetProductSlug" },
        };
        var photo = new ByteArrayContent(JpegBytes());
        photo.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
        form.Add(photo, "image", "trade-in.jpg");

        var applied = await customer.PostAsync("/api/v1/trade-ins/apply", form);
        applied.StatusCode.Should().Be(HttpStatusCode.OK);
        var cart = (await applied.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json))!.Data!;
        var credit = cart.GetProperty("tradeInCredit").GetDecimal();
        credit.Should().BeGreaterThan(0m);
        cart.GetProperty("tradeIn").GetProperty("status").GetString().Should().Be("pending_verification");
        cart.GetProperty("totalAfterDiscount").GetDecimal().Should().Be(
            cart.GetProperty("subtotal").GetDecimal() - credit);

        // Coupon and trade-in are independent server-owned credits; applying one must not
        // make the other disappear from the returned cart.
        var admin = await AdminClientAsync();
        var couponCode = $"TRADE{Guid.NewGuid():N}"[..16].ToUpperInvariant();
        (await admin.PostAsJsonAsync("/api/v1/admin/promotions", new
        {
            name = "Trade-in compatibility",
            code = couponCode,
            discountType = "fixed_amount",
            value = 5m,
            minimumSpend = 0m,
            isActive = true,
        })).StatusCode.Should().Be(HttpStatusCode.Created);

        var couponApplied = await customer.PostAsJsonAsync("/api/v1/coupons/validate",
            new { code = couponCode, subtotal = 9999m });
        var combinedCart = (await couponApplied.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json))!.Data!;
        combinedCart.GetProperty("tradeIn").GetProperty("id").GetInt32().Should().BeGreaterThan(0);
        combinedCart.GetProperty("couponDiscountTotal").GetDecimal().Should().Be(5m);
        combinedCart.GetProperty("tradeInCredit").GetDecimal().Should().Be(credit);

        var checkedOut = await customer.PostAsJsonAsync("/api/v1/orders/checkout",
            new { email, delivery = "standard", locale = "en" });
        checkedOut.StatusCode.Should().Be(HttpStatusCode.Created);
        var order = (await checkedOut.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json))!.Data!;
        order.GetProperty("tradeInCredit").GetDecimal().Should().Be(credit);
        order.GetProperty("tradeIn").GetProperty("status").GetString().Should().Be("pending_verification");
        order.GetProperty("discountTotal").GetDecimal().Should().Be(credit + 5m);

        var tradeInId = order.GetProperty("tradeIn").GetProperty("id").GetInt32();
        var approved = await admin.PatchAsJsonAsync($"/api/v1/admin/trade-ins/{tradeInId}/status",
            new { status = "approved", adminNote = "Condition verified at PTT handoff." });
        approved.StatusCode.Should().Be(HttpStatusCode.OK);
        var approvedBody = (await approved.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json))!.Data!;
        approvedBody.GetProperty("status").GetString().Should().Be("approved");

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var persisted = await db.TradeInRequests.IgnoreQueryFilters().SingleAsync(entry => entry.Id == tradeInId);
        persisted.CartId.Should().BeNull();
        persisted.OrderId.Should().Be(order.GetProperty("id").GetInt32());
    }

    [Fact]
    public async Task Coupons_are_admin_managed_validated_and_snapshotted_at_checkout()
    {
        var anonymous = factory.CreateClient();
        var unauthorized = await anonymous.PostAsJsonAsync("/api/v1/coupons/validate",
            new { code = "WELCOME15", subtotal = 9999 });
        unauthorized.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        var admin = await AdminClientAsync();
        var code = $"TEST{Guid.NewGuid():N}"[..16].ToUpperInvariant();
        var percentCode = $"PCT{Guid.NewGuid():N}"[..16].ToUpperInvariant();
        var created = await admin.PostAsJsonAsync("/api/v1/admin/promotions", new
        {
            name = "Integration fixed offer",
            code,
            discountType = "fixed_amount",
            value = 10,
            minimumSpend = 30,
            isActive = true,
            usageLimit = 2,
        });
        created.StatusCode.Should().Be(HttpStatusCode.Created);
        (await admin.PostAsJsonAsync("/api/v1/admin/promotions", new
        {
            name = "Integration percentage offer",
            code = percentCode,
            discountType = "percentage",
            value = 15,
            minimumSpend = 0,
            isActive = true,
        })).StatusCode.Should().Be(HttpStatusCode.Created);
        var adminList = await admin.GetFromJsonAsync<Envelope<JsonElement>>("/api/v1/admin/promotions", Json);
        adminList!.Data!.EnumerateArray().Select(item => item.GetProperty("code").GetString())
            .Should().Contain([code, percentCode]);

        var client = factory.CreateClient();
        var email = $"coupon-{Guid.NewGuid():N}@example.com";
        await client.PostAsJsonAsync("/api/v1/auth/register",
            new { email, firstName = "Code", lastName = "Tester", password = ApiFactory.AdminPassword });
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await LoginAsync(client, email, ApiFactory.AdminPassword));

        await client.PostAsJsonAsync("/api/v1/cart/items",
            new { productSlug = "ada-layered-chain", color = "Silver", quantity = 1 });

        var applied = await client.PostAsJsonAsync("/api/v1/coupons/validate",
            new { code = code.ToLowerInvariant(), subtotal = 1 });
        applied.StatusCode.Should().Be(HttpStatusCode.OK);
        var cart = (await applied.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json))!.Data!;
        cart.GetProperty("coupon").GetProperty("code").GetString().Should().Be(code);
        cart.GetProperty("coupon").GetProperty("badge").GetString().Should().Be("10 TL OFF");
        cart.GetProperty("discountTotal").GetDecimal().Should().Be(10m);
        cart.GetProperty("totalAfterDiscount").GetDecimal()
            .Should().Be(cart.GetProperty("subtotal").GetDecimal() - 10m);

        // Removal returns server-repriced totals, then the same persisted code can be applied.
        var removed = await client.DeleteAsync("/api/v1/coupons/current");
        removed.StatusCode.Should().Be(HttpStatusCode.OK);
        (await removed.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json))!.Data!
            .GetProperty("discountTotal").GetDecimal().Should().Be(0m);

        var percentage = await client.PostAsJsonAsync("/api/v1/coupons/validate",
            new { code = percentCode, subtotal = 0 });
        var percentageCart = (await percentage.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json))!.Data!;
        percentageCart.GetProperty("discountTotal").GetDecimal().Should().Be(
            decimal.Round(percentageCart.GetProperty("subtotal").GetDecimal() * .15m, 2));
        await client.DeleteAsync("/api/v1/coupons/current");

        await client.PostAsJsonAsync("/api/v1/coupons/validate", new { code, subtotal = 0 });

        var checkout = await client.PostAsJsonAsync("/api/v1/orders/checkout",
            new { email, delivery = "standard", locale = "en" });
        checkout.StatusCode.Should().Be(HttpStatusCode.Created);
        var order = (await checkout.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json))!.Data!;
        order.GetProperty("couponCode").GetString().Should().Be(code);
        order.GetProperty("couponDiscountType").GetString().Should().Be("fixed_amount");
        order.GetProperty("discountTotal").GetDecimal().Should().Be(10m);
        order.GetProperty("total").GetDecimal().Should().Be(
            order.GetProperty("subtotal").GetDecimal() - 10m + order.GetProperty("shippingTotal").GetDecimal());
    }

    [Fact]
    public async Task Coupon_validation_reports_expiry_and_minimum_spend_with_stable_codes()
    {
        var admin = await AdminClientAsync();
        var suffix = Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
        await admin.PostAsJsonAsync("/api/v1/admin/promotions", new
        {
            name = "Expired test", code = $"OLD{suffix}", discountType = "percentage",
            value = 15, minimumSpend = 0, isActive = true,
            startsAt = DateTimeOffset.UtcNow.AddDays(-2), expiresAt = DateTimeOffset.UtcNow.AddDays(-1),
        });
        await admin.PostAsJsonAsync("/api/v1/admin/promotions", new
        {
            name = "High minimum test", code = $"HIGH{suffix}", discountType = "percentage",
            value = 15, minimumSpend = 10000, isActive = true,
        });

        var client = factory.CreateClient();
        var email = $"coupon-errors-{Guid.NewGuid():N}@example.com";
        await client.PostAsJsonAsync("/api/v1/auth/register",
            new { email, firstName = "Coupon", lastName = "Errors", password = ApiFactory.AdminPassword });
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await LoginAsync(client, email, ApiFactory.AdminPassword));
        await client.PostAsJsonAsync("/api/v1/cart/items",
            new { productSlug = "ada-layered-chain", color = "Silver", quantity = 1 });

        var expired = await client.PostAsJsonAsync("/api/v1/coupons/validate", new { code = $"OLD{suffix}", subtotal = 0 });
        expired.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await expired.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json))!.Code.Should().Be("expired_coupon");

        var minimum = await client.PostAsJsonAsync("/api/v1/coupons/validate", new { code = $"HIGH{suffix}", subtotal = 10000 });
        minimum.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await minimum.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json);
        body!.Code.Should().Be("minimum_spend");
        body.Message.Should().Contain("10.000 TL");
    }

    [Fact]
    public async Task Checkout_reserves_stock_and_cancelling_returns_it()
    {
        var client = factory.CreateClient();
        var email = $"buyer-{Guid.NewGuid():N}@example.com";
        await client.PostAsJsonAsync("/api/v1/auth/register",
            new { email, firstName = "Buy", lastName = "Er", password = ApiFactory.AdminPassword });

        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await LoginAsync(client, email, ApiFactory.AdminPassword));

        var before = await StockOfAsync("ada-layered-chain");

        await client.PostAsJsonAsync("/api/v1/cart/items",
            new { productSlug = "ada-layered-chain", color = "Silver", quantity = 2 });

        var checkout = await client.PostAsJsonAsync("/api/v1/orders/checkout",
            new { email, delivery = "standard", locale = "en" });
        checkout.StatusCode.Should().Be(HttpStatusCode.Created);

        var order = (await checkout.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json))!.Data!;
        order.GetProperty("paymentStatus").GetString().Should().Be("unpaid");
        order.GetProperty("itemCount").GetInt32().Should().Be(2);

        // Subtotal 268 remains below the 500 TL free-delivery threshold.
        order.GetProperty("shippingTotal").GetDecimal().Should().Be(30m);
        order.GetProperty("total").GetDecimal().Should().Be(298m);

        (await StockOfAsync("ada-layered-chain")).Should().Be(before - 2);

        var admin = await AdminClientAsync();
        var id = order.GetProperty("id").GetInt32();
        await admin.PatchAsJsonAsync($"/api/v1/admin/orders/{id}/status", new { status = "cancelled" });

        (await StockOfAsync("ada-layered-chain")).Should().Be(before);
    }

    [Fact]
    public async Task Exchange_difference_is_credited_to_wallet_and_can_pay_a_later_exchange()
    {
        var client = factory.CreateClient();
        var email = $"wallet-exchange-{Guid.NewGuid():N}@example.com";
        await client.PostAsJsonAsync("/api/v1/auth/register",
            new { email, firstName = "Wallet", lastName = "Collector", password = ApiFactory.AdminPassword });
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await LoginAsync(client, email, ApiFactory.AdminPassword));
        var admin = await AdminClientAsync();

        async Task<JsonElement> BuyAndDeliver(string slug, string color)
        {
            (await client.PostAsJsonAsync("/api/v1/cart/items", new { productSlug = slug, color, quantity = 1 }))
                .StatusCode.Should().Be(HttpStatusCode.OK);
            var checkout = await client.PostAsJsonAsync("/api/v1/orders/checkout",
                new { email, delivery = "standard", locale = "en" });
            checkout.StatusCode.Should().Be(HttpStatusCode.Created);
            var order = (await checkout.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json))!.Data!;
            (await admin.PatchAsJsonAsync($"/api/v1/admin/orders/{order.GetProperty("id").GetInt32()}/status",
                new { status = "delivered" })).StatusCode.Should().Be(HttpStatusCode.OK);
            return order;
        }

        async Task<int> VariantId(string slug, string color)
        {
            var product = await client.GetFromJsonAsync<Envelope<JsonElement>>($"/api/v1/products/{slug}", Json);
            return product!.Data!.GetProperty("variants").EnumerateArray()
                .Single(variant => variant.GetProperty("color").GetString() == color)
                .GetProperty("id").GetInt32();
        }

        var expensiveOrder = await BuyAndDeliver("ada-layered-chain", "Silver");
        var cheapVariant = await VariantId("atelier-charm-no-7", "Sage");
        var creditRequest = await client.PostAsJsonAsync("/api/v1/exchanges", new
        {
            orderItemId = expensiveOrder.GetProperty("items")[0].GetProperty("id").GetInt32(),
            newProductVariantId = cheapVariant,
            invoiceIntact = true,
            packagingIntact = true,
        });
        creditRequest.StatusCode.Should().Be(HttpStatusCode.Created);
        var creditExchange = (await creditRequest.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json))!.Data!;
        creditExchange.GetProperty("walletCredit").GetDecimal().Should().Be(88m);
        creditExchange.GetProperty("status").GetString().Should().Be("pending_verification");

        var approvedCredit = await admin.PatchAsJsonAsync(
            $"/api/v1/admin/exchanges/{creditExchange.GetProperty("id").GetInt32()}/status",
            new { status = "approved", adminNote = "Invoice and original box verified." });
        approvedCredit.StatusCode.Should().Be(HttpStatusCode.OK);
        var walletAfterCredit = await client.GetFromJsonAsync<Envelope<JsonElement>>("/api/v1/wallet?currency=TRY", Json);
        walletAfterCredit!.Data!.GetProperty("balance").GetDecimal().Should().Be(88m);
        walletAfterCredit.Data.GetProperty("transactions").EnumerateArray().Should().ContainSingle();

        var cheapOrder = await BuyAndDeliver("atelier-charm-no-7", "Sage");
        var expensiveVariant = await VariantId("ada-layered-chain", "Silver");
        var dueRequest = await client.PostAsJsonAsync("/api/v1/exchanges", new
        {
            orderItemId = cheapOrder.GetProperty("items")[0].GetProperty("id").GetInt32(),
            newProductVariantId = expensiveVariant,
            invoiceIntact = true,
            packagingIntact = true,
        });
        var dueExchange = (await dueRequest.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json))!.Data!;
        dueExchange.GetProperty("amountDue").GetDecimal().Should().Be(88m);
        var dueId = dueExchange.GetProperty("id").GetInt32();
        (await admin.PatchAsJsonAsync($"/api/v1/admin/exchanges/{dueId}/status",
            new { status = "approved" })).StatusCode.Should().Be(HttpStatusCode.OK);

        var settlement = await client.PostAsJsonAsync($"/api/v1/exchanges/{dueId}/checkout",
            new { email, locale = "en", useWalletBalance = true });
        settlement.StatusCode.Should().Be(HttpStatusCode.Created);
        var settlementOrder = (await settlement.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json))!.Data!;
        settlementOrder.GetProperty("walletCredit").GetDecimal().Should().Be(88m);
        settlementOrder.GetProperty("total").GetDecimal().Should().Be(0m);
        settlementOrder.GetProperty("paymentStatus").GetString().Should().Be("paid");

        var emptyWallet = await client.GetFromJsonAsync<Envelope<JsonElement>>("/api/v1/wallet?currency=TRY", Json);
        emptyWallet!.Data!.GetProperty("balance").GetDecimal().Should().Be(0m);
        emptyWallet.Data.GetProperty("transactions").EnumerateArray().Should().HaveCount(2);
    }

    [Fact]
    public async Task Adding_more_than_available_stock_is_capped_not_oversold()
    {
        var client = factory.CreateClient();
        var email = $"greedy-{Guid.NewGuid():N}@example.com";
        await client.PostAsJsonAsync("/api/v1/auth/register",
            new { email, firstName = "G", lastName = "R", password = ApiFactory.AdminPassword });

        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await LoginAsync(client, email, ApiFactory.AdminPassword));

        // Mira has 4 units spread over two finishes: 2 in Gold.
        var response = await client.PostAsJsonAsync("/api/v1/cart/items",
            new { productSlug = "mira-drop-earrings", color = "Gold", quantity = 9 });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var cart = (await response.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json))!.Data!;
        var line = cart.GetProperty("items")[0];

        line.GetProperty("quantity").GetInt32()
            .Should().BeLessThanOrEqualTo(line.GetProperty("availableStock").GetInt32());
    }

    [Fact]
    public async Task A_sold_out_option_cannot_be_added()
    {
        var client = factory.CreateClient();
        var email = $"soldout-{Guid.NewGuid():N}@example.com";
        await client.PostAsJsonAsync("/api/v1/auth/register",
            new { email, firstName = "S", lastName = "O", password = ApiFactory.AdminPassword });

        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await LoginAsync(client, email, ApiFactory.AdminPassword));

        // Haliç is seeded with zero stock.
        var response = await client.PostAsJsonAsync("/api/v1/cart/items",
            new { productSlug = "halic-crystal-pendant", color = "Smoky quartz", quantity = 1 });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Kavanoz_is_added_atomically_and_gift_notes_survive_checkout()
    {
        var client = factory.CreateClient();
        var email = $"kavanoz-{Guid.NewGuid():N}@example.com";
        await client.PostAsJsonAsync("/api/v1/auth/register",
            new { email, firstName = "Gift", lastName = "Maker", password = ApiFactory.AdminPassword });
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await LoginAsync(client, email, ApiFactory.AdminPassword));

        var add = await client.PostAsJsonAsync("/api/v1/cart/gift-boxes", new
        {
            items = new[]
            {
                new { productSlug = "bosphorus-signet", color = "Bosphorus blue" },
                new { productSlug = "pofuduk-teddy-charm", color = "Blush" },
            },
            giftMessage = "For every little moment.",
            packagingNotes = "Ivory ribbon, please.",
        });

        add.StatusCode.Should().Be(HttpStatusCode.OK);
        var cart = (await add.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json))!.Data!;
        var lines = cart.GetProperty("items").EnumerateArray().ToList();
        lines.Should().HaveCount(2);
        lines.Select(line => line.GetProperty("giftBoxKey").GetString()).Distinct().Should().ContainSingle();
        lines.Should().OnlyContain(line => line.GetProperty("giftMessage").GetString() == "For every little moment.");

        var checkout = await client.PostAsJsonAsync("/api/v1/orders/checkout",
            new { email, delivery = "standard", locale = "en" });
        checkout.StatusCode.Should().Be(HttpStatusCode.Created);
        var order = (await checkout.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json))!.Data!;
        var orderLines = order.GetProperty("items").EnumerateArray().ToList();
        orderLines.Should().OnlyContain(line => line.GetProperty("packagingNotes").GetString() == "Ivory ribbon, please.");
    }

    [Fact]
    public async Task Kavanoz_requires_two_pieces_and_at_least_one_jewelry_item()
    {
        var client = factory.CreateClient();
        var email = $"kavanoz-invalid-{Guid.NewGuid():N}@example.com";
        await client.PostAsJsonAsync("/api/v1/auth/register",
            new { email, firstName = "Gift", lastName = "Check", password = ApiFactory.AdminPassword });
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await LoginAsync(client, email, ApiFactory.AdminPassword));

        var tooSmall = await client.PostAsJsonAsync("/api/v1/cart/gift-boxes", new
        {
            items = new[] { new { productSlug = "pofuduk-teddy-charm", color = "Blush" } },
        });
        tooSmall.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var noJewelry = await client.PostAsJsonAsync("/api/v1/cart/gift-boxes", new
        {
            items = new[]
            {
                new { productSlug = "pofuduk-teddy-charm", color = "Blush" },
                new { productSlug = "galata-bifold-wallet", color = "Black" },
            },
        });
        noJewelry.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Surprise_box_keeps_the_contents_hidden_and_preserves_preferences()
    {
        var client = factory.CreateClient();
        var email = $"surprise-{Guid.NewGuid():N}@example.com";
        await client.PostAsJsonAsync("/api/v1/auth/register",
            new { email, firstName = "Mystery", lastName = "Giver", password = ApiFactory.AdminPassword });
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await LoginAsync(client, email, ApiFactory.AdminPassword));

        var add = await client.PostAsJsonAsync("/api/v1/cart/surprise-boxes", new
        {
            recipient = "girlfriend",
            budget = 50,
            vibes = new[] { "cute", "elegant" },
            giftMessage = "For our next little adventure.",
            specialInstructions = "Please avoid bright orange.",
        });

        add.StatusCode.Should().Be(HttpStatusCode.OK);
        var cart = (await add.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json))!.Data!;
        var lines = cart.GetProperty("items").EnumerateArray().ToList();
        lines.Should().ContainSingle();
        var line = lines.Single();
        line.GetProperty("productSlug").GetString().Should().Be("surprise-gift-box-50");
        line.GetProperty("giftBoxKey").GetString().Should().StartWith("SUR-");
        line.GetProperty("unitPrice").GetDecimal().Should().Be(50m);
        line.GetProperty("giftMessage").GetString().Should().Be("For our next little adventure.");
        line.GetProperty("surpriseRecipient").GetString().Should().Be("girlfriend");
        line.GetProperty("surpriseVibes").EnumerateArray().Select(value => value.GetString())
            .Should().BeEquivalentTo(["cute", "elegant"]);
        line.GetProperty("surpriseInstructions").GetString().Should().Be("Please avoid bright orange.");
    }

    [Fact]
    public async Task Surprise_box_rejects_unsupported_budgets_and_missing_vibes()
    {
        var client = factory.CreateClient();
        var email = $"surprise-invalid-{Guid.NewGuid():N}@example.com";
        await client.PostAsJsonAsync("/api/v1/auth/register",
            new { email, firstName = "Mystery", lastName = "Check", password = ApiFactory.AdminPassword });
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await LoginAsync(client, email, ApiFactory.AdminPassword));

        var response = await client.PostAsJsonAsync("/api/v1/cart/surprise-boxes", new
        {
            recipient = "friend",
            budget = 75,
            vibes = Array.Empty<string>(),
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task A_customer_cannot_read_another_customers_order()
    {
        var alice = factory.CreateClient();
        var aliceEmail = $"alice-{Guid.NewGuid():N}@example.com";
        await alice.PostAsJsonAsync("/api/v1/auth/register",
            new { email = aliceEmail, firstName = "A", lastName = "L", password = ApiFactory.AdminPassword });
        alice.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await LoginAsync(alice, aliceEmail, ApiFactory.AdminPassword));

        await alice.PostAsJsonAsync("/api/v1/cart/items",
            new { productSlug = "atelier-charm-no-7", color = "Sage", quantity = 1 });
        var checkout = await alice.PostAsJsonAsync("/api/v1/orders/checkout",
            new { email = aliceEmail, delivery = "standard", locale = "en" });
        var number = (await checkout.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json))!
            .Data!.GetProperty("number").GetString();

        var bob = factory.CreateClient();
        var bobEmail = $"bob-{Guid.NewGuid():N}@example.com";
        await bob.PostAsJsonAsync("/api/v1/auth/register",
            new { email = bobEmail, firstName = "B", lastName = "O", password = ApiFactory.AdminPassword });
        bob.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await LoginAsync(bob, bobEmail, ApiFactory.AdminPassword));

        (await bob.GetAsync($"/api/v1/orders/{number}")).StatusCode
            .Should().Be(HttpStatusCode.NotFound);

        var admin = await AdminClientAsync();
        (await admin.GetAsync($"/api/v1/orders/{number}")).StatusCode
            .Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Checkout_with_an_empty_bag_is_refused()
    {
        var client = factory.CreateClient();
        var email = $"empty-{Guid.NewGuid():N}@example.com";
        await client.PostAsJsonAsync("/api/v1/auth/register",
            new { email, firstName = "E", lastName = "M", password = ApiFactory.AdminPassword });
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await LoginAsync(client, email, ApiFactory.AdminPassword));

        var response = await client.PostAsJsonAsync("/api/v1/orders/checkout",
            new { email, delivery = "standard", locale = "en" });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── Payments, settings, dashboard ──────────────────────────────────────

    [Fact]
    public async Task Payments_report_a_typed_503_when_a_gateway_is_not_configured()
    {
        var client = factory.CreateClient();
        var email = $"pay-{Guid.NewGuid():N}@example.com";
        await client.PostAsJsonAsync("/api/v1/auth/register",
            new { email, firstName = "P", lastName = "A", password = ApiFactory.AdminPassword });
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await LoginAsync(client, email, ApiFactory.AdminPassword));

        await client.PostAsJsonAsync("/api/v1/cart/items",
            new { productSlug = "nazar-chain-bracelet", color = "Pearl", quantity = 1 });
        var checkout = await client.PostAsJsonAsync("/api/v1/orders/checkout",
            new { email, delivery = "standard", locale = "en" });
        var number = (await checkout.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json))!
            .Data!.GetProperty("number").GetString();

        var response = await client.PostAsJsonAsync("/api/v1/payments/checkout-session",
            new { orderNumber = number, locale = "en" });

        response.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);
        var body = await response.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json);
        body!.Code.Should().Be("payments_not_configured");

        var legacyAlias = await client.PostAsJsonAsync("/api/v1/payments/stripe/checkout-session",
            new { orderNumber = number, locale = "en" });
        legacyAlias.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);
    }

    [Fact]
    public async Task Public_settings_expose_the_seeded_storefront_copy()
    {
        var client = factory.CreateClient();
        var body = await client.GetFromJsonAsync<Envelope<JsonElement>>("/api/v1/settings", Json);

        body!.Success.Should().BeTrue();
        body.Data!.GetProperty("siteName").GetString().Should().Be("MERS Tassel");
        body.Data.GetProperty("contactEmail").GetString().Should().NotBeNullOrWhiteSpace();
        body.Data.GetProperty("whatsappPhone").GetString().Should().NotBeNullOrWhiteSpace();
        body.Data.GetProperty("instagramUrl").GetString().Should().StartWith("https://");
        body.Data.GetProperty("heroImagePath").GetString().Should().StartWith("/uploads/");

        // Networks the atelier does not use are left unset, and a null member is omitted from
        // the payload rather than sent as null, so every social link is optional to the
        // storefront. Assert the shape when one is present instead of pinning a value the
        // owner edits from the settings screen.
        if (body.Data.TryGetProperty("tiktokUrl", out var tiktok) && tiktok.ValueKind is not JsonValueKind.Null)
            tiktok.GetString().Should().StartWith("https://");
    }

    [Fact]
    public async Task Dashboard_reports_real_figures_not_placeholders()
    {
        var admin = await AdminClientAsync();
        var body = await admin.GetFromJsonAsync<Envelope<JsonElement>>("/api/v1/admin/dashboard", Json);

        var d = body!.Data!;
        d.GetProperty("activeProducts").GetInt32().Should().BeGreaterThan(0);
        d.GetProperty("revenueSeries").GetArrayLength().Should().Be(7);

        // Nothing has been paid for in this fixture, so revenue is genuinely zero.
        d.GetProperty("netRevenue").GetDecimal().Should().Be(0);
        d.GetProperty("inventoryValue").GetDecimal().Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task The_last_administrator_cannot_be_demoted()
    {
        var admin = await AdminClientAsync();
        var users = await admin.GetFromJsonAsync<Envelope<JsonElement>>(
            $"/api/v1/admin/users?search={ApiFactory.AdminEmail}", Json);

        var id = users!.Data!.GetProperty("items")[0].GetProperty("id").GetString();

        var response = await admin.PatchAsJsonAsync($"/api/v1/admin/users/{id}/role", new { role = "Customer" });

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        var body = await response.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json);
        body!.Code.Should().Be("conflict");
    }

    [Fact]
    public async Task Categories_report_live_product_counts()
    {
        var client = factory.CreateClient();
        var body = await client.GetFromJsonAsync<Envelope<JsonElement>>("/api/v1/categories", Json);

        var categories = body!.Data!.EnumerateArray().ToList();
        categories.Should().HaveCount(17);
        categories.Sum(c => c.GetProperty("count").GetInt32()).Should().BeGreaterThanOrEqualTo(25);
        categories.Should().OnlyContain(c => c.GetProperty("nameTr").GetString() != null);

        var newCategories = categories
            .Where(c => c.GetProperty("sortOrder").GetInt32() >= 11)
            .ToList();
        newCategories.Should().HaveCount(6);
        newCategories.Should().OnlyContain(c => c.GetProperty("count").GetInt32() > 0);
        newCategories.Should().OnlyContain(c => c.GetProperty("image").GetString()!.StartsWith("/uploads/categories/"));
    }

    private async Task<int> StockOfAsync(string slug)
    {
        var client = factory.CreateClient();
        var body = await client.GetFromJsonAsync<Envelope<JsonElement>>($"/api/v1/products/{slug}", Json);
        return body!.Data!.GetProperty("stock").GetInt32();
    }
}

public sealed class RecordingContactEmailSender : IContactEmailSender
{
    public ConcurrentBag<(ContactMessageRequest Request, int Reference)> Deliveries { get; } = [];

    public Task SendAsync(ContactMessageRequest request, int reference, CancellationToken ct = default)
    {
        if (request.Email.StartsWith("simulate-failure-", StringComparison.Ordinal))
        {
            throw new DeliveryException(
                "email_delivery_failed",
                "The test email provider is unavailable.");
        }

        Deliveries.Add((request, reference));
        return Task.CompletedTask;
    }
}
