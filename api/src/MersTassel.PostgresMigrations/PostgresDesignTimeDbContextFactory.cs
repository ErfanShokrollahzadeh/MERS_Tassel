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
    public AppDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(
                "Host=localhost;Database=merstassel_design;Username=postgres;Password=postgres",
                postgres => postgres.MigrationsAssembly(typeof(PostgresDesignTimeDbContextFactory).Assembly.FullName))
            .Options;

        return new AppDbContext(options);
    }
}
