using IdentityServerDatabase.Models;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MimeKit;

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
            public string Email { get; set; }
            public string Password { get; set; }
        }

        public RegistrationController(UserManager<AppUser> userManager, IConfiguration configuration)
        {
            _userManager = userManager;
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
            var email = new MimeMessage();
            string sender = _configuration["EmailSettings:SenderEmail"] ?? "a@gmail.com";
            email.From.Add(new MailboxAddress("service", sender));
            email.To.Add(new MailboxAddress("", targetEmail));
            email.Subject = "Confirmation";
            email.Body = new TextPart("html") { Text = message };

            using var smtp = new SmtpClient();

            await smtp.ConnectAsync("smtp.gmail.com", 587, SecureSocketOptions.StartTls);
            await smtp.AuthenticateAsync(_configuration["EmailSettings:SenderEmail"], _configuration["EmailSettings:Password"]);
            await smtp.SendAsync(email);
            await smtp.DisconnectAsync(true);
        }
    }
}