using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ProfileDatabase.Migrations
{
    /// <inheritdoc />
    public partial class namefix : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Doctors",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FirstName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    LastName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    MiddleName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    DateOfBirth = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AccountId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SpecializationId = table.Column<int>(type: "int", nullable: false),
                    OfficeId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CareerStartYear = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Doctors", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Patients",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FirstName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    LastName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    MiddleName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    IsLinkedToAccount = table.Column<bool>(type: "bit", nullable: false),
                    DateOfBirth = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AccountId = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Patients", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Receptions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FirstName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MiddleName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AccountId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OfficeId = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Receptions", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Doctors",
                columns: new[] { "Id", "AccountId", "CareerStartYear", "DateOfBirth", "FirstName", "LastName", "MiddleName", "OfficeId", "SpecializationId", "Status" },
                values: new object[,]
                {
                    { 1, "", new DateTime(2015, 9, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(1985, 5, 15, 0, 0, 0, 0, DateTimeKind.Utc), "Petr", "Petrovich", "Petrov", "", 1, true },
                    { 2, "", new DateTime(2010, 8, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(1982, 8, 20, 0, 0, 0, 0, DateTimeKind.Utc), "Linda", "Davis", "Linda", "", 2, true },
                    { 3, "", new DateTime(2020, 9, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(1990, 11, 10, 0, 0, 0, 0, DateTimeKind.Utc), "Elizabeth", "Sarah", "Elizabeth", "", 3, false }
                });

            migrationBuilder.InsertData(
                table: "Patients",
                columns: new[] { "Id", "AccountId", "DateOfBirth", "FirstName", "IsLinkedToAccount", "LastName", "MiddleName" },
                values: new object[,]
                {
                    { 1, null, new DateTime(1985, 5, 15, 0, 0, 0, 0, DateTimeKind.Unspecified), "Elizabeth", true, "Sam", "Elizabeth" },
                    { 2, null, new DateTime(1992, 8, 22, 0, 0, 0, 0, DateTimeKind.Unspecified), "Linda", false, "Albert", "Van" },
                    { 3, null, new DateTime(1978, 11, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), "John", false, "Doe", null },
                    { 4, null, new DateTime(2000, 1, 10, 0, 0, 0, 0, DateTimeKind.Unspecified), "Joe", false, "Bull", "Billy" }
                });

            migrationBuilder.CreateIndex(
                name: "Doctor_Name",
                table: "Doctors",
                column: "FirstName");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Doctors");

            migrationBuilder.DropTable(
                name: "Patients");

            migrationBuilder.DropTable(
                name: "Receptions");
        }
    }
}
