using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MersTassel.PostgresMigrations.Migrations
{
    /// <inheritdoc />
    public partial class AddExchangeSettlementOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SettlementOrderId",
                table: "ExchangeRequests",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ExchangeRequests_SettlementOrderId",
                table: "ExchangeRequests",
                column: "SettlementOrderId");

            migrationBuilder.AddForeignKey(
                name: "FK_ExchangeRequests_Orders_SettlementOrderId",
                table: "ExchangeRequests",
                column: "SettlementOrderId",
                principalTable: "Orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ExchangeRequests_Orders_SettlementOrderId",
                table: "ExchangeRequests");

            migrationBuilder.DropIndex(
                name: "IX_ExchangeRequests_SettlementOrderId",
                table: "ExchangeRequests");

            migrationBuilder.DropColumn(
                name: "SettlementOrderId",
                table: "ExchangeRequests");
        }
    }
}
