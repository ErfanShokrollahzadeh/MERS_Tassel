using MersTassel.Application.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace MersTassel.Infrastructure.Services;

public sealed class ProductModelGenerationWorker(
    IServiceScopeFactory scopes,
    ILogger<ProductModelGenerationWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopes.CreateScope();
                await scope.ServiceProvider.GetRequiredService<IProductModelGenerationProcessor>().ProcessNextAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception ex) { logger.LogError(ex, "Unexpected model-generation worker failure"); }
            await Task.Delay(TimeSpan.FromSeconds(8), stoppingToken);
        }
    }
}
