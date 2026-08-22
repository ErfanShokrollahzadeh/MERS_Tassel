using MersTassel.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MersTassel.Infrastructure.Data.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260817190000_AddSocialContactSettings")]
public sealed class AddSocialContactSettings : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "TiktokUrl",
            table: "SiteSettings",
            type: "TEXT",
            maxLength: 300,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "WhatsappPhone",
            table: "SiteSettings",
            type: "TEXT",
            maxLength: 60,
            nullable: true);

        migrationBuilder.Sql("UPDATE SiteSettings SET WhatsappPhone = ContactPhone WHERE WhatsappPhone IS NULL AND ContactPhone <> '';");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "TiktokUrl", table: "SiteSettings");
        migrationBuilder.DropColumn(name: "WhatsappPhone", table: "SiteSettings");
    }
}
