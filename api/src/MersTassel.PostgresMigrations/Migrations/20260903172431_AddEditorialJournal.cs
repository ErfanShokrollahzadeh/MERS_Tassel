using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MersTassel.PostgresMigrations.Migrations
{
    /// <inheritdoc />
    public partial class AddEditorialJournal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BlogPosts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Title = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: false),
                    TitleTr = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: true),
                    Slug = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: false),
                    Excerpt = table.Column<string>(type: "character varying(1200)", maxLength: 1200, nullable: false),
                    ExcerptTr = table.Column<string>(type: "character varying(1200)", maxLength: 1200, nullable: true),
                    Content = table.Column<string>(type: "text", nullable: false),
                    ContentTr = table.Column<string>(type: "text", nullable: true),
                    CoverImagePath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    AuthorName = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    AuthorAvatarPath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Tags = table.Column<string>(type: "character varying(600)", maxLength: 600, nullable: true),
                    ReadingTimeMinutes = table.Column<int>(type: "integer", nullable: false),
                    IsPublished = table.Column<bool>(type: "boolean", nullable: false),
                    PublishedAt = table.Column<long>(type: "bigint", nullable: false),
                    isDelete = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<long>(type: "bigint", nullable: true),
                    CreatedAt = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BlogPosts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BlogComments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PostId = table.Column<int>(type: "integer", nullable: false),
                    AuthorName = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    AuthorEmail = table.Column<string>(type: "character varying(254)", maxLength: 254, nullable: false),
                    CustomerId = table.Column<string>(type: "text", nullable: true),
                    Content = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BlogComments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BlogComments_AspNetUsers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_BlogComments_BlogPosts_PostId",
                        column: x => x.PostId,
                        principalTable: "BlogPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BlogComments_CustomerId",
                table: "BlogComments",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_BlogComments_PostId_Status_CreatedAt",
                table: "BlogComments",
                columns: new[] { "PostId", "Status", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_BlogPosts_IsPublished_PublishedAt",
                table: "BlogPosts",
                columns: new[] { "IsPublished", "PublishedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_BlogPosts_Slug",
                table: "BlogPosts",
                column: "Slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BlogComments");

            migrationBuilder.DropTable(
                name: "BlogPosts");
        }
    }
}
