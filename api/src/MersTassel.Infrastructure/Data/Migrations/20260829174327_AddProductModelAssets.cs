using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MersTassel.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProductModelAssets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ProductModelAssets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ProductId = table.Column<int>(type: "INTEGER", nullable: false),
                    VariantId = table.Column<int>(type: "INTEGER", nullable: true),
                    GlbPath = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    UsdzPath = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    PosterPath = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    Alt = table.Column<string>(type: "TEXT", maxLength: 240, nullable: false),
                    Placement = table.Column<string>(type: "TEXT", maxLength: 16, nullable: false),
                    ScaleMode = table.Column<string>(type: "TEXT", maxLength: 16, nullable: false),
                    WidthMm = table.Column<long>(type: "INTEGER", nullable: false),
                    HeightMm = table.Column<long>(type: "INTEGER", nullable: false),
                    DepthMm = table.Column<long>(type: "INTEGER", nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    ValidationMessage = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    GlbBytes = table.Column<long>(type: "INTEGER", nullable: false),
                    UsdzBytes = table.Column<long>(type: "INTEGER", nullable: true),
                    isDelete = table.Column<bool>(type: "INTEGER", nullable: false),
                    DeletedAt = table.Column<long>(type: "INTEGER", nullable: true),
                    CreatedAt = table.Column<long>(type: "INTEGER", nullable: false),
                    UpdatedAt = table.Column<long>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductModelAssets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductModelAssets_ProductVariants_VariantId",
                        column: x => x.VariantId,
                        principalTable: "ProductVariants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ProductModelAssets_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProductModelAssets_isDelete",
                table: "ProductModelAssets",
                column: "isDelete");

            migrationBuilder.CreateIndex(
                name: "IX_ProductModelAssets_ProductId_VariantId_isDelete",
                table: "ProductModelAssets",
                columns: new[] { "ProductId", "VariantId", "isDelete" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductModelAssets_Status",
                table: "ProductModelAssets",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_ProductModelAssets_VariantId",
                table: "ProductModelAssets",
                column: "VariantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProductModelAssets");
        }
    }
}
