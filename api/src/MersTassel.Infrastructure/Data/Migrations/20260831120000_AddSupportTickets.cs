using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using MersTassel.Infrastructure.Data;
#nullable disable
namespace MersTassel.Infrastructure.Data.Migrations;
[DbContext(typeof(AppDbContext))]
[Migration("20260831120000_AddSupportTickets")]
public partial class AddSupportTickets : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder) => migrationBuilder.Sql("""
CREATE TABLE "CannedSupportResponses" ("Id" INTEGER PRIMARY KEY AUTOINCREMENT, "Title" TEXT NOT NULL, "Body" TEXT NOT NULL, "isDelete" INTEGER NOT NULL DEFAULT 0, "DeletedAt" INTEGER NULL, "CreatedAt" INTEGER NOT NULL, "UpdatedAt" INTEGER NOT NULL);
CREATE TABLE "SupportTickets" ("Id" INTEGER PRIMARY KEY AUTOINCREMENT, "Number" TEXT NOT NULL, "Subject" TEXT NOT NULL, "Category" TEXT NOT NULL, "Priority" TEXT NOT NULL, "Status" TEXT NOT NULL, "CustomerId" TEXT NOT NULL, "OrderId" INTEGER NULL, "AssignedToId" TEXT NULL, "FirstRespondedAt" INTEGER NULL, "ResolvedAt" INTEGER NULL, "isDelete" INTEGER NOT NULL DEFAULT 0, "DeletedAt" INTEGER NULL, "CreatedAt" INTEGER NOT NULL, "UpdatedAt" INTEGER NOT NULL, FOREIGN KEY ("CustomerId") REFERENCES "AspNetUsers" ("Id") ON DELETE RESTRICT, FOREIGN KEY ("AssignedToId") REFERENCES "AspNetUsers" ("Id") ON DELETE SET NULL, FOREIGN KEY ("OrderId") REFERENCES "Orders" ("Id") ON DELETE SET NULL);
CREATE TABLE "SupportMessages" ("Id" INTEGER PRIMARY KEY AUTOINCREMENT, "TicketId" INTEGER NOT NULL, "AuthorId" TEXT NOT NULL, "Body" TEXT NOT NULL, "IsInternal" INTEGER NOT NULL, "isDelete" INTEGER NOT NULL DEFAULT 0, "DeletedAt" INTEGER NULL, "CreatedAt" INTEGER NOT NULL, "UpdatedAt" INTEGER NOT NULL, FOREIGN KEY ("TicketId") REFERENCES "SupportTickets" ("Id") ON DELETE CASCADE, FOREIGN KEY ("AuthorId") REFERENCES "AspNetUsers" ("Id") ON DELETE RESTRICT);
CREATE UNIQUE INDEX "IX_SupportTickets_Number" ON "SupportTickets" ("Number"); CREATE INDEX "IX_SupportTickets_CustomerId" ON "SupportTickets" ("CustomerId"); CREATE INDEX "IX_SupportTickets_Status_UpdatedAt" ON "SupportTickets" ("Status", "UpdatedAt"); CREATE INDEX "IX_SupportMessages_TicketId_CreatedAt" ON "SupportMessages" ("TicketId", "CreatedAt");
""");
    protected override void Down(MigrationBuilder migrationBuilder) { migrationBuilder.DropTable(name: "CannedSupportResponses"); migrationBuilder.DropTable(name: "SupportMessages"); migrationBuilder.DropTable(name: "SupportTickets"); }
}
