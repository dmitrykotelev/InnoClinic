using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ServicesDatabase.Migrations
{
    /// <inheritdoc />
    public partial class SeddData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
                columns: new[] { "Id", "Name", "ServiceCategoryId", "SpecializationId", "isActive" },
                values: new object[,]
                {
                    { 1, "Cardiologist Initial", 1, 1, true },
                    { 2, "Cardiologist Follow-up", 1, 1, true },
                    { 3, "Neurologist Initial", 1, 2, true },
                    { 4, "Surgeon Consultation", 1, 3, false },
                    { 5, "X-Ray Chest", 2, 4, true },
                    { 6, "MRI Brain", 2, 4, true },
                    { 7, "Ultrasound Abdomen", 2, 4, false },
                    { 8, "Complete Blood Count", 3, 5, true },
                    { 9, "Lipid Panel", 3, 5, true },
                    { 10, "Vitamin D", 3, 5, false }
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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "ServiceCategories",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "ServiceCategories",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "ServiceCategories",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "Specializations",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Specializations",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Specializations",
                keyColumn: "Id",
                keyValue: 3);
        }
    }
}
