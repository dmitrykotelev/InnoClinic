using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ServicesDatabase.Migrations
{
    /// <inheritdoc />
    public partial class addedprices : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ServiceCategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TimeSlotSize = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServiceCategories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Services",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ServiceCategoryId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Price = table.Column<float>(type: "real", nullable: false),
                    SpecializationId = table.Column<int>(type: "int", nullable: false),
                    isActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Services", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Specializations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    isActiove = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Specializations", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "ServiceCategories",
                columns: new[] { "Id", "Name", "TimeSlotSize" },
                values: new object[,]
                {
                    { 1, "Consultation", 30 },
                    { 2, "Diagnostics", 60 },
                    { 3, "Analyses", 45 }
                });

            migrationBuilder.InsertData(
                table: "Services",
                columns: new[] { "Id", "Name", "Price", "ServiceCategoryId", "SpecializationId", "isActive" },
                values: new object[,]
                {
                    { 1, "Cardiologist Initial", 0f, 1, 1, true },
                    { 2, "Cardiologist Follow-up", 0f, 1, 1, true },
                    { 3, "Neurologist Initial", 0f, 1, 2, true },
                    { 4, "Surgeon Consultation", 0f, 1, 3, false },
                    { 5, "X-Ray Chest", 0f, 2, 4, true },
                    { 6, "MRI Brain", 0f, 2, 4, true },
                    { 7, "Ultrasound Abdomen", 0f, 2, 4, false },
                    { 8, "Complete Blood Count", 0f, 3, 5, true },
                    { 9, "Lipid Panel", 0f, 3, 5, true },
                    { 10, "Vitamin D", 0f, 3, 5, false }
                });

            migrationBuilder.InsertData(
                table: "Specializations",
                columns: new[] { "Id", "Name", "isActiove" },
                values: new object[,]
                {
                    { 1, "General Therapy", true },
                    { 2, "Cardiology", true },
                    { 3, "Dentistry", true }
                });

            migrationBuilder.CreateIndex(
                name: "Service_Name",
                table: "Services",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "Specialization_Name",
                table: "Specializations",
                column: "Name");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ServiceCategories");

            migrationBuilder.DropTable(
                name: "Services");

            migrationBuilder.DropTable(
                name: "Specializations");
        }
    }
}
