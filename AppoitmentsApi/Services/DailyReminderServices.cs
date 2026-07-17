using Hangfire;
using MailKit.Net.Smtp;
using MailKit.Security;
using Middleware.Mapper.ServicesDto;
using Middleware.Mapper.ProfileDto;
using Middleware.Repository.AppoitmentsRepository;
using MimeKit;

public interface IDailyReminderService
{
    Task ProcessTomorrowRemindersAsync();
}

public class DailyReminderService : IDailyReminderService
{
    private const string GatewayUrl = "http://gateway.inno-clinic.com";
    private class EmailSettings
    {
        public string SenderEmail { get; set; } = "a@gmail.com";
        public string Password { get; set; } = string.Empty;
        public string SmtpServer { get; set; } = "smtp.gmail.com";
        public int Port { get; set; } = 587;
    };
    private EmailSettings _settings = new EmailSettings();

    private readonly AppoitmentRepoService _repo;
    private readonly ILogger<DailyReminderService> _logger;
    private readonly IHttpClientFactory _httpClientFactory;
    public DailyReminderService(AppoitmentRepoService repo, ILogger<DailyReminderService> logger, IHttpClientFactory httpClientFactory)
    {
        _repo = repo ?? throw new ArgumentNullException(nameof(repo));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _httpClientFactory = httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));
    }

    public async Task ProcessTomorrowRemindersAsync()
    {
        _logger.LogInformation("Начинаем сбор данных для ежедневной рассылки...");

        var tomorrow = DateOnly.FromDateTime(DateTime.UtcNow.Date.AddDays(1));

        var appointments = _repo.GetRemindAppointments(tomorrow);

        if (!appointments.Any()) return;

        var client = _httpClientFactory.CreateClient();

        foreach (var app in appointments)
        {
            try
            {
                var patientRes = await client.GetAsync($"{GatewayUrl}/api-profiles/Profile/Patient/{app.PatientId}");
                if (!patientRes.IsSuccessStatusCode) throw new Exception("Patient profile not found.");
                var patient = await patientRes.Content.ReadFromJsonAsync<PatientDto>();

                if (string.IsNullOrEmpty(patient.AccountId)) throw new Exception("Patient has no linked Identity account.");

                var emailRes = await client.GetAsync($"{GatewayUrl}/api-identity/Profile/GetEmail?userId={patient.AccountId}");
                if (!emailRes.IsSuccessStatusCode) throw new Exception("Patient email not found in Identity.");
                var patientEmail = await emailRes.Content.ReadAsStringAsync();
                patientEmail = patientEmail.Trim('"');

                var doctorRes = await client.GetAsync($"{GatewayUrl}/api-profiles/Profile/Doctor/{app.DoctorId}");
                var doctor = doctorRes.IsSuccessStatusCode
                    ? await doctorRes.Content.ReadFromJsonAsync<DoctorDto>()
                    : new DoctorDto { FirstName = "Unknown", LastName = "Doctor" };

                var serviceRes = await client.GetAsync($"{GatewayUrl}/api-services/Services/{app.ServiceId}");
                var service = serviceRes.IsSuccessStatusCode
                    ? await serviceRes.Content.ReadFromJsonAsync<ServiceDto>()
                    : new ServiceDto { Name = "Medical Service" };


                var patientName = $"{patient.FirstName} {patient.LastName}";
                var doctorName = $"{doctor.FirstName} {doctor.LastName}";
                var dateStr = app.Date.ToString("yyyy-MM-dd");
                var timeStr = app.Time.ToString(@"hh\:mm");

                var subject = "Напоминание о приеме в Inno Clinic";
                var body = $@"
                    <h3>Здравствуйте, {patientName}!</h3>
                    <p>Напоминаем, что у вас запланирован прием на завтра:</p>
                    <ul>
                        <li><b>Дата:</b> {dateStr}</li>
                        <li><b>Время:</b> {timeStr}</li>
                        <li><b>Услуга:</b> {service.Name ?? service.Name}</li>
                        <li><b>Врач:</b> {doctorName}</li>
                    </ul>
                    <p>Пожалуйста, приходите за 10 минут до начала.</p>";

                await SendGmailAsync(_settings, patientEmail, body);

                app.IsReminded = true;

                _repo.Update(app);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Не удалось отправить напоминание для приема {app.Id}");
            }
        }

        _logger.LogInformation("Ежедневная рассылка завершена.");
    }

    private async Task SendGmailAsync(EmailSettings settings, string targetEmail, string message)
    {
        var email = new MimeMessage();

        email.From.Add(new MailboxAddress("service", settings.SenderEmail));
        email.To.Add(new MailboxAddress("", targetEmail));
        email.Subject = "Confirmation";
        email.Body = new TextPart("html") { Text = message };

        using var smtp = new SmtpClient();

        await smtp.ConnectAsync(settings.SmtpServer, settings.Port, SecureSocketOptions.StartTls);
        await smtp.AuthenticateAsync(settings.SenderEmail, settings.Password);

        await smtp.SendAsync(email);
        await smtp.DisconnectAsync(true);
    }

    
}