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

        public class RegisterModel
        {
            [Required]
            [EmailAddress]
            public string Email { get; set; }
            [Required]
            public string Password { get; set; }
        }

        public RegistrationController(UserManager<AppUser> userManager, IConfiguration configuration)
        {
            if (userManager != null)
                _userManager = userManager;
            if (configuration != null)
                _configuration = configuration;
        }

        [HttpPost("reg")]
        public async Task<IActionResult> Register([FromBody] RegisterModel model)
        {
            var user = new AppUser { UserName = model.Email, Email = model.Email };
            var result = await _userManager.CreateAsync(user, model.Password);

            if (result.Succeeded)
            {
                var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);

                var values = new { userId = user.Id, code = token };
                var confirmationLink = Url.Action(nameof(ConfirmEmail), "Registration", values, protocol: Request.Scheme);

                await SendGmailAsync(model.Email, confirmationLink);

                return Ok(new { Message = "User Registrated" });
            }

            return BadRequest(result.Errors);
        }

        [HttpGet("ConfirmEmail")]
        public async Task<IActionResult> ConfirmEmail(string userId, string code)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return NotFound();
            }
            var result = await _userManager.ConfirmEmailAsync(user, code);

            if (result.Succeeded)
            {
                return Ok(new { Message = "Email confirmed successfully" });
            }

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