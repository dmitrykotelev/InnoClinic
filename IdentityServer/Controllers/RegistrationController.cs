using IdentityServer.Helpers;
using IdentityServerDatabase.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MimeKit;
using System.ComponentModel.DataAnnotations;
using IdentityServer.Settings;

namespace IdentityServer.Controllers
{
    [Route("Registration/")]
    [ApiController]
    public class RegistrationController : Controller
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly IConfiguration _configuration;
        private readonly ILogger<RegistrationController> _logger;
        public class RegisterModel
        {
            [Required]
            [EmailAddress]
            public string Email { get; set; }
            [Required]
            public string Password { get; set; }
        }

        public RegistrationController(UserManager<AppUser> userManager, IConfiguration configuration, ILogger<RegistrationController> logger)
        {
            if (userManager != null)
                _userManager = userManager;
            if (configuration != null)
                _configuration = configuration;
            _logger = logger;
        }

        [HttpPost("reg")]
        public async Task<IActionResult> Register([FromBody] RegisterModel model)
        {
            _logger.LogInformation($"Registration start, Email - {model.Email}");
            var user = new AppUser { UserName = model.Email, Email = model.Email };
            var result = await _userManager.CreateAsync(user, model.Password);

            if (result.Succeeded)
            {
                _logger.LogInformation($"Registration Succeed, Email -{model.Email}");
                var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);

                var values = new { userId = user.Id, code = token };
                var confirmationLink = Url.Action(nameof(ConfirmEmail), "Registration", values, protocol: Request.Scheme);

                await SendGmailAsync(model.Email, confirmationLink);

                return Ok(new { Message = "User Registrated" });
            }

            _logger.LogWarning($"Registration eror - {result.Errors}");
            return BadRequest(result.Errors);
        }

        [HttpGet("ConfirmEmail")]
        public async Task<IActionResult> ConfirmEmail(string userId, string code)
        {
            _logger.LogInformation($"Confirm email started: {userId}");
            
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return NotFound();
            }

            _logger.LogInformation($"User Founded, sending mail");
            var result = await _userManager.ConfirmEmailAsync(user, code);

            if (result.Succeeded)
            {
                _logger.LogInformation($"Mail Sended");
                return Ok(new { Message = "Email confirmed successfully" });
            }

            _logger.LogWarning($"Failed to send email {result.Errors}");
            return BadRequest("Failed to confirm email.");
        }

        private async Task SendGmailAsync(string targetEmail, string message)
        {
            var emailSettings = _configuration.GetSection("EmailSettings").Get<EmailSettings>()
                                ?? new EmailSettings();

            await EmailHelper.SendGmailAsync(emailSettings, targetEmail, message);
        }
    }
}