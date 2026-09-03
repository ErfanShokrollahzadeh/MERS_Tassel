namespace MersTassel.Domain.Common;

/// <summary>
/// Marks an entity that is never physically removed. The <see cref="IsDelete"/> flag is
/// mapped to the <c>isDelete</c> column and enforced by a global EF query filter, so
/// ordinary reads never observe deleted rows.
/// </summary>
public interface ISoftDeletable
{
    bool IsDelete { get; set; }
    DateTimeOffset? DeletedAt { get; set; }
}

public abstract class BaseEntity
{
    public int Id { get; set; }
}

/// <summary>Base for entities that carry an identity, audit stamps and soft-delete state.</summary>
public abstract class SoftDeletableEntity : BaseEntity, ISoftDeletable
{
    public bool IsDelete { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
