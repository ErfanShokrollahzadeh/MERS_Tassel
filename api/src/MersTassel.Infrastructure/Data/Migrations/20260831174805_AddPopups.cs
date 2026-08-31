using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MersTassel.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPopups : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Popups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 160, nullable: false),
                    Type = table.Column<int>(type: "INTEGER", nullable: false),
                    Placement = table.Column<int>(type: "INTEGER", nullable: false),
                    TriggerType = table.Column<int>(type: "INTEGER", nullable: false),
                    TriggerValue = table.Column<int>(type: "INTEGER", nullable: false),
                    TargetAudience = table.Column<int>(type: "INTEGER", nullable: false),
                    TargetPages = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    DeviceTarget = table.Column<string>(type: "TEXT", maxLength: 16, nullable: false),
                    CooldownDays = table.Column<int>(type: "INTEGER", nullable: false),
                    Priority = table.Column<int>(type: "INTEGER", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    StartsAt = table.Column<long>(type: "INTEGER", nullable: true),
                    ExpiresAt = table.Column<long>(type: "INTEGER", nullable: true),
                    Badge = table.Column<string>(type: "TEXT", maxLength: 80, nullable: true),
                    BadgeTr = table.Column<string>(type: "TEXT", maxLength: 80, nullable: true),
                    Title = table.Column<string>(type: "TEXT", maxLength: 240, nullable: false),
                    TitleTr = table.Column<string>(type: "TEXT", maxLength: 240, nullable: true),
                    Description = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    DescriptionTr = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    ImagePath = table.Column<string>(type: "TEXT", maxLength: 400, nullable: true),
                    PrimaryCtaText = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    PrimaryCtaTextTr = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    PrimaryCtaUrl = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    SecondaryCtaText = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    SecondaryCtaTextTr = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    CouponCode = table.Column<string>(type: "TEXT", maxLength: 80, nullable: true),
                    ImpressionCount = table.Column<long>(type: "INTEGER", nullable: false),
                    ClickCount = table.Column<long>(type: "INTEGER", nullable: false),
                    ConversionCount = table.Column<long>(type: "INTEGER", nullable: false),
                    isDelete = table.Column<bool>(type: "INTEGER", nullable: false),
                    DeletedAt = table.Column<long>(type: "INTEGER", nullable: true),
                    CreatedAt = table.Column<long>(type: "INTEGER", nullable: false),
                    UpdatedAt = table.Column<long>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Popups", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Popups_ExpiresAt",
                table: "Popups",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_Popups_IsActive",
                table: "Popups",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_Popups_isDelete",
                table: "Popups",
                column: "isDelete");

            migrationBuilder.CreateIndex(
                name: "IX_Popups_Priority",
                table: "Popups",
                column: "Priority");

            migrationBuilder.CreateIndex(
                name: "IX_Popups_StartsAt",
                table: "Popups",
                column: "StartsAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Popups");
        }
    }
}
