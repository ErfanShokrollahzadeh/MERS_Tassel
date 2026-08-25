using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MersTassel.Infrastructure.Data.Migrations
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
                type: "INTEGER",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.CreateTable(
                name: "TradeInRequests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<string>(type: "TEXT", nullable: true),
                    CartId = table.Column<int>(type: "INTEGER", nullable: true),
                    OrderId = table.Column<int>(type: "INTEGER", nullable: true),
                    Category = table.Column<string>(type: "TEXT", maxLength: 40, nullable: false),
                    BrandModel = table.Column<string>(type: "TEXT", maxLength: 160, nullable: false),
                    Condition = table.Column<string>(type: "TEXT", maxLength: 16, nullable: false),
                    ImagePath = table.Column<string>(type: "TEXT", maxLength: 400, nullable: false),
                    TargetProductSlug = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    TargetProductName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    TargetProductPrice = table.Column<long>(type: "INTEGER", nullable: true),
                    EstimatedCredit = table.Column<long>(type: "INTEGER", nullable: false),
                    Currency = table.Column<string>(type: "TEXT", maxLength: 3, nullable: false),
                    HandoffMethod = table.Column<string>(type: "TEXT", maxLength: 16, nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 24, nullable: false),
                    AdminNote = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    isDelete = table.Column<bool>(type: "INTEGER", nullable: false),
                    DeletedAt = table.Column<long>(type: "INTEGER", nullable: true),
                    CreatedAt = table.Column<long>(type: "INTEGER", nullable: false),
                    UpdatedAt = table.Column<long>(type: "INTEGER", nullable: false)
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
