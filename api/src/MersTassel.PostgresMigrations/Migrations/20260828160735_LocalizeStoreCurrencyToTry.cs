using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MersTassel.PostgresMigrations.Migrations
{
    /// <inheritdoc />
    public partial class LocalizeStoreCurrencyToTry : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE "StoreWallets" AS target
                SET "Balance" = "Balance" + COALESCE((
                    SELECT SUM(source."Balance") FROM "StoreWallets" AS source
                    WHERE source."UserId" = target."UserId" AND source."Currency" = 'USD'
                ), 0)
                WHERE target."Currency" = 'TRY';

                UPDATE "StoreWalletTransactions"
                SET "WalletId" = (
                    SELECT target."Id" FROM "StoreWallets" AS source
                    JOIN "StoreWallets" AS target ON target."UserId" = source."UserId" AND target."Currency" = 'TRY'
                    WHERE source."Id" = "StoreWalletTransactions"."WalletId" AND source."Currency" = 'USD'
                )
                WHERE "WalletId" IN (
                    SELECT source."Id" FROM "StoreWallets" AS source
                    JOIN "StoreWallets" AS target ON target."UserId" = source."UserId" AND target."Currency" = 'TRY'
                    WHERE source."Currency" = 'USD'
                );

                DELETE FROM "StoreWallets"
                WHERE "Currency" = 'USD' AND EXISTS (
                    SELECT 1 FROM "StoreWallets" AS target
                    WHERE target."UserId" = "StoreWallets"."UserId" AND target."Currency" = 'TRY'
                );

                UPDATE "StoreWallets" SET "Currency" = 'TRY' WHERE "Currency" = 'USD';
                UPDATE "Products" SET "Currency" = 'TRY' WHERE "Currency" = 'USD';
                UPDATE "Carts" SET "Currency" = 'TRY' WHERE "Currency" = 'USD';
                UPDATE "Orders" SET "Currency" = 'TRY' WHERE "Currency" = 'USD';
                UPDATE "TradeInRequests" SET "Currency" = 'TRY' WHERE "Currency" = 'USD';
                UPDATE "ExchangeRequests" SET "Currency" = 'TRY' WHERE "Currency" = 'USD';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE "StoreWallets" AS target
                SET "Balance" = "Balance" + COALESCE((
                    SELECT SUM(source."Balance") FROM "StoreWallets" AS source
                    WHERE source."UserId" = target."UserId" AND source."Currency" = 'TRY'
                ), 0)
                WHERE target."Currency" = 'USD';

                UPDATE "StoreWalletTransactions"
                SET "WalletId" = (
                    SELECT target."Id" FROM "StoreWallets" AS source
                    JOIN "StoreWallets" AS target ON target."UserId" = source."UserId" AND target."Currency" = 'USD'
                    WHERE source."Id" = "StoreWalletTransactions"."WalletId" AND source."Currency" = 'TRY'
                )
                WHERE "WalletId" IN (
                    SELECT source."Id" FROM "StoreWallets" AS source
                    JOIN "StoreWallets" AS target ON target."UserId" = source."UserId" AND target."Currency" = 'USD'
                    WHERE source."Currency" = 'TRY'
                );

                DELETE FROM "StoreWallets"
                WHERE "Currency" = 'TRY' AND EXISTS (
                    SELECT 1 FROM "StoreWallets" AS target
                    WHERE target."UserId" = "StoreWallets"."UserId" AND target."Currency" = 'USD'
                );

                UPDATE "StoreWallets" SET "Currency" = 'USD' WHERE "Currency" = 'TRY';
                UPDATE "Products" SET "Currency" = 'USD' WHERE "Currency" = 'TRY';
                UPDATE "Carts" SET "Currency" = 'USD' WHERE "Currency" = 'TRY';
                UPDATE "Orders" SET "Currency" = 'USD' WHERE "Currency" = 'TRY';
                UPDATE "TradeInRequests" SET "Currency" = 'USD' WHERE "Currency" = 'TRY';
                UPDATE "ExchangeRequests" SET "Currency" = 'USD' WHERE "Currency" = 'TRY';
                """);
        }
    }
}
