using IdentityServer.Helpers;
using IdentityServer.Moddels;
using IdentityServerDatabase.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using static IdentityServer.Moddels.RegisterReceptionist;

namespace IdentityServer.Controllers
{
    [ApiController]
    [Route("Profile/Receptionist/Admin")]
    public class ReceptionistController : Controller
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly UserManager<AppUser> _userManager;
        private readonly ILogger<ReceptionistController> _logger;

        public ReceptionistController(
            IHttpClientFactory httpClientFactory,
            UserManager<AppUser> userManager,
            ILogger<ReceptionistController> logger,
            RoleManager<IdentityRole> roleManager)
        {
            _httpClientFactory = httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));
            _userManager = userManager ?? throw new ArgumentNullException(nameof(userManager));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        [HttpPost("Registrate")]
        public async Task<IActionResult> Registrate([FromBody] AdminRegisterReceptionist request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            using (_logger.BeginScope("Registration of new Receptionist: {Email}", request.Email))
            {
                var user = new AppUser
                {
                    UserName = request.Email,
                    Email = request.Email
                };

                var createResult = await _userManager.CreateAsync(user, request.Password);

                if (!createResult.Succeeded)
                {
                    return BadRequest(new { Errors = createResult.Errors.Select(e => e.Description) });
                }

                _logger.LogInformation("Пользователь {Email} успешно создан. AccountId: {AccountId}", user.Email, user.Id);

                string roleName = RoleHelper.Receptionist;
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
                    var response = await client.PostAsJsonAsync("/Profile/Reception/add", request.Profile);

                    if (!response.IsSuccessStatusCode)
                    {
                        var errorContent = await response.Content.ReadAsStringAsync();
                        _logger.LogError("Ошибка Profiles API. Статус: {StatusCode}. Ответ: {Response}", response.StatusCode, errorContent);
                        await _userManager.DeleteAsync(user);

                        return StatusCode(500, new { Message = "Не удалось создать профиль. Аккаунт удален." });
                    }

                    _logger.LogInformation("Профиль для {Email} успешно создан.", user.Email);

                    return Ok(new
                    {
                        AccountId = user.Id,
                        Message = "Ресепшионист успешно зарегистрирован"
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
    }
}