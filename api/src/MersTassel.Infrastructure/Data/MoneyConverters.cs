using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace MersTassel.Infrastructure.Data;

/// <summary>
/// Stores money as integer minor units (cents).
///
/// SQLite maps <see cref="decimal"/> to TEXT, which EF will not sort or compare, and mapping
/// it to REAL would put money in a binary float. Integer cents avoids both: exact values that
/// order and aggregate correctly in SQL.
/// </summary>
public class MoneyToMinorUnitsConverter() : ValueConverter<decimal, long>(
    value => (long)Math.Round(value * 100m, MidpointRounding.AwayFromZero),
    stored => stored / 100m);

public class NullableMoneyToMinorUnitsConverter() : ValueConverter<decimal?, long?>(
    value => value == null ? null : (long)Math.Round(value.Value * 100m, MidpointRounding.AwayFromZero),
    stored => stored == null ? null : stored.Value / 100m);
