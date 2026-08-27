using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MersTassel.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddWalletAndExchanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "DeliveredAt",
                table: "Orders",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "WalletCredit",
                table: "Orders",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.CreateTable(
                name: "StoreWallets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<string>(type: "TEXT", nullable: false),
                    Currency = table.Column<string>(type: "TEXT", maxLength: 3, nullable: false),
                    Balance = table.Column<long>(type: "INTEGER", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    CreatedAt = table.Column<long>(type: "INTEGER", nullable: false),
                    UpdatedAt = table.Column<long>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StoreWallets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StoreWallets_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StoreWalletTransactions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    WalletId = table.Column<int>(type: "INTEGER", nullable: false),
                    Type = table.Column<string>(type: "TEXT", maxLength: 24, nullable: false),
                    Amount = table.Column<long>(type: "INTEGER", nullable: false),
                    BalanceAfter = table.Column<long>(type: "INTEGER", nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 300, nullable: false),
                    ReferenceType = table.Column<string>(type: "TEXT", maxLength: 40, nullable: false),
                    ReferenceId = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false),
                    IdempotencyKey = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    CreatedAt = table.Column<long>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StoreWalletTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StoreWalletTransactions_StoreWallets_WalletId",
                        column: x => x.WalletId,
                        principalTable: "StoreWallets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ExchangeRequests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<string>(type: "TEXT", nullable: false),
                    OrderItemId = table.Column<int>(type: "INTEGER", nullable: false),
                    NewProductVariantId = table.Column<int>(type: "INTEGER", nullable: false),
                    OldProductValue = table.Column<long>(type: "INTEGER", nullable: false),
                    NewProductValue = table.Column<long>(type: "INTEGER", nullable: false),
                    Difference = table.Column<long>(type: "INTEGER", nullable: false),
                    WalletCredit = table.Column<long>(type: "INTEGER", nullable: false),
                    AmountDue = table.Column<long>(type: "INTEGER", nullable: false),
                    Currency = table.Column<string>(type: "TEXT", maxLength: 3, nullable: false),
                    InvoiceIntact = table.Column<bool>(type: "INTEGER", nullable: false),
                    PackagingIntact = table.Column<bool>(type: "INTEGER", nullable: false),
                    CustomerNote = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    AdminNote = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    Status = table.Column<string>(type: "TEXT", maxLength: 24, nullable: false),
                    ReviewedAt = table.Column<long>(type: "INTEGER", nullable: true),
                    WalletTransactionId = table.Column<int>(type: "INTEGER", nullable: true),
                    isDelete = table.Column<bool>(type: "INTEGER", nullable: false),
                    DeletedAt = table.Column<long>(type: "INTEGER", nullable: true),
                    CreatedAt = table.Column<long>(type: "INTEGER", nullable: false),
                    UpdatedAt = table.Column<long>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExchangeRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExchangeRequests_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ExchangeRequests_OrderItems_OrderItemId",
                        column: x => x.OrderItemId,
                        principalTable: "OrderItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ExchangeRequests_ProductVariants_NewProductVariantId",
                        column: x => x.NewProductVariantId,
                        principalTable: "ProductVariants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ExchangeRequests_StoreWalletTransactions_WalletTransactionId",
                        column: x => x.WalletTransactionId,
                        principalTable: "StoreWalletTransactions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ExchangeRequests_isDelete",
                table: "ExchangeRequests",
                column: "isDelete");

            migrationBuilder.CreateIndex(
                name: "IX_ExchangeRequests_NewProductVariantId",
                table: "ExchangeRequests",
                column: "NewProductVariantId");

            migrationBuilder.CreateIndex(
                name: "IX_ExchangeRequests_OrderItemId",
                table: "ExchangeRequests",
                column: "OrderItemId");

            migrationBuilder.CreateIndex(
                name: "IX_ExchangeRequests_Status",
                table: "ExchangeRequests",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_ExchangeRequests_UserId",
                table: "ExchangeRequests",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ExchangeRequests_WalletTransactionId",
                table: "ExchangeRequests",
                column: "WalletTransactionId");

            migrationBuilder.CreateIndex(
                name: "IX_StoreWallets_UserId_Currency",
                table: "StoreWallets",
                columns: new[] { "UserId", "Currency" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StoreWalletTransactions_IdempotencyKey",
                table: "StoreWalletTransactions",
                column: "IdempotencyKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StoreWalletTransactions_WalletId_CreatedAt",
                table: "StoreWalletTransactions",
                columns: new[] { "WalletId", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ExchangeRequests");

            migrationBuilder.DropTable(
                name: "StoreWalletTransactions");

            migrationBuilder.DropTable(
                name: "StoreWallets");

            migrationBuilder.DropColumn(
                name: "DeliveredAt",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "WalletCredit",
                table: "Orders");
        }
    }
}
