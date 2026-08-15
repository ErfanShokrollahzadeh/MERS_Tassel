using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using ValidationException = MersTassel.Application.Common.ValidationException;

namespace MersTassel.Api.Controllers;

public abstract class ApiControllerBase : ControllerBase
{
    /// <summary>
    /// Runs a FluentValidation validator and converts failures into the domain
    /// <see cref="ValidationException"/>, which the middleware renders as a 400 with
    /// camelCase field keys the client form libraries can bind directly.
    /// </summary>
    protected static async Task ValidateAsync<T>(IValidator<T> validator, T instance, CancellationToken ct)
    {
        var result = await validator.ValidateAsync(instance, ct);
        if (result.IsValid) return;

        throw new ValidationException("Please correct the highlighted fields.",
            result.Errors
                .GroupBy(e => ToCamelCase(e.PropertyName))
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray()));
    }

    private static string ToCamelCase(string name) =>
        string.IsNullOrEmpty(name) ? name : char.ToLowerInvariant(name[0]) + name[1..];
}
