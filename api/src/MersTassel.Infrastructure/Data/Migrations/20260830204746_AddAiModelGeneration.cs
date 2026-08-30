using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MersTassel.Infrastructure.Data.Migrations
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
                type: "TEXT",
                maxLength: 30,
                nullable: false,
                defaultValue: "floor");

            migrationBuilder.CreateTable(
                name: "ProductModelGenerationJobs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ProductId = table.Column<int>(type: "INTEGER", nullable: false),
                    VariantId = table.Column<int>(type: "INTEGER", nullable: true),
                    RequestedByUserId = table.Column<string>(type: "TEXT", maxLength: 450, nullable: false),
                    Provider = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    ProviderJobId = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    CaptureMethod = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    CapturePathsJson = table.Column<string>(type: "TEXT", nullable: false),
                    CalibrationReferenceMm = table.Column<long>(type: "INTEGER", nullable: false),
                    WidthMm = table.Column<long>(type: "INTEGER", nullable: false),
                    HeightMm = table.Column<long>(type: "INTEGER", nullable: false),
                    DepthMm = table.Column<long>(type: "INTEGER", nullable: false),
                    SupportedPlacements = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                    DefaultPlacement = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                    ProgressPercent = table.Column<int>(type: "INTEGER", nullable: false),
                    Stage = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    DraftGlbPath = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    DraftPosterPath = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    ValidationReportJson = table.Column<string>(type: "TEXT", nullable: true),
                    FailureCode = table.Column<string>(type: "TEXT", maxLength: 80, nullable: true),
                    FailureMessage = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    CaptureTokenHash = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    CaptureTokenExpiresAt = table.Column<long>(type: "INTEGER", nullable: false),
                    CaptureTokenUsedAt = table.Column<long>(type: "INTEGER", nullable: true),
                    ApprovedModelAssetId = table.Column<int>(type: "INTEGER", nullable: true),
                    ReviewedByUserId = table.Column<string>(type: "TEXT", maxLength: 450, nullable: true),
                    StartedAt = table.Column<long>(type: "INTEGER", nullable: true),
                    CompletedAt = table.Column<long>(type: "INTEGER", nullable: true),
                    ReviewedAt = table.Column<long>(type: "INTEGER", nullable: true),
                    isDelete = table.Column<bool>(type: "INTEGER", nullable: false),
                    DeletedAt = table.Column<long>(type: "INTEGER", nullable: true),
                    CreatedAt = table.Column<long>(type: "INTEGER", nullable: false),
                    UpdatedAt = table.Column<long>(type: "INTEGER", nullable: false)
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
                        name: "FK_ProductModelGenerationJobs_ProductModelAssets_ApprovedModelAssetId",
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
