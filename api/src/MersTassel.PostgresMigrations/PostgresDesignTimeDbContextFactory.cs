using MersTassel.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace MersTassel.PostgresMigrations;

/// <summary>
/// Used only by dotnet-ef. Runtime configuration remains in Infrastructure and obtains its
/// real credentials from Docker secrets.
/// </summary>
public sealed class PostgresDesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    /// <summary>
    /// Set this to reach a real database. `dotnet ef migrations add` only builds the model and
    /// never opens the connection, so the default below carries no password — a literal one
    /// here is a credential in the repository for no benefit, and secret scanners rightly
    /// flag it. Commands that do connect (`database update`, scripting against a live schema)
    /// take the full connection string from the environment instead.
    /// </summary>
    public const string ConnectionVariable = "POSTGRES_DESIGN_CONNECTION";

    public AppDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable(ConnectionVariable)
            ?? "Host=localhost;Database=merstassel_design;Username=postgres";

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(
                connectionString,
                postgres => postgres.MigrationsAssembly(typeof(PostgresDesignTimeDbContextFactory).Assembly.FullName))
            .Options;

        return new AppDbContext(options);
    }
}
