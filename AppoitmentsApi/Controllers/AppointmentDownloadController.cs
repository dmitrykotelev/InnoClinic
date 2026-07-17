using AppointmentsApi.Services;
using AppoitmentsDatabase;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Middleware.Repository.AppoitmentsRepository;

namespace AppointmentsApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AppointmentsController : ControllerBase
    {
        private readonly AppoitmentRepoService _appointmentRepo;
        private readonly AppoitmentResultRepoService _resultRepo;

        private readonly ResultPdfGenerator _pdfGenerator;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<AppointmentsController> _logger;

        private const string GatewayUrl = "http://gateway.inno-clinic.com";

        public AppointmentsController(
            AppoitmentRepoService appointmentRepo,
            AppoitmentResultRepoService resultRepo,
            ResultPdfGenerator pdfGenerator,
            IHttpClientFactory httpClientFactory,
            ILogger<AppointmentsController> logger)
        {
            _appointmentRepo = appointmentRepo;
            _resultRepo = resultRepo;
            _pdfGenerator = pdfGenerator;
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        [HttpGet("{id}/Result/Download")]
        public async Task<IActionResult> DownloadResultPdf(int id)
        {
            var appointment = _appointmentRepo.GetById(id);
            if (appointment == null) return NotFound("Appointment not found");

            var result =  _resultRepo.GetById(id);

            if (result == null || string.IsNullOrEmpty(result.Conclusion))
            {
                return BadRequest("Result is not ready yet.");
            }

            var client = _httpClientFactory.CreateClient();
            var authHeader = Request.Headers["Authorization"].ToString();
            if (!string.IsNullOrEmpty(authHeader))
            {
                client.DefaultRequestHeaders.Add("Authorization", authHeader);
            }

            string patientName = "Unknown Patient";
            string doctorName = "Unknown Doctor";
            string serviceName = "Unknown Service";

            try
            {
                var patientRes = await client.GetAsync($"{GatewayUrl}/api-profiles/Profile/Patient/{appointment.PatientId}");
                if (patientRes.IsSuccessStatusCode)
                {
                    var p = await patientRes.Content.ReadFromJsonAsync<ProfileDto>();
                    patientName = $"{p?.LastName} {p?.FirstName} {p?.MiddleName}".Trim();
                }

                var doctorRes = await client.GetAsync($"{GatewayUrl}/api-profiles/Profile/Doctor/{appointment.DoctorId}");
                if (doctorRes.IsSuccessStatusCode)
                {
                    var d = await doctorRes.Content.ReadFromJsonAsync<ProfileDto>();
                    doctorName = $"{d?.LastName} {d?.FirstName} {d?.MiddleName}".Trim();
                }

                var serviceRes = await client.GetAsync($"{GatewayUrl}/api-services/Services/{appointment.ServiceId}");
                if (serviceRes.IsSuccessStatusCode)
                {
                    var s = await serviceRes.Content.ReadFromJsonAsync<ServiceDto>();
                    serviceName = s?.Name ?? s?.ServiceName ?? "Unknown Service";
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, $"Ошибка при получении данных из микросервисов для приема {id}");
            }

            var resultData = new AppointmentResultDto
            {
                Date = appointment.Date.ToDateTime(appointment.Time),

                PatientName = patientName,
                DoctorName = doctorName,
                ServiceName = serviceName,

                Complaints = result.Complaints,
                Conclusion = result.Conclusion,
                Recommendations = result.Recomendations
            };

            var pdfBytes = _pdfGenerator.GenerateResultPdf(resultData);

            return File(pdfBytes, "application/pdf", $"AppointmentResult_{id}.pdf");
        }
        private class ProfileDto
        {
            public string FirstName { get; set; }
            public string LastName { get; set; }
            public string MiddleName { get; set; }
        }

        private class ServiceDto
        {
            public string Name { get; set; }
            public string ServiceName { get; set; }
        }
    }
}