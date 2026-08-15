namespace MersTassel.Application.Common;

/// <summary>
/// Uniform response envelope. Every endpoint returns this shape so the client has exactly
/// one success/error contract to parse.
/// </summary>
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Message { get; set; }

    /// <summary>Field name to messages. Empty on success.</summary>
    public IDictionary<string, string[]>? Errors { get; set; }

    /// <summary>Stable machine-readable code (e.g. <c>payments_not_configured</c>) for error branches.</summary>
    public string? Code { get; set; }

    public static ApiResponse<T> Ok(T data, string? message = null) =>
        new() { Success = true, Data = data, Message = message };

    public static ApiResponse<T> Fail(string message, IDictionary<string, string[]>? errors = null, string? code = null) =>
        new() { Success = false, Message = message, Errors = errors, Code = code };
}

/// <summary>Non-generic helper for endpoints that return no payload.</summary>
public static class ApiResponse
{
    public static ApiResponse<object?> Ok(string? message = null) =>
        new() { Success = true, Data = null, Message = message };
}

public class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; set; } = [];
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int Total { get; set; }
    public int TotalPages => PageSize <= 0 ? 0 : (int)Math.Ceiling(Total / (double)PageSize);

    public PagedResult() { }

    public PagedResult(IReadOnlyList<T> items, int page, int pageSize, int total)
    {
        Items = items;
        Page = page;
        PageSize = pageSize;
        Total = total;
    }
}
