namespace MersTassel.Application.Common;

/// <summary>Requested resource does not exist (or is soft-deleted). Surfaces as 404.</summary>
public class NotFoundException(string message) : Exception(message);

/// <summary>Request is well-formed but violates a business rule. Surfaces as 400 with field errors.</summary>
public class ValidationException : Exception
{
    public IDictionary<string, string[]> Errors { get; }

    public ValidationException(string message, IDictionary<string, string[]>? errors = null)
        : base(message)
    {
        Errors = errors ?? new Dictionary<string, string[]>();
    }

    public ValidationException(string field, string message)
        : base(message)
    {
        Errors = new Dictionary<string, string[]> { [field] = [message] };
    }
}

/// <summary>Caller is authenticated but not permitted. Surfaces as 403.</summary>
public class ForbiddenException(string message) : Exception(message);

/// <summary>Conflicting state, e.g. a slug already in use. Surfaces as 409.</summary>
public class ConflictException(string message) : Exception(message);

/// <summary>
/// A dependency the deployment has not configured (Stripe keys, for instance). Surfaces as
/// 503 with a machine-readable code so the client can explain the gap rather than retry.
/// </summary>
public class NotConfiguredException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}

/// <summary>An external provider accepted configuration but could not complete delivery.</summary>
public class DeliveryException(string code, string message, Exception? innerException = null)
    : Exception(message, innerException)
{
    public string Code { get; } = code;
}
