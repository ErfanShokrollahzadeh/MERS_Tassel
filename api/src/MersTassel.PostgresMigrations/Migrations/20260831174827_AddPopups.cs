using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MersTassel.PostgresMigrations.Migrations
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
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Placement = table.Column<int>(type: "integer", nullable: false),
                    TriggerType = table.Column<int>(type: "integer", nullable: false),
                    TriggerValue = table.Column<int>(type: "integer", nullable: false),
                    TargetAudience = table.Column<int>(type: "integer", nullable: false),
                    TargetPages = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    DeviceTarget = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    CooldownDays = table.Column<int>(type: "integer", nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    StartsAt = table.Column<long>(type: "bigint", nullable: true),
                    ExpiresAt = table.Column<long>(type: "bigint", nullable: true),
                    Badge = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    BadgeTr = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    Title = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: false),
                    TitleTr = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: true),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    DescriptionTr = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    ImagePath = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: true),
                    PrimaryCtaText = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    PrimaryCtaTextTr = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    PrimaryCtaUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    SecondaryCtaText = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    SecondaryCtaTextTr = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CouponCode = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    ImpressionCount = table.Column<long>(type: "bigint", nullable: false),
                    ClickCount = table.Column<long>(type: "bigint", nullable: false),
                    ConversionCount = table.Column<long>(type: "bigint", nullable: false),
                    isDelete = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<long>(type: "bigint", nullable: true),
                    CreatedAt = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<long>(type: "bigint", nullable: false)
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
