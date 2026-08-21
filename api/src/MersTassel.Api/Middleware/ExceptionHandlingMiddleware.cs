using System.Text.Json;
using MersTassel.Application.Common;

namespace MersTassel.Api.Middleware;

/// <summary>
/// Translates domain exceptions into the standard <see cref="ApiResponse{T}"/> envelope.
/// Unexpected failures return a correlation id and nothing else — stack traces and provider
/// messages stay in the server log, never in the response body.
/// </summary>
public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            if (context.Response.HasStarted)
            {
                logger.LogError(ex, "Request failed after the response had started; cannot rewrite it.");
                throw;
            }

            var (status, body) = Translate(ex, context);
            context.Response.Clear();
            context.Response.StatusCode = status;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(JsonSerializer.Serialize(body, JsonOptions));
        }
    }

    private (int Status, ApiResponse<object?> Body) Translate(Exception ex, HttpContext context)
    {
        switch (ex)
        {
            case ValidationException validation:
                logger.LogInformation("Validation failed for {Path}: {Message}", context.Request.Path, validation.Message);
                return (StatusCodes.Status400BadRequest,
                    ApiResponse<object?>.Fail(validation.Message, validation.Errors, "validation_failed"));

            case NotFoundException notFound:
                return (StatusCodes.Status404NotFound,
                    ApiResponse<object?>.Fail(notFound.Message, code: "not_found"));

            case ForbiddenException forbidden:
                return (StatusCodes.Status403Forbidden,
                    ApiResponse<object?>.Fail(forbidden.Message, code: "forbidden"));

            case ConflictException conflict:
                return (StatusCodes.Status409Conflict,
                    ApiResponse<object?>.Fail(conflict.Message, code: "conflict"));

            case NotConfiguredException notConfigured:
                logger.LogWarning("Unconfigured dependency hit at {Path}: {Code}", context.Request.Path, notConfigured.Code);
                return (StatusCodes.Status503ServiceUnavailable,
                    ApiResponse<object?>.Fail(notConfigured.Message, code: notConfigured.Code));

            case DeliveryException delivery:
                logger.LogError(delivery, "External delivery failed at {Path}: {Code}", context.Request.Path, delivery.Code);
                return (StatusCodes.Status502BadGateway,
                    ApiResponse<object?>.Fail(delivery.Message, code: delivery.Code));

            // 499 "client closed request": the caller hung up, so nobody reads this body.
            case OperationCanceledException when context.RequestAborted.IsCancellationRequested:
                return (499, ApiResponse<object?>.Fail("The request was cancelled.", code: "cancelled"));

            default:
                var correlationId = context.TraceIdentifier;
                logger.LogError(ex, "Unhandled exception on {Path} (correlation {CorrelationId})",
                    context.Request.Path, correlationId);
                return (StatusCodes.Status500InternalServerError,
                    ApiResponse<object?>.Fail(
                        $"Something went wrong. Quote reference {correlationId} if you contact support.",
                        code: "server_error"));
        }
    }
}
