using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace AppointmentsApi.Services
{
    public class ResultPdfGenerator
    {
        public byte[] GenerateResultPdf(AppointmentResultDto data)
        {
            QuestPDF.Settings.License = LicenseType.Community;

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(12).FontFamily("Arial"));

                    page.Header()
                        .AlignCenter()
                        .Text("Appointment Result")
                        .SemiBold().FontSize(20).FontColor(Colors.Blue.Darken2);

                    page.Content()
                        .PaddingVertical(1, Unit.Centimetre)
                        .Column(column =>
                        {
                            column.Spacing(20);

                            column.Item().Text(text =>
                            {
                                text.Span("Date: ").SemiBold();
                                text.Span($"{data.Date:yyyy-MM-dd HH:mm}\n");

                                text.Span("Patient: ").SemiBold();
                                text.Span($"{data.PatientName}\n");

                                text.Span("Doctor: ").SemiBold();
                                text.Span($"{data.DoctorName}\n");

                                text.Span("Service: ").SemiBold();
                                text.Span($"{data.ServiceName}");
                            });

                            column.Item().Table(table =>
                            {
                                table.ColumnsDefinition(columns =>
                                {
                                    columns.RelativeColumn(1);
                                    columns.RelativeColumn(3);
                                });

                                table.Header(header =>
                                {
                                    header.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten1).PaddingBottom(5).Text("Parameter").SemiBold();
                                    header.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten1).PaddingBottom(5).Text("Details/Value").SemiBold();
                                });

                                table.Cell().PaddingVertical(5).Text("Complaints");
                                table.Cell().PaddingVertical(5).Text(data.Complaints ?? "None");

                                table.Cell().PaddingVertical(5).Text("Conclusion / Diagnosis");
                                table.Cell().PaddingVertical(5).Text(data.Conclusion ?? "Healthy");

                                table.Cell().PaddingVertical(5).Text("Recommendations");
                                table.Cell().PaddingVertical(5).Text(data.Recommendations ?? "No special recommendations");
                            });
                        });

                    page.Footer()
                        .AlignCenter()
                        .Text(x =>
                        {
                            x.Span("Page ");
                            x.CurrentPageNumber();
                            x.Span(" of ");
                            x.TotalPages();
                        });
                });
            });

            return document.GeneratePdf();
        }
    }
    public class AppointmentResultDto
    {
        public DateTime Date { get; set; }
        public string PatientName { get; set; }
        public string DoctorName { get; set; }
        public string ServiceName { get; set; }
        public string Complaints { get; set; }
        public string Conclusion { get; set; }
        public string Recommendations { get; set; }
    }
}