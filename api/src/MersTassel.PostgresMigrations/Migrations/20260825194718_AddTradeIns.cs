using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MersTassel.PostgresMigrations.Migrations
{
    /// <inheritdoc />
    public partial class AddTradeIns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "TradeInCredit",
                table: "Orders",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.CreateTable(
                name: "TradeInRequests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "text", nullable: true),
                    CartId = table.Column<int>(type: "integer", nullable: true),
                    OrderId = table.Column<int>(type: "integer", nullable: true),
                    Category = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    BrandModel = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Condition = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    ImagePath = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: false),
                    TargetProductSlug = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    TargetProductName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    TargetProductPrice = table.Column<long>(type: "bigint", nullable: true),
                    EstimatedCredit = table.Column<long>(type: "bigint", nullable: false),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    HandoffMethod = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    Status = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    AdminNote = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    isDelete = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<long>(type: "bigint", nullable: true),
                    CreatedAt = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TradeInRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TradeInRequests_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_TradeInRequests_Carts_CartId",
                        column: x => x.CartId,
                        principalTable: "Carts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_TradeInRequests_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TradeInRequests_CartId",
                table: "TradeInRequests",
                column: "CartId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TradeInRequests_CreatedAt",
                table: "TradeInRequests",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_TradeInRequests_isDelete",
                table: "TradeInRequests",
                column: "isDelete");

            migrationBuilder.CreateIndex(
                name: "IX_TradeInRequests_OrderId",
                table: "TradeInRequests",
                column: "OrderId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TradeInRequests_Status",
                table: "TradeInRequests",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_TradeInRequests_UserId",
                table: "TradeInRequests",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TradeInRequests");

            migrationBuilder.DropColumn(
                name: "TradeInCredit",
                table: "Orders");
        }
    }
}
