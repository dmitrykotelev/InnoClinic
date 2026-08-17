using IdentityServer.Database;
using IdentityServer.Helpers;
using IdentityServer.IdentityServices;
using IdentityServer.Moddels;
using IdentityServer.Settings;
using IdentityServerDatabase.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Configuration;

namespace IdentityServer.Controllers
{
    [ApiController]
    [Route("Profile/Doctor")]
    public class DoctorRegistrationController : Controller
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly UserManager<AppUser> _userManager;
        private readonly ILogger<DoctorRegistrationController> _logger;
        private readonly IConfiguration _configuration;

        public DoctorRegistrationController(
            IHttpClientFactory httpClientFactory,
            UserManager<AppUser> userManager,
            ILogger<DoctorRegistrationController> logger,
            IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));
            _userManager = userManager ?? throw new ArgumentNullException(nameof(userManager));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        }

        [HttpPost("Registrate")]
        public async Task<IActionResult> Registrate([FromBody] RegisterDoctor request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            using (_logger.BeginScope("Registration of new Receptionist: {Email}", request.Email))
            {
                var user = new AppUser
                {
                    UserName = request.Email,
                    Email = request.Email,
                    PhotoId = request.PhotoId
                };

                var password = PasswordGenerator.GenerateSecurePassword();

                var createResult = await _userManager.CreateAsync(user, password);

                if (!createResult.Succeeded)
                {
                    return BadRequest(new { Errors = createResult.Errors.Select(e => e.Description) });
                }

                user = await _userManager.FindByEmailAsync(request.Email);

                _logger.LogInformation("Пользователь {Email} успешно создан. AccountId: {AccountId}", user.Email, user.Id);

                string roleName = RoleHelper.Doctor;
                var roleResult = await _userManager.AddToRoleAsync(user, roleName);

                if (!roleResult.Succeeded)
                {
                    await _userManager.DeleteAsync(user);
                    return StatusCode(500, new { Message = "Ошибка при назначении прав доступа." });
                }


                try
                {
                    request.Profile.AccountId = user.Id;

                    var client = _httpClientFactory.CreateClient("ProfilesApi");
                    var response = await client.PostAsJsonAsync("/Profile/Doctor/add", request.Profile);

                    if (!response.IsSuccessStatusCode)
                    {
                        var errorContent = await response.Content.ReadAsStringAsync();
                        _logger.LogError("Ошибка Profiles API. Статус: {StatusCode}. Ответ: {Response}", response.StatusCode, errorContent);
                        await _userManager.DeleteAsync(user);

                        return StatusCode(500, new { Message = "Не удалось создать профиль. Аккаунт удален." });
                    }

                    _logger.LogInformation("Профиль для {Email} успешно создан.", user.Email);


                    await SendGmailAsync(request.Email, password);

                    return Ok(new
                    {
                        AccountId = user.Id,
                        Message = "Доктор успешно зарегистрирован",
#if DEBUG
                        password = password
#endif
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Ошибка сети при обращении к Profiles API");

                    await _userManager.DeleteAsync(user);

                    return StatusCode(500, new { Message = "Сервис профилей недоступен." });
                }
            }
        }

        [HttpPost("/Admin/Registrate")]
        public async Task<IActionResult> Registrate([FromBody] AdminDoctorRegister request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            using (_logger.BeginScope("Registration of new Receptionist: {Email}", request.Email))
            {
                var user = new AppUser
                {
                    UserName = request.Email,
                    Email = request.Email,
                    PhotoId = request.PhotoId
                };

                var password = request.Password;

                var createResult = await _userManager.CreateAsync(user, password);

                if (!createResult.Succeeded)
                {
                    return BadRequest(new { Errors = createResult.Errors.Select(e => e.Description) });
                }

                user = await _userManager.FindByEmailAsync(request.Email);

                _logger.LogInformation("Пользователь {Email} успешно создан. AccountId: {AccountId}", user.Email, user.Id);

                string roleName = RoleHelper.Doctor;
                var roleResult = await _userManager.AddToRoleAsync(user, roleName);

                if (!roleResult.Succeeded)
                {
                    await _userManager.DeleteAsync(user);
                    return StatusCode(500, new { Message = "Ошибка при назначении прав доступа." });
                }


                try
                {
                    request.Profile.AccountId = user.Id;

                    var client = _httpClientFactory.CreateClient("ProfilesApi");
                    var response = await client.PostAsJsonAsync("/Profile/Doctor/add", request.Profile);

                    if (!response.IsSuccessStatusCode)
                    {
                        var errorContent = await response.Content.ReadAsStringAsync();
                        _logger.LogError("Ошибка Profiles API. Статус: {StatusCode}. Ответ: {Response}", response.StatusCode, errorContent);
                        await _userManager.DeleteAsync(user);

                        return StatusCode(500, new { Message = "Не удалось создать профиль. Аккаунт удален." });
                    }

                    _logger.LogInformation("Профиль для {Email} успешно создан.", user.Email);


                    await SendGmailAsync(request.Email, password);

                    return Ok(new
                    {
                        AccountId = user.Id,
                        Message = "Доктор успешно зарегистрирован",
#if DEBUG
                        password = password
#endif
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Ошибка сети при обращении к Profiles API");

                    await _userManager.DeleteAsync(user);

                    return StatusCode(500, new { Message = "Сервис профилей недоступен." });
                }
            }
        }


        private async Task SendGmailAsync(string targetEmail, string message)
        {
            var emailSettings = _configuration.GetSection("EmailSettings").Get<EmailSettings>()
                                ?? new EmailSettings();

            await EmailHelper.SendGmailAsync(emailSettings, targetEmail, message);
        }
    }
}