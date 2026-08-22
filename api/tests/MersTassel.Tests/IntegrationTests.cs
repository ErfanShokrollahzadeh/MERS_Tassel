using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Collections.Concurrent;
using FluentAssertions;
using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using MersTassel.Infrastructure.Data;
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
    public const string AdminEmail = "admin@merstassel.local";
    public const string AdminPassword = "TestAdmin123!";

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
                ["Jwt:SigningKey"] = "integration-test-signing-key-at-least-32-bytes-long",
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

    private static async Task<string> LoginAsync(HttpClient client, string email, string password)
    {
        var response = await client.PostAsJsonAsync("/api/v1/auth/login", new { email, password });
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json);
        return body!.Data!.GetProperty("access").GetString()!;
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
        seeded.GetProperty("price").GetProperty("currency").GetString().Should().Be("USD");
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
            new { email, firstName = "Test", lastName = "Person", password = "Passw0rdy" });
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
            new { email, firstName = "Rot", lastName = "Ate", password = "Passw0rdy" });
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
            new { email, firstName = "C", lastName = "U", password = "Passw0rdy" });

        var customer = factory.CreateClient();
        customer.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await LoginAsync(customer, email, "Passw0rdy"));

        (await customer.GetAsync("/api/v1/admin/products")).StatusCode
            .Should().Be(HttpStatusCode.Forbidden);

        var admin = await AdminClientAsync();
        (await admin.GetAsync("/api/v1/admin/products")).StatusCode
            .Should().Be(HttpStatusCode.OK);
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
            { new StringContent("USD"), "Currency" },
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
            { new StringContent("USD"), "Currency" },
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
    public async Task Checkout_reserves_stock_and_cancelling_returns_it()
    {
        var client = factory.CreateClient();
        var email = $"buyer-{Guid.NewGuid():N}@example.com";
        await client.PostAsJsonAsync("/api/v1/auth/register",
            new { email, firstName = "Buy", lastName = "Er", password = "Passw0rdy" });

        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await LoginAsync(client, email, "Passw0rdy"));

        var before = await StockOfAsync("ada-layered-chain");

        await client.PostAsJsonAsync("/api/v1/cart/items",
            new { productSlug = "ada-layered-chain", color = "Silver", quantity = 2 });

        var checkout = await client.PostAsJsonAsync("/api/v1/orders/checkout",
            new { email, delivery = "standard", locale = "en" });
        checkout.StatusCode.Should().Be(HttpStatusCode.Created);

        var order = (await checkout.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json))!.Data!;
        order.GetProperty("paymentStatus").GetString().Should().Be("unpaid");
        order.GetProperty("itemCount").GetInt32().Should().Be(2);

        // Subtotal 268 clears the free-delivery threshold.
        order.GetProperty("shippingTotal").GetDecimal().Should().Be(0);
        order.GetProperty("total").GetDecimal().Should().Be(268m);

        (await StockOfAsync("ada-layered-chain")).Should().Be(before - 2);

        var admin = await AdminClientAsync();
        var id = order.GetProperty("id").GetInt32();
        await admin.PatchAsJsonAsync($"/api/v1/admin/orders/{id}/status", new { status = "cancelled" });

        (await StockOfAsync("ada-layered-chain")).Should().Be(before);
    }

    [Fact]
    public async Task Adding_more_than_available_stock_is_capped_not_oversold()
    {
        var client = factory.CreateClient();
        var email = $"greedy-{Guid.NewGuid():N}@example.com";
        await client.PostAsJsonAsync("/api/v1/auth/register",
            new { email, firstName = "G", lastName = "R", password = "Passw0rdy" });

        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await LoginAsync(client, email, "Passw0rdy"));

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
            new { email, firstName = "S", lastName = "O", password = "Passw0rdy" });

        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await LoginAsync(client, email, "Passw0rdy"));

        // Haliç is seeded with zero stock.
        var response = await client.PostAsJsonAsync("/api/v1/cart/items",
            new { productSlug = "halic-crystal-pendant", color = "Smoky quartz", quantity = 1 });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task A_customer_cannot_read_another_customers_order()
    {
        var alice = factory.CreateClient();
        var aliceEmail = $"alice-{Guid.NewGuid():N}@example.com";
        await alice.PostAsJsonAsync("/api/v1/auth/register",
            new { email = aliceEmail, firstName = "A", lastName = "L", password = "Passw0rdy" });
        alice.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await LoginAsync(alice, aliceEmail, "Passw0rdy"));

        await alice.PostAsJsonAsync("/api/v1/cart/items",
            new { productSlug = "atelier-charm-no-7", color = "Sage", quantity = 1 });
        var checkout = await alice.PostAsJsonAsync("/api/v1/orders/checkout",
            new { email = aliceEmail, delivery = "standard", locale = "en" });
        var number = (await checkout.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json))!
            .Data!.GetProperty("number").GetString();

        var bob = factory.CreateClient();
        var bobEmail = $"bob-{Guid.NewGuid():N}@example.com";
        await bob.PostAsJsonAsync("/api/v1/auth/register",
            new { email = bobEmail, firstName = "B", lastName = "O", password = "Passw0rdy" });
        bob.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await LoginAsync(bob, bobEmail, "Passw0rdy"));

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
            new { email, firstName = "E", lastName = "M", password = "Passw0rdy" });
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await LoginAsync(client, email, "Passw0rdy"));

        var response = await client.PostAsJsonAsync("/api/v1/orders/checkout",
            new { email, delivery = "standard", locale = "en" });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── Payments, settings, dashboard ──────────────────────────────────────

    [Fact]
    public async Task Payments_report_a_typed_503_when_stripe_is_not_configured()
    {
        var client = factory.CreateClient();
        var email = $"pay-{Guid.NewGuid():N}@example.com";
        await client.PostAsJsonAsync("/api/v1/auth/register",
            new { email, firstName = "P", lastName = "A", password = "Passw0rdy" });
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await LoginAsync(client, email, "Passw0rdy"));

        await client.PostAsJsonAsync("/api/v1/cart/items",
            new { productSlug = "nazar-chain-bracelet", color = "Pearl", quantity = 1 });
        var checkout = await client.PostAsJsonAsync("/api/v1/orders/checkout",
            new { email, delivery = "standard", locale = "en" });
        var number = (await checkout.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json))!
            .Data!.GetProperty("number").GetString();

        var response = await client.PostAsJsonAsync("/api/v1/payments/stripe/checkout-session",
            new { orderNumber = number, locale = "en" });

        response.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);
        var body = await response.Content.ReadFromJsonAsync<Envelope<JsonElement>>(Json);
        body!.Code.Should().Be("payments_not_configured");
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
