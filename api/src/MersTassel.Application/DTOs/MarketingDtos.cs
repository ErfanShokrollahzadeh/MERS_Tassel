namespace MersTassel.Application.DTOs;

public class MarketingDto
{
    public int TotalSessions { get; set; }
    public decimal SessionsChangePct { get; set; }
    public decimal ConversionRate { get; set; }
    public decimal ConversionChangePct { get; set; }
    public decimal Revenue { get; set; }
    public decimal RevenueChangePct { get; set; }
    public decimal AcquisitionCost { get; set; }
    public decimal RoasMultiplier { get; set; }
    public List<ChannelAttributionDto> Attribution { get; set; } = [];
    public List<FunnelStepDto> Funnel { get; set; } = [];
    public List<CohortRowDto> Cohorts { get; set; } = [];
    public List<RevenuePointDto> RevenueSeries { get; set; } = [];
}

public record ChannelAttributionDto(string Channel, int Orders, decimal Revenue, decimal SharePct);
public record FunnelStepDto(string Step, int Count);
public record CohortRowDto(string CohortWeek, int CohortSize, List<decimal> RetentionPcts);
