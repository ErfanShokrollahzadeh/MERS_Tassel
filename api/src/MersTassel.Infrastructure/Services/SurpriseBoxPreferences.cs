using System.Text.Json;

namespace MersTassel.Infrastructure.Services;

internal sealed class SurpriseBoxPreferences
{
    public string Recipient { get; set; } = string.Empty;
    public List<string> Vibes { get; set; } = [];
    public string? SpecialInstructions { get; set; }
}

internal static class SurpriseBoxPreferenceCodec
{
    private const string Prefix = "SURPRISE:";

    public static string Serialize(string recipient, IReadOnlyList<string> vibes, string? specialInstructions) =>
        Prefix + JsonSerializer.Serialize(new SurpriseBoxPreferences
        {
            Recipient = recipient,
            Vibes = vibes.ToList(),
            SpecialInstructions = specialInstructions,
        });

    public static SurpriseBoxPreferences? Parse(string? value)
    {
        if (string.IsNullOrWhiteSpace(value) || !value.StartsWith(Prefix, StringComparison.Ordinal)) return null;

        try
        {
            return JsonSerializer.Deserialize<SurpriseBoxPreferences>(value[Prefix.Length..]);
        }
        catch (JsonException)
        {
            return null;
        }
    }
}
