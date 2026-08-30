using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MersTassel.PostgresMigrations.Migrations
{
    /// <inheritdoc />
    public partial class AddAiModelGeneration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SupportedPlacements",
                table: "ProductModelAssets",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "floor");

            migrationBuilder.CreateTable(
                name: "ProductModelGenerationJobs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProductId = table.Column<int>(type: "integer", nullable: false),
                    VariantId = table.Column<int>(type: "integer", nullable: true),
                    RequestedByUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    Provider = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ProviderJobId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CaptureMethod = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CapturePathsJson = table.Column<string>(type: "text", nullable: false),
                    CalibrationReferenceMm = table.Column<long>(type: "bigint", nullable: false),
                    WidthMm = table.Column<long>(type: "bigint", nullable: false),
                    HeightMm = table.Column<long>(type: "bigint", nullable: false),
                    DepthMm = table.Column<long>(type: "bigint", nullable: false),
                    SupportedPlacements = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    DefaultPlacement = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ProgressPercent = table.Column<int>(type: "integer", nullable: false),
                    Stage = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    DraftGlbPath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DraftPosterPath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ValidationReportJson = table.Column<string>(type: "text", nullable: true),
                    FailureCode = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    FailureMessage = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CaptureTokenHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    CaptureTokenExpiresAt = table.Column<long>(type: "bigint", nullable: false),
                    CaptureTokenUsedAt = table.Column<long>(type: "bigint", nullable: true),
                    ApprovedModelAssetId = table.Column<int>(type: "integer", nullable: true),
                    ReviewedByUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    StartedAt = table.Column<long>(type: "bigint", nullable: true),
                    CompletedAt = table.Column<long>(type: "bigint", nullable: true),
                    ReviewedAt = table.Column<long>(type: "bigint", nullable: true),
                    isDelete = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<long>(type: "bigint", nullable: true),
                    CreatedAt = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductModelGenerationJobs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductModelGenerationJobs_AspNetUsers_RequestedByUserId",
                        column: x => x.RequestedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProductModelGenerationJobs_AspNetUsers_ReviewedByUserId",
                        column: x => x.ReviewedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ProductModelGenerationJobs_ProductModelAssets_ApprovedModel~",
                        column: x => x.ApprovedModelAssetId,
                        principalTable: "ProductModelAssets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ProductModelGenerationJobs_ProductVariants_VariantId",
                        column: x => x.VariantId,
                        principalTable: "ProductVariants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ProductModelGenerationJobs_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProductModelGenerationJobs_ApprovedModelAssetId",
                table: "ProductModelGenerationJobs",
                column: "ApprovedModelAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductModelGenerationJobs_isDelete",
                table: "ProductModelGenerationJobs",
                column: "isDelete");

            migrationBuilder.CreateIndex(
                name: "IX_ProductModelGenerationJobs_ProductId_Status",
                table: "ProductModelGenerationJobs",
                columns: new[] { "ProductId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_ProductModelGenerationJobs_ProviderJobId",
                table: "ProductModelGenerationJobs",
                column: "ProviderJobId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductModelGenerationJobs_RequestedByUserId",
                table: "ProductModelGenerationJobs",
                column: "RequestedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductModelGenerationJobs_ReviewedByUserId",
                table: "ProductModelGenerationJobs",
                column: "ReviewedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductModelGenerationJobs_VariantId",
                table: "ProductModelGenerationJobs",
                column: "VariantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProductModelGenerationJobs");

            migrationBuilder.DropColumn(
                name: "SupportedPlacements",
                table: "ProductModelAssets");
        }
    }
}
