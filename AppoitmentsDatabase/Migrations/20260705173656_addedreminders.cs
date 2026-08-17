using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AppoitmentsDatabase.Migrations
{
    /// <inheritdoc />
    public partial class addedreminders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsReminded",
                table: "Appoitments",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsReminded",
                table: "Appoitments");
        }
    }
}
