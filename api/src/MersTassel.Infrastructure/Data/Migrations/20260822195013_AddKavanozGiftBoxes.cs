using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MersTassel.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddKavanozGiftBoxes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GiftBoxKey",
                table: "OrderItems",
                type: "TEXT",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GiftMessage",
                table: "OrderItems",
                type: "TEXT",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PackagingNotes",
                table: "OrderItems",
                type: "TEXT",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GiftBoxKey",
                table: "CartItems",
                type: "TEXT",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GiftMessage",
                table: "CartItems",
                type: "TEXT",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PackagingNotes",
                table: "CartItems",
                type: "TEXT",
                maxLength: 500,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_GiftBoxKey",
                table: "OrderItems",
                column: "GiftBoxKey");

            migrationBuilder.CreateIndex(
                name: "IX_CartItems_GiftBoxKey",
                table: "CartItems",
                column: "GiftBoxKey");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_OrderItems_GiftBoxKey",
                table: "OrderItems");

            migrationBuilder.DropIndex(
                name: "IX_CartItems_GiftBoxKey",
                table: "CartItems");

            migrationBuilder.DropColumn(
                name: "GiftBoxKey",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "GiftMessage",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "PackagingNotes",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "GiftBoxKey",
                table: "CartItems");

            migrationBuilder.DropColumn(
                name: "GiftMessage",
                table: "CartItems");

            migrationBuilder.DropColumn(
                name: "PackagingNotes",
                table: "CartItems");
        }
    }
}
